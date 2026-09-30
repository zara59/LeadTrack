/**
 * `npm run db:check` — verify the configured PostgreSQL connection.
 * Prints a one-line result and exits non-zero on failure.
 */
import { pingDatabase, closePool } from './pool.js';

try {
  await pingDatabase();
  console.log('[db] PostgreSQL connection OK');
  process.exitCode = 0;
} catch (err) {
  console.error(`[db] PostgreSQL connection FAILED: ${err.message}`);
  process.exitCode = 1;
} finally {
  await closePool();
}