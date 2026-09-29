import { Request, Response, NextFunction } from 'express';
import { createLead, getLeads, getLeadById, updateLeadStatus } from '../controllers/leads.controller';
import { AppError } from '../middleware/error.middleware';

// Mock the notification service (no SMTP in tests)
jest.mock('../services/notify', () => ({
  notifyNewLead: jest.fn(),
}));

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

const { notifyNewLead: mockNotifyNewLead } = require('../services/notify');
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
    mockNotifyNewLead.mockReset();
    mockNotifyNewLead.mockResolvedValue(undefined);
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

    it.each([
      ['email and phone', { name: 'John Doe' }],
      ['email', { name: 'John Doe', phone: '+1 555 123 4567' }],
      ['phone', { name: 'John Doe', email: 'john@example.com' }],
      ['name', { email: 'john@example.com', phone: '+1 555 123 4567' }],
    ])('should return error when %s is missing', async (_label, body) => {
      mockRequest.body = body;

      await createLead(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Missing required fields',
          status: 400,
        })
      );
      expect(mockCreate).not.toHaveBeenCalled();
    });

    it('should create a lead without company, budget or purchaseDate using defaults', async () => {
      const body = {
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+1 (555) 123-4567',
      };
      const createdLead = { id: '1', ...body, status: 'new' };

      mockRequest.body = body;
      mockCreate.mockResolvedValue(createdLead);

      await createLead(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockCreate).toHaveBeenCalledWith({
        data: {
          ...body,
          company: '',
          industry: null,
          productionVolume: null,
          budget: 'No especificado',
          purchaseDate: 'No especificado',
          message: null,
          status: 'new',
        },
      });
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith(createdLead);
      expect(mockNext).not.toHaveBeenCalled();
    });

    describe('lead notification', () => {
      const body = {
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+1 (555) 123-4567',
      };
      const createdLead = { id: '1', ...body, status: 'new' };

      beforeEach(() => {
        mockRequest.body = body;
        mockCreate.mockResolvedValue(createdLead);
      });

      it('notifies once with the created lead, after create and before the 201', async () => {
        await createLead(mockRequest as Request, mockResponse as Response, mockNext);

        expect(mockNotifyNewLead).toHaveBeenCalledTimes(1);
        expect(mockNotifyNewLead).toHaveBeenCalledWith(createdLead);

        const createOrder = mockCreate.mock.invocationCallOrder[0];
        const notifyOrder = mockNotifyNewLead.mock.invocationCallOrder[0];
        const statusOrder = (mockResponse.status as jest.Mock).mock.invocationCallOrder[0];
        expect(createOrder).toBeLessThan(notifyOrder);
        expect(notifyOrder).toBeLessThan(statusOrder);
      });

      it('waits for the notification before responding', async () => {
        let resolveNotify!: () => void;
        mockNotifyNewLead.mockReturnValue(new Promise<void>((resolve) => (resolveNotify = resolve)));

        const pending = createLead(mockRequest as Request, mockResponse as Response, mockNext);
        await new Promise((resolve) => setImmediate(resolve));
        expect(mockResponse.status).not.toHaveBeenCalled();

        resolveNotify();
        await pending;
        expect(mockResponse.status).toHaveBeenCalledWith(201);
      });

      it('still responds 201 and does not call next when the notification fails', async () => {
        const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
        mockNotifyNewLead.mockRejectedValue(new Error('SMTP down'));

        await createLead(mockRequest as Request, mockResponse as Response, mockNext);

        expect(mockResponse.status).toHaveBeenCalledWith(201);
        expect(mockResponse.json).toHaveBeenCalledWith(createdLead);
        expect(mockNext).not.toHaveBeenCalled();
        expect(errorSpy).toHaveBeenCalled();
        errorSpy.mockRestore();
      });

      it('does not notify when validation fails', async () => {
        mockRequest.body = { name: 'John Doe' };

        await createLead(mockRequest as Request, mockResponse as Response, mockNext);

        expect(mockNotifyNewLead).not.toHaveBeenCalled();
      });

      it('does not notify when the database write fails', async () => {
        mockCreate.mockRejectedValue(new Error('Database error'));

        await createLead(mockRequest as Request, mockResponse as Response, mockNext);

        expect(mockNotifyNewLead).not.toHaveBeenCalled();
        expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
      });
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

