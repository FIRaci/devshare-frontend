'use client';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { Container, VStack, Heading, Spinner, Text } from '@chakra-ui/react';
import { useQuery } from '@tanstack/react-query';
import apiClient from '@/lib/api';
import PostCard, { Post } from '@/components/PostCard';

const searchPosts = async (query: string): Promise<Post[]> => {
  const { data } = await apiClient.get(`/posts/?search=${query}`);
  return data.results || data;
};

function SearchResults() {
  const searchParams = useSearchParams();
  const query = searchParams.get('q') || '';

  const { data: posts, isLoading, isError } = useQuery<Post[], Error>({
    queryKey: ['searchPosts', query],
    queryFn: () => searchPosts(query),
    enabled: !!query,
  });

  return (
    <VStack spacing={4} align="stretch">
      <Heading size="lg" mb={4}>
        Search results for: "{query}"
      </Heading>
      {isLoading && <Spinner />}
      {isError && <Text color="red.500">Could not perform search.</Text>}
      {posts?.map((post) => <PostCard key={post.id} post={post} queryKey={[]} />)}
      {posts?.length === 0 && !isLoading && (
        <Text>No results found for "{query}". Try a different search term.</Text>
      )}
    </VStack>
  );
}

export default function SearchPage() {
  return (
    <Container maxW="container.lg" py={2}>
      <Suspense fallback={<Spinner />}>
        <SearchResults />
      </Suspense>
    </Container>
  );
}
