import React, { useState, useEffect, startTransition } from 'react';
import {
    Box,
    Container,
    Input,
    InputGroup,
    InputLeftElement,
    Text,
    Heading,
    SimpleGrid,
    Button,
    VStack,
    Icon,
    useColorModeValue,
    Flex,
    Spinner,
    useToast,
    Menu,
    MenuButton,
    MenuList,
    MenuItem,
    css,
    Badge,
    HStack,
} from '@chakra-ui/react';
import { SearchIcon, ChevronDownIcon, StarIcon } from '@chakra-ui/icons';
import {
    FaGraduationCap,
    FaLaptop,
    FaBrain,
    FaBusinessTime,
    FaBookReader,
    FaCertificate,
    FaChalkboardTeacher,
} from 'react-icons/fa';
import { Link, useNavigate } from 'react-router-dom';
import { courseAPI } from '../../services/api';
import CourseCard from '../courses/CourseCard';
import Navbar from '../shared/Navbar';
import Footer from '../shared/Footer';
import { enrollmentAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

const quotes = [
    {
        text: "Education is the most powerful weapon which you can use to change the world.",
        author: "Nelson Mandela",
        color: { light: 'blue.500', dark: 'blue.200' }
    },
    {
        text: "The beautiful thing about learning is that no one can take it away from you.",
        author: "B.B. King",
        color: { light: 'purple.500', dark: 'purple.200' }
    },
    {
        text: "Education is not preparation for life; education is life itself.",
        author: "John Dewey",
        color: { light: 'teal.500', dark: 'teal.200' }
    },
    {
        text: "The mind is not a vessel to be filled, but a fire to be kindled.",
        author: "Plutarch",
        color: { light: 'orange.500', dark: 'orange.200' }
    },
    {
        text: "Learning is a treasure that will follow its owner everywhere.",
        author: "Chinese Proverb",
        color: { light: 'green.500', dark: 'green.200' }
    }
];

const fadeIn = css`
  @keyframes fadeIn {
    from { 
      opacity: 0;
    }
    to { 
      opacity: 1;
    }
  }
  animation: fadeIn 0.8s ease-in-out;
`;

const fadeOut = css`
  @keyframes fadeOut {
    from { 
      opacity: 1;
    }
    to { 
      opacity: 0;
    }
  }
  animation: fadeOut 0.8s ease-in-out;
`;

const QuoteSlider = () => {
    const [currentQuoteIndex, setCurrentQuoteIndex] = useState(0);
    const [isVisible, setIsVisible] = useState(true);
    const [nextQuoteIndex, setNextQuoteIndex] = useState(1);

    useEffect(() => {
        const interval = setInterval(() => {
            setIsVisible(false);
            setTimeout(() => {
                setCurrentQuoteIndex(nextQuoteIndex);
                setNextQuoteIndex((nextQuoteIndex + 1) % quotes.length);
                setIsVisible(true);
            }, 800);
        }, 8000);

        return () => clearInterval(interval);
    }, [nextQuoteIndex]);

    const currentQuote = quotes[currentQuoteIndex];
    const borderColor = useColorModeValue(currentQuote.color.light, currentQuote.color.dark);

    return (
        <Box
            position="relative"
            h={{ base: "auto", md: "160px" }}
            w="100%"
            maxW="1200px"
            mx="auto"
            display="flex"
            alignItems="center"
            justifyContent="center"
            py={8}
            px={4}
            borderLeft="4px solid"
            borderColor={borderColor}
            transition="all 0.3s ease-in-out"
        >
            <Box
                position="absolute"
                top={0}
                left={0}
                right={0}
                bottom={0}
                display="flex"
                alignItems="center"
                justifyContent="center"
                textAlign="left"
                css={isVisible ? fadeIn : fadeOut}
            >
                <VStack
                    spacing={4}
                    align="flex-start"
                    maxW="800px"
                    w="100%"
                    pl={8}
                >
                    <Text
                        fontSize={{ base: "xl", md: "2xl" }}
                        fontWeight="normal"
                        lineHeight="tall"
                        color={useColorModeValue("gray.700", "gray.200")}
                    >
                        {currentQuote.text}
                    </Text>
                    <Text
                        fontSize={{ base: "md", md: "lg" }}
                        fontWeight="medium"
                        color={borderColor}
                    >
                        {currentQuote.author}
                    </Text>
                </VStack>
            </Box>
        </Box>
    );
};

const CategoryButton = ({ icon, text, onClick, ...props }) => (
    <Button
        onClick={onClick}
        leftIcon={<Icon as={icon} />}
        variant="outline"
        size="lg"
        borderRadius="md"
        px={6}
        width="full"
        justifyContent="flex-start"
        {...props}
    >
        {text}
    </Button>
);

const StudentDashboard = () => {
    // Move all hooks to the top
    const navigate = useNavigate();
    const toast = useToast();
    const { authTokens } = useAuth();
    
    // Group all color mode values at the top
    const bgColor = useColorModeValue('gray.50', 'gray.800');
    const mainGradient = useColorModeValue(
        'linear-gradient(to bottom, #f7fafc, #edf2f7)',
        'linear-gradient(to bottom, gray.800, gray.900)'
    );
    const cardBg = useColorModeValue('white', 'gray.700');
    const emptyStateBg = useColorModeValue('gray.50', 'gray.800');

    // State declarations
    const [searchQuery, setSearchQuery] = useState('');
    const [courses, setCourses] = useState({
        recentlyAdded: [],
        enrolled: [],
        recommended: []
    });
    const [loading, setLoading] = useState({
        all: true,
        recent: true,
        enrolled: true,
        recommended: true
    });
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState('');
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [courseData, setCourseData] = useState({
        title: '',
        description: '',
        price: 0,
        category: '',
        duration: '',
        level: 'beginner',
        thumbnail: null,
        thumbnailPreview: null,
        courseType: 'paid',
    });

    const fetchCourses = async () => {
        setLoading(prev => ({ ...prev, all: true }));
        try {
            // Fetch all courses first
            const allCourses = await courseAPI.getCourses();
            console.log('All courses fetched:', allCourses);

            // Fetch recent courses
            setLoading(prev => ({ ...prev, recent: true }));
            const recentCourses = await courseAPI.getRecentCourses();
            console.log('Recent courses fetched:', recentCourses);
            setLoading(prev => ({ ...prev, recent: false }));

            // Fetch enrolled courses
            setLoading(prev => ({ ...prev, enrolled: true }));
            try {
                const enrolledCoursesData = await enrollmentAPI.getEnrolledCourses();
                console.log('Enrolled courses fetched:', enrolledCoursesData);
                
                // Get recommended courses (excluding enrolled ones)
                setLoading(prev => ({ ...prev, recommended: true }));
                const enrolledIds = new Set(enrolledCoursesData.map(course => course.id));
                const recommendedCoursesData = allCourses
                    .filter(course => !enrolledIds.has(course.id))
                    .sort(() => Math.random() - 0.5)
                    .slice(0, 3);
                console.log('Recommended courses:', recommendedCoursesData);

                // Update all course data at once
                setCourses({
                    recentlyAdded: recentCourses || [],
                    enrolled: enrolledCoursesData || [],
                    recommended: recommendedCoursesData || []
                });
                
                // Clear any previous errors
                setError(null);
            } catch (enrollmentError) {
                console.error('Error fetching enrolled courses:', enrollmentError);
                // If enrolled courses fail, still show other sections
                setCourses(prev => ({
                    ...prev,
                    recentlyAdded: recentCourses || [],
                    enrolled: [],
                    recommended: allCourses
                        .sort(() => Math.random() - 0.5)
                        .slice(0, 3) || []
                }));
                
                // Show a warning toast but don't set error state since we have partial data
                toast({
                    title: 'Some content could not be loaded',
                    description: 'We could not load your enrolled courses. Other courses are still available.',
                    status: 'warning',
                    duration: 5000,
                    isClosable: true,
                });
            }

        } catch (error) {
            console.error('Error fetching courses:', error);
            setError(error.message || 'Failed to load courses. Please try again later.');
            
            // Show error toast
            toast({
                title: 'Error loading courses',
                description: error.message || 'Please try refreshing the page or try again later.',
                status: 'error',
                duration: 7000,
                isClosable: true,
            });
            
            // Set empty courses data
            setCourses({
                recentlyAdded: [],
                enrolled: [],
                recommended: []
            });
        } finally {
            setLoading({
                all: false,
                recent: false,
                enrolled: false,
                recommended: false
            });
        }
    };
    
    // Add a retry function
    const handleRetry = () => {
        setError(null);
        fetchCourses();
    };

    useEffect(() => {
        fetchCourses();
    }, []);

    const handleSearch = (e) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            // Use startTransition for navigation
            React.startTransition(() => {
                navigate(`/courses?search=${encodeURIComponent(searchQuery.trim())}`);
            });
        }
    };

    const fetchFilteredCourses = async (category) => {
        try {
            setLoading(prev => ({ ...prev, all: true }));
            const filters = category ? { category } : {};
            const filteredCourses = await courseAPI.getAllCourses(filters);
            setCourses(prev => ({
                ...prev,
                recentlyAdded: filteredCourses
            }));
        } catch (error) {
            console.error('Error fetching filtered courses:', error);
            toast({
                title: 'Error',
                description: 'Failed to load filtered courses',
                status: 'error',
                duration: 3000,
                isClosable: true,
            });
        } finally {
            setLoading(prev => ({ ...prev, all: false }));
        }
    };

    const handleCategoryClick = (category) => {
        setSelectedCategory(category);
        fetchFilteredCourses(category);
    };

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
        } else if (name === 'courseType') {
            setCourseData({
                ...courseData,
                courseType: value,
                price: value === 'free' ? 0 : courseData.price
            });
        } else {
            setCourseData({
                ...courseData,
                [name]: value
            });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');

        try {
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
            formData.append('price', courseData.courseType === 'free' ? 0 : courseData.price);
            formData.append('is_free', courseData.courseType === 'free');
            formData.append('category', courseData.category);
            formData.append('duration', courseData.duration);
            formData.append('level', courseData.level);
            if (courseData.thumbnail) {
                formData.append('thumbnail', courseData.thumbnail);
            }

            // ... rest of the code ...
        } catch (error) {
            console.error('Error submitting course:', error);
            setError('Failed to submit course. Please try again later.');
            setLoading(false);
        }
    };

    // Render loading state
    if (loading.all) {
        return (
            <Flex direction="column" minH="100vh">
                <Navbar />
                <Flex justify="center" align="center" flex="1" p={8}>
                    <VStack spacing={6}>
                        <Spinner size="xl" thickness="4px" speed="0.65s" color="blue.500" />
                        <Text color="gray.600">Loading courses...</Text>
                    </VStack>
                </Flex>
                <Footer />
            </Flex>
        );
    }

    // Render error state
    if (error) {
        return (
            <Flex direction="column" minH="100vh">
                <Navbar />
                <Flex justify="center" align="center" flex="1" p={8}>
                    <VStack spacing={6} maxW="lg" textAlign="center">
                        <Text color="red.500" fontSize="xl" fontWeight="bold">
                            {error}
                        </Text>
                        <Text color="gray.600">
                            We're having trouble connecting to our servers. This could be due to network issues or server maintenance.
                        </Text>
                        <Button 
                            colorScheme="blue" 
                            onClick={handleRetry}
                            leftIcon={<Icon as={FaGraduationCap} />}
                        >
                            Try Again
                        </Button>
                    </VStack>
                </Flex>
                <Footer />
            </Flex>
        );
    }

    return (
        <Flex direction="column" minH="100vh">
            <Navbar />
            
            <Box 
                bg={mainGradient}
                flex="1"
                py={8}
            >
                <Container maxW="container.xl">
                    <VStack spacing={16} align="stretch">
                        {/* Hero Section */}
                        <Box textAlign="center">
                            <Box w="100%" mb={8}>
                                <QuoteSlider />
                            </Box>
                        </Box>

                        {/* Categories Section with enhanced styling */}
                        <Box 
                            bg={cardBg}
                            p={8}
                            borderRadius="xl"
                            boxShadow="xl"
                            position="relative"
                            _before={{
                                content: '""',
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                right: 0,
                                height: '4px',
                                background: 'linear-gradient(to right, blue.400, purple.400)',
                                borderTopRadius: 'xl',
                            }}
                        >
                            <HStack spacing={4} mb={6} align="center">
                                <Icon as={FaBookReader} w={8} h={8} color="blue.400" />
                                <Heading size="lg">Browse Categories</Heading>
                            </HStack>
                            <Menu>
                                <MenuButton
                                    as={Button}
                                    rightIcon={<ChevronDownIcon />}
                                    colorScheme="blue"
                                    size="lg"
                                    width="200px"
                                    bg="blue.400"
                                    _hover={{ bg: 'blue.500' }}
                                >
                                    {selectedCategory || 'All Categories'}
                                </MenuButton>
                                <MenuList>
                                    <MenuItem onClick={() => handleCategoryClick('')}>All Categories</MenuItem>
                                    <MenuItem onClick={() => handleCategoryClick('Computer Science')}>
                                        <HStack>
                                            <Icon as={FaLaptop} />
                                            <Text>Computer Science</Text>
                                        </HStack>
                                    </MenuItem>
                                    <MenuItem onClick={() => handleCategoryClick('Personal Development')}>
                                        <HStack>
                                            <Icon as={FaBrain} />
                                            <Text>Personal Development</Text>
                                        </HStack>
                                    </MenuItem>
                                    <MenuItem onClick={() => handleCategoryClick('Business')}>
                                        <HStack>
                                            <Icon as={FaBusinessTime} />
                                            <Text>Business</Text>
                                        </HStack>
                                    </MenuItem>
                                    <MenuItem onClick={() => handleCategoryClick('Free Certificates')}>Free Certificates</MenuItem>
                                    <MenuItem onClick={() => handleCategoryClick('Design')}>Design</MenuItem>
                                    <MenuItem onClick={() => handleCategoryClick('Marketing')}>Marketing</MenuItem>
                                    <MenuItem onClick={() => handleCategoryClick('Language')}>Language</MenuItem>
                                </MenuList>
                            </Menu>
                        </Box>

                        {/* Recently Added Courses Section */}
                        <Box 
                            bg={cardBg}
                            p={8}
                            borderRadius="xl"
                            boxShadow="xl"
                            position="relative"
                            overflow="hidden"
                            _before={{
                                content: '""',
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                right: 0,
                                height: '4px',
                                background: 'linear-gradient(to right, green.400, teal.400)',
                                borderTopRadius: 'xl',
                            }}
                        >
                            <HStack spacing={4} mb={6} align="center">
                                <Icon as={FaCertificate} w={8} h={8} color="green.400" />
                                <Heading size="lg">Recently Added Courses</Heading>
                                <Badge colorScheme="green" fontSize="0.8em" p={2} borderRadius="full">
                                    NEW
                                </Badge>
                            </HStack>
                            {courses.recentlyAdded.length > 0 ? (
                                <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
                                    {courses.recentlyAdded.map((course) => (
                                        <CourseCard key={course.id} course={course} />
                                    ))}
                                </SimpleGrid>
                            ) : (
                                <Text color="gray.600">No courses available at this time.</Text>
                            )}
                        </Box>

                        {/* Enrolled Courses Section */}
                        <Box 
                            bg={cardBg}
                            p={8}
                            borderRadius="xl"
                            boxShadow="xl"
                            position="relative"
                            _before={{
                                content: '""',
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                right: 0,
                                height: '4px',
                                background: 'linear-gradient(to right, purple.400, pink.400)',
                                borderTopRadius: 'xl',
                            }}
                        >
                            <HStack spacing={4} mb={6} align="center">
                                <Icon as={FaChalkboardTeacher} w={8} h={8} color="purple.400" />
                                <Heading size="lg">Your Learning Journey</Heading>
                                <Badge colorScheme="purple" fontSize="0.8em" p={2} borderRadius="full">
                                    {courses.enrolled.length} Courses
                                </Badge>
                            </HStack>
                            {courses.enrolled.length > 0 ? (
                                <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
                                    {courses.enrolled.map((course) => (
                                        <CourseCard key={course.id} course={course} />
                                    ))}
                                </SimpleGrid>
                            ) : (
                                <Flex 
                                    direction="column" 
                                    align="center" 
                                    p={8} 
                                    bg={emptyStateBg}
                                    borderRadius="lg"
                                >
                                    <Icon as={FaGraduationCap} w={12} h={12} color="gray.400" mb={4} />
                                    <Text color="gray.600" fontSize="lg" mb={4}>
                                        You haven't enrolled in any courses yet.
                                    </Text>
                                    <Button 
                                        colorScheme="purple" 
                                        leftIcon={<Icon as={FaBookReader} />}
                                        onClick={() => navigate('/courses')}
                                    >
                                        Browse Courses
                                    </Button>
                                </Flex>
                            )}
                        </Box>

                        {/* Recommended Courses Section */}
                        <Box 
                            bg={cardBg}
                            p={8}
                            borderRadius="xl"
                            boxShadow="xl"
                            position="relative"
                            _before={{
                                content: '""',
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                right: 0,
                                height: '4px',
                                background: 'linear-gradient(to right, orange.400, red.400)',
                                borderTopRadius: 'xl',
                            }}
                        >
                            <HStack spacing={4} mb={6} align="center">
                                <Icon as={StarIcon} w={8} h={8} color="orange.400" />
                                <Heading size="lg">Recommended For You</Heading>
                                <Badge colorScheme="orange" fontSize="0.8em" p={2} borderRadius="full">
                                    Personalized
                                </Badge>
                            </HStack>
                            {courses.recommended.length > 0 ? (
                                <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
                                    {courses.recommended.map((course) => (
                                        <CourseCard key={course.id} course={course} />
                                    ))}
                                </SimpleGrid>
                            ) : (
                                <Text color="gray.600">No recommendations available at this time.</Text>
                            )}
                        </Box>
                    </VStack>
                </Container>
            </Box>
            
            <Footer />
        </Flex>
    );
};

export default StudentDashboard; 