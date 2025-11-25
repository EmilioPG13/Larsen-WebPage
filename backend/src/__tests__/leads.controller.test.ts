import { Request, Response, NextFunction } from 'express';
import { createLead, getLeads, getLeadById, updateLeadStatus } from '../controllers/leads.controller';
import { AppError } from '../middleware/error.middleware';

// Mock Prisma
jest.mock('../config/database', () => ({
  __esModule: true,
  default: {
    lead: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
  },
}));

const prisma = require('../config/database').default;
const mockCreate = prisma.lead.create;
const mockFindMany = prisma.lead.findMany;
const mockFindUnique = prisma.lead.findUnique;
const mockUpdate = prisma.lead.update;
const mockCount = prisma.lead.count;

describe('Leads Controller', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockRequest = {
      body: {},
      params: {},
      query: {},
    };
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    mockNext = jest.fn();
    jest.clearAllMocks();
  });

  describe('createLead', () => {
    it('should create a lead with all required fields', async () => {
      const leadData = {
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+1 (555) 123-4567',
        company: 'Test Company',
        budget: '$25,000 - $50,000',
        purchaseDate: '1-3 meses',
      };

      const createdLead = {
        id: '1',
        ...leadData,
        industry: null,
        productionVolume: null,
        message: null,
        status: 'new',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockRequest.body = leadData;
      mockCreate.mockResolvedValue(createdLead);

      await createLead(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockCreate).toHaveBeenCalledWith({
        data: {
          ...leadData,
          industry: null,
          productionVolume: null,
          message: null,
          status: 'new',
        },
      });
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith(createdLead);
    });

    it('should create a lead with optional fields', async () => {
      const leadData = {
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+1 (555) 123-4567',
        company: 'Test Company',
        industry: 'Textil y Confección',
        productionVolume: '1000 piezas por día',
        budget: '$25,000 - $50,000',
        purchaseDate: '1-3 meses',
        message: 'Test message',
      };

      const createdLead = {
        id: '1',
        ...leadData,
        status: 'new',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockRequest.body = leadData;
      mockCreate.mockResolvedValue(createdLead);

      await createLead(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockCreate).toHaveBeenCalledWith({
        data: {
          ...leadData,
          status: 'new',
        },
      });
      expect(mockResponse.status).toHaveBeenCalledWith(201);
    });

    it('should return error when required fields are missing', async () => {
      mockRequest.body = {
        name: 'John Doe',
        // Missing email, phone, company, budget, purchaseDate
      };

      await createLead(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Missing required fields',
          status: 400,
        })
      );
    });

    it('should handle database errors', async () => {
      const leadData = {
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+1 (555) 123-4567',
        company: 'Test Company',
        budget: '$25,000 - $50,000',
        purchaseDate: '1-3 meses',
      };

      mockRequest.body = leadData;
      mockCreate.mockRejectedValue(new Error('Database error'));

      await createLead(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('getLeads', () => {
    it('should return all leads', async () => {
      const mockLeads = [
        {
          id: '1',
          name: 'John Doe',
          email: 'john@example.com',
          status: 'new',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockFindMany.mockResolvedValue(mockLeads);
      mockCount.mockResolvedValue(1);

      await getLeads(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockFindMany).toHaveBeenCalledWith({
        where: {},
        skip: 0,
        take: 50,
        orderBy: { createdAt: 'desc' },
      });
      expect(mockResponse.json).toHaveBeenCalledWith({
        leads: mockLeads,
        pagination: {
          page: 1,
          limit: 50,
          total: 1,
          totalPages: 1,
        },
      });
    });

    it('should filter leads by status', async () => {
      mockRequest.query = { status: 'new' };
      mockFindMany.mockResolvedValue([]);
      mockCount.mockResolvedValue(0);

      await getLeads(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockFindMany).toHaveBeenCalledWith({
        where: { status: 'new' },
        skip: 0,
        take: 50,
        orderBy: { createdAt: 'desc' },
      });
    });

    it('should handle pagination', async () => {
      mockRequest.query = { page: '2', limit: '10' };
      mockFindMany.mockResolvedValue([]);
      mockCount.mockResolvedValue(20);

      await getLeads(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockFindMany).toHaveBeenCalledWith({
        where: {},
        skip: 10,
        take: 10,
        orderBy: { createdAt: 'desc' },
      });
    });
  });

  describe('getLeadById', () => {
    it('should return a lead by id', async () => {
      const mockLead = {
        id: '1',
        name: 'John Doe',
        email: 'john@example.com',
        status: 'new',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockRequest.params = { id: '1' };
      mockFindUnique.mockResolvedValue(mockLead);

      await getLeadById(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockFindUnique).toHaveBeenCalledWith({
        where: { id: '1' },
      });
      expect(mockResponse.json).toHaveBeenCalledWith(mockLead);
    });

    it('should return 404 when lead not found', async () => {
      mockRequest.params = { id: '999' };
      mockFindUnique.mockResolvedValue(null);

      await getLeadById(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Lead not found',
          status: 404,
        })
      );
    });
  });

  describe('updateLeadStatus', () => {
    it('should update lead status', async () => {
      const updatedLead = {
        id: '1',
        name: 'John Doe',
        status: 'contacted',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockRequest.params = { id: '1' };
      mockRequest.body = { status: 'contacted' };
      mockUpdate.mockResolvedValue(updatedLead);

      await updateLeadStatus(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockUpdate).toHaveBeenCalledWith({
        where: { id: '1' },
        data: { status: 'contacted' },
      });
      expect(mockResponse.json).toHaveBeenCalledWith(updatedLead);
    });

    it('should return error for invalid status', async () => {
      mockRequest.params = { id: '1' };
      mockRequest.body = { status: 'invalid' };

      await updateLeadStatus(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('Invalid status'),
          status: 400,
        })
      );
    });

    it('should return 404 when lead not found', async () => {
      mockRequest.params = { id: '999' };
      mockRequest.body = { status: 'contacted' };
      mockUpdate.mockRejectedValue({ code: 'P2025' });

      await updateLeadStatus(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Lead not found',
          status: 404,
        })
      );
    });
  });
});

