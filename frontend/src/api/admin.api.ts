import { apiClient } from './client';
import type { ApiResponse } from '../types';

export const adminApi = {
  // Owner Trading License Management
  getPendingLicenses: async () => {
    const response = await apiClient.get<ApiResponse<any[]>>('/admin/licenses/pending');
    return response.data;
  },
  approveLicense: async (ownerId: string) => {
    const response = await apiClient.put<ApiResponse<any>>(`/admin/licenses/${ownerId}/approve`);
    return response.data;
  },
  rejectLicense: async (ownerId: string, reason?: string) => {
    const response = await apiClient.put<ApiResponse<any>>(`/admin/licenses/${ownerId}/reject`, { reason });
    return response.data;
  },
  suspendOwner: async (ownerId: string) => {
    const response = await apiClient.put<ApiResponse<any>>(`/admin/licenses/${ownerId}/suspend`);
    return response.data;
  },
  restoreOwner: async (ownerId: string) => {
    const response = await apiClient.put<ApiResponse<any>>(`/admin/licenses/${ownerId}/restore`);
    return response.data;
  },

  // Users
  getUsers: async (params?: { role?: string; isActive?: boolean; search?: string }) => {
    const response = await apiClient.get<ApiResponse<any[]>>('/admin/users', { params });
    return response.data;
  },
  getUserById: async (id: string) => {
    const response = await apiClient.get<ApiResponse<any>>(`/admin/users/${id}`);
    return response.data;
  },
  updateUser: async (id: string, data: any) => {
    const response = await apiClient.patch<ApiResponse<any>>(`/admin/users/${id}`, data);
    return response.data;
  },
  deleteUser: async (id: string) => {
    const response = await apiClient.delete<ApiResponse<void>>(`/admin/users/${id}`);
    return response.data;
  },

  // Verifications
  getVerifications: async (params?: { status?: string; severity?: string; provider?: string; source?: string }) => {
    const response = await apiClient.get<ApiResponse<any[]>>('/admin/verifications', { params });
    return response.data;
  },
  getVerificationById: async (id: string) => {
    const response = await apiClient.get<ApiResponse<any>>(`/admin/verifications/${id}`);
    return response.data;
  },

  // Subscriptions
  getSubscriptions: async (params?: { status?: string; plan?: string }) => {
    const response = await apiClient.get<ApiResponse<any[]>>('/admin/subscriptions', { params });
    return response.data;
  },
  getSubscriptionById: async (id: string) => {
    const response = await apiClient.get<ApiResponse<any>>(`/admin/subscriptions/${id}`);
    return response.data;
  },
  updateSubscription: async (id: string, data: any) => {
    const response = await apiClient.patch<ApiResponse<any>>(`/admin/subscriptions/${id}`, data);
    return response.data;
  },

  // Audit Logs
  getAuditLogs: async (params?: { action?: string; actorId?: string }) => {
    const response = await apiClient.get<ApiResponse<any[]>>('/admin/audit-logs', { params });
    return response.data;
  },

  // System Stats
  getSystemStats: async () => {
    const response = await apiClient.get<ApiResponse<any>>('/admin/stats');
    return response.data;
  },
};
export default adminApi;
