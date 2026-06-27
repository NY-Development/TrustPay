import { apiClient } from './client';
import { ApiResponse, Verification } from '../types';

export const verificationApi = {
  verifyManual: async (data: any) => {
    const response = await apiClient.post<ApiResponse<Verification>>('/verifications/verify', data);
    return response.data;
  },
  verifyUniversal: async (data: any) => {
    const response = await apiClient.post<ApiResponse<Verification>>('/verifications/verify-universal', data);
    return response.data;
  },
  verifyOcr: async (data: any) => {
    const response = await apiClient.post<ApiResponse<Verification>>('/verifications/verify-ocr', data);
    return response.data;
  },
  getHistory: async () => {
    const response = await apiClient.get<ApiResponse<Verification[]>>('/verifications');
    return response.data;
  },
  getById: async (id: string) => {
    const response = await apiClient.get<ApiResponse<Verification>>(`/verifications/${id}`);
    return response.data;
  },
};
