import express from 'express';
import {
  createLead,
  getLeads,
  getLeadById,
  updateLeadStatus,
  deleteLead,
  createContactSubmission,
  getStats,
} from '../controllers/leads.controller';
import { authenticateToken } from '../middleware/auth.middleware';
import { errorHandler } from '../middleware/error.middleware';

const router = express.Router();

// Public routes
router.post('/', createLead); // Quote form submission

// Admin routes
router.get('/', authenticateToken, getLeads);
router.get('/stats', authenticateToken, getStats);
router.get('/:id', authenticateToken, getLeadById);
router.put('/:id/status', authenticateToken, updateLeadStatus);
router.delete('/:id', authenticateToken, deleteLead);

router.use(errorHandler);

export default router;

