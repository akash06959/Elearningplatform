import axios from 'axios';

const BASE_URL = process.env.REACT_APP_BASE_URL || 'http://localhost:8000/api';
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
      
      const response = await api.patch(`/courses/${courseId}/update_status/`, {
        status: status,
        is_published: status === 'published'
      });
      
      console.log('Update status response:', response);
      
      // Ensure we return a standardized response
      return {
        status: 'success',
        course: response.data || response,
        message: `Course ${status === 'published' ? 'published' : 'unpublished'} successfully`
      };
    } catch (error) {
      console.error('Error in updateCourseStatus:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      throw new Error(error.response?.data?.message || error.message || 'Failed to update course status');
    }
  },

  // Get course details by ID
  getCourseById: async (courseId) => {
    try {
      console.log('\n=== Getting Course Details ===');
      console.log('Course ID:', courseId);
      
      // Try multiple endpoints
      const endpoints = [
        `/courses/${courseId}/detail/`,
        `/courses/instructor/courses/${courseId}/`,
        `/courses/instructor/courses/${courseId}/detail/`,
        `/courses/${courseId}/`,
        `/courses/detail/${courseId}/`
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
      console.log('Course data:', courseData);
      
      // Try the primary endpoint
      try {
        const response = await api.post('/courses/create/', courseData);
        console.log('Course creation response:', response);
        return response;
      } catch (error) {
        // If the primary endpoint returns 404, try the alternate endpoint
        if (error.response?.status === 404) {
          console.log('Primary endpoint not found, trying alternate endpoint');
          try {
            const altResponse = await api.post('/courses/create-course/', courseData);
            console.log('Alternate endpoint response:', altResponse);
            return altResponse;
          } catch (altError) {
            console.error('Error with alternate endpoint:', {
              status: altError.response?.status,
              data: altError.response?.data
            });
            
            // If we get a 400 Bad Request, log detailed error information
            if (altError.response?.status === 400) {
              console.error('Bad Request details:', altError.response.data);
              throw new Error(`Bad Request: ${JSON.stringify(altError.response.data)}`);
            }
            throw altError;
          }
        }
        
        // If we get a 400 Bad Request, log detailed error information
        if (error.response?.status === 400) {
          console.error('Bad Request details:', error.response.data);
          throw new Error(`Bad Request: ${JSON.stringify(error.response.data)}`);
        }
        throw error;
      }
    } catch (error) {
      console.error('Error in createCourse:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      throw new Error(error.response?.data?.message || error.message || 'Failed to create course');
    }
  },
  
  // Update an existing course
  updateCourse: async (courseId, courseData) => {
    try {
      console.log('\n=== Updating Course ===');
      console.log('Course ID:', courseId);
      
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
        { url: `/courses/instructor/courses/${courseId}/update/`, method: 'patch' },
        { url: `/courses/instructor/courses/${courseId}/`, method: 'patch' },
        { url: `/courses/instructor/${courseId}/update/`, method: 'patch' },
        { url: `/courses/${courseId}/update/`, method: 'patch' },
        { url: `/courses/${courseId}/`, method: 'patch' },
        { url: `/courses/update-course/${courseId}/`, method: 'patch' },
        { url: `/instructor/courses/${courseId}/update/`, method: 'patch' },
        { url: `/instructor/courses/${courseId}/`, method: 'patch' },
        
        // PUT methods
        { url: `/courses/instructor/courses/${courseId}/update/`, method: 'put' },
        { url: `/courses/instructor/courses/${courseId}/`, method: 'put' },
        { url: `/courses/instructor/${courseId}/update/`, method: 'put' },
        { url: `/courses/${courseId}/update/`, method: 'put' },
        { url: `/courses/${courseId}/`, method: 'put' },
        { url: `/courses/update-course/${courseId}/`, method: 'put' },
        { url: `/instructor/courses/${courseId}/update/`, method: 'put' },
        { url: `/instructor/courses/${courseId}/`, method: 'put' },
        
        // POST methods
        { url: `/courses/instructor/courses/${courseId}/update/`, method: 'post' },
        { url: `/courses/instructor/courses/${courseId}/`, method: 'post' },
        { url: `/courses/instructor/${courseId}/update/`, method: 'post' },
        { url: `/courses/${courseId}/update/`, method: 'post' },
        { url: `/courses/${courseId}/`, method: 'post' },
        { url: `/courses/update-course/${courseId}/`, method: 'post' },
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

  // Get all courses
  getAllCourses: async (filters = {}) => {
    try {
      console.log('\n=== Getting All Courses ===');
      console.log('Filters:', filters);
      
      // Build query string from filters
      const queryParams = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) queryParams.append(key, value);
      });
      
      const queryString = queryParams.toString();
      const url = `/courses/${queryString ? `?${queryString}` : ''}`;
      
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
        thumbnail: processImageUrl(course.thumbnail),
        cover_image: processImageUrl(course.cover_image)
      }));
      
      console.log('Processed all courses:', courses);
      return courses;
    } catch (error) {
      console.error('Error in getAllCourses:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      throw new Error('Failed to load courses. Please try again later.');
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
      console.log(`\n=== Checking enrollment status for course ${courseId} ===`);
      
      // Try multiple potential endpoints
      const endpoints = [
        `/enrollments/api/courses/${courseId}/check-enrollment/`,
        `/courses/${courseId}/enrollment-status/`,
        `/courses/${courseId}/check-enrollment/`,
        `/enrollments/courses/${courseId}/status/`,
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
        `/courses/${courseId}/enroll/`,
        `/courses/enroll/${courseId}/`,
        `/api/courses/${courseId}/enroll/`,
        `/enrollments/courses/${courseId}/enroll/`,
        `/enrollments/enroll/${courseId}/`
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
      
      const response = await api.post(`/courses/${courseId}/unenroll/`);
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
      const response = await api.get(`/courses/api/courses/${courseId}/modules/`);
      
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
      const response = await api.get(`/courses/api/modules/${moduleId}/sections/`);
      
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
      const response = await api.post(`/courses/api/courses/${courseId}/sections/${sectionId}/complete/`);
      
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
      const response = await api.get(`/courses/api/courses/${courseId}/progress/`);
      
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
      const response = await api.post(`/courses/api/courses/${courseId}/quizzes/${quizId}/submit/`, results);
      
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
      const response = await api.post(`/courses/api/courses/${courseId}/sections/${sectionId}/notes/`, {
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
      const response = await api.post(`/courses/api/courses/${courseId}/unenroll/`);
      
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
        `/courses/instructor/courses/${courseId}/view/`,
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
      const response = await api.post(`/courses/${courseId}/drop/`);
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
      const response = await api.get('/courses/enrolled/');  // Changed from /enrollments/api/enrolled-courses/
      console.log('Raw enrolled courses response:', response);
      
      let courses = [];
      if (Array.isArray(response)) {
        courses = response;
      } else if (response?.data) {
        courses = response.data;
      } else if (response?.results) {
        courses = response.results;
      }

      // Process and validate each enrolled course
      const processedCourses = courses
        .filter(course => course && course.course)
        .map(enrollment => ({
          id: enrollment.course.id,
          title: enrollment.course.title || 'Untitled Course',
          description: enrollment.course.description || 'No description available',
          thumbnail: processImageUrl(enrollment.course.thumbnail || enrollment.course.thumbnail_url),
          cover_image: processImageUrl(enrollment.course.cover_image || enrollment.course.cover_image_url),
          instructor: {
            name: enrollment.course.instructor?.name || 
                  enrollment.course.instructor?.username || 
                  (typeof enrollment.course.instructor === 'string' ? enrollment.course.instructor : 'Unknown'),
            username: enrollment.course.instructor?.username || 'unknown'
          },
          category: typeof enrollment.course.category === 'object' ? 
                   enrollment.course.category?.name || 'Uncategorized' : 
                   enrollment.course.category || 'Uncategorized',
          difficulty_level: enrollment.course.difficulty_level || 'All Levels',
          duration_in_weeks: enrollment.course.duration_in_weeks || 'Self-paced',
          price: parseFloat(enrollment.course.price || 0),
          total_students: parseInt(enrollment.course.total_students || 0),
          rating: parseFloat(enrollment.course.rating || enrollment.course.avg_rating || 0),
          enrollment_date: enrollment.enrollment_date,
          progress: enrollment.progress || 0
        }));

      console.log('Processed enrolled courses:', processedCourses);
      return processedCourses;
    } catch (error) {
      console.error('Error in getEnrolledCourses:', error);
      return [];
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