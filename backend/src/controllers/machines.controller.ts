import { Request, Response, NextFunction } from 'express';
import prisma from '../config/database';
import { AppError } from '../middleware/error.middleware';

export const getMachines = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const machines = await prisma.machine.findMany({
      include: {
        brand: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    res.json(machines);
  } catch (error) {
    next(error);
  }
};

export const getMachineById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const machine = await prisma.machine.findUnique({
      where: { id },
      include: {
        brand: true,
      },
    });

    if (!machine) {
      throw new AppError('Machine not found', 404);
    }

    res.json(machine);
  } catch (error) {
    next(error);
  }
};

export const createMachine = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      name,
      brand,
      description,
      type,
      knittingSystems,
      width,
      speed,
      gauge,
      yarnGuides,
      capabilities,
      software,
      power,
      category,
      image,
      brandId,
      inStock,
    } = req.body;

    if (!name || !brand || !description || !type || !category || !image) {
      throw new AppError('Missing required fields', 400);
    }

    const machine = await prisma.machine.create({
      data: {
        name,
        brand,
        description,
        type,
        knittingSystems: knittingSystems || '',
        width: width || '',
        speed: speed || '',
        gauge: gauge || '',
        yarnGuides: yarnGuides || '',
        capabilities: capabilities || [],
        software: software || '',
        power: power || '',
        category,
        image,
        brandId: brandId || null,
        inStock: inStock !== undefined ? inStock : true,
      },
      include: {
        brand: true,
      },
    });

    res.status(201).json(machine);
  } catch (error) {
    next(error);
  }
};

export const updateMachine = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const machine = await prisma.machine.update({
      where: { id },
      data: updateData,
      include: {
        brand: true,
      },
    });

    res.json(machine);
  } catch (error) {
    if ((error as any).code === 'P2025') {
      return next(new AppError('Machine not found', 404));
    }
    next(error);
  }
};

export const deleteMachine = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    await prisma.machine.delete({
      where: { id },
    });

    res.json({ message: 'Machine deleted successfully' });
  } catch (error) {
    if ((error as any).code === 'P2025') {
      return next(new AppError('Machine not found', 404));
    }
    next(error);
  }
};

export const updateMachineStock = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { inStock, quantity } = req.body;

    let stockStatus: boolean;

    if (quantity !== undefined) {
      // If quantity is provided, convert to boolean
      stockStatus = quantity > 0;
    } else if (inStock !== undefined) {
      stockStatus = inStock;
    } else {
      throw new AppError('Either inStock or quantity must be provided', 400);
    }

    const machine = await prisma.machine.update({
      where: { id },
      data: { inStock: stockStatus },
      include: {
        brand: true,
      },
    });

    res.json(machine);
  } catch (error) {
    if ((error as any).code === 'P2025') {
      return next(new AppError('Machine not found', 404));
    }
    next(error);
  }
};


