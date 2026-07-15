import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  listEmployeesApi,
  getEmployeeApi,
  inviteEmployeeApi,
  updateEmployeeApi,
  deactivateEmployeeApi,
  activateEmployeeApi,
  deleteEmployeeApi,
  resetEmployeePasswordApi,
  moveEmployeeBranchApi,
} from '@/src/api/employee.api';

export function useEmployees(branchId?: string) {
  return useQuery({
    queryKey: ['employees', branchId],
    queryFn: () => listEmployeesApi(branchId ? { branchId } : undefined),
  });
}

export function useEmployee(id: string) {
  return useQuery({
    queryKey: ['employee', id],
    queryFn: () => getEmployeeApi(id),
    enabled: !!id,
  });
}

export function useInviteEmployee() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: inviteEmployeeApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
    },
  });
}

export function useUpdateEmployee() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      updateEmployeeApi(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      queryClient.invalidateQueries({ queryKey: ['employee'] });
    },
  });
}

export function useDeactivateEmployee() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deactivateEmployeeApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
    },
  });
}

export function useActivateEmployee() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: activateEmployeeApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
    },
  });
}

export function useDeleteEmployee() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteEmployeeApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
    },
  });
}

export function useResetEmployeePassword() {
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      resetEmployeePasswordApi(id, data),
  });
}

export function useMoveEmployeeBranch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      moveEmployeeBranchApi(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      queryClient.invalidateQueries({ queryKey: ['employee'] });
    },
  });
}
