import { apiClient } from './client';

export const listMessagesApi = async () => {
  const response = await apiClient.get('/api/v1/communications');
  return response.data;
};

export const getMessageApi = async (id: string) => {
  const response = await apiClient.get(`/api/v1/communications/${id}`);
  return response.data;
};

export const sendMessageApi = async (messageData: any) => {
  const response = await apiClient.post('/api/v1/communications', messageData);
  return response.data;
};

export const markMessageAsReadApi = async (id: string) => {
  const response = await apiClient.put(`/api/v1/communications/${id}/read`);
  return response.data;
};

export const getUnreadMessagesCountApi = async () => {
  const response = await apiClient.get('/api/v1/communications/unread-count');
  return response.data;
};
