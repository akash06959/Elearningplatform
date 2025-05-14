import axios from 'axios';

const BASE_URL = 'http://localhost:8000/api';

// Helper function to ensure proper URL construction
const buildUrl = (endpoint) => {
  // Remove leading/trailing slashes and combine with base URL
  const cleanEndpoint = endpoint.replace(/^\/+|\/+$/g, '');
  return `${cleanEndpoint}`;
};

// Create axios instance with base URL
const api = axios.create({
  baseURL: BASE_URL,
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
      console.log('Login attempt:', {
        username: credentials.username,
        user_type: credentials.user_type
      });

      // Make sure password is included in the request
      if (!credentials.password) {
        throw new Error('Password is required');
      }

      const response = await api.post('/api/login/', {
        username: credentials.username,
        password: credentials.password,
        user_type: credentials.user_type
      });

      console.log('Login response:', response);
      
      const responseData = response.data;
      if (!responseData || !responseData.access || !responseData.refresh) {
        throw new Error('Invalid response from server: Missing required fields');
      }
      
      // Store tokens
      const tokens = {
        access: responseData.access,
        refresh: responseData.refresh
      };
      localStorage.setItem('authTokens', JSON.stringify(tokens));

      // Set the authorization header for subsequent requests
      api.defaults.headers.common['Authorization'] = `Bearer ${tokens.access}`;
      
      // Return the complete user data
      return {
        username: responseData.username,
        user_type: responseData.user_type,
        first_name: responseData.first_name,
        last_name: responseData.last_name,
        ...tokens
      };
    } catch (error) {
      console.error('Login error:', error);
      
      // Handle specific error cases
      if (error.response?.status === 401) {
        throw new Error('Invalid username or password');
      }
      
      if (error.response?.status === 403) {
        throw new Error('Access denied. Please check your user type.');
      }
      
      throw new Error(
        error.response?.data?.message || 
        error.response?.data?.detail || 
        error.message || 
        'Login failed. Please try again.'
      );
    }
  },

  fetchProfile: async () => {
    try {
      const response = await api.get('/accounts/profile');
      return response.data;
    } catch (error) {
      console.error('Profile fetch error:', error.response?.data || error.message);
      throw new Error(
        error.response?.data?.message || 
        error.response?.data?.error || 
        'Failed to fetch profile data.'
      );
    }
  },

  refreshToken: async (refresh) => {
    try {
      const response = await api.post('/token/refresh', { refresh });
      return {
        access: response.data.access,
        refresh: refresh
      };
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
            localStorage.removeItem('user');
            
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