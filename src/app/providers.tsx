'use client';

import { CacheProvider } from '@chakra-ui/next-js';
import { ChakraProvider } from '@chakra-ui/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';

export function Providers({ 
    children 
  }: { 
  children: React.ReactNode 
  }) {
  // Tạo một instance của QueryClient và đảm bảo nó chỉ được tạo một lần
  const [queryClient] = useState(() => new QueryClient());

  return (
    <CacheProvider>
      <ChakraProvider>
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      </ChakraProvider>
    </CacheProvider>
  );
}
