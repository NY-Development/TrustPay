import React, { useEffect } from 'react';
import { View, Text, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Animated, { 
  useSharedValue, useAnimatedStyle, withTiming, withRepeat, 
  withSequence, FadeInUp, Easing, runOnJS 
} from 'react-native-reanimated';
import { router } from 'expo-router';
import { useAuthStore } from '@/src/store/authStore';
import { useColorScheme } from 'nativewind';

export default function SplashScreen() {
  const { isHydrated } = useAuthStore();
  const { colorScheme } = useColorScheme();
  const progress = useSharedValue(0);

  // Set the minimum time you want the splash screen to show (in milliseconds)
  const SPLASH_DURATION = 8000; 

  useEffect(() => {
    // 1. Run the loading bar animation sequence
    progress.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 2500, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 2500, easing: Easing.inOut(Easing.ease) })
      ),
      -1, 
      true
    );

    // 2. Set a timer and check for hydration before routing
    const timer = setTimeout(() => {
      if (isHydrated) {
        router.replace('/(tabs)'); // Replace with your main app route
      }
    }, 5000);

    return () => clearTimeout(5000);
  }, [isHydrated]);

  const progressStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: progress.value * (48 - 24) }],
  }));

  const isDark = colorScheme === 'dark';
  const gradientColors: [string, string, ...string[]] = isDark 
    ? ['#1e3a8a', '#030712'] // matches --primary and --background in dark mode
    : ['#003ec7', '#f8fafc']; // matches --primary and --background in light mode

  return (
    <View className="flex-1 bg-background">
      <LinearGradient colors={gradientColors as any} className="flex-1 items-center justify-center relative">
        {/* Background Pattern */}
        <View className="absolute inset-0 opacity-10">
          {[...Array(20)].map((_, i) => (
            <View 
              key={i} 
              style={{ 
                position: 'absolute', 
                top: `${Math.random() * 100}%`, 
                left: `${Math.random() * 100}%`, 
                width: 2, height: 2, backgroundColor: isDark ? 'white' : '#003ec7', borderRadius: 1 
              }} 
            />
          ))}
        </View>

        <Animated.View entering={FadeInUp.duration(800).springify()} className="items-center justify-center p-8">
          {/* Logo Container */}
          <View className="relative w-24 h-24 mb-6 items-center justify-center">
            <View className="absolute inset-0 bg-primary-foreground rounded-full opacity-20 blur-2xl" />
            <Ionicons name="shield-checkmark" size={80} color={isDark ? 'white' : '#fff'} />
          </View>

          {/* Brand Name */}
          <Text className="text-primary-foreground text-4xl font-bold tracking-tight">TrustPay</Text>

          {/* Loading Indicator */}
          <View className="mt-8 w-12 h-1 bg-primary-foreground/20 rounded-full overflow-hidden">
            <Animated.View 
              style={[
                { height: '100%', width: '50%', backgroundColor: isDark ? 'white' : '#fff', borderRadius: 2 }, 
                progressStyle 
              ]} 
            />
          </View>
        </Animated.View>
      </LinearGradient>
    </View>
  );
}
