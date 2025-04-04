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
        instructor,
        rating,
        total_students,
        difficulty_level,
        duration,
        institution,
        description,
    } = course;

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
            <Image
                src={thumbnail || '/default-course-image.jpg'}
                alt={title}
                height="200px"
                width="100%"
                objectFit="cover"
            />

            <Box p={6}>
                <Stack spacing={3}>
                    {/* Institution Badge */}
                    <Badge colorScheme="blue" alignSelf="start">
                        {institution || 'Featured Institution'}
                    </Badge>

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

                    {/* Instructor */}
                    <HStack spacing={2}>
                        <Icon as={FaUser} color="gray.500" />
                        <Text color="gray.600" fontSize="sm">
                            {instructor?.name || instructor?.username || 'Unknown Instructor'}
                        </Text>
                    </HStack>

                    {/* Course Info */}
                    <HStack spacing={4} wrap="wrap">
                        {difficulty_level && (
                            <HStack>
                                <Icon as={FaGraduationCap} color="gray.500" />
                                <Text fontSize="sm" color="gray.600">
                                    {difficulty_level}
                                </Text>
                            </HStack>
                        )}
                        
                        {duration && (
                            <HStack>
                                <Icon as={FaClock} color="gray.500" />
                                <Text fontSize="sm" color="gray.600">
                                    {duration}
                                </Text>
                            </HStack>
                        )}
                    </HStack>

                    {/* Rating and Students */}
                    <HStack justify="space-between" mt={2}>
                        {rating && (
                            <HStack>
                                <StarIcon color="yellow.400" />
                                <Text fontWeight="bold">{rating}</Text>
                            </HStack>
                        )}
                        {total_students && (
                            <Text fontSize="sm" color="gray.600">
                                {total_students.toLocaleString()} students
                            </Text>
                        )}
                    </HStack>
                </Stack>
            </Box>
        </LinkBox>
    );
};

export default CourseCard; 