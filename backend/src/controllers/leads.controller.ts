import { Request, Response, NextFunction } from 'express';
import prisma from '../config/database';
import { AppError } from '../middleware/error.middleware';
import { notifyNewLead } from '../services/notify';

const MAX_TAG_LENGTH = 60;

/** A trimmed, length-capped string, or null when the value is not usable text. */
const optionalText = (value: unknown): string | null =>
  typeof value === 'string' && value.trim() ? value.trim().slice(0, MAX_TAG_LENGTH) : null;

/**
 * The inventory unit a quote is about. The catalog sends the unit id; a bare
 * serial number links only when exactly one unit has it (serials repeat across
 * brands). Never throws on a miss: an unknown unit must not lose the lead.
 */
const resolveUnit = async (inventoryUnitId: unknown, serialNumber: string | null) => {
  const id = optionalText(inventoryUnitId);
  if (id) {
    const unit = await prisma.inventoryUnit.findUnique({
      where: { id },
      select: { id: true, serialNumber: true },
    });
    if (unit) return unit;
  }
  if (serialNumber) {
    const matches = await prisma.inventoryUnit.findMany({
      where: { serialNumber },
      select: { id: true, serialNumber: true },
      take: 2,
    });
    if (matches.length === 1) return matches[0];
  }
  return null;
};

export const createLead = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      name,
      email,
      phone,
      company,
      industry,
      productionVolume,
      budget,
      purchaseDate,
      message,
      inventoryUnitId,
      serialNumber,
      source,
    } = req.body;

    if (!name || !email || !phone) {
      throw new AppError('Missing required fields', 400);
    }

    const unit = await resolveUnit(inventoryUnitId, optionalText(serialNumber));
    const leadSerial = unit?.serialNumber ?? optionalText(serialNumber);
    const leadSource = optionalText(source);

    const lead = await prisma.lead.create({
      data: {
        name,
        email,
        phone,
        company: company || '',
        industry: industry || null,
        productionVolume: productionVolume || null,
        budget: budget || 'No especificado',
        purchaseDate: purchaseDate || 'No especificado',
        message: message || null,
        status: 'new',
        // Only sent when there is something to store, so a plain quote writes
        // exactly what it did before the inventory columns existed.
        ...(unit && { inventoryUnitId: unit.id }),
        ...(leadSerial && { serialNumber: leadSerial }),
        ...(leadSource && { source: leadSource }),
      },
    });

    // Awaited on purpose: a serverless function can be frozen right after the
    // response is sent, which would drop an unawaited email. A failure here is
    // logged and never turns the saved lead into an error response.
    try {
      await notifyNewLead(lead);
    } catch (notifyError) {
      console.error('Failed to send lead notification:', notifyError);
    }

    res.status(201).json(lead);
  } catch (error) {
    next(error);
  }
};

export const getLeads = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status, page = '1', limit = '50' } = req.query;
    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};
    if (status) {
      where.status = status;
    }

    const [leads, total] = await Promise.all([
      prisma.lead.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: {
          createdAt: 'desc',
        },
      }),
      prisma.lead.count({ where }),
    ]);

    res.json({
      leads,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getLeadById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const lead = await prisma.lead.findUnique({
      where: { id },
    });

    if (!lead) {
      throw new AppError('Lead not found', 404);
    }

    res.json(lead);
  } catch (error) {
    next(error);
  }
};

export const updateLeadStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['new', 'contacted', 'converted', 'archived'];
    if (!status || !validStatuses.includes(status)) {
      throw new AppError('Invalid status. Must be one of: new, contacted, converted, archived', 400);
    }

    const lead = await prisma.lead.update({
      where: { id },
      data: { status },
    });

    res.json(lead);
  } catch (error) {
    if ((error as any).code === 'P2025') {
      return next(new AppError('Lead not found', 404));
    }
    next(error);
  }
};

export const deleteLead = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    await prisma.lead.delete({
      where: { id },
    });

    res.json({ message: 'Lead deleted successfully' });
  } catch (error) {
    if ((error as any).code === 'P2025') {
      return next(new AppError('Lead not found', 404));
    }
    next(error);
  }
};

export const createContactSubmission = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, email, phone, company, message, productId } = req.body;

    if (!name || !email || !message) {
      throw new AppError('Missing required fields', 400);
    }

    const submission = await prisma.contactSubmission.create({
      data: {
        name,
        email,
        phone: phone || null,
        company: company || null,
        message,
        productId: productId || null,
      },
    });

    res.status(201).json(submission);
  } catch (error) {
    next(error);
  }
};

export const getStats = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const [
      totalLeads,
      newLeadsToday,
      totalProducts,
      totalMachines,
      productsInStock,
      productsOutOfStock,
      machinesInStock,
      machinesOutOfStock,
      newLeads,
      unitsByStatus,
    ] = await Promise.all([
      prisma.lead.count(),
      prisma.lead.count({
        where: {
          createdAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
          },
        },
      }),
      prisma.product.count(),
      prisma.machine.count(),
      prisma.product.count({ where: { inStock: true } }),
      prisma.product.count({ where: { inStock: false } }),
      prisma.machine.count({ where: { inStock: true } }),
      prisma.machine.count({ where: { inStock: false } }),
      prisma.lead.count({ where: { status: 'new' } }),
      prisma.inventoryUnit.groupBy({ by: ['status'], _count: { _all: true } }),
    ]);

    const unitCount = (status: string) =>
      unitsByStatus.find((row) => row.status === status)?._count._all ?? 0;

    res.json({
      leads: {
        total: totalLeads,
        newToday: newLeadsToday,
        new: newLeads,
      },
      products: {
        total: totalProducts,
        inStock: productsInStock,
        outOfStock: productsOutOfStock,
      },
      machines: {
        total: totalMachines,
        inStock: machinesInStock,
        outOfStock: machinesOutOfStock,
      },
      inventory: {
        available: unitCount('DISPONIBLE'),
        reserved: unitCount('APARTADA'),
        sold: unitCount('VENDIDA'),
      },
    });
  } catch (error) {
    next(error);
  }
};


