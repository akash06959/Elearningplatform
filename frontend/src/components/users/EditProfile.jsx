import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../../contexts/AuthContext';
import Navbar from '../shared/Navbar';
import Footer from '../shared/Footer';
import {
  Box,
  Container,
  Flex,
  VStack,
  Heading,
  Text,
  Button,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  Select,
  Spinner,
  useColorModeValue,
  SimpleGrid,
  GridItem,
  Avatar,
  Center,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  useToast,
  Stack
} from '@chakra-ui/react';
import { useAuth } from '../../contexts/AuthContext';

const EditProfile = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { authTokens, setUser } = useContext(AuthContext);
  const { user, updateUserProfile } = useAuth();
  const [formData, setFormData] = useState({
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    email: user?.email || '',
    bio: user?.bio || '',
    profile_picture: null
  });
  const [previewImage, setPreviewImage] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const toast = useToast();
  
  // Colors
  const bgMain = useColorModeValue('white', 'gray.800');
  const bgSection = useColorModeValue('gray.50', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const headingColor = useColorModeValue('blue.600', 'blue.300');

  useEffect(() => {
    if (!authTokens || !authTokens.access) {
      navigate('/login');
      return;
    }

    const fetchUserProfile = async () => {
      try {
        // Log the fetch attempt for debugging
        console.log('Fetching user profile for edit...');
        
        // Updated URL to match backend structure from elearning_backend/urls.py
        const response = await fetch('http://localhost:8000/api/accounts/api/profile/', {
          headers: {
            'Authorization': `Bearer ${authTokens.access}`,
            'Accept': 'application/json',
          },
        });

        // Log the response status for debugging
        console.log('Profile API response status:', response.status);

        if (!response.ok) {
          if (response.status === 401) {
            navigate('/login');
            return;
          }
          
          // Try to get more detailed error information
          const errorBody = await response.json().catch(() => ({ detail: 'Failed to fetch user profile' }));
          throw new Error(errorBody.detail || `Failed to fetch user profile (Status: ${response.status})`);
        }

        const data = await response.json();
        console.log('Profile data:', data);
        
        // Log the profile picture URL if it exists
        if (data.profile_picture) {
          console.log('Original profile picture URL:', data.profile_picture);
        }
        
        setFormData(prevData => ({
          ...prevData,
          ...data,
          date_of_birth: data.date_of_birth || '',
          profile_picture: null
        }));
        if (data.profile_picture) {
          setPreviewImage(data.profile_picture);
          console.log('Preview image set to:', data.profile_picture);
        }
      } catch (err) {
        console.error('Error fetching profile:', err);
        setError(err.message);
        toast({
          title: 'Error fetching profile',
          description: err.message,
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [navigate, authTokens, toast]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e) => {
    if (e.target.files[0]) {
      setFormData(prev => ({
        ...prev,
        profile_picture: e.target.files[0]
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('first_name', formData.first_name);
      formDataToSend.append('last_name', formData.last_name);
      formDataToSend.append('email', formData.email);
      formDataToSend.append('bio', formData.bio);
      if (formData.profile_picture) {
        formDataToSend.append('profile_picture', formData.profile_picture);
      }

      const response = await fetch('http://localhost:8000/api/accounts/profile/', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${JSON.parse(localStorage.getItem('authTokens')).access}`,
        },
        body: formDataToSend,
      });

      if (!response.ok) {
        throw new Error('Failed to update profile');
      }

      const updatedProfile = await response.json();
      
      // Update the user context with the new profile data
      await updateUserProfile(updatedProfile);

      toast({
        title: 'Success',
        description: 'Profile updated successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (err) {
      setError(err.message);
      toast({
        title: 'Error',
        description: err.message,
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Flex direction="column" minH="100vh">
        <Navbar />
        <Flex flex="1" justify="center" align="center">
          <VStack spacing={4}>
            <Spinner size="xl" thickness="4px" color="blue.500" />
            <Text>Loading profile...</Text>
          </VStack>
        </Flex>
        <Footer />
      </Flex>
    );
  }

  return (
    <Flex direction="column" minH="100vh">
      <Navbar />
      <Box bg={bgSection} py={8} flex="1">
        <Container maxW="container.lg">
          <VStack spacing={8} align="stretch">
            <Box
              bg={bgMain}
              p={6}
              borderRadius="lg"
              boxShadow="md"
              borderWidth="1px"
              borderColor={borderColor}
            >
              <Heading as="h1" size="xl" mb={6} color={headingColor}>
                Edit Profile
              </Heading>
              
              {error && (
                <Alert status="error" mb={6} borderRadius="md">
                  <AlertIcon />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
              <form onSubmit={handleSubmit}>
                <VStack spacing={8} align="stretch">
                  {/* Profile Picture Section */}
                  <Box>
                    <Heading as="h2" size="md" mb={4} color={headingColor}>
                      Profile Picture
                    </Heading>
                    <Center flexDirection="column" py={4}>
                      <Avatar 
                        size="2xl" 
                        src={previewImage ? (previewImage instanceof File ? URL.createObjectURL(previewImage) : previewImage.startsWith('http') ? previewImage : `http://localhost:8000${previewImage.replace(/^\/media/, '/media')}?t=${new Date().getTime()}`) : null} 
                        name={formData.first_name ? `${formData.first_name} ${formData.last_name}` : 'User'}
                        mb={4}
                      />
                      <FormControl>
                        <FormLabel 
                          htmlFor="profile-picture" 
                          mb={2}
                          display="inline-block"
                          px={4}
                          py={2}
                          border="1px solid"
                          borderColor="blue.500"
                          borderRadius="md"
                          color="blue.500"
                          _hover={{ bg: 'blue.50' }}
                          cursor="pointer"
                        >
                          Choose New Picture
                        </FormLabel>
                        <Input
                          type="file"
                          id="profile-picture"
                          accept="image/*"
                          onChange={handleFileChange}
                          display="none"
                        />
                      </FormControl>
                    </Center>
                  </Box>
                  
                  {/* Basic Information */}
                  <Box>
                    <Heading as="h2" size="md" mb={4} color={headingColor}>
                      Basic Information
                    </Heading>
                    <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
                      <FormControl>
                        <FormLabel htmlFor="first_name">First Name</FormLabel>
                        <Input 
                          id="first_name"
                          name="first_name"
                          value={formData.first_name}
                          onChange={handleChange}
                          bg={bgMain}
                        />
                      </FormControl>
                      <FormControl>
                        <FormLabel htmlFor="last_name">Last Name</FormLabel>
                        <Input 
                          id="last_name"
                          name="last_name"
                          value={formData.last_name}
                          onChange={handleChange}
                          bg={bgMain}
                        />
                      </FormControl>
                      <FormControl>
                        <FormLabel htmlFor="email">Email</FormLabel>
                        <Input 
                          id="email"
                          name="email"
                          type="email"
                          value={formData.email}
                          onChange={handleChange}
                          bg={bgMain}
                        />
                      </FormControl>
                    </SimpleGrid>
                  </Box>
                  
                  {/* Additional Information */}
                  <Box>
                    <Heading as="h2" size="md" mb={4} color={headingColor}>
                      Additional Information
                    </Heading>
                    <VStack spacing={6} align="stretch">
                      <FormControl>
                        <FormLabel htmlFor="bio">Bio</FormLabel>
                        <Textarea 
                          id="bio"
                          name="bio"
                          value={formData.bio}
                          onChange={handleChange}
                          bg={bgMain}
                          resize="vertical"
                          minH="120px"
                        />
                      </FormControl>
                    </VStack>
                  </Box>
                  
                  {/* Form Actions */}
                  <Stack direction={{ base: 'column', sm: 'row' }} spacing={4} justify="flex-end" pt={4}>
                    <Button 
                      as={Link}
                      to="/profile"
                      colorScheme="gray"
                      width={{ base: '100%', sm: 'auto' }}
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit" 
                      colorScheme="blue"
                      isLoading={isSubmitting}
                      loadingText="Saving"
                      width={{ base: '100%', sm: 'auto' }}
                    >
                      Save Changes
                    </Button>
                  </Stack>
                </VStack>
              </form>
            </Box>
          </VStack>
        </Container>
      </Box>
      <Footer />
    </Flex>
  );
};

export default EditProfile; 