'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api';
import {
  Container, Heading, Spinner, Text, VStack, HStack, Switch, useToast, Flex, Box,
  Button,
  FormControl,
  FormLabel
} from '@chakra-ui/react';
import Link from 'next/link';
import useAuthStore from '@/store/authStore';
import { Community } from '@/components/PostCard'; // Sử dụng interface đã thống nhất

// Thêm các trường cần thiết cho trang quản lý
interface ManagedCommunity extends Community {
  is_muted: boolean;
  is_notified: boolean;
}

// Fetch các community mà user đã tham gia
const fetchJoinedCommunities = async (): Promise<ManagedCommunity[]> => {
  const { data } = await apiClient.get('/communities/?joined=true');
  return data.results || data;
};

// Action để thay đổi cài đặt (mute/notification)
const toggleCommunitySetting = async ({ communityId, action }: { communityId: number; action: 'toggle_mute' | 'toggle_notifications' }) => {
    return apiClient.post(`/communities/${communityId}/${action}/`);
}

export default function CommunitySettingsPage() {
  const { user } = useAuthStore();
  const toast = useToast();
  const queryClient = useQueryClient();
  const queryKey = ['managedCommunities', user?.id];

  const { data: communities, isLoading, isError } = useQuery<ManagedCommunity[], Error>({
    queryKey: queryKey,
    queryFn: fetchJoinedCommunities,
    enabled: !!user, // Chỉ fetch khi user đã đăng nhập
  });

  const toggleMutation = useMutation({
    mutationFn: toggleCommunitySetting,
    onSuccess: (_, variables) => {
      toast({
        title: 'Setting updated!',
        status: 'success',
        duration: 1500,
      });
      // Invalidate query để fetch lại danh sách mới
      queryClient.invalidateQueries({ queryKey: queryKey });
    },
    onError: (error) => {
      toast({
        title: 'An error occurred.',
        description: 'Unable to update setting.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    },
  });

  if (isLoading) {
    return <Flex justify="center" align="center" h="200px"><Spinner /></Flex>;
  }

  if (isError || !communities) {
    return <Container py={8}><Text>Could not load your communities. Please try again later.</Text></Container>;
  }

  return (
    <Container maxW="container.lg" py={8}>
      <Heading mb={2}>Community Management</Heading>
      <Text mb={6} color="gray.600">Manage notifications and other settings for communities you've joined.</Text>
      <VStack spacing={4} align="stretch">
        {communities.length === 0 ? (
            <Box textAlign="center" p={10} bg="gray.50" borderRadius="md">
                <Heading size="md">No communities yet!</Heading>
                <Text mt={2}>You haven't joined any communities.</Text>
                <Link href="/all" passHref>
                    <Button mt={4} colorScheme="blue">Explore Communities</Button>
                </Link>
            </Box>
        ) : (
            communities.map((community) => (
            <Flex
                key={community.id}
                p={4}
                bg="white"
                borderRadius="md"
                boxShadow="sm"
                justify="space-between"
                align="center"
                borderWidth="1px"
            >
                <Link href={`/c/${community.name}`} passHref>
                    <Text fontWeight="bold" _hover={{ textDecoration: 'underline' }}>
                        c/{community.name}
                    </Text>
                </Link>
                <HStack spacing={8}>
                <FormControl display='flex' alignItems='center'>
                    <FormLabel htmlFor={`mute-${community.id}`} mb='0' fontSize="sm" mr={2}>
                        Mute
                    </FormLabel>
                    <Switch
                        id={`mute-${community.id}`}
                        colorScheme="orange"
                        isChecked={community.is_muted}
                        onChange={() => toggleMutation.mutate({ communityId: community.id, action: 'toggle_mute' })}
                        isDisabled={toggleMutation.isPending}
                    />
                </FormControl>
                 <FormControl display='flex' alignItems='center'>
                    <FormLabel htmlFor={`notif-${community.id}`} mb='0' fontSize="sm" mr={2}>
                        Notifications
                    </FormLabel>
                    <Switch
                        id={`notif-${community.id}`}
                        colorScheme="teal"
                        isChecked={community.is_notified}
                        onChange={() => toggleMutation.mutate({ communityId: community.id, action: 'toggle_notifications' })}
                        isDisabled={toggleMutation.isPending}
                    />
                </FormControl>
                </HStack>
            </Flex>
            ))
        )}
      </VStack>
    </Container>
  );
}
