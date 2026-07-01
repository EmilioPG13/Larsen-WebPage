import axios from 'axios';
import type { Product, Machine, ContactFormData } from '../types';
import machinesData from '../data/machines.json';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('admin_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Error interceptor for better error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
      url: error.config?.url,
    });
    return Promise.reject(error);
  }
);

// Products API
export const getProducts = async (): Promise<Product[]> => {
  const response = await api.get('/products');
  return response.data;
};

export const getProductById = async (id: string): Promise<Product> => {
  const response = await api.get(`/products/${id}`);
  return response.data;
};

// Machines API
// Falls back to the bundled static data when the backend isn't deployed
// (e.g. a static-only deploy), mirroring the resilience pattern used by
// sendQuoteLead in services/leads.ts.
export const getMachines = async (): Promise<Machine[]> => {
  try {
    const response = await api.get('/machines');
    return response.data;
  } catch {
    return machinesData as Machine[];
  }
};

export const getMachineById = async (id: string): Promise<Machine> => {
  try {
    const response = await api.get(`/machines/${id}`);
    return response.data;
  } catch {
    const machine = (machinesData as Machine[]).find((m) => m.id === id);
    if (!machine) throw new Error(`Machine not found: ${id}`);
    return machine;
  }
};

// Brands API
export const getBrands = async () => {
  const response = await api.get('/brands');
  return response.data;
};

// Leads API
export const submitLead = async (leadData: {
  name: string;
  email: string;
  phone: string;
  company: string;
  industry?: string;
  productionVolume?: string;
  budget: string;
  purchaseDate: string;
  message?: string;
}) => {
  const response = await api.post('/leads', leadData);
  return response.data;
};

// Contact API
export const submitContact = async (contactData: ContactFormData) => {
  const response = await api.post('/contact', {
    name: contactData.name,
    email: contactData.email,
    phone: contactData.phone,
    company: contactData.company,
    message: contactData.message,
    productId: contactData.productId,
  });
  return response.data;
};

// Admin API (for future admin panel)
export const adminApi = {
  login: async (email: string, password: string) => {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  },
  
  updateProductStock: async (id: string, data: { inStock?: boolean; quantity?: number }) => {
    const response = await api.put(`/products/${id}/stock`, data);
    return response.data;
  },
  
  updateMachineStock: async (id: string, data: { inStock?: boolean; quantity?: number }) => {
    const response = await api.put(`/machines/${id}/stock`, data);
    return response.data;
  },
};

export default api;


