import api from '../../services/api';

export const adminApi = {
  login: async (email: string, password: string) => {
    const response = await api.post('/auth/login', { email, password });
    if (response.data.token) {
      localStorage.setItem('admin_token', response.data.token);
    }
    return response.data;
  },

  logout: () => {
    localStorage.removeItem('admin_token');
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


