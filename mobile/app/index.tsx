import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';

export default function Index() {
  const [showSplash, setShowSplash] = useState(true);

  /**
   * FORCE MINIMUM SPLASH TIME (4s)
   * AuthProvider handles all navigation after hydration.
   */
  useEffect(() => {
    const t = setTimeout(() => {
      setShowSplash(false);
    }, 4000);

    return () => clearTimeout(t);
  }, []);

  /**
   * WHILE LOADING → SHOW SPLASH SCREEN
   */
  if (showSplash) {
    const Splash = require('./splash').default;
    return <Splash />;
  }

  /**
   * AFTER SPLASH → AuthProvider + route guard will navigate away.
   * Render a minimal loading state while that happens.
   */
  return (
    <View className="flex-1 items-center justify-center bg-background">
      <ActivityIndicator />
    </View>
  );
}