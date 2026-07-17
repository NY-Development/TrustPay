import { apiClient } from './client';

export const listBranchesApi = async () => {
  const response = await apiClient.get('/branches');
  return response.data;
};

export const getBranchApi = async (id: string) => {
  const response = await apiClient.get(`/branches/${id}`);
  return response.data;
};

export const createBranchApi = async (branchData: any) => {
  const response = await apiClient.post('/branches', branchData);
  return response.data;
};

export const updateBranchApi = async (id: string, branchData: any) => {
  const response = await apiClient.put(`/branches/${id}`, branchData);
  return response.data;
};

export const deactivateBranchApi = async (id: string) => {
  const response = await apiClient.put(`/branches/${id}/deactivate`);
  return response.data;
};

export const addBranchAccountApi = async (branchId: string, accountData: any) => {
  const response = await apiClient.post(`/branches/${branchId}/accounts`, accountData);
  return response.data;
};

export const updateBranchAccountApi = async (branchId: string, accountId: string, accountData: any) => {
  const response = await apiClient.put(`/branches/${branchId}/accounts/${accountId}`, accountData);
  return response.data;
};

export const removeBranchAccountApi = async (branchId: string, accountId: string) => {
  const response = await apiClient.delete(`/branches/${branchId}/accounts/${accountId}`);
  return response.data;
};

export const switchBranchApi = async (branchId: string) => {
  const response = await apiClient.post('/branches/switch', { branchId });
  return response.data;
};
