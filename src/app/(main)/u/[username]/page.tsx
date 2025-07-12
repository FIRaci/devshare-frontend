'use client';
import { Container, VStack, Heading, Spinner, Text, Box, Button, Avatar, HStack, Divider } from '@chakra-ui/react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api';
import PostCard, { Post } from '@/components/PostCard';
import useAuthStore from '@/store/authStore';

interface UserProfile {
  id: number;
  username: string;
  profile: { bio: string | null; avatar: string | null; };
  followers_count: number;
  following_count: number;
  is_following: boolean;
}

const fetchUserDetails = async (username: string): Promise<UserProfile> => {
  const { data } = await apiClient.get(`/users/${username}/`);
  return data;
};

const fetchUserPosts = async (username: string): Promise<Post[]> => {
    const { data } = await apiClient.get(`/posts/?author__username=${username}`);
    return data.results || data;
}

const toggleFollowUser = async (username: string, isFollowing: boolean) => {  
    const action = isFollowing ? 'unfollow' : 'follow';
    return apiClient.post(`/users/${username}/${action}/`);
}

export default function UserProfilePage({ params }: { params: { username: string } }) {
  const { username } = params;
  const queryClient = useQueryClient();
  const currentUser = useAuthStore((state) => state.user);

  const { data: user, isLoading: isLoadingUser } = useQuery({
    queryKey: ['userDetails', username],
    queryFn: () => fetchUserDetails(username),
    enabled: !!username,
  });

  const { data: posts, isLoading: isLoadingPosts } = useQuery({
    queryKey: ['userPosts', username],
    queryFn: () => fetchUserPosts(username),
    enabled: !!username,
  });

  const followMutation = useMutation({
      mutationFn: () => toggleFollowUser(user!.username, user!.is_following),
      onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ['userDetails', username] });
      }
  });

  return (
    <Container maxW="container.lg" py={2}>
      {isLoadingUser && <Spinner />}
      {user && (
        <Box bg="white" p={6} borderRadius="md" mb={6} boxShadow="sm">
            <HStack spacing={6} align="start">
                <Avatar size="xl" src={user.profile.avatar || ''} name={user.username} />
                <VStack align="start" spacing={1}>
                    <Heading>{user.username}</Heading>
                    <Text color="gray.500">{user.profile.bio || 'No bio yet.'}</Text>
                    <HStack spacing={4} pt={2}>
                        <Text><b>{user.followers_count}</b> followers</Text>
                        <Text><b>{user.following_count}</b> following</Text>
                    </HStack>
                    {currentUser && currentUser.username !== user.username && (
                        <Button 
                            mt={2}
                            size="sm"
                            colorScheme={user.is_following ? 'gray' : 'blue'}
                            onClick={() => followMutation.mutate()}
                            isLoading={followMutation.isPending}
                        >
                            {user.is_following ? 'Following' : 'Follow'}
                        </Button>
                    )}
                </VStack>
            </HStack>
        </Box>
      )}
      <Divider my={6} />
      <VStack spacing={4} align="stretch">
        <Heading size="md">Posts by {username}</Heading>
        {isLoadingPosts && <Spinner />}
        {posts?.map((post) => <PostCard key={post.id} post={post} queryKey={[]} />)}
        {posts?.length === 0 && !isLoadingPosts && <Text>This user hasn't posted anything yet.</Text>}
      </VStack>
    </Container>
  );
}