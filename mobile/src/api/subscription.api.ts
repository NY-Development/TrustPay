import { apiClient } from './client';
import { ApiResponse, Subscription, SubscriptionStatusData } from '../types';

export const subscriptionApi = {
  getStatus: async () => {
    const response = await apiClient.get<ApiResponse<SubscriptionStatusData>>('/subscriptions/status');
    return response.data;
  },
  verifyPayment: async (data: { reference: string; plan: 'monthly' | 'yearly' }) => {
    const response = await apiClient.post<ApiResponse<Subscription>>('/subscriptions/verify', data);
    return response.data;
  },
  topUpPayment: async (data: { reference: string }) => {
    const response = await apiClient.post<ApiResponse<Subscription>>('/subscriptions/top-up', data);
    return response.data;
  },
};
