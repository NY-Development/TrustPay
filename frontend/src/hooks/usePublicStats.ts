import { useQuery } from '@tanstack/react-query';
import { publicApi } from '../api/public.api';

// Public, unauthenticated stats — safe to fetch on marketing/auth pages
// before login. Backed by a 60s server-side cache, so a generous client
// staleTime avoids redundant refetches without ever showing stale-by-more-
// than-a-minute numbers.
export const usePublicStats = () => {
  return useQuery({
    queryKey: ['public-stats'],
    queryFn: publicApi.getStats,
    staleTime: 60_000,
    retry: 1,
  });
};
