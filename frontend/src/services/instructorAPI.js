import { courseAPI } from './api';

// This file serves as a wrapper around the main API for instructor-specific functions
// Importing from this file instead of directly from api.js makes the code more modular

export const instructorAPI = {
  // Re-export necessary functions from courseAPI
  getInstructorCourses: courseAPI.getInstructorCourses,
  updateCourse: courseAPI.updateCourse,
  updateCourseStatus: courseAPI.updateCourseStatus,
  
  // Instructor-specific API functions could be added here in the future
  getInstructorStats: async () => {
    try {
      const courses = await courseAPI.getInstructorCourses();
      
      // Calculate stats from courses
      const totalStudents = courses.reduce((acc, course) => acc + (course.total_students || 0), 0);
      const activeEnrollments = courses.reduce((acc, course) => acc + (course.active_enrollments || 0), 0);
      const totalRevenue = courses.reduce((acc, course) => acc + (course.revenue || 0), 0);

      return {
        totalCourses: courses.length,
        totalStudents,
        activeEnrollments,
        totalRevenue,
      };
    } catch (error) {
      console.error('Error getting instructor stats:', error);
      throw error;
    }
  }
}; 