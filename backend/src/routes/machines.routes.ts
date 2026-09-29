import express from 'express';
import {
  getMachines,
  getMachineById,
  createMachine,
  updateMachine,
  deleteMachine,
  updateMachineStock,
} from '../controllers/machines.controller';
import { authenticateToken, requireRole } from '../middleware/auth.middleware';
import { errorHandler } from '../middleware/error.middleware';

const router = express.Router();

// Public routes
router.get('/', getMachines);
router.get('/:id', getMachineById);

// Admin routes
router.post('/', authenticateToken, requireRole('ADMIN'), createMachine);
router.put('/:id', authenticateToken, requireRole('ADMIN'), updateMachine);
router.delete('/:id', authenticateToken, requireRole('ADMIN'), deleteMachine);
router.put('/:id/stock', authenticateToken, requireRole('ADMIN'), updateMachineStock);

router.use(errorHandler);

export default router;


