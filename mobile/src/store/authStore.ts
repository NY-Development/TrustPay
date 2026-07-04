import { create } from 'zustand';
import { User } from '../types';
import { Storage, STORAGE_KEYS } from '../utils/storage';
import { BiometricService } from '../utils/biometrics';
import { authApi } from '../api/auth.api';

import { TokenService } from '@/src/services/token.service';
import { clearAuthCache } from '@/src/providers/query-auth-sync';
import { onUnauthorized } from '@/src/api/auth-events';

/* =========================================================
   STATE
========================================================= */

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isHydrated: boolean;
  hasSeenOnboarding: boolean;
  biometricsEnabled: boolean;
  isLoggingOut: boolean;

  setUser: (
    user: User | null,
    tokens?: {
      accessToken?: string;
      refreshToken?: string;
    }
  ) => Promise<void>;

  logout: (reason?: 'manual' | 'expired') => Promise<void>;

  hydrate: () => Promise<void>;

  setHasSeenOnboarding: (value: boolean) => Promise<void>;

  setBiometricsEnabled: (value: boolean) => Promise<void>;

  updatePushToken: (token: string) => Promise<void>;
}

/* =========================================================
   STORE
========================================================= */

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isHydrated: false,
  hasSeenOnboarding: false,
  biometricsEnabled: false,
  isLoggingOut: false,

  /* =========================================================
     SET USER (LOGIN)
  ========================================================= */
  setUser: async (user, tokens) => {
    if (tokens?.accessToken) {
      await TokenService.saveAccessToken(tokens.accessToken);
    }

    if (tokens?.refreshToken) {
      await TokenService.saveRefreshToken(tokens.refreshToken);
    }

    set({
      user,
      isAuthenticated: true,
    });
  },

  /* =========================================================
     LOGOUT
  ========================================================= */
  logout: async (reason = 'manual') => {
    const state = get();

    if (state.isLoggingOut) return;

    set({ isLoggingOut: true });

    try {
      await TokenService.clearTokens();
      clearAuthCache();

      set({
        user: null,
        isAuthenticated: false,
      });
    } finally {
      set({ isLoggingOut: false });
    }
  },

  /* =========================================================
     HYDRATE (TOKEN-BASED ONLY)
  ========================================================= */
  hydrate: async () => {
    try {
      const accessToken = await TokenService.getAccessToken();

      const onboarded = await Storage.getItem<boolean>(
        STORAGE_KEYS.HAS_SEEN_ONBOARDING
      );

      const bioEnabled = await Storage.getItem<boolean>(
        STORAGE_KEYS.BIOMETRICS_ENABLED
      );

      set({
        isAuthenticated: !!accessToken,
        hasSeenOnboarding: !!onboarded,
        biometricsEnabled: !!bioEnabled,
        isHydrated: true,
      });
    } catch (err) {
      console.error('Hydration error:', err);

      set({
        isAuthenticated: false,
        isHydrated: true,
      });
    }
  },

  /* =========================================================
     ONBOARDING
  ========================================================= */
  setHasSeenOnboarding: async (value) => {
    await Storage.setItem(STORAGE_KEYS.HAS_SEEN_ONBOARDING, value);
    set({ hasSeenOnboarding: value });
  },

  /* =========================================================
     BIOMETRICS
  ========================================================= */
  setBiometricsEnabled: async (value) => {
    await Storage.setItem(STORAGE_KEYS.BIOMETRICS_ENABLED, value);
    set({ biometricsEnabled: value });
  },

  /* =========================================================
     PUSH TOKEN
  ========================================================= */
  updatePushToken: async (token) => {
    try {
      const { user } = get();

      if (user) {
        await authApi.updatePushToken(token);

        set({
          user: {
            ...user,
            pushToken: token,
          },
        });
      }
    } catch (error) {
      console.error('Push token update failed', error);
    }
  },
}));

/* =========================================================
   GLOBAL 401 HANDLER
========================================================= */

onUnauthorized(() => {
  const store = useAuthStore.getState();

  if (store.isLoggingOut) return;

  store.logout('expired');
});