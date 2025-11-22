import { Request, Response, NextFunction } from 'express';

export class AppError extends Error {
  status: number;
  isOperational: boolean;

  constructor(message: string, status: number = 500) {
    super(message);
    this.status = status;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (err instanceof AppError) {
    return res.status(err.status).json({
      error: err.message,
    });
  }

  console.error('Unexpected error:', err);
  return res.status(500).json({
    error: 'Internal server error',
  });
};


