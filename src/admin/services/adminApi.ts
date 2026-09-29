import api from '../../services/api';
import { storeSession, clearSession, type AdminRole, type AdminUser } from './session';

export interface ManagedUser {
  id: string;
  email: string;
  name: string | null;
  role: AdminRole;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export const adminApi = {
  login: async (email: string, password: string) => {
    const response = await api.post('/auth/login', { email, password });
    storeSession(response.data.token ?? null, response.data.user ?? null);
    return response.data;
  },

  logout: () => {
    clearSession();
  },

  /** Current user from the server. Also refreshes the stored user. */
  getMe: async (): Promise<AdminUser & { active: boolean }> => {
    const response = await api.get('/auth/me');
    storeSession(null, response.data);
    return response.data;
  },

  changePassword: async (currentPassword: string, newPassword: string) => {
    const response = await api.put('/auth/password', { currentPassword, newPassword });
    return response.data;
  },

  getUsers: async (): Promise<ManagedUser[]> => {
    const response = await api.get('/users');
    return response.data;
  },

  createUser: async (data: {
    email: string;
    name?: string;
    role: AdminRole;
    password: string;
  }): Promise<ManagedUser> => {
    const response = await api.post('/users', data);
    return response.data;
  },

  updateUser: async (
    id: string,
    data: { name?: string; role?: AdminRole; active?: boolean }
  ): Promise<ManagedUser> => {
    const response = await api.put(`/users/${id}`, data);
    return response.data;
  },

  resetUserPassword: async (id: string, password: string) => {
    const response = await api.put(`/users/${id}/password`, { password });
    return response.data;
  },

  getStats: async () => {
    const response = await api.get('/leads/stats');
    return response.data;
  },

  getLeads: async (params?: { status?: string; page?: number; limit?: number }) => {
    const response = await api.get('/leads', { params });
    return response.data;
  },

  updateLeadStatus: async (id: string, status: string) => {
    const response = await api.put(`/leads/${id}/status`, { status });
    return response.data;
  },

  getProducts: async () => {
    const response = await api.get('/products');
    return response.data;
  },

  createProduct: async (productData: any) => {
    const response = await api.post('/products', productData);
    return response.data;
  },

  updateProduct: async (id: string, productData: any) => {
    const response = await api.put(`/products/${id}`, productData);
    return response.data;
  },

  deleteProduct: async (id: string) => {
    const response = await api.delete(`/products/${id}`);
    return response.data;
  },

  updateProductStock: async (id: string, data: { inStock?: boolean; quantity?: number }) => {
    const response = await api.put(`/products/${id}/stock`, data);
    return response.data;
  },

  getMachines: async () => {
    const response = await api.get('/machines');
    return response.data;
  },

  createMachine: async (machineData: any) => {
    const response = await api.post('/machines', machineData);
    return response.data;
  },

  updateMachine: async (id: string, machineData: any) => {
    const response = await api.put(`/machines/${id}`, machineData);
    return response.data;
  },

  deleteMachine: async (id: string) => {
    const response = await api.delete(`/machines/${id}`);
    return response.data;
  },

  updateMachineStock: async (id: string, data: { inStock?: boolean; quantity?: number }) => {
    const response = await api.put(`/machines/${id}/stock`, data);
    return response.data;
  },

  getBrands: async () => {
    const response = await api.get('/brands');
    return response.data;
  },

  createBrand: async (brandData: any) => {
    const response = await api.post('/brands', brandData);
    return response.data;
  },

  updateBrand: async (id: string, brandData: any) => {
    const response = await api.put(`/brands/${id}`, brandData);
    return response.data;
  },

  deleteBrand: async (id: string) => {
    const response = await api.delete(`/brands/${id}`);
    return response.data;
  },
};


