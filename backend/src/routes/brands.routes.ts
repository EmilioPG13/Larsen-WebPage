import express from 'express';
import {
  getBrands,
  getBrandById,
  createBrand,
  updateBrand,
  deleteBrand,
} from '../controllers/brands.controller';
import { authenticateToken } from '../middleware/auth.middleware';
import { errorHandler } from '../middleware/error.middleware';

const router = express.Router();

// Public routes
router.get('/', getBrands);
router.get('/:id', getBrandById);

// Admin routes
router.post('/', authenticateToken, createBrand);
router.put('/:id', authenticateToken, updateBrand);
router.delete('/:id', authenticateToken, deleteBrand);

router.use(errorHandler);

export default router;


