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
  useToast,
} from '@chakra-ui/react';
import { Link } from 'react-router-dom';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // TODO: Implement password reset API call
      toast({
        title: 'Reset Link Sent',
        description: 'Please check your email for password reset instructions.',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to send reset link',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
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
            Forgot Password
          </Heading>
          <Text textAlign="center" color="gray.600">
            Enter your email address to reset your password
          </Text>

          <Box as="form" onSubmit={handleSubmit}>
            <VStack spacing={4}>
              <FormControl isRequired>
                <FormLabel>Email</FormLabel>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  bg="#EBF8FF"
                  border="1px solid"
                  borderColor="#BEE3F8"
                  _hover={{ borderColor: '#90CDF4' }}
                  _focus={{ borderColor: '#3182CE', boxShadow: '0 0 0 1px #3182CE' }}
                  size="lg"
                />
              </FormControl>

              <Button
                type="submit"
                w="100%"
                bg="#3182CE"
                color="white"
                size="lg"
                _hover={{ bg: '#2B6CB0' }}
                isLoading={loading}
                loadingText="Sending..."
                mt={4}
              >
                Send Reset Link
              </Button>

              <Link to="/login">
                <Button
                  w="100%"
                  variant="outline"
                  size="lg"
                  borderColor="#3182CE"
                  color="#3182CE"
                  _hover={{ bg: '#EBF8FF' }}
                >
                  Back to Login
                </Button>
              </Link>
            </VStack>
          </Box>
        </VStack>
      </Box>
    </Container>
  );
};

export default ForgotPassword; 