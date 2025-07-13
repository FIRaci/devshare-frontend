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

interface AuthResponse {
  access: string;
  refresh: string;
}

interface UserProfile {
  id: number;
  username: string;
  is_staff: boolean;
}

const loginUser = async (credentials: any): Promise<AuthResponse> => {
  const { data } = await apiClient.post('/auth/token/', credentials);
  return data;
};

const fetchUserProfile = async (): Promise<UserProfile> => {
    // Tạm thời đặt token vào header cho request này
    const token = useAuthStore.getState().accessToken;
    const { data } = await apiClient.get('/auth/profile/', {
        headers: { Authorization: `Bearer ${token}` }
    });
    return data;
}

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();
  const toast = useToast();
  const { setTokens, setUser, logout } = useAuthStore();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: loginUser,
    onSuccess: async (data) => {
      // 1. Lưu token vào store
      setTokens({ access: data.access, refresh: data.refresh });

      // 2. Dùng token vừa có để lấy thông tin chi tiết của user
      try {
        const userProfile = await fetchUserProfile();
        // 3. Lưu thông tin user đầy đủ (có is_staff) vào store
        setUser(userProfile);

        toast({ title: 'Login successful!', status: 'success', duration: 2000 });
        
        // Vô hiệu hóa các query cũ để fetch lại dữ liệu mới với user đã đăng nhập
        await queryClient.invalidateQueries();
        
        router.push('/');
        router.refresh(); // Tải lại trang để đảm bảo UI cập nhật
      } catch (error) {
        toast({ title: 'Could not fetch user profile.', status: 'error' });
        logout();
      }
    },
    onError: () => {
      toast({
        title: 'Login failed.',
        description: 'Invalid username or password.',
        status: 'error',
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate({ username, password });
  };

  return (
    <Flex minH="100vh" align="center" justify="center" bg="gray.50">
      <Container maxW="lg">
        <Box p={8} bg="white" boxShadow="xl" borderRadius="xl">
          <Heading mb={6} textAlign="center">Log In to DevShare</Heading>
          <form onSubmit={handleSubmit}>
            <Stack spacing={4}>
              <FormControl isRequired>
                <FormLabel htmlFor="username">Username</FormLabel>
                <Input id="username" value={username} onChange={(e) => setUsername(e.target.value)} />
              </FormControl>
              <FormControl isRequired>
                <FormLabel htmlFor="password">Password</FormLabel>
                <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
              </FormControl>
              <Button type="submit" colorScheme="blue" isLoading={mutation.isPending}>
                Log In
              </Button>
            </Stack>
          </form>
           <Text mt={6} textAlign="center">
            Don't have an account?{' '}
            {/* Sửa lỗi lồng thẻ <a> */}
            <ChakraLink as={Link} href="/register" color="blue.500" fontWeight="bold">
              Sign Up
            </ChakraLink>
          </Text>
        </Box>
      </Container>
    </Flex>
  );
}
