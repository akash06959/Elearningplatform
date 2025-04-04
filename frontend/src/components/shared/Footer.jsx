import React from 'react';
import {
    Box,
    Container,
    Stack,
    SimpleGrid,
    Text,
    Link,
    useColorModeValue,
} from '@chakra-ui/react';
import { Link as RouterLink } from 'react-router-dom';

export default function Footer() {
    return (
        <Box
            bg={useColorModeValue('gray.50', 'gray.900')}
            color={useColorModeValue('gray.700', 'gray.200')}
            mt="auto"
        >
            <Container as={Stack} maxW={'6xl'} py={10}>
                <SimpleGrid columns={{ base: 1, sm: 2, md: 4 }} spacing={8}>
                    <Stack align={'flex-start'}>
                        <Text fontWeight={'500'} fontSize={'lg'} mb={2}>Company</Text>
                        <Link as={RouterLink} to="/about">About Us</Link>
                        <Link as={RouterLink} to="/contact">Contact Us</Link>
                        <Link as={RouterLink} to="/careers">Careers</Link>
                    </Stack>

                    <Stack align={'flex-start'}>
                        <Text fontWeight={'500'} fontSize={'lg'} mb={2}>Support</Text>
                        <Link as={RouterLink} to="/help">Help Center</Link>
                        <Link as={RouterLink} to="/terms">Terms of Service</Link>
                        <Link as={RouterLink} to="/privacy">Privacy Policy</Link>
                    </Stack>

                    <Stack align={'flex-start'}>
                        <Text fontWeight={'500'} fontSize={'lg'} mb={2}>Students</Text>
                        <Link as={RouterLink} to="/courses">All Courses</Link>
                        <Link as={RouterLink} to="/enrollments">My Learning</Link>
                        <Link as={RouterLink} to="/wishlist">Wishlist</Link>
                    </Stack>

                    <Stack align={'flex-start'}>
                        <Text fontWeight={'500'} fontSize={'lg'} mb={2}>Instructors</Text>
                        <Link as={RouterLink} to="/inst_dashboard">Instructor Dashboard</Link>
                        <Link as={RouterLink} to="/instructor/courses">My Courses</Link>
                        <Link as={RouterLink} to="/instructor/earnings">Earnings</Link>
                    </Stack>
                </SimpleGrid>
            </Container>

            <Box
                borderTopWidth={1}
                borderStyle={'solid'}
                borderColor={useColorModeValue('gray.200', 'gray.700')}
            >
                <Container
                    as={Stack}
                    maxW={'6xl'}
                    py={4}
                    direction={{ base: 'column', md: 'row' }}
                    spacing={4}
                    justify={{ md: 'space-between' }}
                    align={{ md: 'center' }}
                >
                    <Text>© 2024 ELearning Platform. All rights reserved</Text>
                    <Stack direction={'row'} spacing={6}>
                        <Link href={'#'}>Facebook</Link>
                        <Link href={'#'}>Twitter</Link>
                        <Link href={'#'}>YouTube</Link>
                        <Link href={'#'}>Instagram</Link>
                    </Stack>
                </Container>
            </Box>
        </Box>
    );
} 