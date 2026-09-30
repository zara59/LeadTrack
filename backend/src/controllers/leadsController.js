import * as repo from '../db/leads.repo.js';
import {
  requireValidLeadId,
  validateLeadCreate,
  validateLeadFilters,
  validateLeadUpdate,
} from '../lib/validate.js';
import { ApiError } from '../lib/validate.js';

/** GET /api/leads?status=&source=&search= — always scoped to the user. */
export async function listLeads(req, res) {
  const filters = validateLeadFilters(req.query);
  const leads = await repo.listLeads({ ...filters, userId: req.user.id });
  res.json({ leads });
}

/** GET /api/leads/:id — only the authenticated user's lead. */
export async function getLead(req, res) {
  const id = requireValidLeadId(req.params.id);
  const lead = await repo.findLead(id, req.user.id);
  if (!lead) {
    throw new ApiError(404, 'Lead not found');
  }
  res.json({ lead });
}

/** POST /api/leads — ownership always comes from the token, never the body. */
export async function createLead(req, res) {
  const clean = validateLeadCreate(req.body);
  const lead = await repo.insertLead(clean, req.user.id);
  res.status(201).json({ lead });
}

/** PATCH /api/leads/:id — only the authenticated user's lead. */
export async function updateLead(req, res) {
  const id = requireValidLeadId(req.params.id);
  const patch = validateLeadUpdate(req.body);
  const lead = await repo.updateLead(id, patch, req.user.id);
  if (!lead) {
    throw new ApiError(404, 'Lead not found');
  }
  res.json({ lead });
}

/** DELETE /api/leads/:id — only the authenticated user's lead. */
export async function deleteLead(req, res) {
  const id = requireValidLeadId(req.params.id);
  if (!(await repo.removeLead(id, req.user.id))) {
    throw new ApiError(404, 'Lead not found');
  }
  res.json({ message: 'Lead deleted', id });
}