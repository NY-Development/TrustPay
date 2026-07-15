import { apiClient } from './client';
import { ApiResponse } from '../types';
import { VerificationRecord } from "../types/verification";

// Define a structured interface for our query parameters
export interface GetHistoryParams {
  page?: number;
  limit?: number;
  provider?: string;
}

// Branch-scoped history params (owner: all owned branches, or one via branchId)
export interface GetBranchHistoryParams extends GetHistoryParams {
  branchId?: string;
}

// Custom return interface matching our new backend pagination response
export interface PaginatedVerificationResponse {
  success: boolean;
  data: VerificationRecord[];
  pagination: {
    totalItems: number;
    currentPage: number;
    totalPages: number;
    hasMore: boolean;
  };
}

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
    console.log('Response of verifications : ', response.data);
    return response.data;
  },
  // Updated with query parameters to interact cleanly with getMyVerifications
  getHistory: async ({ page = 1, limit = 15, provider }: GetHistoryParams = {}) => {
    const response = await apiClient.get<PaginatedVerificationResponse>('/verifications/my-history', {
      params: {
        page,
        limit,
        // Only pass the parameter to the backend if a specific provider is chosen
        ...(provider && provider !== 'all' ? { provider } : {})
      }
    });
    return response.data;
  },
  // Branch-scoped history. Owner: pass branchId for a single branch, or omit for
  // all owned branches. Employee: backend forces their assigned branch.
  getBranchHistory: async ({ page = 1, limit = 15, provider, branchId }: GetBranchHistoryParams = {}) => {
    const response = await apiClient.get<PaginatedVerificationResponse>('/verifications/business-history', {
      params: {
        page,
        limit,
        ...(provider && provider !== 'all' ? { provider } : {}),
        ...(branchId ? { branchId } : {}),
      }
    });
    return response.data;
  },
  getById: async (id: string) => {
    const response = await apiClient.get<ApiResponse<VerificationRecord>>(`/verifications/${id}`);
    return response.data;
  },
};