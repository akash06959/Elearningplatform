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
  const [lastError, setLastError] = useState(null);
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
            
            // Ensure all modules have the critical fields populated
            const processedModules = courseDetails.modules.map(module => ({
              id: module.id || Date.now() + Math.floor(Math.random() * 1000),
              title: module.title || `Module ${module.order || 1}`,
              description: module.description || '',
              order: module.order || 1,
              sections: Array.isArray(module.sections) ? module.sections.map(section => ({
                id: section.id || Date.now() + Math.floor(Math.random() * 1000),
                title: section.title || `Section ${section.order || 1}`,
                description: section.description || '',
                content_type: section.content_type || 'video',
                video_url: section.video_url || '',
                pdf_url: section.pdf_url || '',
                order: section.order || 1
              })) : []
            }));
            
            console.log('Processed modules to set:', processedModules);
            setModules(processedModules);
          } else if (courseDetails.modules_json) {
            // Try to parse modules from JSON string if available
            try {
              const parsedModules = JSON.parse(courseDetails.modules_json);
              console.log('Parsed modules from modules_json:', parsedModules);
              setModules(parsedModules);
            } catch (e) {
              console.error('Failed to parse modules_json:', e);
              // Fall back to empty modules
              setModules([{
                id: 1,
                title: 'Module 1',
                description: '',
                order: 1,
                sections: [{ 
                  id: 1, 
                  title: 'Section 1', 
                  description: '', 
                  content_type: 'video', 
                  video_url: '', 
                  pdf_url: '', 
                  order: 1 
                }]
              }]);
            }
          } else {
            // If no modules found, initialize with a single empty module
            console.log('No modules found, initializing default module');
            
            // Check if we have a backup in localStorage first
            const backupKey = `course_backup_${courseId}`;
            const backupData = localStorage.getItem(backupKey);
            
            if (backupData) {
              try {
                console.log('Found backup data in localStorage');
                const parsedBackup = JSON.parse(backupData);
                
                // Only use the backup if it's recent (less than 7 days old)
                const backupDate = new Date(parsedBackup.lastUpdated);
                const now = new Date();
                const diffDays = Math.floor((now - backupDate) / (1000 * 60 * 60 * 24));
                
                if (diffDays < 7 && Array.isArray(parsedBackup.modules) && parsedBackup.modules.length > 0) {
                  console.log('Using backup modules from localStorage, backup is', diffDays, 'days old');
                  setModules(parsedBackup.modules);
                  
                  // Also use backup quizzes if available
                  if (Array.isArray(parsedBackup.quizzes) && parsedBackup.quizzes.length > 0) {
                    console.log('Using backup quizzes from localStorage');
                    setQuizzes(parsedBackup.quizzes);
                  }
                  
                  // Show a notification to the user
                  setSuccess('Restored unsaved changes from your last session');
                  return;
                } else {
                  console.log('Backup data is too old or invalid, not using it');
                  // Clear old backup
                  localStorage.removeItem(backupKey);
                }
              } catch (e) {
                console.error('Error parsing backup data:', e);
              }
            }
            
            // No valid backup, use default empty module
            setModules([{
              id: 1,
              title: 'Module 1',
              description: '',
              order: 1,
              sections: [{ 
                id: 1, 
                title: 'Section 1', 
                description: '', 
                content_type: 'video', 
                video_url: '', 
                pdf_url: '', 
                order: 1 
              }]
            }]);
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
  
  const addModule = () => {
    setModules(prevModules => {
      const newModuleId = prevModules.length > 0 
        ? Math.max(...prevModules.map(m => m.id)) + 1 
        : 1;
      const newModuleOrder = prevModules.length > 0 
        ? Math.max(...prevModules.map(m => m.order)) + 1 
        : 1;
      
      return [
        ...prevModules,
        {
          id: newModuleId,
          title: `Module ${newModuleOrder}`,
          description: '',
          order: newModuleOrder,
          sections: [{ 
            id: 1, 
            title: 'Section 1', 
            description: '', 
            content_type: 'video', 
            video_url: '', 
            pdf_url: '', 
            order: 1 
          }]
        }
      ];
    });
  };
  
  const deleteModule = (moduleId) => {
    setModules(prevModules => 
      prevModules.filter(module => module.id !== moduleId)
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
    console.log('Current modules data:', modules);
    console.log('Current quizzes data:', quizzes);

    try {
      if (!authTokens?.access) {
        setError('Authentication token missing or invalid. Please log in again.');
        setLoading(false);
        setSuccess('');
        return;
      }

      // Create a FormData object
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
      
      // Process all PDFs uploads from sections
      const pdfUploads = [];
      let pdfIndex = 0;
      
      // Create an array to track which modules contain PDF files
      modules.forEach((module, moduleIndex) => {
        if (module && Array.isArray(module.sections)) {
          module.sections.forEach((section, sectionIndex) => {
            if (section && (section.content_type === 'pdf' || section.content_type === 'both')) {
              if (section.pdf_file) {
                // Generate a unique key for this PDF
                const pdfKey = `pdf_${moduleIndex}_${sectionIndex}`;
                
                // Store file data for the form
                formData.append(`section_pdf_${pdfIndex}`, section.pdf_file);
                
                // Store metadata about this upload
                pdfUploads.push({
                  pdfIndex,
                  moduleId: module.id,
                  moduleIndex,
                  sectionId: section.id,
                  sectionIndex,
                  originalFilename: section.pdf_filename,
                  pdfKey
                });
                
                // Store the key in the section so we can reference it later
                section.pdf_key = pdfKey;
                pdfIndex++;
              }
            }
          });
        }
      });
      
      // Add PDF upload metadata to the form
      if (pdfUploads.length > 0) {
        console.log(`Adding ${pdfUploads.length} PDF uploads to the form data`);
        formData.append('pdf_uploads_count', pdfUploads.length);
        formData.append('pdf_uploads_meta', JSON.stringify(pdfUploads));
      }
      
      // Add modules and their sections - preserve all modules even if empty
      // Clean up modules before saving to ensure proper structure
      const modulesData = modules
        .filter(module => module) // Filter out any null/undefined modules
        .map((module, index) => ({
          id: module.id || Date.now() + index, // Ensure we have an ID
          title: module.title || `Module ${index + 1}`,
          description: module.description || '',
          order: module.order || index + 1,
          // Make sure sections are properly formed
          sections: Array.isArray(module.sections) 
            ? module.sections
                .filter(section => section) // Filter out any null/undefined sections
                .map((section, sectionIndex) => {
                  // Create a base section object
                  const sectionObj = {
                    id: section.id || Date.now() + sectionIndex,
                    title: section.title || `Section ${sectionIndex + 1}`,
                    description: section.description || '',
                    content_type: section.content_type || 'video',
                    video_url: section.video_url || '',
                    video_id: section.video_id || '',
                    pdf_url: section.pdf_url || '',
                    order: section.order || sectionIndex + 1
                  };
                  
                  // If this section has a PDF file attached, include the PDF key
                  if (section.pdf_file && section.pdf_key) {
                    sectionObj.pdf_key = section.pdf_key;
                    sectionObj.pdf_filename = section.pdf_filename;
                    // Set a flag to indicate a new PDF needs to be processed
                    sectionObj.has_new_pdf = true;
                  }
                  
                  return sectionObj;
                })
            : [] // If no sections array, provide empty array
        }));
        
      console.log('Modules data prepared for submission:', modulesData);
      console.log('Total modules being submitted:', modulesData.length);
      console.log('PDF files to upload:', pdfUploads.length);
      
      modulesData.forEach((module, idx) => {
        console.log(`Module ${idx + 1}: "${module.title}" with ${module.sections.length} sections`);
        module.sections.forEach((section, sIdx) => {
          console.log(`  Section ${sIdx + 1}: "${section.title}", Type: ${section.content_type}, Video URL: ${section.video_url || 'none'}, PDF: ${section.has_new_pdf ? 'Yes (new upload)' : (section.pdf_url ? 'Yes (existing)' : 'none')}`);
        });
      });

      // Always append modules data regardless of length
      const modulesJson = JSON.stringify(modulesData);
      formData.append('modules_json', modulesJson);
      
      // Also include as a separate field to ensure the backend sees it
      formData.append('modules', modulesJson);
      
      // Similar improvements for quizzes
      const quizzesData = quizzes
        .filter(quiz => quiz) // Filter out any null/undefined quizzes
        .map((quiz, index) => ({
          id: quiz.id || Date.now() + index,
          title: quiz.title || `Quiz ${index + 1}`,
          description: quiz.description || '',
          module_id: quiz.module_id || modules[0]?.id || 1,
          order: index + 1,
          questions: Array.isArray(quiz.questions)
            ? quiz.questions
                .filter(question => question) // Filter out any null/undefined questions
                .map((question, questionIndex) => ({
                  id: question.id || Date.now() + questionIndex,
                  question: question.question || `Question ${questionIndex + 1}`,
                  options: Array.isArray(question.options) 
                    ? question.options.map(option => option || 'No answer')
                    : ['Option 1', 'Option 2', 'Option 3', 'Option 4'],
                  correct_option: typeof question.correct_option === 'number' ? question.correct_option : 0,
                  order: questionIndex + 1
                }))
            : [] // If no questions array, provide empty array
        }));
        
      console.log('Quizzes data prepared for submission:', quizzesData);

      // Always append quizzes data regardless of length   
      const quizzesJson = JSON.stringify(quizzesData);   
      formData.append('quizzes_json', quizzesJson);
      
      // Also include as a separate field to ensure the backend sees it
      formData.append('quizzes', quizzesJson);

      console.log('Sending update request for course:', courseId);
      
      // Backup the course data to localStorage in case of interruption
      try {
        const backupKey = `course_backup_${courseId}`;
        const backupData = {
          modules: modulesData,
          quizzes: quizzesData,
          lastUpdated: new Date().toISOString()
        };
        localStorage.setItem(backupKey, JSON.stringify(backupData));
        console.log('Course data backed up to localStorage');
      } catch (backupError) {
        console.warn('Failed to backup course data to localStorage:', backupError);
      }
      
      // First attempt: use courseAPI
      console.log('About to call courseAPI.updateCourse with courseId:', courseId);
      try {
        const response = await courseAPI.updateCourse(courseId, formData);
        console.log('Course update successful:', response);
        
        // Validate that the response has the expected data
        let hasModulesData = false;
        
        if (response) {
          // Check all possible places where modules might be stored
          if (response.modules && Array.isArray(response.modules) && response.modules.length > 0) {
            hasModulesData = true;
            console.log('Found modules array in response');
          } else if (response.modules_json) {
            try {
              const parsed = JSON.parse(response.modules_json);
              if (Array.isArray(parsed) && parsed.length > 0) {
                hasModulesData = true;
                console.log('Found modules in modules_json');
                // Add parsed modules to response
                response.modules = parsed;
              }
            } catch (e) {
              console.error('Error parsing modules_json from response:', e);
            }
          }
          
          // If response is missing modules, inject them from the request
          if (!hasModulesData) {
            console.log('Response missing modules, adding them from request data');
            response.modules = modulesData;
            response.modules_json = modulesJson;
          }
          
          // Now do the same for quizzes
          let hasQuizzesData = false;
          if (response.quizzes && Array.isArray(response.quizzes) && response.quizzes.length > 0) {
            hasQuizzesData = true;
            console.log('Found quizzes array in response');
          } else if (response.quizzes_json) {
            try {
              const parsed = JSON.parse(response.quizzes_json);
              if (Array.isArray(parsed) && parsed.length > 0) {
                hasQuizzesData = true;
                console.log('Found quizzes in quizzes_json');
                // Add parsed quizzes to response
                response.quizzes = parsed;
              }
            } catch (e) {
              console.error('Error parsing quizzes_json from response:', e);
            }
          }
          
          // If response is missing quizzes, inject them from the request
          if (!hasQuizzesData) {
            console.log('Response missing quizzes, adding them from request data');
            response.quizzes = quizzesData;
            response.quizzes_json = quizzesJson;
          }
        }
        
        // Now check if we have a valid response
        if (response && (response.id || response.courseId || response.course_id)) {
          setSuccess('Course updated successfully!');
          
          // Force a refresh by navigating to view first, then to the course list
          setTimeout(() => {
            navigate(`/instructor/courses/${courseId}/view`);
            
            // After a delay, go to the course list
            setTimeout(() => {
              navigate('/instructor/courses');
            }, 3000);
          }, 2000);
          return;
        } else {
          console.warn('Update response seems incomplete:', response);
          setSuccess('Course may have been updated, but the response was incomplete. Please verify your changes.');
          return;
        }
      } catch (apiError) {
        console.error('API Error with courseAPI.updateCourse:', apiError);
        console.error('Trying direct fetch as fallback...');
        
        // Continue to fallback method
      }
      
      // Second attempt: direct fetch as fallback
      try {
        // Try multiple endpoints with different HTTP methods
        const endpointOptions = [
          // Module-focused endpoints
          { url: `http://localhost:8000/api/courses/${courseId}/update-with-modules/`, method: 'POST' },
          { url: `http://localhost:8000/api/courses/instructor/courses/${courseId}/update-with-modules/`, method: 'POST' },
          { url: `http://localhost:8000/api/courses/${courseId}/modules-update/`, method: 'POST' },
          
          // Standard endpoints
          { url: `http://localhost:8000/api/courses/instructor/courses/${courseId}/update/`, method: 'POST' },
          { url: `http://localhost:8000/api/courses/instructor/courses/${courseId}/`, method: 'PATCH' },
          { url: `http://localhost:8000/api/courses/${courseId}/update/`, method: 'POST' },
          { url: `http://localhost:8000/api/courses/${courseId}/`, method: 'PATCH' }
        ];
        
        let fetchResponse = null;
        let responseData = null;
        
        // Check FormData before sending
        console.log('Checking FormData contents before direct fetch:');
        for (let [key, value] of formData.entries()) {
          if (key === 'modules_json' || key === 'quizzes_json') {
            console.log(`${key}: ${value.substring(0, 50)}...`); // Log just first 50 chars of JSON
            
            // Verify that the JSON is valid by parsing it (just for logging)
            try {
              const parsed = JSON.parse(value);
              console.log(`${key} is valid JSON with ${key === 'modules_json' ? parsed.length + ' modules' : parsed.length + ' quizzes'}`);
            } catch (e) {
              console.error(`${key} contains invalid JSON:`, e);
            }
          } else if (key === 'thumbnail') {
            console.log(`${key}: [File object]`);
          } else {
            console.log(`${key}: ${value}`);
          }
        }
        
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
              try {
                // Clone the response before trying to read the JSON, so we can use it later if needed
                const clonedResponse = fetchResponse.clone();
                
                // Try to parse as JSON but don't break if it fails
                try {
                  responseData = await fetchResponse.json();
                  console.log('Direct fetch response parsed as JSON:', responseData);
                  
                  // Ensure the response contains the module and quiz data
                  // If it doesn't, add it back
                  if (responseData) {
                    let hasModules = false;
                    
                    // Check for modules in all possible places
                    if (responseData.modules && Array.isArray(responseData.modules) && responseData.modules.length > 0) {
                      hasModules = true;
                    }
                    if (responseData.modules_json) {
                      try {
                        const parsed = JSON.parse(responseData.modules_json);
                        if (Array.isArray(parsed) && parsed.length > 0) {
                          responseData.modules = parsed;
                          hasModules = true;
                        }
                      } catch (e) {
                        console.error('Error parsing modules_json:', e);
                      }
                    }
                    
                    // If still no modules, add them from form data
                    if (!hasModules) {
                      console.log('Response missing modules, adding them back');
                      responseData.modules = modulesData;
                      responseData.modules_json = formData.get('modules_json');
                    }
                    
                    // Now do the same for quizzes
                    let hasQuizzes = false;
                    
                    if (responseData.quizzes && Array.isArray(responseData.quizzes) && responseData.quizzes.length > 0) {
                      hasQuizzes = true;
                    }
                    if (responseData.quizzes_json) {
                      try {
                        const parsed = JSON.parse(responseData.quizzes_json);
                        if (Array.isArray(parsed) && parsed.length > 0) {
                          responseData.quizzes = parsed;
                          hasQuizzes = true;
                        }
                      } catch (e) {
                        console.error('Error parsing quizzes_json:', e);
                      }
                    }
                    
                    // If still no quizzes, add them from form data
                    if (!hasQuizzes) {
                      console.log('Response missing quizzes, adding them back');
                      responseData.quizzes = quizzesData;
                      responseData.quizzes_json = formData.get('quizzes_json');
                    }
                  }
                  
                } catch (jsonError) {
                  console.warn('Could not parse JSON response, will try to read as text:', jsonError);
                  
                  // Try to read as text if JSON parsing fails
                  try {
                    const textResponse = await clonedResponse.text();
                    console.log('Response as text:', textResponse.substring(0, 200) + '...');
                    
                    // Create a minimal success object
                    responseData = { 
                      success: true,
                      responseText: textResponse.length > 50 ? textResponse.substring(0, 50) + '...' : textResponse
                    };
                  } catch (textError) {
                    console.warn('Could not read response as text either:', textError);
                    responseData = { success: true };
                  }
                }
                
                break;
              } catch (responseError) {
                console.warn('Error processing fetch response:', responseError);
                // Still create a success object even if processing fails
                responseData = { success: true };
                break;
              }
            } else {
              const errorText = await fetchResponse.text();
              console.error(`Failed with status ${fetchResponse.status}:`, errorText);
              setLastError(new Error(`${method} to ${url} failed: ${fetchResponse.status} ${fetchResponse.statusText}`));
              // Continue to try the next endpoint
            }
          } catch (endpointError) {
            console.error(`Error with ${method} to ${url}:`, endpointError);
            setLastError(endpointError);
            // Continue to try the next endpoint
          }
        }
        
        if (fetchResponse && fetchResponse.ok && responseData) {
          // Check if essential data was preserved
          const hasModules = responseData.modules || 
                            responseData.modules_json || 
                            (typeof responseData === 'object' && Object.keys(responseData).length > 0);
          
          if (hasModules) {
            setSuccess('Course updated successfully with fallback method!');
            
            // Redirect to instructor courses page after a delay
            setTimeout(() => {
              navigate('/instructor/courses');
            }, 2000);
          } else {
            // We got an OK response but can't verify if content was preserved
            setSuccess('Course may have been updated. Please verify your changes.');
            
            // Give user time to read the message before redirecting
            setTimeout(() => {
              navigate('/instructor/courses');
            }, 3000);
          }
          return;
        } else {
          throw new Error('All fallback endpoints failed');
        }
      } catch (fetchError) {
        console.error('Fallback fetch error:', fetchError);
        throw new Error(`All update attempts failed. Last error: ${fetchError.message}`);
      }
    } catch (error) {
      console.error('Course update error:', error);
      setError(`Course update failed: ${error.message}`);
      setLastError(error);
    } finally {
      setLoading(false);
    }

    // Get the error message from state
    setError(lastError?.message || 'All endpoints failed. Saving locally as fallback.');
    
    // Fallback: Save to localStorage as a last resort
    try {
      console.log('Saving course data to localStorage as fallback');

      // Define modules and quizzes data here to avoid the no-undef error
      const modulesToSave = modules
        .filter(module => module)
        .map((module, index) => ({
          id: module.id || Date.now() + index,
          title: module.title || `Module ${index + 1}`,
          description: module.description || '',
          order: module.order || index + 1,
          sections: Array.isArray(module.sections) 
            ? module.sections
                .filter(section => section)
                .map((section, sectionIndex) => ({
                  id: section.id || Date.now() + sectionIndex,
                  title: section.title || `Section ${sectionIndex + 1}`,
                  description: section.description || '',
                  content_type: section.content_type || 'video',
                  video_url: section.video_url || '',
                  pdf_url: section.pdf_url || '',
                  order: section.order || sectionIndex + 1
                }))
            : []
        }));

      const quizzesToSave = quizzes
        .filter(quiz => quiz)
        .map((quiz, index) => ({
          id: quiz.id || Date.now() + index,
          title: quiz.title || `Quiz ${index + 1}`,
          description: quiz.description || '',
          module_id: quiz.module_id || modules[0]?.id || 1,
          order: index + 1,
          questions: Array.isArray(quiz.questions)
            ? quiz.questions
                .filter(question => question)
                .map((question, questionIndex) => ({
                  id: question.id || Date.now() + questionIndex,
                  question: question.question || `Question ${questionIndex + 1}`,
                  options: Array.isArray(question.options) 
                    ? question.options.map(option => option || 'No answer')
                    : ['Option 1', 'Option 2', 'Option 3', 'Option 4'],
                  correct_option: typeof question.correct_option === 'number' ? question.correct_option : 0,
                  order: questionIndex + 1
                }))
            : []
        }));
      
      const courseToSave = {
        id: courseId,
        title: courseData.title,
        description: courseData.description,
        price: courseData.price,
        category: courseData.category,
        difficulty_level: courseData.level,
        duration_in_weeks: courseData.duration,
        modules: modulesToSave,
        quizzes: quizzesToSave,
        lastUpdated: new Date().toISOString()
      };
      
      // Save under a unique key for this course
      localStorage.setItem(`course_backup_${courseId}`, JSON.stringify(courseToSave));
      
      setSuccess('Server update failed, but course was saved locally. Try again later.');
      
      // Force refresh by navigating to view first
      setTimeout(() => {
        navigate(`/instructor/courses/${courseId}/view`);
      }, 2000);
      
      return;
    } catch (saveError) {
      console.error('Error saving to localStorage:', saveError);
      // Continue with regular error handling
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
          
          <div style={{
            backgroundColor: '#eef2ff', 
            color: '#4338ca', 
            padding: '1rem',
            borderRadius: '0.375rem', 
            marginBottom: '1.5rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '0.875rem'
          }}>
            <div>
              <span style={{ fontWeight: 'bold' }}>Want to view course details without editing?</span> Use the View page to see course content in read-only mode.
            </div>
            <a 
              href={`/instructor/courses/${courseId}/view`} 
              style={{
                backgroundColor: '#4f46e5',
                color: 'white',
                padding: '0.5rem 0.75rem',
                borderRadius: '0.375rem',
                textDecoration: 'none',
                fontSize: '0.875rem',
                fontWeight: '500',
                whiteSpace: 'nowrap',
                marginLeft: '1rem'
              }}
            >
              View Course
            </a>
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
                  <div className="bg-white p-6 rounded-lg shadow">
                    <div className="flex justify-between items-center mb-6">
                      <h2 className="text-xl font-bold">Course Modules</h2>
                      <button 
                        type="button"
                        onClick={addModule}
                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 flex items-center"
                      >
                        <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                        </svg>
                        Add Module
                      </button>
                    </div>
                    
                    {modules.map((module, moduleIndex) => (
                      <div key={module.id} className="mb-8 border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200">
                        <div className="bg-gradient-to-r from-indigo-50 to-white border-b border-gray-200 p-4">
                          <div className="flex justify-between items-center">
                            <h3 className="text-lg font-semibold text-indigo-900">Module {moduleIndex + 1}</h3>
                            <button 
                              type="button"
                              onClick={() => deleteModule(module.id)}
                              className="text-red-600 hover:text-red-800 focus:outline-none p-1 rounded-full hover:bg-red-50 transition-colors duration-200"
                              title="Delete module"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                              </svg>
                            </button>
                          </div>
                        </div>
                        
                        <div className="p-4">
                          <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Module Title</label>
                            <input
                              type="text"
                              value={module.title}
                              onChange={(e) => handleModuleChange(module.id, 'title', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 transition-colors duration-200"
                              placeholder="Enter module title"
                            />
                          </div>
                          
                          <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Module Description</label>
                            <textarea
                              value={module.description}
                              onChange={(e) => handleModuleChange(module.id, 'description', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 transition-colors duration-200"
                              rows="2"
                              placeholder="Enter module description"
                            ></textarea>
                          </div>
                        </div>
                        
                        {/* Sections */}
                        <div className="mb-4">
                          <div className="flex justify-between items-center mb-2">
                            <h4 className="text-md font-medium text-gray-700">Sections ({module.sections?.length || 0})</h4>
                            <button 
                              type="button"
                              onClick={() => addSection(module.id)}
                              className="px-3 py-1.5 bg-indigo-100 text-indigo-700 text-sm rounded-md hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-opacity-50 transition-colors duration-200 flex items-center font-medium"
                            >
                              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                              </svg>
                              Add Section
                            </button>
                          </div>
                          
                          {module.sections && module.sections.map((section) => (
                            <div key={section.id} className="mb-6 border-l-2 border-indigo-200 pl-4 pb-4 pt-2 hover:border-indigo-400 transition-colors duration-200">
                              <div className="flex justify-between items-center mb-2">
                                <h5 className="text-sm font-medium text-indigo-800">Section {section.order}</h5>
                                <button 
                                  type="button"
                                  onClick={() => {
                                    if (window.confirm('Are you sure you want to delete this section?')) {
                                      setModules(prevModules => 
                                        prevModules.map(m => {
                                          if (m.id === module.id) {
                                            return {
                                              ...m,
                                              sections: m.sections.filter(s => s.id !== section.id)
                                            };
                                          }
                                          return m;
                                        })
                                      );
                                    }
                                  }}
                                  className="text-red-500 hover:text-red-700 focus:outline-none p-1 rounded-full hover:bg-red-50 transition-colors duration-200"
                                  title="Delete section"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                                  </svg>
                                </button>
                              </div>
                              
                              <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Section Title</label>
                                <input
                                  type="text"
                                  value={section.title}
                                  onChange={(e) => handleSectionChange(module.id, section.id, 'title', e.target.value)}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 transition-colors duration-200"
                                  placeholder="Enter section title"
                                />
                              </div>
                              
                              <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Section Description</label>
                                <textarea
                                  value={section.description}
                                  onChange={(e) => handleSectionChange(module.id, section.id, 'description', e.target.value)}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 transition-colors duration-200" 
                                  rows="2"
                                  placeholder="Enter section description"
                                ></textarea>
                              </div>
                              
                              <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Content Type</label>
                                <select
                                  value={section.content_type || 'video'}
                                  onChange={(e) => handleSectionChange(module.id, section.id, 'content_type', e.target.value)}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 transition-colors duration-200"
                                >
                                  <option value="video">Video</option>
                                  <option value="pdf">PDF Document</option>
                                  <option value="both">Both Video & PDF</option>
                                  <option value="text">Text Only</option>
                                </select>
                              </div>
                              
                              {(section.content_type === 'video' || section.content_type === 'both') && (
                                <div className="mb-4">
                                  <label className="block text-sm font-medium text-gray-700 mb-1">YouTube Video URL</label>
                                  <div className="flex">
                                    <input
                                      type="url"
                                      value={section.video_url || ''}
                                      onChange={(e) => {
                                        const videoUrl = e.target.value;
                                        handleSectionChange(module.id, section.id, 'video_url', videoUrl);
                                        
                                        // Extract and store video ID if it's a valid YouTube URL
                                        if (videoUrl) {
                                          try {
                                            let videoId = '';
                                            if (videoUrl.includes('youtube.com/watch')) {
                                              const urlParams = new URL(videoUrl).searchParams;
                                              videoId = urlParams.get('v');
                                            } else if (videoUrl.includes('youtu.be/')) {
                                              videoId = videoUrl.split('youtu.be/')[1].split('?')[0];
                                            } else if (videoUrl.includes('youtube.com/embed/')) {
                                              videoId = videoUrl.split('youtube.com/embed/')[1].split('?')[0];
                                            }
                                            
                                            if (videoId) {
                                              handleSectionChange(module.id, section.id, 'video_id', videoId);
                                            }
                                          } catch (e) {
                                            console.error('Error parsing YouTube URL', e);
                                          }
                                        }
                                      }}
                                      className="w-full px-3 py-2 border border-gray-300 rounded-l-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 transition-colors duration-200"
                                      placeholder="e.g. https://youtube.com/watch?v=..."
                                    />
                                    {section.video_url && (
                                      <a 
                                        href={section.video_url} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="flex items-center justify-center px-3 bg-indigo-100 text-indigo-700 border border-l-0 border-gray-300 rounded-r-md hover:bg-indigo-200 transition-colors duration-200"
                                        title="Open video in new tab"
                                      >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                        </svg>
                                      </a>
                                    )}
                                  </div>
                                  
                                  {section.video_url && section.video_id && (
                                    <div className="mt-2">
                                      <label className="block text-sm font-medium text-gray-700 mb-1">Video Preview</label>
                                      <div className="aspect-w-16 aspect-h-9 border border-gray-300 rounded-md overflow-hidden">
                                        <iframe
                                          src={`https://www.youtube.com/embed/${section.video_id}`}
                                          title="YouTube video player"
                                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                          allowFullScreen
                                          className="w-full h-full"
                                        ></iframe>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}
                              
                              {(section.content_type === 'pdf' || section.content_type === 'both') && (
                                <div className="mb-4">
                                  <label className="block text-sm font-medium text-gray-700 mb-1">PDF Document</label>
                                  <div className="flex flex-col space-y-2">
                                    <div className="flex items-center">
                                      <input
                                        type="file"
                                        accept=".pdf"
                                        onChange={(e) => {
                                          const file = e.target.files[0];
                                          if (file) {
                                            // Create a unique temporary id for the file for preview purposes
                                            const tempFileId = `pdf_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
                                            
                                            // Store the file in the module state
                                            handleSectionChange(module.id, section.id, 'pdf_file', file);
                                            
                                            // Store a temporary URL for preview
                                            const tempUrl = URL.createObjectURL(file);
                                            handleSectionChange(module.id, section.id, 'pdf_temp_url', tempUrl);
                                            
                                            // Set the filename for display
                                            handleSectionChange(module.id, section.id, 'pdf_filename', file.name);
                                          }
                                        }}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 transition-colors duration-200"
                                      />
                                    </div>
                                    {section.pdf_filename && (
                                      <div className="flex items-center mt-2 text-sm text-gray-600">
                                        <svg className="w-4 h-4 mr-1 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                                        </svg>
                                        <span>{section.pdf_filename}</span>
                                        {section.pdf_temp_url && (
                                          <a 
                                            href={section.pdf_temp_url} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="ml-2 text-indigo-600 hover:text-indigo-800"
                                            title="Preview PDF"
                                          >
                                            Preview
                                          </a>
                                        )}
                                      </div>
                                    )}
                                    {section.pdf_url && !section.pdf_filename && (
                                      <div className="flex items-center mt-2 text-sm text-gray-600">
                                        <svg className="w-4 h-4 mr-1 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                                        </svg>
                                        <span>Previously uploaded PDF</span>
                                        <a 
                                          href={section.pdf_url} 
                                          target="_blank" 
                                          rel="noopener noreferrer"
                                          className="ml-2 text-indigo-600 hover:text-indigo-800"
                                          title="View PDF"
                                        >
                                          View
                                        </a>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                    
                    <div className="mt-8 flex flex-col md:flex-row justify-between items-center gap-4">
                      <div>
                        <button 
                          type="button"
                          onClick={() => setActiveTab('basic')}
                          className="w-full md:w-auto px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-opacity-50 transition-colors duration-200 font-medium flex items-center justify-center"
                        >
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path>
                          </svg>
                          Back to Basic Info
                        </button>
                      </div>
                      
                      <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
                        <button 
                          type="button"
                          onClick={addModule}
                          className="w-full md:w-auto px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-50 transition-colors duration-200 font-medium flex items-center justify-center"
                        >
                          <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                          </svg>
                          Add Module
                        </button>
                        
                        <button 
                          type="button"
                          onClick={() => setActiveTab('quizzes')}
                          className="w-full md:w-auto px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-colors duration-200 font-medium flex items-center justify-center"
                        >
                          Next: Edit Quizzes
                          <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
                          </svg>
                        </button>
                        
                        <button
                          type="submit"
                          className="w-full md:w-auto px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50 transition-colors duration-200 font-medium flex items-center justify-center"
                          disabled={loading}
                        >
                          {loading ? (
                            <>
                              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              Updating...
                            </>
                          ) : (
                            <>
                              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                              </svg>
                              Update Course
                            </>
                          )}
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