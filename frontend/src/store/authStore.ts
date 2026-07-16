import { create } from 'zustand';
import type { User, Branch } from '../types';
import { Storage, STORAGE_KEYS } from '../utils/storage';
import { authApi } from '../api/auth.api';
import { listBranchesApi, switchBranchApi } from '../api/branch.api';

import { TokenService } from '@/src/services/token.service';
import { clearAuthCache } from '@/src/providers/query-auth-sync';
import { onUnauthorized } from '@/src/api/auth-events';

/* =========================================================
   STATE
 ========================================================= */

interface AuthState {
  user: User | null;

  // Multi-branch state
  actorType: 'owner' | 'employee' | null;
  selectedBranch: Branch | null;
  branches: Branch[];
  // Owner dashboard scope: when true, aggregate data across all branches.
  viewAllBranches: boolean;

  isAuthenticated: boolean;
  isHydrated: boolean;

  hasSeenOnboarding: boolean;

  isLoggingOut: boolean;

  setUser: (
    user: User | null,
    tokens?: {
      accessToken?: string;
      refreshToken?: string;
    },
    extras?: {
      actorType?: 'owner' | 'employee';
      selectedBranch?: Branch;
      branches?: Branch[];
    }
  ) => Promise<void>;

  switchBranch: (branchId: string) => Promise<void>;
  loadBranches: () => Promise<void>;
  setViewAllBranches: (value: boolean) => void;

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
  actorType: null,
  selectedBranch: null,
  branches: [],
  viewAllBranches: false,
  isAuthenticated: false,
  isHydrated: false,
  hasSeenOnboarding: false,
  isLoggingOut: false,

  /* =========================================================
     SET USER (LOGIN/REGISTER)
  ========================================================= */
  setUser: async (user, tokens, extras) => {
    if (tokens?.accessToken) {
      await TokenService.saveAccessToken(tokens.accessToken);
    }

    if (tokens?.refreshToken) {
      await TokenService.saveRefreshToken(tokens.refreshToken);
    }

    set({
      user,
      isAuthenticated: !!user,
      ...(extras?.actorType && { actorType: extras.actorType }),
      ...(extras?.selectedBranch && { selectedBranch: extras.selectedBranch }),
      ...(extras?.branches && { branches: extras.branches }),
    });
  },

  /* =========================================================
     SWITCH BRANCH
     Regenerates tokens with the new branch context (owner only) —
     downstream branch-scoped reads (subscription status, etc.) key
     off the JWT's branchId claim, so a plain state set isn't enough.
  ========================================================= */
  switchBranch: async (branchId) => {
    const response = await switchBranchApi(branchId);
    const { selectedBranch, accessToken, refreshToken } = response?.data || {};

    if (accessToken) await TokenService.saveAccessToken(accessToken);
    if (refreshToken) await TokenService.saveRefreshToken(refreshToken);

    set({ selectedBranch, viewAllBranches: false });
  },

  setViewAllBranches: (value) => {
    set({ viewAllBranches: value });
  },

  /* =========================================================
     LOAD BRANCHES
  ========================================================= */
  loadBranches: async () => {
    try {
      const response = await listBranchesApi();
      if (response?.data) {
        set({ branches: response.data });
      }
    } catch (err) {
      console.error('Failed to load branches', err);
    }
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
        actorType: null,
        selectedBranch: null,
        branches: [],
        viewAllBranches: false,
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
      let branches: Branch[] = [];
      let selectedBranch: Branch | null = null;
      let actorType: 'owner' | 'employee' | null = null;

      if (accessToken) {
        try {
          const response = await authApi.getMe();
          const resData: any = response?.data;

          if (resData?.user) {
            user = resData.user;
            const ownerRoles = ['OWNER', 'SUPER_ADMIN', 'ADMIN'];
            actorType = resData.actorType || (user && ownerRoles.includes(user.role) ? 'owner' : 'employee');

            if (actorType === 'owner') {
              // Owners can access all their branches — load the full list.
              try {
                const branchRes = await listBranchesApi();
                branches = branchRes?.data || [];
                selectedBranch = branches[0] || null;
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