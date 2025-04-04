import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { courseAPI } from '../../services/api';
import { toast } from 'react-hot-toast';

function CourseLearn() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCourseData = async () => {
      try {
        setLoading(true);
        const courseData = await courseAPI.getCourseById(courseId);
        setCourse(courseData);
      } catch (err) {
        console.error('Error fetching course:', err);
        setError(err.message || 'Failed to load course');
        toast.error('Failed to load course details');
      } finally {
        setLoading(false);
      }
    };

    fetchCourseData();
  }, [courseId]);

  const styles = {
    container: {
      padding: '2rem',
      maxWidth: '1200px',
      margin: '0 auto',
    },
    header: {
      marginBottom: '2rem',
    },
    title: {
      fontSize: '2rem',
      color: '#2c3e50',
      marginBottom: '1rem',
    },
    table: {
      width: '100%',
      borderCollapse: 'collapse',
      backgroundColor: 'white',
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
      borderRadius: '8px',
      overflow: 'hidden',
    },
    th: {
      backgroundColor: '#f8f9fa',
      padding: '1rem',
      textAlign: 'left',
      borderBottom: '2px solid #dee2e6',
      color: '#495057',
    },
    td: {
      padding: '1rem',
      borderBottom: '1px solid #dee2e6',
      color: '#212529',
    },
    loadingContainer: {
      textAlign: 'center',
      padding: '2rem',
    },
    errorContainer: {
      textAlign: 'center',
      padding: '2rem',
      color: '#dc3545',
    },
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loadingContainer}>Loading course content...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.container}>
        <div style={styles.errorContainer}>
          <p>{error}</p>
          <button onClick={() => navigate('/courses')}>Back to Courses</button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>{course?.title || 'Course Content'}</h1>
      </div>

      <table style={styles.table}>
        <thead>
          <tr>
            <th style={styles.th}>Field</th>
            <th style={styles.th}>Details</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style={styles.td}>Course Title</td>
            <td style={styles.td}>{course?.title || 'N/A'}</td>
          </tr>
          <tr>
            <td style={styles.td}>Instructor</td>
            <td style={styles.td}>{course?.instructor?.name || 'N/A'}</td>
          </tr>
          <tr>
            <td style={styles.td}>Duration</td>
            <td style={styles.td}>{course?.duration_in_weeks || 'N/A'} weeks</td>
          </tr>
          <tr>
            <td style={styles.td}>Difficulty Level</td>
            <td style={styles.td}>{course?.difficulty_level || 'N/A'}</td>
          </tr>
          <tr>
            <td style={styles.td}>Total Students</td>
            <td style={styles.td}>{course?.total_students || 0}</td>
          </tr>
          <tr>
            <td style={styles.td}>Average Rating</td>
            <td style={styles.td}>{course?.avg_rating?.toFixed(1) || 'No ratings yet'}</td>
          </tr>
          <tr>
            <td style={styles.td}>Description</td>
            <td style={styles.td}>{course?.description || 'No description available'}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

export default CourseLearn; 