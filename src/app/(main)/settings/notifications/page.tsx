'use client';
import { Container, VStack, Heading, Spinner, Text, Box, Switch, FormControl, FormLabel, useToast } from '@chakra-ui/react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api';
import { Community } from '@/components/Sidebar';

interface CommunityWithMuteStatus extends Community {
    is_muted: boolean;
}

const fetchJoinedCommunities = async (): Promise<CommunityWithMuteStatus[]> => {
    const { data } = await apiClient.get('/communities/?joined=true'); 
    return data.results || [];
}

const toggleMute = async (communityId: number) => {
    // SỬA LỖI: Dùng đúng tên action là 'toggle_mute'
    return apiClient.post(`/communities/${communityId}/toggle_mute/`);
}

export default function NotificationSettingsPage() {
    const queryClient = useQueryClient();
    const toast = useToast();
    const { data: communities, isLoading } = useQuery({
        queryKey: ['joinedCommunitiesForNotif'],
        queryFn: fetchJoinedCommunities,
    });

    const mutation = useMutation({
        mutationFn: (communityId: number) => toggleMute(communityId),
        onSuccess: () => {
            toast({ title: 'Settings saved!', status: 'success', duration: 2000 });
            queryClient.invalidateQueries({ queryKey: ['joinedCommunitiesForNotif'] });
        },
        onError: () => {
            toast({ title: 'Could not update settings.', status: 'error' });
        }
    });

    return (
        <Container maxW="container.md" py={8}>
            <Heading mb={6}>Notification Settings</Heading>
            <VStack spacing={4} align="stretch">
                {isLoading && <Spinner />}
                {communities?.map(community => (
                    <FormControl key={community.id} display="flex" alignItems="center" justifyContent="space-between" p={4} bg="white" borderRadius="md" boxShadow="sm">
                        <FormLabel htmlFor={`mute-${community.id}`} mb="0">
                            Mute notifications from c/{community.name}
                        </FormLabel>
                        <Switch 
                            id={`mute-${community.id}`}
                            isChecked={!community.is_muted} 
                            onChange={() => mutation.mutate(community.id)}
                        />
                    </FormControl>
                ))}
            </VStack>
        </Container>
    );
}