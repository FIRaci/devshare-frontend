'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Box, Button, Container, FormControl, FormLabel, Heading, Input, Stack, useToast, Text, Link as ChakraLink, Flex
} from '@chakra-ui/react';
import apiClient from '@/lib/api';
import useAuthStore from '@/store/authStore';
import Link from 'next/link';

// Định nghĩa các kiểu dữ liệu
interface AuthResponse {
  access: string;
  refresh: string;
}

interface UserProfile {
  id: number;
  username: string;
  is_staff: boolean;
}

// Hàm đăng ký
const registerUser = async (credentials: any) => {
  const { data } = await apiClient.post('/auth/register/', credentials);
  return data;
};

// Hàm đăng nhập
const loginUser = async (credentials: any): Promise<AuthResponse> => {
  const { data } = await apiClient.post('/auth/token/', credentials);
  return data;
};

// Hàm lấy thông tin user
const fetchUserProfile = async (): Promise<UserProfile> => {
    const token = useAuthStore.getState().accessToken;
    const { data } = await apiClient.get('/auth/profile/', {
        headers: { Authorization: `Bearer ${token}` }
    });
    return data;
}

export default function RegisterPage() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();
  const toast = useToast();
  const { setTokens, setUser, logout } = useAuthStore();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: registerUser,
    onSuccess: async () => {
      toast({ title: 'Registration successful!', description: 'Logging you in...', status: 'success', duration: 2000 });
      
      // SỬA LỖI: Tự động đăng nhập ngay sau khi đăng ký thành công
      try {
        // 1. Lấy token
        const tokenData = await loginUser({ username, password });
        setTokens({ access: tokenData.access, refresh: tokenData.refresh });

        // 2. Lấy thông tin user đầy đủ
        const userProfile = await fetchUserProfile();
        setUser(userProfile);

        // 3. Dọn dẹp và chuyển hướng
        await queryClient.invalidateQueries();
        router.push('/');
        router.refresh();

      } catch (error) {
        toast({ title: 'Auto-login failed.', description: 'Please log in manually.', status: 'error' });
        router.push('/login');
      }
    },
    onError: (error: any) => {
      // Xử lý lỗi từ backend (ví dụ: username đã tồn tại)
      const errorData = error.response?.data;
      let description = 'An error occurred. Please try again.';
      if (errorData) {
        description = Object.values(errorData).flat().join(' ');
      }
      toast({
        title: 'Registration failed.',
        description: description,
        status: 'error',
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate({ username, email, password });
  };

  return (
    <Flex minH="100vh" align="center" justify="center" bg="gray.50">
      <Container maxW="lg">
        <Box p={8} bg="white" boxShadow="xl" borderRadius="xl">
          <Heading mb={6} textAlign="center">Create an Account</Heading>
          <form onSubmit={handleSubmit}>
            <Stack spacing={4}>
              <FormControl isRequired>
                <FormLabel htmlFor="email">Email</FormLabel>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
              </FormControl>
              <FormControl isRequired>
                <FormLabel htmlFor="username">Username</FormLabel>
                <Input id="username" value={username} onChange={(e) => setUsername(e.target.value)} />
              </FormControl>
              <FormControl isRequired>
                <FormLabel htmlFor="password">Password</FormLabel>
                <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
              </FormControl>
              <Button type="submit" colorScheme="blue" isLoading={mutation.isPending}>
                Sign Up
              </Button>
            </Stack>
          </form>
          <Text mt={6} textAlign="center">
            Already have an account?{' '}
            <ChakraLink as={Link} href="/login" color="blue.500" fontWeight="bold">
              Log In
            </ChakraLink>
          </Text>
        </Box>
      </Container>
    </Flex>
  );
}
