import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from 'nativewind';
import { useTranslation } from 'react-i18next'; // 👈 Import Translation Hook

export default function PrivacyPolicyScreen() {
  const { t } = useTranslation(); // 👈 Initialize Translation
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const router = useRouter();

  const themePrimary = isDark ? '#3b82f6' : '#003ec7';

  const sections = [
    {
      id: 'collection',
      icon: 'document-text-outline',
      title: t('privacy.collectionTitle'),
      content: [
        t('privacy.collectionContent1'),
        t('privacy.collectionContent2')
      ]
    },
    {
      id: 'usage',
      icon: 'stats-chart-outline',
      title: t('privacy.usageTitle'),
      content: [
        t('privacy.usageContent')
      ],
      points: [
        t('privacy.usagePoint1'),
        t('privacy.usagePoint2'),
        t('privacy.usagePoint3')
      ]
    },
    {
      id: 'sharing',
      icon: 'people-outline',
      title: t('privacy.sharingTitle'),
      content: [
        t('privacy.sharingContent')
      ]
    },
    {
      id: 'security',
      icon: 'lock-closed-outline',
      title: t('privacy.securityTitle'),
      content: [
        t('privacy.securityContent')
      ]
    },
  ];

  const rights = [
    t('privacy.right1'),
    t('privacy.right2'),
    t('privacy.right3'),
    t('privacy.right4')
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
            <Text className="text-foreground text-xl font-bold ml-4">{t('privacy.screenTitle')}</Text>
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
            <Text className="text-muted-foreground text-xs font-semibold">{t('privacy.lastUpdated')}</Text>
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
                <Text className="text-foreground text-lg font-bold">{t('privacy.rightsTitle')}</Text>
              </View>
              
              <Text className="text-muted-foreground text-sm leading-5 mb-4">
                {t('privacy.rightsDesc')}
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
              <Text className="text-foreground text-lg font-bold mb-1">{t('privacy.questionsTitle')}</Text>
              <Text className="text-muted-foreground text-xs text-center mb-5 leading-4">
                {t('privacy.questionsDesc')}
              </Text>
              <TouchableOpacity 
                onPress={() => router.push({ pathname: '/contact', params: { category: 'support', subject: t('privacy.inquirySubject') } })}
                className="bg-primary/10 border border-primary/20 h-14 px-6 rounded-2xl items-center justify-center flex-row active:bg-primary/20 w-full"
              >
                <Ionicons name="mail" size={18} color={themePrimary} />
                <Text className="text-primary font-bold text-sm ml-2">{t('privacy.contactBtn')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </SafeAreaView>
  );
}