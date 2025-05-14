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
  Avatar, 
  Badge, 
  Button, 
  Spinner, 
  Grid, 
  GridItem, 
  SimpleGrid,
  useColorModeValue,
  Divider,
  HStack,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Wrap,
  WrapItem,
  useToast
} from '@chakra-ui/react';
import { FaEdit, FaUser, FaEnvelope, FaPhone, FaMapMarkerAlt, FaCalendarAlt, FaGlobe, FaClock, FaMedal } from 'react-icons/fa';

const UserProfile = () => {
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { authTokens } = useContext(AuthContext);
  const toast = useToast();
  
  // Colors
  const bgMain = useColorModeValue('white', 'gray.800');
  const bgSection = useColorModeValue('gray.50', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const headingColor = useColorModeValue('blue.600', 'blue.300');
  const labelColor = useColorModeValue('gray.600', 'gray.400');
  const valueColor = useColorModeValue('gray.800', 'white');

  useEffect(() => {
    if (!authTokens || !authTokens.access) {
      navigate('/login');
      return;
    }

    const fetchUserProfile = async () => {
      try {
        // Log the fetch attempt for debugging
        console.log('Fetching user profile...');
        
        // Updated URL to match backend structure from elearning_backend/urls.py
        const response = await fetch('http://localhost:8000/api/accounts/api/profile/', {
          headers: {
            'Authorization': `Bearer ${authTokens.access}`,
            'Accept': 'application/json',
          },
          // Add cache control to prevent browser from using cached response
          cache: 'no-cache'
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
        
        // Log the profile picture URL for debugging
        if (data.profile_picture) {
          console.log('Original profile picture URL:', data.profile_picture);
        }
        
        setUserProfile(data);
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

  // InfoItem component for displaying profile information
  const InfoItem = ({ label, value, icon }) => (
    <GridItem>
      <Flex direction="column" p={4} bg={bgSection} borderRadius="md" boxShadow="sm" height="100%">
        <Flex align="center" mb={2} color={labelColor}>
          {icon && <Box mr={2}>{icon}</Box>}
          <Text fontWeight="600">{label}</Text>
        </Flex>
        <Text color={valueColor}>{value || 'Not specified'}</Text>
      </Flex>
    </GridItem>
  );

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

  if (error) {
    return (
      <Flex direction="column" minH="100vh">
        <Navbar />
        <Container maxW="container.lg" py={8}>
          <Alert status="error" variant="subtle" flexDirection="column" alignItems="center" justifyContent="center" textAlign="center" borderRadius="lg" p={6}>
            <AlertIcon boxSize="40px" mr={0} mb={4} />
            <AlertTitle mt={0} mb={2} fontSize="lg">Error Loading Profile</AlertTitle>
            <AlertDescription maxWidth="md">{error}</AlertDescription>
            <Button mt={4} colorScheme="red" onClick={() => window.location.reload()}>Try Again</Button>
          </Alert>
        </Container>
        <Footer />
      </Flex>
    );
  }

  if (!userProfile) {
    return (
      <Flex direction="column" minH="100vh">
        <Navbar />
        <Container maxW="container.lg" py={8}>
          <Alert status="info" variant="subtle" flexDirection="column" alignItems="center" justifyContent="center" textAlign="center" borderRadius="lg" p={6}>
            <AlertIcon boxSize="40px" mr={0} mb={4} />
            <AlertTitle mt={0} mb={2} fontSize="lg">No Profile Data</AlertTitle>
            <AlertDescription maxWidth="md">No profile information is available. Would you like to create your profile?</AlertDescription>
            <Button as={Link} to="/profile/edit" mt={4} colorScheme="blue" leftIcon={<FaEdit />}>Create Profile</Button>
          </Alert>
        </Container>
        <Footer />
      </Flex>
    );
  }

  return (
    <Flex direction="column" minH="100vh">
      <Navbar />
      <Box bg={bgSection} py={8} flex="1">
        <Container maxW="container.lg">
          <Box
            bg={bgMain}
            p={6}
            borderRadius="lg"
            boxShadow="lg"
            borderWidth="1px"
            borderColor={borderColor}
            overflow="hidden"
          >
            <VStack spacing={8} align="stretch">
              {/* Profile Header with Avatar and Name */}
              <Flex 
                direction={{ base: 'column', md: 'row' }} 
                align={{ base: 'center', md: 'flex-start' }} 
                justify="space-between"
                pb={6}
                borderBottomWidth="1px"
                borderColor={borderColor}
              >
                <Flex direction={{ base: 'column', md: 'row' }} align="center" gap={6}>
                  <Avatar 
                    size="2xl" 
                    name={userProfile.first_name ? `${userProfile.first_name} ${userProfile.last_name}` : userProfile.username}
                    src={userProfile.profile_picture ? `http://localhost:8000${userProfile.profile_picture.replace(/^\/media/, '/media')}?t=${new Date().getTime()}` : null}
                    bg="blue.500"
                  />
                  <VStack align={{ base: 'center', md: 'flex-start' }} spacing={1}>
                    <Heading as="h1" size="xl" color={headingColor}>
                      {userProfile.first_name && userProfile.last_name 
                        ? `${userProfile.first_name} ${userProfile.last_name}`
                        : userProfile.username}
                    </Heading>
                    <Badge colorScheme="blue" fontSize="md" px={3} py={1} borderRadius="full" textTransform="capitalize">
                      {userProfile.user_type}
                    </Badge>
                    <Text mt={2} color={labelColor} fontSize="md">
                      Joined {new Date(userProfile.date_joined || new Date()).toLocaleDateString()}
                    </Text>
                  </VStack>
                </Flex>
                <Button 
                  as={Link} 
                  to="/profile/edit" 
                  colorScheme="blue" 
                  leftIcon={<FaEdit />}
                  mt={{ base: 4, md: 0 }}
                >
                  Edit Profile
                </Button>
              </Flex>

              {/* Basic Information */}
              <Box>
                <Heading as="h2" size="lg" mb={4} color={headingColor}>
                  Basic Information
                </Heading>
                <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
                  <InfoItem label="Username" value={userProfile.username} icon={<FaUser />} />
                  <InfoItem label="Email" value={userProfile.email} icon={<FaEnvelope />} />
                  <InfoItem label="Phone Number" value={userProfile.phone_number} icon={<FaPhone />} />
                  <InfoItem label="First Name" value={userProfile.first_name} icon={<FaUser />} />
                  <InfoItem label="Last Name" value={userProfile.last_name} icon={<FaUser />} />
                  <InfoItem label="User Type" value={userProfile.user_type} icon={<FaUser />} />
                </SimpleGrid>
              </Box>

              {/* Additional Information */}
              <Box>
                <Heading as="h2" size="lg" mb={4} color={headingColor}>
                  Additional Information
                </Heading>
                <VStack spacing={4} align="stretch">
                  <Box p={4} bg={bgSection} borderRadius="md" boxShadow="sm">
                    <Flex align="center" mb={2} color={labelColor}>
                      <FaUser style={{ marginRight: '0.5rem' }} />
                      <Text fontWeight="600">Bio</Text>
                    </Flex>
                    <Text color={valueColor}>{userProfile.bio || 'No bio added yet'}</Text>
                  </Box>
                  <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                    <InfoItem label="Address" value={userProfile.address} icon={<FaMapMarkerAlt />} />
                    <InfoItem label="Date of Birth" value={userProfile.date_of_birth} icon={<FaCalendarAlt />} />
                    <InfoItem label="Preferred Language" value={userProfile.preferred_language} icon={<FaGlobe />} />
                    <InfoItem label="Timezone" value={userProfile.timezone} icon={<FaClock />} />
                  </SimpleGrid>
                </VStack>
              </Box>

              {/* Achievements Section */}
              <Box>
                <Heading as="h2" size="lg" mb={4} color={headingColor}>
                  Achievements
                </Heading>
                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                  <InfoItem 
                    label="Points" 
                    value={userProfile.points || '0'} 
                    icon={<FaMedal />} 
                  />
                  <Box p={4} bg={bgSection} borderRadius="md" boxShadow="sm">
                    <Flex align="center" mb={3} color={labelColor}>
                      <FaMedal style={{ marginRight: '0.5rem' }} />
                      <Text fontWeight="600">Badges</Text>
                    </Flex>
                    {userProfile.badges && userProfile.badges.length > 0 ? (
                      <Wrap spacing={2}>
                        {userProfile.badges.map((badge, index) => (
                          <WrapItem key={index}>
                            <Badge colorScheme="purple" py={1} px={3} borderRadius="full">
                              {badge}
                            </Badge>
                          </WrapItem>
                        ))}
                      </Wrap>
                    ) : (
                      <Text color={valueColor}>No badges earned yet</Text>
                    )}
                  </Box>
                </SimpleGrid>
              </Box>
            </VStack>
          </Box>
        </Container>
      </Box>
      <Footer />
    </Flex>
  );
};

export default UserProfile; 