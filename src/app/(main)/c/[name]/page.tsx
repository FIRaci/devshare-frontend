'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import apiClient from '@/lib/api';
import useAuthStore from '@/store/authStore';
import {
  Box, Container, Heading, Text, Spinner, Button, Flex, VStack, useToast
} from '@chakra-ui/react';
import PostFeed from '@/components/PostFeed';
import React from 'react';

// Quay về interface Community gốc
interface Community {
  id: number;
  name: string;
  description: string;
  member_count: number;
  is_member: boolean;
}

const fetchCommunityDetails = async (name: string): Promise<Community> => {
  const { data } = await apiClient.get(`/communities/${name}/`);
  return data;
};

export default function CommunityPage() {
  const params = useParams();
  const name = params.name as string;
  const { user } = useAuthStore();
  const toast = useToast();
  const queryClient = useQueryClient();

  const { data: community, isLoading } = useQuery<Community, Error>({
    queryKey: ['community', name],
    queryFn: () => fetchCommunityDetails(name),
    enabled: !!name,
  });

  const joinMutation = useMutation({
    mutationFn: (action: 'join' | 'leave') => apiClient.post(`/communities/${community!.name}/${action}/`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['community', name] });
      queryClient.invalidateQueries({ queryKey: ['communities'] });
    },
    onError: (error: any) => {
        const errorMsg = error.response?.data?.error || "Could not update your membership. Please try again.";
        toast({ title: "Action failed", description: errorMsg, status: "error" });
    }
  });

  const handleToggleJoin = () => {
    if (!user) {
      toast({ title: "Please log in", status: "info" });
      return;
    }
    const action = community?.is_member ? 'leave' : 'join';
    joinMutation.mutate(action);
  };

  if (isLoading) {
    return <Flex justify="center" p={8}><Spinner /></Flex>;
  }

  if (!community) {
    return <Text>Community not found.</Text>;
  }

  return (
    <Container maxW="container.lg">
      <Box bg="white" p={6} borderRadius="md" boxShadow="sm" mb={6}>
        <Flex justify="space-between" align="flex-start">
          <Box>
            <Heading size="lg">c/{community.name}</Heading>
            <Text color="gray.600" mt={2}>{community.description}</Text>
          </Box>
          
          <VStack align="flex-end" spacing={2}>
            <Text fontSize="sm" color="gray.500">{community.member_count} members</Text>
            {/* ROLLBACK: Hiển thị lại nút Join/Leave như cũ */}
            {user && (
              <Button
                size="sm"
                colorScheme={community.is_member ? 'gray' : 'blue'}
                onClick={handleToggleJoin}
                isLoading={joinMutation.isPending}
              >
                {community.is_member ? 'Leave' : 'Join'}
              </Button>
            )}
          </VStack>
        </Flex>
        {/* ROLLBACK: Xóa hoàn toàn nút Delete của admin */}
      </Box>
      <PostFeed communityName={name} />
    </Container>
  );
}
