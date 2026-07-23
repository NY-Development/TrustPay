import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from 'nativewind';

const EFFECTIVE_DATE = 'July 8, 2026';
const COMPANY = 'NY-Development';
const APP_NAME = 'TrustPay';
const SECURITY_EMAIL = 'nydevofficial@gmail.com';

type SectionItem = {
  id: string;
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  paragraphs: string[];
  bullets?: string[];
};

const sections: SectionItem[] = [
  {
    id: 'commitment',
    icon: 'shield-checkmark-outline',
    title: 'Our Security Commitment',
    paragraphs: [
      `At ${APP_NAME}, security is not an afterthought — it is the foundational principle upon which every line of code, every API, and every infrastructure decision is built. As a platform handling sensitive financial verification data for Ethiopian merchants, we hold ourselves to the highest standards of data protection.`,
      'This page describes the technical and organizational measures we employ to protect your data, what our responsibilities are, and what falls under your responsibility as a user.',
    ],
  },
  {
    id: 'encryption',
    icon: 'lock-closed-outline',
    title: '1. Encryption & Data Protection',
    paragraphs: [
      'We implement multiple layers of encryption to ensure your data is protected both in transit and at rest:',
    ],
    bullets: [
      'TLS 1.3 Transport Encryption: All communications between your device, our API servers, and third-party services (Verify.ET, Brevo SMTP) are encrypted using TLS 1.3 — the latest transport layer security protocol. Older protocols (TLS 1.0, 1.1, SSL) are disabled.',
      'Password Hashing: User passwords are never stored in plaintext. They are hashed using bcrypt with a cost factor of 12 and per-user random salts, making brute-force attacks computationally infeasible.',
      'Database Encryption: MongoDB Atlas provides AES-256 encryption at rest for all stored data, including verification records, branch configurations, employee profiles, and subscription details.',
      'JWT Token Security: Authentication tokens are signed using RS256 (RSA + SHA-256). Tokens expire after 7 days and cannot be reused after logout.',
      'OTP Security: One-time passwords for email verification and password resets are generated using cryptographically secure random number generators and automatically expire after 10 minutes via MongoDB TTL indexes.',
    ],
  },
  {
    id: 'ondevice',
    icon: 'phone-portrait-outline',
    title: '2. On-Device AI Security',
    paragraphs: [
      `${APP_NAME} utilizes a privacy-first approach to AI processing. Here's how we protect your data during AI operations:`,
    ],
    bullets: [
      'Local-First Processing: Receipt images are processed using on-device AI models (ExecuTorch with Llama 3.2, Google ML Kit Text Recognition). Your receipt screenshots never leave your device during OCR extraction.',
      'No Cloud Upload: Unless you explicitly initiate a cloud-based verification by submitting a reference number, no image data or extracted text is transmitted to our servers.',
      'Model Sandboxing: AI model files are stored within the application sandbox on your device and cannot be accessed by other applications.',
      'Heuristic Fallback: When AI models are unavailable (still downloading, device incompatible), the system falls back to rule-based heuristic parsing — still entirely on-device.',
      'No Training on User Data: We do not use your receipt images, OCR text, or verification data to train or fine-tune any AI models.',
    ],
  },
  {
    id: 'infrastructure',
    icon: 'server-outline',
    title: '3. Infrastructure Security',
    paragraphs: [
      'Our backend infrastructure is designed with defense-in-depth principles:',
    ],
    bullets: [
      'Cloud Hosting: Backend services run on enterprise-grade cloud infrastructure with automated failover, load balancing, and geographic redundancy.',
      'Network Isolation: Database instances are isolated within Virtual Private Clouds (VPCs) and are not directly accessible from the public internet. Access is restricted to whitelisted application servers.',
      'Automated Backups: Database backups are performed every 6 hours with point-in-time recovery capability. Backups are encrypted and stored in geographically separated locations.',
      'Rate Limiting: API endpoints enforce rate limiting to prevent abuse, brute-force attacks, and denial-of-service attempts.',
      'Input Validation: All incoming requests are validated using Zod schemas at the controller level, preventing SQL injection, NoSQL injection, and other injection attacks.',
      'Dependency Management: We regularly audit and update dependencies to patch known vulnerabilities using automated scanning tools.',
    ],
  },
  {
    id: 'access-control',
    icon: 'people-circle-outline',
    title: '4. Access Control & Branch Scoping',
    paragraphs: [
      'We enforce strict access control policies for both users and internal team members:',
    ],
    bullets: [
      'Role-Based Access Control (RBAC): The platform enforces role-based permissions. Business Owners have full organization access. Employee sub-accounts are strictly scoped and locked to their assigned branch, preventing access to other branches\' records.',
      'Owner-Managed Access: Owners can invite, deactivate, delete, and perform secure password resets for employee accounts working under their organization.',
      'Biometric Authentication: The mobile app supports fingerprint and facial recognition as alternative authentication methods, processed entirely by the device OS security framework (iOS Keychain / Android Keystore).',
      'Admin Audit Trail: All administrative actions (user lookups, branch setups, licensing checks) are logged in security audit trails.',
      'Session Management: JWT sessions expire after 7 days. Biometric sessions require re-authentication if security credentials change. Logout explicitly invalidates session tokens.',
      'Principle of Least Privilege: Internal team members have access only to the systems and data necessary for their specific role. Production database access requires multi-factor authentication and is logged.',
    ],
  },
  {
    id: 'third-party',
    icon: 'link-outline',
    title: '5. Third-Party Security',
    paragraphs: [
      'We carefully vet all third-party services integrated into the platform:',
    ],
    bullets: [
      'Verify.ET API: Payment verification requests transmit only the reference number and provider identifier — the minimum data necessary. We do not share user account details, names, or email addresses with Verify.ET.',
      'Brevo (Sendinblue) SMTP: Used exclusively for transactional emails (OTPs, employee invitations). Only the recipient email address and message content are shared. No marketing data is exchanged.',
      'Expo Push Notifications: Push tokens are generated by the device OS and stored securely. Notification payloads contain only message titles and body text — never sensitive financial data.',
      'No Analytics Trackers: We do not integrate Google Analytics, Facebook Pixel, Mixpanel, or any third-party user behavior tracking SDKs on the mobile app.',
    ],
  },
  {
    id: 'our-responsibility',
    icon: 'checkmark-done-circle-outline',
    title: '6. Our Responsibility',
    paragraphs: [
      `${COMPANY} is responsible for:`,
    ],
    bullets: [
      'Implementing and maintaining industry-standard security measures to protect your data.',
      'Promptly notifying affected users within 72 hours of discovering a data breach that may compromise personal information.',
      'Regularly reviewing and updating security practices to address emerging threats.',
      'Ensuring all third-party service providers meet our security standards before integration.',
      'Providing clear and transparent disclosure of our data practices through this Security page, our Privacy Policy, and Terms of Use.',
      'Properly disposing of data that is no longer needed or upon account deletion request.',
      'Training our development and operations team on secure coding practices and data handling procedures.',
    ],
  },
  {
    id: 'not-responsible',
    icon: 'alert-circle-outline',
    title: '7. What We Are NOT Responsible For',
    paragraphs: [
      `While we take extensive measures to protect your data, certain risks fall outside our ability to control. ${COMPANY} is NOT responsible for:`,
    ],
    bullets: [
      'Credential Compromise Due to User Negligence: If you share your password, enable auto-login on shared devices, or use weak/reused passwords, any resulting unauthorized access is your responsibility.',
      'Device-Level Breaches: If your mobile device is compromised (rooted, jailbroken, infected with malware), on-device data including locally stored AI models and cached verification results may be accessible to malicious software.',
      'Employee Actions: We are not responsible for how your authorized employees use the system, or for files and references they verified or deleted.',
      'Phishing Attacks: We will never ask for your password via email, SMS, or phone. If you disclose credentials to a phishing site impersonating TrustPay, we cannot be held responsible for resulting unauthorized access.',
      'Third-Party API Accuracy: Verification results returned by Verify.ET are provided as-is. We cannot guarantee the accuracy, completeness, or timeliness of information from external banking verification systems.',
      'Network Interception on Unprotected Networks: While we enforce TLS for all connections, using the Service on compromised Wi-Fi networks or through malicious proxy servers may expose metadata.',
      'Data Loss on User Devices: If you lose your device, factory reset without backup, or uninstall the app, locally cached data cannot be recovered from our servers.',
    ],
  },
  {
    id: 'user-responsibility',
    icon: 'hand-left-outline',
    title: '8. Your Security Responsibilities',
    paragraphs: [
      'Security is a shared responsibility. As a user, you play a critical role:',
    ],
    bullets: [
      'Use Strong, Unique Passwords: Your TrustPay password should be at least 8 characters and different from passwords used on other services.',
      'Manage Employee Accounts Safely: As an Owner, review and update employee access, deactivate accounts immediately if an employee leaves, and execute password resets securely.',
      'Enable Biometric Login: If your device supports it, enable biometric authentication for an additional layer of security.',
      'Keep Your Device Updated: Ensure your mobile device operating system and the TrustPay app are always running the latest version.',
      'Monitor Your Account: Regularly review your verification history and employee activity logs. Report suspicious transactions immediately.',
      'Protect Your Device: Use a screen lock, do not root/jailbreak your device, and install apps only from official sources (Google Play Store, Apple App Store).',
      'Report Security Issues: If you discover a security vulnerability, please report it responsibly to nydevofficial@gmail.com.',
    ],
  },
  {
    id: 'incident-response',
    icon: 'megaphone-outline',
    title: '9. Incident Response',
    paragraphs: [
      'In the event of a security incident:',
    ],
    bullets: [
      'Detection: We employ automated monitoring and alerting systems to detect unusual activity patterns, unauthorized access attempts, and system anomalies.',
      'Containment: Upon detection, our response team will immediately work to contain the incident, isolate affected systems, and prevent further unauthorized access.',
      'Notification: If a breach involves personal data, we will notify affected users within 72 hours with details of what occurred, what data may have been affected, and recommended protective actions.',
      'Investigation: We conduct thorough post-incident investigations to determine root cause and implement preventive measures.',
      'Remediation: Security patches and hardening measures are deployed as rapidly as possible following an incident.',
    ],
  },
  {
    id: 'vulnerability',
    icon: 'bug-outline',
    title: '10. Responsible Disclosure',
    paragraphs: [
      `If you discover a security vulnerability in ${APP_NAME}, we encourage responsible disclosure. Please report findings to ${SECURITY_EMAIL} with:`,
    ],
    bullets: [
      'A clear description of the vulnerability and its potential impact.',
      'Steps to reproduce the issue.',
      'Any supporting evidence (screenshots, logs, proof of concept).',
      'Please do not publicly disclose the vulnerability until we have had reasonable time to investigate and address it.',
      'We will acknowledge receipt of your report within 48 hours and provide status updates during our investigation.',
    ],
  },
];

