import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { courseAPI } from '../../services/api';
import { toast } from 'react-hot-toast';
import PaymentModal from '../payment/PaymentModal';
import { useAuth } from '../../context/AuthContext';
import {
  Box,
  Container,
  Flex,
  VStack,
  HStack,
  Text,
  Heading,
  Button,
  Image,
  Badge,
  Divider,
  SimpleGrid,
  Icon,
  List,
  ListItem,
  ListIcon,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  Spinner,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  useColorModeValue,
} from '@chakra-ui/react';
import { FaGraduationCap, FaClock, FaUsers, FaStar, FaCheckCircle, FaBook, FaVideo, FaFileAlt, FaUser } from 'react-icons/fa';

function CourseDetail() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [enrolling, setEnrolling] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [cancelLoading, setCancelLoading] = useState(false);

  // Move all color mode values to the top level
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const textColor = useColorModeValue('gray.800', 'white');
  const mutedTextColor = useColorModeValue('gray.600', 'gray.400');
  const pageBgColor = useColorModeValue('gray.50', 'gray.900');
  const moduleBgColor = useColorModeValue('gray.50', 'gray.700');
  const sectionBgColor = useColorModeValue('white', 'gray.600');

  // Function to handle the Continue Learning button click
  const handleContinueLearning = () => {
    console.log("Continue Learning clicked for course:", courseId);
    const learningUrl = `/courses/${courseId}/learn`;
    console.log("Navigating to:", learningUrl);
    
    try {
      // Try React Router navigation first
      navigate(learningUrl);
      
      // Set a timeout to check if navigation worked, if not, use window.location
      setTimeout(() => {
        if (window.location.pathname !== learningUrl) {
          console.log("Navigation not successful, using window.location as fallback");
          window.location.href = learningUrl;
        }
      }, 300);
    } catch (err) {
      console.error("Navigation error:", err);
      // Fallback to direct location change
      window.location.href = learningUrl;
    }
  };

  // Add useEffect hook to ensure Razorpay script is loaded
  useEffect(() => {
    // Ensure Razorpay script is loaded
    const loadRazorpayScript = () => {
      return new Promise((resolve) => {
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.async = true;
        script.onload = () => {
          resolve(true);
          console.log("Razorpay script loaded successfully!");
        };
        script.onerror = () => {
          resolve(false);
          console.error("Failed to load Razorpay script!");
        };
        document.body.appendChild(script);
      });
    };

    // Check if script is already loaded
    if (!window.Razorpay) {
      console.log("Razorpay not found, loading script...");
      loadRazorpayScript();
    } else {
      console.log("Razorpay script already loaded!");
    }

    const fetchCourseData = async () => {
      try {
        setLoading(true);
        const courseData = await courseAPI.getCourseById(courseId);
        setCourse(courseData);
        
        // Check enrollment status
        if (user) {
          const enrollmentStatus = await courseAPI.checkEnrollmentStatus(courseId);
          setIsEnrolled(enrollmentStatus.isEnrolled);
        }
      } catch (err) {
        console.error('Error fetching course:', err);
        setError(err.message || 'Failed to load course details');
        toast.error(err.message || 'Failed to load course details');
      } finally {
        setLoading(false);
      }
    };

    fetchCourseData();
  }, [courseId, user]);

  const handleEnrollClick = () => {
    if (!user) {
      toast.error('Please log in to enroll in this course');
      navigate('/login');
      return;
    }
    onOpen();
  };

  const handleConfirmEnrollment = async () => {
    try {
      console.log("Starting enrollment process for course:", courseId);
      setEnrolling(true);
      
      // Create payment order
      try {
        console.log("Creating payment order...");
        
        // Log version of Razorpay if available
        if (window.Razorpay) {
          console.log("Razorpay already available in window object");
        } else {
          console.log("Razorpay not found in window object yet");
        }
        
        // Create a payment order
        try {
          const order = await courseAPI.createPaymentOrder(courseId);
          console.log("Payment order created:", order);
          
          // Hard-coded clean implementation that works reliably
          const options = {
            key: "rzp_test_LLNfQcS70cFk7H",
            amount: order.amount,
            currency: order.currency || "INR",
            name: "E-Learning Platform", 
            description: `Enrollment for ${course?.title || 'Course'}`,
            order_id: order.id,
            handler: function (response) {
              // On successful payment
              console.log("Payment successful", response);
              
              // Send success message
              toast.success("Payment successful! You are now enrolled in the course.");
              
              // Verify payment on server
              courseAPI.verifyPayment(courseId, {
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_signature: response.razorpay_signature
              })
              .then(() => {
                // Update UI and redirect
                setIsEnrolled(true);
                window.location.href = `/courses/${courseId}/learn`;
              })
              .catch(err => {
                console.error("Verification failed", err);
                toast.error("Payment verification failed. Please contact support.");
              });
            },
            prefill: {
              name: user?.username || "",
              email: user?.email || ""
            },
            theme: {
              color: "#3182CE"
            },
            modal: {
              ondismiss: function() {
                console.log("Payment modal dismissed");
                setEnrolling(false);
              }
            }
          };

          // Add script directly
          console.log("Creating Razorpay script element...");
          const script = document.createElement("script");
          script.src = "https://checkout.razorpay.com/v1/checkout.js";
          script.async = true;
          
          script.onload = function() {
            console.log("Razorpay script loaded successfully");
            try {
              console.log("Initializing Razorpay with options:", JSON.stringify(options));
              const rzp = new window.Razorpay(options);
              console.log("Razorpay instance created");
              
              rzp.on('payment.failed', function (response) {
                console.error("Payment failed:", response.error);
                toast.error(`Payment failed: ${response.error.description}`);
                setEnrolling(false);
              });
              
              console.log("Opening Razorpay payment window...");
              rzp.open();
              console.log("Razorpay payment window opened");
            } catch (rzpErr) {
              console.error("Error initializing Razorpay:", rzpErr);
              throw new Error(`Failed to initialize Razorpay: ${rzpErr.message}`);
            }
          };
          
          script.onerror = function() {
            console.error("Failed to load Razorpay script");
            throw new Error("Payment gateway not available - script loading failed");
          };
          
          console.log("Appending Razorpay script to document body");
          document.body.appendChild(script);
          console.log("Script appended, waiting for load event");
          onClose(); // Close enrollment modal
          
        } catch (orderError) {
          console.error("Payment order creation failed:", orderError);
          // Show error and offer direct enrollment
          if (orderError.message.includes("ModuleNotFoundError") || 
              orderError.message.includes("Payment gateway") ||
              orderError.message.includes("Failed to create payment order")) {
            throw new Error("Payment system is unavailable right now");
          } else {
            throw orderError;
          }
        }
        
      } catch (paymentError) {
        console.error("Payment process failed:", paymentError);
        console.error("Error details:", {
          message: paymentError.message,
          name: paymentError.name,
          stack: paymentError.stack
        });
        
        // Show user-friendly error and offer direct enrollment
        const errorMessage = paymentError.message.includes("payment system")
          ? "Payment system is currently unavailable. Would you like to try direct enrollment instead?"
          : `${paymentError.message}. Would you like to try direct enrollment instead?`;
        
        if (window.confirm(errorMessage)) {
          try {
            console.log("Trying direct enrollment as a fallback");
            // Try direct enrollment as a fallback
            await handleEmergencyAccess();
            // Close the enrollment modal
            onClose();
          } catch (directEnrollError) {
            console.error("Direct enrollment also failed:", directEnrollError);
            toast.error("Both payment and direct enrollment failed. Please try again later.");
            setEnrolling(false);
          }
        } else {
          setEnrolling(false);
          onClose();
        }
      }
    } catch (err) {
      console.error('Payment initialization error:', err);
      toast.error(err.message || 'Failed to initialize payment');
      setEnrolling(false);
    }
  };

  const handleUnenroll = async () => {
    try {
      setCancelLoading(true);
      await courseAPI.dropCourse(courseId);
      setIsEnrolled(false);
      toast.success('Successfully unenrolled from the course');
    } catch (err) {
      console.error('Unenroll error:', err);
      toast.error(err.message || 'Failed to unenroll from course');
    } finally {
      setCancelLoading(false);
    }
  };

  // Emergency direct enrollment function that bypasses payment
  const handleEmergencyAccess = async () => {
    try {
      setEnrolling(true);
      
      // Create a direct enrollment without payment - use the correct API client
      try {
        // Try using the courseAPI first
        await courseAPI.directEnroll(courseId);
      } catch (apiErr) {
        console.warn("Direct enrollment API not found, trying fallback navigation");
        // If the API doesn't exist, just navigate directly to the learning page
        navigate(`/courses/${courseId}/learn`);
        return;
      }
      
      setIsEnrolled(true);
      toast.success('Emergency access granted. You can now access the course.');
      
      // Redirect to course learning page
      navigate(`/courses/${courseId}/learn`);
    } catch (err) {
      console.error('Emergency access error:', err);
      toast.error(err.message || 'Failed to grant emergency access');
      
      // Fallback to direct navigation if enrollment fails
      navigate(`/courses/${courseId}/learn`);
    } finally {
      setEnrolling(false);
    }
  };

  if (loading) {
    return (
      <Flex minH="80vh" align="center" justify="center">
        <VStack spacing={4}>
          <Spinner size="xl" color="blue.500" />
          <Text>Loading course details...</Text>
        </VStack>
      </Flex>
    );
  }

  if (error) {
    return (
      <Container maxW="container.xl" py={10}>
        <Alert
          status="error"
          variant="subtle"
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
          textAlign="center"
          height="200px"
          borderRadius="lg"
        >
          <AlertIcon boxSize="40px" mr={0} />
          <AlertTitle mt={4} mb={1} fontSize="lg">
            {error}
          </AlertTitle>
          <AlertDescription maxWidth="sm">
            We couldn't load the course details. Please try again later.
          </AlertDescription>
          <Button
            mt={4}
            colorScheme="blue"
            onClick={() => navigate('/courses')}
          >
            Back to Courses
          </Button>
        </Alert>
      </Container>
    );
  }

  return (
    <Box bg={pageBgColor} minH="100vh">
      {/* Hero Section */}
      <Box
        bg="blue.600"
        color="white"
        py={16}
        position="relative"
        overflow="hidden"
      >
        <Container maxW="container.xl">
          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={8} alignItems="center">
            <Box>
              <Badge
                colorScheme="blue"
                bg="blue.100"
                color="blue.800"
                mb={4}
                fontSize="sm"
                px={3}
                py={1}
                borderRadius="full"
              >
                {course?.category || 'Uncategorized'}
              </Badge>
              <Heading as="h1" size="2xl" mb={4}>
                {course?.title}
              </Heading>
              <Text fontSize="lg" mb={6} opacity={0.9}>
                {course?.description}
              </Text>
              <HStack spacing={6}>
                <HStack>
                  <Icon as={FaUsers} />
                  <Text>{course?.total_students || 0} students</Text>
                </HStack>
                <HStack>
                  <Icon as={FaStar} color="yellow.400" />
                  <Text>{course?.rating || 0} rating</Text>
                </HStack>
              </HStack>
            </Box>
            <Box>
              {course?.thumbnail && (
                <Image
                  src={course.thumbnail}
                  alt={course.title}
                  borderRadius="lg"
                  objectFit="cover"
                  w="full"
                  h="300px"
                  shadow="2xl"
                />
              )}
            </Box>
          </SimpleGrid>
        </Container>
      </Box>

      <Container maxW="container.xl" py={12}>
        <SimpleGrid columns={{ base: 1, lg: 3 }} spacing={8}>
          {/* Main Content */}
          <Box gridColumn={{ base: "1", lg: "span 2" }}>
            {/* Course Stats */}
            <SimpleGrid
              columns={{ base: 2, md: 4 }}
              spacing={4}
              mb={8}
              bg={bgColor}
              p={6}
              borderRadius="lg"
              border="1px"
              borderColor={borderColor}
            >
              <VStack align="start">
                <HStack color="blue.500">
                  <Icon as={FaGraduationCap} />
                  <Text fontWeight="bold">Level</Text>
                </HStack>
                <Text>{course?.difficulty_level || 'All Levels'}</Text>
              </VStack>
              <VStack align="start">
                <HStack color="blue.500">
                  <Icon as={FaClock} />
                  <Text fontWeight="bold">Duration</Text>
                </HStack>
                <Text>{course?.duration_in_weeks || 'Self-paced'} weeks</Text>
              </VStack>
              <VStack align="start">
                <HStack color="blue.500">
                  <Icon as={FaUsers} />
                  <Text fontWeight="bold">Students</Text>
                </HStack>
                <Text>{course?.total_students || 0} enrolled</Text>
              </VStack>
              <VStack align="start">
                <HStack color="blue.500">
                  <Icon as={FaStar} />
                  <Text fontWeight="bold">Rating</Text>
                </HStack>
                <Text>{course?.rating || 0} out of 5</Text>
              </VStack>
            </SimpleGrid>

            {/* Course Content */}
            <Box
              bg={bgColor}
              p={6}
              borderRadius="lg"
              border="1px"
              borderColor={borderColor}
              mb={8}
            >
              <Heading size="md" mb={6}>Course Content</Heading>
              <VStack spacing={4} align="stretch">
                {course?.modules?.map((module, index) => (
                  <Box
                    key={module.id || index}
                    p={4}
                    bg={moduleBgColor}
                    borderRadius="md"
                  >
                    <HStack justify="space-between" mb={2}>
                      <Heading size="sm">{module.title}</Heading>
                      <Badge colorScheme="blue">
                        {module.sections?.length || 0} sections
                      </Badge>
                    </HStack>
                    {module.sections?.map((section, sIndex) => (
                      <HStack
                        key={section.id || sIndex}
                        p={2}
                        bg={sectionBgColor}
                        borderRadius="md"
                        mt={2}
                      >
                        <Icon
                          as={section.content_type === 'video' ? FaVideo : FaFileAlt}
                          color="blue.500"
                        />
                        <Text fontSize="sm">{section.title}</Text>
                      </HStack>
                    ))}
                  </Box>
                ))}
              </VStack>
            </Box>

            {/* Instructor Info */}
            <Box
              bg={bgColor}
              p={6}
              borderRadius="lg"
              border="1px"
              borderColor={borderColor}
            >
              <Heading size="md" mb={6}>About the Instructor</Heading>
              <HStack spacing={4}>
                <Box
                  w="80px"
                  h="80px"
                  borderRadius="full"
                  bg="blue.500"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                >
                  <Icon as={FaUser} color="white" boxSize={8} />
                </Box>
                <VStack align="start" flex={1}>
                  <Heading size="sm">{course?.instructor?.name || 'Unknown Instructor'}</Heading>
                  <Text color={mutedTextColor}>
                    {course?.instructor?.title || 'Course Instructor'}
                  </Text>
                </VStack>
              </HStack>
            </Box>
          </Box>

          {/* Sidebar */}
          <Box>
            <Box
              position="sticky"
              top="20px"
              bg={bgColor}
              p={6}
              borderRadius="lg"
              border="1px"
              borderColor={borderColor}
            >
              <Heading size="lg" mb={4}>${course?.price || 0}</Heading>
              {isEnrolled ? (
                <VStack spacing={4} width="100%">
                  <Button
                    colorScheme="green"
                    size="lg"
                    width="100%"
                    leftIcon={<Icon as={FaBook} />}
                    onClick={handleContinueLearning}
                  >
                    Continue Learning
                  </Button>
                  <Button
                    colorScheme="teal"
                    size="md"
                    width="100%"
                    onClick={handleEmergencyAccess}
                  >
                    Emergency Access
                  </Button>
                  <Button
                    colorScheme="red"
                    variant="outline"
                    width="100%"
                    onClick={handleUnenroll}
                    isLoading={cancelLoading}
                  >
                    Cancel Enrollment
                  </Button>
                </VStack>
              ) : (
                <Button
                  colorScheme="blue"
                  size="lg"
                  width="100%"
                  onClick={handleEnrollClick}
                  isLoading={enrolling}
                >
                  Enroll Now
                </Button>
              )}

              <Divider my={6} />

              <VStack align="stretch" spacing={4}>
                <Heading size="sm">This course includes:</Heading>
                <List spacing={3}>
                  <ListItem>
                    <ListIcon as={FaCheckCircle} color="green.500" />
                    {course?.modules?.length || 0} modules
                  </ListItem>
                  <ListItem>
                    <ListIcon as={FaCheckCircle} color="green.500" />
                    Lifetime access
                  </ListItem>
                  <ListItem>
                    <ListIcon as={FaCheckCircle} color="green.500" />
                    Certificate of completion
                  </ListItem>
                  <ListItem>
                    <ListIcon as={FaCheckCircle} color="green.500" />
                    Access on mobile and desktop
                  </ListItem>
                </List>
              </VStack>
            </Box>
          </Box>
        </SimpleGrid>
      </Container>

      {/* Enrollment Modal */}
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Enroll in {course?.title}</ModalHeader>
          <ModalBody>
            <Text>Course Price: ${course?.price || 0}</Text>
            <Text mt={4}>Would you like to proceed with enrollment?</Text>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose}>
              Cancel
            </Button>
            <Button
              colorScheme="blue"
              onClick={handleConfirmEnrollment}
              isLoading={enrolling}
            >
              Confirm Enrollment
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Payment Modal */}
      {showPaymentModal && (
        <PaymentModal
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          course={course}
          onSuccess={handleConfirmEnrollment}
        />
      )}
    </Box>
  );
}

export default CourseDetail;