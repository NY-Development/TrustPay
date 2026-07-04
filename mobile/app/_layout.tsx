import React, { useEffect } from 'react';
import { View, Platform } from 'react-native';
import { Stack } from 'expo-router';
import { useColorScheme } from 'nativewind';
import { StatusBar } from 'expo-status-bar';
import * as NavigationBar from 'expo-navigation-bar';

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

  useEffect(() => {
    if (Platform.OS === 'android') {
      try {
        NavigationBar.setStyle(colorScheme === 'dark' ? 'dark' : 'light');
      } catch (err) {
        console.warn('Failed to set Android navigation bar style:', err);
      }
    }
  }, [colorScheme]);

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

                    {/* ROOT CLASS FOR NATIVEWIND COLOR THEME */}
                    <View className={colorScheme === 'dark' ? 'dark' : ''} style={{ flex: 1 }}>
                      
                      {/* STATUS BAR */}
                      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />

                      {/* NAVIGATION */}
                      <RootNavigator />

                      {/* GLOBAL OVERLAY UI (IMPORTANT) */}
                      <FloatingThemeToggle />

                    </View>

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