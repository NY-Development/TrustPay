import React from 'react';
import { Link } from 'react-router-dom';

const EFFECTIVE_DATE = 'July 8, 2026';
const COMPANY = 'NY-Development';
const APP_NAME = 'TrustPay';
const SECURITY_EMAIL = 'security@trustpay.app';

type Section = {
  id: string;
  icon: string;
  title: string;
  paragraphs: string[];
  bullets?: string[];
};

const sections: Section[] = [
  {
    id: 'commitment',
    icon: 'verified_user',
    title: 'Our Security Commitment',
    paragraphs: [
      `At ${APP_NAME}, security is the foundational principle upon which every line of code, every API, and every infrastructure decision is built. As a platform handling sensitive financial verification data for Ethiopian merchants, we hold ourselves to the highest standards.`,
      'This page describes the technical and organizational measures we employ to protect your data, what our responsibilities are, and what falls under your responsibility as a user.',
    ],
  },
  {
    id: 'encryption',
    icon: 'lock',
    title: '1. Encryption & Data Protection',
    paragraphs: ['Multiple layers of encryption protect your data at all times:'],
    bullets: [
      'TLS 1.3 Transport Encryption: All communications use TLS 1.3. Older protocols (TLS 1.0, 1.1, SSL) are disabled.',
      'Password Hashing: Passwords are hashed using bcrypt (cost factor 12) with per-user random salts.',
      'Database Encryption: MongoDB Atlas provides AES-256 encryption at rest for all stored data.',
      'JWT Token Security: Tokens signed with RS256. Expire after 7 days; invalidated on logout.',
      'OTP Security: Cryptographically secure random generation; auto-expire after 10 minutes via TTL indexes.',
    ],
  },
  {
    id: 'ondevice',
    icon: 'smartphone',
    title: '2. On-Device AI Security',
    paragraphs: ['Privacy-first approach to AI processing:'],
    bullets: [
      'Local-First Processing: Receipts are processed using on-device AI (ExecuTorch Llama 3.2, ML Kit). Screenshots never leave your device during OCR.',
      'No Cloud Upload: No image data transmitted to our servers unless you explicitly initiate cloud verification.',
      'Model Sandboxing: AI model files stored within application sandbox, inaccessible to other apps.',
      'Heuristic Fallback: When models unavailable, rule-based parsing runs entirely on-device.',
      'No Training on User Data: We do not use your data to train or fine-tune AI models.',
    ],
  },
  {
    id: 'infrastructure',
    icon: 'dns',
    title: '3. Infrastructure Security',
    paragraphs: ['Defense-in-depth architecture:'],
    bullets: [
      'Cloud Hosting: Enterprise-grade infrastructure with automated failover and load balancing.',
      'Network Isolation: Databases in VPCs, not directly accessible from public internet.',
      'Automated Backups: Every 6 hours with point-in-time recovery; encrypted and geo-separated.',
      'Rate Limiting: API endpoints enforce rate limits against abuse and DDoS.',
      'Input Validation: Zod schemas at controller level prevent injection attacks.',
      'Dependency Management: Regular audits and automated vulnerability scanning.',
    ],
  },
  {
    id: 'access',
    icon: 'admin_panel_settings',
    title: '4. Access Control',
    paragraphs: ['Strict access policies:'],
    bullets: [
      'RBAC: Role-based permissions. Users access only their own data; admins are audit-logged.',
      'Biometric Auth: Fingerprint and face recognition processed by device OS (iOS Keychain / Android Keystore).',
      'Admin Audit Trail: All admin actions logged immutably with timestamps and actor details.',
      'Session Management: JWT expires after 7 days. Logout explicitly invalidates tokens.',
      'Least Privilege: Internal team access limited to role-specific systems with MFA required.',
    ],
  },
  {
    id: 'third-party',
    icon: 'link',
    title: '5. Third-Party Security',
    paragraphs: ['All third-party services are carefully vetted:'],
    bullets: [
      'Verify.ET API: Only reference number and provider identifier shared — no account details or names.',
      'Brevo SMTP: Transactional emails only. No marketing data exchanged.',
      'Expo Push: Tokens stored securely; notifications never contain sensitive financial data.',
      'No Analytics Trackers: No Google Analytics, Facebook Pixel, or third-party behavior tracking.',
    ],
  },
  {
    id: 'our-responsibility',
    icon: 'task_alt',
    title: '6. Our Responsibility',
    paragraphs: [`${COMPANY} is responsible for:`],
    bullets: [
      'Implementing and maintaining industry-standard security measures.',
      'Notifying affected users within 72 hours of discovering a data breach.',
      'Regularly reviewing and updating security practices.',
      'Vetting third-party service providers before integration.',
      'Transparent disclosure via this Security page, Privacy Policy, and Terms of Use.',
      'Properly disposing of data upon account deletion.',
      'Training our team on secure coding practices.',
    ],
  },
  {
    id: 'not-responsible',
    icon: 'error_outline',
    title: '7. What We Are NOT Responsible For',
    paragraphs: [`Certain risks fall outside our control. ${COMPANY} is NOT responsible for:`],
    bullets: [
      'Credential Compromise Due to User Negligence: Sharing passwords, weak credentials, or auto-login on shared devices.',
      'Device-Level Breaches: Rooted/jailbroken devices or malware may expose on-device data.',
      'Phishing Attacks: We never ask for passwords via email/SMS. Credentials shared with phishing sites are your responsibility.',
      'Third-Party API Accuracy: Verify.ET results are provided as-is from banking partners.',
      'Network Interception: Using the Service on compromised networks may expose metadata despite TLS.',
      'Data Loss on User Devices: Factory resets or app uninstalls cannot be recovered from our servers.',
    ],
  },
  {
    id: 'user-responsibility',
    icon: 'pan_tool',
    title: '8. Your Security Responsibilities',
    paragraphs: ['Security is a shared responsibility:'],
    bullets: [
      'Use Strong, Unique Passwords: At least 8 characters, different from other services.',
      'Enable Biometric Login: Additional security layer when device supports it.',
      'Keep Devices Updated: Latest OS and app versions for security patches.',
      'Monitor Your Account: Review verification history for unauthorized activity.',
      'Protect Your Device: Screen lock, no rooting/jailbreaking, official app stores only.',
      'Report Security Issues: Email security@trustpay.app for any concerns.',
    ],
  },
  {
    id: 'incident',
    icon: 'campaign',
    title: '9. Incident Response',
    paragraphs: ['In the event of a security incident:'],
    bullets: [
      'Detection: Automated monitoring and alerting for unusual activity.',
      'Containment: Immediate isolation of affected systems.',
      'Notification: Affected users notified within 72 hours with details and recommendations.',
      'Investigation: Thorough root cause analysis and preventive measures.',
      'Remediation: Rapid deployment of security patches and hardening.',
    ],
  },
  {
    id: 'disclosure',
    icon: 'bug_report',
    title: '10. Responsible Disclosure',
    paragraphs: [`Found a vulnerability? Report to ${SECURITY_EMAIL} with:`],
    bullets: [
      'Clear description and potential impact.',
      'Steps to reproduce.',
      'Supporting evidence (screenshots, logs).',
      'Please do not publicly disclose until we have investigated.',
      'We acknowledge reports within 48 hours.',
    ],
  },
];

