'use client';

import {
  Container, Text, Spinner, VStack, HStack, Button, useToast,
  AlertDialog, AlertDialogBody, AlertDialogFooter, AlertDialogHeader, AlertDialogContent, AlertDialogOverlay, useDisclosure, Flex, Heading, Box,
  Image // THAY ĐỔI: Import `Image` để dùng ảnh
} from '@chakra-ui/react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api';
import PostCard, { Post } from '@/components/PostCard'; 
import CommentSection from '@/components/CommentSection';
import useAuthStore from '@/store/authStore';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import React from 'react';
// THAY ĐỔI: Chỉ cần import icon cho nút Home
import { FaHome } from 'react-icons/fa';

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

  const { data: post, isLoading, isError, error } = useQuery<Post, any>({
    queryKey: queryKey,
    queryFn: () => fetchPost(id as string),
    enabled: !!id,
    retry: (failureCount, error) => {
      if (error?.response?.status === 404) {
        return false;
      }
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
      router.push('/');
    },
    onError: () => {
      toast({ title: "Error deleting post.", status: 'error', duration: 3000, isClosable: true });
    }
  });

  if (isLoading) {
    return <Flex justify="center" align="center" minH="50vh"><Spinner size="xl" /></Flex>;
  }

  const isNotFound = (isError && error?.response?.status === 404) || (!post && !isLoading);
  if (isNotFound) {
    return (
      <Container centerContent py={10} textAlign="center">
        <Box>
          <Flex justify="center" mb={4}>
            {/*
              THAY ĐỔI: Dùng component <Image> để hiển thị file ảnh của bro.
              Next.js sẽ tự động tìm file "saber.ico" trong thư mục `public`.
            */}
            <Image src="/saber.ico" alt="Post Not Found Icon" boxSize="60px" />
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
