import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';

const apiClient = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('kyusda_access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem('kyusda_refresh_token');
      if (refreshToken) {
        try {
          const { data } = await axios.post(`${API_BASE}/api/accounts/token/refresh/`, {
            refresh: refreshToken,
          });
          setToken(data.access, data.refresh);
          originalRequest.headers.Authorization = `Bearer ${data.access}`;
          return apiClient(originalRequest);
        } catch (refreshError) {
          clearToken();
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

function setToken(access, refresh) {
  if (access) localStorage.setItem('kyusda_access_token', access);
  if (refresh) localStorage.setItem('kyusda_refresh_token', refresh);
}

function clearToken() {
  localStorage.removeItem('kyusda_access_token');
  localStorage.removeItem('kyusda_refresh_token');
}

export const api = {
  setToken,
  clearToken,
  register: (payload) => apiClient.post('/api/accounts/register/', payload),
  verifyEmail: (payload) => apiClient.post('/api/accounts/verify-email/', payload),
  resendVerificationEmail: (payload) => apiClient.post('/api/accounts/verify-email/resend/', payload),
  login: async (payload) => {
    const { data } = await apiClient.post('/api/accounts/login/', payload);
    if (data?.access) setToken(data.access, data.refresh);
    return data;
  },
  createProduct: (payload) => apiClient.post('/api/marketplace/products/', payload),
  me: () => apiClient.get('/api/accounts/me/'),
  getProfile: () => apiClient.get('/api/accounts/profile/'),
  updateProfile: (payload) => apiClient.patch('/api/accounts/profile/', payload),

  getCategories: () => apiClient.get('/api/marketplace/categories/'),
  getProducts: (params) => apiClient.get('/api/marketplace/products/', { params }),
  getProduct: (id) => apiClient.get(`/api/marketplace/products/${id}/`),
  updateProduct: (id, payload) => apiClient.patch(`/api/marketplace/products/${id}/edit/`, payload),
  deleteProduct: (id) => apiClient.delete(`/api/marketplace/products/${id}/delete/`),
  getSeller: (id) => apiClient.get(`/api/marketplace/sellers/${id}/`),
  followSeller: (id) => apiClient.post(`/api/marketplace/sellers/${id}/follow/`),
  unfollowSeller: (id) => apiClient.delete(`/api/marketplace/sellers/${id}/follow/`),

  listConversations: () => apiClient.get('/api/chat/conversations/'),
  getConversations: () => apiClient.get('/api/chat/conversations/'),
  getOrCreateConversation: (userId) => apiClient.post(`/api/chat/conversations/user/${userId}/`),
  getMessages: (convId) => apiClient.get(`/api/chat/conversations/${convId}/messages/`),
  sendMessage: (convId, payload) => apiClient.post(`/api/chat/conversations/${convId}/messages/`, payload),
  getUnreadCount: () => apiClient.get('/api/chat/unread-count/'),
};
