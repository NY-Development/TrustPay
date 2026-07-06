import { create } from 'zustand';
import { User } from '../types';
import { Storage, STORAGE_KEYS } from '../utils/storage';
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
  refreshUser: () => Promise<void>;
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
      isAuthenticated: !!user,
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
      const onboarded = await Storage.getItem<boolean>(STORAGE_KEYS.HAS_SEEN_ONBOARDING);
      const bioEnabled = await Storage.getItem<boolean>(STORAGE_KEYS.BIOMETRICS_ENABLED);
      let user: User | null = null;

      if (accessToken) {
        try {
          const response = await authApi.getMe();
          if (response?.data?.user) {
            user = response.data.user;
          }
        } catch {
          await TokenService.clearTokens();
        }
      }
      set({
        user,
        isAuthenticated: !!user,
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

  refreshUser: async () => {
    try {
      const response = await authApi.getMe();
      if (response?.data?.user) {
        set({ user: response.data.user });
      }
    } catch (error) {
      console.error('Failed to refresh user', error);
    }
  },

  setHasSeenOnboarding: async (value) => {
    await Storage.setItem(STORAGE_KEYS.HAS_SEEN_ONBOARDING, value);
    set({ hasSeenOnboarding: value });
  },

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
            // Preserve nested trial structure
            trial: user.trial,
            daysLeft: user.daysLeft,
            trialEndDate: user.trialEndDate,
            trialStartDate: user.trialStartDate,
            hasUsedTrial: user.hasUsedTrial,
          },
        });
      }
    } catch (error) {
      console.error('Push token update failed', error);
    }
  },
}));

onUnauthorized(() => {
  const store = useAuthStore.getState();
  if (store.isLoggingOut) return;
  store.logout('expired');
});