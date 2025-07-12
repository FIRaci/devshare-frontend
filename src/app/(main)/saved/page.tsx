'use client';
import { Container, VStack, Heading, Spinner, Text } from '@chakra-ui/react';
import { useQuery } from '@tanstack/react-query';
import apiClient from '@/lib/api';
import PostCard, { Post } from '@/components/PostCard';

const fetchSavedPosts = async (): Promise<Post[]> => {
  const { data } = await apiClient.get('/posts/saved/');
  return data.results || data;
};

export default function SavedPostsPage() {
  const { data: posts, isLoading, isError } = useQuery<Post[], Error>({
    queryKey: ['savedPosts'],
    queryFn: fetchSavedPosts,
  });

  return (
    <Container maxW="container.lg" py={2}>
      <VStack spacing={4} align="stretch">
        <Heading size="lg" mb={4}>Saved Posts</Heading>
        {isLoading && <Spinner />}
        {isError && <Text color="red.500">Could not fetch saved posts.</Text>}
        {posts?.map((post) => <PostCard key={post.id} post={post} queryKey={[]} />)}
        {posts?.length === 0 && !isLoading && <Text>You have no saved posts.</Text>}
      </VStack>
    </Container>
  );
}