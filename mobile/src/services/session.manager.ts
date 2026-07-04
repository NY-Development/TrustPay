import { authService } from './auth.service';
import { TokenService } from './token.service';

class SessionManager {
  /**
   * Validate session silently
   */
  async validateSession(): Promise<boolean> {
    try {
      const token = await TokenService.getAccessToken();
      const refresh = await TokenService.getRefreshToken();

      if (!refresh) return false;

      if (!token) {
        const refreshed = await this.tryRefresh();
        return refreshed;
      }

      // optional: ping backend
      await authService.me();
      return true;
    } catch {
      return await this.tryRefresh();
    }
  }

  /**
   * Try refresh token flow
   */
  async tryRefresh(): Promise<boolean> {
    try {
      const refreshToken = await TokenService.getRefreshToken();
      if (!refreshToken) return false;

      const res = await authService.refresh(refreshToken);

      await TokenService.saveAccessToken(res.accessToken);
      await TokenService.saveRefreshToken(res.refreshToken);

      return true;
    } catch {
      await TokenService.clearTokens();
      return false;
    }
  }

  /**
   * Full logout cleanup
   */
  async clearSession() {
    await TokenService.clearTokens();
  }
}

export const sessionManager = new SessionManager();