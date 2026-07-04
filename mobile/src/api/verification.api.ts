import { apiClient } from './client';
import { ApiResponse } from '../types';
import {
    VerificationRecord
} from "../types/verification";

export const verificationApi = {
  verifyManual: async (data: any) => {
    const response = await apiClient.post<ApiResponse<VerificationRecord>>('/verifications/verify', data);
    return response.data;
  },
  verifyUniversal: async (data: any) => {
    const response = await apiClient.post<ApiResponse<VerificationRecord>>('/verifications/verify', data);
    return response.data;
  },
  verifyOcr: async (data: any) => {
    const response = await apiClient.post<ApiResponse<VerificationRecord & { extracted?: any }>>('/verifications/verify-ocr', data);
    console.log('Response of verifications : ',response.data);
    return response.data;
  },
  getHistory: async () => {
    const response = await apiClient.get<ApiResponse<VerificationRecord[]>>('/verifications/my-history');
    return response.data;
  },
  getById: async (id: string) => {
    const response = await apiClient.get<ApiResponse<VerificationRecord>>(`/verifications/${id}`);
    return response.data;
  },
};
