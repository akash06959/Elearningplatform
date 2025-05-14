import React from 'react';
import {
    Box,
    Image,
    Text,
    Heading,
    Stack,
    Badge,
    HStack,
    Icon,
    LinkBox,
    LinkOverlay,
    useColorModeValue,
} from '@chakra-ui/react';
import { StarIcon } from '@chakra-ui/icons';
import { Link } from 'react-router-dom';
import { FaGraduationCap, FaClock, FaUser } from 'react-icons/fa';

const CourseCard = ({ course }) => {
    const {
        id,
        title,
        thumbnail,
        thumbnail_url,
        instructor,
        rating,
        total_students,
        difficulty_level,
        duration_in_weeks,
        description,
    } = course;

    const defaultImageUrl = 'https://placehold.co/600x400?text=Course+Image';
    // Use either thumbnail or thumbnail_url, whichever is available
    const imageUrl = thumbnail || thumbnail_url || defaultImageUrl;

    console.log('Course data:', {
        title,
        thumbnail,
        thumbnail_url,
        imageUrl,
        instructor
    });

    return (
        <LinkBox
            as="article"
            maxW="100%"
            borderWidth="1px"
            borderRadius="lg"
            overflow="hidden"
            _hover={{ shadow: 'lg' }}
            bg={useColorModeValue('white', 'gray.700')}
            transition="all 0.2s"
        >
            <Box position="relative" height="200px">
                <Image
                    src={imageUrl}
                    alt={title}
                    width="100%"
                    height="100%"
                    objectFit="cover"
                    fallback={
                        <Box 
                            height="100%" 
                            width="100%" 
                            bg="gray.100" 
                            display="flex" 
                            alignItems="center" 
                            justifyContent="center"
                        >
                            <Icon as={FaGraduationCap} boxSize="40px" color="gray.300" />
                        </Box>
                    }
                />
            </Box>

            <Box p={6}>
                <Stack spacing={3}>
                    {/* Title */}
                    <LinkOverlay as={Link} to={`/courses/${id}`}>
                        <Heading size="md" noOfLines={2}>
                            {title}
                        </Heading>
                    </LinkOverlay>

                    {/* Description */}
                    <Text color="gray.600" noOfLines={2}>
                        {description}
                    </Text>

                    {/* Course Meta */}
                    <HStack spacing={4} mt={2}>
                        <HStack>
                            <Icon as={FaUser} color="gray.500" />
                            <Text fontSize="sm" color="gray.500">
                                {instructor?.name || instructor?.username || 'Unknown Instructor'}
                            </Text>
                        </HStack>
                        <HStack>
                            <Icon as={FaClock} color="gray.500" />
                            <Text fontSize="sm" color="gray.500">
                                {duration_in_weeks ? `${duration_in_weeks} weeks` : 'Self-paced'}
                            </Text>
                        </HStack>
                    </HStack>

                    {/* Course Stats */}
                    <HStack spacing={4} mt={2}>
                        <HStack>
                            <Icon as={FaGraduationCap} color="gray.500" />
                            <Text fontSize="sm" color="gray.500">
                                {total_students || 0} students
                            </Text>
                        </HStack>
                        <HStack>
                            <StarIcon color="yellow.400" />
                            <Text fontSize="sm" color="gray.500">
                                {rating?.toFixed(1) || 'No ratings'}
                            </Text>
                        </HStack>
                    </HStack>

                    {/* Difficulty Level */}
                    <Badge 
                        colorScheme={
                            difficulty_level?.toLowerCase() === 'beginner' ? 'green' :
                            difficulty_level?.toLowerCase() === 'intermediate' ? 'yellow' :
                            difficulty_level?.toLowerCase() === 'advanced' ? 'red' : 'gray'
                        }
                        alignSelf="start"
                    >
                        {difficulty_level || 'All Levels'}
                    </Badge>
                </Stack>
            </Box>
        </LinkBox>
    );
};

export default CourseCard; 