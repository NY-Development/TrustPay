import * as SecureStore from 'expo-secure-store';

const ACCESS = 'accessToken';
const REFRESH = 'refreshToken';

export const TokenService = {
  getAccessToken: () => SecureStore.getItemAsync(ACCESS),
  getRefreshToken: () => SecureStore.getItemAsync(REFRESH),

  saveAccessToken: (token: string) =>
    SecureStore.setItemAsync(ACCESS, token),

  saveRefreshToken: (token: string) =>
    SecureStore.setItemAsync(REFRESH, token),

  clearTokens: async () => {
    await SecureStore.deleteItemAsync(ACCESS);
    await SecureStore.deleteItemAsync(REFRESH);
  },
};