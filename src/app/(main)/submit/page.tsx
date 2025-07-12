'use client';
import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Box, Button, Container, FormControl, FormLabel, Heading, Input, Stack, Textarea, useToast, Select, Text, HStack, Image, Wrap, WrapItem } from '@chakra-ui/react';
import apiClient from '@/lib/api';
import useAuthStore from '@/store/authStore';
import { Community } from '@/components/Sidebar';
import { FaImage } from 'react-icons/fa';

const fetchCommunities = async (): Promise<Community[]> => {
  const { data } = await apiClient.get('/communities/');
  return data.results || data;
};

const uploadImage = async (file: File): Promise<{ url: string }> => {
  const formData = new FormData();
  formData.append('file', file);
  const { data } = await apiClient.post('/upload-image/', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
};

export default function SubmitPage() {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [communityId, setCommunityId] = useState('');
  const [uploadedImageUrls, setUploadedImageUrls] = useState<string[]>([]);
  const router = useRouter();
  const toast = useToast();
  const user = useAuthStore((state) => state.user);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: communities } = useQuery<Community[], Error>({ 
    queryKey: ['communities'], 
    queryFn: fetchCommunities 
  });

  const postMutation = useMutation({
    mutationFn: (postData: { title: string; content: string; community_id: number }) => {
      return apiClient.post('/posts/', postData);
    },
    onSuccess: (response: { data: any }) => {
      toast({ title: 'Post created.', status: 'success' });
      router.push(`/post/${response.data.id}`);
    },
    onError: (error: any) => {
      toast({ title: 'Failed to create post.', description: error.message, status: 'error' });
    },
  });

  const imageUploadMutation = useMutation({
    mutationFn: uploadImage,
    onSuccess: (data) => {
      const imageUrl = data.url;
      const markdownImage = `\n![Image](${imageUrl})\n`;
      setContent((prevContent) => prevContent + markdownImage);
      setUploadedImageUrls((prevUrls) => [...prevUrls, imageUrl]);
      toast({ title: 'Image uploaded!', status: 'success', isClosable: true });
    },
    onError: () => {
      toast({ title: 'Image upload failed.', status: 'error' });
    },
  });

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      imageUploadMutation.mutate(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!communityId || !title.trim()) {
        toast({ title: 'Community and title are required.', status: 'warning' });
        return;
    }
    postMutation.mutate({ title, content, community_id: Number(communityId) });
  };

  if (!user) { return <Text p={4}>Please log in to create a post.</Text>; }

  return (
    <Container maxW="container.lg" py={8}>
      <Heading mb={6}>Create a new post</Heading>
      <Box p={8} bg="white" boxShadow="md" borderRadius="xl">
        <form onSubmit={handleSubmit}>
          <Stack spacing="6">
            <FormControl isRequired>
              <FormLabel htmlFor="community">Choose a community</FormLabel>
              <Select placeholder="Select community" value={communityId} onChange={(e) => setCommunityId(e.target.value)}>
                {communities?.map(c => <option key={c.id} value={c.id}>c/{c.name}</option>)}
              </Select>
            </FormControl>
            <FormControl isRequired>
              <FormLabel htmlFor="title">Title</FormLabel>
              <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} />
            </FormControl>
            <FormControl>
              <FormLabel htmlFor="content">Content</FormLabel>
              <HStack border="1px" borderColor="gray.200" p={2} borderTopRadius="md">
                <Button size="sm" leftIcon={<FaImage />} onClick={() => fileInputRef.current?.click()} isLoading={imageUploadMutation.isPending}>
                  Upload Image
                </Button>
                <Input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" display="none" />
              </HStack>
              <Textarea id="content" value={content} onChange={(e) => setContent(e.target.value)} placeholder="Your post content. Markdown is supported!" rows={15} fontFamily="monospace" borderTopRadius="0" />
            </FormControl>
            {uploadedImageUrls.length > 0 && (
              <Box>
                <Text fontSize="sm" fontWeight="bold" mb={2}>Image Previews:</Text>
                <Wrap spacing={4}>
                  {uploadedImageUrls.map((url, index) => (
                    <WrapItem key={index}><Image src={url} boxSize="120px" objectFit="cover" borderRadius="md" /></WrapItem>
                  ))}
                </Wrap>
              </Box>
            )}
            <Button type="submit" colorScheme="blue" isLoading={postMutation.isPending}>
              Submit Post
            </Button>
          </Stack>
        </form>
      </Box>
    </Container>
  );
}