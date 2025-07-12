'use client';
import { Container, VStack, Heading, Spinner, Text, Box, Avatar, HStack } from '@chakra-ui/react';
import { useQuery } from '@tanstack/react-query';
import apiClient from '@/lib/api';
import Link from 'next/link';

interface Member {
  id: number;
  username: string;
  profile: { avatar: string | null };
}

const fetchMembers = async (communityName: string): Promise<Member[]> => {
    // API này cần được tạo ở backend
    const { data } = await apiClient.get(`/communities/${communityName}/members/`);
    return data.results || data;
}

export default function MembersPage({ params }: { params: { name: string } }) {
    const { name } = params;
    const { data: members, isLoading } = useQuery({
        queryKey: ['communityMembers', name],
        queryFn: () => fetchMembers(name),
    });

    return (
        <Container maxW="container.md" py={8}>
            <Heading mb={6}>Members of c/{name}</Heading>
            <VStack spacing={4} align="stretch">
                {isLoading && <Spinner />}
                {members?.map(member => (
                    <Link key={member.id} href={`/u/${member.username}`} passHref>
                        <HStack p={4} bg="white" borderRadius="md" boxShadow="sm" _hover={{ bg: 'gray.50' }} cursor="pointer">
                            <Avatar src={member.profile.avatar || ''} name={member.username} />
                            <Text fontWeight="bold">{member.username}</Text>
                        </HStack>
                    </Link>
                ))}
            </VStack>
        </Container>
    );
}
