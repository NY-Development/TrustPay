import { Stack } from 'expo-router';
import { useColorScheme } from 'nativewind';

import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider, DarkTheme, DefaultTheme } from '@react-navigation/native';

import { QueryProvider } from '@/src/providers/QueryProvider';
import { NotificationProvider } from '@/src/providers/NotificationProvider';

import { AppBootstrapProvider } from '@/src/providers/AppBootstrap';
import { AuthProvider } from '@/src/providers/AuthProvider';
import { OTAProvider } from '@/src/providers/OTAProvider';

import { FloatingThemeToggle } from '@/src/components/FloatingThemeToggle';

import "../global.css";

/* ========================================================= */

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

function RootNavigator() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="splash" />
      <Stack.Screen name="index" />
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="verification" />
    </Stack>
  );
}

/* ========================================================= */

export default function RootLayout() {
  const { colorScheme } = useColorScheme();

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <OTAProvider>

        <AppBootstrapProvider>

          <AuthProvider>

            <ThemeProvider
              value={colorScheme === 'dark' ? customDarkTheme : customLightTheme}
            >
              <SafeAreaProvider>

                <QueryProvider>

                  <NotificationProvider>

                    {/* NAVIGATION */}
                    <RootNavigator />

                    {/* GLOBAL OVERLAY UI (IMPORTANT) */}
                    <FloatingThemeToggle />

                  </NotificationProvider>

                </QueryProvider>

              </SafeAreaProvider>
            </ThemeProvider>

          </AuthProvider>

        </AppBootstrapProvider>

      </OTAProvider>
    </GestureHandlerRootView>
  );
}