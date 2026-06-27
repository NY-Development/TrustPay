import { Stack, router, useSegments } from 'expo-router';
import { useEffect } from 'react';
import { useAuthStore } from '@/src/store/authStore';
import { QueryProvider } from '@/src/providers/QueryProvider';
import { View, ActivityIndicator } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { FloatingThemeToggle } from '@/src/components/FloatingThemeToggle';
import "../global.css"

import { ThemeProvider, DarkTheme, DefaultTheme } from '@react-navigation/native';
import { useColorScheme } from 'nativewind';
import { useSubscriptionStatus } from '@/src/hooks/useSubscription';
import SubscriptionModal from '@/src/components/SubscriptionModal';
import { NotificationProvider } from '@/src/providers/NotificationProvider';

// Adapt React Navigation background themes to match CSS variables
const customLightTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: 'rgb(249, 250, 251)', // matches hsl(var(--background)) light
  },
};

const customDarkTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: 'rgb(8, 12, 21)', // matches hsl(var(--background)) dark
  },
};

function RootLayoutNav() {
  const { isAuthenticated, isHydrated, hasSeenOnboarding, hydrate } = useAuthStore();
  const segments = useSegments();

  const { data: subStatus, isLoading: subLoading } = useSubscriptionStatus(isAuthenticated);

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
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }} className="bg-background">
        <ActivityIndicator size="large" color="#003ec7" />
      </View>
    );
  }

  const showLocked = isAuthenticated && !subLoading && !subStatus?.data?.active;

  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="index" />
      </Stack>
      <SubscriptionModal visible={!!showLocked} />
    </>
  );
}

export default function RootLayout() {
  const { colorScheme } = useColorScheme();

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider value={colorScheme === 'dark' ? customDarkTheme : customLightTheme}>
        <SafeAreaProvider>
          <QueryProvider>
            <View style={{ flex: 1 }} className={colorScheme === 'dark' ? 'dark' : ''}>
              <NotificationProvider>
                <RootLayoutNav />
              </NotificationProvider>
              <FloatingThemeToggle />
            </View>
          </QueryProvider>
        </SafeAreaProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
