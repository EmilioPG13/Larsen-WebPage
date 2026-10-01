import { Response, NextFunction } from 'express';
import { Prisma, UnitModality, UnitStatus } from '@prisma/client';
import prisma from '../config/database';
import { AppError } from '../middleware/error.middleware';
import { AuthRequest } from '../middleware/auth.middleware';
import {
  FieldChanges,
  findMachineId,
  normalizeBrand,
  resolveBrandId,
  soldAtFor,
} from '../services/inventory';

// Who made the latest change, shown next to each unit in the panel.
const LAST_MOVEMENT = {
  movements: {
    orderBy: { createdAt: 'desc' as const },
    take: 1,
    include: { user: { select: { id: true, name: true, email: true } } },
  },
};

const STATUS_MESSAGE = 'Invalid status. Must be one of: DISPONIBLE, APARTADA, VENDIDA';
const MODALITY_MESSAGE = 'Invalid modality. Must be one of: EN_BODEGA, BAJO_PEDIDO';

const isStatus = (value: unknown): value is UnitStatus =>
  typeof value === 'string' && (Object.values(UnitStatus) as string[]).includes(value);

const isModality = (value: unknown): value is UnitModality =>
  typeof value === 'string' && (Object.values(UnitModality) as string[]).includes(value);

/**
 * Optional text field: undefined stays undefined, blank becomes null. Only
 * strings and finite numbers are accepted (a gauge or serial may come as a
 * number); anything else is a 400 instead of being stored as "[object Object]".
 */
const optionalText = (value: unknown, field: string): string | null | undefined => {
  if (value === undefined) return undefined;
  if (value === null) return null;
  if (typeof value !== 'string' && !(typeof value === 'number' && Number.isFinite(value))) {
    throw new AppError(`Invalid value for ${field}`, 400);
  }
  const text = String(value).trim();
  return text === '' ? null : text;
};

/** Optional date field: undefined stays undefined, blank/null clears it, anything unparseable is a 400. */
const optionalDate = (value: unknown, field: string): Date | null | undefined => {
  if (value === undefined) return undefined;
  if (value === null || value === '') return null;
  const date = typeof value === 'string' ? new Date(value) : new Date(NaN);
  if (Number.isNaN(date.getTime())) throw new AppError(`Invalid date in ${field}`, 400);
  return date;
};

const errorCode = (error: unknown): string | undefined => (error as { code?: string })?.code;

/** Translates the database errors a unit write can raise into HTTP errors. */
const mapWriteError = (error: unknown): unknown => {
  switch (errorCode(error)) {
    case 'P2002': {
      const target = String((error as { meta?: { target?: unknown } }).meta?.target ?? '');
      return new AppError(
        target.includes('externalId')
          ? 'That externalId is already used by another unit'
          : 'A unit with that brand and serial number already exists',
        409
      );
    }
    case 'P2003':
      return new AppError('Referenced record does not exist', 400);
    case 'P2025':
      return new AppError('Unit not found', 404);
    default:
      return error;
  }
};

/** The spec sheet a body points at, which must exist. undefined = not sent. */
const checkedMachineId = async (
  db: Pick<typeof prisma, 'machine'>,
  value: unknown
): Promise<string | null | undefined> => {
  const machineId = optionalText(value, 'machineId');
  if (!machineId) return machineId;
  const machine = await db.machine.findUnique({ where: { id: machineId }, select: { id: true } });
  if (!machine) throw new AppError('Unknown machineId', 400);
  return machineId;
};

const toJsonValue = (value: unknown): Prisma.InputJsonValue | null =>
  value instanceof Date ? value.toISOString() : ((value ?? null) as Prisma.InputJsonValue | null);

