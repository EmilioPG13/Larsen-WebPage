import { Request, Response, NextFunction } from 'express';
import { updateMachineStock } from '../controllers/machines.controller';
import prisma from '../config/database';
import { AppError } from '../middleware/error.middleware';

// Mock Prisma
jest.mock('../config/database', () => ({
  default: {
    machine: {
      update: vi.fn(),
      findUnique: vi.fn(),
    },
  },
}));

describe('Machines Controller - Stock Updates', () => {
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

  describe('updateMachineStock', () => {
    it('should update machine stock status using inStock boolean', async () => {
      const updatedMachine = {
        id: '1',
        name: 'Test Machine',
        inStock: false,
        brandRelation: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockRequest.params = { id: '1' };
      mockRequest.body = { inStock: false };
      (prisma.machine.update as jest.Mock).mockResolvedValue(updatedMachine);

      await updateMachineStock(mockRequest as Request, mockResponse as Response, mockNext);

      expect(prisma.machine.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: { inStock: false },
        include: { brandRelation: true },
      });
      expect(mockResponse.json).toHaveBeenCalledWith(updatedMachine);
    });

    it('should update machine stock status using quantity (quantity > 0)', async () => {
      const updatedMachine = {
        id: '1',
        name: 'Test Machine',
        inStock: true,
        brandRelation: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockRequest.params = { id: '1' };
      mockRequest.body = { quantity: 1 };
      (prisma.machine.update as jest.Mock).mockResolvedValue(updatedMachine);

      await updateMachineStock(mockRequest as Request, mockResponse as Response, mockNext);

      expect(prisma.machine.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: { inStock: true },
        include: { brandRelation: true },
      });
    });

    it('should update machine stock status using quantity (quantity = 0)', async () => {
      const updatedMachine = {
        id: '1',
        name: 'Test Machine',
        inStock: false,
        brandRelation: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockRequest.params = { id: '1' };
      mockRequest.body = { quantity: 0 };
      (prisma.machine.update as jest.Mock).mockResolvedValue(updatedMachine);

      await updateMachineStock(mockRequest as Request, mockResponse as Response, mockNext);

      expect(prisma.machine.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: { inStock: false },
        include: { brandRelation: true },
      });
    });

    it('should return error when neither inStock nor quantity is provided', async () => {
      mockRequest.params = { id: '1' };
      mockRequest.body = {};

      await updateMachineStock(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Either inStock or quantity must be provided',
          status: 400,
        })
      );
    });

    it('should return 404 when machine not found', async () => {
      mockRequest.params = { id: '999' };
      mockRequest.body = { inStock: false };
      (prisma.machine.update as jest.Mock).mockRejectedValue({ code: 'P2025' });

      await updateMachineStock(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Machine not found',
          status: 404,
        })
      );
    });

    it('should handle database errors', async () => {
      mockRequest.params = { id: '1' };
      mockRequest.body = { inStock: false };
      (prisma.machine.update as jest.Mock).mockRejectedValue(new Error('Database error'));

      await updateMachineStock(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
    });
  });
});

