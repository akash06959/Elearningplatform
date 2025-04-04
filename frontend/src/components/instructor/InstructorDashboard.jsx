import React, { useState, useContext, useEffect } from 'react';
import {
    Box,
    Flex,
    Icon,
    Text,
    Heading,
    SimpleGrid,
    Stat,
    StatLabel,
    StatNumber,
    StatHelpText,
    VStack,
    HStack,
    useColorModeValue,
    IconButton,
    Avatar,
    Menu,
    MenuButton,
    MenuList,
    MenuItem,
    Drawer,
    DrawerContent,
    useDisclosure,
    Table,
    Thead,
    Tbody,
    Tr,
    Th,
    Td,
    Badge,
    Button,
} from '@chakra-ui/react';
import { Link, useNavigate } from 'react-router-dom';
import {
    FiMenu,
    FiHome,
    FiBook,
    FiUsers,
    FiDollarSign,
    FiBarChart,
    FiSettings,
    FiBell,
    FiX,
} from 'react-icons/fi';
import { AuthContext } from '../../contexts/AuthContext';
import { courseAPI } from '../../services/api';

const SidebarContent = ({ onClose, ...rest }) => {
    const navigate = useNavigate();
    
    const NavItem = ({ icon, children, path, ...props }) => {
        const color = useColorModeValue('gray.600', 'gray.300');
        const hoverBg = useColorModeValue('blue.50', 'blue.800');
        const hoverColor = useColorModeValue('blue.600', 'blue.200');
        
        return (
            <Flex
                align="center"
                px="4"
                py="3"
                cursor="pointer"
                role="group"
                fontWeight="semibold"
                transition=".15s ease"
                color={color}
                _hover={{
                    bg: hoverBg,
                    color: hoverColor,
                }}
                onClick={() => {
                    navigate(path);
                    if (onClose) onClose();
                }}
                {...props}
            >
                {icon && (
                    <Icon
                        mr="4"
                        fontSize="16"
                        _groupHover={{
                            color: hoverColor,
                        }}
                        as={icon}
                    />
                )}
                {children}
            </Flex>
        );
    };

    const bgColor = useColorModeValue('white', 'gray.900');
    const borderColor = useColorModeValue('gray.200', 'gray.700');

    return (
        <Box
            bg={bgColor}
            borderRight="1px"
            borderRightColor={borderColor}
            w={{ base: 'full', md: 60 }}
            pos="fixed"
            h="full"
            {...rest}
        >
            <Flex h="20" alignItems="center" mx="8" justifyContent="space-between">
                <Text fontSize="2xl" fontWeight="bold">
                    Instructor
                </Text>
                <IconButton
                    display={{ base: 'flex', md: 'none' }}
                    onClick={onClose}
                    variant="outline"
                    aria-label="close menu"
                    icon={<FiX />}
                />
            </Flex>

            <VStack spacing={0} align="stretch">
                <NavItem icon={FiHome} path="/inst_dashboard">
                    Dashboard
                </NavItem>
                <NavItem icon={FiBook} path="/instructor/courses">
                    My Courses
                </NavItem>
                <NavItem icon={FiUsers} path="/instructor/students">
                    Students
                </NavItem>
                <NavItem icon={FiBarChart} path="/instructor/analytics">
                    Analytics
                </NavItem>
                <NavItem icon={FiDollarSign} path="/instructor/earnings">
                    Earnings
                </NavItem>
                <NavItem icon={FiSettings} path="/instructor/settings">
                    Settings
                </NavItem>
            </VStack>
        </Box>
    );
};

const Header = ({ onOpen, ...rest }) => {
    const { user, logoutUser } = useContext(AuthContext);
    const navigate = useNavigate();

    return (
        <Flex
            ml={{ base: 0, md: 60 }}
            px="4"
            height="20"
            alignItems="center"
            bg={useColorModeValue('white', 'gray.900')}
            borderBottomWidth="1px"
            borderBottomColor={useColorModeValue('gray.200', 'gray.700')}
            justifyContent="space-between"
            {...rest}
        >
            <IconButton
                display={{ base: 'flex', md: 'none' }}
                onClick={onOpen}
                variant="outline"
                aria-label="open menu"
                icon={<FiMenu />}
            />

            <Heading size="lg" display={{ base: 'none', md: 'flex' }}>
                Dashboard
            </Heading>

            <HStack spacing={4}>
                <IconButton
                    icon={<FiBell />}
                    variant="ghost"
                    aria-label="notifications"
                    onClick={() => navigate('/instructor/notifications')}
                />
                
                <Menu>
                    <MenuButton>
                        <Avatar
                            size="sm"
                            name={user?.username}
                            bg="blue.500"
                            color="white"
                        />
                    </MenuButton>
                    <MenuList>
                        <MenuItem as={Link} to="/profile">Profile</MenuItem>
                        <MenuItem as={Link} to="/instructor/settings">Settings</MenuItem>
                        <MenuItem onClick={logoutUser}>Sign Out</MenuItem>
                    </MenuList>
                </Menu>
            </HStack>
        </Flex>
    );
};

