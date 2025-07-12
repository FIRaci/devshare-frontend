'use client';

import {
  Container, Text, Spinner, VStack, HStack, Button, useToast,
  AlertDialog, AlertDialogBody, AlertDialogFooter, AlertDialogHeader, AlertDialogContent, AlertDialogOverlay, useDisclosure, Flex,
} from '@chakra-ui/react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api';
// SỬA LỖI: Import Post từ file PostCard đã được cập nhật
import PostCard, { Post } from '@/components/PostCard'; 
import CommentSection from '@/components/CommentSection';
import useAuthStore from '@/store/authStore';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import React from 'react';

const fetchPost = async (id: string): Promise<Post> => {
  const { data } = await apiClient.get(`/posts/${id}/`);
  return data;
};

const deletePost = async (id: number): Promise<void> => {
  await apiClient.delete(`/posts/${id}/`);
};

export default function PostDetailPage() {
  const params = useParams();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const router = useRouter();
  const toast = useToast();
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  
  const queryKey = ['post', id];

  const { data: post, isLoading, isError, error } = useQuery<Post, Error>({
    queryKey: queryKey,
    queryFn: () => fetchPost(id as string),
    enabled: !!id,
  });
  
  const { isOpen, onOpen, onClose } = useDisclosure();
  const cancelRef = React.useRef<HTMLButtonElement>(null);

  const deleteMutation = useMutation({
    mutationFn: deletePost,
    onSuccess: () => {
      toast({ title: "Post deleted.", status: 'success', duration: 3000, isClosable: true });
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      queryClient.invalidateQueries({ queryKey: ['allPosts'] });
      queryClient.invalidateQueries({ queryKey: ['homeFeed'] });
      router.push('/');
    },
    onError: () => {
      toast({ title: "Error deleting post.", status: 'error', duration: 3000, isClosable: true });
    }
  });

  if (isLoading) {
    return <Flex justify="center" py={10}><Spinner size="xl" /></Flex>;
  }

  if (isError) {
    return <Container centerContent py={10}><Text color="red.500">Error: {error?.message || 'Could not load post.'}</Text></Container>;
  }
  
  if (!post) {
    return <Container centerContent py={10}><Text>Post not found.</Text></Container>;
  }

  const isOwner = user && user.id === post.author.id;

  return (
    <Container maxW="container.lg" py={8}>
        <VStack spacing={6} align="stretch">
            <PostCard post={post} queryKey={queryKey} isDetailView={true} />
            
            {isOwner && (
                <HStack justify="flex-end">
                    <Link href={`/post/${post.id}/edit`} passHref>
                        <Button size="sm" colorScheme="yellow">Edit</Button>
                    </Link>
                    <Button size="sm" colorScheme="red" onClick={onOpen}>Delete</Button>
                </HStack>
            )}

            {/* SỬA LỖI: Xóa prop `initialComments` không còn tồn tại */}
            <CommentSection postId={post.id} />
        </VStack>

      <AlertDialog isOpen={isOpen} leastDestructiveRef={cancelRef} onClose={onClose}>
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">Delete Post</AlertDialogHeader>
            <AlertDialogBody>Are you sure? You can't undo this action afterwards.</AlertDialogBody>
            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={onClose}>Cancel</Button>
              <Button colorScheme="red" onClick={() => deleteMutation.mutate(post.id)} ml={3} isLoading={deleteMutation.isPending}>
                Delete
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </Container>
  );
}
