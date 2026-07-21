import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT token if present
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ── Compiler ──────────────────────────────────────────────────────────────────
export const compileCode = (code, language) =>
  api.post('/compile', { code, language }).then((r) => r.data);

export const explainPhase = (phase, context = '') =>
  api.post('/explain', { phase, context }).then((r) => r.data);

// ── Auth ──────────────────────────────────────────────────────────────────────
export const register = (username, email, password) =>
  api.post('/auth/register', { username, email, password }).then((r) => r.data);

export const login = (email, password) =>
  api.post('/auth/login', { email, password }).then((r) => r.data);

export const getMe = () => api.get('/auth/me').then((r) => r.data);

// ── History ───────────────────────────────────────────────────────────────────
export const getHistory = () => api.get('/history').then((r) => r.data);

export const saveHistory = (language, code, results) =>
  api.post('/history', { language, code, results }).then((r) => r.data);

export const deleteHistory = (id) =>
  api.delete(`/history/${id}`).then((r) => r.data);

export default api;
