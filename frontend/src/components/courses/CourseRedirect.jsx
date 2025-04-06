import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';

// This is a simple component that immediately redirects to the course learning page
const CourseRedirect = () => {
  const { courseId } = useParams();

  useEffect(() => {
    console.log('CourseRedirect: Redirecting to course learning page for course:', courseId);
    // Perform the redirect after component mounts
    window.location.href = `/courses/${courseId}/learn`;
  }, [courseId]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <div className="mb-4 text-3xl">Redirecting you to the course...</div>
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
    </div>
  );
};

export default CourseRedirect; 