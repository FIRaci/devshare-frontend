'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Box, Button, Container, FormControl, FormLabel, Heading, Input, Stack, Textarea, useToast, Spinner, Flex, Text as ChakraText
} from '@chakra-ui/react';
import apiClient from '@/lib/api';
import { Post } from '@/components/PostCard'; 

const fetchPost = async (id: string): Promise<Post> => {
  const { data } = await apiClient.get(`/posts/${id}/`);
  return data;
};

const updatePost = async ({ id, postData }: { id: number, postData: { title: string, content: string } }): Promise<Post> => {
  const { data } = await apiClient.patch(`/posts/${id}/`, postData);
  return data;
};

export default function EditPostPage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  const toast = useToast();
  const queryClient = useQueryClient();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  const { data: post, isLoading, isError } = useQuery<Post, Error>({
    queryKey: ['post', id],
    queryFn: () => fetchPost(id),
    enabled: !!id,
  });

  useEffect(() => {
    if (post) {
      setTitle(post.title);
      setContent(post.content || '');
    }
  }, [post]);

  const mutation = useMutation({
    mutationFn: updatePost,
    onSuccess: (data) => {
      toast({ title: 'Post updated.', status: 'success' });
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      queryClient.invalidateQueries({ queryKey: ['post', data.id] });
      router.push(`/c/${data.community.name}/comments/${data.id}`);
    },
    onError: (error) => {
      toast({ title: 'An error occurred.', description: error.message, status: 'error' });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate({ id: Number(id), postData: { title, content } });
  };

  if (isLoading) {
    return <Flex justify="center" p={8}><Spinner size="xl" /></Flex>;
  }

  if (isError) {
    return <ChakraText>Could not load post for editing.</ChakraText>;
  }

  return (
    <Container maxW="container.md" py={8}>
      <Heading mb={6}>Edit Post</Heading>
      <Box p={8} bg="white" boxShadow="md" borderRadius="xl">
        <form onSubmit={handleSubmit}>
          <Stack spacing="6">
            <FormControl isRequired>
              <FormLabel htmlFor="title">Title</FormLabel>
              <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} />
            </FormControl>
            <FormControl isRequired>
              <FormLabel htmlFor="content">Content</FormLabel>
              <Textarea id="content" value={content} onChange={(e) => setContent(e.target.value)} rows={10} />
            </FormControl>
            <Button type="submit" colorScheme="blue" isLoading={mutation.isPending}>
              Save Changes
            </Button>
          </Stack>
        </form>
      </Box>
    </Container>
  );
}