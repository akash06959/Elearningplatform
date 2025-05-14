import React, { useState } from 'react';
import {
  Box,
  Grid,
  Button,
  useColorModeValue,
  Heading,
  Container,
  HStack,
  Input,
  Select,
  Text,
  Image,
  VStack,
  Badge,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  IconButton,
  useToast,
  Flex,
} from '@chakra-ui/react';
import { FiMoreVertical, FiSearch, FiPlus } from 'react-icons/fi';

const CourseCard = ({ course, onAction }) => {
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  return (
    <Box
      bg={cardBg}
      borderWidth="1px"
      borderColor={borderColor}
      rounded="lg"
      overflow="hidden"
      shadow="base"
      transition="all 0.3s"
      _hover={{ transform: 'translateY(-2px)', shadow: 'md' }}
    >
      <Image
        src={course.thumbnail || 'https://via.placeholder.com/300x200'}
        alt={course.title}
        height="200px"
        width="100%"
        objectFit="cover"
      />
      <Box p={4}>
        <VStack align="start" spacing={2}>
          <Heading size="md" noOfLines={2}>
            {course.title}
          </Heading>
          <Text fontSize="sm" color="gray.500">
            By {course.instructor}
          </Text>
          <HStack spacing={2}>
            <Badge colorScheme={course.status === 'published' ? 'green' : 'yellow'}>
              {course.status}
            </Badge>
            <Badge colorScheme="blue">{course.category}</Badge>
          </HStack>
          <Text fontSize="sm">
            {course.enrolledCount} students enrolled
          </Text>
          <Flex justify="space-between" width="100%" align="center">
            <Text fontWeight="bold" fontSize="lg">
              ${course.price}
            </Text>
            <Menu>
              <MenuButton
                as={IconButton}
                icon={<FiMoreVertical />}
                variant="ghost"
                size="sm"
              />
              <MenuList>
                <MenuItem onClick={() => onAction('edit', course.id)}>
                  Edit Course
                </MenuItem>
                <MenuItem onClick={() => onAction('view', course.id)}>
                  View Details
                </MenuItem>
                {course.status === 'draft' ? (
                  <MenuItem onClick={() => onAction('publish', course.id)}>
                    Publish
                  </MenuItem>
                ) : (
                  <MenuItem onClick={() => onAction('unpublish', course.id)}>
                    Unpublish
                  </MenuItem>
                )}
                <MenuItem onClick={() => onAction('delete', course.id)}>
                  Delete
                </MenuItem>
              </MenuList>
            </Menu>
          </Flex>
        </VStack>
      </Box>
    </Box>
  );
};

const CoursesManagement = () => {
  const [courses] = useState([
    {
      id: 1,
      title: 'Introduction to Web Development',
      instructor: 'John Doe',
      category: 'Development',
      status: 'published',
      price: 49.99,
      enrolledCount: 125,
      thumbnail: 'https://via.placeholder.com/300x200',
    },
    {
      id: 2,
      title: 'Digital Marketing Fundamentals',
      instructor: 'Jane Smith',
      category: 'Marketing',
      status: 'draft',
      price: 39.99,
      enrolledCount: 0,
      thumbnail: 'https://via.placeholder.com/300x200',
    },
    // Add more sample courses as needed
  ]);

  const toast = useToast();

  const handleAction = (action, courseId) => {
    toast({
      title: `${action} course ${courseId}`,
      status: 'info',
      duration: 2000,
    });
  };

  return (
    <Container maxW="container.xl" py={8}>
      <Box mb={8}>
        <Heading mb={6}>Courses Management</Heading>
        
        {/* Filters and Actions */}
        <HStack spacing={4} mb={6}>
          <Input
            placeholder="Search courses..."
            maxW="300px"
            leftElement={<FiSearch />}
          />
          <Select placeholder="Category" maxW="200px">
            <option value="all">All Categories</option>
            <option value="development">Development</option>
            <option value="business">Business</option>
            <option value="marketing">Marketing</option>
            <option value="design">Design</option>
          </Select>
          <Select placeholder="Status" maxW="200px">
            <option value="all">All Status</option>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
          </Select>
          <Button
            leftIcon={<FiPlus />}
            colorScheme="blue"
            ml="auto"
          >
            Add Course
          </Button>
        </HStack>

        {/* Courses Grid */}
        <Grid
          templateColumns={{
            base: '1fr',
            md: 'repeat(2, 1fr)',
            lg: 'repeat(3, 1fr)',
          }}
          gap={6}
        >
          {courses.map((course) => (
            <CourseCard
              key={course.id}
              course={course}
              onAction={handleAction}
            />
          ))}
        </Grid>
      </Box>
    </Container>
  );
};

export default CoursesManagement; 