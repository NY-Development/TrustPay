import { authApi } from '@/src/api/auth.api';
import { TokenService } from './token.service';

class SessionService {
  /**
   * Lightweight session validation (no side effects)
   * Used ONLY when explicitly needed
   */
  async validate(): Promise<boolean> {
    try {
      const refresh = await TokenService.getRefreshToken();
      if (!refresh) return false;

      await authApi.getMe();
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Refresh session explicitly
   */
  async refreshSession(): Promise<boolean> {
    try {
      const refreshToken = await TokenService.getRefreshToken();
      if (!refreshToken) return false;

      const res = await authApi.refresh(refreshToken);

      const newAccessToken = res?.data?.accessToken;
      const newRefreshToken = res?.data?.refreshToken;

      if (!newAccessToken || !newRefreshToken) {
        return false;
      }

      await TokenService.saveAccessToken(newAccessToken);
      await TokenService.saveRefreshToken(newRefreshToken);

      return true;
    } catch {
      await TokenService.clearTokens();
      return false;
    }
  }

  async clear() {
    await TokenService.clearTokens();
  }
}

export const sessionService = new SessionService();