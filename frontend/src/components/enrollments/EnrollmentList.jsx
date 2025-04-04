import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { courseAPI } from '../../services/api';
import './EnrollmentList.css';

function EnrollmentList() {
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const defaultImageUrl = 'https://placehold.co/300x160';

  useEffect(() => {
    const fetchEnrollments = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await courseAPI.getEnrolledCourses();
        
        // Handle paginated response
        const enrollmentList = Array.isArray(data) ? data : (data.results || []);
        
        // Process image URLs and data
        const processedData = enrollmentList.map(enrollment => {
          // Extract instructor information
          let instructorName = 'Unknown';
          if (typeof enrollment.instructor === 'string') {
            instructorName = enrollment.instructor;
          } else if (enrollment.instructor?.name) {
            instructorName = enrollment.instructor.name;
          } else if (enrollment.instructor?.username) {
            instructorName = enrollment.instructor.username;
          } else if (enrollment.course?.instructor?.name) {
            instructorName = enrollment.course.instructor.name;
          } else if (enrollment.course?.instructor?.username) {
            instructorName = enrollment.course.instructor.username;
          }

          return {
            ...enrollment,
            thumbnail: enrollment.thumbnail ? 
              (enrollment.thumbnail.startsWith('http') ? enrollment.thumbnail : `http://localhost:8000${enrollment.thumbnail}`)
              : enrollment.course_image ? 
                (enrollment.course_image.startsWith('http') ? enrollment.course_image : `http://localhost:8000${enrollment.course_image}`)
                : defaultImageUrl,
            course_id: enrollment.course?.id || enrollment.course_id || enrollment.id,
            title: enrollment.course?.title || enrollment.title,
            description: enrollment.course?.description || enrollment.description,
            instructor: instructorName,
            category: enrollment.course?.category || enrollment.category || 'Uncategorized',
            difficulty: enrollment.course?.difficulty || enrollment.difficulty || 'Not specified',
            duration_in_weeks: enrollment.course?.duration_in_weeks || enrollment.duration_in_weeks || 'N/A'
          };
        });
        
        setEnrollments(processedData);
      } catch (err) {
        console.error('Error fetching enrollments:', err);
        setError(err.message || 'Failed to fetch enrollments. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchEnrollments();
  }, []);

  if (loading) {
    return (
      <div className="enrollment-list">
        <h2>My Enrolled Courses</h2>
        <div className="loading">
          <p>Loading enrolled courses...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="enrollment-list">
        <h2>My Enrolled Courses</h2>
        <div className="error">
          <p>{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="retry-btn"
          >
            Retry
          </button>
          <Link to="/courses" className="browse-courses-btn">
            Browse Courses
          </Link>
        </div>
      </div>
    );
  }

  if (enrollments.length === 0) {
    return (
      <div className="enrollment-list">
        <h2>My Enrolled Courses</h2>
        <div className="no-enrollments">
          <p>You haven't enrolled in any courses yet.</p>
          <Link to="/courses" className="browse-courses-btn">
            Browse Courses
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="enrollment-list">
      <h2>My Enrolled Courses</h2>
      <div className="enrollment-grid">
        {enrollments.map((enrollment) => (
          <div key={enrollment.course_id} className="enrollment-card">
            <div className="enrollment-image">
              <img 
                src={enrollment.thumbnail} 
                alt={enrollment.title}
                onError={(e) => {
                  e.target.src = defaultImageUrl;
                  e.target.onerror = null;
                }}
              />
            </div>
            <div className="enrollment-content">
              <h3>{enrollment.title}</h3>
              <p className="description">
                {enrollment.description || 'No description available.'}
              </p>
              <div className="enrollment-meta">
                <span className="instructor">Instructor: {enrollment.instructor}</span>
                <span className="category">{enrollment.category}</span>
                <span className="difficulty">{enrollment.difficulty}</span>
                <span className="duration">{enrollment.duration_in_weeks} weeks</span>
              </div>
              <div className="enrollment-actions">
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    navigate(`/courses/${enrollment.course_id}/learn`);
                  }}
                  className="continue-btn"
                >
                  Continue Learning
                </button>
                <Link
                  to={`/courses/${enrollment.course_id}/progress`}
                  className="progress-btn"
                >
                  View Progress
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default EnrollmentList;