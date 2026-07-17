import { apiClient } from './client';

export const inviteEmployeeApi = async (employeeData: any) => {
  const response = await apiClient.post('/employees/invite', employeeData);
  return response.data;
};

export const listEmployeesApi = async (params?: { branchId?: string }) => {
  const response = await apiClient.get('/employees', { params });
  return response.data;
};

export const getEmployeeApi = async (id: string) => {
  const response = await apiClient.get(`/employees/${id}`);
  return response.data;
};

export const updateEmployeeApi = async (id: string, employeeData: any) => {
  const response = await apiClient.put(`/employees/${id}`, employeeData);
  return response.data;
};

export const deactivateEmployeeApi = async (id: string) => {
  const response = await apiClient.put(`/employees/${id}/deactivate`);
  return response.data;
};

export const activateEmployeeApi = async (id: string) => {
  const response = await apiClient.put(`/employees/${id}/activate`);
  return response.data;
};

export const deleteEmployeeApi = async (id: string) => {
  const response = await apiClient.delete(`/employees/${id}`);
  return response.data;
};

export const resetEmployeePasswordApi = async (id: string, passwordData: any) => {
  const response = await apiClient.put(`/employees/${id}/reset-password`, passwordData);
  return response.data;
};

export const moveEmployeeBranchApi = async (id: string, branchData: any) => {
  const response = await apiClient.put(`/employees/${id}/move-branch`, branchData);
  return response.data;
};
