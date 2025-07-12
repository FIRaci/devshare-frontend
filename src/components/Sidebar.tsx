'use client';
import { Box, Button, Heading, Spinner, Stack, Text, VStack } from '@chakra-ui/react';
import { useQuery } from '@tanstack/react-query';
import apiClient from '@/lib/api';
import Link from 'next/link';
import { AddIcon } from '@chakra-ui/icons';

// SỬA LỖI: Cập nhật interface để đồng bộ với backend
export interface Community {
  id: number;
  name: string;
  description: string;
  member_count: number;
  is_member: boolean; // <-- THÊM TRƯỜNG NÀY
}

const fetchCommunities = async (): Promise<Community[]> => {
  const { data } = await apiClient.get('/communities/');
  return data.results || data;
};

const Sidebar = () => {
  const { data: communities, isLoading } = useQuery<Community[], Error>({
    queryKey: ['communities'],
    queryFn: fetchCommunities,
  });

  return (
    <Box p={4} bg="white" borderRadius="md" boxShadow="sm" position="sticky" top="5rem">
      <VStack align="stretch" spacing={4}>
        <Heading size="sm">Communities</Heading>
        {isLoading && <Spinner />}
        <Stack>
          {communities?.map((community) => (
            <Link key={community.id} href={`/c/${community.name}`} passHref>
              <Text _hover={{ bg: 'gray.100' }} p={2} borderRadius="md" cursor="pointer">
                c/{community.name}
              </Text>
            </Link>
          ))}
        </Stack>
        <Link href="/c/create" passHref>
            <Button leftIcon={<AddIcon />} size="sm" colorScheme='teal' w="full">
                Create Community
            </Button>
        </Link>
      </VStack>
    </Box>
  );
};

export default Sidebar;