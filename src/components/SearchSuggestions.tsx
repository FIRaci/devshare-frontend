'use client';

import { Box, Text, VStack, HStack, Avatar, Spinner, Flex } from '@chakra-ui/react';
import Link from 'next/link';

// Định nghĩa kiểu dữ liệu cho các gợi ý
interface PostSuggestion {
  id: number;
  title: string;
  community_name: string;
}
interface CommunitySuggestion {
  id: number;
  name: string;
  avatar: string | null;
}
interface UserSuggestion {
  id: number;
  username: string;
  avatar: string | null;
}
export interface SuggestionData {
  posts: PostSuggestion[];
  communities: CommunitySuggestion[];
  users: UserSuggestion[];
}

interface SearchSuggestionsProps {
  data?: SuggestionData;
  isLoading: boolean;
  onClose: () => void; // Hàm để đóng suggestions
}

// Component SuggestionItem để tránh lồng thẻ <a> không cần thiết
const SuggestionItem = ({ children, href, onClick }: { children: React.ReactNode; href: string; onClick: () => void }) => (
  <Link href={href}>
    <Box as="a" p={2} _hover={{ bg: 'gray.100' }} borderRadius="md" w="full" onClick={onClick}>
      {children}
    </Box>
  </Link>
);

const SearchSuggestions = ({ data, isLoading, onClose }: SearchSuggestionsProps) => {
  const hasResults = data && (data.posts.length > 0 || data.communities.length > 0 || data.users.length > 0);

  return (
    <Box
      position="absolute"
      top="100%"
      left={0}
      right={0}
      bg="white"
      boxShadow="lg"
      borderRadius="md"
      mt={2}
      p={2}
      zIndex="dropdown"
    >
      {isLoading ? (
        <Flex justify="center" p={4}><Spinner /></Flex>
      ) : !hasResults ? (
        <Text p={2} color="gray.500">No results found.</Text>
      ) : (
        <VStack align="stretch" spacing={2}>
          {data?.posts.length > 0 && (
            <Box>
              <Text fontWeight="bold" fontSize="sm" color="gray.500" px={2} mb={1}>Posts</Text>
              {data.posts.map(post => (
                <SuggestionItem key={`post-${post.id}`} href={`/c/${post.community_name}/comments/${post.id}`} onClick={onClose}>
                  <Text noOfLines={1}>{post.title}</Text>
                </SuggestionItem>
              ))}
            </Box>
          )}
          {data?.communities.length > 0 && (
            <Box>
              <Text fontWeight="bold" fontSize="sm" color="gray.500" px={2} mb={1}>Communities</Text>
              {data.communities.map(community => (
                <SuggestionItem key={`comm-${community.id}`} href={`/c/${community.name}`} onClick={onClose}>
                  <HStack>
                    <Avatar size="xs" name={community.name} src={community.avatar || undefined} />
                    <Text>c/{community.name}</Text>
                  </HStack>
                </SuggestionItem>
              ))}
            </Box>
          )}
          {data?.users.length > 0 && (
            <Box>
              <Text fontWeight="bold" fontSize="sm" color="gray.500" px={2} mb={1}>Users</Text>
              {data.users.map(user => (
                <SuggestionItem key={`user-${user.id}`} href={`/u/${user.username}`} onClick={onClose}>
                  <HStack>
                    <Avatar size="xs" name={user.username} src={user.avatar || undefined} />
                    <Text>u/{user.username}</Text>
                  </HStack>
                </SuggestionItem>
              ))}
            </Box>
          )}
        </VStack>
      )}
    </Box>
  );
};

export default SearchSuggestions;