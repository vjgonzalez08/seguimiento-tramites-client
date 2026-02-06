'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import Navbar from '@/components/Navbar';

export default function ClientLayout({ children }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            refetchOnWindowFocus: false,
            refetchOnReconnect: false,
            retry: 1,
            staleTime: 30 * 60 * 1000,
            cacheTime: 60 * 60 * 1000,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <Navbar />
      <main style={{ padding: '2rem' }}>{children}</main>
    </QueryClientProvider>
  );
}
