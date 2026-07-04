import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from 'nativewind';

export default function VerifyEntry() {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const themePrimary = isDark ? '#3b82f6' : '#003ec7';

  const [comingSoonVisible, setComingSoonVisible] = useState(false);

  const options = [
    {
      id: 'manual',
      title: 'Manual Entry',
      description: 'Enter provider and transaction ID manually.',
      icon: 'create-outline',
      color: '#00E5FF',
      route: '/(tabs)/verify/manual',
    },
    {
      id: 'screenshot',
      title: 'Upload Screenshot',
      description: 'Extract transaction details using AI.',
      icon: 'image-outline',
      color: '#2979FF',
      route: '/(tabs)/verify/ocr',
    },
    {
      id: 'qr',
      title: 'Scan QR Code',
      description: 'Verify payments by scanning QR codes.',
      icon: 'qr-code-outline',
      color: '#00C853',
      route: '/(tabs)/verify/scan',
    },
  ];

  const handleOptionPress = (id: string, route: string) => {
    if (id === 'new') {
      setComingSoonVisible(true);
    };
    router.push(route as any);
    return;
  };

  return (
    <>
      <View className="flex-1 bg-background">
        <SafeAreaView className="flex-1 px-6">
          <Text className="text-foreground text-4xl font-bold mt-8 mb-2">
            Verify Payment
          </Text>

          <Text className="text-muted-foreground text-lg mb-12">
            Choose how you want to verify the transaction.
          </Text>

          <View className="gap-4">
            {options.map((option) => (
              <TouchableOpacity
                key={option.id}
                activeOpacity={0.85}
                onPress={() => handleOptionPress(option.id, option.route)}
                className="bg-card border border-border rounded-3xl p-6 flex-row items-center border-l-[5px]"
                style={{ borderLeftColor: option.color }}
              >
                <View
                  className="w-14 h-14 rounded-2xl items-center justify-center"
                  style={{
                    backgroundColor: `${option.color}20`,
                  }}
                >
                  <Ionicons
                    name={option.icon as any}
                    size={28}
                    color={option.color}
                  />
                </View>

                <View className="flex-1 ml-5">
                  <Text className="text-xl font-bold text-foreground">
                    {option.title}
                  </Text>

                  <Text className="text-sm mt-1 text-muted-foreground">
                    {option.description}
                  </Text>
                </View>

                <Ionicons
                  name="chevron-forward"
                  size={22}
                  color={isDark ? '#475569' : '#94A3B8'}
                />
              </TouchableOpacity>
            ))}
          </View>

          <View className="mt-8 rounded-3xl border border-primary/20 bg-primary/10 overflow-hidden p-6">
            <LinearGradient
              colors={[
                'transparent',
                isDark ? '#3b82f610' : '#003ec710',
              ]}
              className="absolute inset-0"
            />

            <View className="flex-row items-center">
              <Ionicons
                name="information-circle-outline"
                size={24}
                color={themePrimary}
              />

              <Text className="ml-2 text-lg font-bold text-primary">
                Verification Tip
              </Text>
            </View>

            <Text className="mt-3 text-sm leading-6 text-muted-foreground">
              Manual verification is available in this preview build. AI
              Screenshot Verification and QR Verification will be released in
              the production version.
            </Text>
          </View>
        </SafeAreaView>
      </View>

      {/* Coming Soon Modal */}

      <Modal
        visible={comingSoonVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setComingSoonVisible(false)}
      >
        <View className="flex-1 justify-center items-center bg-black/60 px-6">
          <View className="w-full max-w-md rounded-3xl bg-card border border-border p-7">
            <View className="w-20 h-20 rounded-full bg-primary/10 self-center items-center justify-center">
              <Ionicons
                name="rocket-outline"
                size={40}
                color={themePrimary}
              />
            </View>

            <Text className="text-2xl font-bold text-center text-foreground mt-6">
              Coming Soon
            </Text>

            <Text className="text-center text-muted-foreground mt-3 leading-6">
              AI Screenshot Verification and QR Code Verification are currently
              under active development.
            </Text>

            <Text className="text-center text-muted-foreground mt-2 leading-6">
              They will be available in the official production release. This
              preview demonstrates the core payment verification workflow using
              Manual Entry.
            </Text>

            <Pressable
              onPress={() => setComingSoonVisible(false)}
              className="mt-8 bg-primary rounded-2xl py-4 items-center"
            >
              <Text className="text-primary-foreground font-semibold text-base">
                Got it
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </>
  );
}