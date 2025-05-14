import React, { useState } from 'react';
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  VStack,
  Text,
  useToast,
  Container,
  Heading,
  InputGroup,
  InputRightElement,
  IconButton,
  Radio,
  RadioGroup,
  Stack,
  useColorModeValue,
} from '@chakra-ui/react';
import { ViewIcon, ViewOffIcon } from '@chakra-ui/icons';
import { Link, useNavigate } from 'react-router-dom';
import DragPuzzle from './DragPuzzle';
import { authAPI } from '../../services/api';

const Register = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    first_name: '',
    last_name: '',
    user_type: 'student' // Default to student
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [loading, setLoading] = useState(false);
  const toast = useToast();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  // Special handler for radio button (user type)
  const handleUserTypeChange = (value) => {
    setFormData(prevState => ({
      ...prevState,
      user_type: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate required fields
      if (!formData.username || !formData.email || !formData.password) {
        toast({
          title: 'Error',
          description: 'Please fill in all required fields',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
        return;
      }

      // Prepare registration data
      const registrationData = {
        username: formData.username.trim(),
        email: formData.email.trim(),
        password: formData.password,
        first_name: formData.first_name.trim(),
        last_name: formData.last_name.trim(),
        user_type: formData.user_type.toLowerCase()
      };

      console.log('Registering with:', registrationData);
      const response = await authAPI.register(registrationData);

      toast({
        title: 'Registration Successful',
        description: 'Welcome to our platform!',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      // Redirect based on user type
      const userType = response.user_type?.toLowerCase() || response.role?.toLowerCase();
      const redirectPath = userType === 'instructor' ? '/instructor/dashboard' : '/student/dashboard';
      navigate(redirectPath);

    } catch (error) {
      console.error('Registration error:', error);
      toast({
        title: 'Registration Failed',
        description: error.message || 'An error occurred during registration',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVerification = (verified) => {
    setIsVerified(verified);
    if (verified) {
      toast({
        title: 'Verification Complete',
        description: 'You can now complete your registration',
        status: 'success',
        duration: 2000,
        isClosable: true,
      });
    }
  };

  const bgColor = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  return (
    <Container maxW="container.md" py={8}>
      <Box
        bg={bgColor}
        p={8}
        borderRadius="xl"
        boxShadow="lg"
        border="1px"
        borderColor={borderColor}
      >
        <VStack spacing={6}>
          <Box textAlign="center" w="full">
            <Heading size="lg">Create Account</Heading>
            <Text mt={2} color="gray.600">
              Join our learning platform today
            </Text>
          </Box>

          <Box as="form" w="full" onSubmit={handleSubmit}>
            <VStack spacing={5}>
              <Stack direction={{ base: 'column', md: 'row' }} w="full" spacing={4}>
                <FormControl isRequired>
                  <FormLabel>First Name</FormLabel>
                  <Input
                    name="first_name"
                    value={formData.first_name}
                    onChange={handleChange}
                    placeholder="Max"
                  />
                </FormControl>

                <FormControl isRequired>
                  <FormLabel>Last Name</FormLabel>
                  <Input
                    name="last_name"
                    value={formData.last_name}
                    onChange={handleChange}
                    placeholder="Robinson"
                  />
                </FormControl>
              </Stack>

              <FormControl isRequired>
                <FormLabel>Username</FormLabel>
                <Input
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  placeholder="Choose a username"
                />
                <Text fontSize="sm" color="gray.500" mt={1}>
                  This username will be used to log in to your account
                </Text>
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Email</FormLabel>
                <Input
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="m@example.com"
                />
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Password</FormLabel>
                <InputGroup>
                  <Input
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Enter your password"
                  />
                  <InputRightElement>
                    <IconButton
                      icon={showPassword ? <ViewOffIcon /> : <ViewIcon />}
                      onClick={() => setShowPassword(!showPassword)}
                      variant="ghost"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    />
                  </InputRightElement>
                </InputGroup>
              </FormControl>

              <FormControl isRequired>
                <FormLabel>I want to register as:</FormLabel>
                <RadioGroup
                  value={formData.user_type}
                  onChange={handleUserTypeChange}
                >
                  <Stack direction="row" spacing={4}>
                    <Radio value="student">Student</Radio>
                    <Radio value="instructor">Instructor</Radio>
                  </Stack>
                </RadioGroup>
              </FormControl>

              <Box
                w="full"
                p={4}
                bg={useColorModeValue('gray.50', 'gray.800')}
                borderRadius="lg"
                border="1px"
                borderColor={borderColor}
              >
                <Heading size="sm" mb={4}>Human Verification</Heading>
                <DragPuzzle onVerify={handleVerification} />
              </Box>

              <Button
                type="submit"
                colorScheme="blue"
                size="lg"
                width="full"
                isLoading={loading}
                loadingText="Creating account..."
                disabled={!isVerified}
              >
                Create Account
              </Button>
            </VStack>
          </Box>

          <Text>
            Already have an account?{' '}
            <Link to="/login" style={{ color: 'blue', fontWeight: 'semibold' }}>
              Sign In
            </Link>
          </Text>
        </VStack>
      </Box>
    </Container>
  );
};

export default Register; 