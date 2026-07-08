import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from 'nativewind';

const EFFECTIVE_DATE = 'July 8, 2026';
const COMPANY = 'NY-Development';
const APP_NAME = 'TrustPay';
const SUPPORT_EMAIL = 'privacy@trustpay.app';
const JURISDICTION = 'Federal Democratic Republic of Ethiopia';

// ─── Section Data ──────────────────────────────────────────────────────

type SectionItem = {
  id: string;
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  paragraphs: string[];
  bullets?: string[];
};

const sections: SectionItem[] = [
  {
    id: 'intro',
    icon: 'information-circle-outline',
    title: 'Introduction',
    paragraphs: [
      `${APP_NAME} ("we", "our", or "us"), operated by ${COMPANY}, provides a merchant-focused payment verification platform for the Ethiopian digital finance ecosystem. This Privacy Policy explains how we collect, use, disclose, and safeguard your personal information when you use our mobile application, web dashboard, and related services (collectively, the "Service").`,
      'By accessing or using the Service, you acknowledge that you have read, understood, and agree to be bound by this Privacy Policy. If you do not agree, you must discontinue use of the Service immediately.',
    ],
  },
  {
    id: 'collection',
    icon: 'document-text-outline',
    title: '1. Information We Collect',
    paragraphs: [
      'We collect information you provide directly, information generated through your usage, and limited information from third-party payment verification partners.',
    ],
    bullets: [
      'Account Registration Data: Full legal name (must match banking records), email address, and hashed password credentials.',
      'Settlement Account Data: Bank account numbers and wallet identifiers you register for verification matching (e.g., CBE, BOA, Telebirr, Dashen, Awash, M-Pesa account numbers).',
      'Transaction Verification Data: Payment reference numbers, transaction IDs, verification request timestamps, provider responses including payer name, receiver name, and amounts.',
      'Device & Usage Data: Device model, operating system version, app version, IP address, session duration, feature usage patterns, and crash reports.',
      'OCR & AI Processing Data: Receipt images you upload are processed locally on your device using on-device AI (ExecuTorch / ML Kit). Raw images are NOT transmitted to our servers unless you explicitly initiate a cloud verification.',
      'Communication Data: Support messages, feedback submissions, and email correspondence you send to us.',
      'Subscription & Billing Data: Subscription plan type, payment status, renewal dates, and transaction records for subscription purchases.',
    ],
  },
  {
    id: 'usage',
    icon: 'stats-chart-outline',
    title: '2. How We Use Your Information',
    paragraphs: [
      'We process your personal information only for legitimate business purposes directly related to providing and improving the Service:',
    ],
    bullets: [
      'Transaction Verification: Matching payment references against banking settlement records via Verify.ET API to confirm payer identity, amounts, and receiver account details.',
      'Account Management: Authenticating your identity, managing your subscription, and maintaining your settlement account registry.',
      'On-Device AI Processing: Running local inference models (Llama 3.2 via ExecuTorch) to extract reference numbers, categorize transactions, and generate business insights — entirely on your device.',
      'Fraud Prevention: Detecting duplicate submissions, anomalous transaction patterns, and potential reference manipulation.',
      'Service Improvement: Analyzing aggregated, anonymized usage patterns to improve user experience, optimize verification speed, and develop new features.',
      'Legal Compliance: Fulfilling obligations under Ethiopian financial regulations, anti-money laundering (AML) directives, and responding to lawful government requests.',
      'Communication: Sending critical account alerts, security notifications, subscription reminders, and support responses. We will never send marketing communications without your explicit opt-in consent.',
    ],
  },
  {
    id: 'sharing',
    icon: 'people-outline',
    title: '3. Information Sharing & Disclosure',
    paragraphs: [
      `${APP_NAME} does not sell, rent, or trade your personal data to third parties for marketing purposes. We share data only in the following limited circumstances:`,
    ],
    bullets: [
      'Payment Verification Partners: When you initiate a verification, we transmit the reference number and provider identifier to the Verify.ET API gateway to retrieve settlement status. Only the minimum data necessary for verification is shared.',
      'SMTP Email Service: We use Brevo (Sendinblue) SMTP relay for transactional emails (OTP codes, password resets, account alerts). Your email address is shared with Brevo solely for delivery.',
      'Legal Obligations: We may disclose information if required by law, court order, or governmental regulation, or if we believe disclosure is necessary to protect national security, enforce our Terms of Use, or protect the rights and safety of any person.',
      'Business Transfers: In the event of a merger, acquisition, or asset sale, your personal data may be transferred to the acquiring entity, subject to this Privacy Policy.',
      'Aggregated Analytics: We may share anonymized, aggregated statistics (e.g., total verifications processed, average verification time) that cannot reasonably identify any individual user.',
    ],
  },
  {
    id: 'retention',
    icon: 'time-outline',
    title: '4. Data Retention',
    paragraphs: [
      'We retain your personal information only as long as necessary to fulfill the purposes outlined in this policy:',
    ],
    bullets: [
      'Account Data: Retained for the lifetime of your account plus 30 days after deletion request to allow recovery.',
      'Verification Records: Transaction verification results are retained for 3 years to support dispute resolution and regulatory audits.',
      'OTP Codes: Automatically purged via MongoDB TTL indexes within 10 minutes of generation.',
      'Session Tokens: JWT tokens expire after 7 days. Refresh tokens are rotated and old tokens are invalidated immediately.',
      'AI-Processed Data: Receipt images processed by on-device AI are never stored on our servers. Local model inference data remains exclusively on your device.',
      'Support Correspondence: Retained for 2 years after ticket resolution for quality assurance purposes.',
    ],
  },
  {
    id: 'security',
    icon: 'lock-closed-outline',
    title: '5. Data Security',
    paragraphs: [
      'We implement industry-standard security measures to protect your data:',
    ],
    bullets: [
      'Encryption in Transit: All network communications use TLS 1.3 encryption. API endpoints enforce HTTPS exclusively.',
      'Encryption at Rest: Sensitive database fields (passwords, settlement account numbers) are hashed using bcrypt with per-user salts.',
      'Access Control: Role-based access control (RBAC) ensures only authorized personnel can access production databases. Admin actions are logged in immutable audit trails.',
      'Infrastructure: MongoDB Atlas with encryption at rest, automated backups, and network isolation via VPC peering.',
      'On-Device Security: AI models run entirely within the device sandbox. Biometric authentication (fingerprint/face) is handled natively and never transmitted to our servers.',
      'Vulnerability Management: We conduct periodic security reviews and apply dependency patches promptly.',
    ],
  },
  {
    id: 'rights',
    icon: 'shield-checkmark-outline',
    title: '6. Your Rights',
    paragraphs: [
      'Depending on your jurisdiction, you may have the following rights regarding your personal information:',
    ],
    bullets: [
      'Right to Access: Request a copy of all personal data we hold about you.',
      'Right to Rectification: Request correction of inaccurate or incomplete data.',
      'Right to Erasure: Request deletion of your account and associated data, subject to legal retention obligations.',
      'Right to Data Portability: Request your data in a structured, machine-readable format.',
      'Right to Object: Object to processing of your data for certain purposes.',
      'Right to Withdraw Consent: Where processing is based on consent, you may withdraw it at any time without affecting prior processing.',
      'Right to Lodge a Complaint: You may file a complaint with the relevant data protection authority in your jurisdiction.',
    ],
  },
  {
    id: 'children',
    icon: 'person-outline',
    title: '7. Children\'s Privacy',
    paragraphs: [
      `The Service is intended for merchants and business professionals aged 18 and older. We do not knowingly collect personal information from individuals under 18 years of age. If we become aware that we have inadvertently collected data from a minor, we will promptly delete such information and terminate the associated account.`,
    ],
  },
  {
    id: 'international',
    icon: 'globe-outline',
    title: '8. International Data Transfers',
    paragraphs: [
      `Your data is primarily stored and processed within infrastructure located in Africa and/or the European Economic Area. If data is transferred internationally (e.g., for cloud service provider operations), we ensure adequate protective measures are in place, including standard contractual clauses or equivalent safeguards recognized under applicable law.`,
    ],
  },
  {
    id: 'cookies',
    icon: 'browsers-outline',
    title: '9. Cookies & Tracking (Web Dashboard)',
    paragraphs: [
      'Our web dashboard uses strictly necessary cookies for authentication session management. We do not use advertising cookies, social media trackers, or any third-party analytics cookies that track individual users across websites.',
    ],
    bullets: [
      'Session Cookie: Maintains your authenticated session. Automatically cleared on logout or browser close.',
      'Theme Preference: Stores your dark/light mode preference locally via localStorage.',
      'No Third-Party Trackers: We do not embed Google Analytics, Facebook Pixel, or any similar tracking technologies.',
    ],
  },
  {
    id: 'changes',
    icon: 'create-outline',
    title: '10. Changes to This Policy',
    paragraphs: [
      `We may update this Privacy Policy periodically. When material changes are made, we will notify you via in-app notification, email, or a prominent notice on the Service at least 14 days prior to the change taking effect. Continued use of the Service after the effective date constitutes acceptance of the revised policy.`,
      `The "Last Updated" date at the top of this document reflects the most recent revision.`,
    ],
  },
];

