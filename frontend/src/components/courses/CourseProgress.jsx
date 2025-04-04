import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { courseAPI } from '../../services/api';

function CourseProgress() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [courseData, setCourseData] = useState(null);
  const [progressData, setProgressData] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch course data and progress data
        const [course, progress] = await Promise.all([
          courseAPI.getCourseById(courseId),
          courseAPI.getCourseProgress(courseId)
        ]);

        setCourseData(course);
        setProgressData(progress);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError(err.message || 'Failed to load progress data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
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
      color: '#1d4ed8',
      marginBottom: '1rem',
    },
    progressOverview: {
      backgroundColor: 'white',
      borderRadius: '8px',
      padding: '2rem',
      marginBottom: '2rem',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    },
    progressBar: {
      backgroundColor: '#e5e7eb',
      borderRadius: '9999px',
      height: '1rem',
      overflow: 'hidden',
      marginBottom: '1rem',
    },
    progressFill: {
      backgroundColor: '#1d4ed8',
      height: '100%',
      transition: 'width 0.3s ease',
    },
    stats: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
      gap: '1rem',
      marginBottom: '2rem',
    },
    stat: {
      backgroundColor: 'white',
      padding: '1.5rem',
      borderRadius: '8px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    },
    statLabel: {
      color: '#6b7280',
      fontSize: '0.875rem',
      marginBottom: '0.5rem',
    },
    statValue: {
      color: '#1d4ed8',
      fontSize: '1.5rem',
      fontWeight: 'bold',
    },
    sectionList: {
      backgroundColor: 'white',
      borderRadius: '8px',
      padding: '2rem',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    },
    section: {
      marginBottom: '2rem',
    },
    sectionHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '1rem',
      padding: '1rem',
      backgroundColor: '#f8fafc',
      borderRadius: '0.5rem',
    },
    sectionTitle: {
      fontSize: '1.25rem',
      fontWeight: '600',
      color: '#1e293b',
    },
    sectionProgress: {
      color: '#1d4ed8',
      fontWeight: '500',
    },
    lessonItem: {
      display: 'flex',
      alignItems: 'center',
      padding: '1rem',
      borderBottom: '1px solid #e5e7eb',
    },
    lessonStatus: {
      marginRight: '1rem',
      color: '#059669',
    },
    lessonIncomplete: {
      color: '#6b7280',
    },
    loading: {
      textAlign: 'center',
      padding: '2rem',
      color: '#6b7280',
    },
    error: {
      color: '#dc2626',
      backgroundColor: '#fee2e2',
      padding: '1rem',
      borderRadius: '8px',
      marginBottom: '1rem',
    },
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loading}>Loading progress data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.container}>
        <div style={styles.error}>{error}</div>
      </div>
    );
  }

  if (!courseData || !progressData) {
    return (
      <div style={styles.container}>
        <div style={styles.error}>No data available</div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h1 style={styles.title}>{courseData.title} - Progress</h1>
      </header>

      <div style={styles.progressOverview}>
        <div style={styles.progressBar}>
          <div 
            style={{
              ...styles.progressFill,
              width: `${progressData.overall_progress}%`
            }}
          />
        </div>
        <div style={styles.stats}>
          <div style={styles.stat}>
            <div style={styles.statLabel}>Overall Progress</div>
            <div style={styles.statValue}>{progressData.overall_progress?.toFixed(1)}%</div>
          </div>
          <div style={styles.stat}>
            <div style={styles.statLabel}>Completed Lessons</div>
            <div style={styles.statValue}>{progressData.completed_lessons?.length || 0}</div>
          </div>
          <div style={styles.stat}>
            <div style={styles.statLabel}>Total Lessons</div>
            <div style={styles.statValue}>{courseData.total_lessons || 0}</div>
          </div>
        </div>
      </div>

      <div style={styles.sectionList}>
        <h2 style={{ marginBottom: '1.5rem' }}>Section Progress</h2>
        {courseData.sections?.map((section) => (
          <div key={section.id} style={styles.section}>
            <div style={styles.sectionHeader}>
              <h3 style={styles.sectionTitle}>{section.title}</h3>
              <span style={styles.sectionProgress}>
                {progressData.section_progress?.[section.id]?.toFixed(1)}% Complete
              </span>
            </div>
            {section.lessons?.map((lesson) => (
              <div key={lesson.id} style={styles.lessonItem}>
                <span 
                  style={progressData.completed_lessons?.includes(lesson.id) ? styles.lessonStatus : styles.lessonIncomplete}
                >
                  {progressData.completed_lessons?.includes(lesson.id) ? '✓' : '○'}
                </span>
                <span>{lesson.title}</span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export default CourseProgress; 