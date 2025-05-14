import axios from 'axios';

const BASE_URL = process.env.REACT_APP_BASE_URL || 'http://localhost:8000/api';

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
    return config;
  },
  (error) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// Progress service - with localStorage fallback
export const progressService = {
  // Initialize progress tracking for a course
  initializeProgress: (courseId, modules) => {
    // Check if there's already progress data in localStorage
    const existingProgress = localStorage.getItem(`progress_${courseId}`);
    
    if (!existingProgress) {
      // Create initial progress structure
      const initialProgress = {
        courseId,
        lastUpdated: new Date().toISOString(),
        completedSections: {},
        quizResults: {}
      };
      
      // Save to localStorage
      localStorage.setItem(`progress_${courseId}`, JSON.stringify(initialProgress));
      return initialProgress;
    }
    
    return JSON.parse(existingProgress);
  },
  
  // Get course progress 
  getCourseProgress: async (courseId) => {
    try {
      // Try to get progress from API first
      const response = await api.get(`/api/courses/${courseId}/progress/`);
      console.log('API progress response:', response);
      
      if (response && (response.sections || response.progress)) {
        // Convert to our standard format
        const progressMap = {};
        
        if (response.sections && Array.isArray(response.sections)) {
          response.sections.forEach(section => {
            progressMap[section.id] = true;
          });
        } else if (response.progress && typeof response.progress === 'object') {
          return response.progress;
        }
        
        // Save to localStorage for backup
        localStorage.setItem(`progress_${courseId}`, JSON.stringify({
          courseId,
          lastUpdated: new Date().toISOString(),
          completedSections: progressMap,
          quizResults: response.quizzes || {}
        }));
        
        return progressMap;
      }
    } catch (error) {
      console.warn('Failed to get progress from API, falling back to localStorage');
    }
    
    // Fall back to localStorage
    const localProgress = localStorage.getItem(`progress_${courseId}`);
    if (localProgress) {
      const progress = JSON.parse(localProgress);
      return progress.completedSections || {};
    }
    
    return {};
  },
  
  // Mark a section as completed
  markSectionComplete: async (courseId, sectionId) => {
    try {
      // Try API first
      const response = await api.post(`/api/courses/${courseId}/sections/${sectionId}/complete/`);
      console.log('API markComplete response:', response);
      
      if (response && response.success !== false) {
        // Also update localStorage
        const localProgress = localStorage.getItem(`progress_${courseId}`);
        if (localProgress) {
          const progress = JSON.parse(localProgress);
          progress.completedSections[sectionId] = true;
          progress.lastUpdated = new Date().toISOString();
          localStorage.setItem(`progress_${courseId}`, JSON.stringify(progress));
        }
        
        return { success: true, message: 'Section marked as complete' };
      }
    } catch (error) {
      console.warn('Failed to mark section complete via API, using localStorage only');
    }
    
    // Fall back to localStorage only
    const localProgress = localStorage.getItem(`progress_${courseId}`);
    if (localProgress) {
      const progress = JSON.parse(localProgress);
      progress.completedSections[sectionId] = true;
      progress.lastUpdated = new Date().toISOString();
      localStorage.setItem(`progress_${courseId}`, JSON.stringify(progress));
    } else {
      // Create new progress object
      const newProgress = {
        courseId,
        lastUpdated: new Date().toISOString(),
        completedSections: { [sectionId]: true },
        quizResults: {}
      };
      localStorage.setItem(`progress_${courseId}`, JSON.stringify(newProgress));
    }
    
    return { success: true, message: 'Section marked as complete (local only)' };
  },
  
  // Submit quiz results
  submitQuizResults: async (courseId, quizId, results) => {
    try {
      // Try API first
      const response = await api.post(`/api/courses/${courseId}/quizzes/${quizId}/submit/`, results);
      console.log('API quiz submission response:', response);
      
      if (response && response.success !== false) {
        // Also update localStorage
        const localProgress = localStorage.getItem(`progress_${courseId}`);
        if (localProgress) {
          const progress = JSON.parse(localProgress);
          if (!progress.quizResults) {
            progress.quizResults = {};
          }
          
          progress.quizResults[quizId] = {
            score: results.score,
            passed: results.score >= 70,
            completedAt: new Date().toISOString()
          };
          
          progress.lastUpdated = new Date().toISOString();
          localStorage.setItem(`progress_${courseId}`, JSON.stringify(progress));
        }
        
        return { 
          success: true, 
          score: results.score,
          passed: results.score >= 70,
          message: 'Quiz submitted successfully' 
        };
      }
    } catch (error) {
      console.warn('Failed to submit quiz via API, using localStorage only');
    }
    
    // Fall back to localStorage only
    const localProgress = localStorage.getItem(`progress_${courseId}`);
    if (localProgress) {
      const progress = JSON.parse(localProgress);
      if (!progress.quizResults) {
        progress.quizResults = {};
      }
      
      progress.quizResults[quizId] = {
        score: results.score,
        passed: results.score >= 70,
        completedAt: new Date().toISOString()
      };
      
      progress.lastUpdated = new Date().toISOString();
      localStorage.setItem(`progress_${courseId}`, JSON.stringify(progress));
    } else {
      // Create new progress object
      const newProgress = {
        courseId,
        lastUpdated: new Date().toISOString(),
        completedSections: {},
        quizResults: {
          [quizId]: {
            score: results.score,
            passed: results.score >= 70,
            completedAt: new Date().toISOString()
          }
        }
      };
      localStorage.setItem(`progress_${courseId}`, JSON.stringify(newProgress));
    }
    
    return { 
      success: true, 
      score: results.score,
      passed: results.score >= 70,
      message: 'Quiz submitted successfully (local only)' 
    };
  },
  
  // Save notes for a section
  saveNotes: async (courseId, sectionId, notes) => {
    try {
      // Try API first
      const response = await api.post(`/api/courses/${courseId}/sections/${sectionId}/notes/`, { notes });
      console.log('API save notes response:', response);
      
      if (response && response.success !== false) {
        // Also update localStorage
        const localProgress = localStorage.getItem(`progress_${courseId}`);
        if (localProgress) {
          const progress = JSON.parse(localProgress);
          if (!progress.notes) {
            progress.notes = {};
          }
          
          progress.notes[sectionId] = notes;
          progress.lastUpdated = new Date().toISOString();
          localStorage.setItem(`progress_${courseId}`, JSON.stringify(progress));
        }
        
        return { success: true, message: 'Notes saved successfully' };
      }
    } catch (error) {
      console.warn('Failed to save notes via API, using localStorage only');
    }
    
    // Fall back to localStorage only
    const localProgress = localStorage.getItem(`progress_${courseId}`);
    if (localProgress) {
      const progress = JSON.parse(localProgress);
      if (!progress.notes) {
        progress.notes = {};
      }
      
      progress.notes[sectionId] = notes;
      progress.lastUpdated = new Date().toISOString();
      localStorage.setItem(`progress_${courseId}`, JSON.stringify(progress));
    } else {
      // Create new progress object
      const newProgress = {
        courseId,
        lastUpdated: new Date().toISOString(),
        completedSections: {},
        quizResults: {},
        notes: {
          [sectionId]: notes
        }
      };
      localStorage.setItem(`progress_${courseId}`, JSON.stringify(newProgress));
    }
    
    return { success: true, message: 'Notes saved successfully (local only)' };
  },
  
  // Get notes for a section
  getNotes: (courseId, sectionId) => {
    const localProgress = localStorage.getItem(`progress_${courseId}`);
    if (localProgress) {
      const progress = JSON.parse(localProgress);
      if (progress.notes && progress.notes[sectionId]) {
        return progress.notes[sectionId];
      }
    }
    
    return '';
  },
  
  // Check if a quiz has been passed
  hasPassedQuiz: (courseId, quizId) => {
    const localProgress = localStorage.getItem(`progress_${courseId}`);
    if (localProgress) {
      const progress = JSON.parse(localProgress);
      if (progress.quizResults && 
          progress.quizResults[quizId] && 
          progress.quizResults[quizId].passed) {
        return true;
      }
    }
    
    return false;
  },
  
  // Get overall course completion percentage
  getCompletionPercentage: (courseId, totalSections) => {
    const localProgress = localStorage.getItem(`progress_${courseId}`);
    if (localProgress) {
      const progress = JSON.parse(localProgress);
      const completedCount = Object.keys(progress.completedSections || {}).length;
      
      if (totalSections > 0) {
        return Math.round((completedCount / totalSections) * 100);
      }
    }
    
    return 0;
  }
}; 