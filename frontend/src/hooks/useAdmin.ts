import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '../api/admin.api';

// Users
export const useAdminUsers = (params?: { role?: string; isActive?: boolean; search?: string }) => {
  return useQuery({
    queryKey: ['admin-users', params],
    queryFn: () => adminApi.getUsers(params),
  });
};

export const useAdminUserDetail = (id: string, enabled = true) => {
  return useQuery({
    queryKey: ['admin-user', id],
    queryFn: () => adminApi.getUserById(id),
    enabled: !!id && enabled,
  });
};

export const useUpdateAdminUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => adminApi.updateUser(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      queryClient.invalidateQueries({ queryKey: ['admin-user', variables.id] });
    },
  });
};

export const useDeleteAdminUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => adminApi.deleteUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    },
  });
};

// Verifications
export const useAdminVerifications = (params?: { status?: string; severity?: string; provider?: string; source?: string }) => {
  return useQuery({
    queryKey: ['admin-verifications', params],
    queryFn: () => adminApi.getVerifications(params),
  });
};

export const useAdminVerificationDetail = (id: string, enabled = true) => {
  return useQuery({
    queryKey: ['admin-verification', id],
    queryFn: () => adminApi.getVerificationById(id),
    enabled: !!id && enabled,
  });
};

// Subscriptions
export const useAdminSubscriptions = (params?: { status?: string; plan?: string }) => {
  return useQuery({
    queryKey: ['admin-subscriptions', params],
    queryFn: () => adminApi.getSubscriptions(params),
  });
};

export const useAdminSubscriptionDetail = (id: string, enabled = true) => {
  return useQuery({
    queryKey: ['admin-subscription', id],
    queryFn: () => adminApi.getSubscriptionById(id),
    enabled: !!id && enabled,
  });
};

export const useUpdateAdminSubscription = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => adminApi.updateSubscription(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin-subscriptions'] });
      queryClient.invalidateQueries({ queryKey: ['admin-subscription', variables.id] });
    },
  });
};

// Audit Logs
export const useAdminAuditLogs = (params?: { action?: string; actorId?: string }) => {
  return useQuery({
    queryKey: ['admin-audit-logs', params],
    queryFn: () => adminApi.getAuditLogs(params),
  });
};

// System Stats
export const useAdminSystemStats = () => {
  return useQuery({
    queryKey: ['admin-system-stats'],
    queryFn: adminApi.getSystemStats,
  });
};
