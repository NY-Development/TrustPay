import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from 'nativewind';

const EFFECTIVE_DATE = 'July 8, 2026';
const COMPANY = 'NY-Development';
const APP_NAME = 'TrustPay';
const SUPPORT_EMAIL = 'legal@trustpay.app';
const JURISDICTION = 'Federal Democratic Republic of Ethiopia';

type SectionItem = {
  id: string;
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  paragraphs: string[];
  bullets?: string[];
};

const sections: SectionItem[] = [
  {
    id: 'acceptance',
    icon: 'checkmark-circle-outline',
    title: '1. Acceptance of Terms',
    paragraphs: [
      `These Terms of Use ("Terms") constitute a legally binding agreement between you ("User", "you", or "your") and ${COMPANY} ("Company", "we", "us", or "our"), the operator of the ${APP_NAME} platform.`,
      'By creating an account, accessing, or using any part of the Service — including the mobile application, web dashboard, and API endpoints — you acknowledge that you have read, understood, and agree to be bound by these Terms and our Privacy Policy.',
      'If you do not agree to these Terms, you must immediately cease all use of the Service. We reserve the right to refuse service to anyone for any reason at any time.',
    ],
  },
  {
    id: 'eligibility',
    icon: 'person-circle-outline',
    title: '2. Eligibility',
    paragraphs: [
      'To use the Service, you must:',
    ],
    bullets: [
      'Be at least 18 years of age or the age of legal majority in your jurisdiction.',
      'Be a registered business entity or authorized representative of one, operating within the Ethiopian financial ecosystem.',
      'Provide accurate, truthful, and complete registration information, including your full legal name exactly as it appears on your settlement bank account(s).',
      'Maintain the security and confidentiality of your account credentials. You are solely responsible for all activities that occur under your account.',
    ],
  },
  {
    id: 'service-description',
    icon: 'construct-outline',
    title: '3. Service Description',
    paragraphs: [
      `${APP_NAME} is a payment verification and receipt intelligence platform. The Service includes, but is not limited to:`,
    ],
    bullets: [
      'Transaction Reference Verification: Validating payment references against banking settlement records via the Verify.ET API gateway.',
      'On-Device AI Receipt Processing: Using local machine learning models (ExecuTorch, ML Kit) to extract reference numbers, amounts, and merchant details from receipt screenshots — processed entirely on-device.',
      'Subscription Access Control: Managing merchant subscription plans (monthly/yearly) with access gating for premium features.',
      'Business Analytics & Audit: AI-driven financial insights, spending trend analysis, and anomaly detection dashboards.',
      'Push Notifications: Critical account alerts, verification results, and subscription reminders.',
    ],
  },
  {
    id: 'what-we-are-not',
    icon: 'close-circle-outline',
    title: '4. What TrustPay Is NOT',
    paragraphs: [
      'It is critical that you understand the following limitations of the Service:',
    ],
    bullets: [
      `${APP_NAME} is NOT a bank, money transfer operator, or payment processor. We do not hold, transfer, or settle funds.`,
      `${APP_NAME} does NOT guarantee the accuracy, completeness, or timeliness of information returned by third-party verification APIs (Verify.ET). Verification results are provided "as-is" from the banking partner.`,
      `${APP_NAME} does NOT serve as a legal arbiter in payment disputes. Verification results are informational tools — not legal proof of payment.`,
      `${APP_NAME} does NOT provide financial, legal, or tax advice. AI-generated insights and categorizations are automated suggestions and should not replace professional consultation.`,
    ],
  },
  {
    id: 'accounts',
    icon: 'key-outline',
    title: '5. User Accounts & Settlement Registration',
    paragraphs: [
      'When you register, you must provide your full legal name exactly as it appears on your linked banking settlement accounts. This is required because:',
    ],
    bullets: [
      'Verification results compare receiver names against your registered identity. Mismatched names will cause verifications to fail.',
      'You may register multiple settlement accounts across supported providers (CBE, BOA, Telebirr, Dashen, Awash, M-Pesa, CBE Birr).',
      'You are solely responsible for keeping your settlement account information up to date. Outdated or incorrect account numbers may lead to failed verifications.',
      'Account sharing is strictly prohibited. Each account must represent a single, identifiable merchant or business entity.',
      'We reserve the right to suspend or terminate accounts that exhibit patterns consistent with fraud, abuse, or violation of these Terms.',
    ],
  },
  {
    id: 'subscriptions',
    icon: 'card-outline',
    title: '6. Subscriptions & Billing',
    paragraphs: [
      `${APP_NAME} operates on a subscription-based model. Key billing terms include:`,
    ],
    bullets: [
      'Plans: Monthly (100 ETB) and Yearly (1,000 ETB) plans are available. Pricing is subject to change with 30 days advance notice.',
      'Billing Cycle: Subscriptions auto-renew at the end of each billing period unless cancelled before the renewal date.',
      'Refund Policy: Due to the transactional nature of verification API polling costs, active subscription charges are non-refundable. You may cancel at any time to prevent future charges.',
      'Grace Period: Upon subscription expiration, you will have a 3-day grace period during which read-only access to historical verifications is maintained before access gating activates.',
      'Free Trial: If offered, free trial periods are limited to one per user/device. Abuse of trial periods (e.g., creating multiple accounts) will result in account termination.',
    ],
  },
  {
    id: 'acceptable-use',
    icon: 'thumbs-up-outline',
    title: '7. Acceptable Use Policy',
    paragraphs: [
      'You agree NOT to use the Service to:',
    ],
    bullets: [
      'Submit fabricated, manipulated, or fraudulent transaction references for verification.',
      'Attempt to reverse-engineer, decompile, or extract proprietary algorithms, AI models, or source code from the application.',
      'Circumvent subscription access controls, rate limits, or security mechanisms.',
      'Use automated scripts, bots, or crawlers to access the Service without express written permission.',
      'Impersonate another person, business, or entity.',
      'Transmit malware, viruses, or any code designed to disrupt, damage, or gain unauthorized access to our systems.',
      'Violate any applicable local, national, or international law or regulation.',
      'Use the Service for money laundering, terrorist financing, or any other illegal financial activity.',
    ],
  },
  {
    id: 'ip',
    icon: 'bulb-outline',
    title: '8. Intellectual Property',
    paragraphs: [
      `All content, software, AI models, algorithms, trademarks, logos, and documentation associated with ${APP_NAME} are the exclusive property of ${COMPANY} and are protected by Ethiopian and international intellectual property laws.`,
      'Your subscription grants you a limited, non-exclusive, non-transferable, revocable license to use the Service for its intended purpose. This license does not convey any ownership rights.',
      'User-generated content (e.g., receipt images, verification requests) remains your property. By using the Service, you grant us a limited license to process such content solely for the purpose of providing the Service.',
    ],
  },
  {
    id: 'limitation',
    icon: 'warning-outline',
    title: '9. Limitation of Liability',
    paragraphs: [
      `TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, ${COMPANY.toUpperCase()} SHALL NOT BE LIABLE FOR:`,
    ],
    bullets: [
      'Any indirect, incidental, special, consequential, or punitive damages arising from your use of or inability to use the Service.',
      'Losses resulting from inaccurate verification results returned by third-party banking APIs.',
      'Financial decisions made based on AI-generated insights, categorizations, or anomaly reports.',
      'Unauthorized access to your account resulting from your failure to maintain credential security.',
      'Service interruptions caused by force majeure events, including but not limited to natural disasters, government actions, internet failures, or third-party API outages.',
      `In no event shall ${COMPANY}'s total aggregate liability exceed the amount you have paid for the Service in the 12 months preceding the claim.`,
    ],
  },
  {
    id: 'indemnification',
    icon: 'shield-outline',
    title: '10. Indemnification',
    paragraphs: [
      `You agree to indemnify, defend, and hold harmless ${COMPANY}, its officers, directors, employees, and agents from and against any claims, liabilities, damages, losses, and expenses (including reasonable legal fees) arising from:`,
    ],
    bullets: [
      'Your use or misuse of the Service.',
      'Your violation of these Terms or any applicable law.',
      'Your infringement of any third-party rights.',
      'Content or data you submit through the Service.',
    ],
  },
  {
    id: 'termination',
    icon: 'log-out-outline',
    title: '11. Termination',
    paragraphs: [
      'We may suspend or terminate your access to the Service, without prior notice, if:',
    ],
    bullets: [
      'You violate these Terms or our Acceptable Use Policy.',
      'Your account exhibits suspicious activity consistent with fraud or abuse.',
      'You fail to maintain an active subscription beyond the grace period.',
      'Required by law enforcement or regulatory authorities.',
    ],
  },
  {
    id: 'modifications',
    icon: 'create-outline',
    title: '12. Modifications to Terms',
    paragraphs: [
      'We reserve the right to modify these Terms at any time. When material changes are made, we will provide at least 14 days advance notice via in-app notification or email. Continued use of the Service after the effective date of changes constitutes acceptance of the revised Terms.',
      'If you disagree with any changes, your sole remedy is to terminate your account and discontinue use of the Service.',
    ],
  },
  {
    id: 'governing',
    icon: 'flag-outline',
    title: '13. Governing Law & Dispute Resolution',
    paragraphs: [
      `These Terms are governed by the laws of the ${JURISDICTION}. Any disputes arising from or relating to these Terms or the Service shall be resolved through:`,
    ],
    bullets: [
      'Informal Resolution: You agree to first attempt to resolve any dispute by contacting us at legal@trustpay.app. We will endeavor to resolve the dispute within 30 business days.',
      'Arbitration: If informal resolution fails, disputes shall be submitted to binding arbitration under the rules of the Ethiopian Arbitration and Conciliation Center in Addis Ababa.',
      'Jurisdiction: The courts of Addis Ababa shall have exclusive jurisdiction for any matters not subject to arbitration.',
    ],
  },
  {
    id: 'severability',
    icon: 'git-branch-outline',
    title: '14. Severability',
    paragraphs: [
      'If any provision of these Terms is found to be unenforceable or invalid by a court of competent jurisdiction, the remaining provisions shall continue in full force and effect. The unenforceable provision shall be modified to the minimum extent necessary to make it enforceable while preserving its original intent.',
    ],
  },
];

