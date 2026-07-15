import { apiClient } from './client';
import { ApiResponse, Message } from '../types';

export const communicationApi = {
  send: async (data: {
    recipientType: 'INDIVIDUAL' | 'BRANCH' | 'COMPANY';
    messageType: 'ANNOUNCEMENT' | 'TASK' | 'REMINDER' | 'ALERT';
    title: string;
    body: string;
    branchId?: string;
    recipientIds?: string[];
  }) => {
    const response = await apiClient.post<ApiResponse<Message>>('/communications', data);
    return response.data;
  },

  list: async (page = 1, limit = 20) => {
    const response = await apiClient.get<ApiResponse<Message[]>>('/communications', { params: { page, limit } });
    return response.data;
  },

  getById: async (id: string) => {
    const response = await apiClient.get<ApiResponse<Message>>(`/communications/${id}`);
    return response.data;
  },

  markAsRead: async (id: string) => {
    const response = await apiClient.put<ApiResponse>(`/communications/${id}/read`);
    return response.data;
  },

  getUnreadCount: async () => {
    const response = await apiClient.get<ApiResponse<{ count: number }>>('/communications/unread-count');
    return response.data;
  },
};
