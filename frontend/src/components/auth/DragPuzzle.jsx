import React, { useState, useRef, useEffect } from 'react';
import { Box, Text, useColorModeValue, Icon } from '@chakra-ui/react';
import { CheckIcon, ChevronRightIcon } from '@chakra-ui/icons';
import { FaArrowsAltH } from 'react-icons/fa';

const DragPuzzle = ({ onVerify }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState(0);
  const [isVerified, setIsVerified] = useState(false);
  const [targetPosition, setTargetPosition] = useState(0);
  const sliderRef = useRef(null);
  const containerRef = useRef(null);

  // Colors - Updated to black and white theme
  const bgColor = useColorModeValue('white', 'gray.900');
  const sliderColor = useColorModeValue('black', 'white');
  const sliderHoverColor = useColorModeValue('gray.800', 'gray.100');
  const targetBorderColor = useColorModeValue('black', 'white');
  const successColor = useColorModeValue('black', 'white');
  const textColor = useColorModeValue('gray.600', 'gray.400');
  const trackBgColor = useColorModeValue('gray.200', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const iconColor = useColorModeValue('white', 'black');

  // Generate random target position on mount
  useEffect(() => {
    // Random position between 60% and 90% of the container width
    const randomPosition = Math.floor(Math.random() * (90 - 60) + 60);
    setTargetPosition(randomPosition);
  }, []);

  useEffect(() => {
    const handleMouseUp = () => {
      if (isDragging) {
        setIsDragging(false);
        // Check if the slider is close enough to the target position (within 5%)
        if (Math.abs(position - targetPosition) <= 5) {
          setPosition(targetPosition);
          setIsVerified(true);
          onVerify(true);
        } else {
          setPosition(0);
        }
      }
    };

    const handleMouseMove = (e) => {
      if (isDragging && !isVerified && containerRef.current) {
        const containerRect = containerRef.current.getBoundingClientRect();
        const newPosition = ((e.clientX - containerRect.left) / containerRect.width) * 100;
        setPosition(Math.min(Math.max(newPosition, 0), 100));
      }
    };

    const handleTouchMove = (e) => {
      if (isDragging && !isVerified && containerRef.current) {
        const touch = e.touches[0];
        const containerRect = containerRef.current.getBoundingClientRect();
        const newPosition = ((touch.clientX - containerRect.left) / containerRect.width) * 100;
        setPosition(Math.min(Math.max(newPosition, 0), 100));
      }
    };

    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('touchend', handleMouseUp);
    document.addEventListener('touchmove', handleTouchMove);

    return () => {
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('touchend', handleMouseUp);
      document.removeEventListener('touchmove', handleTouchMove);
    };
  }, [isDragging, position, isVerified, onVerify, targetPosition]);

  const handleMouseDown = (e) => {
    if (!isVerified) {
      setIsDragging(true);
      e.preventDefault(); // Prevent text selection
    }
  };

  const handleTouchStart = (e) => {
    if (!isVerified) {
      setIsDragging(true);
    }
  };

  return (
    <Box
      ref={containerRef}
      position="relative"
      h="50px"
      bg={bgColor}
      borderRadius="full"
      overflow="hidden"
      boxShadow="lg"
      my={4}
      border="2px solid"
      borderColor={borderColor}
    >
      {/* Track progress */}
      <Box
        position="absolute"
        left="0"
        top="0"
        h="100%"
        w={`${position}%`}
        bg={trackBgColor}
        opacity={0.3}
        transition="width 0.1s"
      />

      {/* Slider */}
      <Box
        ref={sliderRef}
        position="absolute"
        left={`${position}%`}
        top="50%"
        transform="translate(-50%, -50%)"
        h="40px"
        w="40px"
        bg={isVerified ? successColor : sliderColor}
        borderRadius="full"
        cursor={isVerified ? "default" : "grab"}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        display="flex"
        alignItems="center"
        justifyContent="center"
        transition={isDragging ? "none" : "all 0.3s"}
        _hover={{ bg: isVerified ? successColor : sliderHoverColor }}
        boxShadow="lg"
        aria-label="Verification slider"
        role="slider"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={position}
      >
        {isVerified ? (
          <CheckIcon color={iconColor} boxSize={5} />
        ) : (
          <Icon as={FaArrowsAltH} color={iconColor} boxSize={6} />
        )}
      </Box>

      {/* Target zone */}
      {!isVerified && (
        <Box
          position="absolute"
          left={`${targetPosition}%`}
          top="50%"
          transform="translate(-50%, -50%)"
          w="40px"
          h="40px"
          borderRadius="full"
          border="2px dashed"
          borderColor={targetBorderColor}
          opacity={0.6}
          display="flex"
          alignItems="center"
          justifyContent="center"
        >
          <ChevronRightIcon color={targetBorderColor} boxSize={6} />
        </Box>
      )}

      {/* Instructions */}
      {!isVerified && (
        <Text
          position="absolute"
          width="100%"
          textAlign="center"
          top="50%"
          transform="translateY(-50%)"
          fontSize="sm"
          color={textColor}
          userSelect="none"
          pointerEvents="none"
          fontWeight="medium"
        >
          Drag to verify
        </Text>
      )}
    </Box>
  );
};

export default DragPuzzle; 