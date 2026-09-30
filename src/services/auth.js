import { apiRequest } from './api.js';

/** POST /api/auth/register — resolves to { user, token } on success. */
export function registerAccount({ name, email, password }) {
  return apiRequest('/auth/register', { method: 'POST', body: { name, email, password } });
}

/** POST /api/auth/login — resolves to { user, token } on success. */
export function loginAccount({ email, password }) {
  return apiRequest('/auth/login', { method: 'POST', body: { email, password } });
}

/** GET /api/auth/me — resolves to { user } when the token is still valid. */
export function fetchCurrentUser(token) {
  return apiRequest('/auth/me', { token });
}