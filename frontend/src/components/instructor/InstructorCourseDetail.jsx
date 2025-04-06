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
              
              {course.modules && course.modules.length > 0 && (
                <div style={styles.detailSection}>
                  <h3 style={styles.detailHeader}>Modules and Content</h3>
                  {course.modules.map((module) => (
                    <div key={module.id} style={styles.moduleContainer}>
                      <h4 style={styles.moduleTitle}>{module.title || 'Unnamed Module'}</h4>
                      <p>{module.description}</p>
                      
                      {module.sections && module.sections.length > 0 ? (
                        <div style={styles.sectionList}>
                          {module.sections.map((section) => {
                            // Extract video ID from YouTube URL if present
                            let videoId = '';
                            if (section.video_url) {
                              try {
                                if (section.video_id) {
                                  videoId = section.video_id;
                                } else if (section.video_url.includes('youtube.com/watch')) {
                                  const urlParams = new URL(section.video_url).searchParams;
                                  videoId = urlParams.get('v');
                                } else if (section.video_url.includes('youtu.be/')) {
                                  videoId = section.video_url.split('youtu.be/')[1].split('?')[0];
                                } else if (section.video_url.includes('youtube.com/embed/')) {
                                  videoId = section.video_url.split('youtube.com/embed/')[1].split('?')[0];
                                }
                              } catch (e) {
                                console.error('Error parsing YouTube URL', e);
                              }
                            }
                            
                            return (
                              <div key={section.id} style={{
                                ...styles.sectionItem,
                                borderLeft: '3px solid #6366f1',
                                padding: '0.75rem',
                                marginBottom: '0.75rem'
                              }}>
                                <h5 style={{
                                  fontSize: '1rem',
                                  fontWeight: '600',
                                  marginBottom: '0.5rem'
                                }}>{section.title || 'Unnamed Section'}</h5>
                                
                                <p style={{ marginBottom: '0.75rem' }}>{section.description}</p>
                                
                                <div style={{ marginTop: '0.75rem' }}>
                                  {(section.content_type === 'video' || section.content_type === 'both') && section.video_url && (
                                    <div>
                                      <div style={{
                                        fontWeight: '500',
                                        color: '#4b5563',
                                        marginBottom: '0.5rem',
                                        display: 'flex',
                                        alignItems: 'center'
                                      }}>
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ width: '1.25rem', height: '1.25rem', marginRight: '0.5rem' }}>
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        Video Content
                                      </div>
                                      
                                      {videoId ? (
                                        <div style={{
                                          position: 'relative',
                                          paddingBottom: '56.25%', // 16:9 aspect ratio
                                          height: 0,
                                          overflow: 'hidden',
                                          marginBottom: '1rem',
                                          borderRadius: '0.375rem',
                                          border: '1px solid #e5e7eb',
                                        }}>
                                          <iframe 
                                            style={{
                                              position: 'absolute',
                                              top: 0,
                                              left: 0,
                                              width: '100%',
                                              height: '100%',
                                              borderRadius: '0.375rem',
                                            }}
                                            src={`https://www.youtube.com/embed/${videoId}`}
                                            title="YouTube video player"
                                            frameBorder="0"
                                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                            allowFullScreen
                                          ></iframe>
                                        </div>
                                      ) : (
                                        <a
                                          href={section.video_url}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          style={{
                                            display: 'inline-block',
                                            padding: '0.5rem 0.75rem',
                                            backgroundColor: '#eff6ff',
                                            color: '#1d4ed8',
                                            borderRadius: '0.375rem',
                                            textDecoration: 'none',
                                            marginBottom: '0.75rem',
                                            fontWeight: '500',
                                          }}
                                        >
                                          Open Video
                                        </a>
                                      )}
                                    </div>
                                  )}
                                  
                                  {(section.content_type === 'pdf' || section.content_type === 'both') && section.pdf_url && (
                                    <div>
                                      <div style={{
                                        fontWeight: '500',
                                        color: '#4b5563',
                                        marginBottom: '0.5rem',
                                        display: 'flex',
                                        alignItems: 'center'
                                      }}>
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ width: '1.25rem', height: '1.25rem', marginRight: '0.5rem' }}>
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                        PDF Document
                                      </div>
                                      
                                      <div style={{
                                        border: '1px solid #e5e7eb',
                                        borderRadius: '0.375rem',
                                        overflow: 'hidden',
                                        marginBottom: '0.75rem',
                                      }}>
                                        <div style={{
                                          position: 'relative',
                                          height: '400px',
                                          width: '100%',
                                        }}>
                                          <iframe
                                            src={`${section.pdf_url}#toolbar=0&navpanes=0`}
                                            style={{
                                              width: '100%',
                                              height: '100%',
                                              border: 'none',
                                            }}
                                            title="PDF Document"
                                          ></iframe>
                                        </div>
                                        <div style={{
                                          padding: '0.5rem',
                                          display: 'flex',
                                          justifyContent: 'center',
                                          backgroundColor: '#f9fafb',
                                          borderTop: '1px solid #e5e7eb'
                                        }}>
                                          <a
                                            href={section.pdf_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            style={{
                                              display: 'inline-block',
                                              padding: '0.5rem 0.75rem',
                                              backgroundColor: '#eff6ff',
                                              color: '#1d4ed8',
                                              borderRadius: '0.375rem',
                                              textDecoration: 'none',
                                              fontWeight: '500',
                                            }}
                                          >
                                            Open PDF in New Tab
                                          </a>
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                  
                                  {section.content_type === 'text' && (
                                    <div style={{
                                      padding: '0.75rem',
                                      backgroundColor: '#f9fafb',
                                      borderRadius: '0.375rem',
                                      border: '1px solid #e5e7eb',
                                    }}>
                                      <div style={{
                                        fontWeight: '500',
                                        color: '#4b5563',
                                        marginBottom: '0.5rem',
                                      }}>
                                        Text Content
                                      </div>
                                      <div>{section.description}</div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div style={{ marginTop: '0.5rem', color: '#6b7280', fontStyle: 'italic' }}>
                          No sections defined for this module.
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
              
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