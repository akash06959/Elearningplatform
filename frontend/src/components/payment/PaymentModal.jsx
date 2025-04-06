import React, { useState } from 'react';
import {
  Box,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  FormControl,
  FormLabel,
  Input,
  Button,
  VStack,
  Text,
  useToast,
  Image,
  Divider,
  HStack,
} from '@chakra-ui/react';
import { FaCreditCard, FaLock } from 'react-icons/fa';

const PaymentModal = ({ isOpen, onClose, course, onPaymentSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    cardNumber: '',
    cardName: '',
    expiryDate: '',
    cvv: '',
  });
  const toast = useToast();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    let formattedValue = value;

    // Format card number with spaces
    if (name === 'cardNumber') {
      formattedValue = value.replace(/\s/g, '').match(/.{1,4}/g)?.join(' ') || '';
    }
    // Format expiry date with slash
    else if (name === 'expiryDate') {
      formattedValue = value
        .replace(/\D/g, '')
        .replace(/(\d{2})(\d)/, '$1/$2')
        .substr(0, 5);
    }

    setFormData((prev) => ({
      ...prev,
      [name]: formattedValue,
    }));
  };

  const validateForm = () => {
    const errors = [];
    const { cardNumber, cardName, expiryDate, cvv } = formData;

    if (!cardNumber || cardNumber.replace(/\s/g, '').length !== 16) {
      errors.push('Please enter a valid 16-digit card number');
    }
    if (!cardName || cardName.length < 3) {
      errors.push('Please enter the cardholder name');
    }
    if (!expiryDate || !expiryDate.match(/^\d{2}\/\d{2}$/)) {
      errors.push('Please enter a valid expiry date (MM/YY)');
    }
    if (!cvv || !cvv.match(/^\d{3,4}$/)) {
      errors.push('Please enter a valid CVV');
    }

    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Validate form
    const errors = validateForm();
    if (errors.length > 0) {
      errors.forEach(error => {
        toast({
          title: 'Validation Error',
          description: error,
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      });
      setLoading(false);
      return;
    }

    try {
      // Simulate payment processing
      await new Promise((resolve) => setTimeout(resolve, 1500));
      
      // Call the success callback
      await onPaymentSuccess();
      
      // Clear form
      setFormData({
        cardNumber: '',
        cardName: '',
        expiryDate: '',
        cvv: '',
      });
      
      // Close modal
      onClose();
      
    } catch (error) {
      toast({
        title: 'Payment Failed',
        description: error.message || 'An error occurred during payment processing',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Complete Your Purchase</ModalHeader>
        <ModalCloseButton />
        <ModalBody pb={6}>
          <VStack spacing={4} align="stretch">
            {/* Course Summary */}
            <Box p={4} bg="gray.50" borderRadius="md">
              <HStack spacing={4}>
                {course?.thumbnail && (
                  <Image
                    src={course.thumbnail}
                    alt={course.title}
                    boxSize="100px"
                    objectFit="cover"
                    borderRadius="md"
                  />
                )}
                <Box>
                  <Text fontWeight="bold" fontSize="lg">
                    {course?.title}
                  </Text>
                  <Text color="blue.600" fontSize="xl" fontWeight="bold">
                    ${course?.price || '0.00'}
                  </Text>
                </Box>
              </HStack>
            </Box>

            <Divider />

            {/* Payment Form */}
            <form onSubmit={handleSubmit}>
              <VStack spacing={4}>
                <FormControl isRequired>
                  <FormLabel>Card Number</FormLabel>
                  <Input
                    name="cardNumber"
                    placeholder="1234 5678 9012 3456"
                    value={formData.cardNumber}
                    onChange={handleInputChange}
                    maxLength={19}
                  />
                </FormControl>

                <FormControl isRequired>
                  <FormLabel>Cardholder Name</FormLabel>
                  <Input
                    name="cardName"
                    placeholder="John Doe"
                    value={formData.cardName}
                    onChange={handleInputChange}
                  />
                </FormControl>

                <HStack spacing={4}>
                  <FormControl isRequired>
                    <FormLabel>Expiry Date</FormLabel>
                    <Input
                      name="expiryDate"
                      placeholder="MM/YY"
                      value={formData.expiryDate}
                      onChange={handleInputChange}
                      maxLength={5}
                    />
                  </FormControl>

                  <FormControl isRequired>
                    <FormLabel>CVV</FormLabel>
                    <Input
                      name="cvv"
                      type="password"
                      placeholder="123"
                      value={formData.cvv}
                      onChange={handleInputChange}
                      maxLength={4}
                    />
                  </FormControl>
                </HStack>

                <Button
                  type="submit"
                  colorScheme="blue"
                  size="lg"
                  width="full"
                  isLoading={loading}
                  loadingText="Processing Payment..."
                  leftIcon={<FaCreditCard />}
                >
                  Pay ${course?.price || '0.00'}
                </Button>

                <HStack justify="center" color="gray.600" fontSize="sm">
                  <FaLock />
                  <Text>Secure Payment Processing</Text>
                </HStack>
              </VStack>
            </form>
          </VStack>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default PaymentModal; 