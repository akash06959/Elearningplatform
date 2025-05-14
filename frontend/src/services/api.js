import axios from 'axios';

const BASE_URL = process.env.REACT_APP_BASE_URL || 'http://localhost:8000/api';
const MEDIA_URL = 'http://localhost:8000';

// Helper function to process image URLs
const processImageUrl = (url) => {
  if (!url) return null;
  if (url.startsWith('http')) return url;
  return `${MEDIA_URL}${url}`;
};

// Helper function to ensure proper URL construction
const buildUrl = (endpoint) => {
  // Remove leading/trailing slashes
  const cleanEndpoint = endpoint.replace(/^\/+|\/+$/g, '');
  return cleanEndpoint;
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
    // Get auth tokens from localStorage
    const authTokens = localStorage.getItem('authTokens');
    
    // Log the current state of auth
    console.log('Auth state:', {
      hasAuthTokens: !!authTokens,
      configUrl: config.url,
      method: config.method
    });
    
    if (authTokens) {
      try {
        const tokens = JSON.parse(authTokens);
        if (tokens?.access) {
          // Ensure token is properly formatted
          config.headers.Authorization = `Bearer ${tokens.access.trim()}`;
          console.log('Added auth token to request');
        } else {
          console.warn('No access token found in authTokens');
        }
      } catch (e) {
        console.error('Error parsing authTokens:', e);
      }
    } else {
      console.warn('No authTokens found in localStorage');
    }
    
    // Clean up URL to prevent double /api/
    config.url = buildUrl(config.url);
    
    // Log the full request details
    console.log('Making request:', {
      fullUrl: `${config.baseURL}/${config.url}`,
      method: config.method,
      headers: config.headers,
      hasAuth: !!config.headers.Authorization
    });
    
    return config;
  },
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor to handle common errors
api.interceptors.response.use(
  (response) => {
    console.log('Response received:', {
      url: response.config.url,
      status: response.status,
      hasData: !!response.data
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
    
    // Handle 401 Unauthorized error (token expired)
    if (error.response?.status === 401) {
      console.log('Handling 401 error - attempting token refresh');
      const authTokens = localStorage.getItem('authTokens');
      
      if (authTokens) {
        try {
          const tokens = JSON.parse(authTokens);
          if (!tokens.refresh) {
            throw new Error('No refresh token available');
          }
          
          // Try to refresh the token
          console.log('Attempting to refresh token');
          const response = await axios.post(`${BASE_URL}/token/refresh/`, {
            refresh: tokens.refresh.trim()
          });
          
          if (response.data?.access) {
            console.log('Token refresh successful');
            // Update the access token
            tokens.access = response.data.access;
            localStorage.setItem('authTokens', JSON.stringify(tokens));
            
            // Update the failed request's token and retry
            error.config.headers.Authorization = `Bearer ${response.data.access.trim()}`;
            return axios(error.config);
          } else {
            console.error('Token refresh response missing access token');
            throw new Error('Invalid token refresh response');
          }
        } catch (refreshError) {
          console.error('Token refresh failed:', refreshError);
          // Clear auth data and redirect to login
          localStorage.removeItem('authTokens');
          localStorage.removeItem('user_type');
          localStorage.removeItem('username');
          window.location.href = '/login';
          return Promise.reject(new Error('Session expired. Please log in again.'));
        }
      }
      
      // No auth tokens found
      console.log('No auth tokens found for refresh attempt');
      window.location.href = '/login';
      return Promise.reject(new Error('Please log in to continue'));
    }
    
    // Handle 403 Forbidden error
    if (error.response?.status === 403) {
      console.error('403 Forbidden error:', error.response?.data);
      // Check if this is a token validation error
      if (error.response?.data?.detail?.includes('token') || 
          error.response?.data?.detail?.includes('credentials')) {
        // Clear auth data and redirect to login
        localStorage.removeItem('authTokens');
        localStorage.removeItem('user_type');
        localStorage.removeItem('username');
        window.location.href = '/login';
        return Promise.reject(new Error('Invalid authentication. Please log in again.'));
      }
      return Promise.reject(new Error('You do not have permission to access this resource'));
    }
    
    // Handle network errors
    if (!error.response) {
      return Promise.reject(new Error('Network error. Please check your connection and try again.'));
    }
    
    // Handle other errors
    const errorMessage = error.response?.data?.detail || 
                        error.response?.data?.message || 
                        error.message || 
                        'An unexpected error occurred';
    return Promise.reject(new Error(errorMessage));
  }
);

// Helper function to handle API errors
// eslint-disable-next-line no-unused-vars
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
      
      const response = await api.get('courses/instructor/courses/');
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
      
      // Validate status value
      if (status !== 'draft' && status !== 'published') {
        throw new Error('Invalid status value. Must be "draft" or "published"');
      }
      
      const endpoint = `courses/instructor/courses/${courseId}/update_status/`;
      const payload = {
        status: status,
        is_published: status === 'published'
      };
      
      console.log('Using endpoint:', endpoint);
      console.log('With payload:', payload);
      
      const response = await api.patch(endpoint, payload);
      
      console.log('Response:', {
        status: response.status,
        statusText: response.statusText,
        data: response.data
      });
      
      if (response && response.data) {
        return {
          status: 'success',
          course: response.data.course,
          message: response.data.message || `Course ${status} successfully`
        };
      }
      
      throw new Error('No response data received');
    } catch (error) {
      console.error('Error in updateCourseStatus:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        details: error.response?.data?.detail || error.response?.data?.message,
        stack: error.stack
      });
      
      // Log the full error object for debugging
      console.error('Full error object:', error);
      
      throw new Error(
        error.response?.data?.message || 
        error.response?.data?.detail || 
        error.message || 
        'Failed to update course status'
      );
    }
  },

  // Get course details by ID
  getCourseById: async (courseId) => {
    try {
      console.log('\n=== Getting Course Details ===');
      console.log('Course ID:', courseId);
      
      // Try multiple endpoints
      const endpoints = [
        `/api/courses/${courseId}/detail/`,
        `/api/courses/instructor/courses/${courseId}/`,
        `/api/courses/instructor/courses/${courseId}/detail/`,
        `/api/courses/${courseId}/`,
        `/api/courses/detail/${courseId}/`
      ];
      
      let response = null;
      let lastError = null;
      
      // Try each endpoint until one works
      for (const endpoint of endpoints) {
        try {
          console.log(`Trying endpoint: ${endpoint}`);
          response = await api.get(endpoint);
          console.log('Found working endpoint:', endpoint);
          break;
        } catch (error) {
          console.log(`Error with endpoint ${endpoint}:`, {
            status: error.response?.status,
            message: error.message
          });
          
          // If not a 404, this is a "real" error with a valid endpoint
          if (error.response?.status !== 404) {
            throw error;
          }
          
          lastError = error;
        }
      }
      
      // If all endpoints failed, throw the last error
      if (!response) {
        throw lastError || new Error('All endpoints failed');
      }
      
      console.log('Course details full response:', response);
      
      if (!response) {
        throw new Error('No course data received');
      }
      
      let course = null;
      
      if (response.course) {
        course = response.course;
      } else {
        course = response;
      }
      
      // Process image URLs
      if (course.thumbnail) {
        course.thumbnail = processImageUrl(course.thumbnail);
      }
      if (course.cover_image) {
        course.cover_image = processImageUrl(course.cover_image);
      }
      
      // Ensure enrollment status is properly set - if not present, try to get it
      if (course.enrolled === undefined && course.is_enrolled === undefined) {
        try {
          console.log('Enrollment status not in course data, checking separately');
          const enrollmentStatus = await courseAPI.checkEnrollmentStatus(courseId);
          console.log('Got enrollment status:', enrollmentStatus);
          course.is_enrolled = enrollmentStatus.isEnrolled;
          course.enrolled = enrollmentStatus.isEnrolled;
        } catch (enrollmentError) {
          console.error('Error getting enrollment status:', enrollmentError);
          // Default to false to be safe
          course.is_enrolled = false;
          course.enrolled = false;
        }
      }
      
      // Process course modules for learning interface
      if (course.modules && Array.isArray(course.modules)) {
        course.modules.forEach(module => {
          // Ensure each module has proper order and sections
          module.order = module.order || module.id;
          
          if (module.sections && Array.isArray(module.sections)) {
            module.sections.forEach(section => {
              // Set defaults for sections
              section.content_type = section.content_type || 'video';
              section.video_url = section.video_url || '';
              section.pdf_url = section.pdf_url || '';
            });
          } else {
            module.sections = [];
          }
        });
        
        // Sort modules by order
        course.modules.sort((a, b) => a.order - b.order);
      } else {
        course.modules = [];
      }
      
      // Process course quizzes
      if (course.quizzes && Array.isArray(course.quizzes)) {
        course.quizzes.forEach(quiz => {
          // Make sure each quiz has questions
          if (!quiz.questions || !Array.isArray(quiz.questions)) {
            quiz.questions = [];
          }
        });
      } else {
        course.quizzes = [];
      }
      
      console.log('Processed course details:', course);
      return course;
    } catch (error) {
      console.error('Error in getCourseById:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      throw new Error('Failed to load course details. Please try again later.');
    }
  },

  // Create a new course
  createCourse: async (courseData) => {
    try {
      console.log('\n=== Creating New Course ===');
      
      // Validate required fields
      if (!courseData.get('title') || !courseData.get('description') || !courseData.get('category')) {
        throw new Error('Title, description, and category are required');
      }

      // Log the form data for debugging
      console.log('Course data being sent:');
      for (let [key, value] of courseData.entries()) {
        if (key === 'modules' || key === 'quizzes') {
          console.log(`${key}: ${value.substring(0, 100)}...`); // Log first 100 chars of JSON
        } else if (key === 'thumbnail') {
          console.log(`${key}: [File object]`);
        } else {
          console.log(`${key}: ${value}`);
        }
      }

      // Make sure we have auth token
      const authTokens = localStorage.getItem('authTokens');
      if (!authTokens) {
        throw new Error('Authentication required');
      }

      // Set up headers with authentication
      const headers = {
        'Authorization': `Bearer ${JSON.parse(authTokens).access}`
      };

      // Make the request
      const response = await axios.post(`${BASE_URL}/api/courses/create/`, courseData, {
        headers,
        // This is important - don't let axios transform the FormData
        transformRequest: [(data) => data]
      });

      console.log('Course creation response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error in createCourse:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });

      // Handle specific error cases
      if (error.response?.status === 400) {
        const errorData = error.response.data;
        let errorMessage = 'Course creation failed:';
        
        if (typeof errorData === 'object') {
          Object.entries(errorData).forEach(([field, errors]) => {
            if (Array.isArray(errors)) {
              errorMessage += `\n${field}: ${errors.join(', ')}`;
            } else if (typeof errors === 'string') {
              errorMessage += `\n${field}: ${errors}`;
            }
          });
        } else {
          errorMessage += ' ' + (errorData.error || errorData.message || 'Invalid data provided');
        }
        
        throw new Error(errorMessage);
      }

      if (error.response?.status === 401) {
        throw new Error('Authentication failed. Please log in again.');
      }

      if (error.response?.status === 500) {
        throw new Error('Server error. Please try again later.');
      }

      throw new Error(error.response?.data?.error || error.message || 'Failed to create course');
    }
  },
  
  // Update an existing course
  updateCourse: async (courseId, courseData) => {
    try {
      console.log('\n=== Updating Course ===');
      console.log('Course ID:', courseId);
      
      // Check if this is a FormData with PDF uploads
      if (courseData instanceof FormData && courseData.get('pdf_uploads_count')) {
        console.log('Detected PDF uploads in course data, using file upload endpoint');
        return courseAPI.updateCourseWithFiles(courseId, courseData);
      }
      
      // Log important parts of the form data for debugging
      if (courseData instanceof FormData) {
        console.log('Course data is FormData');
        // Check if modules_json and quizzes_json are present in the FormData
        const modulesJson = courseData.get('modules_json');
        const quizzesJson = courseData.get('quizzes_json');
        
        console.log('modules_json present:', !!modulesJson);
        console.log('quizzes_json present:', !!quizzesJson);
        
        if (modulesJson) {
          try {
            const modules = JSON.parse(modulesJson);
            console.log('Number of modules:', modules.length);
            console.log('First module sample:', modules[0]);
          } catch (e) {
            console.error('Error parsing modules_json:', e);
          }
        }
        
        if (quizzesJson) {
          try {
            const quizzes = JSON.parse(quizzesJson);
            console.log('Number of quizzes:', quizzes.length);
            console.log('First quiz sample:', quizzes[0]);
          } catch (e) {
            console.error('Error parsing quizzes_json:', e);
          }
        }
      } else {
        console.log('Course data keys:', Object.keys(courseData));
      }
      
      // Try multiple potential endpoints in sequence with different HTTP methods
      const endpointOptions = [
        // PATCH methods
        { url: `/api/courses/instructor/courses/${courseId}/update/`, method: 'patch' },
        { url: `/api/courses/instructor/courses/${courseId}/`, method: 'patch' },
        { url: `/api/courses/instructor/${courseId}/update/`, method: 'patch' },
        { url: `/api/courses/${courseId}/update/`, method: 'patch' },
        { url: `/api/courses/${courseId}/`, method: 'patch' },
        { url: `/api/courses/update-course/${courseId}/`, method: 'patch' },
        { url: `/instructor/courses/${courseId}/update/`, method: 'patch' },
        { url: `/instructor/courses/${courseId}/`, method: 'patch' },
        
        // PUT methods
        { url: `/api/courses/instructor/courses/${courseId}/update/`, method: 'put' },
        { url: `/api/courses/instructor/courses/${courseId}/`, method: 'put' },
        { url: `/api/courses/instructor/${courseId}/update/`, method: 'put' },
        { url: `/api/courses/${courseId}/update/`, method: 'put' },
        { url: `/api/courses/${courseId}/`, method: 'put' },
        { url: `/api/courses/update-course/${courseId}/`, method: 'put' },
        { url: `/instructor/courses/${courseId}/update/`, method: 'put' },
        { url: `/instructor/courses/${courseId}/`, method: 'put' },
        
        // POST methods
        { url: `/api/courses/instructor/courses/${courseId}/update/`, method: 'post' },
        { url: `/api/courses/instructor/courses/${courseId}/`, method: 'post' },
        { url: `/api/courses/instructor/${courseId}/update/`, method: 'post' },
        { url: `/api/courses/${courseId}/update/`, method: 'post' },
        { url: `/api/courses/${courseId}/`, method: 'post' },
        { url: `/api/courses/update-course/${courseId}/`, method: 'post' },
        { url: `/instructor/courses/${courseId}/update/`, method: 'post' },
        { url: `/instructor/courses/${courseId}/`, method: 'post' }
      ];
      
      let lastError = null;
      
      // Try each endpoint until one works
      for (const { url, method } of endpointOptions) {
        try {
          console.log(`Trying ${method.toUpperCase()} to endpoint: ${url}`);
          
          // Determine if we're sending FormData or JSON data
          const isFormData = courseData instanceof FormData;
          const headers = {
            'Authorization': `Bearer ${JSON.parse(localStorage.getItem('authTokens')).access}`
          };
          
          // Only set Content-Type for JSON data, let browser set it for FormData
          if (!isFormData) {
            headers['Content-Type'] = 'application/json';
          }
          
          let response;
          // Build request config
          const config = {
            url: url,
            method: method,
            headers: headers,
            data: courseData,
            // This is important - don't let axios transform the FormData
            transformRequest: isFormData ? [
              (data) => {
                console.log('Not transforming FormData');
                return data;
              }
            ] : undefined
          };
          
          // Make the request
          response = await axios(config);
          
          // Extract data from response
          const responseData = response.data;
          console.log(`${method.toUpperCase()} to ${url} was successful:`, responseData);
          
          // Extra validation to ensure modules and quizzes were saved
          if (!responseData || (!responseData.modules && !responseData.quizzes && !responseData.modules_json && !responseData.quizzes_json)) {
            console.warn('Response doesn\'t contain modules or quizzes data, but the request was successful');
          }
          
          return responseData;
        } catch (error) {
          console.log(`Error with ${method.toUpperCase()} to endpoint ${url}:`, {
            status: error.response?.status,
            message: error.message
          });
          
          // If not a 404, this is a "real" error with a valid endpoint
          if (error.response?.status !== 404) {
            throw error;
          }
          
          lastError = error;
        }
      }
      
      // If we've tried all endpoints and none worked, throw the last error
      throw lastError || new Error('All endpoints failed');
    } catch (error) {
      console.error('Error in updateCourse:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      throw new Error(error.response?.data?.message || error.message || 'Failed to update course');
    }
  },

  // Update a course with file uploads (PDFs)
  updateCourseWithFiles: async (courseId, courseData) => {
    try {
      console.log('\n=== Updating Course with Files ===');
      console.log('Course ID:', courseId);
      
      // Ensure we're using FormData
      if (!(courseData instanceof FormData)) {
        throw new Error('courseData must be FormData when using updateCourseWithFiles');
      }
      
      // Use the dedicated endpoint for file uploads
      const url = `/api/courses/instructor/courses/${courseId}/update-with-files/`;
      
      // Set up headers with authentication
      const headers = {
        'Authorization': `Bearer ${JSON.parse(localStorage.getItem('authTokens')).access}`
      };
      
      // Log what we're sending
      console.log('Sending FormData to:', url);
      console.log('PDF uploads count:', courseData.get('pdf_uploads_count'));
      
      // Make the request
      const response = await axios.post(url, courseData, {
        headers,
        // This is important - don't let axios transform the FormData
        transformRequest: [
          (data) => {
            console.log('Not transforming FormData for file upload');
            return data;
          }
        ]
      });
      
      console.log('Course update with files successful:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error in updateCourseWithFiles:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      throw new Error(error.response?.data?.message || error.message || 'Failed to update course with files');
    }
  },
  
  // Upload a PDF file to a specific section
  uploadSectionPDF: async (courseId, sectionId, pdfFile) => {
    try {
      console.log('\n=== Uploading Section PDF ===');
      console.log('Course ID:', courseId, 'Section ID:', sectionId);
      
      // Create FormData for the file
      const formData = new FormData();
      formData.append('pdf_file', pdfFile);
      
      // Use the PDF upload endpoint
      const url = `/api/courses/instructor/courses/${courseId}/sections/${sectionId}/upload-pdf/`;
      
      // Set up headers with authentication
      const headers = {
        'Authorization': `Bearer ${JSON.parse(localStorage.getItem('authTokens')).access}`
      };
      
      // Make the request
      const response = await axios.post(url, formData, {
        headers,
        transformRequest: [
          (data) => {
            console.log('Not transforming FormData for PDF upload');
            return data;
          }
        ]
      });
      
      console.log('PDF upload successful:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error in uploadSectionPDF:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      throw new Error(error.response?.data?.message || error.message || 'Failed to upload PDF');
    }
  },

  // Get all courses
  getAllCourses: async (filters = {}) => {
    try {
      console.log('\n=== Getting All Courses ===');
      console.log('Filters:', filters);
      
      // Verify authentication before making request
      const authTokens = localStorage.getItem('authTokens');
      if (!authTokens) {
        console.error('No authentication tokens found');
        throw new Error('Please log in to view courses');
      }
      
      // Parse tokens to verify structure
      try {
        const tokens = JSON.parse(authTokens);
        if (!tokens.access) {
          console.error('No access token found in authTokens');
          throw new Error('Invalid authentication. Please log in again.');
        }
      } catch (e) {
        console.error('Error parsing authTokens:', e);
        throw new Error('Authentication error. Please log in again.');
      }
      
      // Build query string from filters
      const queryParams = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) queryParams.append(key, value);
      });
      
      const queryString = queryParams.toString();
      const url = `courses${queryString ? `?${queryString}` : ''}`;
      
      console.log('Request URL:', url);
      
      const response = await api.get(url);
      console.log('All courses response:', response);
      
      let courses = [];
      
      if (Array.isArray(response)) {
        courses = response;
      } else if (response?.courses) {
        courses = response.courses;
      } else if (response?.results) {
        courses = response.results;
      }
      
      // Process image URLs
      courses = courses.map(course => ({
        ...course,
        thumbnail: processImageUrl(course.thumbnail || course.thumbnail_url),
        thumbnail_url: processImageUrl(course.thumbnail || course.thumbnail_url),
        cover_image: processImageUrl(course.cover_image || course.cover_image_url)
      }));
      
      console.log('Processed all courses:', courses);
      return courses;
    } catch (error) {
      console.error('Error in getAllCourses:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      
      // Handle specific error cases
      if (error.response?.status === 401 || error.response?.status === 403) {
        throw new Error('Please log in to view courses');
      }
      
      throw new Error(error.response?.data?.detail || error.message || 'Failed to load courses. Please try again later.');
    }
  },

  // Alias for getAllCourses to maintain backward compatibility
  getCourses: async (filters = {}) => {
    console.log('\n=== Using getCourses alias for getAllCourses ===');
    return courseAPI.getAllCourses(filters);
  },

  // Get recently added courses
  getRecentCourses: async (limit = 3) => {
    console.log('\n=== Getting Recent Courses ===');
    try {
      // Get all courses and sort by creation date
      const allCourses = await courseAPI.getAllCourses();
      
      // Sort courses by creation date (newest first)
      const sortedCourses = [...allCourses].sort((a, b) => {
        const dateA = new Date(a.created_at || a.created || 0);
        const dateB = new Date(b.created_at || b.created || 0);
        return dateB - dateA; // descending order (newest first)
      });
      
      // Return the specified number of courses
      const recentCourses = sortedCourses.slice(0, limit);
      console.log(`Returning ${recentCourses.length} recent courses`);
      return recentCourses;
    } catch (error) {
      console.error('Error in getRecentCourses:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      throw new Error('Failed to load recent courses. Please try again later.');
    }
  },

  // Get enrolled courses
  getEnrolledCourses: async () => {
    try {
      console.log('\n=== Getting Enrolled Courses ===');
      
      // Try multiple potential endpoints that might contain enrolled courses
      const endpoints = [
        '/api/courses/enrolled/',
        '/api/courses/enrolled/',
        '/api/enrollments/courses/',
      ];
      
      let response = null;
      let error = null;
      
      // Try each endpoint until one works
      for (const endpoint of endpoints) {
        try {
          console.log(`Trying endpoint for enrolled courses: ${endpoint}`);
          response = await api.get(endpoint);
          console.log(`Successful response from ${endpoint}:`, response);
          break; // Exit the loop on success
        } catch (endpointError) {
          console.log(`Error with endpoint ${endpoint}:`, {
            status: endpointError.response?.status,
            message: endpointError.message
          });
          
          // If this is not a 404, it's a meaningful error
          if (endpointError.response?.status !== 404) {
            error = endpointError;
            break;
          }
          
          error = endpointError;
        }
      }
      
      // If we have no response but have an error, rethrow it
      if (!response && error) {
        throw error;
      }
      
      // If we somehow have no response and no error, return an empty array
      if (!response) {
        console.log('No valid response from any endpoint');
        return [];
      }
      
      // Extract courses data from response, which could have different structures
      let courses = [];
      
      if (Array.isArray(response)) {
        courses = response;
      } else if (response.results) {
        courses = response.results;
      } else if (response.data) {
        courses = response.data;
      } else if (response.courses) {
        courses = response.courses;
      } else if (typeof response === 'object' && Object.keys(response).length > 0) {
        // Try to interpret the response as a single course or enrollment
        if (response.id || response.course) {
          courses = [response];
        }
      }
      
      console.log('Extracted courses data:', courses);
      
      // Process and normalize each enrolled course
      const processedCourses = courses.map(item => {
        // Handle different response structures
        const course = item.course || item;
        
        return {
          id: course.id,
          title: course.title || 'Untitled Course',
          description: course.description || 'No description available',
          thumbnail: processImageUrl(course.thumbnail || course.thumbnail_url),
          cover_image: processImageUrl(course.cover_image || course.cover_image_url),
          instructor: {
            name: course.instructor?.name || 
                course.instructor?.username || 
                  (typeof course.instructor === 'string' ? course.instructor : 'Unknown'),
            username: course.instructor?.username || 'unknown'
          },
          category: typeof course.category === 'object' ? 
                   course.category?.name || 'Uncategorized' : 
                   course.category || 'Uncategorized',
          difficulty_level: course.difficulty_level || course.difficulty || 'All Levels',
          duration_in_weeks: course.duration_in_weeks || 'Self-paced',
          price: parseFloat(course.price || 0),
          total_students: parseInt(course.total_students || 0),
          rating: parseFloat(course.rating || course.avg_rating || 0),
          enrollment_date: item.enrollment_date || item.created_at || item.enrolled_at,
          progress: item.progress || course.progress || 0
        };
      });

      console.log('Processed enrolled courses:', processedCourses);
      return processedCourses;
    } catch (error) {
      console.error('Error in getEnrolledCourses:', error);
      console.error('Full error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      
      // Instead of returning empty array, rethrow the error to allow the component to handle it
      throw new Error('Failed to load enrolled courses. Please try again later.');
    }
  },

  // Check enrollment status
  checkEnrollmentStatus: async (courseId) => {
    try {
      console.log(`\n=== Checking enrollment status for course ${courseId} ===`);
      
      // Try multiple potential endpoints
      const endpoints = [
        `/api/enrollments/api/courses/${courseId}/check-enrollment/`,
        `/api/courses/${courseId}/enrollment-status/`,
        `/api/courses/${courseId}/check-enrollment/`,
        `/api/enrollments/courses/${courseId}/status/`,
        `/api/enrollments/courses/${courseId}/status/`
      ];
      
      let lastError = null;
      
      // Try each endpoint until one works
      for (const endpoint of endpoints) {
        try {
          console.log(`Trying enrollment status endpoint: ${endpoint}`);
          const response = await api.get(endpoint);
          console.log('Check enrollment status response:', response);
          
          return {
            isEnrolled: response.is_enrolled || response.enrolled || false,
            status: response.status || 'success',
            progressPercentage: response.progress_percentage || 0,
            courseId: courseId
          };
        } catch (endpointError) {
          console.log(`Error with endpoint ${endpoint}:`, {
            status: endpointError.response?.status,
            message: endpointError.message
          });
          
          // If not a 404, this is a "real" error with a valid endpoint
          if (endpointError.response?.status !== 404) {
            lastError = endpointError;
            break;
          }
          
          lastError = endpointError;
          // Continue to try the next endpoint
        }
      }
      
      // If all endpoints failed, try a fallback approach
      // Try to get course details and check the enrollment status from there
      try {
        console.log('Trying fallback: getting course details');
        const courseDetails = await courseAPI.getCourseById(courseId);
        console.log('Got course details for enrollment check:', courseDetails);
        
        if (courseDetails) {
          const isEnrolled = courseDetails.is_enrolled || courseDetails.enrolled || false;
          return {
            isEnrolled,
            status: isEnrolled ? 'success' : 'not_enrolled',
            progressPercentage: 0,
            courseId: courseId,
            fromFallback: true
          };
        }
      } catch (fallbackError) {
        console.error('Fallback approach also failed:', fallbackError);
      }
      
      // If we get here, all approaches failed
      console.error('All enrollment status check approaches failed');
      
      // Return a safe default
      return {
        isEnrolled: false,
        status: 'unknown',
        progressPercentage: 0,
        error: lastError,
        courseId: courseId
      };
    } catch (error) {
      console.error('Error checking enrollment status:', error);
      return {
        isEnrolled: false,
        status: 'error',
        error: error,
        courseId: courseId
      };
    }
  },

  // Enroll in a course
  enrollInCourse: async (courseId) => {
    try {
      console.log('\n=== Enrolling in Course ===');
      console.log('Course ID:', courseId);
      
      // Define multiple potential endpoints to try
      const endpoints = [
        `/api/courses/${courseId}/enroll/`,
        `/api/courses/enroll/${courseId}/`,
        `/api/courses/${courseId}/enroll/`,
        `/api/enrollments/courses/${courseId}/enroll/`
      ];
      
      let lastError = null;
      let successResponse = null;
      
      // Try each endpoint until one works
      for (const endpoint of endpoints) {
        try {
          console.log(`Trying enrollment endpoint: ${endpoint}`);
          const response = await api.post(endpoint);
          console.log('Successful enrollment response:', response);
          
          successResponse = response;
          break;  // Exit the loop if successful
        } catch (endpointError) {
          console.error(`Error with endpoint ${endpoint}:`, {
            status: endpointError.response?.status,
            data: endpointError.response?.data,
            message: endpointError.message
          });
          
          // If we get a meaningful error (not 404), save it and exit
          if (endpointError.response && endpointError.response.status !== 404) {
            lastError = endpointError;
            break;
          }
          
          lastError = endpointError;
          // Continue trying next endpoint
        }
      }
      
      // If we got a successful response
      if (successResponse) {
        return {
          success: true,
          courseId: courseId,
          message: successResponse.message || 'Successfully enrolled in course'
        };
      }
      
      // If we got here, no endpoint worked
      throw lastError || new Error('All enrollment endpoints failed');
      
    } catch (error) {
      console.error('Error enrolling in course:', error);
      console.error('Detailed error info:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
        stack: error.stack
      });
      
      // Check for specific error cases
      
      // Case 1: Already enrolled
      if (error.message?.includes('already enrolled') || 
          error.response?.data?.detail?.includes('already enrolled')) {
        return {
          success: true,
          courseId: courseId,
          message: 'You are already enrolled in this course'
        };
      }
      
      // Case 2: Server error (500)
      if (error.response?.status === 500) {
        // Try directly using fetch as a fallback
        try {
          console.log('Trying fetch fallback for enrollment');
          const response = await fetch(`http://localhost:8000/api/courses/${courseId}/enroll/`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${JSON.parse(localStorage.getItem('authTokens')).access}`
            }
          });
          
          if (response.ok) {
            const data = await response.json();
            console.log('Fetch fallback succeeded:', data);
            return {
              success: true,
              courseId: courseId,
              message: data.message || 'Successfully enrolled in course'
            };
          }
        } catch (fetchError) {
          console.error('Fetch fallback also failed:', fetchError);
        }
        
        return {
          success: false,
          courseId: courseId,
          message: 'Server error during enrollment. Please try again later.',
          serverError: true
        };
      }
      
      // Default case
      return {
        success: false,
        courseId: courseId,
        message: error.response?.data?.detail || error.message || 'Failed to enroll in course'
      };
    }
  },

  // Drop a course (unenroll)
  dropCourse: async (courseId) => {
    try {
      console.log('\n=== Dropping Course ===');
      console.log('Course ID:', courseId);
      
      const response = await api.post(`/api/courses/${courseId}/unenroll/`);
      console.log('Unenrollment response:', response);
      
      return {
        success: true,
        message: response.message || 'Successfully unenrolled from course'
      };
    } catch (error) {
      console.error('Error unenrolling from course:', error);
      
      return {
        success: false,
        message: error.message || 'Failed to unenroll from course'
      };
    }
  },
  
  // Get course modules
  getCourseModules: async (courseId) => {
    try {
      console.log(`Fetching modules for course ${courseId}`);
      const response = await api.get(`/api/courses/api/courses/${courseId}/modules/`);
      
      console.log('Course modules response:', response.data);
      
      // Sort modules by order
      const sortedModules = response.data.sort((a, b) => a.order - b.order);
      
      return sortedModules;
    } catch (error) {
      console.error('Error fetching course modules:', error);
      throw error;
    }
  },
  
  // Get module sections
  getModuleSections: async (moduleId) => {
    try {
      console.log(`Fetching sections for module ${moduleId}`);
      const response = await api.get(`/api/courses/api/modules/${moduleId}/sections/`);
      
      console.log('Module sections response:', response.data);
      
      // Sort sections by order
      const sortedSections = response.data.sort((a, b) => a.order - b.order);
      
      return sortedSections;
    } catch (error) {
      console.error('Error fetching module sections:', error);
      throw error;
    }
  },
  
  // Mark section as complete
  markSectionComplete: async (courseId, sectionId) => {
    try {
      console.log(`Marking section ${sectionId} as complete for course ${courseId}`);
      const response = await api.post(`/api/courses/api/courses/${courseId}/sections/${sectionId}/complete/`);
      
      console.log('Mark section complete response:', response.data);
      
      return {
        success: response.data.success,
        message: response.data.message || 'Section marked as complete',
        progressPercentage: response.data.progress_percentage
      };
    } catch (error) {
      console.error('Error marking section as complete:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to mark section as complete',
        error
      };
    }
  },
  
  // Get course progress
  getCourseProgress: async (courseId) => {
    try {
      console.log(`Fetching progress for course ${courseId}`);
      const response = await api.get(`/api/courses/api/courses/${courseId}/progress/`);
      
      console.log('Course progress response:', response.data);
      
      // Convert sections_completed object to a map for easier access
      const sectionsCompleted = response.data.sections_completed || {};
      
      return sectionsCompleted;
    } catch (error) {
      console.error('Error fetching course progress:', error);
      return {};
    }
  },
  
  // Submit quiz results
  submitQuizResults: async (courseId, quizId, results) => {
    try {
      console.log(`Submitting quiz ${quizId} results for course ${courseId}:`, results);
      const response = await api.post(`/api/courses/api/courses/${courseId}/quizzes/${quizId}/submit/`, results);
      
      console.log('Submit quiz results response:', response.data);
      
      return {
        success: true,
        score: response.data.score,
        passed: response.data.passed,
        passingScore: response.data.passing_score
      };
    } catch (error) {
      console.error('Error submitting quiz results:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to submit quiz results',
        error
      };
    }
  },
  
  // Save notes for a section
  saveNotes: async (courseId, sectionId, notes) => {
    try {
      console.log(`Saving notes for section ${sectionId} in course ${courseId}`);
      const response = await api.post(`/api/courses/api/courses/${courseId}/sections/${sectionId}/notes/`, {
        notes
      });
      
      console.log('Save notes response:', response.data);
      
      return {
        success: true,
        message: response.data.message || 'Notes saved successfully'
      };
    } catch (error) {
      console.error('Error saving notes:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to save notes',
        error
      };
    }
  },
  
  // Unenroll from a course
  unenrollCourse: async (courseId) => {
    try {
      console.log(`Unenrolling from course ${courseId}`);
      const response = await api.post(`/api/courses/api/courses/${courseId}/unenroll/`);
      
      console.log('Unenroll course response:', response.data);
      
      return {
        success: response.data.success,
        message: response.data.message || 'Successfully unenrolled from the course'
      };
    } catch (error) {
      console.error('Error unenrolling from course:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to unenroll from the course',
        error
      };
    }
  },

  // Get instructor view of course with modules and sections
  getInstructorCourseView: async (courseId) => {
    try {
      console.log(`Fetching instructor course view for course ${courseId}`);
      
      // Try multiple potential endpoints
      const endpoints = [
        `/api/courses/instructor/courses/${courseId}/view/`,
        `/instructor/courses/${courseId}/view/`
      ];
      
      let lastError = null;
      let response = null;
      
      // Try each endpoint until one works
      for (const endpoint of endpoints) {
        try {
          console.log(`Trying instructor course view endpoint: ${endpoint}`);
          response = await api.get(endpoint);
          console.log(`Endpoint ${endpoint} succeeded`);
          break;
        } catch (endpointError) {
          console.log(`Error with endpoint ${endpoint}:`, {
            status: endpointError.response?.status,
            message: endpointError.message
          });
          
          lastError = endpointError;
        }
      }
      
      if (!response) {
        throw lastError || new Error('All instructor course view endpoints failed');
      }
      
      console.log('Instructor course view response data structure:', {
        hasData: !!response,
        keys: response ? Object.keys(response) : [],
        hasModules: response?.modules ? `${response.modules.length} modules` : 'no modules',
        modulesSample: response?.modules?.[0] ? Object.keys(response.modules[0]) : []
      });
      
      return response;
    } catch (error) {
      console.error('Error getting instructor course view:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data
      });
      throw error;
    }
  }
};

// Enrollment-related API calls
export const enrollmentAPI = {
  dropCourse: async (courseId) => {
    try {
      const response = await api.post(`/api/courses/${courseId}/drop/`);
      return response.data;
    } catch (error) {
      console.error('Error dropping course:', error);
      throw new Error(error.response?.data?.message || 'Failed to drop course');
    }
  },

  // Get enrolled courses for the current user
  getEnrolledCourses: async () => {
    try {
      console.log('\n=== Getting Enrolled Courses ===');
      
      // Try multiple potential endpoints that might contain enrolled courses
      const endpoints = [
        '/api/courses/enrolled/',
        '/api/courses/enrolled/',
        '/api/enrollments/courses/',
      ];
      
      let response = null;
      let error = null;
      
      // Try each endpoint until one works
      for (const endpoint of endpoints) {
        try {
          console.log(`Trying endpoint for enrolled courses: ${endpoint}`);
          response = await api.get(endpoint);
          console.log(`Successful response from ${endpoint}:`, response);
          break; // Exit the loop on success
        } catch (endpointError) {
          console.log(`Error with endpoint ${endpoint}:`, {
            status: endpointError.response?.status,
            message: endpointError.message
          });
          
          // If this is not a 404, it's a meaningful error
          if (endpointError.response?.status !== 404) {
            error = endpointError;
            break;
          }
          
          error = endpointError;
        }
      }
      
      // If we have no response but have an error, rethrow it
      if (!response && error) {
        throw error;
      }
      
      // If we somehow have no response and no error, return an empty array
      if (!response) {
        console.log('No valid response from any endpoint');
        return [];
      }
      
      // Extract courses data from response, which could have different structures
      let courses = [];
      
      if (Array.isArray(response)) {
        courses = response;
      } else if (response.results) {
        courses = response.results;
      } else if (response.data) {
        courses = response.data;
      } else if (response.courses) {
        courses = response.courses;
      } else if (typeof response === 'object' && Object.keys(response).length > 0) {
        // Try to interpret the response as a single course or enrollment
        if (response.id || response.course) {
          courses = [response];
        }
      }
      
      console.log('Extracted courses data:', courses);
      
      // Process and normalize each enrolled course
      const processedCourses = courses.map(item => {
        // Handle different response structures
        const course = item.course || item;
        
        return {
          id: course.id,
          title: course.title || 'Untitled Course',
          description: course.description || 'No description available',
          thumbnail: processImageUrl(course.thumbnail || course.thumbnail_url),
          cover_image: processImageUrl(course.cover_image || course.cover_image_url),
          instructor: {
            name: course.instructor?.name || 
                course.instructor?.username || 
                (typeof course.instructor === 'string' ? course.instructor : 'Unknown'),
            username: course.instructor?.username || 'unknown'
          },
          category: typeof course.category === 'object' ? 
                course.category?.name || 'Uncategorized' : 
                course.category || 'Uncategorized',
          difficulty_level: course.difficulty_level || course.difficulty || 'All Levels',
          duration_in_weeks: course.duration_in_weeks || 'Self-paced',
          price: parseFloat(course.price || 0),
          total_students: parseInt(course.total_students || 0),
          rating: parseFloat(course.rating || course.avg_rating || 0),
          enrollment_date: item.enrollment_date || item.created_at || item.enrolled_at,
          progress: item.progress || course.progress || 0
        };
      });

      console.log('Processed enrolled courses:', processedCourses);
      return processedCourses;
    } catch (error) {
      console.error('Error in getEnrolledCourses:', error);
      console.error('Full error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      
      // Instead of returning empty array, rethrow the error to allow the component to handle it
      throw new Error('Failed to load enrolled courses. Please try again later.');
    }
  }
};

// Authentication-related API calls
export const authAPI = {
  login: async (credentials) => {
    try {
      console.log('\n=== Login Request ===');
      console.log('Login attempt:', {
        username: credentials.username,
        user_type: credentials.user_type,
        hasPassword: !!credentials.password
      });

      // Validate required fields
      if (!credentials.username || !credentials.password || !credentials.user_type) {
        throw new Error('Username, password, and user type are required');
      }

      // Make the login request
      const response = await axios.post(`${BASE_URL}/login/`, {
        username: credentials.username.trim(),
        password: credentials.password,
        user_type: credentials.user_type.toLowerCase()
      });

      console.log('Login response:', {
        status: response.status,
        hasData: !!response.data,
        dataKeys: response.data ? Object.keys(response.data) : []
      });

      // Validate response data
      if (!response.data || !response.data.success) {
        throw new Error(response.data?.message || 'Login failed');
      }

      const { access, refresh, user_type, username, first_name, last_name } = response.data;

      // Validate required fields
      if (!access || !refresh) {
        throw new Error('Invalid response: Missing authentication tokens');
      }

      // Store auth data
      const authData = {
        access,
        refresh,
        user_type: user_type?.toLowerCase(),
        username,
        first_name,
        last_name
      };

      // Store tokens in localStorage
      localStorage.setItem('authTokens', JSON.stringify({ access, refresh }));
      localStorage.setItem('user_type', user_type?.toLowerCase());
      localStorage.setItem('username', username);

      // Store user info
      const userInfo = {
        username,
        first_name,
        last_name,
        user_type: user_type?.toLowerCase(),
        role: user_type?.toLowerCase()
      };
      localStorage.setItem('user', JSON.stringify(userInfo));
      localStorage.setItem('user_type', userInfo.user_type);
      
      // Return the complete user data
      return {
        ...userInfo,
        ...authData
      };

    } catch (error) {
      console.error('Login error details:', {
        message: error.message,
        response: {
          status: error.response?.status,
          data: error.response?.data,
          headers: error.response?.headers
        },
        request: {
          url: error.config?.url,
          method: error.config?.method,
          headers: error.config?.headers
        }
      });

      // Handle specific error cases
      if (error.response?.status === 500) {
        console.error('Server error details:', error.response?.data);
        throw new Error('Server error occurred. Please try again later or contact support if the problem persists.');
      }

      if (error.response?.status === 401) {
        throw new Error('Invalid credentials. Please check your username and password.');
      }

      if (error.response?.status === 403) {
        throw new Error('Access denied. Please check your user type.');
      }

      if (error.response?.status === 400) {
        const errorMessage = error.response.data?.message || 
                           error.response.data?.detail ||
                           'Invalid login data. Please check your input.';
        throw new Error(errorMessage);
      }

      // Handle network errors
      if (!error.response) {
        throw new Error('Network error. Please check your connection and try again.');
      }

      // Default error message
      throw new Error(error.response?.data?.message || error.message || 'Login failed. Please try again.');
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
      console.log('Registration request:', userData);
      
      // Validate required fields
      if (!userData.username || !userData.email || !userData.password || !userData.user_type) {
        throw new Error('Please provide all required fields');
      }

      // Make the registration request
      const response = await axios.post(`${BASE_URL}/register/`, {
        username: userData.username.trim(),
        email: userData.email.trim(),
        password: userData.password,
        first_name: userData.first_name || '',
        last_name: userData.last_name || '',
        user_type: userData.user_type.toLowerCase()
      });

      console.log('Registration response:', response.data);

      if (!response.data || !response.data.success) {
        throw new Error(response.data?.message || 'Registration failed');
      }

      // Store auth data
      const { access, refresh, user_type, username } = response.data;
      
      // Store tokens
      const tokens = {
        access,
        refresh
      };
      localStorage.setItem('authTokens', JSON.stringify(tokens));
      
      // Store user info
      const userInfo = {
        username,
        user_type: user_type?.toLowerCase(),
        role: user_type?.toLowerCase()
      };
      localStorage.setItem('user', JSON.stringify(userInfo));
      localStorage.setItem('user_type', userInfo.user_type);
      
      // Return the complete user data
      return {
        ...userInfo,
        ...tokens
      };
    } catch (error) {
      console.error('Registration error:', error.response?.data || error.message);
      throw new Error(
        error.response?.data?.message || 
        error.response?.data?.error || 
        error.message || 
        'Registration failed. Please try again.'
      );
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