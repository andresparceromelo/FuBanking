import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

export const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: attach token from localStorage
apiClient.interceptors.request.use(
  (config) => {
    // In Next.js, localStorage is only available on the client
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor: extract inner data from { success, data, message } wrapper
apiClient.interceptors.response.use(
  (response) => {
    // Return the response data (which is our standard API response object)
    return response.data;
  },
  (error) => {
    // Format error response so the frontend always gets a consistent error format
    if (error.response && error.response.data && error.response.data.error) {
      return Promise.reject(error.response.data.error);
    }
    return Promise.reject({
      code: 'NETWORK_ERROR',
      message: 'No se pudo conectar al servidor.',
    });
  }
);
