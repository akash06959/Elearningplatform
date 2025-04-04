import axios from 'axios';

const BASE_URL = 'http://localhost:8000/api';
const MEDIA_URL = 'http://localhost:8000';

// Helper function to process image URLs
const processImageUrl = (url) => {
  if (!url) return null;
  if (url.startsWith('http')) return url;
  return `${MEDIA_URL}${url}`;
};

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
    // Log the full URL being requested
    console.log('Making request:', {
      fullUrl: `${BASE_URL}${config.url}`,
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

// Helper function to handle API errors
const handleApiError = (error) => {
  if (!error.response) {
    // Network error
    return new Error('Network error. Please check your connection and try again.');
  }
  
  // Get the error message from the response
  const errorMessage = error.response?.data?.message || 
                      error.response?.data?.detail || 
                      error.message || 
                      'An unexpected error occurred';
                      
  return new Error(errorMessage);
};

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

      // Process image URLs in the course data
      const processedResponse = {
        ...response,
        thumbnail: processImageUrl(response.thumbnail),
        cover_image: processImageUrl(response.cover_image),
        instructor: response.instructor ? {
          ...response.instructor,
          avatar: processImageUrl(response.instructor.avatar)
        } : null
      };

      console.log('Processed course details:', processedResponse);
      return processedResponse;
    } catch (error) {
      console.error('Error in getCourseById:', error);
      throw error;
    }
  },

  // Get all courses
  getCourses: async () => {
    try {
      console.log('\n=== Getting All Courses ===');
      const response = await api.get('/courses/');
      console.log('Raw API response:', response);
      
      let courses = [];
      if (Array.isArray(response)) {
        courses = response;
      } else if (response?.data) {
        courses = response.data;
      } else if (response?.results) {
        courses = response.results;
      } else if (response?.courses) {
        courses = response.courses;
      }

      // Process image URLs in the courses
      courses = courses.map(course => ({
        ...course,
        thumbnail: processImageUrl(course.thumbnail),
        cover_image: processImageUrl(course.cover_image)
      }));
      
      console.log('Processed courses:', courses);
      return courses.filter(course => course?.is_published);
    } catch (error) {
      console.error('Error in getCourses:', error);
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
      console.log('Checking enrollment status for course:', courseId);
      const response = await api.get(`/enrollments/api/courses/${courseId}/check-enrollment/`);
      console.log('Enrollment status response:', response);
      
      // Handle different response formats
      const isEnrolled = response?.is_enrolled || response?.enrolled || false;
      console.log('Processed enrollment status:', { isEnrolled });
      
      return {
        is_enrolled: isEnrolled,
        enrolled: isEnrolled // For backward compatibility
      };
    } catch (error) {
      console.error('Error checking enrollment status:', {
        courseId,
        error: error.message,
        response: error.response?.data
      });
      return { is_enrolled: false, enrolled: false };
    }
  },

  // Enroll in a course
  enrollInCourse: async (courseId) => {
    try {
      const response = await api.post(`/enrollments/api/courses/${courseId}/enroll/`);
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
      console.log('\n=== Getting Recent Courses ===');
      const response = await api.get('/courses/');  // Use the base courses endpoint
      console.log('GetRecentCourses Raw Response:', response);
      
      let courses = [];
      if (Array.isArray(response)) {
        courses = response;
      } else if (response?.data) {
        courses = response.data;
      } else if (response?.results) {
        courses = response.results;
      } else if (response?.courses) {
        courses = response.courses;
      }
      
      if (!Array.isArray(courses)) {
        console.error('Invalid courses data:', courses);
        return [];
      }
      
      console.log('Processed courses before filtering:', courses);
      
      // Filter published courses and sort by creation date
      const recentCourses = courses
        .filter(course => 
          course && 
          course.is_published && 
          (course.created_at || course.created || course.date_created)
        )
        .sort((a, b) => {
          const dateA = new Date(a.created_at || a.created || a.date_created);
          const dateB = new Date(b.created_at || b.created || b.date_created);
          return dateB - dateA;
        })
        .slice(0, 3);  // Get only the 3 most recent courses
      
      console.log('Final recent courses:', recentCourses);
      return recentCourses;
    } catch (error) {
      console.error('Error in getRecentCourses:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        stack: error.stack
      });
      return [];  // Return empty array instead of throwing
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
      console.log('\n=== Getting All Published Courses ===');
      const response = await api.get('/courses/list/');
      console.log('Raw API response:', response);
      
      // Handle different response formats
      let courses = [];
      if (Array.isArray(response)) {
        courses = response;
      } else if (response?.data && Array.isArray(response.data)) {
        courses = response.data;
      } else if (response?.results && Array.isArray(response.results)) {
        courses = response.results;
      } else {
        console.error('Unexpected response format:', response);
        return [];
      }
      
      console.log('All courses before processing:', courses);
      
      // Process and validate each course
      const processedCourses = courses
        .filter(course => course && course.id && course.title)
        .map(course => ({
          id: course.id,
          title: course.title,
          description: course.description || 'No description available',
          thumbnail: course.thumbnail_url || course.thumbnail || null,
          cover_image: course.cover_image_url || course.cover_image || null,
          instructor: {
            name: course.instructor?.name || course.instructor?.username || 
                  (typeof course.instructor === 'string' ? course.instructor : 'Unknown'),
            username: course.instructor?.username || 
                     (typeof course.instructor === 'string' ? course.instructor : 'Unknown')
          },
          category: typeof course.category === 'object' ? 
                   course.category?.name || 'Uncategorized' : 
                   course.category || 'Uncategorized',
          difficulty: course.difficulty || 'Not specified',
          duration_in_weeks: course.duration_in_weeks || 'N/A',
          price: parseFloat(course.price || 0),
          total_students: parseInt(course.total_students || 0),
          rating: parseFloat(course.rating || 0),
          is_published: true
        }));
      
      console.log('Final processed courses:', processedCourses);
      return processedCourses;
    } catch (error) {
      console.error('Error in getAllCourses:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        stack: error.stack
      });
      return [];
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

  getEnrolledStudents: async () => {
    try {
      const response = await api.get('/courses/instructor/enrolled-students/');
      console.log('Enrolled students raw response:', response);
      
      // Handle different response formats
      let students = [];
      if (Array.isArray(response)) {
        students = response;
      } else if (response?.data) {
        students = response.data;
      } else if (response?.students) {
        students = response.students;
      }
      
      console.log('Processed enrolled students:', students);
      return students;
    } catch (error) {
      console.error('Error fetching enrolled students:', error);
      throw handleApiError(error);
    }
  },

  getCourseEnrollments: async () => {
    try {
      const response = await api.get('/courses/instructor/enrollments/');
      console.log('Course enrollments raw response:', response);
      
      // Handle different response formats
      let enrollments = [];
      if (Array.isArray(response)) {
        enrollments = response;
      } else if (response?.data) {
        enrollments = response.data;
      } else if (response?.enrollments) {
        enrollments = response.enrollments;
      }
      
      console.log('Processed course enrollments:', enrollments);
      return enrollments;
    } catch (error) {
      console.error('Error fetching course enrollments:', error);
      throw handleApiError(error);
    }
  },

  removeStudent: async (studentId) => {
    try {
      const response = await api.delete(`/courses/instructor/remove-student/${studentId}/`);
      console.log('Remove student raw response:', response);
      return response;
    } catch (error) {
      console.error('Error removing student:', error);
      throw handleApiError(error);
    }
  }
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