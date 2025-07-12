'use client';
import {
  Popover, PopoverTrigger, PopoverContent, PopoverHeader, PopoverBody,
  PopoverArrow, PopoverCloseButton, IconButton, Box, Text, Spinner,
  VStack, useToast, Flex, Badge
} from '@chakra-ui/react';
import { BellIcon } from '@chakra-ui/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns/formatDistanceToNow';

interface Notification {
  id: number;
  actor: { username: string };
  verb: string;
  target_id: number;
  is_read: boolean;
  timestamp: string;
}

const fetchNotifications = async (): Promise<Notification[]> => {
  const { data } = await apiClient.get('/notifications/');
  return data.results || data;
};

const NotificationBell = () => {
  const toast = useToast();
  const queryClient = useQueryClient();
  const { data: notifications, isLoading } = useQuery<Notification[], Error>({
    queryKey: ['notifications'],
    queryFn: fetchNotifications,
    refetchInterval: 60000, // Refetch every 60 seconds
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: () => apiClient.post('/notifications/mark_all_as_read/'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Could not mark notifications as read.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  });

  const unreadCount = notifications?.filter(n => !n.is_read).length || 0;

  const renderNotificationText = (notification: Notification) => {
    // Customize this based on your notification verbs
    return `${notification.actor.username} ${notification.verb}`;
  };

  return (
    <Popover onOpen={() => unreadCount > 0 && markAllAsReadMutation.mutate()}>
      <PopoverTrigger>
        {/* SỬA LỖI: PopoverTrigger chỉ bao bọc IconButton */}
        <Box position="relative">
          <IconButton
            aria-label="Notifications"
            icon={<BellIcon />}
            variant="ghost"
            fontSize="xl"
          />
          {unreadCount > 0 && (
            <Badge
              colorScheme="red"
              borderRadius="full"
              position="absolute"
              top="-1"
              right="-1"
              fontSize="0.7em"
              px={1.5}
            >
              {unreadCount}
            </Badge>
          )}
        </Box>
      </PopoverTrigger>
      <PopoverContent>
        <PopoverArrow />
        <PopoverCloseButton />
        <PopoverHeader>Notifications</PopoverHeader>
        <PopoverBody p={0}>
          {isLoading ? (
            <Flex justify="center" p={4}><Spinner /></Flex>
          ) : notifications && notifications.length > 0 ? (
            <VStack align="stretch" spacing={0}>
              {notifications.slice(0, 5).map((notification) => (
                // SỬA LỖI: Dùng Link bao bọc Box, không lồng <a> trong <a>
                <Link key={notification.id} href={`/post/${notification.target_id}`} passHref legacyBehavior>
                  <Box 
                    as="a" // Link sẽ truyền href cho Box này
                    p={3} 
                    _hover={{ bg: 'gray.50' }} 
                    bg={!notification.is_read ? 'blue.50' : 'white'}
                    borderBottomWidth="1px"
                  >
                    <Text fontSize="sm">{renderNotificationText(notification)}</Text>
                    <Text fontSize="xs" color="gray.500">
                      {formatDistanceToNow(new Date(notification.timestamp), { addSuffix: true })}
                    </Text>
                  </Box>
                </Link>
              ))}
            </VStack>
          ) : (
            <Text p={4} fontSize="sm" color="gray.500">You have no notifications.</Text>
          )}
        </PopoverBody>
      </PopoverContent>
    </Popover>
  );
};

export default NotificationBell;