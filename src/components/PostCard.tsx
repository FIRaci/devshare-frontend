'use client';

import React from 'react'; // SỬA LỖI: Thêm dòng import này
import { Box, Flex, Heading, Text, HStack, IconButton, VStack, useToast, Button, Spacer, Menu, MenuButton, MenuList, MenuItem, Image } from '@chakra-ui/react';
import { ArrowUpIcon, ArrowDownIcon, ChatIcon } from '@chakra-ui/icons';
import { FaBookmark, FaRegBookmark } from 'react-icons/fa';
import { BsThreeDots } from 'react-icons/bs';
import Link from 'next/link';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api';
import { formatDistanceToNow } from 'date-fns';
import useAuthStore from '@/store/authStore';
import useHiddenPostsStore from '@/store/hiddenPostsStore';
import MarkdownRenderer from './MarkdownRenderer';
import { useRouter } from 'next/navigation';

// =================================================================
// INTERFACES (ĐÃ SỬA LỖI)
// =================================================================

export interface Author {
  id: number;
  username: string;
  profile?: { avatar: string | null };
}

export interface Community {
  id: number;
  name: string;
  // SỬA LỖI: Trả về kiểu dữ liệu đúng
  description?: string;
  member_count?: number;
  is_member?: boolean;
}

export interface Comment {
  id: number;
  author: Author;
  content: string;
  created_at: string;
  parent?: number | null;
  replies?: Comment[];
}

export interface Post {
  id: number;
  title: string;
  content: string;
  image_url?: string;
  author: Author;
  community: Community;
  created_at: string;
  score: number;
  comment_count: number;
  user_vote: 1 | -1 | null;
  is_saved: boolean;
}

// =================================================================
// COMPONENT POSTCARD
// =================================================================

interface PostCardProps {
  post: Post;
  queryKey: any[];
  isDetailView?: boolean;
}

