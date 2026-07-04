import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import * as Updates from 'expo-updates';

import { useAuthStore } from '@/src/store/authStore';
import { TokenService } from '@/src/services/token.service';
import { BiometricService } from '@/src/utils/biometrics';
import { SplashController } from '@/src/utils/splash.controller';

/* =========================================================
   CONFIG
========================================================= */

const BOOTSTRAP_TIMEOUT = 10000; // 10s hard fallback

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

  const hydratedRef = useRef(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const hydrate = useAuthStore((s) => s.hydrate);
  const biometricsEnabled = useAuthStore((s) => s.biometricsEnabled);
  const logout = useAuthStore((s) => s.logout);

  /**
   * FINALIZATION GUARANTEE
   */
  const finalize = async () => {
    if (hydratedRef.current) return;
    hydratedRef.current = true;

    setIsReady(true);
    setIsBootstrapping(false);

    await SplashController.hide();

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  };

  /**
   * BOOTSTRAP FLOW
   */
  const runBootstrap = async () => {
    setIsBootstrapping(true);

    try {
      /* =====================================================
         0. SPLASH LOCK
      ===================================================== */
      await SplashController.lock();

      /* =====================================================
         1. HARD TIMEOUT SAFETY NET
      ===================================================== */
      timeoutRef.current = setTimeout(() => {
        console.warn('[Bootstrap] Timeout reached → forcing finalize');
        SplashController.forceHide();
        finalize();
      }, BOOTSTRAP_TIMEOUT);

      /* =====================================================
         2. OTA UPDATE CHECK (SAFE)
      ===================================================== */
      try {
        const update = await Updates.checkForUpdateAsync();

        if (update.isAvailable) {
          await Updates.fetchUpdateAsync();
          await Updates.reloadAsync();
          return; // app reload resets bootstrap
        }
      } catch (e) {
        console.log('[Bootstrap] OTA check failed (ignored):', e);
      }

      /* =====================================================
         3. HYDRATE AUTH STATE
      ===================================================== */
      await hydrate();

      const accessToken = await TokenService.getAccessToken();
      const refreshToken = await TokenService.getRefreshToken();

      const hasSession = !!accessToken && !!refreshToken;

      if (!hasSession) {
        await logout('expired');
        await finalize();
        return;
      }

      /* =====================================================
         4. BIOMETRIC GATE (SAFE FAIL-OPEN CONTROLLED)
      ===================================================== */
      if (biometricsEnabled) {
        try {
          const ok = await BiometricService.authenticate(
            'Unlock App'
          );

          if (!ok) {
            await logout('expired');
            await finalize();
            return;
          }
        } catch (e) {
          console.log('[Bootstrap] Biometrics failed:', e);
          // fail-safe: do NOT block app forever
        }
      }

      /* =====================================================
         5. FINALIZE SUCCESS
      ===================================================== */
      await finalize();
    } catch (error) {
      console.error('[Bootstrap] Critical failure:', error);

      await logout('expired');
      await finalize();
    }
  };

  useEffect(() => {
    runBootstrap();

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  return (
    <AppBootstrapContext.Provider
      value={{ isReady, isBootstrapping }}
    >
      {children}
    </AppBootstrapContext.Provider>
  );
}