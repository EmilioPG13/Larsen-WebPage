import { Request, Response, NextFunction } from 'express';
import { createLead, getLeads, getLeadById, updateLeadStatus, deleteLead, getStats } from '../controllers/leads.controller';
import { AppError } from '../middleware/error.middleware';
import prisma from '../config/database';
import { notifyNewLead, sendLeadConfirmation } from '../services/notify';

// Mock the notification service (no SMTP in tests)
jest.mock('../services/notify', () => ({
  notifyNewLead: jest.fn(),
  sendLeadConfirmation: jest.fn(),
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
      delete: jest.fn(),
      count: jest.fn(),
    },
    product: { count: jest.fn() },
    machine: { count: jest.fn() },
    inventoryUnit: { groupBy: jest.fn(), findUnique: jest.fn(), findMany: jest.fn() },
  },
}));

const mockNotifyNewLead = notifyNewLead as jest.Mock;
const mockSendLeadConfirmation = sendLeadConfirmation as jest.Mock;
const mockCreate = prisma.lead.create as unknown as jest.Mock;
const mockFindMany = prisma.lead.findMany as unknown as jest.Mock;
const mockFindUnique = prisma.lead.findUnique as unknown as jest.Mock;
const mockUpdate = prisma.lead.update as unknown as jest.Mock;
const mockDelete = prisma.lead.delete as unknown as jest.Mock;
const mockCount = prisma.lead.count as unknown as jest.Mock;
const mockProductCount = prisma.product.count as unknown as jest.Mock;
const mockMachineCount = prisma.machine.count as unknown as jest.Mock;
const mockUnitGroupBy = prisma.inventoryUnit.groupBy as unknown as jest.Mock;
const mockUnitFindUnique = prisma.inventoryUnit.findUnique as unknown as jest.Mock;
const mockUnitFindMany = prisma.inventoryUnit.findMany as unknown as jest.Mock;

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
    mockSendLeadConfirmation.mockReset();
    mockSendLeadConfirmation.mockResolvedValue(true);
  });

  describe('createLead', () => {
    describe('quote for one inventory unit', () => {
      const base = { name: 'Ana', email: 'ana@example.com', phone: '555' };

      beforeEach(() => {
        mockCreate.mockResolvedValue({ id: 'lead-1', ...base });
      });

      it('links the unit by id and stores its serial and the source', async () => {
        mockUnitFindUnique.mockResolvedValue({ id: 'unit-1', serialNumber: '6212/05' });
        mockRequest.body = { ...base, inventoryUnitId: 'unit-1', serialNumber: 'ignored', source: 'catalog-unit' };

        await createLead(mockRequest as Request, mockResponse as Response, mockNext);

        expect(mockUnitFindUnique).toHaveBeenCalledWith({
          where: { id: 'unit-1' },
          select: { id: true, serialNumber: true },
        });
        const data = mockCreate.mock.calls[0][0].data;
        expect(data).toMatchObject({
          inventoryUnitId: 'unit-1',
          serialNumber: '6212/05',
          source: 'catalog-unit',
        });
        expect(mockResponse.status).toHaveBeenCalledWith(201);
      });

      it('keeps the lead, without a link, when the unit id does not exist', async () => {
        mockUnitFindUnique.mockResolvedValue(null);
        mockRequest.body = { ...base, inventoryUnitId: 'gone', serialNumber: '333' };
        mockUnitFindMany.mockResolvedValue([]);

        await createLead(mockRequest as Request, mockResponse as Response, mockNext);

        const data = mockCreate.mock.calls[0][0].data;
        expect(data).not.toHaveProperty('inventoryUnitId');
        expect(data.serialNumber).toBe('333');
        expect(mockResponse.status).toHaveBeenCalledWith(201);
      });

      it('links by serial number only when exactly one unit has it', async () => {
        mockUnitFindMany.mockResolvedValue([{ id: 'unit-9', serialNumber: '298' }]);
        mockRequest.body = { ...base, serialNumber: '298' };

        await createLead(mockRequest as Request, mockResponse as Response, mockNext);

        expect(mockCreate.mock.calls[0][0].data).toMatchObject({ inventoryUnitId: 'unit-9', serialNumber: '298' });
      });

      it('does not guess when the serial number is shared by several units', async () => {
        mockUnitFindMany.mockResolvedValue([
          { id: 'a', serialNumber: '333' },
          { id: 'b', serialNumber: '333' },
        ]);
        mockRequest.body = { ...base, serialNumber: '333' };

        await createLead(mockRequest as Request, mockResponse as Response, mockNext);

        const data = mockCreate.mock.calls[0][0].data;
        expect(data).not.toHaveProperty('inventoryUnitId');
        expect(data.serialNumber).toBe('333');
      });

      it('ignores non-text values and caps the length of what it stores', async () => {
        mockRequest.body = { ...base, inventoryUnitId: { $ne: null }, serialNumber: 42, source: 'x'.repeat(200) };

        await createLead(mockRequest as Request, mockResponse as Response, mockNext);

        expect(mockUnitFindUnique).not.toHaveBeenCalled();
        const data = mockCreate.mock.calls[0][0].data;
        expect(data).not.toHaveProperty('inventoryUnitId');
        expect(data).not.toHaveProperty('serialNumber');
        expect(data.source).toHaveLength(60);
      });

      it('writes nothing extra for a plain quote', async () => {
        mockRequest.body = base;

        await createLead(mockRequest as Request, mockResponse as Response, mockNext);

        expect(mockUnitFindUnique).not.toHaveBeenCalled();
        expect(mockUnitFindMany).not.toHaveBeenCalled();
        const data = mockCreate.mock.calls[0][0].data;
        expect(data).not.toHaveProperty('inventoryUnitId');
        expect(data).not.toHaveProperty('serialNumber');
        expect(data).not.toHaveProperty('source');
      });
    });

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

    describe('confirmation to the customer', () => {
      const body = {
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+1 (555) 123-4567',
        source: 'home-quote',
      };
      const createdLead = { id: '1', ...body, status: 'new' };

      beforeEach(() => {
        mockRequest.body = body;
        mockCreate.mockResolvedValue(createdLead);
        mockCount.mockResolvedValue(0);
      });

      it('confirms the quote in Spanish by default', async () => {
        await createLead(mockRequest as Request, mockResponse as Response, mockNext);

        expect(mockSendLeadConfirmation).toHaveBeenCalledTimes(1);
        expect(mockSendLeadConfirmation).toHaveBeenCalledWith(createdLead, 'es');
        expect(mockResponse.status).toHaveBeenCalledWith(201);
      });

      it('answers in the language the visitor was browsing in, and falls back to Spanish', async () => {
        mockRequest.body = { ...body, language: 'en' };
        await createLead(mockRequest as Request, mockResponse as Response, mockNext);
        mockRequest.body = { ...body, language: 'klingon' };
        await createLead(mockRequest as Request, mockResponse as Response, mockNext);

        expect(mockSendLeadConfirmation.mock.calls[0][1]).toBe('en');
        expect(mockSendLeadConfirmation.mock.calls[1][1]).toBe('es');
      });

      it('does not store the language with the lead', async () => {
        mockRequest.body = { ...body, language: 'en' };

        await createLead(mockRequest as Request, mockResponse as Response, mockNext);

        expect(mockCreate.mock.calls[0][0].data).not.toHaveProperty('language');
      });

      it('does not confirm a spec-sheet download: nobody asked to be contacted', async () => {
        mockRequest.body = { ...body, source: 'spec-download' };
        mockCreate.mockResolvedValue({ ...createdLead, source: 'spec-download' });

        await createLead(mockRequest as Request, mockResponse as Response, mockNext);

        expect(mockSendLeadConfirmation).not.toHaveBeenCalled();
        expect(mockNotifyNewLead).toHaveBeenCalledTimes(1);
      });

      it.each([
        ['no at sign', 'not-an-email'],
        ['no domain suffix', 'a@b'],
        ['a space', 'a b@example.com'],
        ['over 254 characters', `${'x'.repeat(250)}@example.com`],
      ])(
        'does not write to a malformed address (%s)',
        async (_label, email) => {
          mockCreate.mockResolvedValue({ ...createdLead, email });

          await createLead(mockRequest as Request, mockResponse as Response, mockNext);

          expect(mockSendLeadConfirmation).not.toHaveBeenCalled();
          expect(mockResponse.status).toHaveBeenCalledWith(201);
        }
      );

      it('confirms at most once an hour per address, ignoring spec-sheet downloads', async () => {
        mockCount.mockResolvedValue(1);

        await createLead(mockRequest as Request, mockResponse as Response, mockNext);

        const where = mockCount.mock.calls[0][0].where;
        expect(where.id).toEqual({ not: '1' });
        expect(where.email).toEqual({ equals: 'john@example.com', mode: 'insensitive' });
        expect(where.createdAt.gte).toBeInstanceOf(Date);
        expect(Date.now() - where.createdAt.gte.getTime()).toBeLessThanOrEqual(60 * 60 * 1000 + 1000);
        expect(where.OR).toEqual([{ source: null }, { source: { not: 'spec-download' } }]);
        expect(mockSendLeadConfirmation).not.toHaveBeenCalled();
        expect(mockNotifyNewLead).toHaveBeenCalledTimes(1);
        expect(mockResponse.status).toHaveBeenCalledWith(201);
      });

      it('still responds 201, and still notifies the team, when the confirmation fails', async () => {
        const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
        mockSendLeadConfirmation.mockRejectedValue(new Error('SMTP down'));

        await createLead(mockRequest as Request, mockResponse as Response, mockNext);

        expect(mockNotifyNewLead).toHaveBeenCalledTimes(1);
        expect(mockResponse.status).toHaveBeenCalledWith(201);
        expect(mockResponse.json).toHaveBeenCalledWith(createdLead);
        expect(mockNext).not.toHaveBeenCalled();
        expect(errorSpy).toHaveBeenCalledWith('Failed to send lead confirmation:', expect.any(Error));
        errorSpy.mockRestore();
      });

      it('skips the confirmation, without failing the request, when the lookup fails', async () => {
        const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
        mockCount.mockRejectedValue(new Error('db down'));

        await createLead(mockRequest as Request, mockResponse as Response, mockNext);

        expect(mockSendLeadConfirmation).not.toHaveBeenCalled();
        expect(mockResponse.status).toHaveBeenCalledWith(201);
        errorSpy.mockRestore();
      });

      it('still responds 201 when the team notification fails but the confirmation goes out', async () => {
        const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
        mockNotifyNewLead.mockRejectedValue(new Error('SMTP down'));

        await createLead(mockRequest as Request, mockResponse as Response, mockNext);

        expect(mockSendLeadConfirmation).toHaveBeenCalledTimes(1);
        expect(mockResponse.status).toHaveBeenCalledWith(201);
        errorSpy.mockRestore();
      });

      it('sends nothing when validation or the database write fails', async () => {
        mockRequest.body = { name: 'John Doe' };
        await createLead(mockRequest as Request, mockResponse as Response, mockNext);
        mockRequest.body = body;
        mockCreate.mockRejectedValue(new Error('Database error'));
        await createLead(mockRequest as Request, mockResponse as Response, mockNext);

        expect(mockSendLeadConfirmation).not.toHaveBeenCalled();
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

  describe('deleteLead', () => {
    it('should delete the lead', async () => {
      mockRequest.params = { id: '1' };
      mockDelete.mockResolvedValue({ id: '1' });

      await deleteLead(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockDelete).toHaveBeenCalledWith({ where: { id: '1' } });
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Lead deleted successfully' });
    });

    it('should return 404 when lead not found', async () => {
      mockRequest.params = { id: '999' };
      mockDelete.mockRejectedValue({ code: 'P2025' });

      await deleteLead(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Lead not found',
          status: 404,
        })
      );
    });

    it('should forward unexpected errors', async () => {
      mockRequest.params = { id: '1' };
      const failure = new Error('db down');
      mockDelete.mockRejectedValue(failure);

      await deleteLead(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(failure);
    });
  });

  describe('getStats', () => {
    it('should return lead, product and machine counts including new leads', async () => {
      // lead.count is called for total, new today and new (status) in that order
      mockCount.mockResolvedValueOnce(10).mockResolvedValueOnce(2).mockResolvedValueOnce(4);
      // product.count: total, in stock, out of stock
      mockProductCount.mockResolvedValueOnce(5).mockResolvedValueOnce(3).mockResolvedValueOnce(2);
      // machine.count: total, in stock, out of stock
      mockMachineCount.mockResolvedValueOnce(6).mockResolvedValueOnce(4).mockResolvedValueOnce(2);
      // inventoryUnit.groupBy by status; a status with no units is simply absent
      mockUnitGroupBy.mockResolvedValueOnce([
        { status: 'DISPONIBLE', _count: { _all: 16 } },
        { status: 'VENDIDA', _count: { _all: 3 } },
      ]);

      await getStats(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockCount).toHaveBeenCalledWith({ where: { status: 'new' } });
      expect(mockResponse.json).toHaveBeenCalledWith({
        leads: { total: 10, newToday: 2, new: 4 },
        products: { total: 5, inStock: 3, outOfStock: 2 },
        machines: { total: 6, inStock: 4, outOfStock: 2 },
        inventory: { available: 16, reserved: 0, sold: 3 },
      });
    });

    it('should forward errors', async () => {
      const failure = new Error('db down');
      mockCount.mockRejectedValue(failure);

      await getStats(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(failure);
    });
  });
});
