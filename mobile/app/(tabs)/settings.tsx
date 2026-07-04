import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  Switch,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from 'nativewind';
import { router } from 'expo-router';

import { useAuthStore } from '@/src/store/authStore';
import { TokenService } from '@/src/services/token.service';
import { SplashController } from '@/src/utils/splash.controller';

export default function SettingsScreen() {
  const { colorScheme, setColorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  const logout = useAuthStore((s) => s.logout);

  const [loading, setLoading] = useState(false);

  /* =========================================================
     THEME TOGGLE (GLOBAL)
  ========================================================= */
  const toggleTheme = async () => {
    const next = isDark ? 'light' : 'dark';
    setColorScheme(next);
  };

  /* =========================================================
     LOGOUT FLOW (CLEAN + SAFE)
  ========================================================= */
  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);

              // clear tokens first
              await TokenService.clearTokens();

              // reset auth store
              await logout('manual');

              // ensure splash reset (optional safety)
              await SplashController.reset();

              router.replace('/(auth)/login');
            } catch (err) {
              console.error('[Logout Error]', err);
              Alert.alert('Error', 'Failed to logout. Try again.');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  /* =========================================================
     UI
  ========================================================= */

  return (
    <View className="flex-1 bg-background">
      <SafeAreaView className="flex-1">
        {/* HEADER */}
        <View className="px-6 pt-6 flex-row items-center justify-between">
          <Text className="text-foreground text-2xl font-bold">
            Settings
          </Text>
        </View>

        <ScrollView className="px-6 mt-6">
          {/* =========================
              APPEARANCE SECTION
          ========================= */}
          <View className="bg-card border border-border rounded-2xl p-5 mb-6">
            <Text className="text-foreground font-bold mb-4">
              Appearance
            </Text>

            <View className="flex-row items-center justify-between">
              <View>
                <Text className="text-foreground font-medium">
                  Dark Mode
                </Text>
                <Text className="text-muted-foreground text-sm">
                  Switch app theme
                </Text>
              </View>

              <Switch
                value={isDark}
                onValueChange={toggleTheme}
              />
            </View>
          </View>

          {/* =========================
              NOTIFICATIONS (PLACEHOLDER)
          ========================= */}
          <View className="bg-card border border-border rounded-2xl p-5 mb-6">
            <Text className="text-foreground font-bold mb-4">
              Notifications
            </Text>

            <Text className="text-muted-foreground text-sm">
              Notification settings will appear here.
            </Text>
          </View>

          {/* =========================
              ACCOUNT SECTION
          ========================= */}
          <View className="bg-card border border-border rounded-2xl p-5">
            <Text className="text-foreground font-bold mb-4">
              Account
            </Text>

            <TouchableOpacity
              onPress={handleLogout}
              disabled={loading}
              className="flex-row items-center justify-between"
            >
              <View className="flex-row items-center gap-3">
                <Ionicons
                  name="log-out-outline"
                  size={22}
                  color="#ef4444"
                />
                <Text className="text-destructive font-semibold">
                  Logout
                </Text>
              </View>

              {loading ? (
                <ActivityIndicator color="#ef4444" />
              ) : (
                <Ionicons
                  name="chevron-forward"
                  size={18}
                  color="#ef4444"
                />
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}