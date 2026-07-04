import axios from 'axios';
import { TokenService } from '../services/token.service';

const API_URL = process.env.EXPO_PUBLIC_API_URL;

export async function validateSession(): Promise<boolean> {
  try {
    const accessToken = await TokenService.getAccessToken();
    const refreshToken = await TokenService.getRefreshToken();

    if (!refreshToken) return false;

    // If no access token → try refresh immediately
    if (!accessToken) {
      const refreshed = await refreshAccessToken(refreshToken);
      return refreshed;
    }

    // Try validating session with backend
    const res = await axios.get(`${API_URL}/auth/me`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    return !!res.data?.data?.user;
  } catch (error: any) {
    // If unauthorized → try refresh fallback
    if (error?.response?.status === 401) {
      const refreshToken = await TokenService.getRefreshToken();
      if (!refreshToken) return false;

      return await refreshAccessToken(refreshToken);
    }

    return false;
  }
}

/* ================================
   SILENT REFRESH
================================ */

export async function refreshAccessToken(refreshToken: string) {
  try {
    const res = await axios.post(
      `${API_URL}/auth/refresh`,
      { refreshToken },
      { withCredentials: true }
    );

    const data = res.data?.data || res.data;

    if (data?.accessToken) {
      await TokenService.saveAccessToken(data.accessToken);
    }

    if (data?.refreshToken) {
      await TokenService.saveRefreshToken(data.refreshToken);
    }

    return true;
  } catch (error) {
    await TokenService.clearTokens();
    return false;
  }
}