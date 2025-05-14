import React, { useState } from 'react';
import {
  Box,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Button,
  useColorModeValue,
  Heading,
  Container,
  HStack,
  Input,
  Select,
  IconButton,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Badge,
  useToast,
} from '@chakra-ui/react';
import { FiMoreVertical, FiSearch, FiUserPlus } from 'react-icons/fi';

const UsersManagement = () => {
  const [users] = useState([
    {
      id: 1,
      name: 'John Doe',
      email: 'john@example.com',
      role: 'student',
      status: 'active',
      joinDate: '2024-01-15',
    },
    {
      id: 2,
      name: 'Jane Smith',
      email: 'jane@example.com',
      role: 'instructor',
      status: 'active',
      joinDate: '2024-02-01',
    },
    // Add more sample users as needed
  ]);

  const toast = useToast();
  const tableBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  const handleAction = (action, userId) => {
    toast({
      title: `${action} user ${userId}`,
      status: 'info',
      duration: 2000,
    });
  };

  const StatusBadge = ({ status }) => {
    const colorScheme = {
      active: 'green',
      inactive: 'red',
      pending: 'yellow',
    }[status] || 'gray';

    return (
      <Badge colorScheme={colorScheme} variant="subtle">
        {status}
      </Badge>
    );
  };

  const RoleBadge = ({ role }) => {
    const colorScheme = {
      admin: 'purple',
      instructor: 'blue',
      student: 'green',
    }[role] || 'gray';

    return (
      <Badge colorScheme={colorScheme} variant="subtle">
        {role}
      </Badge>
    );
  };

  return (
    <Container maxW="container.xl" py={8}>
      <Box mb={8}>
        <Heading mb={6}>Users Management</Heading>
        
        {/* Filters and Actions */}
        <HStack spacing={4} mb={6}>
          <Input
            placeholder="Search users..."
            maxW="300px"
            leftElement={<FiSearch />}
          />
          <Select placeholder="Role" maxW="200px">
            <option value="all">All Roles</option>
            <option value="student">Student</option>
            <option value="instructor">Instructor</option>
            <option value="admin">Admin</option>
          </Select>
          <Select placeholder="Status" maxW="200px">
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="pending">Pending</option>
          </Select>
          <Button
            leftIcon={<FiUserPlus />}
            colorScheme="blue"
            ml="auto"
          >
            Add User
          </Button>
        </HStack>

        {/* Users Table */}
        <Box
          bg={tableBg}
          shadow="base"
          rounded="lg"
          overflow="hidden"
          borderWidth="1px"
          borderColor={borderColor}
        >
          <Table variant="simple">
            <Thead>
              <Tr>
                <Th>Name</Th>
                <Th>Email</Th>
                <Th>Role</Th>
                <Th>Status</Th>
                <Th>Join Date</Th>
                <Th>Actions</Th>
              </Tr>
            </Thead>
            <Tbody>
              {users.map((user) => (
                <Tr key={user.id}>
                  <Td>{user.name}</Td>
                  <Td>{user.email}</Td>
                  <Td>
                    <RoleBadge role={user.role} />
                  </Td>
                  <Td>
                    <StatusBadge status={user.status} />
                  </Td>
                  <Td>{new Date(user.joinDate).toLocaleDateString()}</Td>
                  <Td>
                    <Menu>
                      <MenuButton
                        as={IconButton}
                        icon={<FiMoreVertical />}
                        variant="ghost"
                        size="sm"
                      />
                      <MenuList>
                        <MenuItem onClick={() => handleAction('edit', user.id)}>
                          Edit
                        </MenuItem>
                        <MenuItem onClick={() => handleAction('view', user.id)}>
                          View Details
                        </MenuItem>
                        <MenuItem onClick={() => handleAction('delete', user.id)}>
                          Delete
                        </MenuItem>
                      </MenuList>
                    </Menu>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </Box>
      </Box>
    </Container>
  );
};

export default UsersManagement; 