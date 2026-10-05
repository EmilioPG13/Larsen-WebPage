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

export type UnitStatus = 'DISPONIBLE' | 'APARTADA' | 'VENDIDA';
export type UnitModality = 'EN_BODEGA' | 'BAJO_PEDIDO';

export interface InventoryMovement {
  id: string;
  unitId: string;
  action: 'CREATE' | 'UPDATE' | 'STATUS' | 'IMPORT';
  fromStatus: UnitStatus | null;
  toStatus: UnitStatus | null;
  changes: Record<string, [unknown, unknown]> | null;
  createdAt: string;
  user: { id: string; name: string | null; email: string } | null;
}

export interface InventoryUnit {
  id: string;
  brand: string;
  model: string;
  gauge: string;
  serialNumber: string;
  status: UnitStatus;
  modality: UnitModality;
  receivedAt: string | null;
  soldAt: string | null;
  notes: string | null;
  machineId: string | null;
  createdAt: string;
  updatedAt: string;
  /** Latest movement only (the list endpoint sends at most one). */
  movements?: InventoryMovement[];
  /** When a reserved unit was reserved (null for any other status). */
  reservedSince?: string | null;
}

export interface ReportUnitRef {
  id: string;
  brand: string;
  model: string;
  gauge: string;
  serialNumber: string;
}

export interface MonthlyReport {
  month: string;
  summary: {
    arrivals: number;
    sales: number;
    reservations: number;
    stockAtClose: { available: number; reserved: number; total: number };
  };
  sales: (ReportUnitRef & { soldAt: string; daysInStock: number | null })[];
  responseTime: {
    measured: number;
    sameDay: number;
    averageDays: number | null;
    worstDays: number | null;
    notMeasurable: number;
  };
  aging: {
    onHand: number;
    withReceivedDate: number;
    withoutReceivedDate: number;
    averageDays: number | null;
    oldest: (ReportUnitRef & { receivedAt: string; days: number })[];
    averageDaysToSell: number | null;
  };
  staleAfterDays: number;
  staleReservations: (ReportUnitRef & { since: string; days: number })[];
}

export interface InventoryUnitInput {
  brand: string;
  model: string;
  gauge: string;
  serialNumber: string;
  modality?: UnitModality;
  receivedAt?: string | null;
  notes?: string | null;
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

  deleteUser: async (id: string) => {
    const response = await api.delete(`/users/${id}`);
    return response.data;
  },

  getMonthlyReport: async (month?: string): Promise<MonthlyReport> => {
    const response = await api.get('/inventory/report', { params: month ? { month } : undefined });
    return response.data;
  },

  getInventory: async (params?: { status?: UnitStatus; brand?: string; q?: string }): Promise<InventoryUnit[]> => {
    const response = await api.get('/inventory', { params });
    return response.data;
  },

  createInventoryUnit: async (data: InventoryUnitInput & { status?: UnitStatus; soldAt?: string }): Promise<InventoryUnit> => {
    const response = await api.post('/inventory', data);
    return response.data;
  },

  updateInventoryUnit: async (id: string, data: Partial<InventoryUnitInput> & { soldAt?: string | null }): Promise<InventoryUnit> => {
    const response = await api.put(`/inventory/${id}`, data);
    return response.data;
  },

  setInventoryStatus: async (id: string, status: UnitStatus, soldAt?: string): Promise<InventoryUnit> => {
    const response = await api.patch(`/inventory/${id}/status`, { status, ...(soldAt ? { soldAt } : {}) });
    return response.data;
  },

  getInventoryMovements: async (id: string): Promise<InventoryMovement[]> => {
    const response = await api.get(`/inventory/${id}/movements`);
    return response.data;
  },

  deleteInventoryUnit: async (id: string) => {
    const response = await api.delete(`/inventory/${id}`);
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

  deleteLead: async (id: string) => {
    const response = await api.delete(`/leads/${id}`);
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


