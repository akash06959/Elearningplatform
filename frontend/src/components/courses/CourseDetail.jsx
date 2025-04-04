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
  const BASE_URL = process.env.REACT_APP_BASE_URL || 'http://localhost:8000';

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
        
        // Get course details and check enrollment status in parallel
        const [courseData, enrollmentStatus] = await Promise.all([
          courseAPI.getCourseById(courseId),
          courseAPI.checkEnrollmentStatus(courseId)
        ]);
        
        console.log('Course data:', courseData);
        console.log('Enrollment status:', enrollmentStatus);
        
        if (!courseData || typeof courseData !== 'object') {
          console.error('Invalid course data received:', courseData);
          throw new Error('Course not found or invalid data received');
        }

        // Process course data
        const processedData = {
          ...courseData,
          thumbnail: courseData.thumbnail ? 
            (courseData.thumbnail.startsWith('http') ? courseData.thumbnail : `${BASE_URL}${courseData.thumbnail}`)
            : defaultImageUrl,
          cover_image: courseData.cover_image ? 
            (courseData.cover_image.startsWith('http') ? courseData.cover_image : `${BASE_URL}${courseData.cover_image}`)
            : defaultImageUrl,
          instructor: courseData.instructor || {
            name: 'Unknown Instructor',
            username: 'unknown',
            email: ''
          },
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
        
        setCourse(processedData);
        
        // Update enrollment status
        const isEnrolled = enrollmentStatus?.is_enrolled || enrollmentStatus?.enrolled || false;
        console.log('Setting enrollment status:', isEnrolled);
        setIsEnrolled(isEnrolled);
        
      } catch (err) {
        console.error('Error fetching course:', err);
        setError(err.message || 'Failed to load course details');
        setCourse(null);
        setIsEnrolled(false);
      } finally {
        setLoading(false);
      }
    };

    fetchCourseDetails();
  }, [courseId, navigate]);

  const handleEnroll = async () => {
    try {
      setEnrolling(true);
      
      console.log('Starting enrollment process...');
      const response = await courseAPI.enrollInCourse(courseId);
      console.log('Enrollment response:', response);

      setIsEnrolled(true);
      setShowEnrollmentModal(false);
      toast.success(response.message || 'Successfully enrolled in the course!');
      
      // Instead of navigating, just update the UI state
      // This will show the "Continue Learning" button
      setIsEnrolled(true);
      
    } catch (err) {
      console.error('Error enrolling in course:', err);
      
      if (err.message.includes('already enrolled')) {
        // If already enrolled, just update the UI state
        setIsEnrolled(true);
        setShowEnrollmentModal(false);
        toast.success('You are already enrolled in this course');
      } else {
        toast.error(err.message || 'Failed to enroll in course. Please try again.');
      }
    } finally {
      setEnrolling(false);
    }
  };

  // Add a check before showing enrollment modal
  const handleEnrollClick = () => {
    if (isEnrolled) {
      // Instead of directly navigating, show a message
      toast.success('You are already enrolled! Click "Continue Learning" when ready to start.');
    } else {
      setShowEnrollmentModal(true);
    }
  };

  const handleContinueLearning = () => {
    navigate(`/courses/${courseId}/learn`);
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
      width: '100%',
      margin: '0 auto',
      backgroundColor: '#f5f5f5',
    },
    hero: {
      backgroundColor: '#1e1e1c',
      color: 'white',
      padding: '40px 0',
      marginBottom: '2rem',
    },
    heroContent: {
      maxWidth: '1200px',
      margin: '0 auto',
      padding: '0 2rem',
    },
    breadcrumb: {
      color: '#a1a1a1',
      fontSize: '0.9rem',
      marginBottom: '1rem',
    },
    title: {
      fontSize: '2.5rem',
      fontWeight: '700',
      marginBottom: '1.5rem',
      color: 'white',
    },
    subtitle: {
      fontSize: '1.2rem',
      color: '#a1a1a1',
      marginBottom: '2rem',
      lineHeight: '1.6',
    },
    mainContent: {
      maxWidth: '1200px',
      margin: '0 auto',
      padding: '0 2rem',
      display: 'grid',
      gridTemplateColumns: '2fr 1fr',
      gap: '2rem',
    },
    courseInfo: {
      backgroundColor: 'white',
      borderRadius: '8px',
      padding: '2rem',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    },
    courseSidebar: {
      position: 'sticky',
      top: '20px',
      alignSelf: 'start',
    },
    enrollCard: {
      backgroundColor: 'white',
      borderRadius: '8px',
      padding: '2rem',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      marginBottom: '1rem',
    },
    highlights: {
      display: 'grid',
      gridTemplateColumns: 'repeat(2, 1fr)',
      gap: '1.5rem',
      marginBottom: '2rem',
    },
    highlightCard: {
      backgroundColor: '#f8f9fa',
      padding: '1.5rem',
      borderRadius: '8px',
      border: '1px solid #e9ecef',
    },
    highlightTitle: {
      fontSize: '1.1rem',
      fontWeight: '600',
      marginBottom: '1rem',
      color: '#2d2d2d',
    },
    highlightList: {
      listStyle: 'none',
      padding: 0,
      margin: 0,
    },
    highlightItem: {
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
      marginBottom: '0.75rem',
      color: '#4a4a4a',
      fontSize: '0.95rem',
    },
    sectionTitle: {
      fontSize: '1.5rem',
      fontWeight: '600',
      marginBottom: '1.5rem',
      color: '#2d2d2d',
    },
    instructorSection: {
      display: 'flex',
      alignItems: 'center',
      gap: '1.5rem',
      padding: '1.5rem',
      backgroundColor: '#f8f9fa',
      borderRadius: '8px',
      marginBottom: '2rem',
    },
    instructorAvatar: {
      width: '80px',
      height: '80px',
      borderRadius: '50%',
      objectFit: 'cover',
    },
    instructorInfo: {
      flex: 1,
    },
    instructorName: {
      fontSize: '1.2rem',
      fontWeight: '600',
      marginBottom: '0.5rem',
      color: '#2d2d2d',
    },
    instructorBio: {
      color: '#4a4a4a',
      fontSize: '0.95rem',
      lineHeight: '1.5',
    },
    enrollButton: {
      backgroundColor: '#0056D2',
      color: 'white',
      border: 'none',
      padding: '1rem 2rem',
      borderRadius: '4px',
      fontSize: '1.1rem',
      fontWeight: '600',
      cursor: 'pointer',
      width: '100%',
      transition: 'background-color 0.2s',
      marginBottom: '1rem',
    },
    enrolledButton: {
      backgroundColor: '#28a745',
      color: 'white',
      border: 'none',
      padding: '1rem 2rem',
      borderRadius: '4px',
      fontSize: '1.1rem',
      fontWeight: '600',
      width: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '0.5rem',
      marginBottom: '1rem',
    },
    courseStats: {
      display: 'grid',
      gridTemplateColumns: 'repeat(2, 1fr)',
      gap: '1rem',
      marginBottom: '1.5rem',
    },
    statItem: {
      textAlign: 'center',
      padding: '1rem',
      backgroundColor: '#f8f9fa',
      borderRadius: '4px',
    },
    statValue: {
      fontSize: '1.5rem',
      fontWeight: '600',
      color: '#2d2d2d',
      marginBottom: '0.25rem',
    },
    statLabel: {
      fontSize: '0.9rem',
      color: '#6c757d',
    },
    moduleSection: {
      marginTop: '2rem',
    },
    module: {
      backgroundColor: 'white',
      borderRadius: '8px',
      marginBottom: '1rem',
      overflow: 'hidden',
      border: '1px solid #e9ecef',
    },
    moduleHeader: {
      padding: '1.5rem',
      backgroundColor: '#f8f9fa',
      borderBottom: '1px solid #e9ecef',
    },
    moduleTitle: {
      fontSize: '1.1rem',
      fontWeight: '600',
      color: '#2d2d2d',
      margin: 0,
    },
    moduleContent: {
      padding: '1.5rem',
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
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={{ ...styles.heroContent, textAlign: 'center', padding: '4rem 2rem' }}>
          <div style={{ fontSize: '1.2rem', color: '#4a4a4a' }}>Loading course details...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.container}>
        <div style={{ ...styles.heroContent, textAlign: 'center', padding: '4rem 2rem' }}>
          <div style={{ color: '#dc3545', marginBottom: '1rem' }}>{error}</div>
          <button 
            onClick={() => navigate('/courses')}
            style={{
              ...styles.enrollButton,
              maxWidth: '200px',
              backgroundColor: '#6c757d'
            }}
          >
            Back to Courses
          </button>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div style={styles.container}>
        <div style={{ ...styles.heroContent, textAlign: 'center', padding: '4rem 2rem' }}>
          <div style={{ fontSize: '1.2rem', color: '#4a4a4a' }}>Course not found</div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.hero}>
        <div style={styles.heroContent}>
          <div style={styles.breadcrumb}>
            Courses / {course.category || 'All Categories'} / {course.title}
          </div>
          <h1 style={styles.title}>{course.title}</h1>
          <p style={styles.subtitle}>{course.description}</p>
        </div>
      </div>

      <div style={styles.mainContent}>
        <div style={styles.courseInfo}>
          <div style={styles.highlights}>
            <div style={styles.highlightCard}>
              <h3 style={styles.highlightTitle}>Course Information</h3>
              <ul style={styles.highlightList}>
                <li style={styles.highlightItem}>Duration: {course.duration_in_weeks} weeks</li>
                <li style={styles.highlightItem}>Difficulty: {course.difficulty_level}</li>
                <li style={styles.highlightItem}>Category: {course.category || 'Uncategorized'}</li>
                <li style={styles.highlightItem}>Total Students: {course.total_students || 0}</li>
                <li style={styles.highlightItem}>Average Rating: {course.avg_rating?.toFixed(1) || 'No ratings'}</li>
              </ul>
            </div>
            <div style={styles.highlightCard}>
              <h3 style={styles.highlightTitle}>What You'll Learn</h3>
              <ul style={styles.highlightList}>
                <li style={styles.highlightItem}>✓ Full lifetime access</li>
                <li style={styles.highlightItem}>✓ Access on mobile and desktop</li>
                <li style={styles.highlightItem}>✓ Certificate of completion</li>
                <li style={styles.highlightItem}>✓ Downloadable resources</li>
              </ul>
            </div>
          </div>

          <div style={styles.instructorSection}>
            <img
              src={course.instructor?.avatar || 'https://placehold.co/80x80'}
              alt={course.instructor?.name}
              style={styles.instructorAvatar}
            />
            <div style={styles.instructorInfo}>
              <h3 style={styles.instructorName}>{course.instructor?.name || 'Unknown Instructor'}</h3>
              <p style={styles.instructorBio}>
                {course.instructor?.bio || `Expert instructor with extensive experience in teaching ${course.title}`}
              </p>
            </div>
          </div>

          {course.modules && course.modules.length > 0 && (
            <div style={styles.moduleSection}>
              <h2 style={styles.sectionTitle}>Course Content</h2>
              {course.modules.map((module) => (
                <div key={module.id} style={styles.module}>
                  <div style={styles.moduleHeader}>
                    <h3 style={styles.moduleTitle}>Module {module.order}: {module.title}</h3>
                  </div>
                  <div style={styles.moduleContent}>
                    {module.sections && module.sections.map((section) => (
                      <div key={section.id} style={{ marginBottom: '1rem' }}>
                        <h4 style={{ fontSize: '1rem', color: '#2d2d2d', marginBottom: '0.5rem' }}>
                          {section.title}
                        </h4>
                        {section.lessons && section.lessons.length > 0 && (
                          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                            {section.lessons.map((lesson) => (
                              <li key={lesson.id} style={{ 
                                padding: '0.5rem 0',
                                borderBottom: '1px solid #e9ecef',
                                display: 'flex',
                                justifyContent: 'space-between'
                              }}>
                                <span>{lesson.title}</span>
                                <span style={{ color: '#6c757d' }}>{lesson.duration} min</span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={styles.courseSidebar}>
          <div style={styles.enrollCard}>
            <div style={styles.courseStats}>
              <div style={styles.statItem}>
                <div style={styles.statValue}>{course.total_students || 0}</div>
                <div style={styles.statLabel}>Students</div>
              </div>
              <div style={styles.statItem}>
                <div style={styles.statValue}>{course.avg_rating?.toFixed(1) || '0.0'}</div>
                <div style={styles.statLabel}>Rating</div>
              </div>
            </div>

            {isEnrolled ? (
              <>
                <button 
                  style={styles.enrolledButton}
                  onClick={handleContinueLearning}
                >
                  Continue Learning
                </button>
                <button 
                  style={{
                    ...styles.enrollButton,
                    backgroundColor: '#dc3545'
                  }}
                  onClick={handleCancelEnrollment}
                  disabled={enrolling}
                >
                  {enrolling ? 'Processing...' : 'Cancel Enrollment'}
                </button>
              </>
            ) : (
              <button 
                style={{
                  ...styles.enrollButton,
                  opacity: enrolling ? 0.7 : 1,
                  cursor: enrolling ? 'not-allowed' : 'pointer'
                }}
                onClick={handleEnrollClick}
                disabled={enrolling}
              >
                {enrolling ? 'Processing...' : 'Enroll Now'}
              </button>
            )}

            <div style={{ 
              fontSize: '0.9rem',
              color: '#6c757d',
              textAlign: 'center',
              marginTop: '1rem'
            }}>
              {isEnrolled ? 'You are currently enrolled in this course' : 'Start learning today'}
            </div>
          </div>
        </div>
      </div>

      {showEnrollmentModal && <EnrollmentModal />}
    </div>
  );
}

export default CourseDetail;