import { create } from 'zustand';
import { User, Branch } from '../types';
import { Storage, STORAGE_KEYS } from '../utils/storage';
import { authApi } from '../api/auth.api';
import { branchApi } from '../api/branch.api';

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

  // Multi-branch fields
  actorType: 'owner' | 'employee' | null;
  branches: Branch[];
  selectedBranch: Branch | null;

  setUser: (
    user: User | null,
    tokens?: {
      accessToken?: string;
      refreshToken?: string;
    },
    meta?: {
      actorType?: 'owner' | 'employee';
      branches?: Branch[];
      selectedBranch?: Branch;
    }
  ) => Promise<void>;

  logout: (reason?: 'manual' | 'expired') => Promise<void>;
  hydrate: () => Promise<void>;
  refreshUser: () => Promise<void>;
  setHasSeenOnboarding: (value: boolean) => Promise<void>;
  setBiometricsEnabled: (value: boolean) => Promise<void>;
  updatePushToken: (token: string) => Promise<void>;

  // Branch switching
  switchBranch: (branchId: string) => Promise<void>;
  loadBranches: () => Promise<void>;
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

  actorType: null,
  branches: [],
  selectedBranch: null,

  /* =========================================================
     SET USER (LOGIN)
  ========================================================= */
  setUser: async (user, tokens, meta) => {
    if (tokens?.accessToken) {
      await TokenService.saveAccessToken(tokens.accessToken);
    }
    if (tokens?.refreshToken) {
      await TokenService.saveRefreshToken(tokens.refreshToken);
    }
    set({
      user,
      isAuthenticated: !!user,
      actorType: meta?.actorType || user?.actorType || null,
      branches: meta?.branches || [],
      selectedBranch: meta?.selectedBranch || null,
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
        actorType: null,
        branches: [],
        selectedBranch: null,
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
      let branches: Branch[] = [];
      let selectedBranch: Branch | null = null;
      let actorType: 'owner' | 'employee' | null = null;

      if (accessToken) {
        try {
          const response = await authApi.getMe();
          const resData: any = response?.data;

          if (resData?.user) {
            user = resData.user;
            actorType = resData.actorType || (user?.role === 'OWNER' ? 'owner' : 'employee');

            if (actorType === 'owner') {
              // Owners can access all their branches — load the full list.
              try {
                const branchRes = await branchApi.list();
                branches = branchRes.data || [];
                const savedBranchId = await Storage.getItem<string>('selectedBranchId');
                selectedBranch = branches.find(b => b._id === savedBranchId) || branches[0] || null;
              } catch {
                // Branch loading failure is non-fatal
              }
            } else {
              // Employees are scoped to their single assigned branch.
              selectedBranch = resData.branch || null;
              branches = resData.branch ? [resData.branch] : [];
            }
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
        actorType,
        branches,
        selectedBranch,
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

  /* =========================================================
     BRANCH SWITCHING
  ========================================================= */
  switchBranch: async (branchId: string) => {
    try {
      const response = await branchApi.switchContext(branchId);
      if (response.data) {
        const { accessToken, refreshToken, selectedBranch } = response.data;
        if (accessToken) await TokenService.saveAccessToken(accessToken);
        if (refreshToken) await TokenService.saveRefreshToken(refreshToken);
        await Storage.setItem('selectedBranchId', branchId);
        set({ selectedBranch });
      }
    } catch (error) {
      console.error('Branch switch failed:', error);
      throw error;
    }
  },

  loadBranches: async () => {
    try {
      const res = await branchApi.list();
      const branches = res.data || [];
      const { selectedBranch } = get();
      const stillValid = branches.find(b => b._id === selectedBranch?._id);
      set({
        branches,
        selectedBranch: stillValid || branches[0] || null,
      });
    } catch (error) {
      console.error('Failed to load branches', error);
    }
  },
}));

onUnauthorized(() => {
  const store = useAuthStore.getState();
  if (store.isLoggingOut) return;
  store.logout('expired');
});