import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { courseAPI } from '../../services/api';
import './EnrollmentList.css';
import Navbar from '../shared/Navbar';
import Footer from '../shared/Footer';

function EnrollmentList() {
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchEnrollments = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await courseAPI.getEnrolledCourses();
        
        // Handle paginated response
        const enrollmentList = Array.isArray(data) ? data : (data.results || []);
        
        // Process data
        const processedData = enrollmentList.map(enrollment => ({
          id: enrollment.course?.id || enrollment.course_id || enrollment.id,
          title: enrollment.course?.title || enrollment.title,
          instructor: enrollment.course?.instructor?.name || enrollment.instructor?.name || 'Unknown Instructor',
          enrolled_at: enrollment.enrollment_date || enrollment.enrolled_at || enrollment.created_at
            ? new Date(enrollment.enrollment_date || enrollment.enrolled_at || enrollment.created_at).toLocaleDateString()
            : 'Not available'
        }));
        
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

  return (
    <div className="enrollment-page">
      <Navbar />
      <div className="enrollment-content">
        <div className="enrollment-list">
          <h2>My Enrolled Courses</h2>
          {loading ? (
            <div className="loading">
              <p>Loading enrolled courses...</p>
            </div>
          ) : error ? (
            <div className="error">
              <p>{error}</p>
              <button 
                onClick={() => window.location.reload()} 
                className="retry-btn"
              >
                Retry
              </button>
            </div>
          ) : enrollments.length === 0 ? (
            <div className="no-enrollments">
              <p>You haven't enrolled in any courses yet.</p>
              <Link to="/courses" className="browse-courses-btn">
                Browse Courses
              </Link>
            </div>
          ) : (
            <div className="enrollment-list-box">
              <table className="enrollment-table">
                <thead>
                  <tr>
                    <th>Course Name</th>
                    <th>Instructor</th>
                    <th>Enrolled Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {enrollments.map((enrollment) => (
                    <tr key={enrollment.id} className="enrollment-item">
                      <td>
                        <Link 
                          to={`/courses/${enrollment.id}`}
                          className="course-link"
                        >
                          {enrollment.title}
                        </Link>
                      </td>
                      <td>{enrollment.instructor}</td>
                      <td>{enrollment.enrolled_at}</td>
                      <td>
                        <button
                          onClick={() => navigate(`/courses/${enrollment.id}/learn`)}
                          className="continue-btn"
                        >
                          Continue Learning
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}

export default EnrollmentList;