import { Tabs } from 'expo-router';
import React from 'react';
import { BlurView } from 'expo-blur';
import { Platform, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          position: 'absolute',
          borderTopWidth: 0,
          backgroundColor: Platform.OS === 'ios' ? 'transparent' : 'rgba(0,0,0,0.9)',
          elevation: 0,
          height: 90,
          paddingBottom: 30,
          paddingTop: 12,
        },
        tabBarBackground: () => (
          Platform.OS === 'ios' ? (
            <BlurView intensity={30} tint="dark" className="absolute inset-0" />
          ) : null
        ),
        tabBarActiveTintColor: '#00E5FF',
        tabBarInactiveTintColor: '#52525B',
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
        name="verify/index"
        options={{
          title: 'Verify',
          tabBarIcon: ({ color, focused }) => (
            <View 
              className="bg-[#00E5FF] w-14 h-14 rounded-full items-center justify-center -mt-8 shadow-lg shadow-[#00E5FF]/20"
              style={{ backgroundColor: focused ? '#00E5FF' : '#12005E' }}
            >
              <Ionicons name="scan" size={28} color={focused ? 'black' : 'white'} />
            </View>
          ),
          tabBarLabel: () => null,
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
    </Tabs>
  );
}
