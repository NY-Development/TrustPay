import { apiClient } from './client';

export const listMessagesApi = async () => {
  const response = await apiClient.get('/communications');
  return response.data;
};

export const getMessageApi = async (id: string) => {
  const response = await apiClient.get(`/communications/${id}`);
  return response.data;
};

export const sendMessageApi = async (messageData: any) => {
  const response = await apiClient.post('/communications', messageData);
  return response.data;
};

export const markMessageAsReadApi = async (id: string) => {
  const response = await apiClient.put(`/communications/${id}/read`);
  return response.data;
};

export const getUnreadMessagesCountApi = async () => {
  const response = await apiClient.get('/communications/unread-count');
  return response.data;
};
