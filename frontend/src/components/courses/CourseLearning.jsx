import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { courseAPI, enrollmentAPI, progressAPI } from '../../services/api';

function CourseLearning() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [sections, setSections] = useState([]);
  const [enrollment, setEnrollment] = useState(null);
  const [progress, setProgress] = useState([]);
  const [currentContent, setCurrentContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notes, setNotes] = useState('');

  const styles = {
    container: {
      minHeight: '100vh',
      backgroundColor: '#f8f9fa',
      padding: '2rem',
    },
    header: {
      marginBottom: '2rem',
    },
    title: {
      fontSize: '2rem',
      color: '#2c3e50',
      marginBottom: '1rem',
    },
    table: {
      width: '100%',
      backgroundColor: 'white',
      borderRadius: '8px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      borderCollapse: 'collapse',
      marginBottom: '2rem',
    },
    th: {
      backgroundColor: '#f8f9fa',
      padding: '1rem',
      textAlign: 'left',
      borderBottom: '2px solid #dee2e6',
      color: '#495057',
      fontWeight: '600',
    },
    td: {
      padding: '1rem',
      borderBottom: '1px solid #dee2e6',
      color: '#212529',
    },
    loadingContainer: {
      textAlign: 'center',
      padding: '2rem',
      color: '#6c757d',
    },
    errorContainer: {
      textAlign: 'center',
      padding: '2rem',
      color: '#dc3545',
      backgroundColor: '#f8d7da',
      borderRadius: '8px',
      marginBottom: '1rem',
    },
    button: {
      backgroundColor: '#3a5a9b',
      color: 'white',
      padding: '0.5rem 1rem',
      borderRadius: '4px',
      border: 'none',
      cursor: 'pointer',
      marginTop: '1rem',
    },
  };

  useEffect(() => {
    // Validate courseId
    if (!courseId || courseId === 'undefined') {
      console.warn('No course ID provided');
      navigate('/courses', { replace: true });
      return;
    }

    const fetchCourseData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Check if user is enrolled
        try {
          const enrollmentData = await enrollmentAPI.checkEnrollment(courseId);
          if (!enrollmentData?.enrolled) {
            console.log('User not enrolled in course, redirecting to course details');
            navigate(`/courses/${courseId}`);
            return;
          }
          setEnrollment(enrollmentData);
        } catch (enrollError) {
          console.error('Error checking enrollment:', enrollError);
          navigate(`/courses/${courseId}`);
          return;
        }
        
        // Fetch course data
        const [courseData, progressData] = await Promise.all([
          courseAPI.getCourseById(courseId),
          progressAPI.getCourseProgress(courseId)
        ]);
        
        if (!courseData) {
          throw new Error('Failed to load course data');
        }
        
        setCourse(courseData);
        setProgress(progressData || []);
        
        // Set sections if available in course data
        if (courseData.sections) {
          setSections(courseData.sections);
          
          // Find first uncompleted content or default to first content
          const flattenedContents = courseData.sections.flatMap(section => 
            section.lessons.map(lesson => ({
              ...lesson,
              sectionTitle: section.title,
              sectionId: section.id
            }))
          );
          
          if (flattenedContents.length > 0) {
            const progressMap = new Map(progressData?.map(p => [p.lesson_id, p]) || []);
            const firstUncompletedContent = flattenedContents.find(content => 
              !progressMap.has(content.id) || !progressMap.get(content.id).completed
            );
            
            const contentToDisplay = firstUncompletedContent || flattenedContents[0];
            setCurrentContent(contentToDisplay);
            
            // If there's a progress record for this content, load notes
            const contentProgress = progressMap.get(contentToDisplay.id);
            if (contentProgress?.notes) {
              setNotes(contentProgress.notes);
            }
          }
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Error loading course data:', err);
        setError(err.message || "Failed to load course data. Please try again later.");
        setLoading(false);
      }
    };

    fetchCourseData();
  }, [courseId, navigate]);

  const handleContentClick = (content) => {
    setCurrentContent(content);
    
    // Find the progress for this content to load notes
    const contentProgress = progress.find(p => p.content.id === content.id);
    if (contentProgress?.notes) {
      setNotes(contentProgress.notes);
    } else {
      setNotes('');
    }
    
    // Mark as accessed in the backend
    progressAPI.markLessonAccessed(courseId, content.id)
      .catch(err => console.error("Error marking content as accessed:", err));
  };

  const handleMarkComplete = async () => {
    if (!currentContent) return;
    
    try {
      const response = await progressAPI.markLessonComplete(courseId, currentContent.id);
      
      // Update progress in state
      setProgress(prev => {
        const existingIndex = prev.findIndex(p => p.content.id === currentContent.id);
        if (existingIndex >= 0) {
          const updated = [...prev];
          updated[existingIndex] = response;
          return updated;
        } else {
          return [...prev, response];
        }
      });
    } catch (error) {
      console.error("Error marking content as complete:", error);
    }
  };

  const handleSaveNotes = async () => {
    if (!currentContent) return;
    
    try {
      const response = await progressAPI.saveNotes(courseId, currentContent.id, notes);
      
      // Update progress in state
      setProgress(prev => {
        const existingIndex = prev.findIndex(p => p.content.id === currentContent.id);
        if (existingIndex >= 0) {
          const updated = [...prev];
          updated[existingIndex] = response;
          return updated;
        } else {
          return [...prev, response];
        }
      });
    } catch (error) {
      console.error("Error saving notes:", error);
    }
  };

  const isContentCompleted = (contentId) => {
    return progress.some(p => p.content.id === contentId && p.completed);
  };

  const renderContentView = () => {
    if (!currentContent) return null;
    
    switch (currentContent.content_type) {
      case 'text':
        return (
          <div className="prose max-w-none">
            <div dangerouslySetInnerHTML={{ __html: currentContent.text_content }} />
          </div>
        );
      case 'video':
        return (
          <div>
            <div className="relative pb-16:9 h-0 mb-4">
              <iframe 
                className="absolute top-0 left-0 w-full h-full rounded-lg"
                src={currentContent.video_url} 
                title={currentContent.title}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            </div>
          </div>
        );
      case 'file':
        return (
          <div className="text-center">
            <p className="mb-4">This lesson contains a downloadable file:</p>
            <a 
              href={currentContent.file}
              download
              className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-3 rounded-lg"
            >
              Download File
            </a>
          </div>
        );
      case 'quiz':
        return (
          <div>
            <p className="mb-4">This content includes a quiz. Please complete it to track your progress.</p>
            {/* Quiz component would go here */}
          </div>
        );
      default:
        return (
          <div className="text-center text-gray-500">
            <p>Content format not supported.</p>
          </div>
        );
    }
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loadingContainer}>Loading course content...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.container}>
        <div style={styles.errorContainer}>
          <p>{error}</p>
          <button style={styles.button} onClick={() => navigate('/courses')}>
            Back to Courses
          </button>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div style={styles.container}>
        <div style={styles.loadingContainer}>Course content not available</div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>{course.title || 'Course Content'}</h1>
      </div>

      <table style={styles.table}>
        <thead>
          <tr>
            <th style={styles.th}>Field</th>
            <th style={styles.th}>Details</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style={styles.td}>Course Title</td>
            <td style={styles.td}>{course.title || 'N/A'}</td>
          </tr>
          <tr>
            <td style={styles.td}>Instructor</td>
            <td style={styles.td}>{course.instructor?.name || course.instructor?.username || 'N/A'}</td>
          </tr>
          <tr>
            <td style={styles.td}>Duration</td>
            <td style={styles.td}>{course.duration_in_weeks || 'N/A'} weeks</td>
          </tr>
          <tr>
            <td style={styles.td}>Difficulty Level</td>
            <td style={styles.td}>{course.difficulty_level || 'N/A'}</td>
          </tr>
          <tr>
            <td style={styles.td}>Total Students</td>
            <td style={styles.td}>{course.total_students || 0}</td>
          </tr>
          <tr>
            <td style={styles.td}>Average Rating</td>
            <td style={styles.td}>{course.avg_rating?.toFixed(1) || 'No ratings yet'}</td>
          </tr>
          <tr>
            <td style={styles.td}>Description</td>
            <td style={styles.td}>{course.description || 'No description available'}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

export default CourseLearning;