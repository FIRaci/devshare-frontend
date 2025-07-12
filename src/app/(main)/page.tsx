'use client';
import { Container, VStack, Heading, Spinner, Text, Button, Box } from '@chakra-ui/react';
import { useQuery } from '@tanstack/react-query';
import apiClient from '@/lib/api';
import PostCard, { Post } from '@/components/PostCard';
import Link from 'next/link';

// SỬA LẠI HÀM FETCH
const fetchHomeFeed = async (): Promise<Post[]> => {
  const { data } = await apiClient.get('/posts/home_feed/');
  return data.results || data;
};

export default function HomePage() {
  const { data: posts, isLoading, isError } = useQuery<Post[], Error>({
    queryKey: ['homeFeed'],
    queryFn: fetchHomeFeed,
  });

  return (
    <Container maxW="container.lg" py={2}>
      <VStack spacing={4} align="stretch">
        <Heading size="lg" mb={4}>Your Feed</Heading>
        {isLoading && <Spinner />}
        {isError && (
            <Box textAlign="center" p={10}>
                <Text color="red.500">Could not fetch your feed.</Text>
                <Text>Try joining some communities to get started!</Text>
                <Link href="/all" passHref><Button mt={4} colorScheme="blue">Explore All Posts</Button></Link>
            </Box>
        )}
        {posts?.map((post) => <PostCard key={post.id} post={post} queryKey={[]} />)}
        {posts?.length === 0 && !isLoading && !isError && (
            <Box textAlign="center" p={10}>
                <Heading size="md">Your feed is empty</Heading>
                <Text>Posts from communities you join will appear here.</Text>
                <Link href="/all" passHref><Button mt={4} colorScheme="blue">Explore All Posts</Button></Link>
            </Box>
        )}
      </VStack>
    </Container>
  );
}