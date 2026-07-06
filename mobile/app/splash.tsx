import React, { useEffect } from 'react';
import { View, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  FadeInUp,
  Easing,
} from 'react-native-reanimated';
import { useColorScheme } from 'nativewind';
import { useTranslation } from 'react-i18next'; // 👈 Import Translation

export default function SplashScreen() {
  const { t } = useTranslation(); // 👈 Initialize Translation
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withRepeat(
      withSequence(
        withTiming(1, {
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
        }),
        withTiming(0, {
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
        })
      ),
      -1,
      true
    );
  }, []);

  const progressStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: progress.value * 24 }],
  }));

  const gradientColors: [string, string] = isDark
    ? ['#1e3a8a', '#030712']
    : ['#003ec7', '#f8fafc'];

  return (
    <View className="flex-1 bg-background">
      <LinearGradient
        colors={gradientColors}
        className="flex-1 items-center justify-center"
      >
        {/* floating dots */}
        <View className="absolute inset-0 opacity-10">
          {Array.from({ length: 20 }).map((_, i) => (
            <View
              key={i}
              style={{
                position: 'absolute',
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
                width: 2,
                height: 2,
                backgroundColor: isDark ? 'white' : '#003ec7',
                borderRadius: 1,
              }}
            />
          ))}
        </View>

        <Animated.View entering={FadeInUp.duration(800)} className="items-center">
          <View className="w-24 h-24 items-center justify-center mb-6">
            <Ionicons
              name="shield-checkmark"
              size={80}
              color="white"
            />
          </View>

          <Text className="text-white text-4xl font-bold">
            {t('splash.appName')}
          </Text>

          <View className="mt-8 w-12 h-1 bg-white/20 rounded-full overflow-hidden">
            <Animated.View
              style={[
                {
                  height: '100%',
                  width: '50%',
                  backgroundColor: 'white',
                },
                progressStyle,
              ]}
            />
          </View>
        </Animated.View>
      </LinearGradient>
    </View>
  );
}