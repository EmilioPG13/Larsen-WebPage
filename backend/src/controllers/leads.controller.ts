import { Request, Response, NextFunction } from 'express';
import prisma from '../config/database';
import { AppError } from '../middleware/error.middleware';
import { NotifiableLead, notifyNewLead, sendLeadConfirmation } from '../services/notify';
import { EmailLang, parseEmailLang } from '../services/email-layout';

const MAX_TAG_LENGTH = 60;

// A spec-sheet download leaves contact details but does not ask for anything, so
// "we will contact you" would promise something nobody requested.
const NO_CONFIRMATION_SOURCE = 'spec-download';
const CONFIRMATION_COOLDOWN_MS = 60 * 60 * 1000;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const MAX_EMAIL_LENGTH = 254;

/**
 * Sends the person an automatic acknowledgement of their quote request. The form is public,
 * so it is also an open mailer: this only writes to a well-formed address, only for requests
 * that ask for a quote, and at most once an hour per address. Never throws: the lead is
 * already saved and the email is best-effort.
 */
const confirmToCustomer = async (
  lead: NotifiableLead & { source?: string | null },
  lang: EmailLang
): Promise<void> => {
  try {
    if (lead.source === NO_CONFIRMATION_SOURCE) return;
    if (lead.email.length > MAX_EMAIL_LENGTH || !EMAIL_RE.test(lead.email)) return;

    const recent = await prisma.lead.count({
      where: {
        id: { not: lead.id },
        email: { equals: lead.email, mode: 'insensitive' },
        createdAt: { gte: new Date(Date.now() - CONFIRMATION_COOLDOWN_MS) },
        OR: [{ source: null }, { source: { not: NO_CONFIRMATION_SOURCE } }],
      },
    });
    if (recent > 0) return;

    await sendLeadConfirmation(lead, lang);
  } catch (confirmError) {
    console.error('Failed to send lead confirmation:', confirmError);
  }
};

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
      language,
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
    // response is sent, which would drop an unawaited email. Both emails go out
    // together so the slower SMTP call is the only wait, and a failure in either
    // is logged and never turns the saved lead into an error response.
    await Promise.all([
      notifyNewLead(lead).catch((notifyError) => {
        console.error('Failed to send lead notification:', notifyError);
      }),
      confirmToCustomer(lead, parseEmailLang(language)),
    ]);

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


