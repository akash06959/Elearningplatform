import axios from 'axios';

// Create axios instance with base URL
const api = axios.create({
  baseURL: 'http://localhost:8000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

export const authAPI = {
  register: async (userData) => {
    try {
      console.log('Registration request:', userData);
      const response = await api.post('/register/', userData);
      console.log('Registration response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Registration error:', error.response?.data || error.message);
      throw new Error(
        error.response?.data?.message || 
        error.response?.data?.error || 
        'Registration failed. Please try again.'
      );
    }
  },

  login: async (credentials) => {
    try {
      console.log('Login request:', {
        username: credentials.username,
        user_type: credentials.user_type
      });
      const response = await api.post('/login/', credentials);
      console.log('Login response:', response.data);
      
      if (!response.data.access || !response.data.refresh || !response.data.user_type) {
        throw new Error('Invalid response from server: Missing required fields');
      }

      return response.data;
    } catch (error) {
      console.error('Login error:', error.response?.data || error.message);
      throw new Error(
        error.response?.data?.message || 
        error.response?.data?.error || 
        'Login failed. Please check your credentials and try again.'
      );
    }
  },

  refreshToken: async (refresh) => {
    try {
      const response = await api.post('/token/refresh/', { refresh });
      return response.data;
    } catch (error) {
      console.error('Token refresh error:', error);
      throw error;
    }
  },

  // Add request interceptor to add auth token
  setupInterceptors: (navigate) => {
    api.interceptors.request.use(
      (config) => {
        const authTokens = localStorage.getItem('authTokens');
        if (authTokens) {
          const tokens = JSON.parse(authTokens);
          config.headers.Authorization = `Bearer ${tokens.access}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Add response interceptor to handle token refresh
    api.interceptors.response.use(
      (response) => response.data,
      async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            const authTokens = JSON.parse(localStorage.getItem('authTokens'));
            if (!authTokens?.refresh) {
              throw new Error('No refresh token available');
            }

            const newTokens = await authAPI.refreshToken(authTokens.refresh);
            localStorage.setItem('authTokens', JSON.stringify(newTokens));

            originalRequest.headers.Authorization = `Bearer ${newTokens.access}`;
            return api(originalRequest);
          } catch (refreshError) {
            console.error('Token refresh failed:', refreshError);
            localStorage.removeItem('authTokens');
            localStorage.removeItem('user_type');
            localStorage.removeItem('username');
            if (navigate) {
              navigate('/login');
            }
            throw refreshError;
          }
        }

        return Promise.reject(error);
      }
    );
  }
}; 