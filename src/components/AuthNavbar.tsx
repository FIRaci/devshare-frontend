'use client';
import { Box, Flex, Heading } from '@chakra-ui/react';
import Link from 'next/link';

const AuthNavbar = () => {
  return (
    <Box bg="white" px={4} shadow="sm">
      <Flex h={16} alignItems="center" maxW="container.2xl" mx="auto">
        <Link href="/" passHref>
          <Heading size="md" color="blue.600">DevShare</Heading>
        </Link>
      </Flex>
    </Box>
  );
};

export default AuthNavbar;