import express from 'express';
import {
  getUsers,
  createUser,
  updateUser,
  resetUserPassword,
} from '../controllers/users.controller';
import { authenticateToken, requireRole } from '../middleware/auth.middleware';
import { errorHandler } from '../middleware/error.middleware';

const router = express.Router();

// Every user-management route is ADMIN only. There is deliberately no public
// registration endpoint: accounts are created here or by the database seed.
router.use(authenticateToken, requireRole('ADMIN'));

router.get('/', getUsers);
router.post('/', createUser);
router.put('/:id', updateUser);
router.put('/:id/password', resetUserPassword);

router.use(errorHandler);

export default router;
