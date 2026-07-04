import { apiClient } from '@/src/api/client';

export interface LoginDTO {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: any;
  accessToken: string;
  refreshToken: string;
}

class AuthService {
  /**
   * Login user
   */
  async login(payload: LoginDTO): Promise<AuthResponse> {
    const res = await apiClient.post('/auth/login', payload);
    return res.data.data;
  }

  /**
   * Register user
   */
  async register(payload: any): Promise<AuthResponse> {
    const res = await apiClient.post('/auth/register', payload);
    return res.data.data;
  }

  /**
   * Refresh session
   */
  async refresh(refreshToken: string): Promise<AuthResponse> {
    const res = await apiClient.post('/auth/refresh', {
      refreshToken,
    });

    return res.data;
  }

  /**
   * Logout
   */
  async logout(): Promise<void> {
    await apiClient.post('/auth/logout');
  }

  /**
   * Get current user
   */
  async me() {
    const res = await apiClient.get('/auth/me');
    return res.data.data.user;
  }
}

export const authService = new AuthService();