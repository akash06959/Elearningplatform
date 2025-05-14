import React, { useState, useEffect } from 'react';
import {
    Box,
    Container,
    SimpleGrid,
    Text,
    Heading,
    VStack,
    Avatar,
    Badge,
    useColorModeValue,
    Flex,
    Spinner,
    Card,
    CardBody,
    Stack,
    Button,
    Accordion,
    AccordionItem,
    AccordionButton,
    AccordionPanel,
    AccordionIcon,
    Divider,
    HStack,
    useToast,
} from '@chakra-ui/react';
import { useLocation, Link } from 'react-router-dom';
import axios from 'axios';
import Navbar from '../shared/Navbar';
import Footer from '../shared/Footer';
import { FaChalkboardTeacher, FaUserGraduate, FaStar, FaBook } from 'react-icons/fa';
import { AuthContext } from '../../contexts/AuthContext';
import { useContext } from 'react';

// Mock data for instructors
const MOCK_INSTRUCTORS = [
    {
        id: 1,
        username: 'prof_johnson',
        name: 'Dr. Amanda Johnson',
        profile_picture: 'https://randomuser.me/api/portraits/women/44.jpg',
        title: 'Computer Science Professor',
        bio: 'Experienced educator with 15+ years teaching computer science and programming concepts. Specialized in Python, Java, and data structures.',
        total_courses: 12,
        total_students: 2450,
        rating: 4.8,
        courses: [
            {
                id: 101,
                title: 'Python for Beginners',
                description: 'A comprehensive introduction to Python programming language basics and fundamental concepts.',
                category: { name: 'Computer Science' },
                difficulty: 'Beginner',
                price: 0,
                total_students: 1200,
                rating: 4.7
            },
            {
                id: 102,
                title: 'Advanced Data Structures',
                description: 'Deep dive into complex data structures and algorithms with practical implementations.',
                category: { name: 'Computer Science' },
                difficulty: 'Advanced',
                price: 59.99,
                total_students: 850,
                rating: 4.9
            }
        ]
    },
    {
        id: 2,
        username: 'business_guru',
        name: 'Michael Chen',
        profile_picture: 'https://randomuser.me/api/portraits/men/32.jpg',
        title: 'Business Strategist & Entrepreneur',
        bio: 'Former Fortune 500 executive with expertise in business strategy, marketing, and entrepreneurship.',
        total_courses: 8,
        total_students: 1870,
        rating: 4.6,
        courses: [
            {
                id: 201,
                title: 'Business Strategy Fundamentals',
                description: 'Learn how to develop effective business strategies for competitive advantage in today\'s market.',
                category: { name: 'Business' },
                difficulty: 'Intermediate',
                price: 49.99,
                total_students: 940,
                rating: 4.5
            },
            {
                id: 202,
                title: 'Startup Essentials',
                description: 'Everything you need to know to launch and grow a successful startup from scratch.',
                category: { name: 'Business' },
                difficulty: 'All Levels',
                price: 69.99,
                total_students: 730,
                rating: 4.7
            }
        ]
    },
    {
        id: 3,
        username: 'design_master',
        name: 'Sarah Williams',
        profile_picture: 'https://randomuser.me/api/portraits/women/68.jpg',
        title: 'Senior UX/UI Designer',
        bio: 'Award-winning designer with experience at top tech companies. Passionate about creating beautiful and functional interfaces.',
        total_courses: 5,
        total_students: 2100,
        rating: 4.9,
        courses: [
            {
                id: 301,
                title: 'UI Design Principles',
                description: 'Master the fundamentals of UI design with practical examples and real-world projects.',
                category: { name: 'Design' },
                difficulty: 'Beginner',
                price: 39.99,
                total_students: 1250,
                rating: 4.8
            },
            {
                id: 302,
                title: 'Advanced UX Research Methods',
                description: 'Learn cutting-edge UX research techniques to create user-centered designs that delight customers.',
                category: { name: 'Design' },
                difficulty: 'Advanced',
                price: 79.99,
                total_students: 850,
                rating: 4.9
            }
        ]
    }
];

