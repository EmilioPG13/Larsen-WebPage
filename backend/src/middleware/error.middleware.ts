import { Request, Response, NextFunction } from 'express';

/** True when Prisma reports that the record to update or delete does not exist (P2025). */
export const isRecordNotFound = (error: unknown): boolean =>
  typeof error === 'object' && error !== null && (error as { code?: unknown }).code === 'P2025';

export class AppError extends Error {
  status: number;
  isOperational: boolean;
  /** Seconds the client should wait before retrying (sent as Retry-After). */
  retryAfterSeconds?: number;

  constructor(message: string, status: number = 500, retryAfterSeconds?: number) {
    super(message);
    this.status = status;
    this.retryAfterSeconds = retryAfterSeconds;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

export const errorHandler = (
  err: Error | AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  if (err instanceof AppError) {
    if (err.retryAfterSeconds !== undefined) {
      res.set('Retry-After', String(err.retryAfterSeconds));
    }
    return res.status(err.status).json({
      error: err.message,
      ...(err.retryAfterSeconds !== undefined && { retryAfterSeconds: err.retryAfterSeconds }),
    });
  }

  console.error('Unexpected error:', err);
  return res.status(500).json({
    error: 'Internal server error',
  });
};


