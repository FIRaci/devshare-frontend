'use client';

import { 
  Box, Flex, Heading, Button, HStack, Menu, MenuButton, MenuList, MenuItem, Avatar, 
  useDisclosure, Drawer, DrawerOverlay, DrawerContent, DrawerCloseButton, IconButton, 
  InputGroup, InputLeftElement, Input, useBreakpointValue, useOutsideClick
} from '@chakra-ui/react';
import Link from 'next/link';
import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import useAuthStore from '@/store/authStore';
import useLayoutStore from '@/store/layoutStore';
import { HamburgerIcon, AddIcon, SearchIcon } from '@chakra-ui/icons';
import Sidebar from './Sidebar';
import NotificationBell from './NotificationBell';
// Import các component và hook mới
import { useDebounce } from 'use-debounce';
import { useQuery } from '@tanstack/react-query';
import apiClient from '@/lib/api';
import SearchSuggestions, { SuggestionData } from './SearchSuggestions';

const fetchSuggestions = async (query: string): Promise<SuggestionData> => {
    const { data } = await apiClient.get('/search/suggestions/', { params: { q: query } });
    return data;
};

const Navbar = () => {
  const { user, logout } = useAuthStore();
  const { toggleSidebar } = useLayoutStore();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [searchQuery, setSearchQuery] = useState('');
  const [isSuggestionsOpen, setSuggestionsOpen] = useState(false);
  const router = useRouter();
  const isMobile = useBreakpointValue({ base: true, lg: false });
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Debounce giá trị tìm kiếm
  const [debouncedQuery] = useDebounce(searchQuery, 300);

  // Fetch gợi ý khi debouncedQuery thay đổi
  const { data: suggestions, isLoading: suggestionsLoading } = useQuery({
      queryKey: ['searchSuggestions', debouncedQuery],
      queryFn: () => fetchSuggestions(debouncedQuery),
      enabled: debouncedQuery.length > 1, // Chỉ fetch khi có ít nhất 2 ký tự
  });

  // Đóng suggestions khi click ra ngoài
  useOutsideClick({
    ref: searchContainerRef,
    handler: () => setSuggestionsOpen(false),
  });

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setSuggestionsOpen(false); // Đóng gợi ý khi submit
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    if (e.target.value.length > 1) {
        setSuggestionsOpen(true);
    } else {
        setSuggestionsOpen(false);
    }
  }

  const handleMenuClick = () => {
    if (isMobile) {
      onOpen();
    } else {
      toggleSidebar();
    }
  };

  return (
    <Box bg="white" px={4} shadow="sm" position="sticky" top={0} zIndex="sticky">
      <Flex h={16} alignItems="center" justifyContent="space-between" maxW="container.2xl" mx="auto">
        <HStack spacing={4}>
          <IconButton
            aria-label="Menu"
            icon={<HamburgerIcon />}
            variant="ghost"
            onClick={handleMenuClick}
          />
          <Link href="/" passHref>
            <Heading size="md" color="blue.600" display={{ base: 'none', md: 'block' }}>DevShare</Heading>
          </Link>
        </HStack>

        {/* SỬA LỖI: Bọc search bar vào một container để xử lý click outside */}
        <Box flex={{ base: 1, md: 'auto' }} mx={4} w={{ md: '400px' }} position="relative" ref={searchContainerRef}>
          <form onSubmit={handleSearchSubmit}>
            <InputGroup>
              <InputLeftElement pointerEvents="none"><SearchIcon color="gray.300" /></InputLeftElement>
              <Input 
                type="text" 
                placeholder="Search DevShare" 
                borderRadius="full" 
                value={searchQuery} 
                onChange={handleInputChange}
                onFocus={() => searchQuery.length > 1 && setSuggestionsOpen(true)}
              />
            </InputGroup>
          </form>
          {isSuggestionsOpen && (
            <SearchSuggestions 
                data={suggestions} 
                isLoading={suggestionsLoading}
                onClose={() => setSuggestionsOpen(false)}
            />
          )}
        </Box>

        <HStack spacing={4}>
          {user ? (
            <>
              <NotificationBell />
              <Link href="/submit" passHref>
                <Button display={{ base: 'none', md: 'flex' }} leftIcon={<AddIcon />} colorScheme="blue" size="sm">
                  Create Post
                </Button>
              </Link>
              <Menu>
                <MenuButton as={Button} rounded="full" variant="link" cursor="pointer">
                  <Avatar size="sm" src={user.profile?.avatar || ''} name={user.username} />
                </MenuButton>
                <MenuList>
                  <Link href={`/u/${user.username}`} passHref><MenuItem>My Profile</MenuItem></Link>
                  <Link href="/saved" passHref><MenuItem>Saved</MenuItem></Link>
                  <Link href="/settings/communities" passHref><MenuItem>Community Settings</MenuItem></Link>
                  <Link href="/settings/profile" passHref><MenuItem>Profile Settings</MenuItem></Link>
                  <MenuItem onClick={logout}>Logout</MenuItem>
                </MenuList>
              </Menu>
            </>
          ) : (
            <HStack>
              <Link href="/login" passHref>
                <Button variant="ghost">Log In</Button>
              </Link>
              <Link href="/register" passHref>
                <Button colorScheme="blue">Sign Up</Button>
              </Link>
            </HStack>
          )}
        </HStack>
      </Flex>

      <Drawer isOpen={isOpen} placement="left" onClose={onClose}>
        <DrawerOverlay />
        <DrawerContent>
          <DrawerCloseButton />
          <Sidebar />
        </DrawerContent>
      </Drawer>
    </Box>
  );
};

export default Navbar;
