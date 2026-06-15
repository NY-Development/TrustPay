import { apiClient } from './client';
import { ApiResponse, User } from '../types';

export const authApi = {
  login: async (data: any) => {
    const response = await apiClient.post<ApiResponse<{ user: User }>>('/auth/login', data);
    return response.data;
  },
  register: async (data: any) => {
    const response = await apiClient.post<ApiResponse<{ user: User }>>('/auth/register', data);
    return response.data;
  },
  logout: async () => {
    const response = await apiClient.post<ApiResponse>('/auth/logout');
    return response.data;
  },
  getMe: async () => {
    const response = await apiClient.get<ApiResponse<{ user: User }>>('/auth/me');
    return response.data;
  },
  updatePushToken: async (pushToken: string) => {
    const response = await apiClient.patch<ApiResponse>('/auth/push-token', { pushToken });
    return response.data;
  },
};
