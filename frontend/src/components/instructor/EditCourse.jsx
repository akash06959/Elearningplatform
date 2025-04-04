import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

function EditCourse() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [categories, setCategories] = useState([]);
  const [courseData, setCourseData] = useState({
    title: '',
    description: '',
    price: '',
    category: '',
    level: 'beginner',
    duration: '',
    thumbnail: null,
    thumbnailPreview: null
  });

  // Fetch course data and categories when component mounts
  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        if (!token) {
          navigate('/login');
          return;
        }

        // Fetch course details
        const courseResponse = await fetch(`http://localhost:8000/api/courses/${courseId}/`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          }
        });

        if (!courseResponse.ok) {
          const contentType = courseResponse.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            const errorData = await courseResponse.json();
            throw new Error(errorData.message || 'Failed to fetch course details');
          } else {
            throw new Error(`Failed to fetch course details: ${courseResponse.status} ${courseResponse.statusText}`);
          }
        }

        const courseDetails = await courseResponse.json();
        
        // Fetch categories
        const categoriesResponse = await fetch('http://localhost:8000/api/courses/categories/', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          }
        });

        if (!categoriesResponse.ok) {
          const contentType = categoriesResponse.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            const errorData = await categoriesResponse.json();
            throw new Error(errorData.message || 'Failed to fetch categories');
          } else {
            throw new Error(`Failed to fetch categories: ${categoriesResponse.status} ${categoriesResponse.statusText}`);
          }
        }

        const categoriesData = await categoriesResponse.json();
        setCategories(categoriesData);

        // Set course data
        setCourseData({
          title: courseDetails.title || '',
          description: courseDetails.description || '',
          price: courseDetails.price || '',
          category: courseDetails.category?.id || '',
          level: courseDetails.difficulty_level || 'beginner',
          duration: courseDetails.duration_in_weeks || '',
          thumbnail: null,
          thumbnailPreview: courseDetails.thumbnail_url || null
        });

        setError('');
      } catch (err) {
        console.error('Error fetching course data:', err);
        setError(err.message || 'Error loading course data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [courseId, navigate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCourseData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setCourseData(prev => ({
        ...prev,
        thumbnail: file,
        thumbnailPreview: URL.createObjectURL(file)
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const formData = new FormData();

      // Append all form data
      formData.append('title', courseData.title);
      formData.append('description', courseData.description);
      formData.append('price', courseData.price);
      formData.append('category', courseData.category);
      formData.append('level', courseData.level);
      formData.append('duration', courseData.duration);
      if (courseData.thumbnail) {
        formData.append('thumbnail', courseData.thumbnail);
      }

      console.log('Sending update request for course:', courseId);
      console.log('Form data:', Object.fromEntries(formData));

      const response = await fetch(`http://localhost:8000/api/courses/instructor/courses/${courseId}/`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        },
        body: formData
      });

      if (!response.ok) {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to update course');
        } else {
          throw new Error(`Failed to update course: ${response.status} ${response.statusText}`);
        }
      }

      const data = await response.json();
      console.log('Update successful:', data);
      navigate('/instructor/courses');
    } catch (err) {
      console.error('Error updating course:', err);
      setError(err.message || 'Error updating course');
    } finally {
      setLoading(false);
    }
  };

  const styles = {
    container: {
      minHeight: '100vh',
      backgroundColor: '#f9fafb',
      padding: '2rem',
    },
    main: {
      maxWidth: '48rem',
      margin: '0 auto',
      padding: '0 1rem',
    },
    card: {
      backgroundColor: 'white',
      borderRadius: '0.5rem',
      boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
      padding: '1.5rem',
    },
    title: {
      fontSize: '1.5rem',
      fontWeight: 'bold',
      color: '#111827',
      marginBottom: '1.5rem',
    },
    error: {
      marginBottom: '1rem',
      backgroundColor: '#fef2f2',
      border: '1px solid #fca5a5',
      color: '#b91c1c',
      padding: '1rem',
      borderRadius: '0.375rem',
    },
    form: {
      display: 'flex',
      flexDirection: 'column',
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

  if (loading) {
    return (
      <div style={{ ...styles.container, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div>Loading...</div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.main}>
        <div style={styles.card}>
          <h1 style={styles.title}>Edit Course</h1>

          {error && (
            <div style={styles.error}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={styles.form}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Title</label>
              <input
                type="text"
                name="title"
                value={courseData.title}
                onChange={handleInputChange}
                style={styles.input}
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Description</label>
              <textarea
                name="description"
                value={courseData.description}
                onChange={handleInputChange}
                style={styles.textarea}
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Price</label>
              <input
                type="number"
                name="price"
                value={courseData.price}
                onChange={handleInputChange}
                min="0"
                step="0.01"
                style={styles.input}
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Category</label>
              <select
                name="category"
                value={courseData.category}
                onChange={handleInputChange}
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
              <label style={styles.label}>Duration (in weeks)</label>
              <input
                type="number"
                name="duration"
                value={courseData.duration}
                onChange={handleInputChange}
                min="1"
                style={styles.input}
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Difficulty Level</label>
              <select
                name="level"
                value={courseData.level}
                onChange={handleInputChange}
                style={styles.select}
              >
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Course Thumbnail</label>
              <input
                type="file"
                name="thumbnail"
                onChange={handleFileChange}
                accept="image/*"
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
              {loading ? 'Saving Changes...' : 'Save Changes'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default EditCourse; 