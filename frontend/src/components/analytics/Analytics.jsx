import React, { useState, useEffect } from 'react';

function Analytics() {
  const [analytics, setAnalytics] = useState({
    totalCourses: 0,
    completedCourses: 0,
    inProgressCourses: 0,
    totalExams: 0,
    passedExams: 0,
    averageScore: 0,
    timeSpent: 0,
    lastAccessed: null,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const response = await fetch('http://localhost:8000/api/analytics/', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
            'Accept': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch analytics');
        }

        const data = await response.json();
        setAnalytics(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  const styles = {
    container: {
      padding: '2rem',
      maxWidth: '1200px',
      margin: '0 auto',
    },
    header: {
      color: '#3a5a9b',
      marginBottom: '2rem',
    },
    statsGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
      gap: '1.5rem',
      marginBottom: '2rem',
    },
    statCard: {
      backgroundColor: 'white',
      borderRadius: '8px',
      padding: '1.5rem',
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
    },
    statTitle: {
      color: '#666',
      fontSize: '0.9rem',
      marginBottom: '0.5rem',
    },
    statValue: {
      color: '#3a5a9b',
      fontSize: '2rem',
      fontWeight: 'bold',
    },
    progressSection: {
      backgroundColor: 'white',
      borderRadius: '8px',
      padding: '1.5rem',
      marginBottom: '1.5rem',
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
    },
    progressTitle: {
      color: '#3a5a9b',
      marginBottom: '1rem',
    },
    progressBar: {
      backgroundColor: '#f0f0f0',
      borderRadius: '4px',
      height: '8px',
      marginBottom: '0.5rem',
    },
    progressFill: {
      backgroundColor: '#3a5a9b',
      height: '100%',
      borderRadius: '4px',
      transition: 'width 0.3s ease',
    },
    loading: {
      textAlign: 'center',
      padding: '2rem',
      color: '#666',
    },
    error: {
      textAlign: 'center',
      padding: '2rem',
      color: '#dc3545',
      backgroundColor: '#ffebee',
      borderRadius: '8px',
    },
  };

  if (loading) {
    return <div style={styles.loading}>Loading analytics...</div>;
  }

  if (error) {
    return <div style={styles.error}>{error}</div>;
  }

  const completionRate = (analytics.completedCourses / analytics.totalCourses) * 100 || 0;
  const examPassRate = (analytics.passedExams / analytics.totalExams) * 100 || 0;

  return (
    <div style={styles.container}>
      <h1 style={styles.header}>Learning Analytics</h1>
      
      <div style={styles.statsGrid}>
        <div style={styles.statCard}>
          <div style={styles.statTitle}>Total Courses</div>
          <div style={styles.statValue}>{analytics.totalCourses}</div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statTitle}>Completed Courses</div>
          <div style={styles.statValue}>{analytics.completedCourses}</div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statTitle}>In Progress</div>
          <div style={styles.statValue}>{analytics.inProgressCourses}</div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statTitle}>Average Score</div>
          <div style={styles.statValue}>{analytics.averageScore}%</div>
        </div>
      </div>

      <div style={styles.progressSection}>
        <h2 style={styles.progressTitle}>Course Completion Rate</h2>
        <div style={styles.progressBar}>
          <div 
            style={{
              ...styles.progressFill,
              width: `${completionRate}%`
            }}
          />
        </div>
        <div>{completionRate.toFixed(1)}% Complete</div>
      </div>

      <div style={styles.progressSection}>
        <h2 style={styles.progressTitle}>Exam Performance</h2>
        <div style={styles.progressBar}>
          <div 
            style={{
              ...styles.progressFill,
              width: `${examPassRate}%`
            }}
          />
        </div>
        <div>{examPassRate.toFixed(1)}% Pass Rate</div>
      </div>

      <div style={styles.progressSection}>
        <h2 style={styles.progressTitle}>Learning Activity</h2>
        <div>
          <p>Total Time Spent: {Math.round(analytics.timeSpent / 60)} hours</p>
          <p>Last Activity: {analytics.lastAccessed ? new Date(analytics.lastAccessed).toLocaleDateString() : 'N/A'}</p>
        </div>
      </div>
    </div>
  );
}

export default Analytics; 