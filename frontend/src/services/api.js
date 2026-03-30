import axios from 'axios';

export const formatINR = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

export const formatINRCompact = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    notation: 'compact',
    compactDisplay: 'short',
  }).format(amount);
};

export const parseINR = (amount) => {
  return parseFloat(amount) || 0;
};

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
};

export const storesAPI = {
  getAll: () => api.get('/stores'),
  getOne: (id) => api.get(`/stores/${id}`),
  create: (data) => api.post('/stores', data),
  update: (id, data) => api.put(`/stores/${id}`, data),
  delete: (id) => api.delete(`/stores/${id}`),
};

export const productsAPI = {
  getAll: (params) => api.get('/products', { params }),
  getOne: (id) => api.get(`/products/${id}`),
  create: (data) => api.post('/products', data),
  update: (id, data) => api.put(`/products/${id}`, data),
  delete: (id) => api.delete(`/products/${id}`),
  bulkUpload: (storeId, file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post(`/products/bulk-upload?store_id=${storeId}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};

export const salesAPI = {
  getAll: (params) => api.get('/sales', { params }),
  getOne: (id) => api.get(`/sales/${id}`),
  create: (data) => api.post('/sales', data),
  getSummary: (params) => api.get('/sales/summary', { params }),
  getByDate: (params) => api.get('/sales/by-date', { params }),
};

export const forecastsAPI = {
  generate: (productId, days) => api.post(`/forecasts/${productId}?days=${days}`),
  get: (productId, days) => api.get(`/forecasts/${productId}?days=${days}`),
  getReorderSuggestion: (productId) => api.get(`/forecasts/reorder-suggestion/${productId}`),
};

export const alertsAPI = {
  getLowStock: (params) => api.get('/alerts', { params }),
  sendEmail: (data) => api.post('/alerts/send', data),
  getDashboard: (params) => api.get('/alerts/dashboard', { params }),
};

export default api;
