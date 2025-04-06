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
} from '@chakra-ui/react';
import { SearchIcon } from '@chakra-ui/icons';
import {
    FaGraduationCap,
    FaLaptop,
    FaBrain,
    FaBusinessTime,
} from 'react-icons/fa';
import { Link, useNavigate } from 'react-router-dom';
import { courseAPI } from '../../services/api';
import CourseCard from '../courses/CourseCard';
import Navbar from '../shared/Navbar';
import Footer from '../shared/Footer';
import { enrollmentAPI } from '../../services/api';

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
    const navigate = useNavigate();
    const bgColor = useColorModeValue('gray.50', 'gray.800');
    const toast = useToast();

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

    const handleCategoryClick = (category) => {
        // Use startTransition for navigation
        React.startTransition(() => {
            navigate(`/courses?category=${encodeURIComponent(category)}`);
        });
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
            
            <Box bg={bgColor} flex="1">
                <Container maxW="container.xl" py={8}>
                    <VStack spacing={12} align="stretch">
                        {/* Hero Section */}
                        <Box textAlign="center" py={10}>
                            <Heading as="h1" size="2xl" mb={6}>
                                Find your next course
                            </Heading>
                            <Box maxW="800px" mx="auto">
                                <form onSubmit={handleSearch}>
                                    <InputGroup size="lg">
                                        <InputLeftElement pointerEvents="none">
                                            <SearchIcon color="gray.400" />
                                        </InputLeftElement>
                                        <Input
                                            placeholder="Search courses..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            bg="white"
                                            borderRadius="full"
                                            boxShadow="sm"
                                        />
                                    </InputGroup>
                                </form>
                            </Box>
                        </Box>

                        {/* Categories Section */}
                        <Box>
                            <Heading size="lg" mb={6}>
                                Browse Categories
                            </Heading>
                            <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={6}>
                                <CategoryButton
                                    icon={FaGraduationCap}
                                    text="Free Certificates"
                                    onClick={() => handleCategoryClick('certificates')}
                                    colorScheme="blue"
                                />
                                <CategoryButton
                                    icon={FaLaptop}
                                    text="Computer Science"
                                    onClick={() => handleCategoryClick('computer-science')}
                                    colorScheme="teal"
                                />
                                <CategoryButton
                                    icon={FaBrain}
                                    text="Personal Development"
                                    onClick={() => handleCategoryClick('personal-development')}
                                    colorScheme="purple"
                                />
                                <CategoryButton
                                    icon={FaBusinessTime}
                                    text="Business"
                                    onClick={() => handleCategoryClick('business')}
                                    colorScheme="orange"
                                />
                            </SimpleGrid>
                        </Box>

                        {/* Recently Added Courses - Always show this section */}
                        <Box>
                            <Heading size="lg" mb={6}>
                                Recently Added Courses
                            </Heading>
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

                        {/* Enrolled Courses - Always show this section */}
                        <Box>
                            <Heading size="lg" mb={6}>
                                Your Enrolled Courses
                            </Heading>
                            {courses.enrolled.length > 0 ? (
                                <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
                                    {courses.enrolled.map((course) => (
                                        <CourseCard key={course.id} course={course} />
                                    ))}
                                </SimpleGrid>
                            ) : (
                                <Text color="gray.600">You haven't enrolled in any courses yet.</Text>
                            )}
                        </Box>

                        {/* Recommended Courses - Always show this section */}
                        <Box>
                            <Heading size="lg" mb={6}>
                                Recommended For You
                            </Heading>
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