import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from 'nativewind';

export default function PrivacyPolicyScreen() {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const router = useRouter();

  const themePrimary = isDark ? '#3b82f6' : '#003ec7';

  const sections = [
    {
      id: 'collection',
      icon: 'document-text-outline',
      title: 'Information We Collect',
      content: [
        'We collect information to provide better, more secure services to all our users. This includes basic details necessary for account creation, such as your name, email address, and contact number.',
        'Additionally, to facilitate secure transactions, we collect necessary financial and payment verification data in compliance with strict regulatory standards. We do not store sensitive biometric data directly on our servers without explicit, revokable consent.'
      ]
    },
    {
      id: 'usage',
      icon: 'stats-chart-outline',
      title: 'How We Use Data',
      content: [
        'Your data is strictly utilized to process transactions, verify identity to prevent fraud, and maintain the operational security of your TrustPay account.'
      ],
      points: [
        'To verify your identity and protect against malicious activities.',
        'To communicate critical account alerts and security updates.',
        'To comply with international financial regulations and compliance frameworks.'
      ]
    },
    {
      id: 'sharing',
      icon: 'people-outline',
      title: 'Third-Party Sharing',
      content: [
        'TrustPay does not sell your personal data to third parties. We only share specific verification tokens with authorized merchants when you explicitly initiate a payment request. We may also share data with verified banking partners strictly for the purpose of clearing transactions or complying with legal subpoenas.'
      ]
    },
    {
      id: 'security',
      icon: 'lock-closed-outline',
      title: 'Security Measures',
      content: [
        'We employ enterprise-grade encryption (AES-256) for data at rest and TLS 1.3 for data in transit. Our infrastructure undergoes continuous automated security scanning and annual third-party penetration testing to ensure adherence to our "safety-first" operational protocol.'
      ]
    },
  ];

  const rights = [
    'Request access to your stored data',
    'Request correction of inaccurate information',
    'Request deletion of your account and data',
    'Opt-out of non-essential communications'
  ];

  return (
    <SafeAreaView className="flex-1 bg-background">
      <SafeAreaView className="flex-grow flex" edges={['top', 'left', 'right', 'bottom']}>
        {/* Header toolbar */}
        <View className="px-6 h-16 flex-row items-center border-b border-border justify-between">
          <View className="flex-row items-center">
            <TouchableOpacity 
              onPress={() => router.back()}
              className="w-10 h-10 rounded-xl bg-muted items-center justify-center border border-border"
            >
              <Ionicons name="arrow-back" size={20} color={isDark ? 'white' : 'black'} />
            </TouchableOpacity>
            <Text className="text-foreground text-xl font-bold ml-4">Privacy Policy</Text>
          </View>
          <View className="flex-row items-center space-x-1.5">
            <Ionicons name="shield-checkmark" size={20} color={themePrimary} />
            <Text className="text-foreground font-black text-sm">TrustPay</Text>
          </View>
        </View>

        {/* Scrollable body */}
        <ScrollView 
          className="flex-1 px-6 pt-6" 
          contentContainerStyle={{ paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
        >
          <View className="mb-6">
            <Text className="text-muted-foreground text-xs font-semibold">Last Updated: October 26, 2023</Text>
          </View>

          <View className="space-y-6 gap-6">
            {sections.map((section) => (
              <View key={section.id} className="bg-card border border-border rounded-[24px] p-5 shadow-xs">
                <View className="flex-row items-center mb-4">
                  <View className="w-9 h-9 rounded-xl bg-primary/10 items-center justify-center mr-3">
                    <Ionicons name={section.icon as any} size={18} color={themePrimary} />
                  </View>
                  <Text className="text-foreground text-lg font-bold">{section.title}</Text>
                </View>

                {section.content.map((p, index) => (
                  <Text key={index} className="text-muted-foreground text-sm leading-5 mb-3 last:mb-0">
                    {p}
                  </Text>
                ))}

                {section.points && (
                  <View className="mt-2 space-y-2">
                    {section.points.map((pt, ptIdx) => (
                      <View key={ptIdx} className="flex-row items-start pl-2">
                        <View className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 mr-2" />
                        <Text className="text-muted-foreground text-sm flex-1 leading-5">{pt}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            ))}

            {/* Rights section */}
            <View className="bg-card border border-border rounded-[24px] p-5 shadow-xs">
              <View className="flex-row items-center mb-4">
                <View className="w-9 h-9 rounded-xl bg-primary/10 items-center justify-center mr-3">
                  <Ionicons name="scale-outline" size={18} color={themePrimary} />
                </View>
                <Text className="text-foreground text-lg font-bold">Your Rights</Text>
              </View>
              
              <Text className="text-muted-foreground text-sm leading-5 mb-4">
                You maintain complete control over your personal data. Depending on your jurisdiction (e.g., GDPR, CCPA), you have the right to:
              </Text>

              <View className="grid grid-cols-1 gap-2.5">
                {rights.map((right, rIdx) => (
                  <View key={rIdx} className="flex-row items-center bg-muted/60 px-4 py-3 rounded-xl border border-border/80">
                    <Ionicons name="checkmark-circle" size={16} color={themePrimary} />
                    <Text className="text-foreground text-xs font-semibold ml-2.5">{right}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Support section */}
            <View className="border-t border-border pt-6 flex-col items-center">
              <Text className="text-foreground text-lg font-bold mb-1">Questions or Concerns?</Text>
              <Text className="text-muted-foreground text-xs text-center mb-5 leading-4">
                Our specialized privacy team is available 24/7 to assist you.
              </Text>
              <TouchableOpacity 
                onPress={() => router.push({ pathname: '/contact', params: { category: 'support', subject: 'Privacy Policy Inquiry' } })}
                className="bg-primary/10 border border-primary/20 h-14 px-6 rounded-2xl items-center justify-center flex-row active:bg-primary/20 w-full"
              >
                <Ionicons name="mail" size={18} color={themePrimary} />
                <Text className="text-primary font-bold text-sm ml-2">Contact Privacy Team</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </SafeAreaView>
  );
}
