import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import * as Updates from 'expo-updates';

import { useAuthStore } from '@/src/store/authStore';
import { TokenService } from '@/src/services/token.service';
import { BiometricService } from '@/src/utils/biometrics';
import { SplashController } from '@/src/utils/splash.controller';

/* ========================================================= */

type BootstrapState = {
  isReady: boolean;
  isBootstrapping: boolean;
};

const AppBootstrapContext = createContext<BootstrapState>({
  isReady: false,
  isBootstrapping: true,
});

export const useAppBootstrap = () => useContext(AppBootstrapContext);

/* ========================================================= */

export function AppBootstrapProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isReady, setIsReady] = useState(false);
  const [isBootstrapping, setIsBootstrapping] = useState(true);

  const finalized = useRef(false);

  const hydrate = useAuthStore((s) => s.hydrate);
  const biometricsEnabled = useAuthStore((s) => s.biometricsEnabled);
  const logout = useAuthStore((s) => s.logout);

  const finalize = async () => {
    if (finalized.current) return;
    finalized.current = true;

    setIsReady(true);
    setIsBootstrapping(false);

    await SplashController.hide();
  };

  const runBootstrap = async () => {
    try {
      await SplashController.lock();

      /* OTA (non-blocking safe) */
      try {
        const update = await Updates.checkForUpdateAsync();

        if (update.isAvailable) {
          await Updates.fetchUpdateAsync();
          await Updates.reloadAsync();
          return;
        }
      } catch {}

      await hydrate();

      const access = await TokenService.getAccessToken();
      const refresh = await TokenService.getRefreshToken();

      if (!access || !refresh) {
        await logout('expired');
        await finalize();
        return;
      }

      if (biometricsEnabled) {
        try {
          const ok = await BiometricService.authenticate(
            'Unlock TrustPay'
          );

          if (!ok) {
            await logout('expired');
            await finalize();
            return;
          }
        } catch {}
      }

      await finalize();
    } catch (e) {
      console.error('[Bootstrap Error]', e);
      await logout('expired');
      await finalize();
    }
  };

  useEffect(() => {
    runBootstrap();
  }, []);

  return (
    <AppBootstrapContext.Provider value={{ isReady, isBootstrapping }}>
      {children}
    </AppBootstrapContext.Provider>
  );
}