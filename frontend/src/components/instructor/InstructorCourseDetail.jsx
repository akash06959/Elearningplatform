import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { courseAPI } from '../../services/api';

function InstructorCourseDetail() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { authTokens } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [course, setCourse] = useState(null);
  
  // Fetch course data when component mounts
  useEffect(() => {
    const fetchCourseData = async () => {
      try {
        if (!authTokens?.access) {
          setError('Authentication error. Please log in again.');
          setLoading(false);
          return;
        }

        console.log('Fetching course details for ID:', courseId);
        
        // Use the new instructor-specific endpoint to get course with modules
        try {
          console.log('Trying instructor-specific endpoint');
          const courseDetails = await courseAPI.getInstructorCourseView(courseId);
          console.log('Course details structure:', {
            hasData: !!courseDetails,
            keys: courseDetails ? Object.keys(courseDetails) : [],
            hasModules: courseDetails?.modules ? `Yes (${courseDetails.modules.length})` : 'No',
            modulesSample: courseDetails?.modules?.[0] ? Object.keys(courseDetails.modules[0]) : []
          });
          
          // Normalize course data structure
          const normalizedCourse = {
            ...courseDetails,
            // Ensure modules is an array
            modules: Array.isArray(courseDetails.modules) ? courseDetails.modules.map(module => ({
              ...module,
              // Ensure sections is an array
              sections: Array.isArray(module.sections) ? module.sections : []
            })) : []
          };
          
          if (normalizedCourse.modules.length > 0) {
            console.log(`Found ${normalizedCourse.modules.length} modules in normalized course data`);
            normalizedCourse.modules.forEach((module, index) => {
              console.log(`Module ${index + 1} (${module.title}): ${module.sections.length} sections`);
            });
          } else {
            console.warn('No modules in normalized course data');
          }
          
          setCourse(normalizedCourse);
          setError('');
        } catch (viewError) {
          console.error('Error with instructor view endpoint:', viewError);
          
          // Fallback to regular course endpoint if the view endpoint fails
          console.log('Trying fallback course endpoint');
          try {
            const fallbackDetails = await courseAPI.getCourseById(courseId);
            console.log('Fallback course details structure:', {
              hasData: !!fallbackDetails,
              keys: fallbackDetails ? Object.keys(fallbackDetails) : [],
              hasModules: fallbackDetails?.modules ? `Yes (${fallbackDetails.modules.length})` : 'No'
            });
            
            // Normalize course data from fallback
            const normalizedFallback = {
              ...fallbackDetails,
              // Ensure modules is an array
              modules: Array.isArray(fallbackDetails.modules) ? fallbackDetails.modules.map(module => ({
                ...module,
                // Ensure sections is an array
                sections: Array.isArray(module.sections) ? module.sections : []
              })) : []
            };
            
            setCourse(normalizedFallback);
            setError('');
          } catch (fallbackError) {
            console.error('Error with fallback endpoint:', fallbackError);
            setError(`Failed to load course data: ${viewError.message}`);
          }
        }
      } catch (error) {
        console.error('Unexpected error in fetchCourseData:', error);
        setError(`Failed to load course data: ${error.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchCourseData();
  }, [courseId, authTokens]);

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
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
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
    button: {
      backgroundColor: '#1d4ed8',
      color: 'white',
      padding: '0.75rem 1.5rem',
      borderRadius: '0.375rem',
      fontSize: '1rem',
      fontWeight: '500',
      border: 'none',
      cursor: 'pointer',
      textDecoration: 'none',
      display: 'inline-block',
    },
    detailSection: {
      marginBottom: '1.5rem',
      padding: '1rem',
      backgroundColor: '#f9fafb',
      borderRadius: '0.375rem',
    },
    detailHeader: {
      fontSize: '1.25rem',
      fontWeight: '600',
      marginBottom: '0.5rem',
      color: '#111827',
    },
    moduleContainer: {
      margin: '1rem 0',
      padding: '1rem',
      backgroundColor: '#eef2ff',
      borderRadius: '0.375rem',
      borderLeft: '4px solid #818cf8',
    },
    moduleTitle: {
      fontSize: '1.125rem',
      fontWeight: '600',
      color: '#4f46e5',
      marginBottom: '0.5rem',
    },
    sectionList: {
      marginLeft: '1.5rem',
    },
    sectionItem: {
      margin: '0.5rem 0',
      padding: '0.5rem',
      backgroundColor: 'white',
      borderRadius: '0.25rem',
      boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    },
    quizContainer: {
      margin: '1rem 0',
      padding: '1rem',
      backgroundColor: '#ecfdf5',
      borderRadius: '0.375rem',
      borderLeft: '4px solid #34d399',
    },
    quizTitle: {
      fontSize: '1.125rem',
      fontWeight: '600',
      color: '#059669',
      marginBottom: '0.5rem',
    },
    questionList: {
      marginLeft: '1.5rem',
    },
    questionItem: {
      margin: '0.5rem 0',
      padding: '0.5rem',
      backgroundColor: 'white',
      borderRadius: '0.25rem',
      boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    },
    thumbnailContainer: {
      marginTop: '1rem',
      maxWidth: '300px',
    },
    thumbnail: {
      width: '100%',
      height: 'auto',
      borderRadius: '0.375rem',
    },
    infoGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
      gap: '1rem',
      marginBottom: '1.5rem',
    },
    infoItem: {
      padding: '0.75rem',
      backgroundColor: '#f3f4f6',
      borderRadius: '0.375rem',
    },
    infoLabel: {
      fontWeight: '500',
      color: '#6b7280',
      marginBottom: '0.25rem',
    },
    infoValue: {
      fontWeight: '600',
      color: '#111827',
    },
    actionButtons: {
      display: 'flex',
      gap: '0.5rem',
    },
  };

  if (loading) {
    return (
      <div style={{ ...styles.container, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div>Loading course details...</div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <main style={styles.main}>
        <div style={styles.card}>
          <div style={styles.header}>
            <div>
              <h1 style={styles.title}>Course Details</h1>
              <p style={styles.subtitle}>View your course information</p>
            </div>
            <div style={styles.actionButtons}>
              <Link 
                to={`/instructor/courses/${courseId}/edit`} 
                style={styles.button}
              >
                Edit Course
              </Link>
              <button 
                style={{...styles.button, backgroundColor: '#6b7280', marginLeft: '0.5rem'}}
                onClick={() => navigate('/instructor/courses')}
              >
                Back to Courses
              </button>
            </div>
          </div>
          
          {error && <div style={styles.error}>{error}</div>}
          
          {course && (
            <>
              <div style={styles.infoGrid}>
                <div style={styles.infoItem}>
                  <div style={styles.infoLabel}>Title</div>
                  <div style={styles.infoValue}>{course.title}</div>
                </div>
                <div style={styles.infoItem}>
                  <div style={styles.infoLabel}>Category</div>
                  <div style={styles.infoValue}>
                    {typeof course.category === 'object' 
                      ? course.category?.name 
                      : course.category || 'Uncategorized'}
                  </div>
                </div>
                <div style={styles.infoItem}>
                  <div style={styles.infoLabel}>Price</div>
                  <div style={styles.infoValue}>${course.price || '0.00'}</div>
                </div>
                <div style={styles.infoItem}>
                  <div style={styles.infoLabel}>Difficulty Level</div>
                  <div style={styles.infoValue}>{course.difficulty_level || 'Beginner'}</div>
                </div>
                <div style={styles.infoItem}>
                  <div style={styles.infoLabel}>Duration</div>
                  <div style={styles.infoValue}>{course.duration_in_weeks || '1'} week(s)</div>
                </div>
                <div style={styles.infoItem}>
                  <div style={styles.infoLabel}>Status</div>
                  <div style={styles.infoValue}>
                    <span style={{
                      display: 'inline-block',
                      padding: '0.25rem 0.5rem',
                      borderRadius: '9999px',
                      fontSize: '0.75rem',
                      fontWeight: '500',
                      backgroundColor: course.is_published ? '#d1fae5' : '#fee2e2',
                      color: course.is_published ? '#065f46' : '#b91c1c',
                    }}>
                      {course.is_published ? 'Published' : 'Draft'}
                    </span>
                  </div>
                </div>
              </div>
              
              <div style={styles.detailSection}>
                <h2 style={styles.detailHeader}>Description</h2>
                <p>{course.description || 'No description provided.'}</p>
              </div>
              
              {course.thumbnail && (
                <div style={styles.detailSection}>
                  <h2 style={styles.detailHeader}>Thumbnail</h2>
                  <div style={styles.thumbnailContainer}>
                    <img 
                      src={course.thumbnail} 
                      alt={`${course.title} thumbnail`} 
                      style={styles.thumbnail}
                    />
                  </div>
                </div>
              )}
              
              <div style={styles.detailSection}>
                <h2 style={styles.detailHeader}>Modules and Content</h2>
                {console.log('Rendering modules section with data:', {
                  courseHasModules: !!course.modules, 
                  modulesLength: course.modules?.length || 0,
                  modulesSample: course.modules?.[0] || 'No modules'
                })}
                {course.modules && course.modules.length > 0 ? (
                  course.modules.map((module, index) => (
                    <div key={module.id || index} style={styles.moduleContainer}>
                      {console.log('Rendering module:', module)}
                      <h3 style={styles.moduleTitle}>
                        Module {module.order || index + 1}: {module.title}
                      </h3>
                      <p>{module.description || 'No description provided.'}</p>
                      
                      <h4 style={{marginTop: '1rem', fontWeight: '500'}}>Sections:</h4>
                      {module.sections && module.sections.length > 0 ? (
                        <div style={styles.sectionList}>
                          {module.sections.map((section, sectionIndex) => (
                            <div key={section.id || sectionIndex} style={styles.sectionItem}>
                              {console.log('Rendering section:', section)}
                              <div style={{fontWeight: '500'}}>{section.title}</div>
                              <div style={{fontSize: '0.875rem', color: '#6b7280'}}>
                                {section.content_type === 'video' && (
                                  <div>
                                    <span>Video content</span>
                                    {section.video_url && (
                                      <div style={{marginTop: '0.25rem'}}>
                                        <a href={section.video_url} 
                                           target="_blank" 
                                           rel="noopener noreferrer"
                                           style={{color: '#3b82f6', textDecoration: 'underline'}}
                                        >
                                          View Video
                                        </a>
                                      </div>
                                    )}
                                  </div>
                                )}
                                {section.content_type === 'pdf' && (
                                  <div>
                                    <span>PDF document</span>
                                    {section.pdf_url && (
                                      <div style={{marginTop: '0.25rem'}}>
                                        <a href={section.pdf_url} 
                                           target="_blank" 
                                           rel="noopener noreferrer"
                                           style={{color: '#3b82f6', textDecoration: 'underline'}}
                                        >
                                          View PDF
                                        </a>
                                      </div>
                                    )}
                                  </div>
                                )}
                                {section.content_type === 'both' && (
                                  <div>
                                    <span>Video and PDF content</span>
                                    <div style={{marginTop: '0.25rem', display: 'flex', gap: '1rem'}}>
                                      {section.video_url && (
                                        <a href={section.video_url} 
                                           target="_blank" 
                                           rel="noopener noreferrer"
                                           style={{color: '#3b82f6', textDecoration: 'underline'}}
                                        >
                                          View Video
                                        </a>
                                      )}
                                      {section.pdf_url && (
                                        <a href={section.pdf_url} 
                                           target="_blank" 
                                           rel="noopener noreferrer"
                                           style={{color: '#3b82f6', textDecoration: 'underline'}}
                                        >
                                          View PDF
                                        </a>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p>No sections in this module.</p>
                      )}
                    </div>
                  ))
                ) : (
                  <div>
                    <p>No modules defined for this course.</p>
                    <div style={{marginTop: '1rem', padding: '1rem', backgroundColor: '#fee2e2', borderRadius: '0.375rem'}}>
                      <p style={{fontWeight: '500', color: '#b91c1c'}}>Important:</p>
                      <p>This course has no content modules defined. Students will not be able to access any learning materials.</p>
                      <p style={{marginTop: '0.5rem'}}>
                        <Link 
                          to={`/instructor/courses/${courseId}/edit`} 
                          style={{color: '#2563eb', textDecoration: 'underline', fontWeight: '500'}}
                        >
                          Edit this course
                        </Link> to add modules and sections.
                      </p>
                    </div>
                  </div>
                )}
              </div>
              
              <div style={styles.detailSection}>
                <h2 style={styles.detailHeader}>Quizzes</h2>
                {course.quizzes && course.quizzes.length > 0 ? (
                  course.quizzes.map((quiz, index) => (
                    <div key={quiz.id || index} style={styles.quizContainer}>
                      <h3 style={styles.quizTitle}>{quiz.title}</h3>
                      <p>{quiz.description || 'No description provided.'}</p>
                      
                      <h4 style={{marginTop: '1rem', fontWeight: '500'}}>Questions:</h4>
                      {quiz.questions && quiz.questions.length > 0 ? (
                        <div style={styles.questionList}>
                          {quiz.questions.map((question, questionIndex) => (
                            <div key={question.id || questionIndex} style={styles.questionItem}>
                              <div style={{fontWeight: '500'}}>{question.question}</div>
                              <div style={{fontSize: '0.875rem', marginTop: '0.5rem'}}>
                                {question.options && question.options.map((option, optionIndex) => (
                                  <div key={optionIndex} style={{
                                    padding: '0.25rem',
                                    backgroundColor: question.correct_option === optionIndex ? '#d1fae5' : 'transparent',
                                    borderRadius: '0.25rem',
                                    marginBottom: '0.25rem'
                                  }}>
                                    {optionIndex + 1}. {option}
                                    {question.correct_option === optionIndex && 
                                      <span style={{marginLeft: '0.5rem', color: '#059669', fontWeight: '500'}}>✓</span>
                                    }
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p>No questions in this quiz.</p>
                      )}
                    </div>
                  ))
                ) : (
                  <p>No quizzes defined for this course.</p>
                )}
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}

export default InstructorCourseDetail; 