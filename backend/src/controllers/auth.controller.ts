import { Request, Response, NextFunction } from 'express';
import { login, createAdminUser } from '../services/auth.service';
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

export const registerController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      throw new AppError('Email and password are required', 400);
    }

    if (password.length < 8) {
      throw new AppError('Password must be at least 8 characters', 400);
    }

    const user = await createAdminUser(email, password);
    res.status(201).json({ message: 'Admin user created successfully', user });
  } catch (error) {
    next(error);
  }
};


