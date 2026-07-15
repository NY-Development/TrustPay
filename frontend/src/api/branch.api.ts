import { apiClient } from './client';

export const listBranchesApi = async () => {
  const response = await apiClient.get('/api/v1/branches');
  return response.data;
};

export const getBranchApi = async (id: string) => {
  const response = await apiClient.get(`/api/v1/branches/${id}`);
  return response.data;
};

export const createBranchApi = async (branchData: any) => {
  const response = await apiClient.post('/api/v1/branches', branchData);
  return response.data;
};

export const updateBranchApi = async (id: string, branchData: any) => {
  const response = await apiClient.put(`/api/v1/branches/${id}`, branchData);
  return response.data;
};

export const deactivateBranchApi = async (id: string) => {
  const response = await apiClient.put(`/api/v1/branches/${id}/deactivate`);
  return response.data;
};

export const addBranchAccountApi = async (branchId: string, accountData: any) => {
  const response = await apiClient.post(`/api/v1/branches/${branchId}/accounts`, accountData);
  return response.data;
};

export const updateBranchAccountApi = async (branchId: string, accountId: string, accountData: any) => {
  const response = await apiClient.put(`/api/v1/branches/${branchId}/accounts/${accountId}`, accountData);
  return response.data;
};

export const removeBranchAccountApi = async (branchId: string, accountId: string) => {
  const response = await apiClient.delete(`/api/v1/branches/${branchId}/accounts/${accountId}`);
  return response.data;
};

export const switchBranchApi = async (branchId: string) => {
  const response = await apiClient.post('/api/v1/branches/switch', { branchId });
  return response.data;
};