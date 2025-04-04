import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { enrollmentAPI, courseAPI } from '../../services/api';
import { toast } from 'react-hot-toast';

function CourseDetail() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [enrolling, setEnrolling] = useState(false);
  const [showEnrollmentModal, setShowEnrollmentModal] = useState(false);
  const defaultImageUrl = 'https://placehold.co/1200x400';

  useEffect(() => {
    // Validate courseId
    if (!courseId || courseId === 'undefined') {
      console.warn('No course ID provided');
      navigate('/courses', { replace: true });
      return;
    }

    const fetchCourseDetails = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Get course details
        console.log('Fetching course details for ID:', courseId);
        const courseData = await courseAPI.getCourseById(courseId);
        console.log('Received course data:', courseData);
        
        if (!courseData || typeof courseData !== 'object') {
          console.error('Invalid course data received:', courseData);
          throw new Error('Course not found or invalid data received');
        }

        // Log instructor data for debugging
        console.log('Instructor data:', courseData.instructor);
        
        // Process image URLs and ensure instructor data is properly structured
        const processedData = {
          ...courseData,
          thumbnail: courseData.thumbnail ? 
            (courseData.thumbnail.startsWith('http') ? courseData.thumbnail : `http://localhost:8000${courseData.thumbnail}`)
            : defaultImageUrl,
          cover_image: courseData.cover_image ? 
            (courseData.cover_image.startsWith('http') ? courseData.cover_image : `http://localhost:8000${courseData.cover_image}`)
            : defaultImageUrl,
          instructor: courseData.instructor || {
            name: 'Unknown Instructor',
            username: 'unknown',
            email: ''
          },
          // Ensure required fields have default values
          title: courseData.title || 'Untitled Course',
          description: courseData.description || 'No description available',
          price: courseData.price || 0,
          duration_in_weeks: courseData.duration_in_weeks || 'Not specified',
          difficulty_level: courseData.difficulty_level || 'Not specified',
          modules: courseData.modules || [],
          total_students: courseData.total_students || 0,
          avg_rating: courseData.avg_rating || 0,
          reviews: courseData.reviews || []
        };
        
        console.log('Processed course data:', processedData);
        setCourse(processedData);
        
        // Check enrollment status
        try {
          console.log('Checking enrollment status...');
          const enrollmentStatus = await courseAPI.checkEnrollmentStatus(courseId);
          console.log('Enrollment status:', enrollmentStatus);
          setIsEnrolled(enrollmentStatus.is_enrolled);
        } catch (err) {
          console.error('Error checking enrollment status:', err);
          setIsEnrolled(false);
        }
      } catch (err) {
        console.error('Error fetching course:', err);
        setError(err.message || 'Failed to load course details');
        setCourse(null);
      } finally {
        setLoading(false);
      }
    };

    fetchCourseDetails();
  }, [courseId, navigate]);

  const handleEnroll = async () => {
    try {
      setEnrolling(true);
      
      // Check if user is logged in
      const token = localStorage.getItem('accessToken');
      if (!token) {
        toast.error('Please log in to enroll in this course');
        navigate('/login', { state: { from: `/courses/${courseId}` } });
        return;
      }

      console.log('Starting enrollment process...');
      const response = await courseAPI.enrollInCourse(courseId);
      console.log('Enrollment response:', response);

      setIsEnrolled(true);
      setShowEnrollmentModal(false);
      toast.success(response.message || 'Successfully enrolled in the course!');
    } catch (err) {
      console.error('Error enrolling in course:', err);
      
      // Handle specific error cases
      if (err.message.includes('log in')) {
        toast.error('Please log in to enroll in this course');
        navigate('/login', { state: { from: `/courses/${courseId}` } });
      } else {
        toast.error(err.message || 'Failed to enroll in course. Please try again.');
      }
    } finally {
      setEnrolling(false);
    }
  };

  const handleCancelEnrollment = async () => {
    try {
      const confirmed = window.confirm('Are you sure you want to cancel your enrollment?');
      if (!confirmed) return;

      setEnrolling(true);
      await enrollmentAPI.dropCourse(courseId);
      setIsEnrolled(false);
      toast.success('Successfully cancelled course enrollment');
    } catch (err) {
      console.error('Error cancelling enrollment:', err);
      toast.error(err.message || 'Failed to cancel enrollment. Please try again.');
    } finally {
      setEnrolling(false);
    }
  };

  const EnrollmentModal = () => (
    <div style={styles.modalOverlay}>
      <div style={styles.modal}>
        <h2 style={styles.modalTitle}>Confirm Enrollment</h2>
        <div style={styles.modalContent}>
          <h3>{course?.title}</h3>
          <p>By enrolling in this course, you'll get:</p>
          <ul style={styles.benefitsList}>
            <li>Full access to all course content</li>
            <li>Certificate upon completion</li>
            <li>Lifetime access to course materials</li>
            <li>Access to course discussion forums</li>
          </ul>
        </div>
        <div style={styles.modalActions}>
          <button 
            onClick={() => setShowEnrollmentModal(false)}
            style={styles.cancelButton}
            disabled={enrolling}
          >
            Cancel
          </button>
          <button 
            onClick={handleEnroll}
            style={styles.confirmButton}
            disabled={enrolling}
          >
            {enrolling ? 'Enrolling...' : 'Confirm Enrollment'}
          </button>
        </div>
      </div>
    </div>
  );

  const styles = {
    container: {
      padding: '2rem',
      maxWidth: '1200px',
      margin: '0 auto',
    },
    header: {
      position: 'relative',
      marginBottom: '2rem',
      backgroundColor: '#f8f9fa',
      borderRadius: '8px',
      padding: '2rem',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    },
    courseImage: {
      width: '100%',
      height: '400px',
      objectFit: 'cover',
      borderRadius: '8px',
      marginBottom: '2rem',
    },
    title: {
      color: '#2c3e50',
      fontSize: '2.5rem',
      marginBottom: '1rem',
    },
    instructorSection: {
      marginBottom: '1.5rem',
      padding: '1rem',
      backgroundColor: '#f8f9fa',
      borderRadius: '8px',
    },
    instructorTitle: {
      fontSize: '0.9rem',
      color: '#666',
      marginBottom: '0.25rem',
    },
    instructorDetails: {
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
    },
    instructorName: {
      fontSize: '1.1rem',
      color: '#333',
    },
    instructorEmail: {
      fontSize: '0.9rem',
      color: '#666',
    },
    description: {
      fontSize: '1.1rem',
      lineHeight: '1.6',
      color: '#444',
      marginBottom: '2rem',
    },
    enrollButton: {
      backgroundColor: '#3a5a9b',
      color: 'white',
      border: 'none',
      padding: '1rem 2rem',
      borderRadius: '4px',
      fontSize: '1.2rem',
      cursor: 'pointer',
      transition: 'background-color 0.2s',
      marginTop: '1rem',
      width: '100%',
      maxWidth: '300px',
      opacity: enrolling ? 0.7 : 1,
      pointerEvents: enrolling ? 'none' : 'auto',
    },
    enrolledButton: {
      backgroundColor: '#28a745',
      color: 'white',
      border: 'none',
      padding: '1rem 2rem',
      borderRadius: '4px',
      fontSize: '1.2rem',
      cursor: 'default',
      width: '100%',
      maxWidth: '300px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '0.5rem',
    },
    buttonContainer: {
      display: 'flex',
      justifyContent: 'center',
      marginTop: '2rem',
    },
    infoSection: {
      backgroundColor: 'white',
      borderRadius: '8px',
      padding: '2rem',
      marginBottom: '2rem',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    },
    sectionTitle: {
      color: '#2c3e50',
      fontSize: '1.5rem',
      marginBottom: '1rem',
      borderBottom: '2px solid #3a5a9b',
      paddingBottom: '0.5rem',
    },
    grid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
      gap: '2rem',
      marginBottom: '2rem',
    },
    highlight: {
      backgroundColor: '#f8f9fa',
      padding: '1.5rem',
      borderRadius: '8px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
    },
    modalOverlay: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000,
    },
    modal: {
      backgroundColor: 'white',
      borderRadius: '8px',
      padding: '2rem',
      maxWidth: '500px',
      width: '90%',
      maxHeight: '90vh',
      overflow: 'auto',
    },
    modalTitle: {
      color: '#2c3e50',
      marginBottom: '1.5rem',
      textAlign: 'center',
    },
    modalContent: {
      marginBottom: '2rem',
    },
    benefitsList: {
      listStyle: 'none',
      padding: 0,
      margin: '1rem 0',
    },
    modalActions: {
      display: 'flex',
      justifyContent: 'flex-end',
      gap: '1rem',
    },
    confirmButton: {
      backgroundColor: '#3a5a9b',
      color: 'white',
      border: 'none',
      padding: '0.75rem 1.5rem',
      borderRadius: '4px',
      cursor: 'pointer',
      fontSize: '1rem',
    },
    cancelButton: {
      backgroundColor: '#6c757d',
      color: 'white',
      border: 'none',
      padding: '0.75rem 1.5rem',
      borderRadius: '4px',
      cursor: 'pointer',
      fontSize: '1rem',
    },
    loadingContainer: {
      textAlign: 'center',
      padding: '2rem',
      backgroundColor: 'white',
      borderRadius: '8px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    },
    errorContainer: {
      textAlign: 'center',
      padding: '2rem',
      backgroundColor: '#f8d7da',
      borderRadius: '8px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      color: '#721c24',
    },
    errorActions: {
      display: 'flex',
      gap: '1rem',
      justifyContent: 'center',
      marginTop: '1rem',
    },
    retryButton: {
      backgroundColor: '#3a5a9b',
      color: 'white',
      border: 'none',
      padding: '0.75rem 1.5rem',
      borderRadius: '4px',
      fontSize: '1rem',
      cursor: 'pointer',
      transition: 'background-color 0.2s',
    },
    backButton: {
      backgroundColor: '#6c757d',
      color: 'white',
      border: 'none',
      padding: '0.75rem 1.5rem',
      borderRadius: '4px',
      fontSize: '1rem',
      cursor: 'pointer',
      transition: 'background-color 0.2s',
    },
    enrollmentSection: {
      marginTop: '20px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '10px'
    },
    enrollmentStatus: {
      color: '#666',
      fontSize: '0.9rem',
      marginTop: '5px',
      textAlign: 'center'
    }
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loadingContainer}>
          <p>Loading course details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.container}>
        <div style={styles.errorContainer}>
          <h2>Error</h2>
          <p>{error}</p>
          <div style={styles.errorActions}>
            <button 
              onClick={() => window.location.reload()} 
              style={styles.retryButton}
            >
              Retry
            </button>
            <button 
              onClick={() => navigate('/courses')} 
              style={styles.backButton}
            >
              Back to Courses
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div style={styles.container}>
        <div style={styles.errorContainer}>
          <h2>Course Not Found</h2>
          <p>The course you're looking for doesn't exist or has been removed.</p>
          <button 
            onClick={() => navigate('/courses')} 
            style={styles.backButton}
          >
            Back to Courses
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <img 
          src={course.cover_image || course.thumbnail} 
          alt={course.title} 
          style={styles.courseImage}
          onError={(e) => {
            e.target.src = defaultImageUrl;
            e.target.onerror = null;
          }}
        />
        <h1 style={styles.title}>{course.title}</h1>
        <div style={styles.instructorSection}>
          <p style={styles.instructorTitle}>Course Instructor</p>
          <div style={styles.instructorDetails}>
            <strong style={styles.instructorName}>
              {course.instructor?.name || 'Unknown Instructor'}
            </strong>
            {course.instructor?.email && (
              <span style={styles.instructorEmail}>
                Contact: {course.instructor.email}
              </span>
            )}
          </div>
        </div>
        <div style={styles.enrollmentSection}>
          {isEnrolled ? (
            <>
              <button 
                style={{
                  ...styles.enrollButton,
                  backgroundColor: '#4CAF50',
                  cursor: 'pointer',
                  marginBottom: '1rem'
                }}
                onClick={() => navigate(`/courses/${courseId}/learn`)}
              >
                Continue Learning
              </button>
              <button 
                style={{
                  ...styles.enrollButton,
                  backgroundColor: '#dc3545',
                  cursor: 'pointer',
                  opacity: enrolling ? 0.7 : 1
                }}
                onClick={handleCancelEnrollment}
                disabled={enrolling}
              >
                {enrolling ? 'Processing...' : 'Cancel Enrollment'}
              </button>
              <p style={styles.enrollmentStatus}>
                You are currently enrolled in this course
              </p>
            </>
          ) : (
            <button 
              style={styles.enrollButton}
              onClick={() => setShowEnrollmentModal(true)}
              disabled={enrolling}
            >
              {enrolling ? 'Processing...' : 'Enroll Now'}
            </button>
          )}
        </div>
      </div>

      {error && (
        <div style={{
          ...styles.errorContainer,
          margin: '1rem 0'
        }}>
          <p>{error}</p>
        </div>
      )}

      <div style={styles.infoSection}>
        <h2 style={styles.sectionTitle}>Course Overview</h2>
        <p style={styles.description}>{course.description}</p>
      </div>

      <div style={styles.infoSection}>
        <h2 style={styles.sectionTitle}>Course Details</h2>
        <div style={styles.grid}>
          <div style={styles.highlight}>
            <h3>Course Information</h3>
            <ul>
              <li>Duration: {course.duration_in_weeks} weeks</li>
              <li>Difficulty: {course.difficulty}</li>
              <li>Price: ${course.price}</li>
              <li>Total Students: {course.total_students || 0}</li>
            </ul>
          </div>
          <div style={styles.highlight}>
            <h3>What's Included</h3>
            <ul>
              <li>Full lifetime access</li>
              <li>Access on mobile and desktop</li>
              <li>Certificate of completion</li>
              <li>Downloadable resources</li>
            </ul>
          </div>
        </div>
      </div>

      {course.modules && course.modules.length > 0 && (
        <div style={styles.infoSection}>
          <h2 style={styles.sectionTitle}>Course Content</h2>
          <div style={styles.courseContent}>
            {course.modules.map((module) => (
              <div key={module.id} style={styles.module}>
                <h3 style={styles.moduleTitle}>
                  Module {module.order}: {module.title}
                </h3>
                {module.sections && module.sections.length > 0 ? (
                  <div style={styles.sectionList}>
                    {module.sections.map((section) => (
                      <div key={section.id} style={styles.section}>
                        <h4 style={styles.sectionTitle}>
                          Section {section.order}: {section.title}
                        </h4>
                        {section.lessons && section.lessons.length > 0 ? (
                          <ul style={styles.lessonList}>
                            {section.lessons.map((lesson) => (
                              <li key={lesson.id} style={styles.lesson}>
                                <span style={styles.lessonTitle}>
                                  {lesson.title}
                                </span>
                                <span style={styles.lessonDuration}>
                                  {lesson.duration} min
                                </span>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p>No lessons available in this section</p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p>No sections available in this module</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {showEnrollmentModal && <EnrollmentModal />}
    </div>
  );
}

export default CourseDetail;