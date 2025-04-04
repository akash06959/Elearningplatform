import React, { useState, useContext, useEffect } from 'react';
import {
    Box,
    Container,
    Heading,
    SimpleGrid,
    Stat,
    StatLabel,
    StatNumber,
    StatHelpText,
    VStack,
    HStack,
    Text,
    Button,
    useColorModeValue,
    Icon,
    useToast,
    Spinner,
    Alert,
    AlertIcon,
    AlertTitle,
    AlertDescription,
} from '@chakra-ui/react';
import { Link } from 'react-router-dom';
import { FaChalkboardTeacher, FaUsers, FaBook, FaChartLine } from 'react-icons/fa';
import { AuthContext } from '../../contexts/AuthContext';
import { courseAPI } from '../../services/api';

const StatCard = ({ title, value, icon, helpText }) => {
    const bgColor = useColorModeValue('white', 'gray.700');
    const textColor = useColorModeValue('gray.600', 'gray.200');

    return (
        <Box p={6} bg={bgColor} borderRadius="lg" boxShadow="sm">
            <HStack spacing={4}>
                <Icon as={icon} w={8} h={8} color="blue.500" />
                <Stat>
                    <StatLabel color={textColor}>{title}</StatLabel>
                    <StatNumber fontSize="3xl">{value}</StatNumber>
                    {helpText && (
                        <StatHelpText color={textColor}>{helpText}</StatHelpText>
                    )}
                </Stat>
            </HStack>
        </Box>
    );
};

const InstructorDashboard = () => {
    const [stats, setStats] = useState({
        totalCourses: 0,
        totalStudents: 0,
        activeEnrollments: 0,
        totalRevenue: 0,
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { user } = useContext(AuthContext);
    const bgColor = useColorModeValue('gray.50', 'gray.800');
    const toast = useToast();

    useEffect(() => {
        const fetchStats = async () => {
            try {
                setLoading(true);
                setError(null);
                console.log('Fetching instructor stats...');
                console.log('Current user:', user);
                
                const courses = await courseAPI.getInstructorCourses();
                console.log('Received courses:', courses);
                
                if (!Array.isArray(courses)) {
                    throw new Error('Invalid response format from server');
                }
                
                // Calculate stats from courses
                const totalStudents = courses.reduce((acc, course) => acc + (course.total_students || 0), 0);
                const activeEnrollments = courses.reduce((acc, course) => acc + (course.active_enrollments || 0), 0);
                const totalRevenue = courses.reduce((acc, course) => acc + (course.revenue || 0), 0);

                setStats({
                    totalCourses: courses.length,
                    totalStudents,
                    activeEnrollments,
                    totalRevenue,
                });
            } catch (err) {
                console.error('Error fetching instructor stats:', err);
                setError(err.message || 'Failed to fetch instructor statistics');
                toast({
                    title: 'Error',
                    description: err.message || 'Failed to load dashboard statistics',
                    status: 'error',
                    duration: 5000,
                    isClosable: true,
                });
            } finally {
                setLoading(false);
            }
        };

        if (user?.role === 'instructor') {
            fetchStats();
        } else {
            console.log('User is not an instructor:', user);
            setError('Access denied. You must be an instructor to view this dashboard.');
            setLoading(false);
        }
    }, [user, toast]);

    if (loading) {
        return (
            <Box minH="100vh" bg={bgColor} py={8}>
                <Container maxW="container.xl">
                    <VStack spacing={4} align="center">
                        <Spinner size="xl" color="blue.500" thickness="4px" />
                        <Text fontSize="lg">Loading your dashboard...</Text>
                    </VStack>
                </Container>
            </Box>
        );
    }

    if (error) {
        return (
            <Box minH="100vh" bg={bgColor} py={8}>
                <Container maxW="container.xl">
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
                            Dashboard Error
                        </AlertTitle>
                        <AlertDescription maxWidth="sm">
                            {error}
                        </AlertDescription>
                        <Button
                            mt={4}
                            colorScheme="red"
                            onClick={() => window.location.reload()}
                        >
                            Try Again
                        </Button>
                    </Alert>
                </Container>
            </Box>
        );
    }

    return (
        <Box bg={bgColor} minH="100vh" py={8}>
            <Container maxW="container.xl">
                <VStack spacing={8} align="stretch">
                    {/* Welcome Section */}
                    <Box>
                        <Heading size="lg" mb={2}>
                            Welcome back, {user?.username || 'Instructor'}!
                        </Heading>
                        <Text color="gray.600">
                            Here's an overview of your teaching activity
                        </Text>
                    </Box>

                    {/* Stats Grid */}
                    <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={6}>
                        <StatCard
                            title="Total Courses"
                            value={stats.totalCourses}
                            icon={FaBook}
                            helpText="Published and drafts"
                        />
                        <StatCard
                            title="Total Students"
                            value={stats.totalStudents}
                            icon={FaUsers}
                            helpText="Across all courses"
                        />
                        <StatCard
                            title="Active Enrollments"
                            value={stats.activeEnrollments}
                            icon={FaChalkboardTeacher}
                            helpText="Currently learning"
                        />
                        <StatCard
                            title="Total Revenue"
                            value={`$${stats.totalRevenue.toFixed(2)}`}
                            icon={FaChartLine}
                            helpText="All time earnings"
                        />
                    </SimpleGrid>

                    {/* Quick Actions */}
                    <Box>
                        <Heading size="md" mb={4}>
                            Quick Actions
                        </Heading>
                        <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={4}>
                            <Button
                                as={Link}
                                to="/instructor/create-course"
                                colorScheme="blue"
                                size="lg"
                                leftIcon={<Icon as={FaBook} />}
                            >
                                Create New Course
                            </Button>
                            <Button
                                as={Link}
                                to="/instructor/courses"
                                colorScheme="teal"
                                size="lg"
                                leftIcon={<Icon as={FaChalkboardTeacher} />}
                            >
                                Manage Courses
                            </Button>
                            <Button
                                as={Link}
                                to="/instructor/analytics"
                                colorScheme="purple"
                                size="lg"
                                leftIcon={<Icon as={FaChartLine} />}
                            >
                                View Analytics
                            </Button>
                            <Button
                                as={Link}
                                to="/instructor/students"
                                colorScheme="orange"
                                size="lg"
                                leftIcon={<Icon as={FaUsers} />}
                            >
                                Student Overview
                            </Button>
                        </SimpleGrid>
                    </Box>
                </VStack>
            </Container>
        </Box>
    );
};

export default InstructorDashboard; 