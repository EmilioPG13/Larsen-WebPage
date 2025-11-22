import express from 'express';
import {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  updateProductStock,
} from '../controllers/products.controller';
import { authenticateToken } from '../middleware/auth.middleware';
import { errorHandler } from '../middleware/error.middleware';

const router = express.Router();

// Public routes
router.get('/', getProducts);
router.get('/:id', getProductById);

// Admin routes
router.post('/', authenticateToken, createProduct);
router.put('/:id', authenticateToken, updateProduct);
router.delete('/:id', authenticateToken, deleteProduct);
router.put('/:id/stock', authenticateToken, updateProductStock);

router.use(errorHandler);

export default router;


