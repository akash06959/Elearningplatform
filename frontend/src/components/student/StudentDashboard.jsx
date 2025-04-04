import React, { useState, useEffect } from 'react';
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

const CategoryButton = ({ icon, text, href, ...props }) => (
    <Button
        as={Link}
        to={href}
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
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();
    const bgColor = useColorModeValue('gray.50', 'gray.800');

    useEffect(() => {
        const fetchCourses = async () => {
            try {
                setLoading(true);
                setError(null);

                // Fetch all courses first
                const allCourses = await courseAPI.getCourses();
                console.log('All courses fetched:', allCourses);

                // Ensure allCourses is an array
                const coursesArray = Array.isArray(allCourses) ? allCourses : [];
                console.log('Courses array:', coursesArray);

                if (coursesArray.length === 0) {
                    console.log('No courses available');
                    setCourses({
                        recentlyAdded: [],
                        enrolled: [],
                        recommended: []
                    });
                    return;
                }

                // Get recently added courses (already sorted by created_at)
                const recentlyAdded = await courseAPI.getRecentCourses();
                console.log('Recently added courses fetched:', recentlyAdded);

                // Get enrolled courses
                const enrolled = await courseAPI.getEnrolledCourses();
                console.log('Enrolled courses fetched:', enrolled);

                // Get random courses for recommendations
                // Filter out enrolled courses from recommendations
                const enrolledIds = new Set((enrolled || []).map(course => course.id));
                const availableCourses = coursesArray.filter(course => !enrolledIds.has(course.id));
                console.log('Available courses for recommendations:', availableCourses);

                const recommended = availableCourses
                    .sort(() => Math.random() - 0.5)
                    .slice(0, 3); // Get up to 3 random courses
                console.log('Selected recommended courses:', recommended);

                // Set the courses state
                setCourses({
                    recentlyAdded: Array.isArray(recentlyAdded) ? recentlyAdded : [],
                    enrolled: Array.isArray(enrolled) ? enrolled : [],
                    recommended: Array.isArray(recommended) ? recommended : []
                });
            } catch (err) {
                console.error('Error in fetchCourses:', err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchCourses();
    }, []);

    const handleSearch = (e) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            navigate(`/courses?search=${encodeURIComponent(searchQuery.trim())}`);
        }
    };

    if (loading) {
        return (
            <Flex direction="column" minH="100vh">
                <Navbar />
                <Flex justify="center" align="center" flex="1">
                    <Spinner size="xl" />
                </Flex>
                <Footer />
            </Flex>
        );
    }

    if (error) {
        return (
            <Flex direction="column" minH="100vh">
                <Navbar />
                <Flex justify="center" align="center" flex="1">
                    <Text color="red.500">Error: {error}</Text>
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
                                    href="/courses/certificates"
                                    colorScheme="blue"
                                />
                                <CategoryButton
                                    icon={FaLaptop}
                                    text="Computer Science"
                                    href="/courses/cs"
                                    colorScheme="teal"
                                />
                                <CategoryButton
                                    icon={FaBrain}
                                    text="Personal Development"
                                    href="/courses/development"
                                    colorScheme="purple"
                                />
                                <CategoryButton
                                    icon={FaBusinessTime}
                                    text="Business"
                                    href="/courses/business"
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