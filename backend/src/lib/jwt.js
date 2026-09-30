import jwt from 'jsonwebtoken';
import { JWT_EXPIRES_IN, JWT_SECRET } from '../env.js';

/**
 * JWT helpers. The token's subject (`sub`) is the authenticated user's id —
 * that is the only identity the backend ever trusts on protected routes.
 */
export function signToken(userId) {
  return jwt.sign({ sub: userId }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

/**
 * Verify and decode a token. Throws (jsonwebtoken) on malformed or expired
 * tokens; the auth middleware converts that into a clean 401.
 */
export function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET);
}