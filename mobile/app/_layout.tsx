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
import { LanguageProvider } from '@/src/providers/LanguageProvider';
import { DownloadProvider } from '@/src/context/DownloadContext';
import { AIProvider } from '@/src/ai/AIProvider'; // 👈 IMPORTED

import { FloatingThemeToggle } from '@/src/components/FloatingThemeToggle';
import { SessionExpiryBanner } from '@/src/components/SessionExpiryBanner';

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
      <LanguageProvider>
        <OTAProvider>
          <AppBootstrapProvider>
            <DownloadProvider>
              <AIProvider>
                <ThemeProvider value={colorScheme === 'dark' ? customDarkTheme : customLightTheme}>
                  <SafeAreaProvider>
                    <QueryProvider>
                      <NotificationProvider>
                        
                        {/* 
                          👉 FIXED: AuthProvider moved here. 
                          It now sits inside Theme/SafeArea/Query/Notification providers, 
                          giving it direct access to the active navigation context.
                        */}
                        <AuthProvider>
                          
                          {/* ROOT CLASS FOR NATIVEWIND COLOR THEME */}
                          <View className={colorScheme === 'dark' ? 'dark' : ''} style={{ flex: 1 }}>
                            
                            {/* STATUS BAR */}
                            <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />

                            {/* NAVIGATION */}
                            <RootNavigator />

                            {/* GLOBAL OVERLAY UI */}
                            <FloatingThemeToggle />
                            <SessionExpiryBanner />

                          </View>

                        </AuthProvider>

                      </NotificationProvider>
                    </QueryProvider>
                  </SafeAreaProvider>
                </ThemeProvider>
              </AIProvider>
            </DownloadProvider>
          </AppBootstrapProvider>
        </OTAProvider>
      </LanguageProvider>
    </GestureHandlerRootView>
  );
}