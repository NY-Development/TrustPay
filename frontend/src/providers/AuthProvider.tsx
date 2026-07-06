import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuthStore } from '@/src/store/authStore';

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
  const { isAuthenticated, isHydrated, hydrate } = useAuthStore();

  // Trigger store hydration on mount (loading token and fetching current user)
  useEffect(() => {
    hydrate();
  }, [hydrate]);

  // Set isReady when store has finished hydration check
  useEffect(() => {
    if (isHydrated) {
      setIsReady(true);
    }
  }, [isHydrated]);

  return (
    <AuthContext.Provider value={{ isReady, isAuthenticated }}>
      {children}
    </AuthContext.Provider>
  );
};