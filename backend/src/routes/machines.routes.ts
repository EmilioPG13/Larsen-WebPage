import express from 'express';
import {
  getMachines,
  getMachineById,
  createMachine,
  updateMachine,
  deleteMachine,
  updateMachineStock,
} from '../controllers/machines.controller';
import { authenticateToken } from '../middleware/auth.middleware';
import { errorHandler } from '../middleware/error.middleware';

const router = express.Router();

// Public routes
router.get('/', getMachines);
router.get('/:id', getMachineById);

// Admin routes
router.post('/', authenticateToken, createMachine);
router.put('/:id', authenticateToken, updateMachine);
router.delete('/:id', authenticateToken, deleteMachine);
router.put('/:id/stock', authenticateToken, updateMachineStock);

router.use(errorHandler);

export default router;


