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
} from '@chakra-ui/react';
import { useLocation } from 'react-router-dom';
import axios from 'axios';
import Navbar from '../shared/Navbar';
import Footer from '../shared/Footer';

const InstructorCard = ({ instructor }) => {
    const cardBg = useColorModeValue('white', 'gray.700');
    
    return (
        <Card bg={cardBg} shadow="lg" _hover={{ transform: 'translateY(-5px)', transition: '0.2s' }}>
            <CardBody>
                <VStack spacing={4} align="center">
                    <Avatar 
                        size="xl" 
                        name={instructor.name || instructor.username}
                        src={instructor.profile_picture}
                    />
                    <Stack spacing={2} textAlign="center">
                        <Heading size="md">{instructor.name || instructor.username}</Heading>
                        <Text color="gray.500">{instructor.title || 'Course Instructor'}</Text>
                        <Flex gap={2} justify="center" wrap="wrap">
                            <Badge colorScheme="blue">{instructor.total_courses} Courses</Badge>
                            <Badge colorScheme="green">{instructor.total_students} Students</Badge>
                            {instructor.rating && (
                                <Badge colorScheme="yellow">⭐ {instructor.rating.toFixed(1)}</Badge>
                            )}
                        </Flex>
                        <Text fontSize="sm" noOfLines={2}>
                            {instructor.bio || 'Passionate about teaching and sharing knowledge'}
                        </Text>
                    </Stack>
                </VStack>
            </CardBody>
        </Card>
    );
};

const InstructorList = () => {
    const [instructors, setInstructors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const location = useLocation();
    const bgColor = useColorModeValue('gray.50', 'gray.800');

    const getPageTitle = () => {
        const path = location.pathname;
        if (path === '/instructors/featured') return 'Featured Instructors';
        if (path === '/instructors/top') return 'Top Rated Instructors';
        return 'All Instructors';
    };

    useEffect(() => {
        const fetchInstructors = async () => {
            try {
                setLoading(true);
                setError(null);
                
                // Determine which API endpoint to use based on the current route
                let endpoint = '/api/instructors/';
                if (location.pathname === '/instructors/featured') {
                    endpoint = '/api/instructors/featured/';
                } else if (location.pathname === '/instructors/top') {
                    endpoint = '/api/instructors/top-rated/';
                }

                const response = await axios.get(endpoint);
                setInstructors(response.data);
            } catch (err) {
                console.error('Error fetching instructors:', err);
                setError('Failed to load instructors. Please try again later.');
            } finally {
                setLoading(false);
            }
        };

        fetchInstructors();
    }, [location.pathname]);

    if (loading) {
        return (
            <Flex direction="column" minH="100vh">
                <Navbar />
                <Flex flex="1" justify="center" align="center">
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
                <Flex flex="1" justify="center" align="center">
                    <Text color="red.500">{error}</Text>
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
                        <Heading textAlign="center">{getPageTitle()}</Heading>
                        {instructors.length === 0 ? (
                            <Text textAlign="center" color="gray.500">
                                No instructors found.
                            </Text>
                        ) : (
                            <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
                                {instructors.map((instructor) => (
                                    <InstructorCard key={instructor.id} instructor={instructor} />
                                ))}
                            </SimpleGrid>
                        )}
                    </VStack>
                </Container>
            </Box>
            <Footer />
        </Flex>
    );
};

export default InstructorList; 