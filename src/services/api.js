/**
 * Thin fetch wrapper around the LeadTrack API.
 *
 * The base URL comes from VITE_API_URL (see .env.example); it defaults to the
 * local backend so the app works out of the box in development.
 *
 * Every request automatically attaches `Authorization: Bearer <token>` when a
 * token exists in localStorage, so callers never hand it around manually.
 */
export const API_BASE = (
  import.meta.env.VITE_API_URL ?? 'http://localhost:4001/api'
).replace(/\/+$/, '');

/** localStorage key holding the JWT. Owned here to avoid import cycles. */
export const TOKEN_STORAGE_KEY = 'leadtrack_token';

/** Broadcast when a protected request comes back 401 (invalid/expired token). */
export const UNAUTHORIZED_EVENT = 'leadtrack:unauthorized';

/**
 * Perform an API request and normalise failures to thrown Errors carrying
 * `status` and (from the backend) `details` for field-level validation.
 *
 * A 401 from a protected endpoint (anything except the auth routes, where a
 * 401 is a normal failed login) is broadcast globally so the AuthProvider can
 * clear the stale session and redirect to /login.
 */
export async function apiRequest(route, { method = 'GET', body, token, headers = {}, signal } = {}) {
  const options = { method, headers: { ...headers }, signal };
  const bearer = token ?? localStorage.getItem(TOKEN_STORAGE_KEY);
  if (bearer) options.headers.Authorization = `Bearer ${bearer}`;
  if (body !== undefined) {
    options.headers['Content-Type'] = 'application/json';
    options.body = typeof body === 'string' ? body : JSON.stringify(body);
  }

  const response = await fetch(`${API_BASE}${route}`, options);
  const contentType = response.headers.get('content-type') ?? '';
  const data = contentType.includes('application/json') ? await response.json() : null;

  if (!response.ok) {
    if (response.status === 401 && !route.startsWith('/auth')) {
      window.dispatchEvent(new CustomEvent(UNAUTHORIZED_EVENT));
    }
    const error = new Error(data?.error ?? `Request failed with status ${response.status}`);
    error.status = response.status;
    error.details = data?.details;
    throw error;
  }
  return data;
}