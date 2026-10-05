import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getCatalog, submitLead } from '../services/api';

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

  describe('getCatalog', () => {
    it('reads the live catalog and does not fall back to static data when it fails', async () => {
      const catalog = [{ brand: 'Steiger', model: 'Vesta Multi', units: [] }];
      mockGet.mockResolvedValueOnce({ data: catalog });
      await expect(getCatalog()).resolves.toEqual(catalog);
      expect(mockGet).toHaveBeenCalledWith('/catalog');

      mockGet.mockRejectedValueOnce(new Error('network'));
      await expect(getCatalog()).rejects.toThrow('network');
    });
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

// The response error handler registered when the module loaded, captured before any test clears the mocks.
const onResponseError = mockInterceptors.response.use.mock.calls[0][1] as (error: unknown) => Promise<never>;

describe('expired panel session', () => {
  const assign = vi.fn();
  const fail = (url: string) => ({ message: 'x', config: { url }, response: { status: 401, data: {} } });

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.setItem('admin_token', 'token');
    localStorage.setItem('admin_user', '{}');
  });

  const at = (pathname: string) => vi.stubGlobal('location', { pathname, assign });

  it('clears the session and goes to the login on a 401 inside the panel', async () => {
    at('/admin/leads');

    await expect(onResponseError(fail('/leads'))).rejects.toBeTruthy();

    expect(localStorage.getItem('admin_token')).toBeNull();
    expect(assign).toHaveBeenCalledWith('/admin/login');
  });

  it('leaves a wrong-password 401 on the login form alone', async () => {
    at('/admin/login');

    await expect(onResponseError(fail('/auth/login'))).rejects.toBeTruthy();

    expect(localStorage.getItem('admin_token')).toBe('token');
    expect(assign).not.toHaveBeenCalled();
  });

  it('ignores a 401 outside the panel', async () => {
    at('/maquinas');

    await expect(onResponseError(fail('/leads'))).rejects.toBeTruthy();

    expect(assign).not.toHaveBeenCalled();
  });
});
