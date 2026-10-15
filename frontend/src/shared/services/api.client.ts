import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

export const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

function getAuthToken(): string | null {
  if (globalThis.window === undefined) return null;
  const local = localStorage.getItem('token');
  if (local) return local;
  const session = sessionStorage.getItem('token');
  if (session) return session;
  const cookieMatch = document.cookie.match(/(?:^|;\s*)token=([^;]+)/);
  if (cookieMatch) return decodeURIComponent(cookieMatch[1]);
  return null;
}

apiClient.interceptors.request.use(
  (config) => {
    const token = getAuthToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

apiClient.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    if (error.response && error.response.data && error.response.data.error) {
      const apiError = error.response.data.error as { code?: string; message?: string };
      return Promise.reject(
        Object.assign(new Error(apiError.message ?? 'Error de la API'), {
          code: apiError.code ?? 'API_ERROR',
        }),
      );
    }
    const networkError = new Error('No se pudo conectar al servidor.');
    (networkError as Error & { code: string }).code = 'NETWORK_ERROR';
    return Promise.reject(networkError);
  }
);