export const listUnits = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { status, brand, q } = req.query;

    // An empty status (what a filter UI sends for "all") means no filter.
    const statusFilter = status === '' ? undefined : status;
    if (statusFilter !== undefined && !isStatus(statusFilter)) {
      throw new AppError(STATUS_MESSAGE, 400);
    }

    const where: Prisma.InventoryUnitWhereInput = {};
    if (statusFilter) where.status = statusFilter;
    if (typeof brand === 'string' && brand.trim()) where.brand = normalizeBrand(brand);
    if (typeof q === 'string' && q.trim()) {
      const term = q.trim();
      where.OR = [
        { serialNumber: { contains: term, mode: 'insensitive' } },
        { model: { contains: term, mode: 'insensitive' } },
      ];
    }

    const units = await prisma.inventoryUnit.findMany({
      where,
      include: LAST_MOVEMENT,
      orderBy: [{ brand: 'asc' }, { model: 'asc' }, { serialNumber: 'asc' }],
    });

    res.json(units);
  } catch (error) {
    next(error);
  }
};

export const createUnit = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { status, modality } = req.body;

    const brandName = optionalText(req.body.brand, 'brand');
    const modelName = optionalText(req.body.model, 'model');
    const gaugeText = optionalText(req.body.gauge, 'gauge');
    const serial = optionalText(req.body.serialNumber, 'serialNumber');
    if (!brandName || !modelName || !gaugeText || !serial) {
      throw new AppError('Missing required fields: brand, model, gauge and serialNumber', 400);
    }
    if (status !== undefined && !isStatus(status)) throw new AppError(STATUS_MESSAGE, 400);
    if (modality !== undefined && !isModality(modality)) throw new AppError(MODALITY_MESSAGE, 400);

    const normalizedBrand = normalizeBrand(brandName);
    const unitStatus: UnitStatus = status ?? UnitStatus.DISPONIBLE;
    const soldAt = soldAtFor(unitStatus, null, optionalDate(req.body.soldAt, 'soldAt'));
    const receivedAt = optionalDate(req.body.receivedAt, 'receivedAt') ?? null;
    const notes = optionalText(req.body.notes, 'notes') ?? null;

    const unit = await prisma.$transaction(async (tx) => {
      const created = await tx.inventoryUnit.create({
        data: {
          brand: normalizedBrand,
          brandId: await resolveBrandId(tx, normalizedBrand),
          model: modelName,
          gauge: gaugeText,
          serialNumber: serial,
          status: unitStatus,
          modality: modality ?? UnitModality.EN_BODEGA,
          receivedAt,
          soldAt,
          notes,
          machineId:
            (await checkedMachineId(tx, req.body.machineId)) ?? (await findMachineId(tx, normalizedBrand, modelName)),
        },
      });

      await tx.inventoryMovement.create({
        data: { unitId: created.id, userId: req.userId, action: 'CREATE', toStatus: unitStatus },
      });

      return created;
    });

    res.status(201).json(unit);
  } catch (error) {
    next(mapWriteError(error));
  }
};

