import api from './api';

export interface QueueItem {
  id: string;
  inspectionId: string;
  status: string;
  assignedToId?: string;
  lockedAt?: string;
  assignedTo?: {
    name: string;
  };
  inspection: {
    protocol: string;
    placa: string;
    cliente: string;
    createdAt: string;
    createdBy?: {
      name: string;
    };
  };
}

export const queueService = {
  getAvailable: async () => {
    const response = await api.get<QueueItem[]>('/queue/available');
    return response.data;
  },

  getFinished: async () => {
    const response = await api.get<QueueItem[]>('/queue/finished');
    return response.data;
  },

  getDailyStats: async () => {
    const response = await api.get<{ name: string; count: number }[]>('/queue/stats/daily');
    return response.data;
  },

  getPendingCollection: async () => {
    const response = await api.get<QueueItem[]>('/queue/pending-collection');
    return response.data;
  },

  assign: async (inspectionId: string) => {



    const response = await api.post(`/queue/${inspectionId}/assign`);
    return response.data;
  },

  finish: async (inspectionId: string, status: string, comment?: string, rejectedPhotoIds?: string[]) => {
    const response = await api.post(`/queue/${inspectionId}/finish`, { status, comment, rejectedPhotoIds });
    return response.data;
  },

  getMyStats: async () => {
    const response = await api.get<{ finishedToday: number, myCurrent: number }>('/queue/stats/me');
    return response.data;
  },

  release: async (inspectionId: string) => {

    const response = await api.post(`/queue/${inspectionId}/release`);
    return response.data;
  },
};

