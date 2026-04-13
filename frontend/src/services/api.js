import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const login = (data) => api.post('/api/auth/login', data);
export const getMe = () => api.get('/api/auth/me');
export const registerStudent = (data) => api.post('/api/auth/register-student', data);

export const getStudents = () => api.get('/api/teacher/students');
export const deleteStudent = (id) => api.delete(`/api/teacher/students/${id}`);

export const uploadDocument = (formData) =>
  api.post('/api/documents/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
export const getDocuments = () => api.get('/api/documents');
export const getDocument = (id) => api.get(`/api/documents/${id}`);
export const deleteDocument = (id) => api.delete(`/api/documents/${id}`);

export const sendChat = (data) => api.post('/api/chat', data);
export const getChatHistory = (documentId) =>
  api.get('/api/chat/history', { params: { documentId } });

export default api;
