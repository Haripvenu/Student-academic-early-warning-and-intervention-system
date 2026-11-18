import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api/v1';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach session token automatically from localStorage
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('arm_session_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
    config.headers['X-Session-Token'] = token;
  }
  return config;
});

// Map errors cleanly
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Session expired
      localStorage.removeItem('arm_session_token');
      localStorage.removeItem('arm_user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login?expired=1';
      }
    }
    const message = error.response?.data?.detail || error.message || 'Unknown network error';
    return Promise.reject(new Error(message));
  }
);
