import axios from 'axios';

const BASE_URL = 'http://localhost:8000/api';

// Create axios instance with default config
const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const authTokens = localStorage.getItem('authTokens');
    if (authTokens) {
      const tokens = JSON.parse(authTokens);
      if (tokens.access) {
        config.headers.Authorization = `Bearer ${tokens.access}`;
      }
    }
    console.log('Making request:', {
      url: config.url,
      method: config.method,
      headers: config.headers,
      authTokens: !!authTokens
    });
    return config;
  },
  (error) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor to handle common errors
api.interceptors.response.use(
  (response) => {
    console.log('Response received:', {
      url: response.config.url,
      status: response.status,
      data: response.data
    });
    return response.data;
  },
  async (error) => {
    console.error('Response error:', {
      url: error.config?.url,
      status: error.response?.status,
      data: error.response?.data,
      message: error.message
    });
    
    // Handle 401 Unauthorized error
    if (error.response?.status === 401) {
      const authTokens = localStorage.getItem('authTokens');
      if (authTokens) {
        try {
          const tokens = JSON.parse(authTokens);
          // Try to refresh the token
          const response = await axios.post(`${BASE_URL}/auth/token/refresh/`, {
            refresh: tokens.refresh
          });
          
          if (response.data.access) {
            // Update the access token
            tokens.access = response.data.access;
            localStorage.setItem('authTokens', JSON.stringify(tokens));
            
            // Retry the original request with new token
            error.config.headers.Authorization = `Bearer ${response.data.access}`;
            return axios(error.config);
          }
        } catch (refreshError) {
          console.error('Token refresh failed:', refreshError);
          // If refresh fails, logout user
          localStorage.removeItem('authTokens');
          window.location.href = '/login';
          return Promise.reject(new Error('Session expired. Please log in again.'));
        }
      } else {
        // No auth tokens found
        window.location.href = '/login';
        return Promise.reject(new Error('Please log in to continue'));
      }
    }
    
    // Handle network errors
    if (!error.response) {
      return Promise.reject(new Error('Network error. Please check your connection and try again.'));
    }
    
    // Handle other errors
    const errorMessage = error.response?.data?.message || error.response?.data?.detail || error.message || 'An unexpected error occurred';
    return Promise.reject(new Error(errorMessage));
  }
);

