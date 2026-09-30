import { ApiError } from '../lib/validate.js';
import { verifyToken } from '../lib/jwt.js';

/**
 * Authentication middleware for protected routes.
 *
 * - Reads `Authorization: Bearer <token>`
 * - Verifies the JWT and pulls the user id from its `sub` claim
 * - Attaches `req.user = { id }` for downstream controllers
 *
 * The authenticated identity ALWAYS comes from the verified token — payloads
 * that try to supply a user_id/query/body are ignored by design.
 */
export function authenticate(req, _res, next) {
  const header = req.get('authorization') ?? '';
  const match = /^Bearer\s+(\S+)$/i.exec(header.trim());

  if (!match) {
    return next(new ApiError(401, 'Authentication required'));
  }

  try {
    const payload = verifyToken(match[1]);
    if (!payload.sub) {
      throw new Error('missing subject');
    }
    req.user = { id: payload.sub };
    return next();
  } catch {
    return next(new ApiError(401, 'Invalid or expired token'));
  }
}