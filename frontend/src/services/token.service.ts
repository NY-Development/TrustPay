const ACCESS = 'accessToken';
const REFRESH = 'refreshToken';

export const TokenService = {
  getAccessToken: (): Promise<string | null> =>
    Promise.resolve(localStorage.getItem(ACCESS)),

  getRefreshToken: (): Promise<string | null> =>
    Promise.resolve(localStorage.getItem(REFRESH)),

  saveAccessToken: (token: string): Promise<void> => {
    localStorage.setItem(ACCESS, token);
    return Promise.resolve();
  },

  saveRefreshToken: (token: string): Promise<void> => {
    localStorage.setItem(REFRESH, token);
    return Promise.resolve();
  },

  clearTokens: async (): Promise<void> => {
    localStorage.removeItem(ACCESS);
    localStorage.removeItem(REFRESH);
  },
};