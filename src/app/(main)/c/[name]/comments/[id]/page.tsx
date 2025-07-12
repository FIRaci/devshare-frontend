'use client';

import {
  Container, Text, Spinner, VStack, HStack, Button, useToast,
  AlertDialog, AlertDialogBody, AlertDialogFooter, AlertDialogHeader, AlertDialogContent, AlertDialogOverlay, useDisclosure, Flex, Heading, Box
} from '@chakra-ui/react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api';
import PostCard, { Post } from '@/components/PostCard'; 
import CommentSection from '@/components/CommentSection';
import useAuthStore from '@/store/authStore';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import React from 'react';
import { FaExclamationTriangle, FaHome } from 'react-icons/fa';

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

  // SỬA LỖI: Nâng cấp `useQuery` để xử lý lỗi tốt hơn
  const { data: post, isLoading, isError, error } = useQuery<Post, any>({ // Dùng `any` cho error để truy cập `response`
    queryKey: queryKey,
    queryFn: () => fetchPost(id as string),
    enabled: !!id,
    retry: (failureCount, error) => {
      // Không retry khi gặp lỗi 404 Not Found
      if (error?.response?.status === 404) {
        return false;
      }
      // Cho phép retry 2 lần cho các lỗi khác
      return failureCount < 2;
    },
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

  // =================================================================
  // SỬA LỖI: Cải thiện giao diện cho các trạng thái Loading, Error, Not Found
  // =================================================================

  if (isLoading) {
    return <Flex justify="center" align="center" minH="50vh"><Spinner size="xl" /></Flex>;
  }

  // Trường hợp 1: Lỗi 404 (Không tìm thấy) hoặc API trả về rỗng
  const isNotFound = (isError && error?.response?.status === 404) || (!post && !isLoading);
  if (isNotFound) {
    return (
      <Container centerContent py={10} textAlign="center">
        <Box>
          <Flex justify="center" mb={4}>
            <Icon as={FaExclamationTriangle} boxSize="50px" color="yellow.400" />
          </Flex>
          <Heading size="lg">Post Not Found</Heading>
          <Text mt={2} color="gray.600">
            Sorry, the post you are looking for might have been deleted or the link is incorrect.
          </Text>
          <Link href="/" passHref>
            <Button mt={6} colorScheme="blue" leftIcon={<FaHome />}>
              Go to Homepage
            </Button>
          </Link>
        </Box>
      </Container>
    );
  }

  // Trường hợp 2: Các lỗi server khác
  if (isError) {
    return (
      <Container centerContent py={10} textAlign="center">
        <Heading>Oops! Something went wrong.</Heading>
        <Text mt={2} color="red.500">
          An unexpected error occurred. Please try again later.
        </Text>
        <Button mt={6} onClick={() => queryClient.invalidateQueries({ queryKey })}>
          Try Again
        </Button>
      </Container>
    );
  }
  
  // Nếu mọi thứ ổn, `post` chắc chắn tồn tại ở đây
  const isOwner = user && user.id === post!.author.id;

  return (
    <Container maxW="container.lg" py={8}>
        <VStack spacing={6} align="stretch">
            <PostCard post={post!} queryKey={queryKey} isDetailView={true} />
            
            {isOwner && (
                <HStack justify="flex-end">
                    <Link href={`/post/${post!.id}/edit`} passHref>
                        <Button size="sm" colorScheme="yellow">Edit</Button>
                    </Link>
                    <Button size="sm" colorScheme="red" onClick={onOpen}>Delete</Button>
                </HStack>
            )}

            <CommentSection postId={post!.id} />
        </VStack>

      <AlertDialog isOpen={isOpen} leastDestructiveRef={cancelRef} onClose={onClose}>
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">Delete Post</AlertDialogHeader>
            <AlertDialogBody>Are you sure? You can't undo this action afterwards.</AlertDialogBody>
            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={onClose}>Cancel</Button>
              <Button colorScheme="red" onClick={() => deleteMutation.mutate(post!.id)} ml={3} isLoading={deleteMutation.isPending}>
                Delete
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </Container>
  );
}
