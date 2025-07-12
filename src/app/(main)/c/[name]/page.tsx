'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import apiClient from '@/lib/api';
import useAuthStore from '@/store/authStore';
import {
  Box, Container, Heading, Text, Spinner, Button, Flex, VStack, useToast,
} from '@chakra-ui/react';
import PostFeed from '@/components/PostFeed';
import { Community } from '@/components/Sidebar';

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

  const mutation = useMutation({
    // SỬA LỖI: Dùng `community.name` thay cho `community.id` để gọi API
    mutationFn: (action: 'join' | 'leave') => apiClient.post(`/communities/${community!.name}/${action}/`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['community', name] });
      queryClient.invalidateQueries({ queryKey: ['communities'] });
    },
    onError: () => {
        toast({
            title: "Action failed",
            description: "Could not update your membership. Please try again.",
            status: "error",
            duration: 3000,
            isClosable: true,
        });
    }
  });

  const handleToggleJoin = () => {
    if (!user) {
      toast({ title: "Please log in", status: "info" });
      return;
    }
    const action = community?.is_member ? 'leave' : 'join';
    mutation.mutate(action);
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
          
          {user && (
            <VStack align="flex-end" spacing={2}>
              <Text fontSize="sm" color="gray.500">{community.member_count} members</Text>
              <Button
                size="sm"
                colorScheme={community.is_member ? 'gray' : 'blue'}
                onClick={handleToggleJoin}
                isLoading={mutation.isPending}
              >
                {community.is_member ? 'Leave' : 'Join'}
              </Button>
            </VStack>
          )}
        </Flex>
      </Box>
      <PostFeed communityName={name} />
    </Container>
  );
}
