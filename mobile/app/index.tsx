import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { useAppBootstrap } from '@/src/providers/AppBootstrap';

export default function Index() {
  const { isReady } = useAppBootstrap();
  const [showSplash, setShowSplash] = useState(true);

  /**
   * FORCE MINIMUM SPLASH TIME (4s)
   */
  useEffect(() => {
    const t = setTimeout(() => {
      setShowSplash(false);
    }, 4000);

    return () => clearTimeout(t);
  }, []);

  /**
   * NAVIGATION CONTROL
   */
  useEffect(() => {
    if (!isReady || showSplash) return;

    router.replace('/(tabs)');
  }, [isReady, showSplash]);

  /**
   * WHILE LOADING → SHOW SPLASH SCREEN ROUTE
   */
  if (showSplash) {
    const Splash = require('./splash').default;
    return <Splash />;
  }

  return (
    <View className="flex-1 items-center justify-center bg-background">
      <ActivityIndicator />
    </View>
  );
}