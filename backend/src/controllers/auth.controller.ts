import { Request, Response, NextFunction } from 'express';
import { login } from '../services/auth.service';
import { AppError } from '../middleware/error.middleware';

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
