'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box, Button, Container, FormControl, FormLabel, Heading, Input, Stack, useToast
} from '@chakra-ui/react';
import useAuthStore from '@/store/authStore';
import apiClient from '@/lib/api';

export default function RegisterPage() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const setAuth = useAuthStore((state) => state.setAuth);
  const router = useRouter();
  const toast = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await apiClient.post('/auth/register/', { username, email, password });
      const { access, refresh, user } = response.data;
      
      setAuth({ accessToken: access, refreshToken: refresh, user });

      toast({ title: 'Registration successful!', status: 'success', duration: 3000, isClosable: true });
      router.push('/');
    } catch (error) {
      toast({ title: 'Registration failed', description: 'Username or email may already exist.', status: 'error', duration: 3000, isClosable: true });
    }
  };

  return (
    <Container maxW="lg" py={{ base: '12', md: '24' }} px={{ base: '0', sm: '8' }}>
      <Stack spacing="8">
        <Heading textAlign="center">Create a new account</Heading>
        <Box
          py={{ base: '0', sm: '8' }}
          px={{ base: '4', sm: '10' }}
          bg="white"
          boxShadow="md"
          borderRadius="xl"
        >
          <form onSubmit={handleSubmit}>
            <Stack spacing="6">
              <FormControl>
                <FormLabel htmlFor="email">Email</FormLabel>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
              </FormControl>
              <FormControl>
                <FormLabel htmlFor="username">Username</FormLabel>
                <Input id="username" type="text" value={username} onChange={(e) => setUsername(e.target.value)} />
              </FormControl>
              <FormControl>
                <FormLabel htmlFor="password">Password</FormLabel>
                <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
              </FormControl>
              <Button type="submit" colorScheme="blue">Sign up</Button>
            </Stack>
          </form>
        </Box>
      </Stack>
    </Container>
  );
}