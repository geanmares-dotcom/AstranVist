import api from './api';

export const tenantService = {
  getById: async (id: string) => {
    const response = await api.get(`/tenants/${id}`);
    return response.data;
  },

  update: async (id: string, data: { name?: string }) => {
    const response = await api.patch(`/tenants/${id}`, data);
    return response.data;
  }
};
