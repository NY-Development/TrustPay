import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getBranchApi, createBranchApi, updateBranchApi } from '@/src/api/branch.api';

export function useBranch(businessId: string) {
  const queryClient = useQueryClient();

  // Query: Get list of branches
  const { data, isLoading, error } = useQuery({
    queryKey: ['branches', businessId],
    queryFn: () => getBranchApi(businessId),
  });

  // Mutation: Create a new branch
  const createMutation = useMutation({
    mutationFn: createBranchApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['branches', businessId] });
    },
  });

  // Mutation: Update a branch
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => updateBranchApi(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['branches', businessId] });
    },
  });

  return {
    branches: data?.data ?? [],
    isLoading,
    error,
    addBranch: createMutation.mutateAsync,
    modifyBranch: updateMutation.mutateAsync,
  };
}