// ─── Component ─────────────────────────────────────────────────────────

export default function PrivacyPolicyScreen() {
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
          <Text className="text-foreground text-xl font-bold ml-4">Privacy Policy</Text>
        </View>
        <View className="flex-row items-center space-x-1.5">
          <Ionicons name="shield-checkmark" size={20} color={accent} />
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
              {/* Section header */}
              <View className="flex-row items-center mb-4">
                <View className="w-9 h-9 rounded-xl bg-primary/10 items-center justify-center mr-3">
                  <Ionicons name={s.icon} size={18} color={accent} />
                </View>
                <Text className="text-foreground text-lg font-bold flex-1">{s.title}</Text>
              </View>

              {/* Paragraphs */}
              {s.paragraphs.map((p, i) => (
                <Text key={i} className="text-muted-foreground text-sm leading-6 mb-3">
                  {p}
                </Text>
              ))}

              {/* Bullets */}
              {s.bullets && (
                <View className="mt-1 gap-2.5">
                  {s.bullets.map((b, bi) => {
                    const [label, ...rest] = b.split(': ');
                    const desc = rest.join(': ');
                    return (
                      <View key={bi} className="flex-row items-start pl-1">
                        <View className="w-1.5 h-1.5 rounded-full bg-primary mt-2 mr-2.5" />
                        <Text className="text-muted-foreground text-sm flex-1 leading-5">
                          {desc ? (
                            <>
                              <Text className="text-foreground font-semibold">{label}: </Text>
                              {desc}
                            </>
                          ) : (
                            b
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
            <Text className="text-foreground text-lg font-bold mb-1">Questions or Concerns?</Text>
            <Text className="text-muted-foreground text-xs text-center mb-1 leading-4">
              For privacy-related inquiries, data access requests, or to exercise any of your rights, contact our Privacy Team:
            </Text>
            <Text className="text-primary text-sm font-bold mb-5">{SUPPORT_EMAIL}</Text>
            <TouchableOpacity
              onPress={() => Linking.openURL(`mailto:${SUPPORT_EMAIL}?subject=Privacy%20Inquiry`)}
              className="bg-primary/10 border border-primary/20 h-14 px-6 rounded-2xl items-center justify-center flex-row active:bg-primary/20 w-full"
            >
              <Ionicons name="mail" size={18} color={accent} />
              <Text className="text-primary font-bold text-sm ml-2">Contact Privacy Team</Text>
            </TouchableOpacity>
          </View>

          {/* Governing law */}
          <View className="bg-muted/40 border border-border rounded-2xl p-4 mt-2">
            <Text className="text-muted-foreground text-xs leading-5 text-center">
              This Privacy Policy is governed by and construed in accordance with the laws of the {JURISDICTION}. Any disputes arising from this policy shall be subject to the exclusive jurisdiction of the courts of Addis Ababa.
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}