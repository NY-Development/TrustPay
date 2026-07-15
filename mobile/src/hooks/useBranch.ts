import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { branchApi } from '@/src/api/branch.api';
import { useAuthStore } from '@/src/store/authStore';

export function useBranches() {
  const queryClient = useQueryClient();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['branches'],
    queryFn: branchApi.list,
  });

  const createMutation = useMutation({
    mutationFn: branchApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['branches'] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => branchApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['branches'] });
    },
  });

  const deactivateMutation = useMutation({
    mutationFn: branchApi.deactivate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['branches'] });
    },
  });

  return {
    branches: data?.data ?? [],
    isLoading,
    error,
    refetch,
    addBranch: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
    modifyBranch: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
    deactivateBranch: deactivateMutation.mutateAsync,
  };
}

export function useBranchDetail(branchId: string) {
  return useQuery({
    queryKey: ['branch', branchId],
    queryFn: () => branchApi.getById(branchId),
    enabled: !!branchId,
  });
}

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