export default function SecurityPage() {
  return (
    <div className="bg-[#faf8ff] dark:bg-[#0b0e14] text-[#131b2e] dark:text-white min-h-screen flex flex-col font-['Inter'] antialiased">
      {/* Header */}
      <nav className="fixed top-0 w-full z-50 bg-white/80 dark:bg-[#131b2e]/80 backdrop-blur-md border-b border-[#c2c6d9]/25 transition-colors">
        <div className="flex justify-between items-center px-8 py-4 max-w-[1100px] mx-auto w-full">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-[#004bca] flex items-center justify-center text-white">
              <span className="material-symbols-outlined text-[20px]">shield</span>
            </div>
            <div>
              <h1 className="text-md font-bold text-[#131b2e] dark:text-white leading-tight">Trust Pay</h1>
              <p className="text-[11px] text-[#54647a] dark:text-[#c2c6d9]/70">Verification Network</p>
            </div>
          </Link>
          <div className="flex items-center gap-4">
            <Link to="/privacy" className="text-[13px] font-medium text-[#54647a] dark:text-[#c2c6d9] hover:text-[#004bca] transition-colors">Privacy</Link>
            <Link to="/terms" className="text-[13px] font-medium text-[#54647a] dark:text-[#c2c6d9] hover:text-[#004bca] transition-colors">Terms</Link>
            <Link to="/login" className="text-[13px] font-semibold text-[#004bca] border border-[#004bca] px-4 py-2 rounded-xl hover:bg-[#f2f3ff] transition-all">Sign In</Link>
          </div>
        </div>
      </nav>

      <main className="flex-grow pt-[100px] pb-20 px-8">
        <div className="max-w-[900px] mx-auto">
          {/* Hero */}
          <div className="mb-12">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-[#004bca]/10 flex items-center justify-center">
                <span className="material-symbols-outlined text-[24px] text-[#004bca]">security</span>
              </div>
              <div>
                <h1 className="font-['Geist'] text-3xl font-bold">Security</h1>
                <p className="text-sm text-[#54647a] dark:text-[#c2c6d9]/70">Last Updated: {EFFECTIVE_DATE}</p>
              </div>
            </div>
          </div>

          {/* Sections */}
          <div className="space-y-8">
            {sections.map((s) => (
              <section
                key={s.id}
                id={s.id}
                className="bg-white dark:bg-[#131b2e] border border-[#c2c6d9]/30 dark:border-white/8 rounded-2xl p-8 shadow-xs hover:border-[#004bca]/30 transition-colors"
              >
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 rounded-xl bg-[#004bca]/8 flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-[20px] text-[#004bca]">{s.icon}</span>
                  </div>
                  <h2 className="font-['Geist'] text-xl font-bold">{s.title}</h2>
                </div>

                {s.paragraphs.map((p, i) => (
                  <p key={i} className="text-sm text-[#54647a] dark:text-[#c2c6d9] leading-relaxed mb-4">{p}</p>
                ))}

                {s.bullets && (
                  <ul className="space-y-3 mt-2">
                    {s.bullets.map((b, bi) => {
                      const colonIdx = b.indexOf(': ');
                      const hasLabel = colonIdx > 0 && colonIdx < 50;
                      const label = hasLabel ? b.substring(0, colonIdx) : null;
                      const desc = hasLabel ? b.substring(colonIdx + 2) : b;
                      return (
                        <li key={bi} className="flex items-start gap-3 text-sm">
                          <div className="w-1.5 h-1.5 rounded-full bg-[#004bca] mt-2 shrink-0" />
                          <span className="text-[#54647a] dark:text-[#c2c6d9] leading-relaxed">
                            {label ? (
                              <>
                                <strong className="text-[#131b2e] dark:text-white font-semibold">{label}: </strong>
                                {desc}
                              </>
                            ) : (
                              desc
                            )}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </section>
            ))}

            {/* Contact */}
            <div className="text-center py-10 border-t border-[#c2c6d9]/25 dark:border-white/5">
              <h3 className="font-['Geist'] text-xl font-bold mb-2">Report a Vulnerability</h3>
              <p className="text-sm text-[#54647a] dark:text-[#c2c6d9] mb-1">We take all reports seriously. Contact our Security Team:</p>
              <a href={`mailto:${SECURITY_EMAIL}`} className="text-[#004bca] font-bold text-lg hover:underline">{SECURITY_EMAIL}</a>
            </div>

            {/* Footer note */}
            <div className="bg-[#f2f3ff] dark:bg-white/3 border border-[#c2c6d9]/25 dark:border-white/5 rounded-xl p-6 text-center">
              <p className="text-xs text-[#54647a] dark:text-[#c2c6d9]/70 leading-relaxed">
                This Security page is provided for informational transparency and does not constitute a contractual guarantee. For binding obligations, refer to our <Link to="/privacy" className="text-[#004bca] hover:underline">Privacy Policy</Link> and <Link to="/terms" className="text-[#004bca] hover:underline">Terms of Use</Link>.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full py-8 bg-white dark:bg-[#131b2e] border-t border-[#c2c6d9]/20 dark:border-white/5">
        <div className="max-w-[900px] mx-auto px-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <span className="text-[11px] text-[#54647a] dark:text-[#c2c6d9]/50">© 2024–2026 {COMPANY}. All Rights Reserved.</span>
          <div className="flex gap-6">
            <Link to="/privacy" className="text-xs text-[#54647a] dark:text-[#c2c6d9] hover:text-[#004bca] transition-colors">Privacy</Link>
            <Link to="/terms" className="text-xs text-[#54647a] dark:text-[#c2c6d9] hover:text-[#004bca] transition-colors">Terms</Link>
            <Link to="/security" className="text-xs text-[#004bca] font-semibold">Security</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
