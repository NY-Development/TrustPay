import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchBusinessApi, updateBusinessApi, fetchAllBusinessesApi } from '@/src/api/business.api';

export function useBusiness(businessId?: string) {
  const queryClient = useQueryClient();

  // 1. Query: Fetch a single business profile by ID (Maps to GET /:id)[cite: 13]
  const singleBusinessQuery = useQuery({
    queryKey: ['business', businessId],
    queryFn: () => fetchBusinessApi(businessId!),
    enabled: !!businessId, // Run only if an ID is explicitly passed
  });

  // 2. Query: Fetch all businesses (Maps to GET /, exclusive to SUPER_ADMIN)[cite: 13]
  const allBusinessesQuery = useQuery({
    queryKey: ['businesses', 'all'],
    queryFn: fetchAllBusinessesApi,
    enabled: !businessId, // Handy fallback runner if no target ID is declared
  });

  // 3. Mutation: Update a specific business profile (Maps to PATCH /:id)[cite: 13]
  const updateMutation = useMutation({
    mutationFn: (updateData: any) => {
      if (!businessId) throw new Error('Business ID is required for mutations');
      return updateBusinessApi(businessId, updateData);
    },
    onSuccess: () => {
      // Refresh the individual business view profile cache layout
      queryClient.invalidateQueries({ queryKey: ['business', businessId] });
      // Refresh the global collection matrix cache
      queryClient.invalidateQueries({ queryKey: ['businesses', 'all'] });
    },
  });

  return {
    // Single View Bindings
    business: singleBusinessQuery.data?.data,
    isBusinessLoading: singleBusinessQuery.isLoading,
    businessError: singleBusinessQuery.error,

    // Global Collections View Bindings (Super Admin Matrix)
    allBusinesses: allBusinessesQuery.data?.data ?? [],
    isAllBusinessesLoading: allBusinessesQuery.isLoading,
    allBusinessesError: allBusinessesQuery.error,

    // Action Mutation Callbacks
    modifyBusiness: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
    updateError: updateMutation.error,
  };
}