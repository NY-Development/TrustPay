import { apiClient } from './client';
import type{ ApiResponse } from '../types';

export interface ContactRequest {
  subject: string;
  message: string;
  category: 'refund' | 'support' | 'feedback' | 'other';
}

export const contactApi = {
  submit: async (data: ContactRequest) => {
    const response = await apiClient.post<ApiResponse>('/contact', data);
    return response.data;
  },
};
