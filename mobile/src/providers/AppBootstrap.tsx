import React, { createContext, useContext, useEffect, useState } from 'react';
import * as Updates from 'expo-updates';

import { useAuthStore } from '@/src/store/authStore';
import { TokenService } from '@/src/services/token.service';
import { BiometricService } from '@/src/utils/biometrics';
import { SplashController } from '@/src/utils/splash.controller';

/* =========================================================
   CONTEXT
========================================================= */

type BootstrapState = {
  isReady: boolean;
  isBootstrapping: boolean;
};

const AppBootstrapContext = createContext<BootstrapState>({
  isReady: false,
  isBootstrapping: true,
});

export const useAppBootstrap = () => useContext(AppBootstrapContext);

/* =========================================================
   PROVIDER
========================================================= */

export function AppBootstrapProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isReady, setIsReady] = useState(false);
  const [isBootstrapping, setIsBootstrapping] = useState(true);

  const hydrate = useAuthStore((s) => s.hydrate);
  const biometricsEnabled = useAuthStore((s) => s.biometricsEnabled);
  const logout = useAuthStore((s) => s.logout);
  const setUser = useAuthStore((s) => s.setUser);

  const runBootstrap = async () => {
    setIsBootstrapping(true);

    try {
      /* =====================================================
         0. SPLASH CONTROL (SINGLE SOURCE OF TRUTH)
      ===================================================== */
      await SplashController.lock();

      /* =====================================================
         1. OTA UPDATE (EARLY EXIT)
      ===================================================== */
      const update = await Updates.checkForUpdateAsync();

      if (update.isAvailable) {
        await Updates.fetchUpdateAsync();
        await Updates.reloadAsync();
        return;
      }

      /* =====================================================
         2. HYDRATE LOCAL STATE
      ===================================================== */
      await hydrate();

      const accessToken = await TokenService.getAccessToken();
      const refreshToken = await TokenService.getRefreshToken();

      const hasSession = !!accessToken && !!refreshToken;

      if (!hasSession) {
        await logout('expired');
        finalize();
        return;
      }

      /* =====================================================
         3. BIOMETRIC SECURITY GATE
      ===================================================== */
      if (biometricsEnabled) {
        const ok = await BiometricService.authenticate(
          'Unlock TrustPay'
        );

        if (!ok) {
          await logout('expired');
          finalize();
          return;
        }
      }

      /* =====================================================
         4. FINALIZE AUTH STATE SAFELY
      ===================================================== */
      setIsReady(true);
      setIsBootstrapping(false);

      await SplashController.hide();
    } catch (error) {
      console.error('[Bootstrap] Failed:', error);

      await logout('expired');
      finalize();
    }
  };

  /* =========================================================
     FINALIZATION HELPER
  ========================================================= */
  const finalize = async () => {
    setIsReady(true);
    setIsBootstrapping(false);
    await SplashController.hide();
  };

  useEffect(() => {
    runBootstrap();
  }, []);

  return (
    <AppBootstrapContext.Provider
      value={{ isReady, isBootstrapping }}
    >
      {children}
    </AppBootstrapContext.Provider>
  );
}