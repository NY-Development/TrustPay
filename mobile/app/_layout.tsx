import { Stack, router, useSegments } from 'expo-router';
import { useEffect } from 'react';
import { useAuthStore } from '@/src/store/authStore';
import { QueryProvider } from '@/src/providers/QueryProvider';
import { View, ActivityIndicator } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { FloatingThemeToggle } from '@/src/components/FloatingThemeToggle';
import "../global.css"

function RootLayoutNav() {
  const { isAuthenticated, isHydrated, hasSeenOnboarding, hydrate } = useAuthStore();
  const segments = useSegments();

  useEffect(() => {
    hydrate();
  }, []);

  useEffect(() => {
    if (!isHydrated) return;

    const inAuthGroup = segments[0] === '(auth)';
    const inOnboarding = segments[0] === 'onboarding';

    if (!hasSeenOnboarding && !inOnboarding) {
      // Redirect to onboarding if not seen yet
      router.replace('/onboarding');
    } else if (hasSeenOnboarding && !isAuthenticated && !inAuthGroup) {
      // Redirect to login if not authenticated and not in auth routes
      router.replace('/(auth)/login');
    } else if (isAuthenticated && (inAuthGroup || inOnboarding)) {
      // Redirect to home if authenticated and trying to access auth/onboarding routes
      router.replace('/(tabs)');
    }
  }, [isAuthenticated, isHydrated, hasSeenOnboarding, segments]);

  if (!isHydrated) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' }}>
        <ActivityIndicator size="large" color="#00E5FF" />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="onboarding" />
      <Stack.Screen name="index" />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryProvider>
          <RootLayoutNav />
          <FloatingThemeToggle />
        </QueryProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
