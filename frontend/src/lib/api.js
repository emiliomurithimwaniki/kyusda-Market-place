import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';

const apiClient = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('kyusda_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

function setToken(token) {
  if (!token) return;
  localStorage.setItem('kyusda_token', token);
}

function clearToken() {
  localStorage.removeItem('kyusda_token');
}

export const api = {
  setToken,
  clearToken,
  register: (payload) => apiClient.post('/api/accounts/register/', payload),
  login: async (payload) => {
    const { data } = await apiClient.post('/api/accounts/login/', payload);
    if (data?.access) setToken(data.access);
    return data;
  },
  me: () => apiClient.get('/api/accounts/me/'),
  getProfile: () => apiClient.get('/api/accounts/profile/'),
  updateProfile: (payload) => apiClient.patch('/api/accounts/profile/', payload),

  getCategories: () => apiClient.get('/api/marketplace/categories/'),
  getProducts: (params) => apiClient.get('/api/marketplace/products/', { params }),
  getProduct: (id) => apiClient.get(`/api/marketplace/products/${id}/`),
  getSeller: (id) => apiClient.get(`/api/marketplace/sellers/${id}/`),
};
