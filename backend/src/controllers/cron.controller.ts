import crypto from 'crypto';
import { Request, Response, NextFunction } from 'express';
import env from '../config/env';
import { AppError } from '../middleware/error.middleware';
import { buildMonthlyReport, isValidMonth, previousMonth } from '../services/inventory-report';
import { loadReportUnits } from '../services/inventory-report-data';
import { notifyMonthlyReport } from '../services/notify';

/** Constant-time comparison, so the secret cannot be guessed from response times. */
const sameSecret = (given: string, expected: string) => {
  const a = Buffer.from(given);
  const b = Buffer.from(expected);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
};

/**
 * Emails the inventory closing of the previous month. Vercel Cron calls it on the 1st of each
 * month and sends `Authorization: Bearer <CRON_SECRET>`; the same call with `?month=YYYY-MM`
 * re-sends a given month by hand.
 */
export const sendMonthlyReport = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const secret = env.CRON_SECRET;
    if (!secret) {
      return res.status(503).json({ error: 'Cron is not configured' });
    }
    if (!sameSecret(req.headers.authorization ?? '', `Bearer ${secret}`)) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const requested = req.query.month;
    const month = requested === undefined || requested === '' ? previousMonth() : requested;
    if (!isValidMonth(month)) {
      throw new AppError('month must look like 2026-10', 400);
    }

    const report = buildMonthlyReport(await loadReportUnits(), month);
    const sent = await notifyMonthlyReport(report);

    res.json({ month, sent });
  } catch (error) {
    next(error);
  }
};
