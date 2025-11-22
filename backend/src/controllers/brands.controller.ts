import { Request, Response, NextFunction } from 'express';
import prisma from '../config/database';
import { AppError } from '../middleware/error.middleware';

export const getBrands = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const brands = await prisma.brand.findMany({
      orderBy: {
        name: 'asc',
      },
    });
    res.json(brands);
  } catch (error) {
    next(error);
  }
};

export const getBrandById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const brand = await prisma.brand.findUnique({
      where: { id },
      include: {
        products: true,
        machines: true,
      },
    });

    if (!brand) {
      throw new AppError('Brand not found', 404);
    }

    res.json(brand);
  } catch (error) {
    next(error);
  }
};

export const createBrand = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, image, description, specialties } = req.body;

    if (!name || !image || !description) {
      throw new AppError('Missing required fields', 400);
    }

    const brand = await prisma.brand.create({
      data: {
        name,
        image,
        description,
        specialties: specialties || [],
      },
    });

    res.status(201).json(brand);
  } catch (error) {
    next(error);
  }
};

export const updateBrand = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const brand = await prisma.brand.update({
      where: { id },
      data: updateData,
    });

    res.json(brand);
  } catch (error) {
    if ((error as any).code === 'P2025') {
      return next(new AppError('Brand not found', 404));
    }
    next(error);
  }
};

export const deleteBrand = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    await prisma.brand.delete({
      where: { id },
    });

    res.json({ message: 'Brand deleted successfully' });
  } catch (error) {
    if ((error as any).code === 'P2025') {
      return next(new AppError('Brand not found', 404));
    }
    next(error);
  }
};


