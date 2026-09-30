import { apiRequest } from './api.js';

/**
 * GET /api/dashboard/stats — aggregated in PostgreSQL for the authenticated
 * user only. The backend returns the object directly.
 */
export function fetchDashboardStats({ signal } = {}) {
  return apiRequest('/dashboard/stats', { signal });
}