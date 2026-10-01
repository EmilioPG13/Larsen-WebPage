import { Request, Response, NextFunction } from 'express';
import { login, getCurrentUser, changePassword } from '../services/auth.service';
import { AppError } from '../middleware/error.middleware';
import { AuthRequest } from '../middleware/auth.middleware';

export const loginController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      throw new AppError('Email and password are required', 400);
    }

    const result = await login(email, password);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

export const meController = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const user = await getCurrentUser(req.userId as string);
    res.json(user);
  } catch (error) {
    next(error);
  }
};

export const changePasswordController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (typeof currentPassword !== 'string' || typeof newPassword !== 'string' || !currentPassword) {
      throw new AppError('Current and new password are required', 400);
    }

    await changePassword(req.userId as string, currentPassword, newPassword);
    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    next(error);
  }
};