export default function SecurityScreen() {
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
          <Text className="text-foreground text-xl font-bold ml-4">Security</Text>
        </View>
        <View className="flex-row items-center space-x-1.5">
          <Ionicons name="lock-closed" size={20} color={accent} />
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
            <Text className="text-primary text-xs font-bold">Last Updated: {EFFECTIVE_DATE}</Text>
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
                    const hasLabel = colonIdx > 0 && colonIdx < 50;
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
            <Text className="text-foreground text-lg font-bold mb-1">Report a Vulnerability</Text>
            <Text className="text-muted-foreground text-xs text-center mb-1 leading-4">
              Found a security issue? We take all reports seriously and will respond within 48 hours.
            </Text>
            <Text className="text-primary text-sm font-bold mb-5">{SECURITY_EMAIL}</Text>
            <TouchableOpacity
              onPress={() => Linking.openURL(`mailto:${SECURITY_EMAIL}?subject=Security%20Vulnerability%20Report`)}
              className="bg-primary/10 border border-primary/20 h-14 px-6 rounded-2xl items-center justify-center flex-row active:bg-primary/20 w-full"
            >
              <Ionicons name="mail" size={18} color={accent} />
              <Text className="text-primary font-bold text-sm ml-2">Contact Security Team</Text>
            </TouchableOpacity>
          </View>

          {/* Footer */}
          <View className="bg-muted/40 border border-border rounded-2xl p-4 mt-2">
            <Text className="text-muted-foreground text-xs leading-5 text-center">
              This Security page is provided for informational transparency. It does not constitute a contractual guarantee. For binding data protection obligations, refer to our Privacy Policy and Terms of Use.
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
