import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { Role } from '@prisma/client';
import env from '../config/env';
import prisma from '../config/database';

export interface AuthRequest extends Request {
  userId?: string;
  userEmail?: string;
  userRole?: Role;
}

export const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as { userId: string; email: string };
    req.userId = decoded.userId;
    req.userEmail = decoded.email;
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
};

/**
 * Restricts a route to the given roles. Use it after authenticateToken.
 *
 * The user is loaded from the database on every request instead of trusting a
 * role baked into the JWT, so deactivating an account or changing its role
 * applies immediately rather than when the 7-day token expires.
 */
export const requireRole = (...roles: Role[]) => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const user = await prisma.user.findUnique({
        where: { id: req.userId },
        select: { id: true, email: true, role: true, active: true },
      });

      if (!user) {
        return res.status(401).json({ error: 'User no longer exists' });
      }

      if (!user.active) {
        return res.status(403).json({ error: 'Account is deactivated' });
      }

      if (!roles.includes(user.role)) {
        return res.status(403).json({ error: 'Insufficient permissions' });
      }

      req.userRole = user.role;
      next();
    } catch (error) {
      next(error);
    }
  };
};
