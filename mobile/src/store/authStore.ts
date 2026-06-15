import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { User } from '../types';
import { Storage, STORAGE_KEYS } from '../utils/storage';
import { BiometricService } from '../utils/biometrics';
import { authApi } from '../api/auth.api';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isHydrated: boolean;
  hasSeenOnboarding: boolean;
  biometricsEnabled: boolean;
  setUser: (user: User | null, tokens?: { accessToken?: string, refreshToken?: string }) => Promise<void>;
  setAuthenticated: (isAuthenticated: boolean) => void;
  setHasSeenOnboarding: (value: boolean) => Promise<void>;
  setBiometricsEnabled: (value: boolean) => Promise<void>;
  updatePushToken: (token: string) => Promise<void>;
  logout: () => Promise<void>;
  hydrate: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isHydrated: false,
  hasSeenOnboarding: false,
  biometricsEnabled: false,

  setUser: async (user, tokens) => {
    if (tokens?.accessToken) await SecureStore.setItemAsync('accessToken', tokens.accessToken);
    if (tokens?.refreshToken) await SecureStore.setItemAsync('refreshToken', tokens.refreshToken);
    set({ user, isAuthenticated: !!user });
  },

  setAuthenticated: (isAuthenticated) => set({ isAuthenticated }),

  setHasSeenOnboarding: async (value) => {
    await Storage.setItem(STORAGE_KEYS.HAS_SEEN_ONBOARDING, value);
    set({ hasSeenOnboarding: value });
  },

  setBiometricsEnabled: async (value) => {
    await Storage.setItem(STORAGE_KEYS.BIOMETRICS_ENABLED, value);
    set({ biometricsEnabled: value });
  },

  updatePushToken: async (token) => {
    try {
      const { user } = get();
      if (user) {
        await authApi.updatePushToken(token);
        set({ user: { ...user, pushToken: token } });
      }
    } catch (error) {
      console.error('Failed to update push token', error);
    }
  },

  logout: async () => {
    await SecureStore.deleteItemAsync('accessToken');
    await SecureStore.deleteItemAsync('refreshToken');
    set({ user: null, isAuthenticated: false });
  },

  hydrate: async () => {
    try {
      const accessToken = await SecureStore.getItemAsync('accessToken');
      const onboarded = await Storage.getItem<boolean>(STORAGE_KEYS.HAS_SEEN_ONBOARDING);
      const bioEnabled = await Storage.getItem<boolean>(STORAGE_KEYS.BIOMETRICS_ENABLED);
      
      let authenticated = !!accessToken;

      // If tokens exist and biometrics are enabled, require biometric unlock
      if (authenticated && bioEnabled) {
        try {
          const success = await BiometricService.authenticate('Unlock TrustPay');
          if (!success) {
            authenticated = false;
            // Optionally clear tokens or just stay logged out? 
            // Better to stay logged out (unauthenticated) but keep tokens for another try?
            // User requested: "checking the biometric... and then using it that way getting and saving the access and refreshtoken"
          }
        } catch (authError) {
          console.error('Biometric authentication failed', authError);
          authenticated = false;
        }
      }
      
      set({ 
        isAuthenticated: authenticated, 
        hasSeenOnboarding: !!onboarded,
        biometricsEnabled: !!bioEnabled,
        isHydrated: true 
      });
    } catch (error) {
      console.error('Hydration failed', error);
      set({ isHydrated: true });
    }
  },
}));
