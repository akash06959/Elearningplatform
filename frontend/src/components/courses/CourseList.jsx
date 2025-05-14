import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { courseAPI } from '../../services/api';
import {
  Box,
  Container,
  Select,
  SimpleGrid,
  Heading,
  Text,
  VStack,
  Spinner,
  useColorModeValue,
  Flex,
} from '@chakra-ui/react';
import CourseCard from './CourseCard';
import Navbar from '../shared/Navbar';
import Footer from '../shared/Footer';

const CourseList = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [courses, setCourses] = useState([]);
  const [filteredCourses, setFilteredCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || '');
  const [categories, setCategories] = useState([]);

  // Move all useColorModeValue hooks to the top level
  const selectBg = useColorModeValue('white', 'gray.700');
  const pageBg = useColorModeValue('gray.50', 'gray.800');

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setLoading(true);
        const allCourses = await courseAPI.getCourses();
        setCourses(allCourses);

        // Extract unique categories
        const uniqueCategories = [...new Set(allCourses.map(course => course.category).filter(Boolean))];
        setCategories(uniqueCategories);

        // Apply initial filters if any
        filterCourses(allCourses, searchParams.get('category'));
      } catch (err) {
        console.error('Error fetching courses:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, [searchParams]);

  const filterCourses = (coursesToFilter, category) => {
    let filtered = [...coursesToFilter];

    // Apply category filter
    if (category) {
      filtered = filtered.filter(course => course.category === category);
    }

    setFilteredCourses(filtered);
  };

  const handleCategoryChange = (value) => {
    setSelectedCategory(value);
    const newParams = new URLSearchParams(searchParams);
    if (value) {
      newParams.set('category', value);
    } else {
      newParams.delete('category');
    }
    setSearchParams(newParams);
    filterCourses(courses, value);
  };

  if (loading) {
    return (
      <Flex direction="column" minH="100vh">
        <Navbar />
        <Flex flex="1" justify="center" align="center" bg={pageBg}>
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
        <Flex flex="1" justify="center" align="center" bg={pageBg}>
          <Text color="red.500">Error: {error}</Text>
        </Flex>
        <Footer />
      </Flex>
    );
  }

  return (
    <Flex direction="column" minH="100vh">
      <Navbar />
      <Box flex="1" bg={pageBg}>
        <Container maxW="container.xl" py={8}>
          <VStack spacing={8} align="stretch">
            <Heading as="h1" size="xl" textAlign="center">
              Available Courses
            </Heading>

            {/* Category Filter */}
            <Select
              placeholder="All Categories"
              value={selectedCategory}
              onChange={(e) => handleCategoryChange(e.target.value)}
              bg={selectBg}
              maxW="200px"
              alignSelf="center"
            >
              <option value="">All Categories</option>
              {categories.map(category => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </Select>

            {/* Results Section */}
            {filteredCourses.length > 0 ? (
              <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
                {filteredCourses.map(course => (
                  <CourseCard key={course.id} course={course} />
                ))}
              </SimpleGrid>
            ) : (
              <Text textAlign="center" color="gray.500" py={10}>
                No courses found matching your criteria.
              </Text>
            )}
          </VStack>
        </Container>
      </Box>
      <Footer />
    </Flex>
  );
};

export default CourseList;