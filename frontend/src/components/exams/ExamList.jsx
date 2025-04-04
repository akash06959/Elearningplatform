import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';

function ExamList() {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      navigate('/login');
      return;
    }

    const fetchExams = async () => {
      try {
        const response = await fetch('http://localhost:8000/api/exams/', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
          },
        });

        if (!response.ok) {
          if (response.status === 401) {
            navigate('/login');
            return;
          }
          throw new Error('Failed to fetch exams');
        }

        const data = await response.json();
        setExams(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchExams();
  }, [navigate]);

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
    examGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
      gap: '2rem',
    },
    examCard: {
      backgroundColor: 'white',
      borderRadius: '8px',
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
      padding: '1.5rem',
      transition: 'transform 0.2s ease-in-out',
    },
    examTitle: {
      color: '#3a5a9b',
      marginBottom: '1rem',
      fontSize: '1.25rem',
    },
    examInfo: {
      color: '#666',
      marginBottom: '1rem',
    },
    examMeta: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: '1rem',
      padding: '0.5rem 0',
      borderTop: '1px solid #eee',
    },
    startButton: {
      backgroundColor: '#3a5a9b',
      color: 'white',
      padding: '0.5rem 1rem',
      borderRadius: '4px',
      textDecoration: 'none',
      fontSize: '0.9rem',
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
    noExams: {
      textAlign: 'center',
      padding: '2rem',
      color: '#666',
    }
  };

  if (loading) {
    return <div style={styles.loading}>Loading exams...</div>;
  }

  if (error) {
    return <div style={styles.error}>{error}</div>;
  }

  if (!exams.length) {
    return (
      <div style={styles.container}>
        <h1 style={styles.header}>Available Exams</h1>
        <div style={styles.noExams}>No exams available at this time.</div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <h1 style={styles.header}>Available Exams</h1>
      <div style={styles.examGrid}>
        {exams.map((exam) => (
          <div 
            key={exam.id} 
            style={styles.examCard}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-5px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'none';
            }}
          >
            <h2 style={styles.examTitle}>{exam.title}</h2>
            <p style={styles.examInfo}>{exam.description}</p>
            <div style={styles.examMeta}>
              <div>
                <div>Duration: {exam.duration} minutes</div>
                <div>Total Marks: {exam.total_marks}</div>
              </div>
              <Link 
                to={`/exams/${exam.id}`} 
                style={styles.startButton}
              >
                Start Exam
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ExamList; 