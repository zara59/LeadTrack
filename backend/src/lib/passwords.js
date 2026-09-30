/**
 * Password hashing via bcryptjs (pure JS, no native build).
 *
 * Plaintext passwords and hash values must never be logged or returned; they
 * only ever flow from bcrypt into PostgreSQL and back to bcrypt for compare.
 */
import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 12;

export function hashPassword(plaintext) {
  return bcrypt.hash(plaintext, SALT_ROUNDS);
}

export function verifyPassword(plaintext, storedHash) {
  return bcrypt.compare(plaintext, storedHash);
}