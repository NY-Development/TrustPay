import { apiClient } from './client';
import { ApiResponse, Subscription } from '../types';

export const subscriptionApi = {
  getStatus: async () => {
    const response = await apiClient.get<ApiResponse<{ active: boolean; subscription: Subscription | null }>>('/subscriptions/status');
    return response.data;
  },
  verifyPayment: async (data: { reference: string; plan: 'monthly' | 'yearly' }) => {
    const response = await apiClient.post<ApiResponse<Subscription>>('/subscriptions/verify', data);
    return response.data;
  },
};
