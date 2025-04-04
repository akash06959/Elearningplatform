import React, { useState, useEffect } from 'react';

const UserProfile = () => {
  const [profile, setProfile] = useState({
    username: '',
    email: '',
    first_name: '',
    last_name: '',
    user_type: '',
    bio: '',
    profile_picture: null,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [updateSuccess, setUpdateSuccess] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await fetch('http://localhost:8000/api/accounts/profile/', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
            'Accept': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch profile');
        }

        const data = await response.json();
        setProfile(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProfile(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:8000/api/accounts/profile/', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(profile),
      });

      if (!response.ok) {
        throw new Error('Failed to update profile');
      }

      setUpdateSuccess(true);
      setIsEditing(false);
      setTimeout(() => setUpdateSuccess(false), 3000);
    } catch (err) {
      setError(err.message);
    }
  };

  const styles = {
    container: {
      padding: '2rem',
      maxWidth: '800px',
      margin: '0 auto',
    },
    header: {
      color: '#3a5a9b',
      marginBottom: '2rem',
    },
    profileCard: {
      backgroundColor: 'white',
      borderRadius: '8px',
      padding: '2rem',
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
    },
    profilePicture: {
      width: '150px',
      height: '150px',
      borderRadius: '50%',
      objectFit: 'cover',
      margin: '0 auto 2rem',
      display: 'block',
    },
    form: {
      display: 'flex',
      flexDirection: 'column',
      gap: '1rem',
    },
    formGroup: {
      display: 'flex',
      flexDirection: 'column',
      gap: '0.5rem',
    },
    label: {
      color: '#666',
      fontSize: '0.9rem',
    },
    input: {
      padding: '0.75rem',
      borderRadius: '4px',
      border: '1px solid #ddd',
      fontSize: '1rem',
    },
    button: {
      backgroundColor: '#3a5a9b',
      color: 'white',
      padding: '0.75rem',
      borderRadius: '4px',
      border: 'none',
      fontSize: '1rem',
      cursor: 'pointer',
      marginTop: '1rem',
    },
    cancelButton: {
      backgroundColor: '#dc3545',
      color: 'white',
      padding: '0.75rem',
      borderRadius: '4px',
      border: 'none',
      fontSize: '1rem',
      cursor: 'pointer',
      marginTop: '1rem',
    },
    success: {
      backgroundColor: '#d4edda',
      color: '#155724',
      padding: '1rem',
      borderRadius: '4px',
      marginBottom: '1rem',
    },
    error: {
      backgroundColor: '#f8d7da',
      color: '#721c24',
      padding: '1rem',
      borderRadius: '4px',
      marginBottom: '1rem',
    },
    loading: {
      textAlign: 'center',
      padding: '2rem',
      color: '#666',
    },
  };

  if (loading) {
    return <div style={styles.loading}>Loading profile...</div>;
  }

  return (
    <div style={styles.container}>
      <h1 style={styles.header}>User Profile</h1>
      
      {updateSuccess && (
        <div style={styles.success}>
          Profile updated successfully!
        </div>
      )}
      
      {error && (
        <div style={styles.error}>
          {error}
        </div>
      )}

      <div style={styles.profileCard}>
        <img 
          src={profile.profile_picture || 'https://placehold.co/150x150'} 
          alt="Profile" 
          style={styles.profilePicture}
        />

        {isEditing ? (
          <form onSubmit={handleSubmit} style={styles.form}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Username</label>
              <input
                type="text"
                name="username"
                value={profile.username}
                onChange={handleInputChange}
                style={styles.input}
                disabled
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Email</label>
              <input
                type="email"
                name="email"
                value={profile.email}
                onChange={handleInputChange}
                style={styles.input}
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>First Name</label>
              <input
                type="text"
                name="first_name"
                value={profile.first_name}
                onChange={handleInputChange}
                style={styles.input}
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Last Name</label>
              <input
                type="text"
                name="last_name"
                value={profile.last_name}
                onChange={handleInputChange}
                style={styles.input}
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Bio</label>
              <textarea
                name="bio"
                value={profile.bio}
                onChange={handleInputChange}
                style={{...styles.input, minHeight: '100px'}}
              />
            </div>

            <button type="submit" style={styles.button}>
              Save Changes
            </button>
            <button 
              type="button" 
              style={styles.cancelButton}
              onClick={() => setIsEditing(false)}
            >
              Cancel
            </button>
          </form>
        ) : (
          <div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Username</label>
              <div>{profile.username}</div>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Email</label>
              <div>{profile.email}</div>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Name</label>
              <div>{`${profile.first_name} ${profile.last_name}`}</div>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>User Type</label>
              <div>{profile.user_type}</div>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Bio</label>
              <div>{profile.bio || 'No bio provided'}</div>
            </div>

            <button 
              onClick={() => setIsEditing(true)} 
              style={styles.button}
            >
              Edit Profile
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserProfile; 