import React, { useState, useEffect, useContext, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { courseAPI } from '../../services/api';
import {
    Box,
    Flex,
    Heading,
    Button,
    Alert,
    AlertIcon,
    AlertTitle,
    AlertDescription,
    Center,
    Spinner,
    SimpleGrid,
    useToast,
    Text
} from '@chakra-ui/react';
import { AuthContext } from '../../contexts/AuthContext';
import { AddIcon } from '@chakra-ui/icons';
import CourseCard from './CourseCard';

const InstructorCourseList = () => {
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { authTokens } = useContext(AuthContext);
    const navigate = useNavigate();
    const toast = useToast();

    const fetchCourses = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            
            const data = await courseAPI.getInstructorCourses();
            console.log('Fetched courses:', data);

            if (Array.isArray(data)) {
                setCourses(data);
            } else if (data.courses && Array.isArray(data.courses)) {
                setCourses(data.courses);
            } else {
                throw new Error('Invalid response format from server');
            }
        } catch (err) {
            console.error('Error fetching courses:', err);
            setError(err.message);
            toast({
                title: 'Error',
                description: 'Failed to fetch your courses. Please try again later.',
                status: 'error',
                duration: 5000,
                isClosable: true,
            });
        } finally {
            setLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        if (authTokens?.access) {
            fetchCourses();
        } else {
            navigate('/login');
        }
    }, [authTokens, navigate, fetchCourses]);

    const handlePublishToggle = async (courseId, currentStatus) => {
        try {
            console.log(`Toggling course ${courseId} from ${currentStatus} to ${currentStatus === 'draft' ? 'published' : 'draft'}`);
            setLoading(true);
            
            const newStatus = currentStatus === 'draft' ? 'published' : 'draft';
            const response = await courseAPI.updateCourseStatus(courseId, newStatus);
            
            if (response.status === 'success') {
                // Show success toast
                toast({
                    title: 'Success',
                    description: response.message,
                    status: 'success',
                    duration: 3000,
                    isClosable: true,
                });

                // Update the course status in the local state
                setCourses(prevCourses => 
                    prevCourses.map(course => 
                        course.id === courseId 
                            ? { 
                                ...course, 
                                is_published: newStatus === 'published',
                                status: newStatus
                              }
                            : course
                    )
                );
            } else {
                throw new Error(response.message || 'Failed to update course status');
            }
            
        } catch (error) {
            console.error('Error updating course status:', error);
            toast({
                title: 'Error',
                description: error.message || 'Failed to update course status',
                status: 'error',
                duration: 5000,
                isClosable: true,
            });
        } finally {
            setLoading(false);
            // Refresh the course list to ensure we have the latest data
            fetchCourses();
        }
    };

    const handleDelete = async (courseId) => {
        if (!window.confirm('Are you sure you want to delete this course? This action cannot be undone.')) {
            return;
        }
        
        try {
            await courseAPI.deleteCourse(courseId);
            
            // Remove from local state
            setCourses(courses.filter(course => course.id !== courseId));
            toast({
                title: 'Success',
                description: 'Course deleted successfully',
                status: 'success',
                duration: 3000,
                isClosable: true,
            });
        } catch (error) {
            console.error('Error deleting course:', error);
            toast({
                title: 'Error',
                description: error.message || 'Failed to delete course',
                status: 'error',
                duration: 5000,
                isClosable: true,
            });
        }
    };

    const getLevelBadgeColor = (level) => {
        switch (level?.toLowerCase()) {
            case 'beginner':
                return 'bg-green-100 text-green-800';
            case 'intermediate':
                return 'bg-blue-100 text-blue-800';
            case 'advanced':
                return 'bg-purple-100 text-purple-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const styles = {
        container: {
            minHeight: '100vh',
            backgroundColor: '#f9fafb',
        },
        main: {
            maxWidth: '1280px',
            margin: '0 auto',
            padding: '2.5rem 1rem',
        },
        header: {
            marginBottom: '2rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
        },
        title: {
            fontSize: '1.5rem',
            fontWeight: 'bold',
            color: '#1d4ed8',
        },
        createButton: {
            backgroundColor: '#1d4ed8',
            color: 'white',
            padding: '0.5rem 1rem',
            borderRadius: '0.375rem',
            textDecoration: 'none',
            transition: 'background-color 0.2s',
        },
        error: {
            marginBottom: '1.5rem',
            backgroundColor: '#fef2f2',
            border: '1px solid #fca5a5',
            color: '#b91c1c',
            padding: '1rem',
            borderRadius: '0.375rem',
        },
        loading: {
            display: 'flex',
            justifyContent: 'center',
            padding: '2.5rem',
        },
        emptyState: {
            backgroundColor: 'white',
            borderRadius: '0.5rem',
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
            padding: '2rem',
            textAlign: 'center',
        },
        emptyStateTitle: {
            fontSize: '1.25rem',
            fontWeight: '600',
            color: '#374151',
            marginBottom: '1rem',
        },
        emptyStateText: {
            color: '#6b7280',
            marginBottom: '1.5rem',
        },
        courseGrid: {
            display: 'grid',
            gridTemplateColumns: '1fr',
            gap: '1.5rem',
        },
        courseCard: {
            backgroundColor: 'white',
            borderRadius: '0.5rem',
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
            overflow: 'hidden',
        },
        courseContent: {
            display: 'flex',
            flexDirection: 'column',
            '@media (min-width: 768px)': {
                flexDirection: 'row',
            },
        },
        courseImageContainer: {
            padding: '1rem',
            '@media (min-width: 768px)': {
                width: '25%',
            },
        },
        courseImage: {
            width: '100%',
            height: '10rem',
            objectFit: 'cover',
            borderRadius: '0.375rem',
        },
        courseDetails: {
            padding: '1rem',
            '@media (min-width: 768px)': {
                width: '75%',
            },
        },
        courseHeader: {
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: '1rem',
        },
        courseTitle: {
            fontSize: '1.25rem',
            fontWeight: '600',
            color: '#111827',
            marginBottom: '0.5rem',
        },
        courseDescription: {
            color: '#4b5563',
            marginBottom: '1rem',
        },
        courseStats: {
            display: 'flex',
            gap: '2rem',
            marginBottom: '1rem',
        },
        courseStat: {
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            color: '#6b7280',
        },
        courseActions: {
            display: 'flex',
            gap: '1rem',
            marginTop: '1rem',
            padding: '1rem',
            borderTop: '1px solid #e5e7eb',
        },
        actionButton: {
            padding: '0.5rem 1rem',
            borderRadius: '0.375rem',
            fontSize: '0.875rem',
            fontWeight: '500',
            cursor: 'pointer',
            border: 'none',
        },
        editButton: {
            backgroundColor: '#1d4ed8',
            color: 'white',
            textDecoration: 'none',
        },
        publishButton: {
            backgroundColor: '#059669',
            color: 'white',
        },
        unpublishButton: {
            backgroundColor: '#dc2626',
            color: 'white',
        },
        deleteButton: {
            backgroundColor: '#dc2626',
            color: 'white',
        },
        badge: {
            padding: '0.25rem 0.75rem',
            borderRadius: '9999px',
            fontSize: '0.75rem',
            fontWeight: '500',
        },
    };

    if (loading) {
        return (
            <Box minH="100vh" bg="gray.50" py={8}>
                <Box maxW="7xl" mx="auto" px={4}>
                    <Center py={10}>
                        <Spinner size="xl" color="blue.500" thickness="4px" />
                    </Center>
                </Box>
            </Box>
        );
    }

    if (error) {
        return (
            <Box minH="100vh" bg="gray.50" py={8}>
                <Box maxW="7xl" mx="auto" px={4}>
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
                            Error Loading Courses
                        </AlertTitle>
                        <AlertDescription maxWidth="sm">
                            {error}
                        </AlertDescription>
                        <Button
                            mt={4}
                            colorScheme="red"
                            onClick={fetchCourses}
                        >
                            Try Again
                        </Button>
                    </Alert>
                </Box>
            </Box>
        );
    }

    return (
        <Box minH="100vh" bg="gray.50" py={8}>
            <Box maxW="7xl" mx="auto" px={4}>
                <Flex justify="space-between" align="center" mb={8}>
                    <Heading size="lg" color="blue.600">
                        My Courses
                    </Heading>
                    <Button
                        as={Link}
                        to="/instructor/create-course"
                        colorScheme="blue"
                        leftIcon={<AddIcon />}
                    >
                        Create New Course
                    </Button>
                </Flex>

                {courses.length === 0 ? (
                    <Box
                        bg="white"
                        p={8}
                        borderRadius="lg"
                        shadow="sm"
                        textAlign="center"
                    >
                        <Heading size="md" mb={4} color="gray.600">
                            No Courses Yet
                        </Heading>
                        <Text color="gray.500" mb={6}>
                            Get started by creating your first course!
                        </Text>
                        <Button
                            as={Link}
                            to="/instructor/create-course"
                            colorScheme="blue"
                            size="lg"
                        >
                            Create Your First Course
                        </Button>
                    </Box>
                ) : (
                    <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
                        {courses.map(course => (
                            <CourseCard
                                key={course.id}
                                course={course}
                                onPublishToggle={handlePublishToggle}
                                onDelete={handleDelete}
                            />
                        ))}
                    </SimpleGrid>
                )}
            </Box>
        </Box>
    );
};

export default InstructorCourseList; 