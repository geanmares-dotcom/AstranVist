import api from './api';

export interface Inspection {
  id: string;
  protocol: string;
  placa: string;
  cliente: string;
  status: string;
  createdAt: string;
  photos?: any[];
}

export const inspectionService = {
  getAll: async (filters?: any) => {
    const response = await api.get<Inspection[]>('/inspections', { params: filters });
    return response.data;
  },

  
  getById: async (id: string) => {
    const response = await api.get<Inspection>(`/inspections/admin/${id}`);
    return response.data;
  },

  getInitialPending: async () => {
    const response = await api.get('/inspections/pending/initial');
    return response.data;
  },

  getDashboardStats: async () => {
    const response = await api.get('/inspections/stats/dashboard');
    return response.data;
  },
};

