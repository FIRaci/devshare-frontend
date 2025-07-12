'use client';

import { VStack, Spinner, Text, Flex, Button } from '@chakra-ui/react';
import { useInfiniteQuery } from '@tanstack/react-query';
import apiClient from '@/lib/api';
import PostItem, { Post } from './PostCard'; // Import PostItem và interface Post
import { useInView } from 'react-intersection-observer';
import { useEffect } from 'react';

interface PostFeedProps {
  communityName?: string;
  authorName?: string;
  feedType?: 'home' | 'saved'; // Để mở rộng cho các loại feed
}

interface PaginatedResponse {
  next: string | null;
  previous: string | null;
  results: Post[];
}

const fetchPosts = async ({ pageParam = 1, queryKey }: any): Promise<PaginatedResponse> => {
  const [ _key, { communityName, authorName, feedType } ] = queryKey;

  let url = '/posts/';
  if (feedType === 'home') {
    url = '/posts/home_feed/';
  } else if (feedType === 'saved') {
    url = '/posts/saved/';
  }

  const { data } = await apiClient.get(url, {
    params: {
      page: pageParam,
      community__name: communityName,
      author__username: authorName,
    },
  });
  return data;
};

const PostFeed = ({ communityName, authorName, feedType }: PostFeedProps) => {
  const { ref, inView } = useInView();

  const {
    data,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    status,
  } = useInfiniteQuery<PaginatedResponse, Error>({
    queryKey: ['posts', { communityName, authorName, feedType }],
    queryFn: fetchPosts,
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      if (lastPage.next) {
        const url = new URL(lastPage.next);
        return url.searchParams.get('page') ? Number(url.searchParams.get('page')) : undefined;
      }
      return undefined;
    },
  });

  useEffect(() => {
    if (inView && hasNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, fetchNextPage]);

  if (status === 'pending') {
    return (
      <Flex justify="center" p={8}>
        <Spinner />
      </Flex>
    );
  }

  if (status === 'error') {
    return <Text>Error: {error.message}</Text>;
  }

  return (
    <VStack spacing={4} align="stretch">
      {data?.pages.map((page, index) =>
        page.results.map((post) => (
          <PostItem key={post.id} post={post} queryKey={['posts', { communityName, authorName, feedType }]} />
        ))
      )}

      <Button
        ref={ref}
        onClick={() => fetchNextPage()}
        isLoading={isFetchingNextPage}
        disabled={!hasNextPage || isFetchingNextPage}
        mt={4}
      >
        {hasNextPage ? 'Load More' : 'Nothing more to load'}
      </Button>
    </VStack>
  );
};

export default PostFeed;