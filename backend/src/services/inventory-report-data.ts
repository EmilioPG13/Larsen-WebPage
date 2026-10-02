import prisma from '../config/database';
import { ReportUnit } from './inventory-report';

/**
 * Every unit with its movement history, in the shape the report needs. It selects only
 * what the report reads: no notes, no user data.
 */
export const loadReportUnits = (): Promise<ReportUnit[]> =>
  prisma.inventoryUnit.findMany({
    select: {
      id: true,
      brand: true,
      model: true,
      gauge: true,
      serialNumber: true,
      status: true,
      receivedAt: true,
      soldAt: true,
      createdAt: true,
      updatedAt: true,
      movements: { select: { action: true, fromStatus: true, toStatus: true, createdAt: true } },
    },
  });
