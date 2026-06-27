import { Tabs } from 'expo-router';
import React from 'react';
import { BlurView } from 'expo-blur';
import { Platform, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from 'nativewind';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function TabLayout() {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  
  // Grab the safe area insets
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          position: 'absolute',
          borderTopWidth: 0,
          backgroundColor: Platform.OS === 'ios' ? 'transparent' : (isDark ? 'rgba(0,0,0,0.9)' : 'rgba(255,255,255,0.9)'),
          elevation: 0,
          // REMOVED fixed height to allow dynamic safe-area sizing
          paddingTop: 12,
          // Fallback to a default 12px padding if the device has no bottom inset (like older Androids)
          paddingBottom: insets.bottom > 0 ? insets.bottom : 12, 
          // Dynamically adjust total container size based on the inset
          height: 60 + (insets.bottom > 0 ? insets.bottom : 12),
        },
        tabBarBackground: () => (
          Platform.OS === 'ios' ? (
            <BlurView intensity={30} tint={isDark ? "dark" : "light"} className="absolute inset-0" />
          ) : null
        ),
        tabBarActiveTintColor: isDark ? '#3b82f6' : '#003ec7',
        tabBarInactiveTintColor: isDark ? '#94a3b8' : '#64748b',
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'home' : 'home-outline'} size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'History',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'time' : 'time-outline'} size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="verify"
        options={{
          title: 'Verify',
          tabBarIcon: ({ color, focused }) => (
            <View 
              className="bg-primary w-14 h-14 rounded-full items-center justify-center -mt-8 shadow-lg shadow-primary/20"
              style={{ backgroundColor: focused ? (isDark ? '#3b82f6' : '#003ec7') : (isDark ? '#1e293b' : '#f1f5f9') }}
            >
              <Ionicons name="scan" size={28} color={focused ? (isDark ? '#000' : '#fff') : (isDark ? '#fff' : '#000')} />
            </View>
          ),
          tabBarLabel: () => null,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'settings' : 'settings-outline'} size={24} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}