import { Router } from 'express';
import {
  createLead,
  deleteLead,
  getLead,
  listLeads,
  updateLead,
} from '../controllers/leadsController.js';
import { authenticate } from '../middleware/auth.js';
import { asyncHandler } from '../lib/asyncHandler.js';

const router = Router();

// Every lead route is behind authentication; req.user.id is enforced scoped
// ownership in each controller/repo query.
router.use(authenticate);

router.get('/', asyncHandler(listLeads));
router.post('/', asyncHandler(createLead));
router.get('/:id', asyncHandler(getLead));
router.patch('/:id', asyncHandler(updateLead));
router.delete('/:id', asyncHandler(deleteLead));

export default router;