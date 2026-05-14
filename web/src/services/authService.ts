import api from './api';

export const authService = {
  login: async (dto: any) => {
    const response = await api.post('/auth/login', dto);
    if (response.data.access_token) {
      localStorage.setItem('token', response.data.access_token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
  },

  register: async (dto: any) => {
    const response = await api.post('/auth/register', dto);
    return response.data;
  },

  getUser: () => {

    if (typeof window === 'undefined') return null;
    const userStr = localStorage.getItem('user');
    if (!userStr) return null;
    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  },

  getToken: () => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('token');
  },

  logout: () => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  isAuthenticated: () => {
    if (typeof window === 'undefined') return false;
    return !!localStorage.getItem('token');
  },

  updateProfile: async (data: any) => {
    const response = await api.post('/auth/profile', data);
    // Atualiza o usuário no localStorage
    const currentUser = authService.getUser();
    localStorage.setItem('user', JSON.stringify({ ...currentUser, ...response.data }));
    return response.data;
  },

  changePassword: async (oldPass: string, newPass: string) => {
    const response = await api.post('/auth/change-password', { oldPass, newPass });
    return response.data;
  }
};

