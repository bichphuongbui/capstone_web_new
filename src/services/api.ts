import axios from 'axios';

const DEFAULT_BASE_URL = 'http://157.245.155.77:8080';

export const API_BASE_URL =
  ((import.meta as any)?.env?.VITE_API_BASE_URL as string | undefined)?.trim() || DEFAULT_BASE_URL;

export const ACCESS_TOKEN_STORAGE_KEY = 'access_token';

export function getAccessToken(): string | null {
  try {
    return localStorage.getItem(ACCESS_TOKEN_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function setAccessToken(token: string | null | undefined) {
  try {
    if (!token) localStorage.removeItem(ACCESS_TOKEN_STORAGE_KEY);
    else localStorage.setItem(ACCESS_TOKEN_STORAGE_KEY, token);
  } catch {}
}

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  // Chấp nhận mọi status code (không throw error cho 201, 204, etc.)
  validateStatus: (status) => status >= 200 && status < 500,
});

api.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers = config.headers ?? {};
    (config.headers as any).Authorization = `Bearer ${token}`;
  }
  return config;
});

// Log response để debug
api.interceptors.response.use(
  (response) => {
    console.log('📥 API Response:', {
      url: response.config.url,
      status: response.status,
      data: response.data,
    });
    return response;
  },
  (error) => {
    console.error('❌ API Error:', {
      url: error.config?.url,
      status: error.response?.status,
      data: error.response?.data,
      message: error.message,
    });
    return Promise.reject(error);
  }
);


