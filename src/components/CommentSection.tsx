'use client';

import { useState } from 'react';
import {
  Box, Button, FormControl, FormLabel, Heading, Text, Textarea, useToast, VStack, Spinner, Flex, Avatar, HStack
} from '@chakra-ui/react';
import { useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import apiClient from '@/lib/api';
import useAuthStore from '@/store/authStore';
import { Comment } from './PostCard';
import { formatDistanceToNow } from 'date-fns/formatDistanceToNow';
import { useInView } from 'react-intersection-observer';
import React from 'react';

interface PaginatedComments {
  next: string | null;
  results: Comment[];
}

const fetchComments = async ({ pageParam = 1, queryKey }: any): Promise<PaginatedComments> => {
  const [_key, postId] = queryKey;
  const { data } = await apiClient.get(`/posts/${postId}/comments/`, {
    params: { page: pageParam },
  });
  return data;
};

// SỬA LỖI: Cập nhật hàm createComment để gửi request đến đúng URL
const createComment = async ({ postId, content }: { postId: number; content: string }): Promise<Comment> => {
  // URL đúng phải là URL lồng nhau (nested)
  const url = `/posts/${postId}/comments/`;
  const { data } = await apiClient.post(url, { content });
  return data;
};

const CommentItem = ({ comment }: { comment: Comment }) => (
    <HStack key={comment.id} p={4} bg="white" borderRadius="lg" w="full" align="start" spacing={4}>
        <Avatar src={comment.author.profile?.avatar || ''} name={comment.author.username} size="sm" mt={1}/>
        <VStack align="start" spacing={1}>
             <HStack>
                <Text fontSize="sm" fontWeight="bold">
                    {comment.author.username}
                </Text>
                <Text fontSize="xs" color="gray.500">
                    {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                </Text>
            </HStack>
            <Text fontSize="md">{comment.content}</Text>
        </VStack>
    </HStack>
)

export default function CommentSection({ postId }: { postId: number }) {
  const [content, setContent] = useState('');
  const user = useAuthStore((state) => state.user);
  const toast = useToast();
  const queryClient = useQueryClient();
  const { ref, inView } = useInView();
  
  const queryKey = ['comments', postId];

  const {
    data: commentsData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
  } = useInfiniteQuery<PaginatedComments, Error>({
    queryKey: queryKey,
    queryFn: fetchComments,
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      if (lastPage.next) {
        const url = new URL(lastPage.next);
        const page = url.searchParams.get('page');
        return page ? Number(page) : undefined;
      }
      return undefined;
    },
  });

  React.useEffect(() => {
    if (inView && hasNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, fetchNextPage]);

  // SỬA LỖI: Cập nhật mutation để gọi hàm createComment mới
  const mutation = useMutation({
    mutationFn: (newComment: { content: string }) => createComment({ postId, content: newComment.content }),
    onSuccess: () => {
      setContent('');
      toast({ title: 'Comment posted!', status: 'success', duration: 2000 });
      queryClient.invalidateQueries({ queryKey: queryKey });
      queryClient.invalidateQueries({ queryKey: ['post', postId] });
    },
    onError: () => {
      toast({ title: 'Failed to post comment.', status: 'error', duration: 3000 });
    },
  });

  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    mutation.mutate({ content });
  };
  
  const allComments = commentsData?.pages.flatMap(page => page.results) ?? [];

  return (
    <Box mt={8} w="full">
      {user && (
        <Box p={6} bg="white" boxShadow="sm" borderRadius="lg" mb={6} borderWidth="1px">
          <form onSubmit={handleCommentSubmit}>
            <FormControl>
              <FormLabel htmlFor="comment-content" fontSize="sm">Comment as {user.username}</FormLabel>
              <Textarea
                id="comment-content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="What are your thoughts?"
              />
            </FormControl>
            <Flex justify="flex-end">
                <Button mt={4} colorScheme="blue" type="submit" isLoading={mutation.isPending}>
                Comment
                </Button>
            </Flex>
          </form>
        </Box>
      )}

      <VStack spacing={4} align="stretch" bg="gray.50" p={4} borderRadius="lg">
        <Heading size="md" mb={2}>Comments ({allComments.length})</Heading>
        {isLoading ? (
            <Flex justify="center" p={10}><Spinner /></Flex>
        ) : isError ? (
            <Text color="red.500">Could not load comments.</Text>
        ) : allComments.length > 0 ? (
            <>
                {allComments.map((comment) => (
                    <CommentItem key={comment.id} comment={comment} />
                ))}
                {hasNextPage && (
                    <Button
                        ref={ref}
                        onClick={() => fetchNextPage()}
                        isLoading={isFetchingNextPage}
                        variant="outline"
                    >
                        Load More Comments
                    </Button>
                )}
            </>
        ) : (
            <Text color="gray.500" textAlign="center" p={5}>
                Be the first to comment!
            </Text>
        )}
      </VStack>
    </Box>
  );
}
