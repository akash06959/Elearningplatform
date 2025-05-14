import React from 'react';
import {
  Box,
  VStack,
  Heading,
  Text,
  useColorModeValue,
  Container,
  Divider,
  HStack,
  Button,
  Icon,
  Link as ChakraLink,
} from '@chakra-ui/react';
import { Link } from 'react-router-dom';
import {
  FiPlus,
  FiEdit,
  FiUsers,
  FiBook,
  FiAward,
  FiBell,
  FiUserCheck,
  FiBookOpen,
  FiTag,
  FiCheckSquare,
  FiList,
  FiFileText,
  FiStar,
  FiLayout,
  FiActivity
} from 'react-icons/fi';

const AdminSection = ({ title, items }) => {
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  return (
    <Box mb={8}>
      <Heading size="md" bg="blue.600" color="white" p={3} mb={4}>
        {title}
      </Heading>
      <Box bg={bgColor} borderWidth="1px" borderColor={borderColor} rounded="md">
        {items.map((item, index) => (
          <Box key={item.name} borderBottomWidth={index === items.length - 1 ? 0 : "1px"} p={4}>
            <HStack justify="space-between">
              <HStack>
                <Icon as={item.icon} color="blue.500" />
                <Text>{item.name}</Text>
              </HStack>
              <HStack spacing={2}>
                <Button
                  as={Link}
                  to={`${item.addPath}`}
                  size="sm"
                  leftIcon={<FiPlus />}
                  colorScheme="green"
                  variant="ghost"
                >
                  Add
                </Button>
                <Button
                  as={Link}
                  to={`${item.changePath}`}
                  size="sm"
                  leftIcon={<FiEdit />}
                  colorScheme="blue"
                  variant="ghost"
                >
                  Change
                </Button>
              </HStack>
            </HStack>
          </Box>
        ))}
      </Box>
    </Box>
  );
};

const AdminDashboard = () => {
  const sections = [
    {
      title: 'ACCOUNTS',
      items: [
        {
          name: 'User achievements',
          icon: FiAward,
          addPath: '/admin/achievements/add',
          changePath: '/admin/achievements'
        },
        {
          name: 'User notifications',
          icon: FiBell,
          addPath: '/admin/notifications/add',
          changePath: '/admin/notifications'
        },
        {
          name: 'Users',
          icon: FiUsers,
          addPath: '/admin/users/add',
          changePath: '/admin/users'
        }
      ]
    },
    {
      title: 'AUTHENTICATION AND AUTHORIZATION',
      items: [
        {
          name: 'Groups',
          icon: FiUserCheck,
          addPath: '/admin/groups/add',
          changePath: '/admin/groups'
        }
      ]
    },
    {
      title: 'COURSES',
      items: [
        {
          name: 'Assignments',
          icon: FiCheckSquare,
          addPath: '/admin/assignments/add',
          changePath: '/admin/assignments'
        },
        {
          name: 'Categories',
          icon: FiTag,
          addPath: '/admin/categories/add',
          changePath: '/admin/categories'
        },
        {
          name: 'Course tags',
          icon: FiTag,
          addPath: '/admin/course-tags/add',
          changePath: '/admin/course-tags'
        },
        {
          name: 'Courses',
          icon: FiBook,
          addPath: '/admin/courses/add',
          changePath: '/admin/courses'
        },
        {
          name: 'Lessons',
          icon: FiBookOpen,
          addPath: '/admin/lessons/add',
          changePath: '/admin/lessons'
        },
        {
          name: 'Modules',
          icon: FiList,
          addPath: '/admin/modules/add',
          changePath: '/admin/modules'
        },
        {
          name: 'Quizs',
          icon: FiFileText,
          addPath: '/admin/quizzes/add',
          changePath: '/admin/quizzes'
        },
        {
          name: 'Reviews',
          icon: FiStar,
          addPath: '/admin/reviews/add',
          changePath: '/admin/reviews'
        },
        {
          name: 'Sections',
          icon: FiLayout,
          addPath: '/admin/sections/add',
          changePath: '/admin/sections'
        },
        {
          name: 'User progresss',
          icon: FiActivity,
          addPath: '/admin/progress/add',
          changePath: '/admin/progress'
        }
      ]
    }
  ];

  return (
    <Container maxW="container.xl" py={8}>
      <Box mb={8}>
        <Heading mb={4}>Site administration</Heading>
        <Text color="gray.600" mb={8}>
          Welcome to the E-Learning Platform administration area. Please select an option to manage:
        </Text>
        
        {sections.map((section) => (
          <AdminSection
            key={section.title}
            title={section.title}
            items={section.items}
          />
        ))}
      </Box>
    </Container>
  );
};

export default AdminDashboard; 