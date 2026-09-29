import express from 'express';
import {
  loginController,
  meController,
  changePasswordController,
} from '../controllers/auth.controller';
import { authenticateToken } from '../middleware/auth.middleware';
import { errorHandler } from '../middleware/error.middleware';

const router = express.Router();

router.post('/login', loginController);
router.get('/me', authenticateToken, meController);
router.put('/password', authenticateToken, changePasswordController);

router.use(errorHandler);

export default router;
