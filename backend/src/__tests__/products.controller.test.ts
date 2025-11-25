import { Request, Response, NextFunction } from 'express';
import { updateProductStock } from '../controllers/products.controller';
import prisma from '../config/database';
import { AppError } from '../middleware/error.middleware';

// Mock Prisma
jest.mock('../config/database', () => ({
  default: {
    product: {
      update: vi.fn(),
      findUnique: vi.fn(),
    },
  },
}));

describe('Products Controller - Stock Updates', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockRequest = {
      body: {},
      params: {},
    };
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    mockNext = jest.fn();
    jest.clearAllMocks();
  });

  describe('updateProductStock', () => {
    it('should update product stock status using inStock boolean', async () => {
      const updatedProduct = {
        id: '1',
        name: 'Test Product',
        inStock: false,
        brand: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockRequest.params = { id: '1' };
      mockRequest.body = { inStock: false };
      (prisma.product.update as jest.Mock).mockResolvedValue(updatedProduct);

      await updateProductStock(mockRequest as Request, mockResponse as Response, mockNext);

      expect(prisma.product.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: { inStock: false },
        include: { brand: true },
      });
      expect(mockResponse.json).toHaveBeenCalledWith(updatedProduct);
    });

    it('should update product stock status using quantity (quantity > 0)', async () => {
      const updatedProduct = {
        id: '1',
        name: 'Test Product',
        inStock: true,
        brand: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockRequest.params = { id: '1' };
      mockRequest.body = { quantity: 5 };
      (prisma.product.update as jest.Mock).mockResolvedValue(updatedProduct);

      await updateProductStock(mockRequest as Request, mockResponse as Response, mockNext);

      expect(prisma.product.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: { inStock: true },
        include: { brand: true },
      });
    });

    it('should update product stock status using quantity (quantity = 0)', async () => {
      const updatedProduct = {
        id: '1',
        name: 'Test Product',
        inStock: false,
        brand: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockRequest.params = { id: '1' };
      mockRequest.body = { quantity: 0 };
      (prisma.product.update as jest.Mock).mockResolvedValue(updatedProduct);

      await updateProductStock(mockRequest as Request, mockResponse as Response, mockNext);

      expect(prisma.product.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: { inStock: false },
        include: { brand: true },
      });
    });

    it('should return error when neither inStock nor quantity is provided', async () => {
      mockRequest.params = { id: '1' };
      mockRequest.body = {};

      await updateProductStock(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Either inStock or quantity must be provided',
          status: 400,
        })
      );
    });

    it('should return 404 when product not found', async () => {
      mockRequest.params = { id: '999' };
      mockRequest.body = { inStock: false };
      (prisma.product.update as jest.Mock).mockRejectedValue({ code: 'P2025' });

      await updateProductStock(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Product not found',
          status: 404,
        })
      );
    });

    it('should handle database errors', async () => {
      mockRequest.params = { id: '1' };
      mockRequest.body = { inStock: false };
      (prisma.product.update as jest.Mock).mockRejectedValue(new Error('Database error'));

      await updateProductStock(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
    });
  });
});

