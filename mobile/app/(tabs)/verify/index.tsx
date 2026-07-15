import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from 'nativewind';

interface VerifyOption {
  id: string;
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  route: string;
  isAvailable: boolean;
}

export default function VerifyEntry() {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const themePrimary = isDark ? '#3b82f6' : '#003ec7';

  const options: VerifyOption[] = [
    {
      id: 'manual',
      title: 'Manual Entry',
      description: 'Enter provider and transaction ID manually.',
      icon: 'create-outline',
      color: '#00E5FF',
      route: '/(tabs)/verify/manual',
      isAvailable: true,
    },
    {
      id: 'screenshot',
      title: 'Upload Screenshot',
      description: 'Extract transaction details using AI.',
      icon: 'image-outline',
      color: '#2979FF',
      route: '/(tabs)/verify/ocr',
      isAvailable: true,
    },
    // {
    //   id: 'qr',
    //   title: 'Scan QR Code',
    //   description: 'Verify payments by scanning QR codes.',
    //   icon: 'qr-code-outline',
    //   color: '#00C853',
    //   route: '/(tabs)/verify/scan',
    //   isAvailable: true,
    // },
  ];

  const handleOptionPress = (option: VerifyOption) => {
    router.push(option.route as any);
  };

  return (
    <View className="flex-1 bg-background">
      <SafeAreaView className="flex-1 px-6 pb-6">
        {/* Header Section */}
        <View className="mt-8 mb-8">
          <Text className="text-foreground text-4xl font-black tracking-tight">
            Verify Payment
          </Text>
          <Text className="text-muted-foreground text-base mt-2">
            Choose your preferred verification method.
          </Text>
        </View>

        {/* 🛠️ FIXED: Removed flex-1 so cards sit compactly together, pulling the banner up */}
        <View className="gap-4 mb-8">
          {options.map((option) => (
            <TouchableOpacity
              key={option.id}
              activeOpacity={0.75}
              onPress={() => handleOptionPress(option)}
              className="bg-card border border-border/80 rounded-3xl p-5 flex-row items-center active:scale-[0.99] transition-all border-l-[6px]"
              style={{ borderLeftColor: option.color }}
            >
              {/* Icon Frame */}
              <View
                className="w-14 h-14 rounded-2xl items-center justify-center"
                style={{ backgroundColor: `${option.color}15` }}
              >
                <Ionicons
                  name={option.icon}
                  size={26}
                  color={option.color}
                />
              </View>

              {/* Title & Specs */}
              <View className="flex-1 ml-4 pr-2">
                <Text className="text-lg font-bold text-foreground tracking-wide">
                  {option.title}
                </Text>
                <Text className="text-sm mt-0.5 text-muted-foreground leading-5">
                  {option.description}
                </Text>
              </View>

              {/* Chevron Anchor */}
              <Ionicons
                name="chevron-forward"
                size={20}
                color={isDark ? '#475569' : '#94A3B8'}
              />
            </TouchableOpacity>
          ))}
        </View>

        {/* Info Notification Banner — Now resting perfectly below the cards */}
        <View className="rounded-2xl border border-primary/15 bg-primary/5 overflow-hidden p-5 relative">
          <LinearGradient
            colors={['transparent', isDark ? '#3b82f608' : '#003ec708']}
            className="absolute inset-0"
          />
          <View className="flex-row items-center mb-2">
            <Ionicons
              name="information-circle-outline"
              size={22}
              color={themePrimary}
            />
            <Text className="ml-2 text-md font-bold text-primary tracking-wide">
              System Notice
            </Text>
          </View>
          <Text className="text-sm leading-6 text-muted-foreground/90">
            Manual, Smart AI-OCR, and Native QR-matrix tools are all active and ready for evaluation in this application build.
          </Text>
        </View>
      </SafeAreaView>
    </View>
  );
}