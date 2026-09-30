/**
 * Reproducible database setup CLI.
 *
 *   npm run db:init            - apply schema.sql (idempotent)
 *   npm run db:init -- --test  - target the test database instead (for CI/tests)
 *
 * A fresh database can be brought up in one command — no manual table
 * creation. Sample lead seeding was removed in Stage 5: a lead must belong to
 * a user, so the database starts empty until the first account registers.
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import pg from 'pg';
import { DATABASE_URL } from '../env.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SCHEMA_SQL = readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');

function testUrl() {
  return process.env.DATABASE_URL_TEST ?? 'postgresql://localhost:5432/leadtrack_test';
}

/** Apply schema.sql to the given pool/client. */
export async function applySchema(client) {
  await client.query(SCHEMA_SQL);
}

async function main() {
  const cliArgs = process.argv.slice(2);
  const useTest = cliArgs.includes('--test');

  const connectionString = useTest ? testUrl() : DATABASE_URL;
  const pool = new pg.Pool({
    connectionString,
    max: 1,
    connectionTimeoutMillis: 5_000,
  });

  try {
    await applySchema(pool);
    console.log(`[db] schema applied to ${connectionString}`);
  } catch (err) {
    console.error(`[db] initialization failed: ${err.message}`);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

// Run only when invoked directly (not when imported by tests).
if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  main();
}