import { createApp } from './app.js';
import { JWT_SECRET, NODE_ENV, PORT } from './env.js';
import { pingDatabase, closePool } from './db/pool.js';

async function start() {
  if (!JWT_SECRET) {
    console.error('[auth] JWT_SECRET is not set.');
    console.error('[auth] Add a value to JWT_SECRET in backend/.env (see .env.example) —');
    console.error('[auth] generate one with: openssl rand -hex 32');
    process.exit(1);
  }

  try {
    await pingDatabase();
  } catch (err) {
    console.error(`[db] Cannot reach PostgreSQL: ${err.message}`);
    console.error('[db] Check DATABASE_URL in backend/.env and that PostgreSQL is running.');
    process.exit(1);
  }

  const app = createApp();

  const server = app.listen(PORT, () => {
    console.log(`LeadTrack API listening on http://localhost:${PORT} (${NODE_ENV})`);
    console.log('Database: connected to PostgreSQL');
    console.log(`Health check:   GET http://localhost:${PORT}/api/health`);
    console.log(`CORS allowlist: ${process.env.CLIENT_ORIGIN || 'http://localhost:5173,http://localhost:5174'}`);
  });

  // Graceful shutdown: stop accepting, close the pool, then exit.
  for (const signal of ['SIGINT', 'SIGTERM']) {
    process.on(signal, async () => {
      console.log(`\n[api] ${signal} received, shutting down…`);
      server.close();
      try {
        await closePool();
      } finally {
        process.exit(0);
      }
    });
  }
}

start();