/**
 * Lead API service — the only seam between the UI and lead data.
 *
 * Every function talks to the Express/PostgreSQL backend; the JWT is attached
 * automatically by api.js. Ownership (user_id) is handled server-side and is
 * never sent from the client.
 */
import { apiRequest } from './api.js';
import { PIPELINE_OUTCOMES, PIPELINE_STAGES } from '../data/constants.js';

/** GET /api/leads — optional search/status/source filters, server-side. */
export function fetchLeads({ search = '', status = '', source = '', signal } = {}) {
  const params = new URLSearchParams();
  if (search) params.set('search', search);
  if (status) params.set('status', status);
  if (source) params.set('source', source);
  const query = params.toString();
  return apiRequest(`/leads${query ? `?${query}` : ''}`, { signal }).then(
    (data) => data.leads,
  );
}

/** GET /api/leads/:id */
export function fetchLead(id, { signal } = {}) {
  return apiRequest(`/leads/${id}`, { signal }).then((data) => data.lead);
}

/** POST /api/leads — creates and returns the persisted lead. */
export function createLead(values) {
  return apiRequest('/leads', { method: 'POST', body: values }).then(
    (data) => data.lead,
  );
}

/** PATCH /api/leads/:id — merges the patch and returns the updated lead. */
export function updateLead(id, patch) {
  return apiRequest(`/leads/${id}`, { method: 'PATCH', body: patch }).then(
    (data) => data.lead,
  );
}

/** DELETE /api/leads/:id */
export function deleteLead(id) {
  return apiRequest(`/leads/${id}`, { method: 'DELETE' });
}

/* ---------------------------------------------------------------------------
   Pure aggregation helpers (dashboard). Operate on real API-loaded lead rows;
   in Stage 6 nothing here is ever fed fake data.
--------------------------------------------------------------------------- */

function countByStatus(leads) {
  return leads.reduce(
    (counts, lead) => {
      counts[lead.status] = (counts[lead.status] ?? 0) + 1;
      return counts;
    },
    {},
  );
}

/** Pipeline funnel counts (New -> Contacted -> Qualified, then Won/Lost). */
export function buildPipeline(leads) {
  const counts = countByStatus(leads);
  return {
    stages: PIPELINE_STAGES.map((stage) => ({
      ...stage,
      count: counts[stage.value] ?? 0,
    })),
    outcomes: PIPELINE_OUTCOMES.map((outcome) => ({
      ...outcome,
      count: counts[outcome.value] ?? 0,
    })),
  };
}

/** Lead counts grouped by source, most popular first. */
export function buildSourceBreakdown(leads) {
  const total = leads.length;
  const grouped = leads.reduce((map, lead) => {
    map[lead.source] = (map[lead.source] ?? 0) + 1;
    return map;
  }, {});

  return Object.entries(grouped)
    .map(([value, count]) => ({ value, count }))
    .sort((a, b) => b.count - a.count)
    .map((entry) => ({
      ...entry,
      percentage: total ? Math.round((entry.count / total) * 100) : 0,
    }));
}

/** Newest first, limited to `limit` entries. */
export function sortNewest(leads, limit) {
  const sorted = [...leads].sort((a, b) => {
    const timeA = new Date(a.createdAt).getTime();
    const timeB = new Date(b.createdAt).getTime();
    return timeB - timeA;
  });
  return typeof limit === 'number' ? sorted.slice(0, limit) : sorted;
}