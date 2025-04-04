import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { courseAPI } from '../../services/api';

function CourseList() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const defaultImageUrl = 'https://placehold.co/300x160';

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setLoading(true);
        setError(null);
        console.log('Starting to fetch courses...');
        
        const courseList = await courseAPI.getAllCourses();
        console.log('Received courses:', courseList);
        
        if (!courseList) {
          console.error('No course data received');
          throw new Error('No course data received from server');
        }
        
        // Process image URLs
        const processedData = courseList.map(course => {
          console.log('Processing course:', course);
          return {
            ...course,
            thumbnail: course.thumbnail ? 
              (course.thumbnail.startsWith('http') ? course.thumbnail : `http://localhost:8000${course.thumbnail}`)
              : defaultImageUrl,
            cover_image: course.cover_image ? 
              (course.cover_image.startsWith('http') ? course.cover_image : `http://localhost:8000${course.cover_image}`)
              : defaultImageUrl
          };
        });
        
        console.log('Final processed courses:', processedData);
        
        if (processedData.length === 0) {
          console.log('No courses found in the processed data');
        }
        
        setCourses(processedData);
      } catch (err) {
        console.error('Error fetching courses:', err);
        console.error('Error details:', {
          message: err.message,
          stack: err.stack,
          response: err.response?.data
        });
        setError(err.message || 'Failed to load courses. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, []);

  const styles = {
    container: {
      padding: '2rem',
      maxWidth: '1200px',
      margin: '0 auto',
    },
    heading: {
      color: '#3a5a9b',
      marginBottom: '1.5rem',
      fontSize: '2rem',
    },
    courseGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
      gap: '1.5rem',
    },
    courseCard: {
      backgroundColor: 'white',
      borderRadius: '8px',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
      overflow: 'hidden',
      transition: 'transform 0.3s ease',
    },
    courseImage: {
      width: '100%',
      height: '160px',
      objectFit: 'cover',
      backgroundColor: '#e9ecef',
    },
    courseContent: {
      padding: '1.5rem',
    },
    courseTitle: {
      fontSize: '1.25rem',
      fontWeight: 'bold',
      color: '#3a5a9b',
      marginBottom: '0.5rem',
    },
    courseDescription: {
      fontSize: '0.9rem',
      color: '#555',
      marginBottom: '1rem',
      lineHeight: '1.5',
      // Limit description to 3 lines
      overflow: 'hidden',
      display: '-webkit-box',
      WebkitLineClamp: '3',
      WebkitBoxOrient: 'vertical',
      textOverflow: 'ellipsis',
    },
    courseDetails: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: '1rem',
    },
    courseInstructor: {
      fontSize: '0.85rem',
      color: '#777',
    },
    courseButton: {
      backgroundColor: '#3a5a9b',
      color: 'white',
      border: 'none',
      padding: '0.5rem 1rem',
      borderRadius: '4px',
      textDecoration: 'none',
      fontSize: '0.9rem',
      display: 'inline-block',
      transition: 'background-color 0.2s',
      cursor: 'pointer',
      '&:hover': {
        backgroundColor: '#2c4475',
      },
    },
    loadingContainer: {
      textAlign: 'center',
      padding: '2rem',
    },
    errorContainer: {
      textAlign: 'center',
      padding: '2rem',
      color: '#dc3545',
      backgroundColor: '#f8d7da',
      borderRadius: '8px',
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
      marginTop: '1rem',
      transition: 'background-color 0.2s',
      '&:hover': {
        backgroundColor: '#2c4475',
      },
    },
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <h1 style={styles.heading}>Available Courses</h1>
        <div style={styles.loadingContainer}>
          <p>Loading courses...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.container}>
        <h1 style={styles.heading}>Available Courses</h1>
        <div style={styles.errorContainer}>
          <p>{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            style={styles.retryButton}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <h1 style={styles.heading}>Available Courses</h1>
      
      <div style={styles.courseGrid}>
        {courses.length > 0 ? (
          courses.map(course => (
            <div 
              key={course.id} 
              style={styles.courseCard}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-5px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'none';
              }}
            >
              <img 
                src={course.thumbnail || course.cover_image || defaultImageUrl} 
                alt={course.title} 
                style={styles.courseImage}
                onError={(e) => {
                  e.target.src = defaultImageUrl;
                  e.target.onerror = null;
                }}
              />
              <div style={styles.courseContent}>
                <h2 style={styles.courseTitle}>{course.title}</h2>
                <p style={styles.courseDescription}>
                  {course.description || 'No description available.'}
                </p>
                <div style={styles.courseDetails}>
                  <span style={styles.courseInstructor}>
                    Instructor: {course.instructor?.name || course.instructor?.username || course.instructor || 'Unknown'}
                  </span>
                  <Link to={`/courses/${course.id}`} style={styles.courseButton}>
                    View Details
                  </Link>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div style={{ textAlign: 'center', gridColumn: '1 / -1', padding: '2rem' }}>
            <p>No courses available at this time.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default CourseList;