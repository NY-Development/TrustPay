import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import * as Updates from 'expo-updates';

type OTAState = {
  isChecking: boolean;
  isUpdating: boolean;
  hasUpdate: boolean;
};

const OTAContext = createContext<OTAState>({
  isChecking: false,
  isUpdating: false,
  hasUpdate: false,
});

export const useOTA = () => useContext(OTAContext);

export function OTAProvider({ children }: { children: React.ReactNode }) {
  const [isChecking, setIsChecking] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [hasUpdate, setHasUpdate] = useState(false);

  const lockRef = useRef(false);

  const runOTA = async () => {
    if (lockRef.current) return;
    lockRef.current = true;

    try {
      setIsChecking(true);

      const update = await Updates.checkForUpdateAsync();

      if (!update.isAvailable) {
        setHasUpdate(false);
        return;
      }

      setHasUpdate(true);
      setIsUpdating(true);

      await Updates.fetchUpdateAsync();

      await Updates.reloadAsync();
    } catch (error) {
      console.log('[OTA] Error:', error);
    } finally {
      setIsChecking(false);
      setIsUpdating(false);
      lockRef.current = false;
    }
  };

  useEffect(() => {
    // Initial OTA check ONLY ONCE
    runOTA();

    // Interval check (safe throttled)
    const interval = setInterval(() => {
      runOTA();
    }, 30 * 60 * 1000); // 30 min

    return () => clearInterval(interval);
  }, []);

  return (
    <OTAContext.Provider value={{ isChecking, isUpdating, hasUpdate }}>
      {children}
    </OTAContext.Provider>
  );
}