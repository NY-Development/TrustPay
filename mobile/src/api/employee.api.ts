import { apiClient } from './client';
import { ApiResponse, Employee } from '../types';

export const employeeApi = {
  list: async (branchId?: string) => {
    const params = branchId ? { branchId } : {};
    const response = await apiClient.get<ApiResponse<Employee[]>>('/employees', { params });
    return response.data;
  },

  getById: async (id: string) => {
    const response = await apiClient.get<ApiResponse<Employee>>(`/employees/${id}`);
    return response.data;
  },

  create: async (data: {
    name: string;
    email: string;
    password: string;
    role: string;
    branchId: string;
  }) => {
    const response = await apiClient.post<ApiResponse<Employee>>('/employees/invite', data);
    return response.data;
  },

  update: async (id: string, data: Partial<{ name: string; role: string; status: string }>) => {
    const response = await apiClient.put<ApiResponse<Employee>>(`/employees/${id}`, data);
    return response.data;
  },

  deactivate: async (id: string) => {
    const response = await apiClient.put<ApiResponse<Employee>>(`/employees/${id}/deactivate`);
    return response.data;
  },

  activate: async (id: string) => {
    const response = await apiClient.put<ApiResponse<Employee>>(`/employees/${id}/activate`);
    return response.data;
  },

  resetPassword: async (id: string, newPassword: string) => {
    const response = await apiClient.put<ApiResponse>(`/employees/${id}/reset-password`, { password: newPassword });
    return response.data;
  },

  moveBranch: async (id: string, newBranchId: string) => {
    const response = await apiClient.put<ApiResponse<Employee>>(`/employees/${id}/move-branch`, { branchId: newBranchId });
    return response.data;
  },
};
