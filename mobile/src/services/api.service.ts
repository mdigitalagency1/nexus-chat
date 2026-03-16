import axios, { AxiosInstance } from 'axios';

const API_URL = 'https://api.zishanahamad.com';

const api: AxiosInstance = axios.create({
  baseURL: `${API_URL}/api`,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// Inject auth token
api.interceptors.request.use((config) => {
  const token = global.authToken || '';
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle token expiry
api.interceptors.response.use(
  (res) => res,
  async (err) => {
    if (err.response?.status === 401 && err.response?.data?.code === 'TOKEN_EXPIRED') {
      global.authToken = null;
    }
    return Promise.reject(err);
  }
);

export const authAPI = {
  sendOTP: (phone: string) => api.post('/auth/send-otp', { phone }),
  verifyOTP: (phone: string, otp: string, publicKey?: string) =>
    api.post('/auth/verify-otp', { phone, otp, publicKey }),
  registerKey: (publicKey: string, keyFingerprint: string) =>
    api.put('/auth/register-key', { publicKey, keyFingerprint }),
};

export const userAPI = {
  getMe: () => api.get('/users/me'),
  updateProfile: (data: any) => api.put('/users/me', data),
  searchUsers: (q: string) => api.get('/users/search', { params: { q } }),
  getUserProfile: (userId: string) => api.get(`/users/${userId}`),
  blockUser: (userId: string) => api.post(`/users/${userId}/block`),
};

export const chatAPI = {
  getChats: () => api.get('/chats'),
  createDirect: (userId: string) => api.post('/chats/direct', { userId }),
  createGroup: (name: string, description: string, memberIds: string[]) =>
    api.post('/chats/group', { name, description, memberIds }),
  getMessages: (chatId: string, before?: string, limit = 50) =>
    api.get(`/chats/${chatId}/messages`, { params: { before, limit } }),
  addMembers: (chatId: string, userIds: string[]) =>
    api.post(`/chats/${chatId}/members`, { userIds }),
  leaveGroup: (chatId: string) => api.delete(`/chats/${chatId}/leave`),
};

export const mediaAPI = {
  upload: (file: { uri: string; name: string; type: string }) => {
    const form = new FormData();
    form.append('file', file as any);
    return api.post('/media/upload', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};

export function setAuthToken(token: string) {
  global.authToken = token;
}

export function clearAuthToken() {
  global.authToken = null;
}

export default api;