export default function TermsOfUseScreen() {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const router = useRouter();
  const accent = isDark ? '#3b82f6' : '#003ec7';

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top', 'left', 'right', 'bottom']}>
      {/* Header */}
      <View className="px-6 h-16 flex-row items-center border-b border-border justify-between">
        <View className="flex-row items-center">
          <TouchableOpacity
            onPress={() => router.back()}
            className="w-10 h-10 rounded-xl bg-muted items-center justify-center border border-border"
          >
            <Ionicons name="arrow-back" size={20} color={isDark ? 'white' : 'black'} />
          </TouchableOpacity>
          <Text className="text-foreground text-xl font-bold ml-4">Terms of Use</Text>
        </View>
        <View className="flex-row items-center space-x-1.5">
          <Ionicons name="document-text" size={20} color={accent} />
          <Text className="text-foreground font-black text-sm">TrustPay</Text>
        </View>
      </View>

      {/* Body */}
      <ScrollView
        className="flex-1 px-6 pt-6"
        contentContainerStyle={{ paddingBottom: 48 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Effective date badge */}
        <View className="flex-row items-center mb-6">
          <View className="bg-primary/10 px-3 py-1.5 rounded-full">
            <Text className="text-primary text-xs font-bold">Effective: {EFFECTIVE_DATE}</Text>
          </View>
        </View>

        <View className="gap-5">
          {sections.map((s) => (
            <View key={s.id} className="bg-card border border-border rounded-[24px] p-5 shadow-xs">
              <View className="flex-row items-center mb-4">
                <View className="w-9 h-9 rounded-xl bg-primary/10 items-center justify-center mr-3">
                  <Ionicons name={s.icon} size={18} color={accent} />
                </View>
                <Text className="text-foreground text-lg font-bold flex-1">{s.title}</Text>
              </View>

              {s.paragraphs.map((p, i) => (
                <Text key={i} className="text-muted-foreground text-sm leading-6 mb-3">
                  {p}
                </Text>
              ))}

              {s.bullets && (
                <View className="mt-1 gap-2.5">
                  {s.bullets.map((b, bi) => {
                    const colonIdx = b.indexOf(': ');
                    const hasLabel = colonIdx > 0 && colonIdx < 40;
                    const label = hasLabel ? b.substring(0, colonIdx) : null;
                    const desc = hasLabel ? b.substring(colonIdx + 2) : b;
                    return (
                      <View key={bi} className="flex-row items-start pl-1">
                        <View className="w-1.5 h-1.5 rounded-full bg-primary mt-2 mr-2.5" />
                        <Text className="text-muted-foreground text-sm flex-1 leading-5">
                          {label ? (
                            <>
                              <Text className="text-foreground font-semibold">{label}: </Text>
                              {desc}
                            </>
                          ) : (
                            desc
                          )}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              )}
            </View>
          ))}

          {/* Contact section */}
          <View className="border-t border-border pt-6 flex-col items-center mt-2">
            <Text className="text-foreground text-lg font-bold mb-1">Legal Questions?</Text>
            <Text className="text-muted-foreground text-xs text-center mb-1 leading-4">
              For questions regarding these Terms of Use, contact our Legal Team:
            </Text>
            <Text className="text-primary text-sm font-bold mb-5">{SUPPORT_EMAIL}</Text>
            <TouchableOpacity
              onPress={() => Linking.openURL(`mailto:${SUPPORT_EMAIL}?subject=Terms%20of%20Use%20Inquiry`)}
              className="bg-primary/10 border border-primary/20 h-14 px-6 rounded-2xl items-center justify-center flex-row active:bg-primary/20 w-full"
            >
              <Ionicons name="mail" size={18} color={accent} />
              <Text className="text-primary font-bold text-sm ml-2">Contact Legal Team</Text>
            </TouchableOpacity>
          </View>

          {/* Governing law footer */}
          <View className="bg-muted/40 border border-border rounded-2xl p-4 mt-2">
            <Text className="text-muted-foreground text-xs leading-5 text-center">
              © 2024–2026 {COMPANY}. All rights reserved. These Terms constitute the entire agreement between you and {COMPANY} regarding the use of the {APP_NAME} Service, superseding any prior agreements.
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
