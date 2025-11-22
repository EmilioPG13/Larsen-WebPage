import express from 'express';
import { loginController, registerController } from '../controllers/auth.controller';
import { errorHandler } from '../middleware/error.middleware';

const router = express.Router();

router.post('/login', loginController);
router.post('/register', registerController); // For initial admin setup

router.use(errorHandler);

export default router;


