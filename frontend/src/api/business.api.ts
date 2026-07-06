import {apiClient} from './client';

/**
 * Fetch a single business profile by ID
 * Maps to: GET /api/v1/businesses/:id[cite: 13]
 */
export const fetchBusinessApi = async (businessId: string) => {
  const response = await apiClient.get(`/api/v1/businesses/${businessId}`);
  return response.data; // Yields { success: true, data: IBusiness }
};

/**
 * Update a business profile (Accessible by SUPER_ADMIN or ADMIN)
 * Maps to: PATCH /api/v1/businesses/:id[cite: 13]
 */
export const updateBusinessApi = async (businessId: string, updateData: any) => {
  const response = await apiClient.patch(`/api/v1/businesses/${businessId}`, updateData);
  return response.data; // Yields { success: true, data: IBusiness }
};

/**
 * Fetch all businesses (Optional utility matching your router for SUPER_ADMIN view)
 * Maps to: GET /api/v1/businesses[cite: 13]
 */
export const fetchAllBusinessesApi = async () => {
  const response = await apiClient.get('/api/v1/businesses');
  return response.data; // Yields { success: true, data: IBusiness[] }
};