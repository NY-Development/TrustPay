import { apiClient } from './client';

export const inviteEmployeeApi = async (employeeData: any) => {
  const response = await apiClient.post('/api/v1/employees/invite', employeeData);
  return response.data;
};

export const listEmployeesApi = async (params?: { branchId?: string }) => {
  const response = await apiClient.get('/api/v1/employees', { params });
  return response.data;
};

export const getEmployeeApi = async (id: string) => {
  const response = await apiClient.get(`/api/v1/employees/${id}`);
  return response.data;
};

export const updateEmployeeApi = async (id: string, employeeData: any) => {
  const response = await apiClient.put(`/api/v1/employees/${id}`, employeeData);
  return response.data;
};

export const deactivateEmployeeApi = async (id: string) => {
  const response = await apiClient.put(`/api/v1/employees/${id}/deactivate`);
  return response.data;
};

export const activateEmployeeApi = async (id: string) => {
  const response = await apiClient.put(`/api/v1/employees/${id}/activate`);
  return response.data;
};

export const deleteEmployeeApi = async (id: string) => {
  const response = await apiClient.delete(`/api/v1/employees/${id}`);
  return response.data;
};

export const resetEmployeePasswordApi = async (id: string, passwordData: any) => {
  const response = await apiClient.put(`/api/v1/employees/${id}/reset-password`, passwordData);
  return response.data;
};

export const moveEmployeeBranchApi = async (id: string, branchData: any) => {
  const response = await apiClient.put(`/api/v1/employees/${id}/move-branch`, branchData);
  return response.data;
};