const InstructorCourseItem = ({ course }) => {
    return (
        <Box 
            p={4} 
            bg="white" 
            borderRadius="md" 
            boxShadow="sm"
            _hover={{ boxShadow: "md", transform: "translateY(-2px)", transition: "all 0.2s" }}
        >
            <Flex align="center" mb={2}>
                <Box flex="1">
                    <Heading as="h4" size="sm">{course.title}</Heading>
                    <Text fontSize="sm" color="gray.600" mt={1}>
                        {course.category?.name || 'Uncategorized'} • {course.difficulty || 'All Levels'}
                    </Text>
                </Box>
                {course.price > 0 ? (
                    <Badge colorScheme="green">${course.price}</Badge>
                ) : (
                    <Badge colorScheme="purple">Free</Badge>
                )}
            </Flex>
            
            <Text noOfLines={2} fontSize="sm" color="gray.700" mb={3}>
                {course.description}
            </Text>
            
            <HStack spacing={3} mt={2}>
                <Badge colorScheme="blue">{course.total_students || 0} students</Badge>
                {course.rating && (
                    <Badge colorScheme="yellow">
                        <Flex align="center">
                            <FaStar size="0.7em" style={{ marginRight: '4px' }} />
                            {course.rating.toFixed(1)}
                        </Flex>
                    </Badge>
                )}
            </HStack>
            
            <Button 
                as={Link} 
                to={`/courses/${course.id}`}
                size="sm" 
                mt={3} 
                colorScheme="blue" 
                variant="outline"
                width="100%"
            >
                View Course
            </Button>
        </Box>
    );
};

