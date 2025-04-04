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
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalCloseButton,
    Table,
    Thead,
    Tbody,
    Tr,
    Th,
    Td,
    useDisclosure,
} from '@chakra-ui/react';
import { Link } from 'react-router-dom';
import { FaChalkboardTeacher, FaUsers, FaBook, FaChartLine, FaTrash } from 'react-icons/fa';
import { AuthContext } from '../../contexts/AuthContext';
import { courseAPI } from '../../services/api';

const StatCard = ({ title, value, icon, helpText, onClick }) => {
    const bgColor = useColorModeValue('white', 'gray.700');
    const textColor = useColorModeValue('gray.600', 'gray.200');

    return (
        <Box 
            p={6} 
            bg={bgColor} 
            borderRadius="lg" 
            boxShadow="sm" 
            cursor="pointer"
            onClick={onClick}
            _hover={{ transform: 'translateY(-2px)', boxShadow: 'md' }}
            transition="all 0.2s"
        >
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

    // Modal states
    const [selectedView, setSelectedView] = useState(null);
    const [detailData, setDetailData] = useState([]);
    const { isOpen, onOpen, onClose } = useDisclosure();

    // Fetch detailed data based on selection
    const fetchDetailData = async (type) => {
        try {
            let data = [];
            console.log('Fetching detail data for type:', type);
            
            switch (type) {
                case 'courses':
                    const courses = await courseAPI.getInstructorCourses();
                    console.log('Fetched courses:', courses);
                    data = courses.map(course => ({
                        id: course.id,
                        title: course.title,
                        status: course.is_published ? 'Published' : 'Draft',
                        students: course.total_students || 0
                    }));
                    break;
                case 'students':
                    console.log('Fetching enrolled students...');
                    const students = await courseAPI.getEnrolledStudents();
                    console.log('Fetched students:', students);
                    data = students.map(student => ({
                        id: student.id,
                        name: student.name,
                        email: student.email,
                        enrolledCourses: student.enrolled_courses || []
                    }));
                    break;
                case 'enrollments':
                    console.log('Fetching course enrollments...');
                    const enrollments = await courseAPI.getCourseEnrollments();
                    console.log('Fetched enrollments:', enrollments);
                    data = enrollments.map(enrollment => ({
                        id: enrollment.id,
                        student: enrollment.student_name,
                        course: enrollment.course_title,
                        date: new Date(enrollment.enrolled_at).toLocaleDateString()
                    }));
                    break;
                default:
                    break;
            }
            console.log('Processed data for type', type, ':', data);
            setDetailData(data);
        } catch (err) {
            console.error('Error fetching detail data:', {
                type: type,
                error: err.message,
                stack: err.stack,
                response: err.response?.data
            });
            toast({
                title: 'Error',
                description: err.message || 'Failed to fetch detailed data',
                status: 'error',
                duration: 5000,
                isClosable: true,
            });
        }
    };

    // Handle card clicks
    const handleCardClick = async (type) => {
        setSelectedView(type);
        await fetchDetailData(type);
        onOpen();
    };

    // Handle student removal
    const handleRemoveStudent = async (studentId) => {
        try {
            await courseAPI.removeStudent(studentId);
            await fetchDetailData('students');
            toast({
                title: 'Success',
                description: 'Student removed successfully',
                status: 'success',
                duration: 3000,
                isClosable: true,
            });
        } catch (err) {
            toast({
                title: 'Error',
                description: 'Failed to remove student',
                status: 'error',
                duration: 5000,
                isClosable: true,
            });
        }
    };

    // Modal content based on selection
    const renderModalContent = () => {
        switch (selectedView) {
            case 'courses':
                return (
                    <>
                        <ModalHeader>Your Courses</ModalHeader>
                        <ModalBody>
                            <Table variant="simple">
                                <Thead>
                                    <Tr>
                                        <Th>Title</Th>
                                        <Th>Status</Th>
                                        <Th>Students</Th>
                                    </Tr>
                                </Thead>
                                <Tbody>
                                    {detailData.map(course => (
                                        <Tr key={course.id}>
                                            <Td>{course.title}</Td>
                                            <Td>{course.status}</Td>
                                            <Td>{course.students}</Td>
                                        </Tr>
                                    ))}
                                </Tbody>
                            </Table>
                        </ModalBody>
                    </>
                );
            case 'students':
                return (
                    <>
                        <ModalHeader>Enrolled Students</ModalHeader>
                        <ModalBody>
                            <Table variant="simple">
                                <Thead>
                                    <Tr>
                                        <Th>Name</Th>
                                        <Th>Email</Th>
                                        <Th>Enrolled Courses</Th>
                                        <Th>Action</Th>
                                    </Tr>
                                </Thead>
                                <Tbody>
                                    {detailData.map(student => (
                                        <Tr key={student.id}>
                                            <Td>{student.name}</Td>
                                            <Td>{student.email}</Td>
                                            <Td>{student.enrolledCourses.length}</Td>
                                            <Td>
                                                <Button
                                                    size="sm"
                                                    colorScheme="red"
                                                    leftIcon={<FaTrash />}
                                                    onClick={() => handleRemoveStudent(student.id)}
                                                >
                                                    Remove
                                                </Button>
                                            </Td>
                                        </Tr>
                                    ))}
                                </Tbody>
                            </Table>
                        </ModalBody>
                    </>
                );
            case 'enrollments':
                return (
                    <>
                        <ModalHeader>Course Enrollments</ModalHeader>
                        <ModalBody>
                            <Table variant="simple">
                                <Thead>
                                    <Tr>
                                        <Th>Student</Th>
                                        <Th>Course</Th>
                                        <Th>Enrollment Date</Th>
                                    </Tr>
                                </Thead>
                                <Tbody>
                                    {detailData.map(enrollment => (
                                        <Tr key={enrollment.id}>
                                            <Td>{enrollment.student}</Td>
                                            <Td>{enrollment.course}</Td>
                                            <Td>{enrollment.date}</Td>
                                        </Tr>
                                    ))}
                                </Tbody>
                            </Table>
                        </ModalBody>
                    </>
                );
            default:
                return null;
        }
    };

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
                            onClick={() => handleCardClick('courses')}
                        />
                        <StatCard
                            title="Total Students"
                            value={stats.totalStudents}
                            icon={FaUsers}
                            helpText="Across all courses"
                            onClick={() => handleCardClick('students')}
                        />
                        <StatCard
                            title="Active Enrollments"
                            value={stats.activeEnrollments}
                            icon={FaChalkboardTeacher}
                            helpText="Currently learning"
                            onClick={() => handleCardClick('enrollments')}
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

                {/* Detail Modal */}
                <Modal isOpen={isOpen} onClose={onClose} size="xl">
                    <ModalOverlay />
                    <ModalContent>
                        <ModalCloseButton />
                        {renderModalContent()}
                    </ModalContent>
                </Modal>
            </Container>
        </Box>
    );
};

export default InstructorDashboard; 