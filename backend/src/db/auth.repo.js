/**
 * Parameterized PostgreSQL queries for the users table.
 *
 * The password_hash never leaves this module — rowToUser deliberately drops
 * it so API responses can only ever carry safe user fields.
 */
import { pool } from './pool.js';

/** Safe, serialisable user object. Never includes password_hash. */
export function rowToUser(row) {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    createdAt:
      row.created_at instanceof Date ? row.created_at.toISOString() : row.created_at,
    updatedAt:
      row.updated_at instanceof Date ? row.updated_at.toISOString() : row.updated_at,
  };
}

/** Internal row that still carries password_hash (repo-local only). */
function rowWithHash(row) {
  return { ...row, passwordHash: row.password_hash };
}

/**
 * Create a user. id is rendered from the users_id_seq sequence (US-<digits>);
 * timestamps default in the database. Accepts an already-hashed password.
 */
export async function createUser({ name, email, passwordHash }) {
  const { rows } = await pool.query(
    `WITH seq AS (SELECT nextval('users_id_seq') AS n)
     INSERT INTO users (id, name, email, password_hash)
     SELECT 'US-' || seq.n, $1, $2, $3
     FROM seq
     RETURNING *`,
    [name, email, passwordHash],
  );
  return rows.length ? rowToUser(rows[0]) : null;
}

/** Find by normalized (lowercase) email. Returns passwordHash too. */
export async function findUserByEmail(email) {
  const { rows } = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
  return rows.length ? rowWithHash(rows[0]) : null;
}

/** Find by id — used by the auth middleware /auth/me. Safe fields only. */
export async function findUserById(id) {
  const { rows } = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
  return rows.length ? rowToUser(rows[0]) : null;
}