// Course-related API calls
export const courseAPI = {
  // Get instructor's courses
  getInstructorCourses: async () => {
    try {
      console.log('\n=== Getting Instructor Courses ===');
      console.log('Auth tokens present:', !!localStorage.getItem('authTokens'));
      if (localStorage.getItem('authTokens')) {
        const tokens = JSON.parse(localStorage.getItem('authTokens'));
        console.log('Access token present:', !!tokens.access);
      }
      
      const response = await api.get('/courses/instructor/courses/');
      console.log('Instructor courses raw response:', response);
      
      let courses = [];
      if (Array.isArray(response)) {
        courses = response;
      } else if (response?.courses) {
        courses = response.courses;
      } else if (response?.results) {
        courses = response.results;
      }
      
      console.log('Processed instructor courses:', courses);
      return courses;
    } catch (error) {
      console.error('Error in getInstructorCourses:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      throw error;
    }
  },

  // Update course status (publish/unpublish)
  updateCourseStatus: async (courseId, status) => {
    try {
      console.log('\n=== Updating Course Status ===');
      console.log('Course ID:', courseId);
      console.log('New Status:', status);
      
      const response = await api.patch(`/courses/${courseId}/update-status/`, {
        status: status
      });
      
      console.log('Update status response:', response);
      return {
        status: 'success',
        course: response,
        message: `Course ${status === 'published' ? 'published' : 'unpublished'} successfully`
      };
    } catch (error) {
      console.error('Error in updateCourseStatus:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      throw error;
    }
  },

  // Get course details by ID
  getCourseById: async (courseId) => {
    try {
      console.log('\n=== Getting Course Details ===');
      console.log('Course ID:', courseId);
      
      const response = await api.get(`/courses/${courseId}/`);
      console.log('Course details raw response:', response);
      return response;
    } catch (error) {
      console.error('Error in getCourseById:', error);
      throw error;
    }
  },

  // Get all courses
  getCourses: async () => {
    try {
      console.log('\n=== Getting All Courses ===');
      const response = await api.get('/courses/courses/');
      console.log('Raw API response:', response);
      
      let courses = [];
      if (Array.isArray(response)) {
        courses = response;
      } else if (response?.courses) {
        courses = response.courses;
      } else if (response?.results) {
        courses = response.results;
      }
      
      console.log('Processed courses:', courses);
      return courses.filter(course => course?.is_published);
    } catch (error) {
      console.error('Error in getCourses:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      return [];
    }
  },

  // Get enrolled courses
  getEnrolledCourses: async () => {
    try {
      console.log('\n=== Getting Enrolled Courses ===');
      const response = await api.get('/courses/enrolled/');
      console.log('GetEnrolledCourses Raw Response:', response);
      
      let courses = [];
      if (Array.isArray(response)) {
        courses = response;
      } else if (response?.courses) {
        courses = response.courses;
      } else if (response?.results) {
        courses = response.results;
      }
      
      console.log('Processed enrolled courses:', courses);
      return courses;
    } catch (error) {
      console.error('Error in getEnrolledCourses:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      return [];
    }
  },

  // Check enrollment status
  checkEnrollmentStatus: async (courseId) => {
    try {
      const response = await api.get(`/courses/${courseId}/enrollment-status/`);
      return response;
    } catch (error) {
      console.error('Error checking enrollment status:', error);
      throw error;
    }
  },

  // Enroll in a course
  enrollInCourse: async (courseId) => {
    try {
      const response = await api.post(`/courses/${courseId}/enroll/`);
      return response;
    } catch (error) {
      console.error('Error enrolling in course:', error);
      throw error;
    }
  },

  // Search courses
  searchCourses: async (query) => {
    try {
      const response = await api.get(`/courses/?search=${query}`);
      return response?.results || response || [];
    } catch (error) {
      console.error('Error in searchCourses:', error);
      return [];
    }
  },

  // Get recently added courses
  getRecentCourses: async () => {
    try {
      console.log('Fetching recent courses...');
      const response = await api.get('/courses/');
      console.log('GetRecentCourses Raw Response:', response);
      
      let courses = [];
      if (Array.isArray(response)) {
        courses = response;
      } else if (response?.courses) {
        courses = response.courses;
      } else if (response?.results) {
        courses = response.results;
      }
      
      console.log('Processed recent courses:', courses);
      // Sort by created_at in descending order and limit to recent courses
      return courses
        .filter(course => course?.is_published)
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .slice(0, 5); // Show only 5 most recent courses
    } catch (error) {
      console.error('Error in getRecentCourses:', error);
      return [];
    }
  },

  // Get random courses for recommendations
  getRandomCourses: async () => {
    try {
      console.log('Fetching random courses from /api/courses/');
      const response = await api.get('/api/courses/');
      console.log('GetRandomCourses Raw Response:', response);
      
      let courses = [];
      if (Array.isArray(response)) {
        courses = response;
      } else if (response?.courses) {
        courses = response.courses;
      } else if (response?.results) {
        courses = response.results;
      }
      
      console.log('Processed random courses:', courses);
      // Filter published courses and get random 3
      const publishedCourses = courses.filter(course => course?.is_published);
      return publishedCourses
        .sort(() => Math.random() - 0.5)
        .slice(0, 3);
    } catch (error) {
      console.error('Error in getRandomCourses:', error);
      return [];
    }
  },

  // Get courses by category
  getCoursesByCategory: async (category) => {
    try {
      const response = await api.get(`/courses/?category=${category}`);
      return response?.results || response || [];
    } catch (error) {
      console.error('Error in getCoursesByCategory:', error);
      return [];
    }
  },

  // Get courses by institution
  getCoursesByInstitution: async (institution) => {
    const response = await api.get(`/courses/?institution=${institution}`);
    return response;
  },

  // Update course progress
  updateProgress: async (courseId, data) => {
    try {
      const response = await api.post(`/courses/${courseId}/progress/`, data);
      return response;
    } catch (error) {
      console.error('Error in updateProgress:', error);
      throw error;
    }
  },

  // Rate a course
  rateCourse: async (courseId, rating, review) => {
    const response = await api.post(`/courses/${courseId}/reviews/`, {
      rating,
      review
    });
    return response;
  },

  // Get all published courses (for students)
  getAllCourses: async () => {
    try {
      console.log('Fetching all courses...');
      const response = await api.get('/courses/');
      console.log('Raw API response:', response);
      
      // Handle different response formats
      let courses = [];
      if (Array.isArray(response)) {
        courses = response;
      } else if (response?.courses && Array.isArray(response.courses)) {
        courses = response.courses;
      } else if (response?.results && Array.isArray(response.results)) {
        courses = response.results;
      } else if (response?.data && Array.isArray(response.data)) {
        courses = response.data;
      }
      
      console.log('Processed courses:', courses);
      
      // Filter only published courses
      const publishedCourses = courses.filter(course => course.is_published);
      console.log('Published courses:', publishedCourses);
      
      return publishedCourses;
    } catch (error) {
      console.error('Error in getAllCourses:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      throw new Error(error.response?.data?.message || 'Failed to fetch courses');
    }
  },

  // Delete course
  deleteCourse: async (courseId) => {
    const response = await api.delete(`/courses/${courseId}/`);
    return response;
  },

  // Get course progress
  getCourseProgress: async (courseId) => {
    try {
      console.log('Fetching course progress for ID:', courseId);
      const response = await api.get(`/courses/courses/${courseId}/progress/`);
      console.log('Course progress response:', response);
      return response;
    } catch (error) {
      console.error('Error fetching course progress:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch course progress');
    }
  },

  // Get course content with modules, sections, and lessons
  getCourseContent: async (courseId) => {
    try {
      console.log('Fetching course content for ID:', courseId);
      const response = await api.get(`/courses/courses/${courseId}/content/`);
      console.log('Course content response:', response);
      return response;
    } catch (error) {
      console.error('Error fetching course content:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch course content');
    }
  },

  // Mark lesson as completed
  completeLesson: async (lessonId) => {
    try {
      console.log('Marking lesson as completed:', lessonId);
      const response = await api.post(`/courses/lessons/${lessonId}/complete/`);
      console.log('Complete lesson response:', response);
      return response;
    } catch (error) {
      console.error('Error completing lesson:', error);
      throw new Error(error.response?.data?.message || 'Failed to mark lesson as complete');
    }
  },
};

// Enrollment-related API calls
export const enrollmentAPI = {
  checkEnrollment: async (courseId) => {
    try {
      console.log('Checking enrollment for course ID:', courseId);
      const response = await api.get(`/enrollments/courses/${courseId}/check-enrollment/`);
      return response;
    } catch (error) {
      console.error('Error checking enrollment for course', courseId, ':', error);
      throw error;
    }
  },

  dropCourse: async (courseId) => {
    if (!courseId) {
      throw new Error('Course ID is required to drop course');
    }
    
    try {
      console.log(`Dropping course ID: ${courseId}`);
      const response = await api.post(`/courses/${courseId}/drop/`);
      console.log('Drop course response:', response);
      return response;
    } catch (error) {
      console.error(`Error dropping course ${courseId}:`, error);
      throw new Error(error.message || 'Failed to drop course');
    }
  }
};

// Authentication-related API calls
export const authAPI = {
  login: async (credentials) => {
    try {
      console.log('\n=== Login Request ===');
      console.log('Login credentials:', {
        username: credentials.username,
        user_type: credentials.user_type
      });
      
      const response = await api.post('/api/login/', credentials);
      console.log('Login raw response:', response);
      
      // Validate response has required fields
      if (!response.access || !response.refresh || !response.user_type) {
        console.error('Invalid login response:', response);
        throw new Error('Invalid response from server: Missing required fields');
      }
      
      // Convert user types to lowercase for comparison
      const responseUserType = response.user_type.toLowerCase();
      const requestedUserType = credentials.user_type.toLowerCase();
      
      console.log('User type validation:', {
        requested: requestedUserType,
        received: responseUserType,
        matches: responseUserType === requestedUserType
      });
      
      if (responseUserType !== requestedUserType) {
        throw new Error(`You do not have ${requestedUserType} privileges. Please login with the correct account type.`);
      }
      
      return {
        ...response,
        user_type: responseUserType // Return lowercase user_type
      };
    } catch (error) {
      console.error('Login error:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      throw error;
    }
  },

  logout: async () => {
    try {
      console.log('\n=== Logout ===');
      localStorage.removeItem('authTokens');
      localStorage.removeItem('user_type');
      localStorage.removeItem('username');
      window.location.href = '/login';
    } catch (error) {
      console.error('Logout error:', error);
      // Still remove items even if API call fails
      localStorage.removeItem('authTokens');
      localStorage.removeItem('user_type');
      localStorage.removeItem('username');
      window.location.href = '/login';
    }
  },

  refreshToken: async () => {
    try {
      console.log('\n=== Token Refresh ===');
      const authTokens = localStorage.getItem('authTokens');
      if (!authTokens) {
        throw new Error('No refresh token available');
      }

      const tokens = JSON.parse(authTokens);
      const response = await api.post('/auth/token/refresh/', {
        refresh: tokens.refresh
      });

      if (!response.access) {
        throw new Error('Invalid response from server: Missing access token');
      }

      // Update only the access token
      tokens.access = response.access;
      localStorage.setItem('authTokens', JSON.stringify(tokens));

      return tokens;
    } catch (error) {
      console.error('Token refresh error:', error);
      // If refresh fails, force logout
      localStorage.removeItem('authTokens');
      localStorage.removeItem('user_type');
      localStorage.removeItem('username');
      window.location.href = '/login';
      throw error;
    }
  },

  // Request password reset
  requestPasswordReset: async (email) => {
    try {
      const response = await api.post('/auth/password-reset/', { email });
      return response;
    } catch (error) {
      console.error('Error in requestPasswordReset:', error);
      throw error;
    }
  },

  // Reset password
  resetPassword: async (token, newPassword) => {
    try {
      const response = await api.post('/auth/password-reset/confirm/', {
        token,
        new_password: newPassword
      });
      return response;
    } catch (error) {
      console.error('Error in resetPassword:', error);
      throw error;
    }
  },

  // Register
  register: async (userData) => {
    try {
      const response = await api.post('/auth/register/', userData);
      return response;
    } catch (error) {
      console.error('Error in register:', error);
      throw error;
    }
  },

  getCurrentUser: async () => {
    return await api.get('/auth/user/');
  }
};

// Progress-related API calls
export const progressAPI = {
  getLessonProgress: async (courseId, lessonId) => {
    return await api.get(`/courses/courses/${courseId}/lessons/${lessonId}/progress/`);
  },

  updateLessonProgress: async (courseId, lessonId, data) => {
    return await api.post(`/courses/courses/${courseId}/lessons/${lessonId}/progress/`, data);
  },

  getCourseProgress: async (courseId) => {
    return await api.get(`/courses/courses/${courseId}/progress/`);
  },

  markLessonAccessed: async (courseId, lessonId) => {
    try {
      return await api.post(`/courses/courses/${courseId}/progress/${lessonId}/access/`);
    } catch (error) {
      console.error('Error marking lesson as accessed:', error);
      throw error;
    }
  },

  markLessonComplete: async (courseId, lessonId) => {
    try {
      return await api.post(`/courses/courses/${courseId}/progress/${lessonId}/complete/`);
    } catch (error) {
      console.error('Error marking lesson as complete:', error);
      throw error;
    }
  },

  saveNotes: async (courseId, lessonId, notes) => {
    try {
      return await api.post(`/courses/courses/${courseId}/progress/${lessonId}/notes/`, { notes });
    } catch (error) {
      console.error('Error saving notes:', error);
      throw error;
    }
  }
};

export default api; 