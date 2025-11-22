import { Request, Response, NextFunction } from 'express';
import prisma from '../config/database';
import { AppError } from '../middleware/error.middleware';

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
    } = req.body;

    if (!name || !email || !phone || !company || !budget || !purchaseDate) {
      throw new AppError('Missing required fields', 400);
    }

    const lead = await prisma.lead.create({
      data: {
        name,
        email,
        phone,
        company,
        industry: industry || null,
        productionVolume: productionVolume || null,
        budget,
        purchaseDate,
        message: message || null,
        status: 'new',
      },
    });

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
    ]);

    res.json({
      leads: {
        total: totalLeads,
        newToday: newLeadsToday,
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
    });
  } catch (error) {
    next(error);
  }
};


