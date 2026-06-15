import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming, 
  withRepeat, 
  withSequence,
  FadeInUp,
  Easing
} from 'react-native-reanimated';
import { router } from 'expo-router';
import { useAuthStore } from '@/src/store/authStore';

const { width } = Dimensions.get('window');

export default function SplashScreen() {
  const { isHydrated } = useAuthStore();
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 1500, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
  }, []);

  const progressStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: progress.value * (48 - 24) }],
  }));

  return (
    <View className="flex-1">
      <LinearGradient
        colors={['#003ec7', '#eceef0']}
        className="flex-1 items-center justify-center relative"
      >
        {/* Background Pattern */}
        <View className="absolute inset-0 opacity-10">
          {[...Array(20)].map((_, i) => (
            <View 
              key={i} 
              style={{
                position: 'absolute',
                top: (Math.random() * 100 + '%') as any,
                left: (Math.random() * 100 + '%') as any,
                width: 2,
                height: 2,
                backgroundColor: 'white',
                borderRadius: 1,
              }}
            />
          ))}
        </View>

        <Animated.View 
          entering={FadeInUp.duration(800).springify()}
          className="items-center justify-center p-8"
        >
          {/* Logo Container */}
          <View className="relative w-24 h-24 mb-6 items-center justify-center">
            <View className="absolute inset-0 bg-white rounded-full opacity-20 blur-2xl" />
            <Ionicons name="shield-checkmark" size={80} color="white" />
          </View>

          {/* Brand Name */}
          <Text className="text-white text-4xl font-bold tracking-tight">
            TrustPay
          </Text>

          {/* Loading Indicator */}
          <View className="mt-8 w-12 h-1 bg-white/20 rounded-full overflow-hidden">
            <Animated.View 
              style={[
                { height: '100%', width: '50%', backgroundColor: 'white', borderRadius: 2 },
                progressStyle
              ]} 
            />
          </View>
        </Animated.View>
      </LinearGradient>
    </View>
  );
}
