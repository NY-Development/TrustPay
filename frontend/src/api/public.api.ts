import { apiClient } from "./client"
import type { ApiResponse, PublicStats } from "../types"

export const publicApi = {
  getStats: async () => {
    const response =
      await apiClient.get<ApiResponse<PublicStats>>("/public/stats")
    console.log("res : ", response.data)
    return response.data
  },
}
