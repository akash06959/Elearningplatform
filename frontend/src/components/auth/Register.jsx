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
import { authAPI } from '../../services/authAPI';

const Register = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    username: '',
    email: '',
    password: '',
    userType: 'student'
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const toast = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!isVerified) {
      toast({
        title: 'Verification Required',
        description: 'Please complete the verification puzzle',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    // Validate username
    if (formData.username.length < 3) {
      toast({
        title: 'Invalid Username',
        description: 'Username must be at least 3 characters long',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setIsLoading(true);
    try {
      const registrationData = {
        username: formData.username,
        email: formData.email,
        password: formData.password,
        first_name: formData.firstName,
        last_name: formData.lastName,
        user_type: formData.userType
      };

      console.log('Registering with:', registrationData);
      
      // Call the registration API
      await authAPI.register(registrationData);
      
      toast({
        title: 'Registration Successful',
        description: 'You can now log in with your username and password',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      navigate('/login');
    } catch (error) {
      toast({
        title: 'Registration Failed',
        description: error.message || 'An error occurred during registration',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
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
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    placeholder="Max"
                  />
                </FormControl>

                <FormControl isRequired>
                  <FormLabel>Last Name</FormLabel>
                  <Input
                    name="lastName"
                    value={formData.lastName}
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
                <FormLabel>I want to join as</FormLabel>
                <RadioGroup
                  name="userType"
                  value={formData.userType}
                  onChange={(value) => setFormData(prev => ({ ...prev, userType: value }))}
                >
                  <Stack direction="row" spacing={6}>
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
                isLoading={isLoading}
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