import axios from 'axios';
import { store } from '../redux/store.js';
import { refreshTokenSuccess, logoutSuccess } from '../redux/authSlice.js';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Inject Access Token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Handle Token Refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Trigger token refresh if 401 and request has not been retried
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const rToken = localStorage.getItem('refreshToken');

      if (rToken) {
        try {
          const res = await axios.post('/api/auth/refresh-token', { token: rToken });
          const { accessToken, refreshToken } = res.data;

          store.dispatch(refreshTokenSuccess({ accessToken, refreshToken }));

          // Update header and retry request
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return api(originalRequest);
        } catch (refreshError) {
          // Refresh failed -> Log out user
          store.dispatch(logoutSuccess());
          window.location.href = '/login';
          return Promise.reject(refreshError);
        }
      }
    }

    return Promise.reject(error);
  }
);

export default api;
