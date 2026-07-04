import { apiClient } from './client';
import { ApiResponse } from '../types';
import {
    VerificationResultPayload, 
    VerificationRecord
} from "../types/verification";

export const verificationApi = {
  verifyManual: async (data: any) => {
    const response = await apiClient.post<ApiResponse<VerificationResultPayload>>('/verifications/verify', data);
    return response.data;
  },
  verifyUniversal: async (data: any) => {
    const response = await apiClient.post<ApiResponse<VerificationResultPayload>>('/verifications/verify-universal', data);
    return response.data;
  },
  verifyOcr: async (data: any) => {
    const response = await apiClient.post<ApiResponse<VerificationResultPayload>>('/verifications/verify-ocr', data);
    console.log('Response of verifications : ',response.data);
    return response.data;
  },
  getHistory: async () => {
    const response = await apiClient.get<ApiResponse<VerificationRecord[]>>('/verifications/my-history');
    return response.data;
  },
  getById: async (id: string) => {
    const response = await apiClient.get<ApiResponse<VerificationResultPayload>>(`/verifications/${id}`);
    return response.data;
  },
};
