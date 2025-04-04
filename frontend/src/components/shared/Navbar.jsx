import React, { useContext } from 'react';
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
} from '@chakra-ui/react';
import {
    HamburgerIcon,
    CloseIcon,
    ChevronDownIcon,
    ChevronRightIcon,
} from '@chakra-ui/icons';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../contexts/AuthContext';

export default function Navbar() {
    const { isOpen, onToggle } = useDisclosure();
    const { user, logoutUser } = useContext(AuthContext);
    const navigate = useNavigate();
    const userType = user?.role || localStorage.getItem('userType');
    const dashboardPath = userType === 'instructor' ? '/inst_dashboard' : '/std_dashboard';

    const handleLogoClick = (e) => {
        e.preventDefault();
        if (user) {
            navigate(dashboardPath);
        } else {
            navigate('/');
        }
    };

    return (
        <Box>
            <Flex
                bg="blue.600"
                color="white"
                minH={'60px'}
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
                <Flex flex={{ base: 1 }} justify={{ base: 'center', md: 'start' }}>
                    <Text
                        textAlign={useBreakpointValue({ base: 'center', md: 'left' })}
                        fontFamily={'heading'}
                        color="white"
                        fontWeight="bold"
                        fontSize="xl"
                        cursor="pointer"
                        onClick={handleLogoClick}
                    >
                        ELearning Platform
                    </Text>

                    <Flex display={{ base: 'none', md: 'flex' }} ml={10}>
                        <Stack direction={'row'} spacing={4}>
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
                                    >
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
                                    >
                                        My Learning
                                    </ChakraLink>
                                    <ChakraLink
                                        as={Link}
                                        to="/instructors"
                                        p={2}
                                        fontSize={'sm'}
                                        fontWeight={500}
                                        color={'white'}
                                        _hover={{ color: 'blue.100' }}
                                    >
                                        Instructors
                                    </ChakraLink>
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
                                    size={'sm'}
                                    name={user.username}
                                    bg="blue.300"
                                />
                            </MenuButton>
                            <MenuList bg="white" color="gray.800">
                                <MenuItem as={Link} to={dashboardPath}>Dashboard</MenuItem>
                                <MenuItem as={Link} to="/profile">Profile</MenuItem>
                                <MenuItem onClick={logoutUser}>Sign Out</MenuItem>
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
                                >
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
                                >
                                    My Learning
                                </ChakraLink>
                                <ChakraLink
                                    as={Link}
                                    to="/instructors"
                                    p={2}
                                    fontSize={'sm'}
                                    fontWeight={500}
                                    color={'white'}
                                    _hover={{ color: 'blue.100' }}
                                >
                                    Instructors
                                </ChakraLink>
                            </>
                        )}
                    </Stack>
                </Box>
            </Collapse>
            
            {/* Add spacing to prevent content from hiding under fixed navbar */}
            <Box height="60px" />
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