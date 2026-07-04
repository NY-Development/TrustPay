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

  const { isAuthenticated, isHydrated } = useAuthStore();

  /**
   * ONLY WAIT FOR HYDRATION
   * No validation, no session logic here
   */
  useEffect(() => {
    if (isHydrated) {
      setIsReady(true);
    }
  }, [isHydrated]);

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