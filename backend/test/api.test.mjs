/**
 * API test suite — LeadTrack Stage 5 (authentication + user ownership).
 *
 * Uses a dedicated test database (leadtrack_test). Each run:
 *   1. applies schema.sql and resets users/leads + their id sequences
 *   2. boots its own server on a dedicated port with a throwaway JWT_SECRET
 *   3. exercises auth (register/login/me), protected routes, ownership and
 *      cross-user isolation (user A can never read or mutate user B's data)
 *   4. proves users/leads survive a server RESTART (persistence + stateless JWT)
 *
 * Run with: npm test   (from backend/)
 */
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { readFileSync } from 'node:fs';
import pg from 'pg';
import jwt from 'jsonwebtoken';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SERVER = path.join(__dirname, '..', 'src', 'server.js');
const SCHEMA_SQL = readFileSync(path.join(__dirname, '..', 'src', 'db', 'schema.sql'), 'utf8');

const TEST_DB = process.env.TEST_DATABASE_URL ?? 'postgresql://localhost:5432/leadtrack_test';
const JWT_SECRET = 'test-secret-with-enough-entropy-for-tests';
const PORT_A = Number(process.env.TEST_PORT_A || 4198);
const PORT_B = Number(process.env.TEST_PORT_B || 4199);

const results = [];
const check = (name, pass, detail = '') => {
  results.push({ name, pass });
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail ? `  — ${detail}` : ''}`);
};

async function request(port, method, route, { token, body, headers = {} } = {}) {
  const options = { method, headers: { ...headers } };
  if (token) options.headers.Authorization = `Bearer ${token}`;
  if (body !== undefined) {
    options.headers['Content-Type'] = 'application/json';
    options.body = typeof body === 'string' ? body : JSON.stringify(body);
  }
  const response = await fetch(`http://localhost:${port}${route}`, options);
  const text = await response.text();
  let data = null;
  try {
    data = JSON.parse(text);
  } catch {
    data = text;
  }
  return { status: response.status, headers: response.headers, data };
}

