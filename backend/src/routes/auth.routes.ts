import express from 'express';
import { loginController } from '../controllers/auth.controller';
import { errorHandler } from '../middleware/error.middleware';

const router = express.Router();

router.post('/login', loginController);

router.use(errorHandler);

export default router;
