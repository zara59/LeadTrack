import { ApiError } from '../lib/validate.js';
import { postgresErrorToApiError } from '../db/errors.js';

/** Simple dev request logger: skip/don't expose bodies or secrets. */
export function requestLogger(req, res, next) {
  const startedAt = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - startedAt;
    console.log(`[api] ${req.method} ${req.originalUrl} -> ${res.statusCode} (${duration}ms)`);
  });
  next();
}

/** Unknown route / method -> JSON 404. */
export function notFoundHandler(req, res, next) {
  next(new ApiError(404, 'Not found'));
}

/**
 * Central error handler. Normalises every failure into consistent JSON.
 * Internal details (stack traces, SQL, connection info) are logged
 * server-side only — never sent to the client.
 */
export function errorHandler(err, req, res, _next) {
  // Malformed JSON body from the express.json() parser.
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({ error: 'Invalid JSON body' });
  }

  if (err instanceof ApiError) {
    return res.status(err.status).json(err.toJSON());
  }

  // Body too large (express.json default limit).
  if (err && err.type === 'entity.too.large') {
    return res.status(413).json({ error: 'Request body too large' });
  }

  // PostgreSQL driver errors — convert to clean, generic JSON.
  const pgError = postgresErrorToApiError(err);
  if (pgError) {
    return res.status(pgError.status).json(pgError.toJSON());
  }

  console.error('[api] Unhandled error:', err);
  return res.status(500).json({ error: 'Internal server error' });
}