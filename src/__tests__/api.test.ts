import { describe, it, expect, vi, beforeEach } from 'vitest';
import axios from 'axios';
import { submitLead } from '../services/api';

// Mock axios
vi.mock('axios');
const mockedAxios = axios as any;

describe('API Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock axios.create to return a mock instance
    mockedAxios.create = vi.fn(() => mockedAxios);
    mockedAxios.post = vi.fn();
    mockedAxios.get = vi.fn();
    mockedAxios.put = vi.fn();
    mockedAxios.delete = vi.fn();
    mockedAxios.interceptors = {
      request: { use: vi.fn() },
      response: { use: vi.fn() },
    };
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

      mockedAxios.post.mockResolvedValue(mockResponse);

      const result = await submitLead(leadData);

      expect(mockedAxios.post).toHaveBeenCalledWith('/leads', leadData);
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

      mockedAxios.post.mockResolvedValue(mockResponse);

      const result = await submitLead(leadData);

      expect(mockedAxios.post).toHaveBeenCalledWith('/leads', leadData);
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

      mockedAxios.post.mockRejectedValue(errorResponse);

      await expect(submitLead(leadData)).rejects.toEqual(errorResponse);
      expect(mockedAxios.post).toHaveBeenCalledWith('/leads', leadData);
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
      mockedAxios.post.mockRejectedValue(networkError);

      await expect(submitLead(leadData)).rejects.toThrow('Network Error');
    });
  });
});

