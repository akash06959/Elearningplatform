import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { courseAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

function CreateCourse() {
  const navigate = useNavigate();
  // eslint-disable-next-line no-unused-vars
  const { user, authTokens } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [categories, setCategories] = useState([]);
  const [activeTab, setActiveTab] = useState('basic');
  const [modules, setModules] = useState([
    { 
      id: 1, 
      title: '', 
      description: '',
      sections: [{ id: 1, title: '', description: '', content_type: 'video', video_url: '', pdf_url: '', order: 1 }] 
    }
  ]);
  const [quizzes, setQuizzes] = useState([
    { 
      id: 1, 
      title: 'Quiz 1', 
      description: 'Quiz after module 3',
      module_id: 3,
      questions: [
        { id: 1, question: '', options: ['', '', '', ''], correct_option: 0 }
      ] 
    }
  ]);
  
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
    // We can safely assume authentication is already checked by InstructorRoute
    console.log('CreateCourse component mounted, fetching categories');

    // Fetch categories
    const fetchCategories = async () => {
      try {
        // Use authTokens from context
        if (!authTokens?.access) {
          console.log('No auth tokens found, categories will use mock data');
          setCategories([
            { id: 1, name: 'Programming' },
            { id: 2, name: 'Web Development' },
            { id: 3, name: 'Data Science' },
            { id: 4, name: 'Mobile Development' },
            { id: 5, name: 'Design' },
          ]);
          return;
        }
        
        const response = await fetch('http://localhost:8000/api/courses/categories/', {
          headers: {
            'Authorization': `Bearer ${authTokens.access}`,
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
    
    // Initialize 10 empty modules
    const initialModules = [];
    for (let i = 1; i <= 10; i++) {
      initialModules.push({
        id: i,
        title: `Module ${i}`,
        description: '',
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
    
    // Initialize quizzes after every 3 modules
    const initialQuizzes = [];
    for (let i = 1; i <= 3; i++) {
      initialQuizzes.push({
        id: i,
        title: `Quiz ${i}`,
        description: `Quiz after module ${i * 3}`,
        module_id: i * 3,
        questions: [
          { id: 1, question: 'Question 1', options: ['Option 1', 'Option 2', 'Option 3', 'Option 4'], correct_option: 0 }
        ]
      });
    }
    
    setModules(initialModules);
    setQuizzes(initialQuizzes);
  }, [authTokens]);

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
          const newSectionId = module.sections.length + 1;
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
          const newQuestionId = quiz.questions.length + 1;
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
    setSuccess('');

    try {
      // Check for auth token without redirecting
      if (!authTokens?.access) {
        console.error('Authentication token missing or invalid');
        setError('Authentication error. Please try logging in again.');
        setLoading(false);
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

      // Add modules and their sections
      // Make sure modules JSON is properly structured
      const modulesData = modules
        .filter(module => module.title.trim() !== '') // Filter out empty modules
        .map(module => ({
          title: module.title,
          description: module.description,
          order: module.id,
          sections: module.sections
            .filter(section => section.title.trim() !== '') // Filter out empty sections
            .map(section => ({
              title: section.title,
              description: section.description,
              content_type: section.content_type,
              video_url: section.video_url || '',
              pdf_url: section.pdf_url || '',
              order: section.order
            }))
        }));
        
      console.log('Modules data before stringify:', modulesData);
      
      // Only append modules if there are valid ones
      if (modulesData.length > 0) {
        formData.append('modules', JSON.stringify(modulesData));
      }
      
      // Add quizzes - make sure quizzes JSON is properly structured
      const quizzesData = quizzes
        .filter(quiz => quiz.title.trim() !== '') // Filter out empty quizzes
        .map(quiz => ({
          title: quiz.title,
          description: quiz.description || '',
          module_id: quiz.module_id,
          questions: quiz.questions
            .filter(question => question.question.trim() !== '') // Filter out empty questions
            .map(question => ({
              question: question.question,
              options: question.options.filter(option => option.trim() !== ''), // Filter out empty options
              correct_option: question.correct_option
            }))
        }));
        
      console.log('Quizzes data before stringify:', quizzesData);
      
      // Only append quizzes if there are valid ones
      if (quizzesData.length > 0) {
        formData.append('quizzes', JSON.stringify(quizzesData));
      }

      console.log('Submitting course data with FormData object');
      
      // Log each key-value pair in the FormData
      for (let [key, value] of formData.entries()) {
        if (key === 'modules' || key === 'quizzes') {
          console.log(`${key}: ${value.substring(0, 100)}...`); // Log just first 100 chars of JSON
        } else if (key === 'thumbnail') {
          console.log(`${key}: [File object]`);
        } else {
          console.log(`${key}: ${value}`);
        }
      }

      try {
        // Use the courseAPI instead of direct fetch
        const response = await courseAPI.createCourse(formData);
        
        console.log('Course creation successful:', response);

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
      
        // Redirect to instructor dashboard after a delay
      setTimeout(() => {
          navigate('/instructor/dashboard');
      }, 2000);
      } catch (apiError) {
        console.error('API Error:', apiError);
        
        // Check if error message contains JSON data from a 400 response
        if (apiError.message.includes('Bad Request:')) {
          try {
            const errorData = JSON.parse(apiError.message.substring(apiError.message.indexOf('{')));
            let errorMessage = 'Course creation failed with the following errors:\n';
            
            // Format error messages from the response
            Object.entries(errorData).forEach(([field, errors]) => {
              if (Array.isArray(errors)) {
                errorMessage += `• ${field}: ${errors.join(', ')}\n`;
              } else if (typeof errors === 'object') {
                errorMessage += `• ${field}: ${JSON.stringify(errors)}\n`;
              } else {
                errorMessage += `• ${field}: ${errors}\n`;
              }
            });
            
            setError(errorMessage);
          } catch (jsonError) {
            // If parsing fails, use the original error message
            setError(`Failed to create course: ${apiError.message}`);
          }
        } else {
          setError(`Failed to create course: ${apiError.message}`);
        }
      }
    } catch (error) {
      console.error('Error in course creation:', error);
      setError(`Course creation failed: ${error.message}`);
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
  };

  return (
    <div style={styles.container}>
      <main style={styles.main}>
        <div style={styles.card}>
          <div style={styles.header}>
            <h1 style={styles.title}>Create New Course</h1>
            <p style={styles.subtitle}>Add details about your new course</p>
          </div>

          {error && <div style={styles.error}>{error}</div>}
          {success && <div style={styles.success}>{success}</div>}
          
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
                    <label style={styles.inputLabel} htmlFor="title">Course Title*</label>
              <input
                      id="title"
                      style={styles.input}
                type="text"
                name="title"
                      placeholder="e.g. Introduction to React"
                value={courseData.title}
                onChange={handleChange}
                required
              />
            </div>

                  <div style={styles.inputGroup}>
                    <label style={styles.inputLabel} htmlFor="description">Course Description*</label>
              <textarea
                id="description"
                      style={styles.textarea}
                name="description"
                      placeholder="Describe your course..."
                value={courseData.description}
                onChange={handleChange}
                required
                    ></textarea>
            </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div style={styles.inputGroup}>
                      <label style={styles.inputLabel} htmlFor="price">Price ($)*</label>
              <input
                        id="price"
                        style={styles.input}
                type="number"
                name="price"
                        min="0"
                        step="0.01"
                        placeholder="29.99"
                value={courseData.price}
                onChange={handleChange}
                required
              />
            </div>

                    <div style={styles.inputGroup}>
                      <label style={styles.inputLabel} htmlFor="category">Category*</label>
              <select
                id="category"
                        style={styles.select}
                name="category"
                value={courseData.category}
                onChange={handleChange}
                required
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
                      <label style={styles.inputLabel} htmlFor="duration">Duration (in weeks)*</label>
              <input
                        id="duration"
                        style={styles.input}
                type="number"
                name="duration"
                        min="1"
                        placeholder="4"
                value={courseData.duration}
                onChange={handleChange}
                required
              />
            </div>

                    <div style={styles.inputGroup}>
                      <label style={styles.inputLabel} htmlFor="level">Difficulty Level*</label>
              <select
                id="level"
                        style={styles.select}
                name="level"
                value={courseData.level}
                onChange={handleChange}
                required
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
                onChange={handleChange}
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
                      Next: Add Modules
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
                    Course Modules (10 modules)
                  </h2>
                  
                  {modules.map((module, index) => (
                    <div key={module.id} style={styles.moduleContainer}>
                      <div style={styles.moduleHeader}>
                        <h3 style={styles.moduleTitle}>Module {module.id}</h3>
                      </div>
                      <div style={styles.moduleBody}>
                        <div style={styles.inputGroup}>
                          <label style={styles.inputLabel} htmlFor={`module-title-${module.id}`}>Module Title*</label>
                          <input
                            id={`module-title-${module.id}`}
                            style={styles.input}
                            type="text"
                            placeholder="e.g. Introduction to React Hooks"
                            value={module.title}
                            onChange={(e) => handleModuleChange(module.id, 'title', e.target.value)}
                            required
                          />
                        </div>
                        
                        <div style={styles.inputGroup}>
                          <label style={styles.inputLabel} htmlFor={`module-desc-${module.id}`}>Module Description</label>
                          <textarea
                            id={`module-desc-${module.id}`}
                            style={styles.textarea}
                            placeholder="Describe what students will learn in this module..."
                            value={module.description}
                            onChange={(e) => handleModuleChange(module.id, 'description', e.target.value)}
                          ></textarea>
                        </div>
                        
                        <h4 style={{ fontSize: '1rem', fontWeight: 500, marginBottom: '1rem', marginTop: '1.5rem' }}>
                          Sections ({module.sections.length})
                        </h4>
                        
                        {module.sections.map(section => (
                          <div key={section.id} style={styles.sectionContainer}>
                            <div style={styles.inputGroup}>
                              <label style={styles.inputLabel} htmlFor={`section-title-${module.id}-${section.id}`}>
                                Section Title*
                              </label>
                              <input
                                id={`section-title-${module.id}-${section.id}`}
                                style={styles.input}
                                type="text"
                                placeholder="e.g. useState Hook"
                                value={section.title}
                                onChange={(e) => handleSectionChange(module.id, section.id, 'title', e.target.value)}
                                required
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
                                value={section.description}
                                onChange={(e) => handleSectionChange(module.id, section.id, 'description', e.target.value)}
                              ></textarea>
                            </div>
                            
                            <div style={styles.inputGroup}>
                              <label style={styles.inputLabel} htmlFor={`content-type-${module.id}-${section.id}`}>
                                Content Type*
                              </label>
                              <select
                                id={`content-type-${module.id}-${section.id}`}
                                style={styles.select}
                                value={section.content_type}
                                onChange={(e) => handleSectionChange(module.id, section.id, 'content_type', e.target.value)}
                                required
                              >
                                <option value="video">Video</option>
                                <option value="pdf">PDF Document</option>
                                <option value="both">Both Video & PDF</option>
                              </select>
                            </div>
                            
                            {(section.content_type === 'video' || section.content_type === 'both') && (
                              <div style={styles.inputGroup}>
                                <label style={styles.inputLabel} htmlFor={`video-url-${module.id}-${section.id}`}>
                                  YouTube Video URL*
                                </label>
                                <input
                                  id={`video-url-${module.id}-${section.id}`}
                                  style={styles.input}
                                  type="url"
                                  placeholder="e.g. https://youtube.com/watch?v=..."
                                  value={section.video_url}
                                  onChange={(e) => handleSectionChange(module.id, section.id, 'video_url', e.target.value)}
                                  required={section.content_type === 'video' || section.content_type === 'both'}
                                />
                              </div>
                            )}
                            
                            {(section.content_type === 'pdf' || section.content_type === 'both') && (
                              <div style={styles.inputGroup}>
                                <label style={styles.inputLabel} htmlFor={`pdf-url-${module.id}-${section.id}`}>
                                  PDF Document URL*
                                </label>
                                <input
                                  id={`pdf-url-${module.id}-${section.id}`}
                                  style={styles.input}
                                  type="url"
                                  placeholder="e.g. https://example.com/document.pdf"
                                  value={section.pdf_url}
                                  onChange={(e) => handleSectionChange(module.id, section.id, 'pdf_url', e.target.value)}
                                  required={section.content_type === 'pdf' || section.content_type === 'both'}
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
                        
                        {/* Show quiz notice if this is module 3, 6, or 9 */}
                        {[3, 6, 9].includes(module.id) && (
                          <div style={{ 
                            marginTop: '1rem', 
                            padding: '0.75rem', 
                            backgroundColor: '#f0f9ff', 
                            borderRadius: '0.375rem',
                            borderLeft: '4px solid #0ea5e9',
                            fontSize: '0.875rem'
                          }}>
                            <strong>Note:</strong> A quiz will be added after this module. You can edit the quiz in the Quizzes tab.
                          </div>
                        )}
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
                    <button
                      type="button"
                      style={styles.button}
                      onClick={() => setActiveTab('quizzes')}
                    >
                      Next: Add Quizzes
                    </button>
                  </div>
                </div>
              )}
              
              {activeTab === 'quizzes' && (
                <div style={styles.tabContent}>
                  <div style={styles.progressBar}>
                    <div style={{ ...styles.progressFill, width: '100%' }}></div>
                  </div>
                  
                  <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem' }}>
                    Course Quizzes (One after every 3 modules)
                  </h2>
                  
                  {quizzes.map((quiz) => (
                    <div key={quiz.id} style={styles.moduleContainer}>
                      <div style={styles.moduleHeader}>
                        <h3 style={styles.moduleTitle}>{quiz.title} - After Module {quiz.module_id}</h3>
                      </div>
                      <div style={styles.moduleBody}>
                        <div style={styles.inputGroup}>
                          <label style={styles.inputLabel} htmlFor={`quiz-title-${quiz.id}`}>Quiz Title*</label>
                          <input
                            id={`quiz-title-${quiz.id}`}
                            style={styles.input}
                            type="text"
                            placeholder="e.g. React Hooks Fundamentals Quiz"
                            value={quiz.title}
                            onChange={(e) => handleQuizChange(quiz.id, 'title', e.target.value)}
                            required
                          />
                        </div>
                        
                        <div style={styles.inputGroup}>
                          <label style={styles.inputLabel} htmlFor={`quiz-desc-${quiz.id}`}>Quiz Description</label>
                          <textarea
                            id={`quiz-desc-${quiz.id}`}
                            style={styles.textarea}
                            placeholder="Describe what this quiz will assess..."
                            value={quiz.description}
                            onChange={(e) => handleQuizChange(quiz.id, 'description', e.target.value)}
                          ></textarea>
                        </div>
                        
                        <h4 style={{ fontSize: '1rem', fontWeight: 500, marginBottom: '1rem', marginTop: '1.5rem' }}>
                          Questions ({quiz.questions.length})
                        </h4>
                        
                        {quiz.questions.map((question) => (
                          <div key={question.id} style={styles.questionContainer}>
                            <div style={styles.inputGroup}>
                              <label style={styles.inputLabel} htmlFor={`question-${quiz.id}-${question.id}`}>
                                Question*
                              </label>
                              <input
                                id={`question-${quiz.id}-${question.id}`}
                                style={styles.input}
                                type="text"
                                placeholder="e.g. What is the main purpose of useState in React?"
                                value={question.question}
                                onChange={(e) => handleQuestionChange(quiz.id, question.id, 'question', e.target.value)}
                                required
                              />
            </div>

                            <div style={{ marginTop: '1rem' }}>
                              <label style={styles.inputLabel}>Options (Select the correct answer)</label>
                              
                              {question.options.map((option, index) => (
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
                                    value={option}
                                    onChange={(e) => handleOptionChange(quiz.id, question.id, index, e.target.value)}
                                    required
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
                      style={styles.button}
              disabled={loading}
            >
              {loading ? 'Creating Course...' : 'Create Course'}
            </button>
                  </div>
                </div>
              )}
          </form>
          </div>
        </div>
      </main>
    </div>
  );
}

export default CreateCourse; 