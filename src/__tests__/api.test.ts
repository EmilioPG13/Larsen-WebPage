import { describe, it, expect, vi, beforeEach } from 'vitest';
import { submitLead } from '../services/api';

// Use vi.hoisted to define mocks before vi.mock is hoisted
const { mockPost, mockGet, mockPut, mockDelete, mockInterceptors } = vi.hoisted(() => {
  const mockPost = vi.fn();
  const mockGet = vi.fn();
  const mockPut = vi.fn();
  const mockDelete = vi.fn();
  const mockInterceptors = {
    request: { use: vi.fn() },
    response: { use: vi.fn() },
  };
  return { mockPost, mockGet, mockPut, mockDelete, mockInterceptors };
});

// Mock axios
vi.mock('axios', () => ({
  default: {
    create: vi.fn(() => ({
      post: mockPost,
      get: mockGet,
      put: mockPut,
      delete: mockDelete,
      interceptors: mockInterceptors,
    })),
  },
}));

describe('API Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('submitLead', () => {
    it('should submit lead with all required fields', async () => {
      const leadData = {
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+1 (555) 123-4567',
        company: 'Test Company',
        budget: '$25,000 - $50,000',
        purchaseDate: '1-3 meses',
      };

      const mockResponse = {
        data: {
          id: '1',
          ...leadData,
          status: 'new',
          createdAt: new Date().toISOString(),
        },
      };

      mockPost.mockResolvedValue(mockResponse);

      const result = await submitLead(leadData);

      expect(mockPost).toHaveBeenCalledWith('/leads', leadData);
      expect(result).toEqual(mockResponse.data);
    });

    it('should submit lead with optional fields', async () => {
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

      const mockResponse = {
        data: {
          id: '1',
          ...leadData,
          status: 'new',
          createdAt: new Date().toISOString(),
        },
      };

      mockPost.mockResolvedValue(mockResponse);

      const result = await submitLead(leadData);

      expect(mockPost).toHaveBeenCalledWith('/leads', leadData);
      expect(result).toEqual(mockResponse.data);
    });

    it('should handle API errors', async () => {
      const leadData = {
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+1 (555) 123-4567',
        company: 'Test Company',
        budget: '$25,000 - $50,000',
        purchaseDate: '1-3 meses',
      };

      const errorResponse = {
        response: {
          status: 400,
          data: { error: 'Missing required fields' },
        },
      };

      mockPost.mockRejectedValue(errorResponse);

      await expect(submitLead(leadData)).rejects.toEqual(errorResponse);
      expect(mockPost).toHaveBeenCalledWith('/leads', leadData);
    });

    it('should handle network errors', async () => {
      const leadData = {
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+1 (555) 123-4567',
        company: 'Test Company',
        budget: '$25,000 - $50,000',
        purchaseDate: '1-3 meses',
      };

      const networkError = new Error('Network Error');
      mockPost.mockRejectedValue(networkError);

      await expect(submitLead(leadData)).rejects.toThrow('Network Error');
    });
  });
});

