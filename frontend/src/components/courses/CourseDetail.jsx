import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { courseAPI } from '../../services/api';
import { toast } from 'react-hot-toast';
import PaymentModal from '../payment/PaymentModal';
import { useAuth } from '../../context/AuthContext';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Text,
  useDisclosure,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  ModalCloseButton,
  Spinner,
} from '@chakra-ui/react';

function CourseDetail() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEnrolled, setIsEnrolled] = useState(false);
  // eslint-disable-next-line no-unused-vars
  const [enrolling, setEnrolling] = useState(false);
  const [showEnrollmentModal, setShowEnrollmentModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  // eslint-disable-next-line no-unused-vars
  const defaultImageUrl = 'https://placehold.co/1200x400';
  // eslint-disable-next-line no-unused-vars
  const BASE_URL = process.env.REACT_APP_BASE_URL || 'http://localhost:8000';
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [cancelLoading, setCancelLoading] = useState(false);

  // Fetch course and enrollment status
  const fetchCourseAndEnrollment = async () => {
    try {
      setLoading(true);
      
      // First, reset enrollment state to ensure stale state doesn't persist
      setIsEnrolled(false);
      
      // Get course details
      const courseData = await courseAPI.getCourseById(courseId);
      
      // Get enrollment status specifically for this course
      const enrollmentStatus = await courseAPI.checkEnrollmentStatus(courseId);
      console.log('Enrollment status from API:', enrollmentStatus);
      
      // Make sure we're checking the right course
      const isUserEnrolled = 
        (enrollmentStatus.courseId === courseId && enrollmentStatus.is_enrolled) || 
        courseData.is_enrolled || 
        courseData.enrolled;
      
      console.log('Setting enrollment state:', {
        fromAPI: enrollmentStatus.is_enrolled,
        fromCourseData: courseData.is_enrolled || courseData.enrolled,
        final: isUserEnrolled
      });
      
      // Update course data with enrollment status
      setCourse({
        ...courseData,
        is_enrolled: isUserEnrolled,
        enrolled: isUserEnrolled
      });
      
      // Update enrollment state
      setIsEnrolled(isUserEnrolled);
    } catch (error) {
      console.error('Error fetching course data:', error);
      setError('Failed to load course details. Please try again later.');
      
      // Reset enrollment state on error
      setIsEnrolled(false);
      setCourse(prev => prev ? {...prev, is_enrolled: false, enrolled: false} : null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (courseId) {
      fetchCourseAndEnrollment();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId]);

  // Add a function to refresh enrollment status
  // eslint-disable-next-line no-unused-vars
  const refreshEnrollmentStatus = async () => {
    try {
      const status = await courseAPI.checkEnrollmentStatus(courseId);
      console.log('Refreshed enrollment status:', status);
      
      if (status.status === 'success') {
        setIsEnrolled(status.is_enrolled);
        return status.is_enrolled;
      } else {
        console.warn('Could not verify enrollment status:', status.message);
        return false;
      }
    } catch (err) {
      console.error('Error checking enrollment:', err);
      return false;
    }
  };

  // Enroll in course
  const handleEnrollClick = async () => {
    if (!user) {
      toast({
        title: "You need to be logged in",
        description: "Please log in to enroll in this course",
        status: "warning",
        duration: 5000,
        isClosable: true,
      });
      navigate("/login", { state: { from: `/courses/${courseId}` } });
      return;
    }

    // If already enrolled, navigate to the course content
    if (isEnrolled) {
      window.location.href = `/courses/${courseId}/learn`;
      return;
    }

    setShowEnrollmentModal(true);
  };

  // Handle payment success
  const handlePaymentSuccess = async () => {
    try {
      // Close payment modal first
      setShowPaymentModal(false);
      
      // Show loading toast
      const loadingToast = toast.loading('Processing enrollment...');
      
      // Try to enroll in the course - allow up to 3 attempts
      let enrollResponse = null;
      let enrollAttempts = 0;
      const maxAttempts = 3;
      
      while (enrollAttempts < maxAttempts) {
        enrollAttempts++;
        console.log(`Enrollment attempt ${enrollAttempts}/${maxAttempts}`);
        
        try {
          // Enroll in this specific course
          enrollResponse = await courseAPI.enrollInCourse(courseId);
          console.log('Enrollment response:', enrollResponse);
          
          // If successful, break out of the retry loop
          if (enrollResponse.success) {
            break;
          }
          
          // If server error, wait a moment and retry
          if (enrollResponse.serverError) {
            console.log('Server error, waiting before retrying...');
            await new Promise(resolve => setTimeout(resolve, 1000));
            continue;
          }
          
          // For other errors, don't retry
          break;
          
        } catch (enrollError) {
          console.error(`Enrollment attempt ${enrollAttempts} failed:`, enrollError);
          // Wait before retrying
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
      
      // Dismiss loading toast
      toast.dismiss(loadingToast);
      
      // Check enrollment status directly - the API might have actually enrolled the user
      // even if it returned an error
      console.log('Checking enrollment status after payment...');
      const enrollmentStatus = await courseAPI.checkEnrollmentStatus(courseId);
      console.log('Post-payment enrollment status:', enrollmentStatus);
      
      const actuallyEnrolled = enrollmentStatus.isEnrolled || 
                              (enrollResponse && enrollResponse.success);
      
      if (actuallyEnrolled) {
        // User is enrolled - either the API call succeeded or the status check shows they're enrolled
        // Show success toast
        toast.success(
          enrollResponse?.success 
            ? (enrollResponse.message || 'Successfully enrolled in course!') 
            : 'You have been enrolled in the course!'
        );
        
        // Update local state immediately for THIS course
        setIsEnrolled(true);
        setCourse(prevCourse => ({
          ...prevCourse,
          is_enrolled: true,
          enrolled: true
        }));

        // Close all modals
        setShowEnrollmentModal(false);
        
        // Refresh the course data
        try {
          const courseData = await courseAPI.getCourseById(courseId);
          
          if (courseData && courseData.id === parseInt(courseId)) {
            setCourse(prevCourse => ({
              ...courseData,
              is_enrolled: true,
              enrolled: true
            }));
          }
        } catch (refreshError) {
          console.error('Error refreshing course data:', refreshError);
          // Even if refresh fails, we keep the enrolled state
        }
        
        // Redirect to learning page after successful enrollment
        setTimeout(() => {
          console.log('Redirecting to course learning page...');
          window.location.href = `/courses/${courseId}/learn`;
        }, 1500);
        
        return; // Exit early on success
      }
      
      // If we get here, the user is not enrolled
      if (enrollResponse && !enrollResponse.success) {
        throw new Error(enrollResponse.message || 'Failed to complete enrollment');
      } else {
        throw new Error('Failed to complete enrollment after multiple attempts');
      }
      
    } catch (error) {
      console.error('Error in payment/enrollment process:', error);
      
      // Check if the error message indicates already enrolled
      if (error.message?.toLowerCase().includes('already enrolled')) {
        toast.success('You are already enrolled in this course!');
        
        // Update state for already enrolled case
        setIsEnrolled(true);
        setCourse(prevCourse => ({
          ...prevCourse,
          is_enrolled: true,
          enrolled: true
        }));
        
        // Close modals
        setShowEnrollmentModal(false);
        setShowPaymentModal(false);
        
        // Refresh data to ensure everything is in sync
        try {
          const [enrollmentStatus, courseData] = await Promise.all([
            courseAPI.checkEnrollmentStatus(courseId),
            courseAPI.getCourseById(courseId)
          ]);
          
          // Only update if the data is for this specific course
          if (enrollmentStatus.courseId === courseId && 
              enrollmentStatus.status === 'success') {
            setIsEnrolled(true);
          }
          
          if (courseData && courseData.id === parseInt(courseId)) {
            setCourse(prevCourse => ({
              ...courseData,
              is_enrolled: true,
              enrolled: true
            }));
          }
        } catch (refreshError) {
          console.error('Error refreshing data:', refreshError);
          // Keep the enrolled state even if refresh fails
        }
      } else {
        // For other errors, show error message and reset enrollment state
        toast.error(error.message || 'There was an error processing your enrollment. Please try again.');
        setIsEnrolled(false);
        setCourse(prevCourse => ({
          ...prevCourse,
          is_enrolled: false,
          enrolled: false
        }));
      }
    }
  };

  // Handle unenroll/cancel enrollment
  const handleUnenroll = () => {
    // Open the confirmation modal
    onOpen();
  };

  // Handle actual unenrollment after confirmation
  const confirmCancelEnrollment = async () => {
    // Set loading state
    setCancelLoading(true);
    
    // Show loading toast
    const loadingToastId = toast.loading("Cancelling enrollment...");
    
    try {
      console.log(`Dropping course ${courseId}...`);
      const response = await courseAPI.dropCourse(courseId);
      console.log("Unenrollment response:", response);
      
      // Dismiss loading toast
      toast.dismiss(loadingToastId);
      
      // Show success toast
      if (response.success) {
        toast.success(response.message || "You have been unenrolled from this course");
        
        // Update local state
        setIsEnrolled(false);
        setCourse(prevCourse => ({
          ...prevCourse,
          is_enrolled: false,
          enrolled: false
        }));
        
        // Close the confirmation modal
        onClose();
        
        // Refresh course data after a delay to allow backend to update
        setTimeout(() => {
          fetchCourseAndEnrollment();
          console.log("Refreshed course data after unenrollment");
        }, 500);
      } else {
        toast.error(response.message || "Failed to cancel enrollment. Please try again.");
      }
    } catch (error) {
      console.error("Error cancelling enrollment:", error);
      
      // Dismiss loading toast
      toast.dismiss(loadingToastId);
      
      // Show error toast
      toast.error(error.message || "Something went wrong. Please try again.");
    } finally {
      // Reset loading state
      setCancelLoading(false);
    }
  };

  // eslint-disable-next-line no-unused-vars
  const handleCancelEnrollment = async () => {
    onOpen();
  };

  const handleConfirmEnrollment = () => {
    setShowEnrollmentModal(false);
    setShowPaymentModal(true);
  };

  // eslint-disable-next-line no-unused-vars
  const EnrollmentModal = () => (
    <div style={styles.modalOverlay}>
      <div style={styles.modal}>
        <h2 style={styles.modalTitle}>Confirm Enrollment</h2>
        <div style={styles.modalContent}>
          <h3>{course?.title}</h3>
          <p>By enrolling in this course, you'll get:</p>
          <ul style={styles.benefitsList}>
            <li>Full access to all course content</li>
            <li>Certificate upon completion</li>
            <li>Lifetime access to course materials</li>
            <li>Access to course discussion forums</li>
          </ul>
          <div style={styles.pricingInfo}>
            <span style={styles.priceLabel}>Course Price:</span>
            <span style={styles.priceAmount}>${course?.price || '0.00'}</span>
          </div>
        </div>
        <div style={styles.modalActions}>
          <button 
            onClick={() => setShowEnrollmentModal(false)}
            style={styles.cancelButton}
            disabled={enrolling}
          >
            Cancel
          </button>
          <button 
            onClick={handleConfirmEnrollment}
            style={styles.confirmButton}
            disabled={enrolling}
          >
            {enrolling ? 'Processing...' : 'Proceed to Payment'}
          </button>
        </div>
      </div>
    </div>
  );

  const styles = {
    container: {
      width: '100%',
      margin: '0 auto',
      backgroundColor: '#f5f5f5',
    },
    hero: {
      backgroundColor: '#1e1e1c',
      color: 'white',
      padding: '40px 0',
      marginBottom: '2rem',
    },
    heroContent: {
      maxWidth: '1200px',
      margin: '0 auto',
      padding: '0 2rem',
    },
    breadcrumb: {
      color: '#a1a1a1',
      fontSize: '0.9rem',
      marginBottom: '1rem',
    },
    title: {
      fontSize: '2.5rem',
      fontWeight: '700',
      marginBottom: '1.5rem',
      color: 'white',
    },
    subtitle: {
      fontSize: '1.2rem',
      color: '#a1a1a1',
      marginBottom: '2rem',
      lineHeight: '1.6',
    },
    mainContent: {
      maxWidth: '1200px',
      margin: '0 auto',
      padding: '0 2rem',
      display: 'grid',
      gridTemplateColumns: '2fr 1fr',
      gap: '2rem',
    },
    courseInfo: {
      backgroundColor: 'white',
      borderRadius: '8px',
      padding: '2rem',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    },
    courseSidebar: {
      position: 'sticky',
      top: '20px',
      alignSelf: 'start',
    },
    enrollCard: {
      backgroundColor: 'white',
      borderRadius: '8px',
      padding: '2rem',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      marginBottom: '1rem',
    },
    highlights: {
      display: 'grid',
      gridTemplateColumns: 'repeat(2, 1fr)',
      gap: '1.5rem',
      marginBottom: '2rem',
    },
    highlightCard: {
      backgroundColor: '#f8f9fa',
      padding: '1.5rem',
      borderRadius: '8px',
      border: '1px solid #e9ecef',
    },
    highlightTitle: {
      fontSize: '1.1rem',
      fontWeight: '600',
      marginBottom: '1rem',
      color: '#2d2d2d',
    },
    highlightList: {
      listStyle: 'none',
      padding: 0,
      margin: 0,
    },
    highlightItem: {
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
      marginBottom: '0.75rem',
      color: '#4a4a4a',
      fontSize: '0.95rem',
    },
    sectionTitle: {
      fontSize: '1.5rem',
      fontWeight: '600',
      marginBottom: '1.5rem',
      color: '#2d2d2d',
    },
    instructorSection: {
      display: 'flex',
      alignItems: 'center',
      gap: '1.5rem',
      padding: '1.5rem',
      backgroundColor: '#f8f9fa',
      borderRadius: '8px',
      marginBottom: '2rem',
    },
    instructorAvatar: {
      width: '80px',
      height: '80px',
      borderRadius: '50%',
      objectFit: 'cover',
    },
    instructorInfo: {
      flex: 1,
    },
    instructorName: {
      fontSize: '1.2rem',
      fontWeight: '600',
      marginBottom: '0.5rem',
      color: '#2d2d2d',
    },
    instructorBio: {
      color: '#4a4a4a',
      fontSize: '0.95rem',
      lineHeight: '1.5',
    },
    enrollButton: {
      backgroundColor: '#0056D2',
      color: 'white',
      border: 'none',
      padding: '1rem 2rem',
      borderRadius: '4px',
      fontSize: '1.1rem',
      fontWeight: '600',
      cursor: 'pointer',
      width: '100%',
      transition: 'background-color 0.2s',
      marginBottom: '1rem',
    },
    enrolledButton: {
      backgroundColor: '#28a745',
      color: 'white',
      border: 'none',
      padding: '1rem 2rem',
      borderRadius: '4px',
      fontSize: '1.1rem',
      fontWeight: '600',
      width: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '0.5rem',
      marginBottom: '1rem',
    },
    courseStats: {
      display: 'grid',
      gridTemplateColumns: 'repeat(2, 1fr)',
      gap: '1rem',
      marginBottom: '1.5rem',
    },
    statItem: {
      textAlign: 'center',
      padding: '1rem',
      backgroundColor: '#f8f9fa',
      borderRadius: '4px',
    },
    statValue: {
      fontSize: '1.5rem',
      fontWeight: '600',
      color: '#2d2d2d',
      marginBottom: '0.25rem',
    },
    statLabel: {
      fontSize: '0.9rem',
      color: '#6c757d',
    },
    moduleSection: {
      marginTop: '2rem',
    },
    module: {
      backgroundColor: 'white',
      borderRadius: '8px',
      marginBottom: '1rem',
      overflow: 'hidden',
      border: '1px solid #e9ecef',
    },
    moduleHeader: {
      padding: '1.5rem',
      backgroundColor: '#f8f9fa',
      borderBottom: '1px solid #e9ecef',
    },
    moduleTitle: {
      fontSize: '1.1rem',
      fontWeight: '600',
      color: '#2d2d2d',
      margin: 0,
    },
    moduleContent: {
      padding: '1.5rem',
    },
    modalOverlay: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000,
    },
    modal: {
      backgroundColor: 'white',
      borderRadius: '8px',
      padding: '2rem',
      maxWidth: '500px',
      width: '90%',
      maxHeight: '90vh',
      overflow: 'auto',
    },
    modalTitle: {
      color: '#2c3e50',
      marginBottom: '1.5rem',
      textAlign: 'center',
    },
    modalContent: {
      marginBottom: '2rem',
    },
    benefitsList: {
      listStyle: 'none',
      padding: 0,
      margin: '1rem 0',
    },
    modalActions: {
      display: 'flex',
      justifyContent: 'flex-end',
      gap: '1rem',
    },
    confirmButton: {
      backgroundColor: '#3a5a9b',
      color: 'white',
      border: 'none',
      padding: '0.75rem 1.5rem',
      borderRadius: '4px',
      cursor: 'pointer',
      fontSize: '1rem',
    },
    cancelButton: {
      backgroundColor: '#6c757d',
      color: 'white',
      border: 'none',
      padding: '0.75rem 1.5rem',
      borderRadius: '4px',
      cursor: 'pointer',
      fontSize: '1rem',
    },
    pricingInfo: {
      marginTop: '1rem',
      padding: '1rem',
      backgroundColor: '#f8f9fa',
      borderRadius: '4px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    priceLabel: {
      fontSize: '1.1rem',
      fontWeight: '500',
      color: '#2d2d2d',
    },
    priceAmount: {
      fontSize: '1.5rem',
      fontWeight: '600',
      color: '#0056D2',
    },
  };

  // Render enrollment button based on enrollment status for THIS specific course
  const renderEnrollmentButton = () => {
    if (loading) {
      return <Button disabled>Loading...</Button>;
    }

    // Check both the isEnrolled state and the course object's enrollment status
    const enrollmentStatus = isEnrolled || course?.is_enrolled || course?.enrolled;
    
    console.log('Current enrollment status in button render:', {
      isEnrolled,
      courseIsEnrolled: course?.is_enrolled,
      courseEnrolled: course?.enrolled,
      finalStatus: enrollmentStatus
    });

    if (enrollmentStatus) {
      return (
        <div className="flex flex-col sm:flex-row gap-2">
          <a
            href={`/courses/${courseId}/learn`}
            className="px-6 py-3 bg-green-600 text-white rounded-lg font-bold flex items-center justify-center sm:w-auto w-full text-lg"
          >
            Continue Learning
          </a>
          <Button 
            colorScheme="red" 
            onClick={handleUnenroll}
            className="w-full sm:w-auto"
            isLoading={cancelLoading}
          >
            Cancel Enrollment
          </Button>
        </div>
      );
    }

    return (
      <Button 
        colorScheme="blue" 
        onClick={handleEnrollClick}
        isLoading={enrolling}
        className="w-full sm:w-auto"
      >
        Enroll Now for ${course?.price || 0}
      </Button>
    );
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={{ ...styles.heroContent, textAlign: 'center', padding: '4rem 2rem' }}>
          <div style={{ fontSize: '1.2rem', color: '#4a4a4a' }}>Loading course details...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.container}>
        <div style={{ ...styles.heroContent, textAlign: 'center', padding: '4rem 2rem' }}>
          <div style={{ color: '#dc3545', marginBottom: '1rem' }}>{error}</div>
            <button 
              onClick={() => navigate('/courses')} 
            style={{
              ...styles.enrollButton,
              maxWidth: '200px',
              backgroundColor: '#6c757d'
            }}
            >
              Back to Courses
            </button>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div style={styles.container}>
        <div style={{ ...styles.heroContent, textAlign: 'center', padding: '4rem 2rem' }}>
          <div style={{ fontSize: '1.2rem', color: '#4a4a4a' }}>Course not found</div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-100 min-h-screen pb-10">
      {loading ? (
        <div className="container mx-auto pt-20 text-center">
          <Spinner size="xl" />
          <p className="mt-4">Loading course details...</p>
        </div>
      ) : error ? (
        <div className="container mx-auto pt-20 text-center">
          <Alert status="error">
            <AlertIcon />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </div>
      ) : (
        <>
          {/* Banner with course image */}
          <div className="w-full bg-gradient-to-r from-blue-300 to-blue-400 h-56 relative overflow-hidden">
            {course?.cover_image ? (
              <img 
                src={course.cover_image} 
                alt={course.title} 
                className="w-full h-full object-cover opacity-80" 
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Text color="white" fontSize="2xl">{course?.title}</Text>
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-center justify-center">
              <div className="text-center text-white max-w-3xl px-4">
                <h1 className="text-3xl md:text-4xl font-bold mb-2 text-shadow-lg">{course?.title}</h1>
                <p className="text-lg mb-2">
                  By <span className="font-semibold px-3 py-1 rounded-full bg-blue-400/80 text-white">{course?.instructor?.name || 'Unknown Instructor'}</span>
                </p>
              </div>
            </div>
          </div>

          <div className="container mx-auto px-4 py-4 max-w-6xl">
            <div className="flex flex-col lg:flex-row gap-5">
              {/* Left column - Course details */}
              <div className="lg:w-2/3">
                {/* Course info cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
                  <div className="flex items-center p-3 bg-blue-50 rounded-lg border border-blue-100">
                    <span className="material-icons text-blue-500 mr-2">category</span>
                    <div>
                      <p className="text-xs text-blue-500">Category</p>
                      <p className="font-medium text-gray-800 text-sm">{course?.category || 'Uncategorized'}</p>
                    </div>
                  </div>
                  <div className="flex items-center p-3 bg-blue-50 rounded-lg border border-blue-100">
                    <span className="material-icons text-blue-500 mr-2">school</span>
                    <div>
                      <p className="text-xs text-blue-500">Level</p>
                      <p className="font-medium text-gray-800 text-sm">{course?.difficulty_level || 'All Levels'}</p>
                    </div>
                  </div>
                  <div className="flex items-center p-3 bg-blue-50 rounded-lg border border-blue-100">
                    <span className="material-icons text-blue-500 mr-2">schedule</span>
                    <div>
                      <p className="text-xs text-blue-500">Duration</p>
                      <p className="font-medium text-gray-800 text-sm">{course?.duration_in_weeks || 'Self-paced'} {course?.duration_in_weeks === 1 ? 'week' : 'weeks'}</p>
                    </div>
                  </div>
                  <div className="flex items-center p-3 bg-blue-50 rounded-lg border border-blue-100">
                    <span className="material-icons text-blue-500 mr-2">people</span>
                    <div>
                      <p className="text-xs text-blue-500">Enrollment</p>
                      <p className="font-medium text-gray-800 text-sm">{course?.total_students || 0} students</p>
                    </div>
                  </div>
                </div>

                {/* About This Course */}
                <div className="bg-white rounded-lg shadow-sm p-5 mb-5 border border-blue-100">
                  <h2 className="text-xl font-bold mb-3 text-gray-800 border-b pb-2 border-blue-100">About This Course</h2>
                  <p className="text-gray-700 leading-relaxed">{course?.description}</p>
                </div>

                {/* What you'll learn section */}
                <div className="bg-white rounded-lg shadow-sm p-5 mb-5 border border-blue-100">
                  <h2 className="text-xl font-bold mb-3 text-gray-800 border-b pb-2 border-blue-100">What You'll Learn</h2>
                  {course?.modules?.length > 0 ? (
                    <div className="space-y-3">
                      {course.modules.map((module, index) => (
                        <div key={module.id || index} className="border-l-4 border-blue-400 pl-3 py-2 bg-blue-50 rounded-r-lg">
                          <h3 className="text-base font-semibold text-gray-800">{module.title}</h3>
                          <p className="text-gray-600 text-sm">{module.description || 'No description provided'}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center p-4 bg-blue-50 rounded-lg border border-dashed border-blue-200">
                      <span className="material-icons text-blue-400 text-2xl mb-2">pending_actions</span>
                      <p className="text-gray-600 text-sm">Course content is being prepared.</p>
                    </div>
                  )}
                </div>
                
                {/* Instructor info */}
                <div className="bg-white rounded-lg shadow-sm p-5 border border-blue-100">
                  <h2 className="text-xl font-bold mb-3 text-gray-800 border-b pb-2 border-blue-100">Your Instructor</h2>
                  <div className="flex items-center gap-4">
                    {course?.instructor?.avatar ? (
                      <img 
                        src={course.instructor.avatar} 
                        alt={course.instructor.name} 
                        className="w-16 h-16 rounded-full border-2 border-white shadow object-cover"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-300 to-blue-400 flex items-center justify-center shadow">
                        <span className="material-icons text-white text-2xl">person</span>
                      </div>
                    )}
                    <div>
                      <h3 className="text-lg font-semibold text-blue-600">{course?.instructor?.name || 'Unknown Instructor'}</h3>
                      <p className="text-gray-600 text-sm">{course?.instructor?.title || 'Instructor'}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right column - Enrollment card */}
              <div className="lg:w-1/3">
                <div className="bg-white rounded-lg shadow-sm p-5 sticky top-20 border border-blue-100">
                  {(course?.thumbnail || course?.thumbnail_url) && (
                    <div className="mb-4 overflow-hidden rounded-lg border border-blue-50">
                      <img 
                        src={course.thumbnail || course.thumbnail_url} 
                        alt={course.title} 
                        className="w-full h-44 object-cover" 
                      />
                    </div>
                  )}
                  
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold text-gray-800">${course?.price || 0}</h3>
                    <div className="flex items-center px-2 py-1 bg-yellow-50 rounded border border-yellow-100">
                      <span className="material-icons text-yellow-500 text-xs mr-1">star</span>
                      <span className="text-xs font-medium">{course?.rating || 0} ({course?.reviews_count || 0})</span>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    {isEnrolled ? (
                      <div className="flex flex-col gap-2">
                        <a
                          href={`/courses/${courseId}/learn`}
                          className="px-4 py-3 bg-blue-500 text-white rounded-lg font-semibold flex items-center justify-center text-base shadow-sm hover:bg-blue-600 transition-colors"
                        >
                          <span className="material-icons mr-2 text-sm">play_circle</span>
                          Continue Learning
                        </a>
                        <Button 
                          colorScheme="red" 
                          onClick={handleUnenroll}
                          size="md"
                          variant="outline"
                          isLoading={cancelLoading}
                        >
                          Cancel Enrollment
                        </Button>
                      </div>
                    ) : (
                      <Button 
                        onClick={handleEnrollClick}
                        isLoading={enrolling}
                        colorScheme="blue"
                        size="lg"
                        width="100%"
                      >
                        Enroll Now for ${course?.price || 0}
                      </Button>
                    )}
                    
                    <div className="text-xs text-gray-500 text-center italic">
                      {isEnrolled ? 'You have full access to this course' : 'Lifetime access to all course materials'}
                    </div>

                    <div className="border-t border-blue-100 pt-3 mt-3">
                      <h4 className="font-medium text-sm mb-2 text-gray-700">This course includes:</h4>
                      <ul className="space-y-2">
                        <li className="flex items-center text-xs bg-blue-50 p-2 rounded">
                          <span className="material-icons text-blue-500 mr-2 text-sm">check_circle</span>
                          <span>{course?.modules?.length || 0} modules</span>
                        </li>
                        <li className="flex items-center text-xs bg-blue-50 p-2 rounded">
                          <span className="material-icons text-blue-500 mr-2 text-sm">check_circle</span>
                          <span>Lifetime access</span>
                        </li>
                        <li className="flex items-center text-xs bg-blue-50 p-2 rounded">
                          <span className="material-icons text-blue-500 mr-2 text-sm">check_circle</span>
                          <span>Certificate of completion</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
      
      {/* Enrollment Confirmation Modal */}
      <Modal isOpen={showEnrollmentModal} onClose={() => setShowEnrollmentModal(false)}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Enroll in {course?.title}</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <p>You are about to enroll in <strong>{course?.title}</strong>.</p>
            <p className="mt-2">Price: <strong>${course?.price || 0}</strong></p>
            <p className="mt-4">Would you like to proceed with payment?</p>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={() => setShowEnrollmentModal(false)}>
              Cancel
            </Button>
            <Button 
              colorScheme="blue" 
              onClick={() => {
                setShowEnrollmentModal(false);
                setShowPaymentModal(true);
              }}
            >
              Proceed to Payment
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
      
      {/* Cancellation Confirmation Modal */}
      <Modal isOpen={isOpen} onClose={onClose} isCentered>
        <ModalOverlay
          bg="rgba(0, 0, 0, 0.6)"
          backdropFilter="blur(3px)"
        />
        <ModalContent borderRadius="lg" boxShadow="xl">
          <ModalHeader 
            borderTopRadius="lg" 
            bg="red.500" 
            color="white" 
            fontSize="xl"
            py={4}
          >
            Cancel Enrollment
          </ModalHeader>
          <ModalCloseButton color="white" />
          
          <ModalBody py={6}>
            <Alert status="warning" borderRadius="md" mb={4}>
              <AlertIcon />
              <div>
                <AlertTitle>This action cannot be undone</AlertTitle>
                <AlertDescription>
                  You will lose access to all course materials and your progress.
                </AlertDescription>
              </div>
            </Alert>
            
            <Text fontSize="lg" fontWeight="medium" mb={2}>
              Are you sure you want to cancel your enrollment in:
            </Text>
            <Text 
              fontSize="xl" 
              fontWeight="bold" 
              color="gray.700"
              bg="gray.50"
              p={3}
              borderRadius="md"
              mb={4}
            >
              {course?.title}
            </Text>
            
            <Text color="gray.600">
              If you change your mind, you can always enroll in this course again.
            </Text>
          </ModalBody>
          
          <ModalFooter bg="gray.50" borderBottomRadius="lg">
            <Button 
              variant="outline" 
              mr={3} 
              onClick={onClose}
              fontSize="md"
            >
              Keep Enrollment
            </Button>
            <Button
              colorScheme="red"
              onClick={confirmCancelEnrollment}
              isLoading={cancelLoading}
              loadingText="Cancelling..."
              fontSize="md"
            >
              Yes, Cancel Enrollment
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
      
      {/* Payment Modal */}
      {showPaymentModal && (
        <PaymentModal
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          onPaymentSuccess={handlePaymentSuccess}
          course={course}
        />
      )}
    </div>
  );
}

export default CourseDetail;