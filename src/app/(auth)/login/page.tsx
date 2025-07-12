'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box, Button, Container, FormControl, FormLabel, Heading, Input, Stack, Text, useToast
} from '@chakra-ui/react';
import useAuthStore from '@/store/authStore';
import apiClient from '@/lib/api';
import { jwtDecode } from 'jwt-decode'; // Cài thư viện này: npm install jwt-decode
import { AxiosError } from 'axios'; // Import AxiosError để kiểm tra lỗi

interface DecodedToken {
  user_id: number;
  username: string;
}

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const setAuth = useAuthStore((state) => state.setAuth);
  const router = useRouter();
  const toast = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await apiClient.post('/auth/token/', { username, password });
      const { access, refresh, user } = response.data;
      
      // Nếu user đã có trong response (từ MyTokenObtainPairSerializer), ưu tiên dùng
      const authUser = user || { id: (jwtDecode(access) as DecodedToken).user_id, username: (jwtDecode(access) as DecodedToken).username };
      
      setAuth({ accessToken: access, refreshToken: refresh, user: authUser });

      toast({ title: 'Login successful!', status: 'success', duration: 3000, isClosable: true });
      router.push('/');
    } catch (error) {
      let description = 'An unexpected error occurred.';
      if (error instanceof AxiosError && error.response) {
        if (error.response.status === 401) {
          description = 'Invalid username or password. Please try again.';
        } else {
          description = error.response.data?.detail || error.message;
        }
      }
      toast({
        title: 'Login Failed',
        description: description,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  return (
    <Container maxW="lg" py={{ base: '12', md: '24' }} px={{ base: '0', sm: '8' }}>
      <Stack spacing="8">
        <Heading textAlign="center">Log in to your account</Heading>
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
                <FormLabel htmlFor="username">Username</FormLabel>
                <Input id="username" type="text" value={username} onChange={(e) => setUsername(e.target.value)} />
              </FormControl>
              <FormControl>
                <FormLabel htmlFor="password">Password</FormLabel>
                <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
              </FormControl>
              <Button type="submit" colorScheme="blue">Sign in</Button>
            </Stack>
          </form>
        </Box>
      </Stack>
    </Container>
  );
}