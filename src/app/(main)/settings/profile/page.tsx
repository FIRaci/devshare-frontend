'use client';

import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Box, Button, Container, FormControl, FormLabel, Heading, Input, Stack, Textarea, useToast, Avatar, VStack, Spinner } from '@chakra-ui/react';
import apiClient from '@/lib/api';
import useAuthStore from '@/store/authStore';

interface ProfileData {
  bio: string;
  avatar: string;
}

const fetchProfile = async (): Promise<ProfileData> => {
  const { data } = await apiClient.get('/auth/profile/');
  return data;
};

const updateProfile = async (profileData: Partial<ProfileData>) => {
  const { data } = await apiClient.patch('/auth/profile/', profileData);
  return data;
};

const uploadImage = async (file: File): Promise<{ url: string }> => {
  const formData = new FormData();
  formData.append('file', file);
  const { data } = await apiClient.post('/upload-image/', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
};

export default function ProfileSettingsPage() {
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const toast = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const updateUserProfile = useAuthStore((state) => state.updateUserProfile);

  const { data: profileData, isLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: fetchProfile,
  });

  useEffect(() => {
    if (profileData) {
      setBio(profileData.bio || '');
      setAvatarUrl(profileData.avatar || '');
    }
  }, [profileData]);

  const profileMutation = useMutation({
    mutationFn: updateProfile,
    onSuccess: (updatedProfileData) => {
      toast({ title: 'Profile updated!', status: 'success' });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      updateUserProfile(updatedProfileData);
    },
  });

  const avatarMutation = useMutation({
    mutationFn: uploadImage,
    onSuccess: (data) => {
      const newAvatarUrl = data.url;
      setAvatarUrl(newAvatarUrl);
      profileMutation.mutate({ avatar: newAvatarUrl });
    },
  });

  const handleAvatarClick = () => fileInputRef.current?.click();
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) avatarMutation.mutate(e.target.files[0]);
  };
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    profileMutation.mutate({ bio });
  };

  if (isLoading) return <Spinner />;

  return (
    <Container maxW="container.md" py={8}>
      <Heading mb={6}>Profile Settings</Heading>
      <form onSubmit={handleSubmit}>
        <VStack spacing={8} bg="white" p={8} borderRadius="md" boxShadow="sm">
          <FormControl>
            <FormLabel>Avatar</FormLabel>
            <Avatar size="2xl" src={avatarUrl} cursor="pointer" onClick={handleAvatarClick} />
            <Input type="file" ref={fileInputRef} hidden onChange={handleFileChange} accept="image/*" />
          </FormControl>
          <FormControl>
            <FormLabel htmlFor="bio">Bio</FormLabel>
            <Textarea id="bio" value={bio} onChange={(e) => setBio(e.target.value)} />
          </FormControl>
          <Button type="submit" colorScheme="blue" isLoading={profileMutation.isPending || avatarMutation.isPending}>
            Save Profile
          </Button>
        </VStack>
      </form>
    </Container>
  );
}