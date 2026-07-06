import {apiClient} from './client';

/**
 * Get all branches for a business.
 * If user is SUPER_ADMIN, they can optionally pass a businessId query parameter.
 * Maps to: GET /api/v1/branches
 */
export const fetchBranchesApi = async (businessId?: string) => {
  const config = businessId ? { params: { businessId } } : {};
  const response = await apiClient.get('/api/v1/branches', config);
  return response.data; // Yields { success: true, data: IBranch[] }
};

/**
 * Create a new branch (Accessible by SUPER_ADMIN, ADMIN, or MANAGER)
 * Maps to: POST /api/v1/branches[cite: 12]
 */
export const createBranchApi = async (branchData: any) => {
  const response = await apiClient.post('/api/v1/branches', branchData);
  return response.data; // Yields { success: true, data: IBranch }
};

/**
 * Update a specific branch layout configuration details
 * Maps to: PATCH /api/v1/branches/:id[cite: 12]
 */
export const updateBranchApi = async (branchId: string, updateData: any) => {
  const response = await apiClient.patch(`/api/v1/branches/${branchId}`, updateData);
  return response.data; // Yields { success: true, data: IBranch }
};