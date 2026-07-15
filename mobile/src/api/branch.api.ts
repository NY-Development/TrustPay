import { apiClient } from './client';
import { ApiResponse, Branch } from '../types';

export const branchApi = {
  list: async () => {
    const response = await apiClient.get<ApiResponse<Branch[]>>('/branches');
    return response.data;
  },

  getById: async (id: string) => {
    const response = await apiClient.get<ApiResponse<Branch>>(`/branches/${id}`);
    return response.data;
  },

  create: async (data: Partial<Branch>) => {
    const response = await apiClient.post<ApiResponse<Branch>>('/branches', data);
    return response.data;
  },

  update: async (id: string, data: Partial<Branch>) => {
    const response = await apiClient.put<ApiResponse<Branch>>(`/branches/${id}`, data);
    return response.data;
  },

  deactivate: async (id: string) => {
    const response = await apiClient.put<ApiResponse<Branch>>(`/branches/${id}/deactivate`);
    return response.data;
  },

  addAccount: async (id: string, account: { accountNumber: string; accountProvider: string }) => {
    const response = await apiClient.post<ApiResponse<Branch['accounts']>>(`/branches/${id}/accounts`, account);
    return response.data;
  },

  updateAccount: async (
    id: string,
    accountId: string,
    account: { accountNumber?: string; accountProvider?: string }
  ) => {
    const response = await apiClient.put<ApiResponse<Branch['accounts']>>(`/branches/${id}/accounts/${accountId}`, account);
    return response.data;
  },

  removeAccount: async (id: string, accountId: string) => {
    const response = await apiClient.delete<ApiResponse<Branch['accounts']>>(`/branches/${id}/accounts/${accountId}`);
    return response.data;
  },

  switchContext: async (branchId: string) => {
    const response = await apiClient.post<ApiResponse<{ accessToken: string; refreshToken: string; selectedBranch: Branch }>>('/branches/switch', { branchId });
    return response.data;
  },
};