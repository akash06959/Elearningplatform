import React, { useContext, useState, useEffect, useRef } from 'react';
import {
    Box,
    Flex,
    Text,
    IconButton,
    Button,
    Stack,
    Collapse,
    Icon,
    Link as ChakraLink,
    Popover,
    PopoverTrigger,
    PopoverContent,
    useColorModeValue,
    useBreakpointValue,
    useDisclosure,
    Avatar,
    Menu,
    MenuButton,
    MenuList,
    MenuItem,
    Input,
    InputGroup,
    InputLeftElement,
    InputRightElement,
    Badge,
    Tooltip,
    Progress,
    VStack,
    useColorMode,
} from '@chakra-ui/react';
import {
    HamburgerIcon,
    CloseIcon,
    ChevronDownIcon,
    ChevronRightIcon,
    SearchIcon,
    BellIcon,
    BookIcon,
    GraduationCapIcon,
    ViewIcon,
    MoonIcon,
    SunIcon,
} from '@chakra-ui/icons';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../contexts/AuthContext';
import { FaBook, FaGraduationCap, FaChalkboardTeacher, FaSearch, FaBell } from 'react-icons/fa';
import { courseAPI } from '../../services/api';

export default function Navbar() {
    const { isOpen, onToggle } = useDisclosure();
    const { user, logoutUser } = useContext(AuthContext);
    const navigate = useNavigate();
    const userType = user?.role || localStorage.getItem('userType');
    const dashboardPath = userType === 'instructor' ? '/inst_dashboard' : '/std_dashboard';
    const [searchQuery, setSearchQuery] = useState('');
    const [suggestions, setSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const searchRef = useRef(null);

    const suggestionBg = useColorModeValue('white', 'gray.800');
    const suggestionHoverBg = useColorModeValue('gray.100', 'gray.700');

    const handleLogoClick = (e) => {
        e.preventDefault();
        navigate('/');
    };

    const handleSearch = async (value) => {
        setSearchQuery(value);
        if (value.length > 0) {
            try {
                const response = await courseAPI.getCourses(`?search=${value}`);
                setSuggestions(response);
                setShowSuggestions(true);
            } catch (error) {
                console.error('Error fetching suggestions:', error);
                setSuggestions([]);
            }
        } else {
            setSuggestions([]);
            setShowSuggestions(false);
        }
    };

    const handleSuggestionClick = (courseId) => {
        setShowSuggestions(false);
        navigate(`/courses/${courseId}`);
    };

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (searchRef.current && !searchRef.current.contains(event.target)) {
                setShowSuggestions(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    return (
        <Box bg={useColorModeValue('white', 'gray.900')} px={4} boxShadow="sm">
            <Flex
                bg="blue.600"
                color="white"
                minH={'70px'}
                py={{ base: 2 }}
                px={{ base: 4 }}
                borderBottom={1}
                borderStyle={'solid'}
                borderColor="blue.500"
                align={'center'}
                position="fixed"
                top={0}
                width="100%"
                zIndex={1000}
                boxShadow="0 2px 4px rgba(0,0,0,0.1)"
            >
                <Flex
                    flex={{ base: 1, md: 'auto' }}
                    ml={{ base: -2 }}
                    display={{ base: 'flex', md: 'none' }}
                >
                    <IconButton
                        onClick={onToggle}
                        icon={isOpen ? <CloseIcon w={3} h={3} /> : <HamburgerIcon w={5} h={5} />}
                        variant={'ghost'}
                        color="white"
                        _hover={{ bg: 'blue.500' }}
                        aria-label={'Toggle Navigation'}
                    />
                </Flex>
                <Flex flex={{ base: 1 }} justify={{ base: 'center', md: 'start' }} align="center">
                    <Text
                        textAlign={useBreakpointValue({ base: 'center', md: 'left' })}
                        fontFamily={'heading'}
                        color="white"
                        fontWeight="bold"
                        fontSize="xl"
                        cursor="pointer"
                        onClick={handleLogoClick}
                        _hover={{ color: 'blue.100' }}
                        mr={4}
                    >
                        ELearning Platform
                    </Text>

                    <Flex display={{ base: 'none', md: 'flex' }} ml={10} align="center" flex={1}>
                        <Stack direction={'row'} spacing={4} flex={1} justify="space-between">
                            {user && (
                                <>
                                    <Flex gap={4}>
                                        <Popover trigger={'hover'} placement={'bottom-start'}>
                                            <PopoverTrigger>
                                                <ChakraLink
                                                    as={Link}
                                                    to="/courses"
                                                    p={2}
                                                    fontSize={'sm'}
                                                    fontWeight={500}
                                                    color={'white'}
                                                    _hover={{ color: 'blue.100' }}
                                                    display="flex"
                                                    alignItems="center"
                                                    gap={2}
                                                >
                                                    <Icon as={FaBook} />
                                                    Courses
                                                    <Icon as={ChevronDownIcon} ml={1} />
                                                </ChakraLink>
                                            </PopoverTrigger>
                                            <PopoverContent
                                                border={0}
                                                boxShadow={'xl'}
                                                bg={'white'}
                                                p={4}
                                                rounded={'xl'}
                                                minW={'sm'}
                                            >
                                                <Stack>
                                                    <ChakraLink
                                                        as={Link}
                                                        to="/courses?category=Computer Science"
                                                        p={2}
                                                        display="block"
                                                        rounded="md"
                                                        color="gray.800"
                                                        _hover={{
                                                            bg: 'blue.50',
                                                            color: 'blue.600',
                                                        }}
                                                    >
                                                        Computer Science
                                                    </ChakraLink>
                                                    <ChakraLink
                                                        as={Link}
                                                        to="/courses?category=Business"
                                                        p={2}
                                                        display="block"
                                                        rounded="md"
                                                        color="gray.800"
                                                        _hover={{
                                                            bg: 'blue.50',
                                                            color: 'blue.600',
                                                        }}
                                                    >
                                                        Business
                                                    </ChakraLink>
                                                    <ChakraLink
                                                        as={Link}
                                                        to="/courses?category=Design"
                                                        p={2}
                                                        display="block"
                                                        rounded="md"
                                                        color="gray.800"
                                                        _hover={{
                                                            bg: 'blue.50',
                                                            color: 'blue.600',
                                                        }}
                                                    >
                                                        Design
                                                    </ChakraLink>
                                                    <ChakraLink
                                                        as={Link}
                                                        to="/courses?category=Marketing"
                                                        p={2}
                                                        display="block"
                                                        rounded="md"
                                                        color="gray.800"
                                                        _hover={{
                                                            bg: 'blue.50',
                                                            color: 'blue.600',
                                                        }}
                                                    >
                                                        Marketing
                                                    </ChakraLink>
                                                </Stack>
                                            </PopoverContent>
                                        </Popover>

                                        <ChakraLink
                                            as={Link}
                                            to="/enrollments"
                                            p={2}
                                            fontSize={'sm'}
                                            fontWeight={500}
                                            color={'white'}
                                            _hover={{ color: 'blue.100' }}
                                            display="flex"
                                            alignItems="center"
                                            gap={2}
                                        >
                                            <Icon as={FaGraduationCap} />
                                            My Enrollments
                                        </ChakraLink>

                                        <ChakraLink
                                            as={Link}
                                            to="/instructors"
                                            p={2}
                                            fontSize={'sm'}
                                            fontWeight={500}
                                            color={'white'}
                                            _hover={{ color: 'blue.100' }}
                                            display="flex"
                                            alignItems="center"
                                            gap={2}
                                        >
                                            <Icon as={FaChalkboardTeacher} />
                                            Instructors
                                        </ChakraLink>
                                    </Flex>

                                    <Box flex={1} display="flex" justifyContent="center" maxW="600px">
                                        <form onSubmit={(e) => { e.preventDefault(); handleSearch(searchQuery); }} style={{ width: '100%' }}>
                                            <InputGroup size="md">
                                                <InputLeftElement pointerEvents="none" h="100%" pl={2}>
                                                    <Icon as={FaSearch} color="gray.400" boxSize={4} />
                                                </InputLeftElement>
                                                <Input
                                                    placeholder="Search for courses..."
                                                    value={searchQuery}
                                                    onChange={(e) => setSearchQuery(e.target.value)}
                                                    onFocus={() => setShowSuggestions(true)}
                                                    bg="white"
                                                    color="gray.700"
                                                    borderRadius="full"
                                                    py={2}
                                                    pl={10}
                                                    fontSize="md"
                                                    _focus={{ 
                                                        borderColor: 'blue.300',
                                                        boxShadow: '0 0 0 1px blue.300'
                                                    }}
                                                    _placeholder={{
                                                        color: 'gray.500'
                                                    }}
                                                />
                                            </InputGroup>
                                        </form>
                                    </Box>
                                    <Box width="200px" /> {/* Spacer to balance the navigation items */}
                                </>
                            )}
                        </Stack>
                    </Flex>
                </Flex>

                <Stack
                    flex={{ base: 1, md: 0 }}
                    justify={'flex-end'}
                    direction={'row'}
                    spacing={6}
                    align="center"
                >
                    {user && (
                        <>
                            <Box position="relative" display="flex" alignItems="center" justifyContent="center">
                                <IconButton
                                    as={Link}
                                    to="/notifications"
                                    aria-label="Notifications"
                                    icon={<Icon as={FaBell} boxSize={5} />}
                                    variant="ghost"
                                    color="white"
                                    _hover={{ bg: 'blue.500' }}
                                    size="md"
                                    isRound
                                />
                                <Badge
                                    colorScheme="red"
                                    position="absolute"
                                    top="0"
                                    right="0"
                                    borderRadius="full"
                                    fontSize="xs"
                                    minW="20px"
                                    h="20px"
                                    display="flex"
                                    alignItems="center"
                                    justifyContent="center"
                                    fontWeight="bold"
                                    transform="translate(25%, -25%)"
                                >
                                    3
                                </Badge>
                            </Box>
                        </>
                    )}

                    {user ? (
                        <Menu>
                            <MenuButton
                                as={Button}
                                rounded={'full'}
                                variant={'link'}
                                cursor={'pointer'}
                                minW={0}
                            >
                                <Avatar
                                    size={'md'}
                                    name={user.username}
                                    src={user.profile_picture || null}
                                    bg="blue.300"
                                />
                            </MenuButton>
                            <MenuList bg="white" color="gray.800">
                                <MenuItem as={Link} to={dashboardPath} icon={<Icon as={FaGraduationCap} />}>
                                    Dashboard
                                </MenuItem>
                                <MenuItem as={Link} to="/profile" icon={<Icon as={ViewIcon} />}>
                                    Profile
                                </MenuItem>
                                <MenuItem onClick={logoutUser} icon={<Icon as={CloseIcon} />}>
                                    Sign Out
                                </MenuItem>
                            </MenuList>
                        </Menu>
                    ) : (
                        <>
                            <Button 
                                as={Link} 
                                to="/login" 
                                fontSize={'sm'} 
                                fontWeight={400}
                                variant="ghost"
                                color="white"
                                _hover={{ bg: 'blue.500' }}
                            >
                                Sign In
                            </Button>
                            <Button
                                as={Link}
                                to="/register"
                                display={{ base: 'none', md: 'inline-flex' }}
                                fontSize={'sm'}
                                fontWeight={600}
                                color={'blue.600'}
                                bg={'white'}
                                _hover={{
                                    bg: 'blue.50',
                                }}
                            >
                                Sign Up
                            </Button>
                        </>
                    )}
                </Stack>
            </Flex>

            <Collapse in={isOpen} animateOpacity>
                <Box
                    bg="blue.600"
                    p={4}
                    display={{ md: 'none' }}
                >
                    <Stack spacing={4}>
                        {user && (
                            <>
                                <ChakraLink
                                    as={Link}
                                    to="/courses"
                                    p={2}
                                    fontSize={'sm'}
                                    fontWeight={500}
                                    color={'white'}
                                    _hover={{ color: 'blue.100' }}
                                    display="flex"
                                    alignItems="center"
                                    gap={2}
                                >
                                    <Icon as={FaBook} />
                                    Courses
                                </ChakraLink>
                                <ChakraLink
                                    as={Link}
                                    to="/enrollments"
                                    p={2}
                                    fontSize={'sm'}
                                    fontWeight={500}
                                    color={'white'}
                                    _hover={{ color: 'blue.100' }}
                                    display="flex"
                                    alignItems="center"
                                    gap={2}
                                >
                                    <Icon as={FaGraduationCap} />
                                    My Enrollments
                                </ChakraLink>
                                <ChakraLink
                                    as={Link}
                                    to="/instructors"
                                    p={2}
                                    fontSize={'sm'}
                                    fontWeight={500}
                                    color={'white'}
                                    _hover={{ color: 'blue.100' }}
                                    display="flex"
                                    alignItems="center"
                                    gap={2}
                                >
                                    <Icon as={FaChalkboardTeacher} />
                                    Instructors
                                </ChakraLink>
                            </>
                        )}
                    </Stack>
                </Box>
            </Collapse>
            
            {/* Add spacing to prevent content from hiding under fixed navbar */}
            <Box height="70px" />

            {showSuggestions && suggestions.length > 0 && (
                <Box
                    position="absolute"
                    top="100%"
                    left={0}
                    right={0}
                    mt={1}
                    bg={suggestionBg}
                    boxShadow="lg"
                    borderRadius="md"
                    zIndex={1000}
                    maxH="400px"
                    overflowY="auto"
                >
                    {suggestions.map((course) => (
                        <Box
                            key={course.id}
                            p={2}
                            cursor="pointer"
                            _hover={{ bg: suggestionHoverBg }}
                            onClick={() => handleSuggestionClick(course.id)}
                        >
                            <VStack align="start" spacing={1}>
                                <Text fontWeight="medium">{course.title}</Text>
                                <Text fontSize="sm" color="gray.500">
                                    {course.instructor} • {course.category}
                                </Text>
                            </VStack>
                        </Box>
                    ))}
                </Box>
            )}
        </Box>
    );
}

const DesktopNav = () => {
    const linkHoverColor = 'blue.100';

    return (
        <Stack direction={'row'} spacing={4}>
            {NAV_ITEMS.map((navItem) => (
                <Box key={navItem.label}>
                    <Popover trigger={'hover'} placement={'bottom-start'}>
                        <PopoverTrigger>
                            <ChakraLink
                                p={2}
                                as={Link}
                                to={navItem.href ?? '#'}
                                fontSize={'sm'}
                                fontWeight={500}
                                color={'white'}
                                _hover={{
                                    textDecoration: 'none',
                                    color: linkHoverColor,
                                }}
                            >
                                {navItem.label}
                            </ChakraLink>
                        </PopoverTrigger>

                        {navItem.children && (
                            <PopoverContent
                                border={0}
                                boxShadow={'xl'}
                                bg={'white'}
                                p={4}
                                rounded={'xl'}
                                minW={'sm'}
                                color="gray.800"
                            >
                                <Stack>
                                    {navItem.children.map((child) => (
                                        <DesktopSubNav key={child.label} {...child} />
                                    ))}
                                </Stack>
                            </PopoverContent>
                        )}
                    </Popover>
                </Box>
            ))}
        </Stack>
    );
};

const DesktopSubNav = ({ label, href, subLabel }) => {
    return (
        <ChakraLink
            as={Link}
            to={href ?? '#'}
            role={'group'}
            display={'block'}
            p={2}
            rounded={'md'}
            _hover={{ bg: 'blue.50' }}
        >
            <Stack direction={'row'} align={'center'}>
                <Box>
                    <Text
                        transition={'all .3s ease'}
                        _groupHover={{ color: 'blue.500' }}
                        fontWeight={500}
                    >
                        {label}
                    </Text>
                    <Text fontSize={'sm'}>{subLabel}</Text>
                </Box>
                <Flex
                    transition={'all .3s ease'}
                    transform={'translateX(-10px)'}
                    opacity={0}
                    _groupHover={{ opacity: 1, transform: 'translateX(0)' }}
                    justify={'flex-end'}
                    align={'center'}
                    flex={1}
                >
                    <Icon color={'blue.500'} w={5} h={5} as={ChevronRightIcon} />
                </Flex>
            </Stack>
        </ChakraLink>
    );
};

const MobileNav = () => {
    return (
        <Stack bg={'blue.600'} p={4} display={{ md: 'none' }}>
            {NAV_ITEMS.map((navItem) => (
                <MobileNavItem key={navItem.label} {...navItem} />
            ))}
        </Stack>
    );
};

const MobileNavItem = ({ label, children, href }) => {
    const { isOpen, onToggle } = useDisclosure();

    return (
        <Stack spacing={4} onClick={children && onToggle}>
            <Flex
                py={2}
                as={Link}
                to={href ?? '#'}
                justify={'space-between'}
                align={'center'}
                _hover={{
                    textDecoration: 'none',
                }}
            >
                <Text fontWeight={600} color={'white'}>
                    {label}
                </Text>
                {children && (
                    <Icon
                        as={ChevronDownIcon}
                        transition={'all .25s ease-in-out'}
                        transform={isOpen ? 'rotate(180deg)' : ''}
                        w={6}
                        h={6}
                    />
                )}
            </Flex>

            <Collapse in={isOpen} animateOpacity style={{ marginTop: '0!important' }}>
                <Stack
                    mt={2}
                    pl={4}
                    borderLeft={1}
                    borderStyle={'solid'}
                    borderColor={'blue.500'}
                    align={'start'}
                >
                    {children &&
                        children.map((child) => (
                            <ChakraLink
                                key={child.label}
                                py={2}
                                as={Link}
                                to={child.href}
                                color="white"
                                _hover={{ color: 'blue.100' }}
                            >
                                {child.label}
                            </ChakraLink>
                        ))}
                </Stack>
            </Collapse>
        </Stack>
    );
};

const NAV_ITEMS = [
    {
        label: 'Home',
        href: '/',
    },
    {
        label: 'Courses',
        href: '/courses',
    },
    {
        label: 'My Learning',
        href: '/my-courses',
    },
    {
        label: 'About',
        href: '/about',
    },
]; 