import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { courseAPI } from '../../services/api';
import { progressService } from '../../services/progressService';
import toast from 'react-hot-toast';

function CourseLearning() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [modules, setModules] = useState([]);
  const [currentModule, setCurrentModule] = useState(null);
  const [currentSection, setCurrentSection] = useState(null);
  const [progress, setProgress] = useState({});
  const [overallProgress, setOverallProgress] = useState(0);
  const [totalSections, setTotalSections] = useState(0);
  const [completedSections, setCompletedSections] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showQuizModal, setShowQuizModal] = useState(false);
  const [currentQuiz, setCurrentQuiz] = useState(null);
  const [quizAnswers, setQuizAnswers] = useState({});
  const [quizResult, setQuizResult] = useState(null);
  const [activeTab, setActiveTab] = useState('content');
  const [notes, setNotes] = useState('');
  const [saveStatus, setSaveStatus] = useState('');
  const saveNotesTimeout = useRef(null);

  useEffect(() => {
    console.log('CourseLearning: Component mounted, courseId:', courseId);
    
    if (!courseId) {
      console.error('CourseLearning: No course ID provided');
      setError("No course ID provided");
      return;
    }

    const fetchCourseData = async () => {
      try {
        setLoading(true);
        console.log("CourseLearning: Starting to fetch data for course ID:", courseId);
        
        // Check enrollment status
        try {
          console.log("CourseLearning: Checking enrollment status");
          const enrollmentCheck = await courseAPI.checkEnrollmentStatus(courseId);
          console.log("CourseLearning: Enrollment check result:", enrollmentCheck);
          
          // Only redirect if explicitly not enrolled (avoid redirecting due to errors)
          if (enrollmentCheck && enrollmentCheck.status === 'success' && enrollmentCheck.is_enrolled === false) {
            console.log("CourseLearning: Not enrolled in this course, showing warning");
            toast.error("You're not enrolled in this course, but we'll show you the content anyway");
          }
        } catch (enrollmentError) {
          console.error("CourseLearning: Error checking enrollment status:", enrollmentError);
          // Continue anyway - we'll assume they're enrolled and let them try
        }
        
        // Fetch course data
        console.log("CourseLearning: Fetching course data with ID:", courseId);
        const courseData = await courseAPI.getCourseById(courseId);
        
        if (!courseData) {
          throw new Error("Failed to load course data");
        }
        
        console.log("Course data loaded successfully:", courseData);
        console.log("Course modules:", courseData.modules);
        
        setCourse(courseData);
        
        // Initialize modules and sections from course data
        if (courseData.modules && Array.isArray(courseData.modules)) {
          console.log(`Found ${courseData.modules.length} modules in course data`);
          
          // Debugging: Check each module's sections
          courseData.modules.forEach((module, idx) => {
            console.log(`Module ${idx + 1} (${module.title}):`);
            console.log(` - Sections count: ${module.sections?.length || 0}`);
            if (module.sections && module.sections.length > 0) {
              module.sections.forEach((section, sIdx) => {
                console.log(`   * Section ${sIdx + 1}: ${section.title}`);
                console.log(`     ID: ${section.id}`);
                console.log(`     Content type: ${section.content_type}`);
                console.log(`     Video URL: ${section.video_url || 'None'}`);
                console.log(`     PDF URL: ${section.pdf_url || 'None'}`);
                console.log(`     Has PDF file: ${section.has_pdf_file || false}`);
                
                // Special PDF debugging
                if (section.content_type === 'pdf' || section.content_type === 'both') {
                  if (!section.pdf_url) {
                    console.warn(`⚠️ PDF section ${section.id} has no PDF URL!`);
                  } else {
                    console.log(`✅ PDF section ${section.id} has URL: ${section.pdf_url}`);
                  }
                }
              });
            }
          });
          
          setModules(courseData.modules);
          
          // Initialize progress tracking
          try {
            progressService.initializeProgress(courseId, courseData.modules);
            
            // Get progress data
            const progressData = await progressService.getCourseProgress(courseId);
            setProgress(progressData || {});
            
            // Calculate total and completed sections
            let totalCount = 0;
            let completedCount = 0;
            
            courseData.modules.forEach(module => {
              if (module.sections && Array.isArray(module.sections)) {
                totalCount += module.sections.length;
                
                module.sections.forEach(section => {
                  if (progressData && progressData[section.id]) {
                    completedCount++;
                  }
                });
              }
            });
            
            setTotalSections(totalCount);
            setCompletedSections(completedCount);
            setOverallProgress(totalCount > 0 ? (completedCount / totalCount) * 100 : 0);
            
            // Set initial module and section
            if (courseData.modules.length > 0) {
              const firstModule = courseData.modules[0];
              console.log("Setting initial module:", firstModule.title);
              setCurrentModule(firstModule);
              
              if (firstModule.sections && firstModule.sections.length > 0) {
                const firstSection = firstModule.sections[0];
                console.log("Setting initial section:", firstSection.title);
                console.log("Section details:", {
                  id: firstSection.id,
                  title: firstSection.title,
                  content_type: firstSection.content_type,
                  video_url: firstSection.video_url,
                  pdf_url: firstSection.pdf_url,
                  has_pdf_file: firstSection.has_pdf_file
                });
                
                setCurrentSection(firstSection);
                // Load notes for first section
                const sectionNotes = progressService.getNotes(courseId, firstSection.id);
                setNotes(sectionNotes);
              } else {
                console.warn("First module has no sections!");
              }
            } else {
              console.warn("Course has no modules to display!");
            }
          } catch (progressError) {
            console.error("Error with progress tracking:", progressError);
            // Continue with default progress values
          }
        } else {
          console.warn("Course has no modules array or the modules property is not an array");
          console.log("Course data structure:", courseData);
        }
        
        setLoading(false);
      } catch (err) {
        console.error("Error loading course:", err);
        setError(err.message || "Failed to load course data. Please try again later.");
        setLoading(false);
      }
    };
    
    fetchCourseData();
  }, [courseId, navigate]);

  const handleModuleClick = (module) => {
    setCurrentModule(module);
    
    if (module.sections && module.sections.length > 0) {
      const section = module.sections[0];
      setCurrentSection(section);
      // Load notes for the new section
      const sectionNotes = progressService.getNotes(courseId, section.id);
      setNotes(sectionNotes);
    }
  };

  const handleSectionClick = (section) => {
    setCurrentSection(section);
    // Load notes for the new section
    const sectionNotes = progressService.getNotes(courseId, section.id);
    setNotes(sectionNotes);
  };

  const handleMarkComplete = async () => {
    if (!currentSection) return;
    
    try {
      // Update progress using progressService
      const result = await progressService.markSectionComplete(courseId, currentSection.id);
      
      if (result.success) {
        // Update local state
        const updatedProgress = {
          ...progress,
          [currentSection.id]: true
        };
        
        setProgress(updatedProgress);
        
        // Update completion counts
        const newCompletedCount = completedSections + 1;
        setCompletedSections(newCompletedCount);
        setOverallProgress((newCompletedCount / totalSections) * 100);
        
        toast.success(result.message);
        
        // Check if this section completes a module for quiz
        const isLastSection = 
          currentModule.sections[currentModule.sections.length - 1].id === currentSection.id;
        
        // Show quiz for modules 3, 6, and 9
        if (isLastSection && [3, 6, 9].includes(currentModule.order)) {
          // Check if quiz has already been passed
          try {
            const quizId = currentModule.order / 3;
            const hasPassed = progressService.hasPassedQuiz(courseId, quizId);
            
            if (!hasPassed) {
              // Find the quiz for this module
              const quizForModule = {
                id: quizId,
                title: `Quiz ${quizId}`,
                description: `Test your knowledge of Module ${currentModule.order}`,
                questions: [
                  {
                    id: 1,
                    question: 'What is the main topic of this module?',
                    options: [
                      'Introduction to web development',
                      'Advanced database management',
                      'User interface design',
                      'The content from this module'
                    ],
                    correct_option: 3
                  },
                  {
                    id: 2,
                    question: 'How many sections are in this module?',
                    options: [
                      '1-2 sections',
                      '3-5 sections',
                      `${currentModule.sections.length} sections`,
                      'More than 10 sections'
                    ],
                    correct_option: 2
                  },
                  {
                    id: 3,
                    question: 'What would you need to do to progress in the course?',
                    options: [
                      'Skip to the next module',
                      'Mark sections as complete',
                      'Rewatch the videos',
                      'Download all PDFs'
                    ],
                    correct_option: 1
                  }
                ]
              };
              
              setCurrentQuiz(quizForModule);
              setQuizAnswers({});
              setQuizResult(null);
              setShowQuizModal(true);
            } else {
              toast.success("You've already completed the quiz for this module!");
            }
          } catch (quizError) {
            console.error("Error with quiz handling:", quizError);
            // Just continue without showing quiz
          }
        }
      } else {
        toast.error(result.message || "Failed to mark section as complete");
      }
    } catch (error) {
      console.error("Error marking section complete:", error);
      toast.error("Failed to update progress. Please try again.");
    }
  };

  const handleQuizSubmit = async () => {
    if (!currentQuiz) return;
    
    try {
      // Calculate score
      let correctAnswers = 0;
      
      currentQuiz.questions.forEach(question => {
        if (quizAnswers[question.id] === question.correct_option) {
          correctAnswers++;
        }
      });
      
      const score = Math.round((correctAnswers / currentQuiz.questions.length) * 100);
      
      try {
        // Submit quiz results
        const result = await progressService.submitQuizResults(courseId, currentQuiz.id, {
          score,
          answers: quizAnswers
        });
        
        console.log("Quiz submission result:", result);
      } catch (submitError) {
        console.error("Error submitting quiz results:", submitError);
        // Continue anyway - we'll just show the results locally
      }
      
      // Set quiz result
      setQuizResult({
        score,
        correctAnswers,
        totalQuestions: currentQuiz.questions.length,
        passed: score >= 70 // Assuming 70% is passing score
      });
      
      // Show appropriate toast
      if (score >= 70) {
        toast.success("Quiz completed successfully! You can now proceed to the next module.");
      } else {
        toast.error("You didn't pass the quiz. Please review the material and try again.");
      }
    } catch (error) {
      console.error("Error processing quiz submission:", error);
      toast.error("There was a problem submitting your quiz. Please try again.");
    }
  };

  const handleQuizClose = () => {
    setShowQuizModal(false);
    
    // If quiz was passed, move to next module
    if (quizResult && quizResult.passed) {
      const currentModuleIndex = modules.findIndex(m => m.id === currentModule.id);
      
      if (currentModuleIndex < modules.length - 1) {
        const nextModule = modules[currentModuleIndex + 1];
        handleModuleClick(nextModule);
      }
    }
  };
  
  const handleNotesChange = (e) => {
    const newNotes = e.target.value;
    setNotes(newNotes);
    
    // Clear any existing timeout
    if (saveNotesTimeout.current) {
      clearTimeout(saveNotesTimeout.current);
    }
    
    // Show saving indicator
    setSaveStatus('saving');
    
    // Set a new timeout to save after 1 second of inactivity
    saveNotesTimeout.current = setTimeout(() => {
      saveNotes(newNotes);
    }, 1000);
  };

  const handleSaveNotes = () => {
    // Clear any pending autosave
    if (saveNotesTimeout.current) {
      clearTimeout(saveNotesTimeout.current);
      saveNotesTimeout.current = null;
    }
    
    saveNotes(notes);
  };

  const saveNotes = async (notesContent) => {
    setSaveStatus('saving');
    
    try {
      const result = await progressService.saveNotes(courseId, currentSection.id, notesContent);
      
      if (result.success) {
        setSaveStatus('saved');
        // Reset status after 3 seconds
        setTimeout(() => setSaveStatus(''), 3000);
      } else {
        setSaveStatus('');
        toast.error('Failed to save notes');
      }
    } catch (error) {
      console.error('Error saving notes:', error);
      setSaveStatus('');
      toast.error('Failed to save notes');
    }
  };

  // Render YouTube video from URL
  const renderYouTubeVideo = (url) => {
    if (!url) return <div className="p-4 bg-gray-100 rounded text-center">No video URL provided</div>;
    
    try {
      // Extract video ID from YouTube URL
      const video_url = new URL(url);
      let videoId = '';
      
      // Handle different YouTube URL formats
      if (url.includes('youtube.com/watch')) {
        const urlParams = new URLSearchParams(video_url.search);
        videoId = urlParams.get('v');
        console.log("Extracted video ID from youtube.com/watch:", videoId);
      } else if (url.includes('youtu.be/')) {
        videoId = url.split('youtu.be/')[1].split('?')[0];
        console.log("Extracted video ID from youtu.be/:", videoId);
      } else if (url.includes('youtube.com/embed/')) {
        videoId = url.split('youtube.com/embed/')[1].split('?')[0];
        console.log("Extracted video ID from youtube.com/embed/:", videoId);
      } else {
        console.warn("Could not recognize YouTube URL format:", url);
      }
      
      if (!videoId) {
        console.error("Failed to extract video ID from URL:", url);
        throw new Error('Could not extract video ID');
      }
      
      console.log("Final video ID for embedding:", videoId);
      // Return iframe with YouTube embed in a larger, more prominent container
      return (
        <div className="bg-black rounded-lg shadow-lg overflow-hidden">
          <div className="relative" style={{ paddingTop: '56.25%', /* 16:9 aspect ratio */ }}>
            <iframe
              src={`https://www.youtube.com/embed/${videoId}`}
              title="YouTube video player"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="absolute inset-0 w-full h-full"
              style={{ 
                minHeight: '480px', 
                width: '100%',
                border: 'none'
              }}
            ></iframe>
          </div>
          <div className="bg-gray-900 text-white px-4 py-3 flex justify-between items-center">
            <div className="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-red-500" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"/>
              </svg>
              <span className="font-medium">Video Content</span>
            </div>
            <a 
              href={url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300 transition-colors text-sm flex items-center"
            >
              Open in YouTube
              <svg className="ml-1 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          </div>
        </div>
      );
    } catch (error) {
      console.error('Error rendering YouTube video:', error);
      
      // Fallback to direct link
      return (
        <div className="p-6 bg-gray-100 rounded-lg text-center shadow">
          <div className="mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-red-500 mb-2" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"/>
            </svg>
            <p className="text-lg font-medium mb-2">Unable to embed video</p>
            <p className="text-sm text-gray-600 mb-4">Error: {error.message}</p>
          </div>
          <a 
            href={url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-block px-6 py-3 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors"
          >
            Watch on YouTube
          </a>
        </div>
      );
    }
  };

  const renderPDF = (url, fromDb = false, moduleId = null) => {
    if (!url && !moduleId) {
      console.error("Attempted to render PDF with no URL or module ID provided");
      return (
        <div className="p-6 bg-gray-50 rounded-lg border border-gray-200 text-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400 mb-3" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-9.5 8.5h3v-1h-2v-1h2V8h-3V7h3.5c.55 0 1 .45 1 1v1.5c0 .55-.45 1-1 1h-2v1h3V13H8.5v-1.5z"/>
          </svg>
          <h3 className="text-lg font-medium mb-2">No PDF Document Available</h3>
          <p className="text-gray-600">This section doesn't have a PDF document attached.</p>
        </div>
      );
    }
    
    console.log("Rendering PDF with:", {url, fromDb, moduleId});
    
    try {
      // Generate the correct URL for the PDF
      let pdfUrl = url;
      
      if (fromDb && moduleId) {
        // Use the database PDF endpoint
        pdfUrl = `http://localhost:8000/api/courses/modules/${moduleId}/pdf/`;
        console.log("Using database PDF URL:", pdfUrl);
      } else if (url) {
        // Handle both direct URLs and local media paths
        let isExternalUrl = url.startsWith('http://') || url.startsWith('https://');
        
        // If the URL doesn't start with http/https, assume it's a relative path from media
        if (!isExternalUrl) {
          // Try to use Django's media URL
          const MEDIA_URL = 'http://localhost:8000';
          pdfUrl = `${MEDIA_URL}${url.startsWith('/') ? '' : '/'}${url}`;
          console.log("Converting relative PDF path to absolute URL:", pdfUrl);
        }
      }
      
      // Make sure we have a valid URL
      try {
        new URL(pdfUrl);
      } catch (urlError) {
        console.error("Invalid PDF URL:", urlError);
        throw new Error("The PDF URL is not valid");
      }
      
      // Determine a document title from the URL or module ID
      let documentTitle = 'PDF Document';
      if (pdfUrl) {
        const urlParts = pdfUrl.split('/');
        const pdfFileName = urlParts[urlParts.length - 1].split('?')[0]; // Remove query params
        documentTitle = decodeURIComponent(pdfFileName).replace(/\+/g, ' ');
      } else if (moduleId) {
        documentTitle = `Module ${moduleId} PDF`;
      }
      
      // Return enhanced PDF viewer
      return (
        <div className="bg-gray-800 rounded-lg overflow-hidden shadow-lg">
          {/* Header bar */}
          <div className="bg-gray-900 text-white p-3 flex items-center justify-between">
            <div className="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-500 mr-2" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-9.5 8.5h3v-1h-2v-1h2V8h-3V7h3.5c.55 0 1 .45 1 1v1.5c0 .55-.45 1-1 1h-2v1h3V13H8.5v-1.5z"/>
              </svg>
              <div className="truncate max-w-xs">
                <h3 className="font-medium text-sm">PDF Document</h3>
                <p className="text-xs text-gray-400 truncate">{documentTitle}</p>
              </div>
            </div>
            
            <a 
              href={pdfUrl} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="bg-red-600 hover:bg-red-700 text-white text-sm px-3 py-1 rounded flex items-center transition-colors"
              title="Open PDF in new tab"
            >
              Open PDF
              <svg className="ml-1 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          </div>
          
          {/* PDF content */}
          <div className="bg-gray-700 pt-1 pb-3 px-3">
            <div className="relative" style={{ paddingBottom: "56.25%" }}>
              <iframe
                src={pdfUrl}
                title="PDF Document Viewer"
                className="absolute inset-0 w-full h-full border-0 bg-white rounded"
                style={{ minHeight: "480px" }}
                allowFullScreen
              ></iframe>
            </div>
          </div>
          
          {/* Footer bar */}
          <div className="bg-gray-900 text-gray-300 p-2 flex justify-between text-xs">
            <span className="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Scroll to navigate through pages
            </span>
            <span className="text-gray-400">
              {fromDb ? 'Database PDF' : 'File storage PDF'}
            </span>
          </div>
        </div>
      );
    } catch (error) {
      console.error('Error rendering PDF:', error);
      
      // Enhanced fallback display with more helpful information
      return (
        <div className="p-6 bg-gray-50 rounded-lg border border-gray-200 text-center shadow">
          <div className="mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-red-600 mb-3" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-9.5 8.5h3v-1h-2v-1h2V8h-3V7h3.5c.55 0 1 .45 1 1v1.5c0 .55-.45 1-1 1h-2v1h3V13H8.5v-1.5z"/>
            </svg>
            <h3 className="text-lg font-medium mb-2">Unable to Display PDF</h3>
            <p className="text-gray-600 mb-3">
              We couldn't display the PDF document in the viewer. This could be due to browser restrictions, 
              cross-origin policies, or an issue with the document.
            </p>
            <div className="bg-gray-100 p-3 mb-4 rounded text-left overflow-x-auto">
              <p className="text-xs font-mono text-gray-700">{url}</p>
              {error && <p className="text-xs font-mono text-red-600 mt-1">Error: {error.message}</p>}
            </div>
          </div>
          
          <a 
            href={url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-block px-6 py-3 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors"
          >
            Download PDF
          </a>
        </div>
      );
    }
  };

  const renderModulePDF = (module) => {
    // Detailed logging for debugging
    console.log("renderModulePDF called with module:", {
      id: module?.id,
      title: module?.title,
      content_type: module?.content_type,
      has_pdf_binary: module?.has_pdf_binary,
      pdf_url: module?.pdf_url,
      pdf_file: module?.pdf_file
    });
    
    // Check if module has PDF content
    if (!module) {
      console.error("renderModulePDF: No module provided");
      return null;
    }
    
    // Check for database PDF (pdf_binary field)
    const hasDatabasePDF = module.has_pdf_binary;
    
    // Check for file-based PDF
    const hasFilePDF = module.pdf_url || module.pdf_file;
    
    // If no PDF content, return null
    if (!hasDatabasePDF && !hasFilePDF) {
      console.error("renderModulePDF: No PDF content available in module", module.id);
      return null;
    }
    
    console.log(`Module ${module.id} PDF source:`, hasDatabasePDF ? "Database" : "File system");
    
    const pdfUrl = module.pdf_url || module.pdf_file;
    
    return (
      <div className="mt-5">
        <h3 className="text-xl font-medium mb-3">Module Material</h3>
        {hasDatabasePDF ? 
          renderPDF(null, true, module.id) : 
          renderPDF(pdfUrl)
        }
      </div>
    );
  };

  const renderQuizModal = () => {
    if (!showQuizModal || !currentQuiz) return null;
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
          <div className="bg-blue-600 text-white p-5 border-b flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold">{currentQuiz.title}</h2>
              {!quizResult && <p className="text-blue-100 mt-1 text-sm">{currentQuiz.description}</p>}
            </div>
            <button 
              onClick={handleQuizClose} 
              className="text-white hover:text-blue-100 focus:outline-none"
              aria-label="Close"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          {quizResult ? (
            <div className="p-6">
              <div className={`text-center p-6 rounded-lg mb-6 ${
                quizResult.passed ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
              }`}>
                <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center bg-white border-2 border-current">
                  {quizResult.passed ? (
                    <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  )}
                </div>
                <h3 className="text-2xl font-bold mb-2 text-gray-900">
                  {quizResult.passed ? 'Congratulations!' : 'Quiz Not Passed'}
                </h3>
                <p className="text-lg font-medium">
                  Your score: {quizResult.score}% 
                </p>
                <p className="mt-1 text-gray-700">
                  {quizResult.correctAnswers} of {quizResult.totalQuestions} questions correct
                </p>
                <p className="mt-4 text-gray-700 italic">
                  {quizResult.passed 
                    ? 'You have successfully passed this quiz!' 
                    : 'Review the material and try again. You\'ll do better next time!'}
                </p>
              </div>
              
              <button
                className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                onClick={handleQuizClose}
              >
                Continue Learning
              </button>
            </div>
          ) : (
            <>
              <div className="p-6">
                {currentQuiz.questions.map((question, index) => (
                  <div key={question.id} className="mb-8 pb-6 border-b border-gray-200 last:border-0">
                    <h3 className="text-lg font-medium mb-4 flex">
                      <span className="text-blue-600 font-bold mr-2">{index + 1}.</span>
                      <span>{question.question}</span>
                    </h3>
                    <div className="space-y-3 ml-5">
                      {question.options.map((option, optionIndex) => (
                        <div key={optionIndex} className="flex items-start">
                          <div className="flex items-center h-6">
                            <input
                              type="radio"
                              id={`question-${question.id}-option-${optionIndex}`}
                              name={`question-${question.id}`}
                              className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                              checked={quizAnswers[question.id] === optionIndex}
                              onChange={() => setQuizAnswers({
                                ...quizAnswers,
                                [question.id]: optionIndex
                              })}
                            />
                          </div>
                          <label 
                            htmlFor={`question-${question.id}-option-${optionIndex}`}
                            className="ml-3 text-gray-700 cursor-pointer"
                          >
                            {option}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="p-6 border-t bg-gray-50 flex justify-between">
                <button
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                  onClick={() => setShowQuizModal(false)}
                >
                  Cancel
                </button>
                <button
                  className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                    Object.keys(quizAnswers).length === currentQuiz.questions.length
                      ? "bg-blue-600 text-white hover:bg-blue-700"
                      : "bg-gray-300 text-gray-500 cursor-not-allowed"
                  }`}
                  onClick={handleQuizSubmit}
                  disabled={Object.keys(quizAnswers).length !== currentQuiz.questions.length}
                >
                  Submit Quiz
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    );
  };

  // Debug information for current state
  console.log("Current render state:", {
    loading,
    error,
    courseLoaded: !!course,
    modulesCount: modules?.length || 0,
    currentModuleSet: !!currentModule,
    currentSectionSet: !!currentSection,
    currentSectionDetails: currentSection ? {
      id: currentSection.id,
      title: currentSection.title,
      content_type: currentSection.content_type,
      video_url: currentSection.video_url,
      pdf_url: currentSection.pdf_url
    } : 'No current section'
  });

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Header with course title and progress */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <div className="container mx-auto px-4 py-4 flex flex-wrap items-center justify-between">
          <div className="flex items-center">
            <button 
              onClick={() => navigate(`/courses/${courseId}`)}
              className="mr-4 text-gray-500 hover:text-gray-700"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>
            <h1 className="text-xl font-bold text-gray-800 truncate">{course?.title}</h1>
          </div>
          
          <div className="flex items-center mt-2 sm:mt-0">
            <div className="mr-4 text-sm text-gray-600">
              <span className="font-medium">{Math.round(overallProgress)}%</span> complete
            </div>
            <div className="w-48 bg-gray-200 rounded-full h-2.5">
              <div 
                className="bg-blue-600 h-2.5 rounded-full" 
                style={{ width: `${overallProgress}%` }}
              ></div>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <div className="container mx-auto px-4 py-6">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            <h3 className="font-medium">Error</h3>
            <p>{error}</p>
            <button 
              onClick={() => navigate(`/courses/${courseId}`)}
              className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Back to Course
            </button>
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Left sidebar: Modules and sections */}
            <div className="lg:w-1/4 bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden sticky top-24 self-start max-h-[calc(100vh-120px)] overflow-y-auto">
              <div className="p-4 border-b border-gray-200">
                <h2 className="font-bold text-lg">Course Content</h2>
                <div className="text-sm text-gray-600 mt-1">
                  {completedSections}/{totalSections} sections completed
                </div>
              </div>
              
              <div className="divide-y divide-gray-200">
                {modules.map((module) => (
                  <div key={module.id} className="module">
                    <button
                      className={`w-full text-left px-4 py-3 focus:outline-none transition ${
                        currentModule?.id === module.id ? 'bg-blue-50' : 'hover:bg-gray-50'
                      }`}
                      onClick={() => handleModuleClick(module)}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-gray-800">{module.title}</span>
                        <span className="text-xs px-2 py-1 bg-gray-100 rounded-full">
                          {module.sections?.filter(section => progress[section.id]).length || 0}/
                          {module.sections?.length || 0}
                        </span>
                      </div>
                    </button>
                    
                    {currentModule?.id === module.id && module.sections && (
                      <div className="pl-4 bg-gray-50">
                        {module.sections.map((section) => (
                          <button
                            key={section.id}
                            className={`w-full text-left px-4 py-3 border-l-2 focus:outline-none transition ${
                              currentSection?.id === section.id
                                ? 'border-blue-500 bg-blue-50 text-blue-700'
                                : progress[section.id]
                                ? 'border-green-500 text-green-700'
                                : 'border-gray-200 hover:bg-gray-100 text-gray-700'
                            }`}
                            onClick={() => handleSectionClick(section)}
                          >
                            <div className="flex items-start">
                              <span className="mr-2 mt-0.5">
                                {progress[section.id] ? (
                                  <svg className="h-4 w-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                  </svg>
                                ) : (
                                  <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                )}
                              </span>
                              <span className="text-sm">{section.title}</span>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
            
            {/* Right content area: Current section content and tabs */}
            <div className="lg:w-3/4">
              {currentSection ? (
                <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
                  <div className="border-b border-gray-200">
                    <div className="flex border-b border-gray-200">
                      <button
                        className={`px-4 py-3 font-medium text-sm focus:outline-none ${
                          activeTab === 'content'
                            ? 'text-blue-600 border-b-2 border-blue-600'
                            : 'text-gray-600 hover:text-gray-800'
                        }`}
                        onClick={() => setActiveTab('content')}
                      >
                        Content
                      </button>
                      <button
                        className={`px-4 py-3 font-medium text-sm focus:outline-none ${
                          activeTab === 'notes'
                            ? 'text-blue-600 border-b-2 border-blue-600'
                            : 'text-gray-600 hover:text-gray-800'
                        }`}
                        onClick={() => setActiveTab('notes')}
                      >
                        Notes
                      </button>
                    </div>
                  </div>
                  
                  <div className="p-6">
                    {activeTab === 'content' ? (
                      <div>
                        {console.log("Rendering content tab with section:", currentSection)}
                        <h3 className="text-xl font-semibold mb-4">{currentSection.title}</h3>
                        <div className="mb-4">
                          {currentSection.description ? (
                            <p>{currentSection.description}</p>
                          ) : (
                            <p className="text-gray-500 italic">No description provided for this section.</p>
                          )}
                        </div>
                        
                        {/* Display content based on type */}
                        {currentSection.content_type === 'video' && currentSection.video_url && (
                          <div className="mb-6">
                            {console.log("Rendering video content with URL:", currentSection.video_url)}
                            {renderYouTubeVideo(currentSection.video_url)}
                          </div>
                        )}
                        
                        {currentSection.content_type === 'pdf' && (
                          <div className="mb-6">
                            {console.log("Trying to render PDF content with:", {
                              url: currentSection.pdf_url,
                              hasPdfFile: currentSection.has_pdf_file
                            })}
                            {currentSection.pdf_url ? (
                              renderPDF(currentSection.pdf_url)
                            ) : (
                              <div className="p-6 bg-gray-100 rounded-lg text-center shadow">
                                <div className="mb-4">
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-red-600 mb-2" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-9.5 8.5h3v-1h-2v-1h2V8h-3V7h3.5c.55 0 1 .45 1 1v1.5c0 .55-.45 1-1 1h-2v1h3V13H8.5v-1.5zM12 17.5l.88-2.5h.76l.88 2.5h-1L13.3 17h-.6l-.22.5H12zm2.95-4.5h-1.5l-1.1 3h1.1l.2-.57h1.1l.2.57h1.1l-1.1-3zM14 16l.33-1 .33 1H14z"/>
                                  </svg>
                                  <p className="text-lg font-medium mb-2">No PDF Available</p>
                                  <p className="text-sm text-gray-600 mb-4">The PDF for this section could not be found.</p>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                        
                        {currentSection.content_type === 'both' && (
                          <div>
                            {currentSection.video_url && (
                              <div className="mb-6">
                                {console.log("Rendering video in 'both' mode with URL:", currentSection.video_url)}
                                {renderYouTubeVideo(currentSection.video_url)}
                              </div>
                            )}
                            {currentSection.pdf_url && (
                              <div className="mb-6">
                                {console.log("Rendering PDF in 'both' mode with URL:", currentSection.pdf_url)}
                                {renderPDF(currentSection.pdf_url)}
                              </div>
                            )}
                            {!currentSection.pdf_url && !currentSection.video_url && (
                              <div className="p-6 bg-gray-100 rounded-lg text-center">
                                <p className="text-gray-700">No content available for this section.</p>
                                {console.log("No content URLs available in 'both' mode")}
                              </div>
                            )}
                          </div>
                        )}
                        
                        {/* Display module-level PDF if available */}
                        {currentModule && (currentModule.content_type === 'pdf' || currentModule.pdf_url || currentModule.pdf_file || currentModule.has_pdf_binary) && (
                          <>
                            {console.log("Trying to render module PDF:", {
                              module_id: currentModule.id,
                              content_type: currentModule.content_type,
                              pdf_url: currentModule.pdf_url,
                              pdf_file: currentModule.pdf_file,
                              has_pdf_binary: currentModule.has_pdf_binary
                            })}
                            {renderModulePDF(currentModule)}
                          </>
                        )}
                        
                        {/* Mark complete button */}
                        <div className="mt-6 text-center">
                          <button
                            onClick={handleMarkComplete}
                            className={`px-6 py-2 rounded-lg font-medium ${
                              progress[currentSection.id]
                                ? 'bg-green-100 text-green-800 border border-green-300'
                                : 'bg-blue-600 text-white hover:bg-blue-700'
                            }`}
                          >
                            {progress[currentSection.id] ? 'Completed ✓' : 'Mark as Complete'}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <h2 className="text-xl font-bold text-gray-800">Notes for: {currentSection.title}</h2>
                          <div className="flex items-center text-sm">
                            {saveStatus === 'saving' && (
                              <span className="text-gray-500 flex items-center">
                                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Saving...
                              </span>
                            )}
                            {saveStatus === 'saved' && (
                              <span className="text-green-600 flex items-center">
                                <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                </svg>
                                Saved
                              </span>
                            )}
                          </div>
                        </div>
                        
                        <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
                          <p className="text-sm text-gray-600 mb-2">
                            <strong>Tip:</strong> Your notes are automatically saved as you type. They'll be available when you return to this section.
                          </p>
                        </div>
                        
                        <textarea
                          className="w-full border border-gray-300 rounded-lg p-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[300px] font-medium"
                          placeholder="Add your notes here..."
                          value={notes}
                          onChange={handleNotesChange}
                        ></textarea>
                        
                        <div className="mt-4 flex justify-end">
                          <button
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium flex items-center"
                            onClick={handleSaveNotes}
                          >
                            <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                            </svg>
                            Save Notes
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6 text-center">
                  <p className="text-gray-600">Select a section from the sidebar to start learning.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      
      {/* Quiz Modal */}
      {renderQuizModal()}
    </div>
  );
}

export default CourseLearning;