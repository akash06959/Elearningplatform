import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { courseAPI } from '../../services/api';

function EditCourse() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { user, authTokens } = useAuth();
  
  // Log important initialization data
  console.log('=== EditCourse Component Initialized ===');
  console.log('Course ID from params:', courseId);
  console.log('User authenticated:', !!user);
  console.log('Auth tokens present:', !!authTokens);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [categories, setCategories] = useState([]);
  const [activeTab, setActiveTab] = useState('basic');
  const [modules, setModules] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
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
        // Authentication is already checked by InstructorRoute in App.jsx
        if (!authTokens?.access) {
          console.error('Auth tokens missing or invalid');
          setError('Authentication error. Please log in again.');
          setLoading(false);
          return;
        }

        console.log('Fetching course details for ID:', courseId);
        
        try {
          // Fetch course details using courseAPI
          const courseDetails = await courseAPI.getCourseById(courseId);
          console.log('Course details fetched successfully:', courseDetails);
          
          // Fetch categories
          const categoriesResponse = await fetch('http://localhost:8000/api/courses/categories/', {
            headers: {
              'Authorization': `Bearer ${authTokens.access}`,
              'Accept': 'application/json',
              'Content-Type': 'application/json'
            }
          });

          if (!categoriesResponse.ok) {
            throw new Error(`Failed to fetch categories: ${categoriesResponse.status}`);
          }
  
          const categoriesData = await categoriesResponse.json();
          setCategories(categoriesData);
          console.log('Categories fetched successfully:', categoriesData);
  
          // Set course data
          setCourseData({
            title: courseDetails.title || '',
            description: courseDetails.description || '',
            price: courseDetails.price || '',
            category: courseDetails.category?.id || '',
            level: courseDetails.difficulty_level || 'beginner',
            duration: courseDetails.duration_in_weeks || '',
            thumbnail: null,
            thumbnailPreview: courseDetails.thumbnail_url || courseDetails.thumbnail || null
          });
          
          // Set modules data
          if (courseDetails.modules && courseDetails.modules.length > 0) {
            console.log('Setting modules from course details:', courseDetails.modules);
            setModules(courseDetails.modules.map(module => ({
              ...module,
              sections: module.sections || []
            })));
          } else {
            // If no modules found, initialize with default empty modules
            console.log('No modules found, initializing default modules');
            const initialModules = [];
            for (let i = 1; i <= 10; i++) {
              initialModules.push({
                id: i,
                title: `Module ${i}`,
                description: '',
                order: i,
                sections: [{ 
                  id: 1, 
                  title: `Section 1`, 
                  description: '', 
                  content_type: 'video', 
                  video_url: '', 
                  pdf_url: '', 
                  order: 1 
                }]
              });
            }
            setModules(initialModules);
          }
          
          // Set quizzes data
          if (courseDetails.quizzes && courseDetails.quizzes.length > 0) {
            console.log('Setting quizzes from course details:', courseDetails.quizzes);
            setQuizzes(courseDetails.quizzes);
          } else {
            // If no quizzes found, initialize with default empty quizzes
            console.log('No quizzes found, initializing default quizzes');
            const initialQuizzes = [];
            for (let i = 1; i <= 3; i++) {
              initialQuizzes.push({
                id: i,
                title: `Quiz ${i}`,
                description: `Quiz after module ${i * 3}`,
                module_id: i * 3,
                questions: [
                  { 
                    id: 1, 
                    question: 'Question 1', 
                    options: ['Option 1', 'Option 2', 'Option 3', 'Option 4'], 
                    correct_option: 0 
                  }
                ]
              });
            }
            setQuizzes(initialQuizzes);
          }
  
          setError('');
        } catch (error) {
          console.error('Error fetching course data:', error);
          setError(`Failed to load course data: ${error.message}`);
        }
      } catch (err) {
        console.error('Error in fetchData:', err);
        setError(err.message || 'Error loading course data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [courseId, authTokens]);

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

  // Module handling functions
  const handleModuleChange = (moduleId, field, value) => {
    setModules(prevModules => 
      prevModules.map(module => 
        module.id === moduleId 
          ? { ...module, [field]: value } 
          : module
      )
    );
  };
  
  const handleSectionChange = (moduleId, sectionId, field, value) => {
    setModules(prevModules => 
      prevModules.map(module => {
        if (module.id === moduleId) {
          return {
            ...module,
            sections: module.sections.map(section => 
              section.id === sectionId 
                ? { ...section, [field]: value } 
                : section
            )
          };
        }
        return module;
      })
    );
  };
  
  const addSection = (moduleId) => {
    setModules(prevModules => 
      prevModules.map(module => {
        if (module.id === moduleId) {
          const newSectionId = module.sections.length > 0 
            ? Math.max(...module.sections.map(s => s.id)) + 1 
            : 1;
          return {
            ...module,
            sections: [
              ...module.sections, 
              { 
                id: newSectionId, 
                title: `Section ${newSectionId}`, 
                description: '', 
                content_type: 'video', 
                video_url: '', 
                pdf_url: '', 
                order: newSectionId 
              }
            ]
          };
        }
        return module;
      })
    );
  };

  // Quiz handling functions
  const handleQuizChange = (quizId, field, value) => {
    setQuizzes(prevQuizzes => 
      prevQuizzes.map(quiz => 
        quiz.id === quizId 
          ? { ...quiz, [field]: value } 
          : quiz
      )
    );
  };
  
  const handleQuestionChange = (quizId, questionId, field, value) => {
    setQuizzes(prevQuizzes => 
      prevQuizzes.map(quiz => {
        if (quiz.id === quizId) {
          return {
            ...quiz,
            questions: quiz.questions.map(question => 
              question.id === questionId 
                ? { ...question, [field]: value } 
                : question
            )
          };
        }
        return quiz;
      })
    );
  };
  
  const handleOptionChange = (quizId, questionId, optionIndex, value) => {
    setQuizzes(prevQuizzes => 
      prevQuizzes.map(quiz => {
        if (quiz.id === quizId) {
          return {
            ...quiz,
            questions: quiz.questions.map(question => {
              if (question.id === questionId) {
                const newOptions = [...question.options];
                newOptions[optionIndex] = value;
                return {
                  ...question,
                  options: newOptions
                };
              }
              return question;
            })
          };
        }
        return quiz;
      })
    );
  };
  
  const setCorrectOption = (quizId, questionId, optionIndex) => {
    setQuizzes(prevQuizzes => 
      prevQuizzes.map(quiz => {
        if (quiz.id === quizId) {
          return {
            ...quiz,
            questions: quiz.questions.map(question => 
              question.id === questionId 
                ? { ...question, correct_option: optionIndex } 
                : question
            )
          };
        }
        return quiz;
      })
    );
  };
  
  const addQuestion = (quizId) => {
    setQuizzes(prevQuizzes => 
      prevQuizzes.map(quiz => {
        if (quiz.id === quizId) {
          const newQuestionId = quiz.questions.length > 0
            ? Math.max(...quiz.questions.map(q => q.id)) + 1
            : 1;
          return {
            ...quiz,
            questions: [
              ...quiz.questions, 
              { 
                id: newQuestionId, 
                question: `Question ${newQuestionId}`, 
                options: ['Option 1', 'Option 2', 'Option 3', 'Option 4'], 
                correct_option: 0 
              }
            ]
          };
        }
        return quiz;
      })
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('Submitting changes...');

    console.log('Form submitted - attempting to update course');

    try {
      if (!authTokens?.access) {
        setError('Authentication token missing or invalid. Please log in again.');
        setLoading(false);
        setSuccess('');
        return;
      }

      const formData = new FormData();

      // Append all form data
      formData.append('title', courseData.title || '');
      formData.append('description', courseData.description || '');
      formData.append('price', courseData.price || 0);
      formData.append('category', courseData.category || '');
      formData.append('difficulty_level', courseData.level || 'beginner');
      formData.append('duration_in_weeks', courseData.duration || 1);
      if (courseData.thumbnail) {
        formData.append('thumbnail', courseData.thumbnail);
      }
      
      // Add modules and their sections
      // Make sure modules JSON is properly structured
      const modulesData = modules
        .map((module, index) => ({
          id: module.id,
          title: module.title || `Module ${module.id}`,
          description: module.description || '',
          order: module.order || index + 1,
          sections: module.sections
            .map((section, sectionIndex) => ({
              id: section.id,
              title: section.title || `Section ${section.id}`,
              description: section.description || '',
              content_type: section.content_type || 'video',
              video_url: section.video_url || '',
              pdf_url: section.pdf_url || '',
              order: section.order || sectionIndex + 1
            }))
        }));
        
      console.log('Modules data before stringify:', modulesData);
      
      // Only append modules if there are valid ones
      if (modulesData.length > 0) {
        formData.append('modules_json', JSON.stringify(modulesData));
      }
      
      // Add quizzes - make sure quizzes JSON is properly structured
      const quizzesData = quizzes
        .map((quiz, index) => ({
          id: quiz.id,
          title: quiz.title || `Quiz ${quiz.id}`,
          description: quiz.description || '',
          module_id: quiz.module_id || modules[0]?.id || 1,
          order: index + 1,
          questions: quiz.questions
            .map((question, questionIndex) => ({
              id: question.id,
              question: question.question || `Question ${questionIndex + 1}`,
              options: question.options.map(option => option || 'No answer'),
              correct_option: question.correct_option,
              order: questionIndex + 1
            }))
        }));
        
      console.log('Quizzes data before stringify:', quizzesData);
      
      // Only append quizzes if there are valid ones
      if (quizzesData.length > 0) {
        formData.append('quizzes_json', JSON.stringify(quizzesData));
      }

      console.log('Sending update request for course:', courseId);
      
      // Log each key-value pair in the FormData
      console.log('FormData entries:');
      for (let [key, value] of formData.entries()) {
        if (key === 'modules_json' || key === 'quizzes_json') {
          console.log(`${key}: ${value.substring(0, 100)}...`); // Log just first 100 chars of JSON
        } else if (key === 'thumbnail') {
          console.log(`${key}: [File object]`);
        } else {
          console.log(`${key}: ${value}`);
        }
      }
      
      // First attempt: use courseAPI
      console.log('About to call courseAPI.updateCourse with courseId:', courseId);
      try {
        const response = await courseAPI.updateCourse(courseId, formData);
        console.log('Course update successful:', response);
        
        setSuccess('Course updated successfully!');
        
        // Redirect to instructor courses page after a delay
        setTimeout(() => {
          navigate('/instructor/courses');
        }, 2000);
        return;
      } catch (apiError) {
        console.error('API Error with courseAPI.updateCourse:', apiError);
        console.error('Trying direct fetch as fallback...');
        
        // Continue to fallback method
      }
      
      // Second attempt: direct fetch as fallback
      try {
        // Try multiple endpoints with different HTTP methods
        const endpointOptions = [
          { url: `http://localhost:8000/api/courses/instructor/courses/${courseId}/update/`, method: 'POST' },
          { url: `http://localhost:8000/api/courses/instructor/courses/${courseId}/`, method: 'PATCH' },
          { url: `http://localhost:8000/api/courses/${courseId}/update/`, method: 'POST' },
          { url: `http://localhost:8000/api/courses/${courseId}/`, method: 'PATCH' }
        ];
        
        let fetchResponse = null;
        let responseData = null;
        let lastError = null;
        
        // Try each endpoint until one works
        for (const { url, method } of endpointOptions) {
          try {
            console.log(`Trying direct fetch with ${method} to: ${url}`);
            
            fetchResponse = await fetch(url, {
              method: method,
              headers: {
                'Authorization': `Bearer ${authTokens.access}`
                // Don't set Content-Type as FormData will set its own boundary
              },
              body: formData
            });
            
            console.log(`${method} to ${url} status:`, fetchResponse.status);
            
            if (fetchResponse.ok) {
              responseData = await fetchResponse.json();
              console.log('Direct fetch successful:', responseData);
              break;
            } else {
              const errorText = await fetchResponse.text();
              console.error(`Failed with status ${fetchResponse.status}:`, errorText);
              lastError = new Error(`${method} to ${url} failed: ${fetchResponse.status} ${fetchResponse.statusText}`);
              // Continue to try the next endpoint
            }
          } catch (endpointError) {
            console.error(`Error with ${method} to ${url}:`, endpointError);
            lastError = endpointError;
            // Continue to try the next endpoint
          }
        }
        
        if (fetchResponse && fetchResponse.ok && responseData) {
          setSuccess('Course updated successfully with fallback method!');
          
          // Redirect to instructor courses page after a delay
          setTimeout(() => {
            navigate('/instructor/courses');
          }, 2000);
          return;
        } else {
          throw lastError || new Error('All fallback endpoints failed');
        }
      } catch (fetchError) {
        console.error('Fallback fetch error:', fetchError);
        throw new Error(`All update attempts failed. Last error: ${fetchError.message}`);
      }
    } catch (error) {
      console.error('Course update error:', error);
      setError(`Course update failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Styles
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
      whiteSpace: 'pre-line'
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
    tabButton: {
      padding: '0.75rem 1rem',
      borderRadius: '0.375rem 0.375rem 0 0',
      border: 'none',
      backgroundColor: '#f1f5f9',
      cursor: 'pointer',
      fontWeight: 500,
      color: '#64748b',
      transition: 'all 0.2s',
      marginRight: '0.5rem',
    },
    activeTabButton: {
      backgroundColor: 'white',
      color: '#1d4ed8',
      borderBottom: '2px solid #1d4ed8',
    },
    tabContent: {
      backgroundColor: 'white',
      padding: '1.5rem',
      borderRadius: '0 0.375rem 0.375rem 0.375rem',
      boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
    },
    moduleContainer: {
      marginBottom: '1.5rem',
      border: '1px solid #e2e8f0',
      borderRadius: '0.375rem',
      overflow: 'hidden',
    },
    moduleHeader: {
      padding: '1rem',
      backgroundColor: '#f8fafc',
      borderBottom: '1px solid #e2e8f0',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    moduleTitle: {
      fontWeight: 600,
      color: '#334155',
      margin: 0,
    },
    moduleBody: {
      padding: '1rem',
    },
    sectionContainer: {
      marginBottom: '1rem',
      padding: '0.75rem',
      border: '1px solid #e2e8f0',
      borderRadius: '0.375rem',
      backgroundColor: '#f9fafb',
    },
    inputGroup: {
      marginBottom: '1rem',
    },
    inputLabel: {
      display: 'block',
      marginBottom: '0.5rem',
      fontWeight: 500,
      color: '#4b5563',
    },
    progressBar: {
      height: '0.5rem',
      backgroundColor: '#e2e8f0',
      borderRadius: '0.25rem',
      overflow: 'hidden',
      marginBottom: '1rem',
    },
    progressFill: {
      height: '100%',
      backgroundColor: '#1d4ed8',
      transition: 'width 0.3s ease',
    },
    questionContainer: {
      marginBottom: '1.5rem',
      padding: '1rem',
      border: '1px solid #e2e8f0',
      borderRadius: '0.375rem',
      backgroundColor: '#f8fafc',
    },
    optionContainer: {
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
      marginBottom: '0.5rem',
    },
    radio: {
      marginRight: '0.5rem',
    },
    loadingOverlay: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(255, 255, 255, 0.7)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000,
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
      <main style={styles.main}>
        <div style={styles.card}>
          <div style={styles.header}>
            <h1 style={styles.title}>Edit Course</h1>
            <p style={styles.subtitle}>Update your course details</p>
          </div>
          
          {error && (
            <div style={{
              backgroundColor: '#FFEBEE', 
              color: '#C62828', 
              padding: '1rem',
              borderRadius: '0.375rem', 
              marginBottom: '1.5rem',
              fontWeight: 'bold'
            }}>
              {error}
            </div>
          )}
          
          {success && (
            <div style={{
              backgroundColor: '#E8F5E9', 
              color: '#2E7D32', 
              padding: '1rem',
              borderRadius: '0.375rem', 
              marginBottom: '1.5rem',
              fontWeight: 'bold'
            }}>
              {success}
            </div>
          )}
          
          {loading ? (
            <div style={styles.loadingOverlay}>
              <div>Loading course data...</div>
            </div>
          ) : (
            <div>
              <div className="tabs" style={{ marginBottom: '1rem' }}>
                <button 
                  style={{ 
                    ...styles.tabButton, 
                    ...(activeTab === 'basic' ? styles.activeTabButton : {}) 
                  }}
                  onClick={() => setActiveTab('basic')}
                >
                  Basic Info
                </button>
                <button 
                  style={{ 
                    ...styles.tabButton, 
                    ...(activeTab === 'modules' ? styles.activeTabButton : {}) 
                  }}
                  onClick={() => setActiveTab('modules')}
                >
                  Modules & Content
                </button>
                <button 
                  style={{ 
                    ...styles.tabButton, 
                    ...(activeTab === 'quizzes' ? styles.activeTabButton : {}) 
                  }}
                  onClick={() => setActiveTab('quizzes')}
                >
                  Quizzes
                </button>
              </div>
              
              <form onSubmit={handleSubmit}>
                {activeTab === 'basic' && (
                  <div style={styles.tabContent}>
                    <div style={styles.inputGroup}>
                      <label style={styles.inputLabel} htmlFor="title">Course Title</label>
                      <input
                        id="title"
                        style={styles.input}
                        type="text"
                        name="title"
                        placeholder="e.g. Introduction to React"
                        value={courseData.title}
                        onChange={handleInputChange}
                      />
                    </div>

                    <div style={styles.inputGroup}>
                      <label style={styles.inputLabel} htmlFor="description">Course Description</label>
                      <textarea
                        id="description"
                        style={styles.textarea}
                        name="description"
                        placeholder="Describe your course..."
                        value={courseData.description}
                        onChange={handleInputChange}
                      ></textarea>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      <div style={styles.inputGroup}>
                        <label style={styles.inputLabel} htmlFor="price">Price ($)</label>
                        <input
                          id="price"
                          style={styles.input}
                          type="number"
                          name="price"
                          min="0"
                          step="0.01"
                          placeholder="29.99"
                          value={courseData.price}
                          onChange={handleInputChange}
                        />
                      </div>

                      <div style={styles.inputGroup}>
                        <label style={styles.inputLabel} htmlFor="category">Category</label>
                        <select
                          id="category"
                          style={styles.select}
                          name="category"
                          value={courseData.category}
                          onChange={handleInputChange}
                        >
                          <option value="">Select a category</option>
                          {categories.map(category => (
                            <option key={category.id} value={category.id}>{category.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      <div style={styles.inputGroup}>
                        <label style={styles.inputLabel} htmlFor="duration">Duration (in weeks)</label>
                        <input
                          id="duration"
                          style={styles.input}
                          type="number"
                          name="duration"
                          min="1"
                          placeholder="4"
                          value={courseData.duration}
                          onChange={handleInputChange}
                        />
                      </div>

                      <div style={styles.inputGroup}>
                        <label style={styles.inputLabel} htmlFor="level">Difficulty Level</label>
                        <select
                          id="level"
                          style={styles.select}
                          name="level"
                          value={courseData.level}
                          onChange={handleInputChange}
                        >
                          <option value="beginner">Beginner</option>
                          <option value="intermediate">Intermediate</option>
                          <option value="advanced">Advanced</option>
                        </select>
                      </div>
                    </div>

                    <div style={styles.inputGroup}>
                      <label style={styles.inputLabel} htmlFor="thumbnail">Course Thumbnail</label>
                      <input
                        id="thumbnail"
                        type="file"
                        name="thumbnail"
                        accept="image/*"
                        onChange={handleFileChange}
                      />
                      {courseData.thumbnailPreview && (
                        <div style={{ marginTop: '1rem' }}>
                          <img
                            src={courseData.thumbnailPreview}
                            alt="Thumbnail preview"
                            style={{ maxWidth: '100%', maxHeight: '200px', borderRadius: '0.375rem' }}
                          />
                        </div>
                      )}
                    </div>
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1.5rem' }}>
                      <button
                        type="button"
                        style={styles.button}
                        onClick={() => setActiveTab('modules')}
                      >
                        Next: Edit Modules
                      </button>
                      <button
                        type="submit"
                        style={{...styles.button, backgroundColor: '#4CAF50', color: 'white'}}
                        disabled={loading}
                      >
                        {loading ? 'Updating Course...' : 'Update Course'}
                      </button>
                    </div>
                  </div>
                )}
                
                {activeTab === 'modules' && (
                  <div style={styles.tabContent}>
                    <div style={styles.progressBar}>
                      <div style={{ ...styles.progressFill, width: '66%' }}></div>
                    </div>
                    
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem' }}>
                      Course Modules ({modules.length} modules)
                    </h2>
                    
                    {modules.map((module) => (
                      <div key={module.id} style={styles.moduleContainer}>
                        <div style={styles.moduleHeader}>
                          <h3 style={styles.moduleTitle}>Module {module.order || module.id}</h3>
                        </div>
                        <div style={styles.moduleBody}>
                          <div style={styles.inputGroup}>
                            <label style={styles.inputLabel} htmlFor={`module-title-${module.id}`}>Module Title*</label>
                            <input
                              id={`module-title-${module.id}`}
                              style={styles.input}
                              type="text"
                              placeholder="e.g. Introduction to React Hooks"
                              value={module.title || ''}
                              onChange={(e) => handleModuleChange(module.id, 'title', e.target.value)}
                            />
                          </div>
                          
                          <div style={styles.inputGroup}>
                            <label style={styles.inputLabel} htmlFor={`module-desc-${module.id}`}>Module Description</label>
                            <textarea
                              id={`module-desc-${module.id}`}
                              style={styles.textarea}
                              placeholder="Describe what students will learn in this module..."
                              value={module.description || ''}
                              onChange={(e) => handleModuleChange(module.id, 'description', e.target.value)}
                            ></textarea>
                          </div>
                          
                          <h4 style={{ fontSize: '1rem', fontWeight: 500, marginBottom: '1rem', marginTop: '1.5rem' }}>
                            Sections ({module.sections ? module.sections.length : 0})
                          </h4>
                          
                          {module.sections && module.sections.map((section) => (
                            <div key={section.id} style={styles.sectionContainer}>
                              <div style={styles.inputGroup}>
                                <label style={styles.inputLabel} htmlFor={`section-title-${module.id}-${section.id}`}>
                                  Section Title
                                </label>
                                <input
                                  id={`section-title-${module.id}-${section.id}`}
                                  style={styles.input}
                                  type="text"
                                  placeholder="e.g. useState Hook"
                                  value={section.title || ''}
                                  onChange={(e) => handleSectionChange(module.id, section.id, 'title', e.target.value)}
                                />
                              </div>
                              
                              <div style={styles.inputGroup}>
                                <label style={styles.inputLabel} htmlFor={`section-desc-${module.id}-${section.id}`}>
                                  Section Description
                                </label>
                                <textarea
                                  id={`section-desc-${module.id}-${section.id}`}
                                  style={styles.textarea}
                                  placeholder="Briefly describe this section..."
                                  value={section.description || ''}
                                  onChange={(e) => handleSectionChange(module.id, section.id, 'description', e.target.value)}
                                ></textarea>
                              </div>
                              
                              <div style={styles.inputGroup}>
                                <label style={styles.inputLabel} htmlFor={`content-type-${module.id}-${section.id}`}>
                                  Content Type
                                </label>
                                <select
                                  id={`content-type-${module.id}-${section.id}`}
                                  style={styles.select}
                                  value={section.content_type || 'video'}
                                  onChange={(e) => handleSectionChange(module.id, section.id, 'content_type', e.target.value)}
                                >
                                  <option value="video">Video</option>
                                  <option value="pdf">PDF Document</option>
                                  <option value="both">Both Video & PDF</option>
                                </select>
                              </div>
                              
                              {(section.content_type === 'video' || section.content_type === 'both') && (
                                <div style={styles.inputGroup}>
                                  <label style={styles.inputLabel} htmlFor={`video-url-${module.id}-${section.id}`}>
                                    YouTube Video URL
                                  </label>
                                  <input
                                    id={`video-url-${module.id}-${section.id}`}
                                    style={styles.input}
                                    type="url"
                                    placeholder="e.g. https://youtube.com/watch?v=..."
                                    value={section.video_url || ''}
                                    onChange={(e) => handleSectionChange(module.id, section.id, 'video_url', e.target.value)}
                                  />
                                </div>
                              )}
                              
                              {(section.content_type === 'pdf' || section.content_type === 'both') && (
                                <div style={styles.inputGroup}>
                                  <label style={styles.inputLabel} htmlFor={`pdf-url-${module.id}-${section.id}`}>
                                    PDF Document URL
                                  </label>
                                  <input
                                    id={`pdf-url-${module.id}-${section.id}`}
                                    style={styles.input}
                                    type="url"
                                    placeholder="e.g. https://example.com/document.pdf"
                                    value={section.pdf_url || ''}
                                    onChange={(e) => handleSectionChange(module.id, section.id, 'pdf_url', e.target.value)}
                                  />
                                </div>
                              )}
                            </div>
                          ))}
                          
                          <button
                            type="button"
                            style={styles.button}
                            onClick={() => addSection(module.id)}
                          >
                            + Add Section
                          </button>
                        </div>
                      </div>
                    ))}
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1.5rem' }}>
                      <button
                        type="button"
                        style={styles.button}
                        onClick={() => setActiveTab('basic')}
                      >
                        Back to Basic Info
                      </button>
                      <div>
                        <button
                          type="button"
                          style={styles.button}
                          onClick={() => setActiveTab('quizzes')}
                        >
                          Next: Edit Quizzes
                        </button>
                        <button
                          type="submit"
                          style={{...styles.button, backgroundColor: '#4CAF50', color: 'white', marginLeft: '0.5rem'}}
                          disabled={loading}
                        >
                          {loading ? 'Updating Course...' : 'Update Course'}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
                
                {activeTab === 'quizzes' && (
                  <div style={styles.tabContent}>
                    <div style={styles.progressBar}>
                      <div style={{ ...styles.progressFill, width: '100%' }}></div>
                    </div>
                    
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem' }}>
                      Course Quizzes ({quizzes.length} quizzes)
                    </h2>
                    
                    {quizzes.map((quiz) => (
                      <div key={quiz.id} style={styles.moduleContainer}>
                        <div style={styles.moduleHeader}>
                          <h3 style={styles.moduleTitle}>{quiz.title || `Quiz ${quiz.id}`}</h3>
                        </div>
                        <div style={styles.moduleBody}>
                          <div style={styles.inputGroup}>
                            <label style={styles.inputLabel} htmlFor={`quiz-title-${quiz.id}`}>Quiz Title</label>
                            <input
                              id={`quiz-title-${quiz.id}`}
                              style={styles.input}
                              type="text"
                              placeholder="e.g. React Hooks Fundamentals Quiz"
                              value={quiz.title || ''}
                              onChange={(e) => handleQuizChange(quiz.id, 'title', e.target.value)}
                            />
                          </div>
                          
                          <div style={styles.inputGroup}>
                            <label style={styles.inputLabel} htmlFor={`quiz-desc-${quiz.id}`}>Quiz Description</label>
                            <textarea
                              id={`quiz-desc-${quiz.id}`}
                              style={styles.textarea}
                              placeholder="Describe what this quiz will assess..."
                              value={quiz.description || ''}
                              onChange={(e) => handleQuizChange(quiz.id, 'description', e.target.value)}
                            ></textarea>
                          </div>
                          
                          <div style={styles.inputGroup}>
                            <label style={styles.inputLabel} htmlFor={`quiz-module-${quiz.id}`}>After Module</label>
                            <select
                              id={`quiz-module-${quiz.id}`}
                              style={styles.select}
                              value={quiz.module_id || ''}
                              onChange={(e) => handleQuizChange(quiz.id, 'module_id', e.target.value)}
                            >
                              <option value="">Select a module</option>
                              {modules.map(module => (
                                <option key={module.id} value={module.id}>
                                  {module.title || `Module ${module.id}`}
                                </option>
                              ))}
                            </select>
                          </div>
                          
                          <h4 style={{ fontSize: '1rem', fontWeight: 500, marginBottom: '1rem', marginTop: '1.5rem' }}>
                            Questions ({quiz.questions ? quiz.questions.length : 0})
                          </h4>
                          
                          {quiz.questions && quiz.questions.map((question) => (
                            <div key={question.id} style={styles.questionContainer}>
                              <div style={styles.inputGroup}>
                                <label style={styles.inputLabel} htmlFor={`question-${quiz.id}-${question.id}`}>
                                  Question
                                </label>
                                <input
                                  id={`question-${quiz.id}-${question.id}`}
                                  style={styles.input}
                                  type="text"
                                  placeholder="e.g. What is the main purpose of useState in React?"
                                  value={question.question || ''}
                                  onChange={(e) => handleQuestionChange(quiz.id, question.id, 'question', e.target.value)}
                                />
                              </div>
                              
                              <div style={{ marginTop: '1rem' }}>
                                <label style={styles.inputLabel}>Options (Select the correct answer)</label>
                                
                                {question.options && question.options.map((option, index) => (
                                  <div key={index} style={styles.optionContainer}>
                                    <input
                                      type="radio"
                                      id={`option-${quiz.id}-${question.id}-${index}`}
                                      name={`question-${quiz.id}-${question.id}`}
                                      style={styles.radio}
                                      checked={question.correct_option === index}
                                      onChange={() => setCorrectOption(quiz.id, question.id, index)}
                                    />
                                    <input
                                      type="text"
                                      style={styles.input}
                                      placeholder={`Option ${index + 1}`}
                                      value={option || ''}
                                      onChange={(e) => handleOptionChange(quiz.id, question.id, index, e.target.value)}
                                    />
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                          
                          <button
                            type="button"
                            style={styles.button}
                            onClick={() => addQuestion(quiz.id)}
                          >
                            + Add Question
                          </button>
                        </div>
                      </div>
                    ))}
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1.5rem' }}>
                      <button
                        type="button"
                        style={styles.button}
                        onClick={() => setActiveTab('modules')}
                      >
                        Back to Modules
                      </button>
                      <button
                        type="submit"
                        style={{...styles.button, backgroundColor: '#4CAF50', color: 'white'}}
                        disabled={loading}
                      >
                        {loading ? 'Updating Course...' : 'Update Course'}
                      </button>
                    </div>
                  </div>
                )}
              </form>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default EditCourse; 