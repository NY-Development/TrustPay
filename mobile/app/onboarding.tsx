import React, { useRef, useState } from 'react';
import { 
  Text, 
  View, 
  TouchableOpacity, 
  ScrollView, 
  Dimensions, 
  NativeScrollEvent, 
  NativeSyntheticEvent 
} from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '@/src/store/authStore';
import { useColorScheme } from 'nativewind';

const { width, height } = Dimensions.get('window');

export default function Onboarding() {
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollRef = useRef<ScrollView>(null);
  const { setHasSeenOnboarding } = useAuthStore();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  const themePrimary = isDark ? '#3b82f6' : '#003ec7';
  const themeMuted = isDark ? '#64748b' : '#71717a';

  const slides = [
    {
      id: 'welcome',
      title: 'Ready to Secure Your Payments?',
      description: 'Start verifying transactions instantly with the professional standard for merchant security.',
      icon: 'shield-checkmark',
      color: themePrimary,
    },
    {
      id: 'security',
      title: 'Institutional-Grade Security',
      description: 'Protect every transaction with our advanced encryption and shield-based verification systems.',
      icon: 'lock-closed',
      color: isDark ? '#6366f1' : '#12005E',
    },
    {
      id: 'speed',
      title: 'Verified in Under 1s',
      description: "Don't keep customers waiting. Our lightning-fast verification engine provides instant results.",
      icon: 'flash',
      color: isDark ? '#06b6d4' : '#00E5FF',
    },
    {
      id: 'trust',
      title: 'A Global Merchant Network',
      description: 'Join thousands of trusted merchants worldwide who rely on TrustPay for secure validation.',
      icon: 'globe',
      color: themePrimary,
    }
  ];

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const scrollOffset = event.nativeEvent.contentOffset.x;
    const index = Math.round(scrollOffset / width);
    setActiveIndex(index);
  };

  const handleNext = () => {
    if (activeIndex === slides.length - 1) {
      finishOnboarding();
    } else {
      scrollRef.current?.scrollTo({ x: (activeIndex + 1) * width, animated: true });
    }
  };

  const finishOnboarding = async () => {
    await setHasSeenOnboarding(true);
    router.replace('/(auth)/login');
  };

  return (
    <View className="flex-1 bg-background">
      <SafeAreaView className="flex-1">
        {/* Header */}
        <View className="px-6 h-16 flex-row justify-between items-center">
          <View className="flex-row items-center">
            <Ionicons name="shield" size={24} color={themePrimary} />
            <Text className="ml-2 text-xl font-bold text-primary tracking-tight">TrustPay</Text>
          </View>
          <TouchableOpacity onPress={finishOnboarding}>
            <Text className="text-muted-foreground font-medium">Skip</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          ref={scrollRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          className="flex-1"
        >
          {slides.map((slide, i) => (
            <View key={slide.id} style={{ width }} className="flex-1 items-center justify-center px-10">
              <View 
                className="w-full aspect-square rounded-[40px] items-center justify-center mb-12 shadow-2xl"
                style={{ backgroundColor: slide.color + '10' }}
              >
                <LinearGradient
                  colors={[slide.color, slide.color + '80'] as any}
                  className="w-32 h-32 rounded-3xl items-center justify-center"
                >
                  <Ionicons name={slide.icon as any} size={64} color="white" />
                </LinearGradient>
              </View>

              <Text className="text-3xl font-bold text-center mb-4 text-foreground">
                {slide.title}
              </Text>
              <Text className="text-lg text-center text-muted-foreground leading-7">
                {slide.description}
              </Text>
            </View>
          ))}
        </ScrollView>

        {/* Footer */}
        <View className="px-10 pb-12">
          {/* Progress Indicators */}
          <View className="flex-row justify-center items-center mb-10 gap-2">
            {slides.map((_, i) => (
              <View 
                key={i}
                className={`h-2 rounded-full ${i === activeIndex ? 'w-8 bg-primary' : 'w-2 bg-border'}`}
              />
            ))}
          </View>

          <TouchableOpacity 
            onPress={handleNext}
            className="w-full h-16 bg-primary rounded-2xl items-center justify-center shadow-lg active:opacity-90"
          >
            <View className="flex-row items-center">
              <Text className="text-primary-foreground font-bold text-xl mr-2">
                {activeIndex === slides.length - 1 ? 'Get Started' : 'Next'}
              </Text>
              <Ionicons name="arrow-forward" size={20} color={isDark ? '#000' : '#fff'} />
            </View>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
}
