import React, { useState } from 'react';
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  VStack,
  Text,
  Container,
  Heading,
  Radio,
  RadioGroup,
  useToast,
} from '@chakra-ui/react';
import { useNavigate, Link } from 'react-router-dom';
import { authAPI } from '../../services/authAPI';
import DragPuzzle from './DragPuzzle';
import { useAuth } from '../../contexts/AuthContext';

const Login = () => {
  const { loginUser } = useAuth();
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    user_type: 'student'
  });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const toast = useToast();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!isVerified) {
      toast({
        title: 'Verification Required',
        description: 'Please complete the verification puzzle first',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setError(null);
    setLoading(true);

    try {
      console.log('Login attempt:', {
        username: formData.username,
        user_type: formData.user_type
      });

      const response = await authAPI.login(formData);
      console.log('Login response:', response);

      // Call loginUser from AuthContext to update global state
      const dashboardPath = await loginUser(
        {
          username: formData.username,
          user_type: formData.user_type,
          ...response
        },
        {
          access: response.access,
          refresh: response.refresh
        }
      );

      toast({
        title: 'Login Successful',
        description: `Welcome back, ${formData.username}!`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      // Check if there's a saved redirect path
      const savedPath = sessionStorage.getItem('redirectAfterLogin');
      
      // Add a small delay to ensure the toast is visible
      setTimeout(() => {
        if (savedPath) {
          // Clear the saved path
          sessionStorage.removeItem('redirectAfterLogin');
          console.log('Redirecting to saved path:', savedPath);
          window.location.href = savedPath;
        } else {
          console.log('Redirecting to dashboard:', dashboardPath);
          window.location.href = dashboardPath;
        }
      }, 1000);

    } catch (err) {
      console.error('Login error:', err);
      setError(err.message || 'Failed to login. Please try again.');
      toast({
        title: 'Login Failed',
        description: err.message || 'Failed to login. Please try again.',
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
        description: 'You can now proceed with login',
        status: 'success',
        duration: 2000,
        isClosable: true,
      });
    }
  };

  return (
    <Container maxW="md" py={12}>
      <Box
        bg="white"
        p={8}
        borderRadius="lg"
        boxShadow="lg"
        w="100%"
      >
        <VStack spacing={6} align="stretch">
          <Heading
            as="h1"
            size="lg"
            textAlign="center"
            color="#3182CE"
            mb={2}
          >
            Login to E-Learning Platform
          </Heading>

          {error && (
            <Text color="red.500" textAlign="center">
              {error}
            </Text>
          )}

          <Box as="form" onSubmit={handleSubmit}>
            <VStack spacing={4}>
              <FormControl isRequired>
                <FormLabel>Username</FormLabel>
                <Input
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  bg="#EBF8FF"
                  border="1px solid"
                  borderColor="#BEE3F8"
                  _hover={{ borderColor: '#90CDF4' }}
                  _focus={{ borderColor: '#3182CE', boxShadow: '0 0 0 1px #3182CE' }}
                  size="lg"
                />
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Password</FormLabel>
                <Input
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleChange}
                  bg="#EBF8FF"
                  border="1px solid"
                  borderColor="#BEE3F8"
                  _hover={{ borderColor: '#90CDF4' }}
                  _focus={{ borderColor: '#3182CE', boxShadow: '0 0 0 1px #3182CE' }}
                  size="lg"
                />
              </FormControl>

              <FormControl>
                <FormLabel>Login as:</FormLabel>
                <RadioGroup
                  name="user_type"
                  value={formData.user_type}
                  onChange={(value) => handleChange({ target: { name: 'user_type', value } })}
                >
                  <Box display="flex" gap={4}>
                    <Box
                      as="label"
                      flex="1"
                      cursor="pointer"
                      bg={formData.user_type === 'student' ? '#3182CE' : 'white'}
                      color={formData.user_type === 'student' ? 'white' : 'black'}
                      p={3}
                      borderRadius="md"
                      border="1px solid"
                      borderColor="#E2E8F0"
                      _hover={{ borderColor: '#3182CE' }}
                    >
                      <Radio
                        value="student"
                        colorScheme="blue"
                        size="lg"
                        display="none"
                      />
                      <Text textAlign="center">Student</Text>
                    </Box>
                    <Box
                      as="label"
                      flex="1"
                      cursor="pointer"
                      bg={formData.user_type === 'instructor' ? '#3182CE' : 'white'}
                      color={formData.user_type === 'instructor' ? 'white' : 'black'}
                      p={3}
                      borderRadius="md"
                      border="1px solid"
                      borderColor="#E2E8F0"
                      _hover={{ borderColor: '#3182CE' }}
                    >
                      <Radio
                        value="instructor"
                        colorScheme="blue"
                        size="lg"
                        display="none"
                      />
                      <Text textAlign="center">Instructor</Text>
                    </Box>
                  </Box>
                </RadioGroup>
              </FormControl>

              <Box
                w="100%"
                bg="#EBF8FF"
                p={4}
                borderRadius="md"
                border="1px solid"
                borderColor="#BEE3F8"
              >
                <Text fontWeight="500" mb={2}>
                  Human Verification
                </Text>
                <Text color="gray.600" fontSize="sm" mb={4}>
                  Slide the circle to the target zone
                </Text>
                <DragPuzzle onVerify={handleVerification} />
              </Box>

              <Button
                type="submit"
                w="100%"
                bg="#3182CE"
                color="white"
                size="lg"
                _hover={{ bg: '#2B6CB0' }}
                isLoading={loading}
                loadingText="Logging in..."
                mt={4}
                disabled={!isVerified}
              >
                Login
              </Button>

              <Link 
                to="/forgot-password" 
                style={{ alignSelf: 'flex-end', color: '#3182CE', fontSize: '0.9rem' }}
              >
                Forgot Password?
              </Link>
            </VStack>
          </Box>

          <Text textAlign="center" fontSize="sm">
            Don't have an account?{' '}
            <Link to="/register" style={{ color: '#3182CE', fontWeight: '500' }}>
              Register
            </Link>
          </Text>
        </VStack>
      </Box>
    </Container>
  );
};

export default Login; 