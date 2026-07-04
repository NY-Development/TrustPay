import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuthStore } from '@/src/store/authStore';
import { useRouter, useSegments } from 'expo-router';

type AuthContextType = {
  isReady: boolean;
  isAuthenticated: boolean;
};

const AuthContext = createContext<AuthContextType>({
  isReady: false,
  isAuthenticated: false,
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [isReady, setIsReady] = useState(false);
  const router = useRouter();
  const segments = useSegments();

  const { isAuthenticated, isHydrated, hasSeenOnboarding } = useAuthStore();

  /**
   * ONLY WAIT FOR HYDRATION
   */
  useEffect(() => {
    if (isHydrated) {
      setIsReady(true);
    }
  }, [isHydrated]);

  /**
   * CENTRALIZED SECURITY & GUARD ROUTER
   */
  useEffect(() => {
    if (!isReady || !isHydrated) return;

    const segs = segments as any as string[];
    const inAuthGroup = segs[0] === '(auth)';
    const inTabsGroup = segs[0] === '(tabs)';
    const isOnboarding = segs[0] === 'onboarding';

    if (!hasSeenOnboarding) {
      if (!isOnboarding) {
        // Force onboarding path
        router.replace('/onboarding');
      }
    } else if (!isAuthenticated) {
      // Redirect to login if not in auth group
      if (!inAuthGroup) {
        router.replace('/(auth)/login');
      }
    } else {
      // Redirect authenticated users away from onboarding or auth pages
      if (inAuthGroup || isOnboarding || segs.length === 0 || segs[0] === 'index') {
        router.replace('/(tabs)');
      }
    }
  }, [isReady, isHydrated, isAuthenticated, hasSeenOnboarding, segments]);

  /**
   * HARD BLOCK UNTIL STORE IS READY
   */
  if (!isReady || !isHydrated) {
    return null;
  }

  return (
    <AuthContext.Provider value={{ isReady, isAuthenticated }}>
      {children}
    </AuthContext.Provider>
  );
};