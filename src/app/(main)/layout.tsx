'use client';

import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import useLayoutStore from "@/store/layoutStore";
import { Box, Flex } from "@chakra-ui/react";

export default function MainLayout({ children }: { children: React.ReactNode; }) {
  const { isSidebarOpen } = useLayoutStore();

  return (
    <Box bg="gray.50" minH="100vh">
      {/* 1. Render Navbar ở trên cùng */}
      <Navbar /> 
      
      {/* 2. Tạo một container cho nội dung bên dưới Navbar */}
      <Flex 
        maxW="container.2xl" 
        mx="auto" 
        pt={6} 
        px={4} 
        align="flex-start"
      >
        
        {/* Cột Sidebar (hiển thị có điều kiện) */}
        {isSidebarOpen && (
          <Box 
            as="aside"
            w="280px" 
            mr={6} 
            display={{ base: 'none', lg: 'block' }}
          >
            <Sidebar />
          </Box>
        )}
        
        {/* Cột nội dung chính */}
        <Box as="main" flex="1" minW={0}>
          {children}
        </Box>

      </Flex>
    </Box>
  );
}
