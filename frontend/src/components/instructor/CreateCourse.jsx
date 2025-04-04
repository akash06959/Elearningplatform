import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function CreateCourse() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [categories, setCategories] = useState([]);
  
  const [courseData, setCourseData] = useState({
    title: '',
    description: '',
    price: 0,
    category: '',
    duration: '',
    level: 'beginner',
    thumbnail: null,
    thumbnailPreview: null,
  });

  useEffect(() => {
    // Check if user is logged in and is an instructor
    const authTokens = localStorage.getItem('authTokens');
    const userType = localStorage.getItem('userType');
    
    console.log('CreateCourse Auth Check:', { 
      authTokens: !!authTokens, 
      userType,
      parsedTokens: authTokens ? JSON.parse(authTokens) : null
    });
    
    if (!authTokens) {
      console.log('No auth tokens found, redirecting to login');
      navigate('/login');
      return;
    }

    try {
      // Parse tokens to check if they're valid JSON
      JSON.parse(authTokens);
    } catch (e) {
      console.error('Invalid auth tokens found:', e);
      localStorage.removeItem('authTokens');
      navigate('/login');
      return;
    }

    if (!userType) {
      console.log('No user type found, redirecting to login');
      navigate('/login');
      return;
    }

    if (userType.toLowerCase() !== 'instructor') {
      console.log(`User type is ${userType}, not instructor. Redirecting to student dashboard`);
      navigate('/dashboard');
      return;
    }

    console.log('User is authenticated as instructor, proceeding to fetch categories');

    // Fetch categories
    const fetchCategories = async () => {
      try {
        const response = await fetch('http://localhost:8000/api/courses/categories/', {
          headers: {
            'Authorization': `Bearer ${JSON.parse(authTokens).access}`,
            'Content-Type': 'application/json',
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          console.log('Categories fetched successfully:', data);
          setCategories(data);
        } else {
          const errorData = await response.text();
          console.error('Failed to fetch categories:', {
            status: response.status,
            statusText: response.statusText,
            error: errorData
          });
          throw new Error('Failed to fetch categories');
        }
      } catch (error) {
        console.error('Error in fetchCategories:', error);
        setError('Failed to load course categories. Please try refreshing the page.');
        // For demo purposes, use mock categories if API fails
        setCategories([
          { id: 1, name: 'Programming' },
          { id: 2, name: 'Web Development' },
          { id: 3, name: 'Data Science' },
          { id: 4, name: 'Mobile Development' },
          { id: 5, name: 'Design' },
        ]);
      }
    };
    
    fetchCategories();
  }, [navigate]);

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    
    if (type === 'file') {
      const file = e.target.files[0];
      if (file) {
        setCourseData({
          ...courseData,
          thumbnail: file,
          thumbnailPreview: URL.createObjectURL(file)
        });
      }
    } else {
      setCourseData({
        ...courseData,
        [name]: value
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const authTokens = localStorage.getItem('authTokens');
      
      // Validate the token
      if (!authTokens) {
        setError('Authentication token missing. Please log in again.');
        setLoading(false);
        navigate('/login');
        return;
      }
      
      // Create form data for file upload
      const formData = new FormData();
      formData.append('title', courseData.title);
      formData.append('description', courseData.description);
      formData.append('price', courseData.price);
      formData.append('category', courseData.category);
      formData.append('duration', courseData.duration);
      formData.append('level', courseData.level);
      if (courseData.thumbnail) {
        formData.append('thumbnail', courseData.thumbnail);
      }

      console.log('Submitting course data:', Object.fromEntries(formData));
      console.log('Auth tokens:', {
        present: !!authTokens,
        parsed: authTokens ? JSON.parse(authTokens) : null
      });

      const response = await fetch('http://localhost:8000/api/courses/create/', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${JSON.parse(authTokens).access}`
        },
        body: formData
      });

      // Check for network errors
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Server response:', errorText);
        
        try {
          // Try to parse as JSON
          const errorData = JSON.parse(errorText);
          throw new Error(errorData.message || 'Failed to create course. Server returned an error.');
        } catch (jsonError) {
          // If parsing fails, use the text directly
          throw new Error(`Server error: ${response.status} ${response.statusText}`);
        }
      }

      const data = await response.json();
      console.log('Course creation successful:', data);

      setSuccess('Course created successfully!');
      // Reset form
      setCourseData({
        title: '',
        description: '',
        price: 0,
        category: '',
        duration: '',
        level: 'beginner',
        thumbnail: null,
        thumbnailPreview: null,
      });
      
      // Redirect to instructor courses after a delay
      setTimeout(() => {
        navigate('/inst_dashboard');
      }, 2000);
    } catch (error) {
      console.error('Error creating course:', error);
      setError(error.message || 'Failed to create course. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const styles = {
    container: {
      minHeight: '100vh',
      backgroundColor: '#f9fafb',
    },
    main: {
      maxWidth: '56rem',
      margin: '0 auto',
      padding: '2.5rem 1rem',
    },
    card: {
      backgroundColor: 'white',
      borderRadius: '0.5rem',
      boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
      padding: '1.5rem',
    },
    header: {
      marginBottom: '1.5rem',
    },
    title: {
      fontSize: '1.5rem',
      fontWeight: 'bold',
      color: '#1d4ed8',
      marginBottom: '0.5rem',
    },
    subtitle: {
      color: '#4b5563',
    },
    error: {
      marginBottom: '1.5rem',
      backgroundColor: '#fef2f2',
      border: '1px solid #fca5a5',
      color: '#b91c1c',
      padding: '1rem',
      borderRadius: '0.375rem',
    },
    success: {
      marginBottom: '1.5rem',
      backgroundColor: '#f0fdf4',
      border: '1px solid #86efac',
      color: '#166534',
      padding: '1rem',
      borderRadius: '0.375rem',
    },
    form: {
      display: 'grid',
      gridTemplateColumns: '1fr',
      gap: '1.5rem',
    },
    formGroup: {
      display: 'flex',
      flexDirection: 'column',
      gap: '0.5rem',
    },
    label: {
      display: 'block',
      fontSize: '0.875rem',
      fontWeight: '500',
      color: '#374151',
    },
    input: {
      width: '100%',
      padding: '0.75rem',
      borderRadius: '0.375rem',
      border: '1px solid #d1d5db',
      fontSize: '1rem',
    },
    textarea: {
      width: '100%',
      padding: '0.75rem',
      borderRadius: '0.375rem',
      border: '1px solid #d1d5db',
      fontSize: '1rem',
      minHeight: '8rem',
    },
    select: {
      width: '100%',
      padding: '0.75rem',
      borderRadius: '0.375rem',
      border: '1px solid #d1d5db',
      fontSize: '1rem',
      backgroundColor: 'white',
    },
    button: {
      backgroundColor: '#1d4ed8',
      color: 'white',
      padding: '0.75rem 1.5rem',
      borderRadius: '0.375rem',
      fontSize: '1rem',
      fontWeight: '500',
      border: 'none',
      cursor: 'pointer',
    },
    thumbnailPreview: {
      width: '100%',
      maxWidth: '300px',
      height: 'auto',
      borderRadius: '0.375rem',
      marginTop: '0.5rem',
    },
  };

  return (
    <div style={styles.container}>
      <main style={styles.main}>
        <div style={styles.card}>
          <div style={styles.header}>
            <h1 style={styles.title}>Create New Course</h1>
            <p style={styles.subtitle}>Fill out the form below to create a new course for your students.</p>
          </div>

          {error && (
            <div style={styles.error}>
              {error}
            </div>
          )}

          {success && (
            <div style={styles.success}>
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} style={styles.form}>
            <div style={styles.formGroup}>
              <label htmlFor="title" style={styles.label}>
                Course Title*
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={courseData.title}
                onChange={handleChange}
                required
                style={styles.input}
              />
            </div>

            <div style={styles.formGroup}>
              <label htmlFor="description" style={styles.label}>
                Description*
              </label>
              <textarea
                id="description"
                name="description"
                value={courseData.description}
                onChange={handleChange}
                required
                style={styles.textarea}
              />
            </div>

            <div style={styles.formGroup}>
              <label htmlFor="price" style={styles.label}>
                Price*
              </label>
              <input
                type="number"
                id="price"
                name="price"
                value={courseData.price}
                onChange={handleChange}
                required
                min="0"
                step="0.01"
                style={styles.input}
              />
            </div>

            <div style={styles.formGroup}>
              <label htmlFor="category" style={styles.label}>
                Category*
              </label>
              <select
                id="category"
                name="category"
                value={courseData.category}
                onChange={handleChange}
                required
                style={styles.select}
              >
                <option value="">Select a category</option>
                {categories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            <div style={styles.formGroup}>
              <label htmlFor="duration" style={styles.label}>
                Duration (in weeks)*
              </label>
              <input
                type="number"
                id="duration"
                name="duration"
                value={courseData.duration}
                onChange={handleChange}
                required
                min="1"
                style={styles.input}
              />
            </div>

            <div style={styles.formGroup}>
              <label htmlFor="level" style={styles.label}>
                Difficulty Level*
              </label>
              <select
                id="level"
                name="level"
                value={courseData.level}
                onChange={handleChange}
                required
                style={styles.select}
              >
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>

            <div style={styles.formGroup}>
              <label htmlFor="thumbnail" style={styles.label}>
                Course Thumbnail
              </label>
              <input
                type="file"
                id="thumbnail"
                name="thumbnail"
                accept="image/*"
                onChange={handleChange}
                style={styles.input}
              />
              {courseData.thumbnailPreview && (
                <img
                  src={courseData.thumbnailPreview}
                  alt="Course thumbnail preview"
                  style={styles.thumbnailPreview}
                />
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                ...styles.button,
                opacity: loading ? 0.7 : 1,
                cursor: loading ? 'not-allowed' : 'pointer',
              }}
            >
              {loading ? 'Creating Course...' : 'Create Course'}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}

export default CreateCourse; 