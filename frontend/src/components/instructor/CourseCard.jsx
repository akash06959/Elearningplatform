import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
    Box,
    Image,
    Text,
    Badge,
    Button,
    VStack,
    HStack,
    Heading,
    Flex,
    Spinner,
} from '@chakra-ui/react';
import { EditIcon, DeleteIcon, ViewIcon } from '@chakra-ui/icons';

const CourseCard = ({ course, onPublishToggle, onDelete }) => {
    const [isDeleting, setIsDeleting] = useState(false);

    const handlePublishToggle = () => {
        if (onPublishToggle) {
            onPublishToggle(course.id, course.status || (course.is_published ? 'published' : 'draft'));
        }
    };

    const handleDelete = async () => {
        if (onDelete) {
            setIsDeleting(true);
            try {
                await onDelete(course.id);
            } finally {
                setIsDeleting(false);
            }
        }
    };

    return (
        <Box
            borderWidth="1px"
            borderRadius="lg"
            overflow="hidden"
            bg="white"
            shadow="sm"
            transition="all 0.2s"
            _hover={{ shadow: 'md' }}
        >
            <Box position="relative">
                <Image
                    src={course.thumbnail_url || 'https://placehold.co/300x200/e2e8f0/1a202c?text=Course+Thumbnail'}
                    alt={course.title}
                    height="200px"
                    width="100%"
                    objectFit="cover"
                    fallback={
                        <Box
                            height="200px"
                            width="100%"
                            bg="gray.100"
                            display="flex"
                            alignItems="center"
                            justifyContent="center"
                        >
                            <Text color="gray.500" fontSize="sm">
                                {course.title || 'Course Thumbnail'}
                            </Text>
                        </Box>
                    }
                />
                <Badge
                    position="absolute"
                    top={2}
                    right={2}
                    colorScheme={course.is_published ? 'green' : 'yellow'}
                    px={2}
                    py={1}
                    borderRadius="full"
                >
                    {course.is_published ? 'Published' : 'Draft'}
                </Badge>
            </Box>

            <VStack p={4} align="stretch" spacing={3}>
                <Heading size="md" noOfLines={2}>
                    {course.title}
                </Heading>

                <HStack spacing={2}>
                    <Badge colorScheme="blue">{course.difficulty_level || 'Beginner'}</Badge>
                    <Badge colorScheme="purple">{course.category || 'General'}</Badge>
                </HStack>

                <Text noOfLines={3} color="gray.600" fontSize="sm">
                    {course.description || 'No description available'}
                </Text>

                <HStack spacing={4} fontSize="sm" color="gray.500">
                    <Text>
                        Students: {course.total_students || 0}
                    </Text>
                    <Text>
                        Lessons: {course.total_lessons || 0}
                    </Text>
                </HStack>

                <HStack spacing={2} mt={2}>
                    <Button
                        as={Link}
                        to={`/instructor/courses/${course.id}/view`}
                        leftIcon={<ViewIcon />}
                        colorScheme="teal"
                        size="sm"
                        flex={1}
                        variant="outline"
                    >
                        View
                    </Button>
                    <Button
                        as={Link}
                        to={`/instructor/courses/${course.id}/edit`}
                        leftIcon={<EditIcon />}
                        colorScheme="blue"
                        size="sm"
                        flex={1}
                        variant="outline"
                    >
                        Edit
                    </Button>
                </HStack>
                
                <HStack spacing={2}>
                    <Button
                        onClick={handlePublishToggle}
                        colorScheme={course.is_published ? 'orange' : 'green'}
                        size="sm"
                        flex={1}
                        isDisabled={isDeleting}
                    >
                        {course.is_published ? 'Unpublish' : 'Publish'}
                    </Button>
                    <Button
                        onClick={handleDelete}
                        leftIcon={isDeleting ? <Spinner size="sm" /> : <DeleteIcon />}
                        colorScheme="red"
                        size="sm"
                        variant="ghost"
                        isLoading={isDeleting}
                        loadingText="Deleting..."
                        isDisabled={isDeleting}
                    >
                        Delete
                    </Button>
                </HStack>
            </VStack>
        </Box>
    );
};

export default CourseCard; 