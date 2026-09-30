import { Router } from 'express';
import { dashboardStats } from '../controllers/dashboardController.js';
import { authenticate } from '../middleware/auth.js';
import { asyncHandler } from '../lib/asyncHandler.js';

const router = Router();

router.use(authenticate);

router.get('/stats', asyncHandler(dashboardStats));

export default router;