import { Stack, router, useSegments } from 'expo-router';
import { useEffect, useState, useRef } from 'react';
import { useAuthStore } from '@/src/store/authStore';
import { QueryProvider } from '@/src/providers/QueryProvider';
import { View, ActivityIndicator } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { FloatingThemeToggle } from '@/src/components/FloatingThemeToggle';
import "../global.css";

import { ThemeProvider, DarkTheme, DefaultTheme } from '@react-navigation/native';
import { useColorScheme } from 'nativewind';
import { useSubscriptionStatus } from '@/src/hooks/useSubscription';
import SubscriptionModal from '@/src/components/SubscriptionModal';
import { NotificationProvider } from '@/src/providers/NotificationProvider';

// OTA
import * as Updates from 'expo-updates';
import * as SplashScreen from 'expo-splash-screen';
import { UpdateLoading } from '@/src/components/Update-Loading';

SplashScreen.preventAutoHideAsync().catch(() => {});

// Themes
const customLightTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: 'rgb(249, 250, 251)',
  },
};

const customDarkTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: 'rgb(8, 12, 21)',
  },
};

/* ---------------- ROOT NAV ---------------- */

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
    const isSplash = !segments[0] || (segments[0] as string) === 'index';

    if (!hasSeenOnboarding && !inOnboarding) {
      router.replace('/onboarding');
    } else if (hasSeenOnboarding && !isAuthenticated && !inAuthGroup) {
      router.replace('/(auth)/login');
    } else if (isAuthenticated && (inAuthGroup || inOnboarding || isSplash)) {
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

  const subData = subStatus?.data;

  const isSubscriptionActive =
    subData?.active === true &&
    subData?.subscription?.status === 'active' &&
    subData?.subscription?.fullyPaid === true;

  const isPartialPayment =
    subData?.isPartialPayment === true ||
    subData?.subscription?.status === 'partial_payment';

  const showLocked =
    isAuthenticated &&
    !subLoading &&
    (!isSubscriptionActive || isPartialPayment);

  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="index" />
      </Stack>

      <SubscriptionModal
        visible={!!showLocked}
        partialSubscription={isPartialPayment ? subData?.subscription : null}
      />
    </>
  );
}

/* ---------------- ROOT LAYOUT ---------------- */

export default function RootLayout() {
  const { colorScheme } = useColorScheme();

  const [isUpdating, setIsUpdating] = useState(false);
  const [isOTACheckDone, setIsOTACheckDone] = useState(false);

  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState("Checking for updates...");

  // NEW: prevent overlapping OTA checks
  const isCheckingRef = useRef(false);

  async function runOTAEngine() {
    if (isCheckingRef.current) return;
    isCheckingRef.current = true;

    try {
      setStatus("Checking for updates...");

      const update = await Updates.checkForUpdateAsync();

      if (!update.isAvailable) {
        return;
      }

      setIsUpdating(true);
      setStatus("Preparing update...");
      await SplashScreen.hideAsync();

      setStatus("Downloading update...");

      const fetchTask = Updates.fetchUpdateAsync();

      const progressInterval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) return prev;
          return prev + Math.random() * 8;
        });
      }, 300);

      await fetchTask;

      clearInterval(progressInterval);

      setProgress(95);
      setStatus("Finalizing update...");

      await new Promise((r) => setTimeout(r, 600));

      setProgress(100);
      setStatus("Restarting application...");

      await Updates.reloadAsync();
    } catch (error) {
      console.warn("OTA update failed:", error);
    } finally {
      setIsUpdating(false);
      setIsOTACheckDone(true);
      isCheckingRef.current = false;
      await SplashScreen.hideAsync();
    }
  }

  useEffect(() => {
    // Initial OTA check
    if (__DEV__) {
      setIsOTACheckDone(true);
      SplashScreen.hideAsync();
      return;
    }

    runOTAEngine();

    // ⏱ NEW: 30-minute interval OTA polling
    const interval = setInterval(() => {
      runOTAEngine();
    }, 30 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  /* ---------------- OTA SCREEN ---------------- */

  if (isUpdating) {
    return (
      <View className={colorScheme === 'dark' ? 'dark flex-1' : 'flex-1'}>
        <UpdateLoading progress={progress} status={status} />
      </View>
    );
  }

  if (!isOTACheckDone) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider value={colorScheme === 'dark' ? customDarkTheme : customLightTheme}>
        <SafeAreaProvider>
          <QueryProvider>
            <View className={colorScheme === 'dark' ? 'dark flex-1' : 'flex-1'}>
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