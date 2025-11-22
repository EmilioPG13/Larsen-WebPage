import { Request, Response, NextFunction } from 'express';
import prisma from '../config/database';
import { AppError } from '../middleware/error.middleware';

export const getProducts = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const products = await prisma.product.findMany({
      include: {
        brand: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    res.json(products);
  } catch (error) {
    next(error);
  }
};

export const getProductById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        brand: true,
      },
    });

    if (!product) {
      throw new AppError('Product not found', 404);
    }

    res.json(product);
  } catch (error) {
    next(error);
  }
};

export const createProduct = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      name,
      description,
      price,
      image,
      features,
      category,
      discount,
      brandId,
      inStock,
    } = req.body;

    if (!name || !description || !price || !image || !category) {
      throw new AppError('Missing required fields', 400);
    }

    const product = await prisma.product.create({
      data: {
        name,
        description,
        price,
        image,
        features: features || [],
        category,
        discount,
        brandId: brandId || null,
        inStock: inStock !== undefined ? inStock : true,
      },
      include: {
        brand: true,
      },
    });

    res.status(201).json(product);
  } catch (error) {
    next(error);
  }
};

export const updateProduct = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const product = await prisma.product.update({
      where: { id },
      data: updateData,
      include: {
        brand: true,
      },
    });

    res.json(product);
  } catch (error) {
    if ((error as any).code === 'P2025') {
      return next(new AppError('Product not found', 404));
    }
    next(error);
  }
};

export const deleteProduct = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    await prisma.product.delete({
      where: { id },
    });

    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    if ((error as any).code === 'P2025') {
      return next(new AppError('Product not found', 404));
    }
    next(error);
  }
};

export const updateProductStock = async (req: Request, res: Response, next: NextFunction) => {
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

    const product = await prisma.product.update({
      where: { id },
      data: { inStock: stockStatus },
      include: {
        brand: true,
      },
    });

    res.json(product);
  } catch (error) {
    if ((error as any).code === 'P2025') {
      return next(new AppError('Product not found', 404));
    }
    next(error);
  }
};


