'use client';

import axios from 'axios';

const getBaseURL = () => {
  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    // Se estiver acessando via localhost, fala com a API via localhost
    if (host === 'localhost' || host === '127.0.0.1') {
      return 'http://localhost:3001';
    }
    // Caso contrário (celular ou outro PC), fala via IP da rede
    return `http://${host}:3001`;
  }
  return 'http://localhost:3001';
};

const api = axios.create({
  baseURL: getBaseURL(),
});

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

export default api;
