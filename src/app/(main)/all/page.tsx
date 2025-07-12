'use client';
import { Container, VStack, Heading, Spinner, Text } from '@chakra-ui/react';
import { useQuery } from '@tanstack/react-query';
import apiClient from '@/lib/api';
import PostCard, { Post } from '@/components/PostCard';
import useHiddenPostsStore from '@/store/hiddenPostsStore';

const fetchAllPosts = async (): Promise<Post[]> => {
  const { data } = await apiClient.get('/posts/');
  return data.results || data;
};

export default function AllPage() {
  const { hiddenPostIds } = useHiddenPostsStore();
  const { data: posts, isLoading } = useQuery<Post[], Error>({
    queryKey: ['allPosts'],
    queryFn: fetchAllPosts,
  });

  const filteredPosts = posts?.filter(post => !hiddenPostIds.includes(post.id));

  return (
    <Container maxW="container.lg" py={2}>
      <VStack spacing={4} align="stretch">
        <Heading size="lg" mb={4}>All Posts</Heading>
        {isLoading && <Spinner />}
        {filteredPosts?.map((post) => <PostCard key={post.id} post={post} queryKey={[]} />)}
      </VStack>
    </Container>
  );
}