const InstructorCard = ({ instructor, expanded }) => {
    const cardBg = useColorModeValue('white', 'gray.700');
    const [instructorCourses, setInstructorCourses] = useState([]);
    const [loadingCourses, setLoadingCourses] = useState(false);
    const [error, setError] = useState(null);
    const { authTokens } = useContext(AuthContext);
    const toast = useToast();
    
    // Load courses when accordion is expanded
    useEffect(() => {
        if (expanded) {
            const fetchInstructorCourses = async () => {
                setLoadingCourses(true);
                
                try {
                    // Configure with auth token for authenticated requests
                    const headers = {};
                    if (authTokens?.access) {
                        headers['Authorization'] = `Bearer ${authTokens.access}`;
                    }
                    
                    // Fetch courses for this instructor
                    const response = await axios.get(
                        `http://localhost:8000/api/courses/list/?instructor=${instructor.id}`, 
                        { headers }
                    );
                    
                    if (response.data && (response.data.results || response.data)) {
                        const courses = response.data.results || response.data;
                        setInstructorCourses(courses);
                        console.log('Fetched courses for instructor:', courses);
                    } else {
                        // Fallback to mock data if no course data available
                        setInstructorCourses(instructor.courses || []);
                    }
                } catch (err) {
                    console.error('Error fetching instructor courses:', err);
                    // Fallback to mock data on error
                    setInstructorCourses(instructor.courses || []);
                    toast({
                        title: 'Note',
                        description: 'Using sample course data for this instructor.',
                        status: 'info',
                        duration: 3000,
                        isClosable: true,
                    });
                } finally {
                    setLoadingCourses(false);
                }
            };
            
            fetchInstructorCourses();
        }
    }, [expanded, instructor.id, instructor.courses, authTokens, toast]);
    
    return (
        <Accordion allowToggle defaultIndex={expanded ? 0 : -1}>
            <AccordionItem border="none">
                <Card bg={cardBg} shadow="lg" _hover={{ transform: 'translateY(-5px)', transition: '0.2s' }}>
                    <CardBody>
                        <VStack spacing={4} align="stretch">
                            <Flex align="center" gap={4}>
                                <Avatar 
                                    size="xl" 
                                    name={instructor.name || instructor.username}
                                    src={instructor.profile_picture}
                                />
                                <Stack spacing={2} flex="1">
                                    <Heading size="md">{instructor.name || instructor.username}</Heading>
                                    <Text color="gray.500">{instructor.title || 'Course Instructor'}</Text>
                                    <Flex gap={2} wrap="wrap">
                                        <Badge colorScheme="blue" display="flex" alignItems="center">
                                            <FaBook style={{ marginRight: '4px' }} />
                                            {instructor.total_courses} Courses
                                        </Badge>
                                        <Badge colorScheme="green" display="flex" alignItems="center">
                                            <FaUserGraduate style={{ marginRight: '4px' }} />
                                            {instructor.total_students} Students
                                        </Badge>
                                        {instructor.rating && (
                                            <Badge colorScheme="yellow" display="flex" alignItems="center">
                                                <FaStar style={{ marginRight: '4px' }} />
                                                {instructor.rating.toFixed(1)}
                                            </Badge>
                                        )}
                                    </Flex>
                                </Stack>
                                <AccordionButton 
                                    as={Button} 
                                    rightIcon={<AccordionIcon />}
                                    colorScheme="blue"
                                    variant="outline"
                                    size="sm"
                                    width="auto"
                                >
                                    Courses
                                </AccordionButton>
                            </Flex>
                            
                            <Text fontSize="sm" color="gray.700">
                                {instructor.bio || 'Passionate about teaching and sharing knowledge'}
                            </Text>
                            
                            <AccordionPanel pb={4} px={0}>
                                <Divider my={4} />
                                <Heading size="sm" mb={4}>Courses by {instructor.name || instructor.username}</Heading>
                                
                                {loadingCourses ? (
                                    <Flex justify="center" py={4}>
                                        <Spinner size="md" />
                                    </Flex>
                                ) : error ? (
                                    <Text color="red.500">{error}</Text>
                                ) : instructorCourses.length === 0 ? (
                                    <Text color="gray.500">No courses available from this instructor.</Text>
                                ) : (
                                    <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                                        {instructorCourses.map(course => (
                                            <InstructorCourseItem key={course.id} course={course} />
                                        ))}
                                    </SimpleGrid>
                                )}
                            </AccordionPanel>
                        </VStack>
                    </CardBody>
                </Card>
            </AccordionItem>
        </Accordion>
    );
};

