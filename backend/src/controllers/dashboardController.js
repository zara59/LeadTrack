import * as repo from '../db/leads.repo.js';

/**
 * GET /api/dashboard/stats
 * Aggregated in PostgreSQL, scoped to the authenticated user's own leads.
 */
export async function dashboardStats(req, res) {
  res.json(await repo.dashboardStats(req.user.id));
}