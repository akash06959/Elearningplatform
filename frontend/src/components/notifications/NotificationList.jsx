import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './NotificationList.css';

function NotificationList() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        setLoading(true);
        setError(null);
        // TODO: Replace with actual API call
        const mockNotifications = [
          {
            id: 1,
            title: 'New Assignment Available',
            message: 'A new assignment has been posted for your course "Django Development"',
            courseId: 1,
            courseName: 'Django Development',
            date: '2024-03-20T10:00:00Z',
            isRead: false
          },
          {
            id: 2,
            title: 'Course Update',
            message: 'New content has been added to your course "Web Development"',
            courseId: 2,
            courseName: 'Web Development',
            date: '2024-03-19T15:30:00Z',
            isRead: true
          }
        ];
        setNotifications(mockNotifications);
      } catch (err) {
        console.error('Error fetching notifications:', err);
        setError(err.message || 'Failed to fetch notifications. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, []);

  if (loading) {
    return (
      <div className="notification-list">
        <h2>Notifications</h2>
        <div className="loading">
          <p>Loading notifications...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="notification-list">
        <h2>Notifications</h2>
        <div className="error">
          <p>{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="retry-btn"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (notifications.length === 0) {
    return (
      <div className="notification-list">
        <h2>Notifications</h2>
        <div className="no-notifications">
          <p>You have no notifications.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="notification-list">
      <h2>Notifications</h2>
      <div className="notification-list-box">
        {notifications.map((notification) => (
          <div 
            key={notification.id} 
            className={`notification-item ${notification.isRead ? 'read' : 'unread'}`}
          >
            <div className="notification-content">
              <h3>{notification.title}</h3>
              <p>{notification.message}</p>
              <div className="notification-meta">
                <span className="course-name">
                  Course: {notification.courseName}
                </span>
                <span className="date">
                  {new Date(notification.date).toLocaleDateString()}
                </span>
              </div>
            </div>
            <div className="notification-actions">
              <Link 
                to={`/courses/${notification.courseId}`}
                className="view-course-btn"
              >
                View Course
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default NotificationList; 