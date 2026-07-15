import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { employeeApi } from '@/src/api/employee.api';

export function useEmployees(branchId?: string) {
  const queryClient = useQueryClient();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['employees', branchId],
    queryFn: () => employeeApi.list(branchId),
  });

  const createMutation = useMutation({
    mutationFn: employeeApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => employeeApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
    },
  });

  const deactivateMutation = useMutation({
    mutationFn: employeeApi.deactivate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
    },
  });

  const activateMutation = useMutation({
    mutationFn: employeeApi.activate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: ({ id, password }: { id: string; password: string }) => employeeApi.resetPassword(id, password),
  });

  const moveBranchMutation = useMutation({
    mutationFn: ({ id, branchId }: { id: string; branchId: string }) => employeeApi.moveBranch(id, branchId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
    },
  });

  return {
    employees: data?.data ?? [],
    isLoading,
    error,
    refetch,
    createEmployee: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
    updateEmployee: updateMutation.mutateAsync,
    deactivateEmployee: deactivateMutation.mutateAsync,
    activateEmployee: activateMutation.mutateAsync,
    resetEmployeePassword: resetPasswordMutation.mutateAsync,
    moveEmployeeBranch: moveBranchMutation.mutateAsync,
  };
}

export function useEmployeeDetail(id: string) {
  return useQuery({
    queryKey: ['employee', id],
    queryFn: () => employeeApi.getById(id),
    enabled: !!id,
  });
}
