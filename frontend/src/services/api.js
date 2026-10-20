import axios from 'axios';

const envApiUrl = import.meta.env?.VITE_API_URL;
const API_BASE = envApiUrl ? `${envApiUrl.replace(/\/$/, '')}` : '/api';

// Instância HTTP partilhada pela aplicação.
export const api = axios.create({
  baseURL: API_BASE,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});
const TOKEN_KEYS = ['nexo_token', 'token', 'learnspace_token'];

export function getAuthToken() {
  for (const storage of [sessionStorage, localStorage])
    for (const key of TOKEN_KEYS) {
      const token = storage.getItem(key);
      if (token) return token;
    }

  return null;
}

export function setAuthToken(token, remember = false) {
  removeAuthToken();
  (remember ? localStorage : sessionStorage).setItem('nexo_token', token);
}

export function removeAuthToken() {
  for (const storage of [sessionStorage, localStorage])
    for (const key of TOKEN_KEYS) storage.removeItem(key);
}

// Request Interceptor: inject Bearer JWT token into headers
api.interceptors.request.use(
  (config) => {
    const token = getAuthToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error),
);

// Response Interceptor: handle 401 Unauthorized and expired tokens
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const url = error.config?.url || '';
      const isAuthEndpoint = url.includes('/auth/login') || url.includes('/auth/register');
      if (!isAuthEndpoint) {
        removeAuthToken();
        if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
          window.location.href = '/login';
        }
      }
    }

    const message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      'Erro no pedido';
    const requestError = new Error(message);

    requestError.status = error.response?.status;
    requestError.code = error.code;

    return Promise.reject(requestError);
  },
);

export default api;
