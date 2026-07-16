import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getBranchApi, createBranchApi, updateBranchApi } from '@/src/api/branch.api';
import { useAuthStore } from '@/src/store/authStore';

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

/**
 * Full branch detail: overview stats (employee count, active subscription,
 * trial days left) alongside the branch document itself.
 */
export function useBranchDetail(id: string) {
  return useQuery({
    queryKey: ['branch-detail', id],
    queryFn: () => getBranchApi(id),
    enabled: !!id,
  });
}

/**
 * Owner-only branch context switch. Regenerates the JWT (via authStore.switchBranch)
 * so branch-scoped reads (subscription status, etc.) reflect the newly selected branch.
 */
export function useSwitchBranch() {
  const switchBranch = useAuthStore((s) => s.switchBranch);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: switchBranch,
    onSuccess: () => {
      queryClient.invalidateQueries();
    },
  });
}