const StatCard = ({ title, value, icon, helpText }) => {
    const bgColor = useColorModeValue('white', 'gray.700');
    const textColor = useColorModeValue('gray.600', 'gray.200');

    return (
        <Box 
            p={6} 
            bg={bgColor} 
            borderRadius="lg" 
            boxShadow="sm"
            _hover={{ transform: 'translateY(-2px)', boxShadow: 'md' }}
            transition="all 0.2s"
        >
            <HStack spacing={4}>
                <Icon as={icon} w={8} h={8} color="blue.500" />
                <Stat>
                    <StatLabel color={textColor}>{title}</StatLabel>
                    <StatNumber fontSize="3xl">{value}</StatNumber>
                    {helpText && (
                        <StatHelpText color={textColor}>{helpText}</StatHelpText>
                    )}
                </Stat>
            </HStack>
        </Box>
    );
};

const InstructorDashboard = () => {
    const { isOpen, onOpen, onClose } = useDisclosure();
    const [stats, setStats] = useState({
        totalCourses: 0,
        totalStudents: 0,
        activeEnrollments: 0,
        totalRevenue: 0,
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const bgColor = useColorModeValue('gray.50', 'gray.800');

    useEffect(() => {
        const fetchStats = async () => {
            try {
                setLoading(true);
                const courses = await courseAPI.getInstructorCourses();
                
                // Calculate stats from courses
                const totalStudents = courses.reduce((acc, course) => acc + (course.total_students || 0), 0);
                const activeEnrollments = courses.reduce((acc, course) => acc + (course.active_enrollments || 0), 0);
                const totalRevenue = courses.reduce((acc, course) => acc + (course.revenue || 0), 0);

                setStats({
                    totalCourses: courses.length,
                    totalStudents,
                    activeEnrollments,
                    totalRevenue,
                });
            } catch (err) {
                console.error('Error fetching instructor stats:', err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

    return (
        <Box minH="100vh" bg={bgColor}>
            <SidebarContent
                onClose={onClose}
                display={{ base: 'none', md: 'block' }}
            />
            <Drawer
                isOpen={isOpen}
                placement="left"
                onClose={onClose}
                returnFocusOnClose={false}
                onOverlayClick={onClose}
                size="full"
            >
                <DrawerContent>
                    <SidebarContent onClose={onClose} />
                </DrawerContent>
            </Drawer>

            {/* Main content */}
            <Box ml={{ base: 0, md: 60 }} p="4">
                {/* Header */}
                <Header onOpen={onOpen} />

                {/* Dashboard content */}
                <Box pt={8}>
                    <VStack spacing={8} align="stretch">
                        {/* Stats Grid */}
                        <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={6}>
                            <StatCard
                                title="Total Courses"
                                value={stats.totalCourses}
                                icon={FiBook}
                                helpText="Published and drafts"
                            />
                            <StatCard
                                title="Total Students"
                                value={stats.totalStudents}
                                icon={FiUsers}
                                helpText="Across all courses"
                            />
                            <StatCard
                                title="Active Enrollments"
                                value={stats.activeEnrollments}
                                icon={FiBarChart}
                                helpText="Currently learning"
                            />
                            <StatCard
                                title="Total Revenue"
                                value={`$${stats.totalRevenue.toFixed(2)}`}
                                icon={FiDollarSign}
                                helpText="All time earnings"
                            />
                        </SimpleGrid>

                        {/* Quick Actions */}
                        <Box>
                            <Heading size="md" mb={4}>
                                Quick Actions
                            </Heading>
                            <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={4}>
                                <Button
                                    as={Link}
                                    to="/instructor/create-course"
                                    colorScheme="blue"
                                    leftIcon={<Icon as={FiBook} />}
                                >
                                    Create New Course
                                </Button>
                                <Button
                                    as={Link}
                                    to="/instructor/courses"
                                    colorScheme="teal"
                                    leftIcon={<Icon as={FiBook} />}
                                >
                                    Manage Courses
                                </Button>
                                <Button
                                    as={Link}
                                    to="/instructor/analytics"
                                    colorScheme="purple"
                                    leftIcon={<Icon as={FiBarChart} />}
                                >
                                    View Analytics
                                </Button>
                                <Button
                                    as={Link}
                                    to="/instructor/students"
                                    colorScheme="orange"
                                    leftIcon={<Icon as={FiUsers} />}
                                >
                                    Student Overview
                                </Button>
                            </SimpleGrid>
                        </Box>
                    </VStack>
                </Box>
            </Box>
        </Box>
    );
};

export default InstructorDashboard; 