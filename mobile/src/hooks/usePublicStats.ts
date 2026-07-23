import { useQuery } from '@tanstack/react-query';
import { publicApi } from '../api/public.api';

export const usePublicStats = () => {
  return useQuery({
    queryKey: ['public-stats'],
    queryFn: publicApi.getStats,
    staleTime: 60_000,
    retry: 1,
  });
};
