import { create } from 'zustand';
import type { User } from '../types';
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
}

/* =========================================================
   STORE
 ========================================================= */

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isHydrated: false,
  hasSeenOnboarding: false,
  isLoggingOut: false,
      

  /* =========================================================
     SET USER (LOGIN/REGISTER)
  ========================================================= */
  setUser: async (user, tokens) => {
    if (tokens?.accessToken) {
      await TokenService.saveAccessToken(tokens.accessToken);
    }

    if (tokens?.refreshToken) {
      await TokenService.saveRefreshToken(tokens.refreshToken);
    }

    // User object now contains the trial data structure[cite: 11]
    set({
      user,
      isAuthenticated: !!user,
    });
  },

  /* =========================================================
     LOGOUT
  ========================================================= */
  logout: async (reason = 'manual') => {
    console.log(`[authStore] Logging out: ${reason}`);
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

      let user: User | null = null;

      if (accessToken) {
        try {
          const response = await authApi.getMe();

          // User object populated via API includes trial information[cite: 11]
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
     REFRESH USER
  ========================================================= */
  refreshUser: async () => {
    try {
      const response = await authApi.getMe();

      if (response?.data?.user) {
        set({
          user: response.data.user,
        });
      }
    } catch (error) {
      console.error('Failed to refresh user', error);
    }
  },

  /* =========================================================
     ONBOARDING
  ========================================================= */
  setHasSeenOnboarding: async (value) => {
    await Storage.setItem(STORAGE_KEYS.HAS_SEEN_ONBOARDING, value);
    set({ hasSeenOnboarding: value });
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