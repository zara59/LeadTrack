/**
 * Environment configuration.
 *
 * Loads backend/.env via dotenv and exposes the few values the app actually
 * reads. CLIENT_ORIGIN is a comma-separated allowlist — never "*".
 */
import 'dotenv/config';

const DEFAULT_CLIENT_ORIGINS = 'http://localhost:5173,http://localhost:5174';

export const NODE_ENV = process.env.NODE_ENV ?? 'development';
export const PORT = Number(process.env.PORT) || 4001;

/**
 * PostgreSQL connection string. Override per environment — do not commit real
 * credentials. Local Postgres.app uses trust auth, so the default URL has no
 * password (pg falls back to the OS user, which is the Postgres superuser).
 */
export const DATABASE_URL =
  process.env.DATABASE_URL ?? 'postgresql://localhost:5432/leadtrack';

/**
 * JWT signing secret. Must come from the environment (see .env.example) —
 * never hard-coded or committed. The server refuses to boot without it.
 */
export const JWT_SECRET = process.env.JWT_SECRET ?? '';

/** How long an issued token is valid for. */
export const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN ?? '7d';

export const CLIENT_ORIGINS = (process.env.CLIENT_ORIGIN || DEFAULT_CLIENT_ORIGINS)
  .split(',')
  .map((origin) => origin.trim().replace(/\/$/, ''))
  .filter(Boolean);