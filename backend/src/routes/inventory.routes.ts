import express from 'express';
import {
  listUnits,
  createUnit,
  updateUnit,
  updateUnitStatus,
  getUnitMovements,
  deleteUnit,
} from '../controllers/inventory.controller';
import { authenticateToken, requireRole } from '../middleware/auth.middleware';
import { errorHandler } from '../middleware/error.middleware';

const router = express.Router();

// The whole panel API is for staff: ADMIN and INVENTARIO can operate the stock.
router.get('/', authenticateToken, requireRole('ADMIN', 'INVENTARIO'), listUnits);
router.post('/', authenticateToken, requireRole('ADMIN', 'INVENTARIO'), createUnit);
router.put('/:id', authenticateToken, requireRole('ADMIN', 'INVENTARIO'), updateUnit);
router.patch('/:id/status', authenticateToken, requireRole('ADMIN', 'INVENTARIO'), updateUnitStatus);
router.get('/:id/movements', authenticateToken, requireRole('ADMIN', 'INVENTARIO'), getUnitMovements);

// Deleting a unit removes its history too, so it stays ADMIN-only.
router.delete('/:id', authenticateToken, requireRole('ADMIN'), deleteUnit);

router.use(errorHandler);

export default router;
