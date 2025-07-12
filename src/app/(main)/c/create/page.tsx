'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Box, Button, Container, FormControl, FormLabel, Heading, Input, Stack, Textarea, useToast } from '@chakra-ui/react';
import apiClient from '@/lib/api';

const createCommunity = async (communityData: { name: string; description: string }) => {
  const { data } = await apiClient.post('/communities/', communityData);
  return data;
};

export default function CreateCommunityPage() {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const router = useRouter();
  const toast = useToast();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: createCommunity,
    onSuccess: (data) => {
      toast({ title: 'Community created!', status: 'success' });
      queryClient.invalidateQueries({ queryKey: ['communities'] });
      router.push(`/c/${data.name}`);
    },
    onError: (error: any) => {
      const errorMsg = error.response?.data?.name?.[0] || 'An error occurred.';
      toast({ title: 'Failed to create community', description: errorMsg, status: 'error' });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate({ name, description });
  };

  return (
    <Container maxW="container.md" py={8}>
      <Heading mb={6}>Create a Community</Heading>
      <Box p={8} bg="white" boxShadow="md" borderRadius="xl">
        <form onSubmit={handleSubmit}>
          <Stack spacing={4}>
            <FormControl isRequired>
              <FormLabel htmlFor="name">Name</FormLabel>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Community name (no spaces)" />
            </FormControl>
            <FormControl>
              <FormLabel htmlFor="description">Description</FormLabel>
              <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} />
            </FormControl>
            <Button type="submit" colorScheme="blue" isLoading={mutation.isPending}>
              Create Community
            </Button>
          </Stack>
        </form>
      </Box>
    </Container>
  );
}