function spawnServer(port) {
  return spawn('node', [SERVER], {
    env: {
      ...process.env,
      PORT: String(port),
      NODE_ENV: 'test',
      DATABASE_URL: TEST_DB,
      JWT_SECRET,
      CLIENT_ORIGIN: 'http://localhost:5173,http://localhost:5174',
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
}

let childOutput = '';
function attachLogs(child) {
  child.stdout.on('data', (c) => (childOutput += c));
  child.stderr.on('data', (c) => (childOutput += c));
}

async function waitForServer(port, timeoutMs = 10_000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(`http://localhost:${port}/api/health`);
      if (res.ok) return true;
    } catch {
      /* not up yet */
    }
    await new Promise((resolve) => setTimeout(resolve, 150));
  }
  return false;
}

function stopServer(child) {
  return new Promise((resolve) => {
    if (child.exitCode !== null) return resolve();
    child.kill('SIGTERM');
    const timeout = setTimeout(() => {
      child.kill('SIGKILL');
      resolve();
    }, 4000);
    child.on('exit', () => {
      clearTimeout(timeout);
      resolve();
    });
  });
}

const leadKeys = ['id', 'name', 'company', 'email', 'phone', 'source', 'status', 'notes', 'createdAt', 'updatedAt'];
const userKeys = ['id', 'name', 'email', 'createdAt', 'updatedAt'];

const fixtureLead = (overrides = {}) => ({
  name: 'Test Lead',
  company: 'Fixture Co',
  email: 'fixture@test.dev',
  phone: '+1 (555) 200-1000',
  source: 'website',
  status: 'new',
  notes: 'created by the automated suite',
  ...overrides,
});

const NO_SECRET_RE = /password|passwd|hash|\$2[aby]\$/i;

async function main() {
  // --- 0. Prepare the test database ---
  const admin = new pg.Pool({ connectionString: TEST_DB, max: 1 });
  await admin.query(SCHEMA_SQL);
  await admin.query('TRUNCATE TABLE users, leads RESTART IDENTITY CASCADE');
  // Both id conventions are rendered manually (LT-<digits>, US-<digits>), so
  // TRUNCATE cannot reset the sequences; prime them deterministically.
  await admin.query("SELECT setval('users_id_seq', 1000, true)");
  await admin.query("SELECT setval('leads_id_seq', 1040, true)");
  await admin.end();

  // --- Boot the first server ---
  const serverA = spawnServer(PORT_A);
  attachLogs(serverA);
  const upA = await waitForServer(PORT_A);
  check('server boots with PostgreSQL and /api/health responds', upA);
  if (!upA) {
    console.error('Server A did not start — aborted. Server log:\n' + childOutput);
    process.exit(1);
  }

  const A = { name: 'Alice Test', email: 'alice@stage5.test', password: 'alice-secret-123' };
  const B = { name: 'Bob Other', email: 'bob@stage5.test', password: 'bob-secret-123' };

  // ---- 1. Health (public) ----
  {
    const res = await request(PORT_A, 'GET', '/api/health');
    check('GET /api/health -> 200 {"status":"ok"}', res.status === 200 && res.data?.status === 'ok', JSON.stringify(res.data));
  }

  // ---- 2. Register ----
  let alice = null;
  let bob = null;
  {
    const res = await request(PORT_A, 'POST', '/api/auth/register', { body: A });
    alice = res.data;
    check(
      'register Alice -> 201, safe user fields + token',
      res.status === 201 &&
        res.data?.user?.id === 'US-1001' &&
        userKeys.every((k) => k in (res.data?.user ?? {})) &&
        typeof res.data?.token === 'string' &&
        res.data.token.split('.').length === 3,
      JSON.stringify(res.data?.user),
    );
    check('register response leaks no password/hash anywhere', !NO_SECRET_RE.test(JSON.stringify(res.data)), '');

    const bobRes = await request(PORT_A, 'POST', '/api/auth/register', { body: B });
    bob = bobRes.data;
    check('register Bob -> 201, id US-1002 (sequence-driven)', bobRes.status === 201 && bobRes.data?.user?.id === 'US-1002', String(bobRes.data?.user?.id));

    const dup = await request(PORT_A, 'POST', '/api/auth/register', { body: { ...A, name: 'Alice Dupe' } });
    check('duplicate email -> 409 "An account with this email already exists"', dup.status === 409 && dup.data?.error === 'An account with this email already exists', JSON.stringify(dup.data));

    const shortPassword = await request(PORT_A, 'POST', '/api/auth/register', { body: { ...A, name: 'Alice 2', password: 'short' } });
    check('register short password -> 400 mentioning password', shortPassword.status === 400 && /password/i.test(JSON.stringify(shortPassword.data)), JSON.stringify(shortPassword.data));

    const longPassword = await request(PORT_A, 'POST', '/api/auth/register', { body: { ...A, name: 'Alice 3', password: 'x'.repeat(200) } });
    check('register >128 char password -> 400', longPassword.status === 400, '');

    const badEmail = await request(PORT_A, 'POST', '/api/auth/register', { body: { ...A, name: 'Alice 4', email: 'not-an-email' } });
    check('register invalid email -> 400 mentioning email', badEmail.status === 400 && /email/i.test(JSON.stringify(badEmail.data)), JSON.stringify(badEmail.data));

    const shortName = await request(PORT_A, 'POST', '/api/auth/register', { body: { ...A, email: 'alice5@stage5.test', name: 'A' } });
    check('register 1-char name -> 400 mentioning name', shortName.status === 400 && /name/i.test(JSON.stringify(shortName.data)), JSON.stringify(shortName.data));

    const nonObject = await request(PORT_A, 'POST', '/api/auth/register', { body: [1, 2, 3] });
    check('register non-object body -> 400', nonObject.status === 400 && nonObject.data?.error === 'Request body must be a JSON object.', JSON.stringify(nonObject.data));
  }

  // ---- 3. Register token auto-logs the user in ----
  {
    const me = await request(PORT_A, 'GET', '/api/auth/me', { token: alice?.token });
    check('register token works on /api/auth/me', me.status === 200 && me.data?.user?.id === 'US-1001', JSON.stringify(me.data?.user));
  }

  // ---- 4. Login ----
  {
    const ok = await request(PORT_A, 'POST', '/api/auth/login', { body: { email: A.email, password: A.password } });
    check('login -> 200 {user, token}', ok.status === 200 && ok.data?.user?.id === 'US-1001' && typeof ok.data?.token === 'string', '');
    check('login response leaks no password/hash anywhere', !NO_SECRET_RE.test(JSON.stringify(ok.data)), '');

    const wrong = await request(PORT_A, 'POST', '/api/auth/login', { body: { email: A.email, password: 'wrong-password-1' } });
    check('login wrong password -> 401 generic', wrong.status === 401 && wrong.data?.error === 'Invalid email or password', JSON.stringify(wrong.data));

    const unknown = await request(PORT_A, 'POST', '/api/auth/login', { body: { email: 'ghost@stage5.test', password: 'whatever-pass-1' } });
    check('login unknown email -> 401 with identical message (no enumeration)', unknown.status === 401 && unknown.data?.error === 'Invalid email or password' && unknown.data?.error === wrong.data?.error, JSON.stringify(unknown.data));

    const missing = await request(PORT_A, 'POST', '/api/auth/login', { body: { email: A.email } });
    check('login missing password -> 400', missing.status === 400, JSON.stringify(missing.data));
  }

  // ---- 5. /api/auth/me protection ----
  {
    const none = await request(PORT_A, 'GET', '/api/auth/me');
    check('GET /api/auth/me without token -> 401', none.status === 401, '');

    const garbage = await request(PORT_A, 'GET', '/api/auth/me', { token: 'not.a.jwt' });
    check('GET /api/auth/me garbage token -> 401', garbage.status === 401);

    const wrongSecret = jwt.sign({ sub: 'US-1001' }, 'a-completely-different-secret');
    const forged = await request(PORT_A, 'GET', '/api/auth/me', { token: wrongSecret });
    check('token signed with wrong secret -> 401', forged.status === 401);

    const expired = jwt.sign({ sub: 'US-1001' }, JWT_SECRET, { expiresIn: -60 });
    const expiredRes = await request(PORT_A, 'GET', '/api/auth/me', { token: expired });
    check('expired token -> 401', expiredRes.status === 401);
  }

  // ---- 6. Protected route basics ----
  {
    for (const [label, route] of [['/api/leads', '/api/leads'], ['/api/dashboard/stats', '/api/dashboard/stats']]) {
      const none = await request(PORT_A, 'GET', route);
      check(`GET ${label} without token -> 401`, none.status === 401 && none.data?.error === 'Authentication required', JSON.stringify(none.data));

      const badHeader = await request(PORT_A, 'GET', route, { headers: { Authorization: 'Basic Zm9vOmJhcg==' } });
      check(`GET ${label} non-Bearer auth -> 401`, badHeader.status === 401);

      const forged = await request(PORT_A, 'GET', route, { token: jwt.sign({ sub: 'US-1' }, 'wrong-secret-zzz') });
      check(`GET ${label} forged token -> 401`, forged.status === 401);
    }
  }

  // ---- 7. Alice creates leads (spoofed ids/ownership ignored) ----
  const aliceCreated = [];
  let aliceLeadId;
  {
    const res = await request(PORT_A, 'POST', '/api/leads', {
      token: alice.token,
      body: fixtureLead({ name: 'Alpha One', email: 'alpha@stage5.test', user_id: 'US-9999', id: 'LT-FAKE' }),
    });
    aliceLeadId = res.data?.lead?.id;
    check('POST lead (spoofed user_id/id) -> 201, server-assigned id LT-1041', res.status === 201 && aliceLeadId === 'LT-1041' && leadKeys.every((k) => k in (res.data?.lead ?? {})), JSON.stringify(res.data?.lead));
    check('lead response leaks no password/hash', !NO_SECRET_RE.test(JSON.stringify(res.data)), '');
    aliceCreated.push(res.data.lead);
  }
  await request(PORT_A, 'POST', '/api/leads', { token: alice.token, body: fixtureLead({ name: 'Beta Won', company: 'Win Co', status: 'won', source: 'linkedin', email: 'beta@stage5.test' }) });
  await request(PORT_A, 'POST', '/api/leads', { token: alice.token, body: fixtureLead({ name: 'Gamma Won', status: 'won', source: 'referral', email: 'gamma@stage5.test' }) });
  await request(PORT_A, 'POST', '/api/leads', { token: alice.token, body: fixtureLead({ name: 'Delta New', status: 'new', email: 'delta@stage5.test' }) });
  const epsilon = await request(PORT_A, 'POST', '/api/leads', { token: alice.token, body: fixtureLead({ name: 'Epsilon Qualified', status: 'qualified', source: 'upwork', email: 'epsilon@stage5.test' }) });
  const epsilonId = epsilon.data?.lead?.id;

  // ---- 8. List + filters (scoped to Alice) ----
  {
    const all = await request(PORT_A, 'GET', '/api/leads', { token: alice.token });
    check('GET /api/leads -> 5 for Alice', all.status === 200 && all.data.leads.length === 5, JSON.stringify(all.data?.leads?.length));

    const won = await request(PORT_A, 'GET', '/api/leads?status=won', { token: alice.token });
    check('filter status=won -> 2', won.status === 200 && won.data.leads.length === 2 && won.data.leads.every((l) => l.status === 'won'));

    const src = await request(PORT_A, 'GET', '/api/leads?source=linkedin', { token: alice.token });
    check('filter source=linkedin -> 1', src.status === 200 && src.data.leads.length === 1);

    const search = await request(PORT_A, 'GET', '/api/leads?search=gamma', { token: alice.token });
    check('search gamma -> 1', search.status === 200 && search.data.leads.length === 1 && search.data.leads[0].name === 'Gamma Won');

    const combined = await request(PORT_A, 'GET', '/api/leads?status=new&source=website', { token: alice.token });
    check('combined status+source filter', combined.status === 200 && combined.data.leads.length === 2);

    const wildcard = await request(PORT_A, 'GET', '/api/leads?search=%25', { token: alice.token });
    check('search respects LIKE wildcards', wildcard.status === 200 && wildcard.data.leads.length === 0);

    const bad = await request(PORT_A, 'GET', '/api/leads?status=hype', { token: alice.token });
    check('invalid filter -> 400', bad.status === 400 && typeof bad.data?.error === 'string');
  }

  // ---- 9. GET/PATCH/DELETE Alice's own leads ----
  {
    const got = await request(PORT_A, 'GET', `/api/leads/${aliceLeadId}`, { token: alice.token });
    check('GET own lead -> 200', got.status === 200 && got.data.lead.id === aliceLeadId && got.data.lead.name === 'Alpha One');

    const patch = await request(PORT_A, 'PATCH', `/api/leads/${aliceLeadId}`, { token: alice.token, body: { status: 'qualified', notes: 'Stage 5 patch' } });
    check('PATCH own lead -> 200, updatedAt bumped', patch.status === 200 && patch.data.lead.status === 'qualified' && patch.data.lead.notes === 'Stage 5 patch' && Date.parse(patch.data.lead.updatedAt) > Date.parse(patch.data.lead.createdAt));

    const empty = await request(PORT_A, 'PATCH', `/api/leads/${aliceLeadId}`, { token: alice.token, body: {} });
    check('PATCH empty body -> 400', empty.status === 400);

    const bad = await request(PORT_A, 'PATCH', `/api/leads/${aliceLeadId}`, { token: alice.token, body: { status: 'mystery' } });
    check('PATCH unsupported status -> 400', bad.status === 400);

    const missing = await request(PORT_A, 'PATCH', '/api/leads/LT-999999', { token: alice.token, body: { status: 'new' } });
    check('PATCH nonexistent id -> 404', missing.status === 404 && missing.data?.error === 'Lead not found');

    const malformed = await request(PORT_A, 'PATCH', '/api/leads/abc', { token: alice.token, body: { status: 'new' } });
    check('PATCH malformed id -> 400', malformed.status === 400);

    const deleted = await request(PORT_A, 'DELETE', `/api/leads/${epsilonId}`, { token: alice.token });
    check('DELETE own lead -> 200', deleted.status === 200 && deleted.data?.id === epsilonId);
    const again = await request(PORT_A, 'DELETE', `/api/leads/${epsilonId}`, { token: alice.token });
    check('DELETE same lead again -> 404', again.status === 404);

    const gone = await request(PORT_A, 'GET', `/api/leads/${epsilonId}`, { token: alice.token });
    check('GET deleted lead -> 404', gone.status === 404);
  }

  // ---- 10. Dashboard reflects Alice's data only ----
  {
    const s1 = (await request(PORT_A, 'GET', '/api/dashboard/stats', { token: alice.token })).data ?? {};
    // 5 - 1 deleted = 4: 2 won, 1 new, 1 qualified (Alpha patched to qualified) -> won 2/4 = 50
    check(
      'dashboard (Alice): total 4, won 2, qualified 1, new 1, conversion 50',
      s1.totalLeads === 4 && s1.wonLeads === 2 && s1.qualifiedLeads === 1 && s1.newLeads === 1 && s1.lostLeads === 0 && s1.contactedLeads === 0 && s1.conversionRate === 50,
      JSON.stringify(s1),
    );
  }

  // ---- 11. Cross-user isolation: Bob cannot touch Alice's data ----
  {
    const bList = await request(PORT_A, 'GET', '/api/leads', { token: bob.token });
    check('Bob lists 0 leads (Alice scoped out)', bList.status === 200 && bList.data.leads.length === 0);

    const bSearch = await request(PORT_A, 'GET', '/api/leads?search=gamma', { token: bob.token });
    check('Bob search cannot see Alice leads', bSearch.status === 200 && bSearch.data.leads.length === 0);

    const bStats = await request(PORT_A, 'GET', '/api/dashboard/stats', { token: bob.token });
    const bs = bStats.data ?? {};
    check('Bob dashboard all zeros', bStats.status === 200 && bs.totalLeads === 0 && bs.conversionRate === 0, JSON.stringify(bs));

    const hidden = await request(PORT_A, 'GET', `/api/leads/${aliceLeadId}`, { token: bob.token });
    check('Bob GET Alice lead -> 404 (existence hidden)', hidden.status === 404 && hidden.data?.error === 'Lead not found');

    const hijackPatch = await request(PORT_A, 'PATCH', `/api/leads/${aliceLeadId}`, { token: bob.token, body: { name: 'Hijacked', status: 'won' } });
    check('Bob PATCH Alice lead -> 404', hijackPatch.status === 404);

    const aliceAfter = await request(PORT_A, 'GET', `/api/leads/${aliceLeadId}`, { token: alice.token });
    check('Alice lead unchanged after Bob PATCH attempt', aliceAfter.status === 200 && aliceAfter.data.lead.name === 'Alpha One' && aliceAfter.data.lead.status === 'qualified');

    const hijackDel = await request(PORT_A, 'DELETE', `/api/leads/${aliceLeadId}`, { token: bob.token });
    check('Bob DELETE Alice lead -> 404', hijackDel.status === 404);

    const aliceStillThere = await request(PORT_A, 'GET', `/api/leads/${aliceLeadId}`, { token: alice.token });
    check('Alice lead survives Bob DELETE attempt', aliceStillThere.status === 200);
  }

  // ---- 12. Bob creates his own lead; both scopes stay separate ----
  let bobLeadId;
  {
    const create = await request(PORT_A, 'POST', '/api/leads', {
      token: bob.token,
      body: fixtureLead({ name: 'Bob Own Lead', email: 'bob-lead@stage5.test', status: 'won', source: 'social_media' }),
    });
    bobLeadId = create.data?.lead?.id;
    check('Bob creates own lead -> 201', create.status === 201 && /^LT-\d+$/.test(bobLeadId ?? ''));

    const bStats = (await request(PORT_A, 'GET', '/api/dashboard/stats', { token: bob.token })).data ?? {};
    check('Bob dashboard reflects only his lead', bStats.totalLeads === 1 && bStats.wonLeads === 1 && bStats.conversionRate === 100, JSON.stringify(bStats));

    const aStats = (await request(PORT_A, 'GET', '/api/dashboard/stats', { token: alice.token })).data ?? {};
    check('Alice dashboard unaffected by Bob', aStats.totalLeads === 4 && aStats.wonLeads === 2);

    const aList = await request(PORT_A, 'GET', '/api/leads', { token: alice.token });
    check('Alice still sees only her 4 leads', aList.data.leads.length === 4);
  }

  // ---- 13. Malformed JSON + unknown route + CORS ----
  {
    const malformed = await request(PORT_A, 'POST', '/api/auth/login', { token: alice.token, body: '{ this is not json' });
    check('malformed JSON -> 400 Invalid JSON body', malformed.status === 400 && malformed.data?.error === 'Invalid JSON body', JSON.stringify(malformed.data));

    const unknown = await request(PORT_A, 'GET', '/api/does-not-exist');
    check('unknown route (unauthenticated) -> 404', unknown.status === 404 && unknown.data?.error === 'Not found');

    const allowed = await request(PORT_A, 'GET', '/api/leads', { token: alice.token, headers: { Origin: 'http://localhost:5174' } });
    check('allowed origin -> ACAO echoes origin', allowed.headers.get('access-control-allow-origin') === 'http://localhost:5174');

    const denied = await request(PORT_A, 'GET', '/api/leads', { token: alice.token, headers: { Origin: 'http://evil.example' } });
    check('disallowed origin -> no ACAO header', denied.headers.get('access-control-allow-origin') === null);
  }

  // ---- 14. PERSISTENCE TEST: restart the server; users, leads and the JWT survive ----
  let persistedId;
  {
    const res = await request(PORT_A, 'POST', '/api/leads', {
      token: alice.token,
      body: fixtureLead({ name: 'Persisted Lead', email: 'persist@stage5.test', status: 'new', source: 'other', notes: 'must survive a restart' }),
    });
    persistedId = res.data?.lead?.id;
    check('persistence: lead created before restart', res.status === 201 && persistedId, JSON.stringify(res.data?.lead));
  }

  await stopServer(serverA);
  check('persistence: server A stopped cleanly', serverA.exitCode === 0, `exit=${serverA.exitCode}`);

  const serverB = spawnServer(PORT_B);
  attachLogs(serverB);
  const upB = await waitForServer(PORT_B);
  check('persistence: server B boots against the same database', upB);

  if (upB) {
    // Stateless JWT: the token issued pre-restart must verify post-restart.
    const me = await request(PORT_B, 'GET', '/api/auth/me', { token: alice.token });
    check('persistence: token still valid after restart (user intact)', me.status === 200 && me.data?.user?.id === 'US-1001');

    const dupLogin = await request(PORT_B, 'POST', '/api/auth/login', { body: { email: A.email, password: A.password } });
    check('persistence: login still works after restart', dupLogin.status === 200 && dupLogin.data?.user?.id === 'US-1001');

    const got = await request(PORT_B, 'GET', `/api/leads/${persistedId}`, { token: alice.token });
    check('persistence: lead still exists after restart', got.status === 200 && got.data.lead.name === 'Persisted Lead');

    const patched = await request(PORT_B, 'PATCH', `/api/leads/${persistedId}`, { token: alice.token, body: { status: 'contacted' } });
    check('persistence: edit after restart -> 200', patched.status === 200 && patched.data.lead.status === 'contacted');

    const del = await request(PORT_B, 'DELETE', `/api/leads/${persistedId}`, { token: alice.token });
    check('persistence: delete after restart -> 200', del.status === 200);

    const gone = await request(PORT_B, 'GET', `/api/leads/${persistedId}`, { token: alice.token });
    check('persistence: deleted lead gone after restart', gone.status === 404);
  }

  await stopServer(serverB);

  const passed = results.filter((r) => r.pass).length;
  console.log(`\nRESULT: ${passed}/${results.length} checks passed`);
  process.exit(passed === results.length ? 0 : 1);
}

process.exitCode = 1;
main().catch(async (err) => {
  console.error('TEST SUITE ERROR:', err);
  process.exit(2);
});