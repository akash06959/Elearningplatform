import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import './UserProfile.css';

const UserProfile = () => {
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      navigate('/login');
      return;
    }

    const fetchUserProfile = async () => {
      try {
        const response = await fetch('http://localhost:8000/accounts/api/profile/', {
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
          throw new Error('Failed to fetch user profile');
        }

        const data = await response.json();
        console.log('Profile data:', data);
        setUserProfile(data);
      } catch (err) {
        console.error('Error fetching profile:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [navigate]);

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading profile...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <h3>Error</h3>
        <p>{error}</p>
        <button onClick={() => window.location.reload()}>Try Again</button>
      </div>
    );
  }

  if (!userProfile) {
    return (
      <div className="no-profile-container">
        <p>No profile data available</p>
        <Link to="/profile/edit" className="edit-profile-button">Create Profile</Link>
      </div>
    );
  }

  return (
    <div className="user-profile-container">
      <div className="profile-header">
        <div className="profile-picture-container">
          {userProfile.profile_picture ? (
            <img 
              src={userProfile.profile_picture} 
              alt="Profile" 
              className="profile-picture"
            />
          ) : (
            <div className="profile-picture-placeholder">
              {userProfile.first_name ? userProfile.first_name[0].toUpperCase() : userProfile.username[0].toUpperCase()}
            </div>
          )}
        </div>
        <div className="profile-title">
          <h2>{userProfile.first_name && userProfile.last_name 
            ? `${userProfile.first_name} ${userProfile.last_name}`
            : userProfile.username}
          </h2>
          <p className="user-type">{userProfile.user_type}</p>
        </div>
        <Link to="/profile/edit" className="edit-profile-button">Edit Profile</Link>
      </div>

      <div className="profile-content">
        <div className="profile-section">
          <h3>Basic Information</h3>
          <div className="info-grid">
            <div className="info-item">
              <label>Username</label>
              <p>{userProfile.username}</p>
            </div>
            <div className="info-item">
              <label>Email</label>
              <p>{userProfile.email}</p>
            </div>
            <div className="info-item">
              <label>First Name</label>
              <p>{userProfile.first_name || 'Not specified'}</p>
            </div>
            <div className="info-item">
              <label>Last Name</label>
              <p>{userProfile.last_name || 'Not specified'}</p>
            </div>
            <div className="info-item">
              <label>User Type</label>
              <p>{userProfile.user_type}</p>
            </div>
            <div className="info-item">
              <label>Phone Number</label>
              <p>{userProfile.phone_number || 'Not specified'}</p>
            </div>
          </div>
        </div>

        <div className="profile-section">
          <h3>Additional Information</h3>
          <div className="info-grid">
            <div className="info-item full-width">
              <label>Bio</label>
              <p>{userProfile.bio || 'No bio added yet'}</p>
            </div>
            <div className="info-item full-width">
              <label>Address</label>
              <p>{userProfile.address || 'Not specified'}</p>
            </div>
            <div className="info-item">
              <label>Date of Birth</label>
              <p>{userProfile.date_of_birth || 'Not specified'}</p>
            </div>
            <div className="info-item">
              <label>Preferred Language</label>
              <p>{userProfile.preferred_language || 'Not specified'}</p>
            </div>
            <div className="info-item">
              <label>Timezone</label>
              <p>{userProfile.timezone || 'Not specified'}</p>
            </div>
          </div>
        </div>

        <div className="profile-section">
          <h3>Achievements</h3>
          <div className="info-grid">
            <div className="info-item">
              <label>Points</label>
              <p>{userProfile.points || 0}</p>
            </div>
            <div className="info-item">
              <label>Badges</label>
              <div className="badges-container">
                {userProfile.badges && userProfile.badges.length > 0 ? (
                  userProfile.badges.map((badge, index) => (
                    <span key={index} className="badge">{badge}</span>
                  ))
                ) : (
                  <p>No badges earned yet</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile; 