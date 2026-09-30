/**
 * Reusable PostgreSQL connection pool.
 *
 * Single pool for the whole app; all queries go through parameterized
 * statements (no string-concatenated SQL). The pool's 'error' handler keeps
 * the process alive if an idle client drops, and every query failure is
 * surfaced to the central error middleware, never the client.
 */
import pg from 'pg';
import { DATABASE_URL } from '../env.js';

export const pool = new pg.Pool({
  connectionString: DATABASE_URL,
  max: 10,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 5_000,
});

pool.on('error', (err) => {
  // Idle-client errors cannot be routed to a request; log only the message.
  console.error('[db] idle client error:', err.message);
});

/** Cheap connectivity check used at boot and by `npm run db:check`. */
export async function pingDatabase() {
  await pool.query('SELECT 1');
}

export async function closePool() {
  await pool.end();
}