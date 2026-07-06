import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { setQueryClient } from '@/src/providers/query-auth-sync';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 1000 * 60 * 5,
      refetchOnReconnect: false,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 0,
    },
  },
});

// IMPORTANT: register globally for auth sync
setQueryClient(queryClient);

export const QueryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};