const PostCard = ({ post, queryKey, isDetailView = false }: PostCardProps) => {
  const user = useAuthStore((state) => state.user);
  const toast = useToast();
  const queryClient = useQueryClient();
  const router = useRouter();
  const hidePost = useHiddenPostsStore((state) => state.hidePost);

  const voteMutation = useMutation({
    mutationFn: (action: 'upvote' | 'downvote') => apiClient.post(`/posts/${post.id}/${action}/`),
    onMutate: async (action) => {
      await queryClient.cancelQueries({ queryKey });
      const previousData = queryClient.getQueryData<any>(queryKey);
      queryClient.setQueryData(queryKey, (oldData: any) => {
        if (!oldData) return oldData;
        const updatePostLogic = (p: Post) => {
            if (p.id !== post.id) return p;
            let newScore = p.score;
            const currentVote = p.user_vote;
            let newVote: 1 | -1 | null = null;
            if (action === 'upvote') {
                if (currentVote === 1) { newScore--; newVote = null; } 
                else if (currentVote === -1) { newScore += 2; newVote = 1; } 
                else { newScore++; newVote = 1; }
            } else {
                if (currentVote === -1) { newScore++; newVote = null; } 
                else if (currentVote === 1) { newScore -= 2; newVote = -1; } 
                else { newScore--; newVote = -1; }
            }
            return { ...p, score: newScore, user_vote: newVote };
        };
        if (oldData.pages) {
            return { ...oldData, pages: oldData.pages.map((page: any) => ({ ...page, results: page.results.map(updatePostLogic) })) };
        } else {
            return updatePostLogic(oldData);
        }
      });
      return { previousData };
    },
    onError: (err, variables, context) => {
      if (context?.previousData) queryClient.setQueryData(queryKey, context.previousData);
      toast({ title: "Vote failed.", status: "error" });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  const saveMutation = useMutation({
    mutationFn: () => apiClient.post(`/posts/${post.id}/save/`),
    onSuccess: () => {
        toast({ title: post.is_saved ? "Post unsaved" : "Post saved!", status: 'success', duration: 2000 });
        queryClient.invalidateQueries({ queryKey });
        queryClient.invalidateQueries({ queryKey: ['savedPosts'] });
    },
    onError: () => toast({ title: "Action failed", status: "error" }),
  });

  const handleVote = (action: 'upvote' | 'downvote') => {
    if (!user) return toast({ title: "Please log in to vote", status: "info", duration: 2000, isClosable: true });
    voteMutation.mutate(action);
  };
  const handleSave = () => {
    if (!user) return toast({ title: "Please log in to save", status: "info", duration: 2000, isClosable: true });
    saveMutation.mutate();
  };
  const handleHide = () => {
    hidePost(post.id);
    toast({ title: "Post hidden", status: "info", duration: 2000 });
  };
  
  const handleNavigate = () => {
      router.push(`/c/${post.community.name}/comments/${post.id}`);
  }

  return (
    <Flex bg="white" p={0} borderRadius="md" boxShadow="sm" w="full" borderWidth="1px" _hover={{ borderColor: 'gray.300' }}>
      <VStack spacing={1} p={2} align="center" bg="gray.50" borderLeftRadius="md">
        <IconButton aria-label="Upvote" icon={<ArrowUpIcon />} size="sm" variant="ghost" colorScheme={post.user_vote === 1 ? 'orange' : 'gray'} onClick={() => handleVote('upvote')} />
        <Text fontWeight="bold" fontSize="md">{post.score}</Text>
        <IconButton aria-label="Downvote" icon={<ArrowDownIcon />} size="sm" variant="ghost" colorScheme={post.user_vote === -1 ? 'blue' : 'gray'} onClick={() => handleVote('downvote')} />
      </VStack>
      
      <VStack p={4} flex="1" align="stretch" spacing={3}>
        <HStack spacing={2} fontSize="xs" color="gray.500">
          <Link href={`/c/${post.community.name}`} passHref><Text as="span" fontWeight="bold" _hover={{ textDecoration: 'underline' }}>c/{post.community.name}</Text></Link>
          <Text>•</Text>
          <Text>Posted by <Link href={`/u/${post.author.username}`} passHref><Text as="span" _hover={{ textDecoration: 'underline' }}>u/{post.author.username}</Text></Link></Text>
          <Text>{formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}</Text>
        </HStack>
        
        <Heading as='h2' size='md' _hover={{ textDecoration: 'underline' }} cursor='pointer' onClick={handleNavigate}>
            {post.title}
        </Heading>

        <Box
            w="full"
            onClick={!isDetailView ? handleNavigate : undefined}
            cursor={!isDetailView ? 'pointer' : 'default'}
            maxH={isDetailView ? 'none' : '500px'}
            overflow="hidden"
            position="relative"
            _after={!isDetailView && post.content.length > 500 ? {
                content: '""',
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                height: '80px',
                background: 'linear-gradient(to bottom, transparent, white)',
                pointerEvents: 'none'
            } : {}}
        >
            <MarkdownRenderer content={post.content || ''} />
        </Box>
        
        <Spacer />

        <HStack w="full" justify="space-between">
            <HStack spacing={1}>
                <Button size="sm" variant="ghost" colorScheme="gray" leftIcon={<ChatIcon />} onClick={handleNavigate}>{post.comment_count} Comments</Button>
                <Button size="sm" variant="ghost" colorScheme="gray" leftIcon={post.is_saved ? <FaBookmark /> : <FaRegBookmark />} onClick={handleSave}>{post.is_saved ? 'Saved' : 'Save'}</Button>
            </HStack>
            <Menu>
                <MenuButton as={IconButton} aria-label="Options" icon={<BsThreeDots />} variant="ghost" size="sm" />
                <MenuList>
                    <MenuItem onClick={handleHide}>Hide Post</MenuItem>
                    <MenuItem>Report</MenuItem>
                </MenuList>
            </Menu>
        </HStack>
      </VStack>
    </Flex>
  );
};

export default PostCard;
