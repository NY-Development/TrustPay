import { useMutation, useQuery, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { verificationApi } from '../api/verification.api';

export const useVerifyManual = () => {
  const queryClient = useQueryClient(); //[cite: 11]

  return useMutation({
    mutationFn: verificationApi.verifyManual, //[cite: 11]
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['verifications'] }); //[cite: 11]
    },
  });
};

export const useVerifyUniversal = () => {
  const queryClient = useQueryClient(); //[cite: 11]

  return useMutation({
    mutationFn: verificationApi.verifyUniversal, //[cite: 11]
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['verifications'] }); //[cite: 11]
    },
  });
};

export const useVerifyOcr = () => {
  const queryClient = useQueryClient(); //[cite: 11]

  return useMutation({
    mutationFn: verificationApi.verifyOcr, //[cite: 11]
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['verifications'] }); //[cite: 11]
    },
  });
};

/**
 * Upgraded Infinite Query Hook for Seamless Mobile Pagination
 * Combines query inputs into the cache key so changes wipe/refetch automatically.
 */
export const useVerificationHistory = (filters: { provider?: string; limit?: number } = {}) => {
  const { provider, limit = 15 } = filters;

  return useInfiniteQuery({
    // Dynamic query key structure: changes to provider will trigger fresh lookups
    queryKey: ['verifications', { provider, limit }],
    queryFn: ({ pageParam = 1 }) => 
      verificationApi.getHistory({ page: pageParam, limit, provider }),
    initialPageParam: 1,
    // The backend provides a `hasMore` token inside the pagination node object
    getNextPageParam: (lastPage) => {
      const current = lastPage.pagination.currentPage;
      return lastPage.pagination.hasMore ? current + 1 : undefined;
    },
  });
};

export const useVerificationDetail = (id: string) => {
  return useQuery({
    queryKey: ['verification', id], //[cite: 11]
    queryFn: () => verificationApi.getById(id), //[cite: 11]
    enabled: !!id, //[cite: 11]
  });
};