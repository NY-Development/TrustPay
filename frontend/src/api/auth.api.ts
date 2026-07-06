import { apiClient } from './client';
import type{ ApiResponse, User } from '../types';

export const authApi = {
  login: async (data: any) => {
    const response = await apiClient.post<ApiResponse<{ user: User; accessToken: string; refreshToken: string }>>('/auth/login', data);
    return response.data;
  },
  register: async (data: any) => {
    const response = await apiClient.post<ApiResponse<{ user: User; accessToken: string; refreshToken: string }>>('/auth/register', data);
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
  forgotPassword: async (email: string) => {
    const response = await apiClient.post<ApiResponse>('/auth/forgot-password', { email });
    return response.data;
  },
  verifyOtp: async (email: string, otp: string) => {
    const response = await apiClient.post<ApiResponse & { resetToken: string }>('/auth/verify-otp', { email, otp });
    return response.data;
  },
  resetPassword: async (data: any) => {
    const response = await apiClient.post<ApiResponse>('/auth/reset-password', data);
    return response.data;
  },
  refresh: async (refreshToken: string) => {
    const response = await apiClient.post<
      ApiResponse<{ accessToken: string; refreshToken: string }>
    >('/auth/refresh', { refreshToken });

    return response.data;
  },

  // ─── Profile ───────────────────────────────────────
  updateProfile: async (data: { name?: string; email?: string }) => {
    const response = await apiClient.patch<ApiResponse<User>>('/auth/profile', data);
    return response.data;
  },

  changePassword: async (data: { currentPassword: string; newPassword: string }) => {
    const response = await apiClient.post<ApiResponse>('/auth/change-password', data);
    return response.data;
  },

  // ─── Accounts ──────────────────────────────────────
  getAccounts: async () => {
    const response = await apiClient.get<ApiResponse<{ accountNumber: string; accountProvider: string }[]>>('/auth/accounts');
    return response.data;
  },

  addAccount: async (data: { accountNumber: string; accountProvider: string }) => {
    const response = await apiClient.post<ApiResponse<{ accountNumber: string; accountProvider: string }[]>>('/auth/account', data);
    return response.data;
  },

  updateAccount: async (data: {
    accountNumber: string;
    accountProvider: string;
    newAccountNumber?: string;
    newAccountProvider?: string;
  }) => {
    const response = await apiClient.patch<ApiResponse<{ accountNumber: string; accountProvider: string }[]>>('/auth/account', data);
    return response.data;
  },

  removeAccount: async (data: { accountNumber: string; accountProvider: string }) => {
    const response = await apiClient.delete<ApiResponse<{ accountNumber: string; accountProvider: string }[]>>('/auth/account', { data });
    return response.data;
  },
};