const InstructorList = () => {
    const [instructors, setInstructors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [usedMockData, setUsedMockData] = useState(false);
    const location = useLocation();
    const bgColor = useColorModeValue('gray.50', 'gray.800');
    const toast = useToast();
    const { authTokens } = useContext(AuthContext);

    const getPageTitle = () => {
        const path = location.pathname;
        if (path === '/instructors/featured') return 'Featured Instructors';
        if (path === '/instructors/top') return 'Top Rated Instructors';
        return 'All Instructors';
    };

    useEffect(() => {
        const fetchInstructors = async () => {
            setLoading(true);
            
            try {
                // Configure with auth token for authenticated requests
                const headers = {};
                if (authTokens?.access) {
                    headers['Authorization'] = `Bearer ${authTokens.access}`;
                }
                
                // Use the correct endpoint path but remove the trailing slash
                let endpoint = '/api/accounts/instructors';
                if (location.pathname === '/instructors/featured') {
                    endpoint = '/api/accounts/instructors/featured';
                } else if (location.pathname === '/instructors/top') {
                    endpoint = '/api/accounts/instructors/top-rated';
                }
                
                console.log('Attempting to fetch instructors from:', endpoint);
                console.log('With headers:', headers);
                
                try {
                    // Test if the server is reachable at all
                    await axios.get('http://localhost:8000/api/csrf-token/');
                    console.log('Server is reachable');
                } catch (serverError) {
                    console.error('Server connection error:', serverError.message);
                    throw new Error('Backend server is not reachable. Please check if it is running.');
                }
                
                // Now try the actual instructors endpoint
                const response = await axios.get(`http://localhost:8000${endpoint}`, { headers });
                
                if (response.data) {
                    console.log('Instructors fetched successfully:', response.data);
                    setInstructors(response.data);
                    setUsedMockData(false);
                } else {
                    throw new Error('No instructor data received');
                }
            } catch (error) {
                console.error('Error details:', {
                    message: error.message,
                    response: error.response?.data,
                    status: error.response?.status,
                });
                
                // Try one more alternative endpoint format
                try {
                    const altEndpoint = '/api/instructors';
                    console.log('Trying alternative endpoint:', altEndpoint);
                    const altResponse = await axios.get(`http://localhost:8000${altEndpoint}`, { 
                        headers: authTokens?.access ? { 'Authorization': `Bearer ${authTokens.access}` } : {} 
                    });
                    
                    if (altResponse.data) {
                        console.log('Alternative endpoint succeeded:', altResponse.data);
                        setInstructors(altResponse.data);
                        setUsedMockData(false);
                        return;
                    }
                } catch (altError) {
                    console.log('Alternative endpoint also failed:', altError.message);
                }
                
                // Fall back to mock data
                console.log('All API attempts failed, using mock data');
                setInstructors(MOCK_INSTRUCTORS);
                setUsedMockData(true);
                
                // Show more specific error message
                const errorMessage = error.response?.status === 404 
                    ? 'API endpoint not found (404). Check your backend URL configuration.'
                    : error.response?.status === 401 
                        ? 'Authentication error (401). Please check your login status.'
                        : `API error: ${error.message}`;
                
                toast({
                    title: 'Using sample data',
                    description: errorMessage,
                    status: 'info',
                    duration: 5000,
                    isClosable: true,
                });
            } finally {
                setLoading(false);
            }
        };

        fetchInstructors();
    }, [location.pathname, authTokens, toast]);

    if (loading) {
        return (
            <Flex direction="column" minH="100vh">
                <Navbar />
                <Flex flex="1" justify="center" align="center">
                    <VStack spacing={4}>
                        <Spinner size="xl" thickness="4px" color="blue.500" />
                        <Text>Loading instructors...</Text>
                    </VStack>
                </Flex>
                <Footer />
            </Flex>
        );
    }

    return (
        <Flex direction="column" minH="100vh">
            <Navbar />
            <Box flex="1" bg={bgColor} py={8}>
                <Container maxW="container.xl">
                    <VStack spacing={8} align="stretch">
                        <Heading textAlign="center" color="blue.600">
                            <Flex align="center" justify="center">
                                <FaChalkboardTeacher style={{ marginRight: '12px' }} />
                                {getPageTitle()}
                            </Flex>
                        </Heading>
                        
                        {usedMockData && (
                            <Box 
                                p={3} 
                                bg="blue.50" 
                                color="blue.600" 
                                borderRadius="md" 
                                fontSize="sm"
                                textAlign="center"
                            >
                                <Text>
                                    Note: Using sample instructor data. Connect to a valid API endpoint to show real instructors.
                                </Text>
                            </Box>
                        )}
                        
                        {instructors.length === 0 ? (
                            <Card p={6} textAlign="center">
                                <Text color="gray.500" fontSize="lg">
                                    No instructors found.
                                </Text>
                            </Card>
                        ) : (
                            <VStack spacing={6} align="stretch">
                                {instructors.map((instructor, index) => (
                                    <InstructorCard 
                                        key={instructor.id} 
                                        instructor={instructor} 
                                        expanded={index === 0}
                                    />
                                ))}
                            </VStack>
                        )}
                    </VStack>
                </Container>
            </Box>
            <Footer />
        </Flex>
    );
};

export default InstructorList; 