export const updateUnit = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const body = req.body;

    // Everything runs inside one transaction, including the read, so the
    // "before" values in the audit trail are the ones that were really replaced.
    const unit = await prisma.$transaction(async (tx) => {
      const current = await tx.inventoryUnit.findUnique({ where: { id } });
      if (!current) throw new AppError('Unit not found', 404);

      // Status goes through PATCH /:id/status so the sale date and the audit
      // trail stay consistent; it is deliberately not editable here.
      const data: Prisma.InventoryUnitUncheckedUpdateInput = {};

      for (const field of ['model', 'gauge', 'serialNumber'] as const) {
        if (body[field] === undefined) continue;
        const text = optionalText(body[field], field);
        if (!text) throw new AppError(`${field} cannot be empty`, 400);
        data[field] = text;
      }
      if (body.brand !== undefined) {
        const brandName = optionalText(body.brand, 'brand');
        if (!brandName) throw new AppError('brand cannot be empty', 400);
        const normalizedBrand = normalizeBrand(brandName);
        data.brand = normalizedBrand;
        data.brandId = await resolveBrandId(tx, normalizedBrand);
      }
      if (body.modality !== undefined) {
        if (!isModality(body.modality)) throw new AppError(MODALITY_MESSAGE, 400);
        data.modality = body.modality;
      }
      if (body.notes !== undefined) data.notes = optionalText(body.notes, 'notes');
      if (body.externalId !== undefined) data.externalId = optionalText(body.externalId, 'externalId');
      if (body.receivedAt !== undefined) data.receivedAt = optionalDate(body.receivedAt, 'receivedAt');
      if (body.machineId !== undefined) data.machineId = await checkedMachineId(tx, body.machineId);
      if (body.soldAt !== undefined) {
        const soldAt = optionalDate(body.soldAt, 'soldAt');
        if (current.status === UnitStatus.VENDIDA) {
          // A sold unit always keeps a sale date: it feeds the "sale -> site updated" indicator.
          if (!soldAt) throw new AppError('A VENDIDA unit needs a sale date', 400);
          data.soldAt = soldAt;
        } else if (soldAt) {
          throw new AppError('soldAt can only be set on a VENDIDA unit', 400);
        }
        // Clearing soldAt on a unit that is not sold is a no-op, not an error:
        // an edit form may always send the whole object.
      }

      const changes: FieldChanges = {};
      for (const [field, after] of Object.entries(data)) {
        const before = (current as Record<string, unknown>)[field];
        const same =
          before instanceof Date && after instanceof Date
            ? before.getTime() === after.getTime()
            : before === after;
        if (!same) changes[field] = [toJsonValue(before), toJsonValue(after)];
      }

      if (Object.keys(changes).length === 0) return current;

      const updated = await tx.inventoryUnit.update({ where: { id }, data });
      await tx.inventoryMovement.create({
        data: {
          unitId: id,
          userId: req.userId,
          action: 'UPDATE',
          changes: changes as Prisma.InputJsonObject,
        },
      });
      return updated;
    });

    res.json(unit);
  } catch (error) {
    next(mapWriteError(error));
  }
};

export const updateUnitStatus = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!isStatus(status)) throw new AppError(STATUS_MESSAGE, 400);
    const requestedSoldAt = optionalDate(req.body.soldAt, 'soldAt');

    // Read and write in one transaction so two people changing the same unit
    // at once cannot both record the same "from" status.
    const unit = await prisma.$transaction(async (tx) => {
      const current = await tx.inventoryUnit.findUnique({ where: { id } });
      if (!current) throw new AppError('Unit not found', 404);

      const soldAt = soldAtFor(status, current.soldAt, requestedSoldAt);
      const sameStatus = current.status === status;
      const sameSoldAt = (current.soldAt?.getTime() ?? null) === (soldAt?.getTime() ?? null);
      if (sameStatus && sameSoldAt) return current;

      const updated = await tx.inventoryUnit.update({ where: { id }, data: { status, soldAt } });
      await tx.inventoryMovement.create({
        data: {
          unitId: id,
          userId: req.userId,
          action: 'STATUS',
          fromStatus: current.status,
          toStatus: status,
          ...(sameSoldAt
            ? {}
            : {
                changes: {
                  soldAt: [toJsonValue(current.soldAt), toJsonValue(soldAt)],
                } as Prisma.InputJsonObject,
              }),
        },
      });
      return updated;
    });

    res.json(unit);
  } catch (error) {
    next(mapWriteError(error));
  }
};

export const getUnitMovements = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const unit = await prisma.inventoryUnit.findUnique({ where: { id }, select: { id: true } });
    if (!unit) throw new AppError('Unit not found', 404);

    const movements = await prisma.inventoryMovement.findMany({
      where: { unitId: id },
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { id: true, name: true, email: true } } },
    });

    res.json(movements);
  } catch (error) {
    next(error);
  }
};

export const deleteUnit = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    await prisma.inventoryUnit.delete({ where: { id } });

    res.json({ message: 'Unit deleted successfully' });
  } catch (error) {
    next(mapWriteError(error));
  }
};
