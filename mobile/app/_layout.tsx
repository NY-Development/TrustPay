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

import "../global.css";

function RootNavigator() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="splash" options={{ headerShown: false }} />
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="verification" />
    </Stack>
  );
}

export default function RootLayout() {
  const { colorScheme } = useColorScheme();

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <OTAProvider>
        <AppBootstrapProvider>
          <AuthProvider>
            <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
              <SafeAreaProvider>
                <QueryProvider>
                  <NotificationProvider>
                    <RootNavigator />
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