import axios from 'axios';

// Tự động dùng /api khi production (HTTPS), dùng trực tiếp backend khi dev (HTTP)
const isProduction = window.location.protocol === 'https:';
const DEFAULT_BASE_URL = isProduction ? '/api' : 'http://157.245.155.77:8080';

export const API_BASE_URL =
  ((import.meta as any)?.env?.VITE_API_BASE_URL as string | undefined)?.trim() || DEFAULT_BASE_URL;

// Debug: Log ra URL đang dùng
console.log('🔧 API_BASE_URL:', API_BASE_URL);
console.log('🔧 Is Production:', isProduction);

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
  },//Mặc định gửi/nhận dữ liệu dạng JSON
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
    console.log('API Response:', {
      url: response.config.url,
      status: response.status,
      data: response.data,
    });
    return response;
  },
  (error) => {
    console.error('API Error:', {
      url: error.config?.url,
      status: error.response?.status,
      data: error.response?.data,
      message: error.message,
    });
    return Promise.reject(error);
  }
);


