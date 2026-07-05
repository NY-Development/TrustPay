import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/src/store/authStore';

export default function Index() {
  const router = useRouter();
  const [splashTimeElapsed, setSplashTimeElapsed] = useState(false);
  
  // Connect to your existing store properties
  const { isHydrated, isAuthenticated } = useAuthStore();

  /**
   * FORCE MINIMUM SPLASH TIME (4s)
   */
  useEffect(() => {
    const t = setTimeout(() => {
      setSplashTimeElapsed(true);
    }, 4000);

    return () => clearTimeout(t);
  }, []);

  /**
   * BACKUP ROUTE GUARD
   * Handles safe routing the millisecond both conditions are met.
   */
  useEffect(() => {
    if (splashTimeElapsed && isHydrated) {
      if (isAuthenticated) {
        router.replace('/(tabs)');
      } else {
        router.replace('/(auth)/login');
      }
    }
  }, [splashTimeElapsed, isHydrated, isAuthenticated]);

  /**
   * WHILE LOADING OR SPLASH TIMEOUT ACTIVE → SHOW SPLASH SCREEN
   */
  if (!splashTimeElapsed) {
    const Splash = require('./splash').default;
    return <Splash />;
  }

  /**
   * FALLBACK SAFETY BALANCER
   * Keeps a clean interface up if the splash finishes before hydration completes.
   */
  return (
    <View className="flex-1 items-center justify-center bg-background">
      <ActivityIndicator size="large" className="text-primary" />
    </View>
  );
}