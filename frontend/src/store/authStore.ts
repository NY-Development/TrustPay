import { create } from 'zustand';
import type { User, Branch } from '../types';
import { Storage, STORAGE_KEYS } from '../utils/storage';
import { authApi } from '../api/auth.api';
import { listBranchesApi, switchBranchApi } from '../api/branch.api';

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
     Tokens are no longer handled here — the backend sets them as httpOnly
     cookies on the login/register response itself (Set-Cookie), so by the
     time this runs the browser has already stored them. The `tokens` param
     is kept in the signature so existing call sites (useAuth.ts) don't need
     to change, but its value is intentionally unused.
  ========================================================= */
  setUser: async (user, _tokens, extras) => {
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
    const { selectedBranch } = response?.data || {};

    // New tokens arrive as Set-Cookie on this response — nothing to persist
    // client-side.
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
     Tokens live in httpOnly cookies now, which client JS cannot clear
     itself — only the server can, via Set-Cookie with an expired date. So
     this must call the backend; skipping that call (as this used to do)
     would leave the session cookies live and the refresh token valid
     server-side even though the UI shows the user as logged out.
  ========================================================= */
  logout: async (reason = 'manual') => {
    console.log(`[authStore] Logging out: ${reason}`);
    const state = get();

    if (state.isLoggingOut) return;

    set({ isLoggingOut: true });

    try {
      try {
        await authApi.logout();
      } catch {
        // Best-effort — still clear local state even if the request fails
        // (e.g. already-expired session).
      }
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
     HYDRATE (COOKIE-BASED)
     There's no client-readable token to gate this on anymore — the httpOnly
     cookie (if any) is sent automatically, so just ask the backend who we
     are. A guest simply gets a 401 here, which is the same cost as the old
     "no token" branch.
  ========================================================= */
  hydrate: async () => {
    try {
      const onboarded = await Storage.getItem<boolean>(
        STORAGE_KEYS.HAS_SEEN_ONBOARDING
      );

      let user: User | null = null;
      let branches: Branch[] = [];
      let selectedBranch: Branch | null = null;
      let actorType: 'owner' | 'employee' | null = null;

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
        // Not authenticated (no/expired session) — fall through with nulls.
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