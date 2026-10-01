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
import { authenticateToken, requireRole } from '../middleware/auth.middleware';
import { errorHandler } from '../middleware/error.middleware';

const router = express.Router();

// Public routes
router.post('/', createLead); // Quote form submission

// Admin routes
router.get('/', authenticateToken, requireRole('ADMIN'), getLeads);
router.get('/stats', authenticateToken, requireRole('ADMIN'), getStats);
router.get('/:id', authenticateToken, requireRole('ADMIN'), getLeadById);
router.put('/:id/status', authenticateToken, requireRole('ADMIN'), updateLeadStatus);
router.delete('/:id', authenticateToken, requireRole('ADMIN'), deleteLead);

router.use(errorHandler);

export default router;

