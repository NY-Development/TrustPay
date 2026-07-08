import React from 'react';
import { Link } from 'react-router-dom';

const EFFECTIVE_DATE = 'July 8, 2026';
const COMPANY = 'NY-Development';
const APP_NAME = 'TrustPay';
const SUPPORT_EMAIL = 'privacy@trustpay.app';
const JURISDICTION = 'Federal Democratic Republic of Ethiopia';

type Section = {
  id: string;
  icon: string;
  title: string;
  paragraphs: string[];
  bullets?: string[];
};

const sections: Section[] = [
  {
    id: 'intro',
    icon: 'info',
    title: 'Introduction',
    paragraphs: [
      `${APP_NAME} ("we", "our", or "us"), operated by ${COMPANY}, provides a merchant-focused payment verification platform for the Ethiopian digital finance ecosystem. This Privacy Policy explains how we collect, use, disclose, and safeguard your personal information when you use our mobile application, web dashboard, and related services (collectively, the "Service").`,
      'By accessing or using the Service, you acknowledge that you have read, understood, and agree to be bound by this Privacy Policy. If you do not agree, you must discontinue use of the Service immediately.',
    ],
  },
  {
    id: 'collection',
    icon: 'description',
    title: '1. Information We Collect',
    paragraphs: ['We collect information you provide directly, information generated through your usage, and limited information from third-party payment verification partners.'],
    bullets: [
      'Account Registration Data: Full legal name (must match banking records), email address, and hashed password credentials.',
      'Settlement Account Data: Bank account numbers and wallet identifiers you register for verification matching (e.g., CBE, BOA, Telebirr, Dashen, Awash, M-Pesa).',
      'Transaction Verification Data: Payment reference numbers, transaction IDs, verification request timestamps, provider responses including payer name, receiver name, and amounts.',
      'Device & Usage Data: Device model, OS version, app version, IP address, session duration, feature usage patterns, and crash reports.',
      'OCR & AI Processing Data: Receipt images are processed locally on your device using on-device AI (ExecuTorch / ML Kit). Raw images are NOT transmitted to our servers unless you explicitly initiate a cloud verification.',
      'Communication Data: Support messages, feedback submissions, and email correspondence.',
      'Subscription & Billing Data: Subscription plan type, payment status, renewal dates, and transaction records.',
    ],
  },
  {
    id: 'usage',
    icon: 'analytics',
    title: '2. How We Use Your Information',
    paragraphs: ['We process your personal information only for legitimate business purposes:'],
    bullets: [
      'Transaction Verification: Matching payment references against banking settlement records via Verify.ET API.',
      'Account Management: Authenticating identity, managing subscriptions, and maintaining settlement account registries.',
      'On-Device AI Processing: Running local inference models (Llama 3.2 via ExecuTorch) for reference extraction, categorization, and insights — entirely on your device.',
      'Fraud Prevention: Detecting duplicate submissions, anomalous patterns, and reference manipulation.',
      'Service Improvement: Analyzing aggregated, anonymized usage to improve UX and verification speed.',
      'Legal Compliance: Fulfilling obligations under Ethiopian financial regulations and AML directives.',
      'Communication: Sending critical account alerts, security notifications, and subscription reminders. No marketing without opt-in consent.',
    ],
  },
  {
    id: 'sharing',
    icon: 'group',
    title: '3. Information Sharing & Disclosure',
    paragraphs: [`${APP_NAME} does not sell, rent, or trade your personal data to third parties for marketing purposes.`],
    bullets: [
      'Payment Verification Partners: Reference numbers and provider identifiers are shared with Verify.ET for settlement status retrieval.',
      'SMTP Email Service: Brevo (Sendinblue) relay for transactional emails. Email address shared solely for delivery.',
      'Legal Obligations: Disclosure if required by law, court order, or governmental regulation.',
      'Business Transfers: Data may transfer in mergers/acquisitions, subject to this policy.',
      'Aggregated Analytics: Anonymized statistics that cannot identify individual users.',
    ],
  },
  {
    id: 'retention',
    icon: 'schedule',
    title: '4. Data Retention',
    paragraphs: ['We retain personal information only as long as necessary:'],
    bullets: [
      'Account Data: Lifetime of account plus 30 days after deletion request.',
      'Verification Records: 3 years for dispute resolution and regulatory audits.',
      'OTP Codes: Purged via MongoDB TTL indexes within 10 minutes.',
      'Session Tokens: JWT expires after 7 days; refresh tokens rotated immediately.',
      'AI-Processed Data: Receipt images processed by on-device AI are never stored on our servers.',
      'Support Correspondence: 2 years after ticket resolution.',
    ],
  },
  {
    id: 'security',
    icon: 'lock',
    title: '5. Data Security',
    paragraphs: ['We implement industry-standard security measures:'],
    bullets: [
      'Encryption in Transit: TLS 1.3 for all network communications.',
      'Encryption at Rest: bcrypt password hashing with per-user salts; AES-256 database encryption.',
      'Access Control: RBAC with immutable admin audit trails.',
      'Infrastructure: MongoDB Atlas with encryption, automated backups, and VPC network isolation.',
      'On-Device Security: AI models run within device sandbox; biometric auth never transmitted.',
    ],
  },
  {
    id: 'rights',
    icon: 'gavel',
    title: '6. Your Rights',
    paragraphs: ['Depending on your jurisdiction, you may have the following rights:'],
    bullets: [
      'Right to Access: Request a copy of all personal data we hold.',
      'Right to Rectification: Request correction of inaccurate data.',
      'Right to Erasure: Request deletion of your account and data.',
      'Right to Data Portability: Request data in machine-readable format.',
      'Right to Object: Object to processing for certain purposes.',
      'Right to Withdraw Consent: Withdraw consent at any time.',
      'Right to Lodge a Complaint: File a complaint with relevant data protection authority.',
    ],
  },
  {
    id: 'children',
    icon: 'child_care',
    title: "7. Children's Privacy",
    paragraphs: ['The Service is intended for merchants and business professionals aged 18+. We do not knowingly collect data from individuals under 18. If discovered, such data will be promptly deleted.'],
  },
  {
    id: 'international',
    icon: 'public',
    title: '8. International Data Transfers',
    paragraphs: ['Data is primarily stored in Africa/EEA. International transfers include standard contractual clauses or equivalent safeguards.'],
  },
  {
    id: 'cookies',
    icon: 'cookie',
    title: '9. Cookies & Tracking (Web Dashboard)',
    paragraphs: ['Our web dashboard uses strictly necessary cookies only:'],
    bullets: [
      'Session Cookie: Maintains authenticated session; cleared on logout.',
      'Theme Preference: Dark/light mode stored locally via localStorage.',
      'No Third-Party Trackers: No Google Analytics, Facebook Pixel, or similar tracking.',
    ],
  },
  {
    id: 'changes',
    icon: 'edit_note',
    title: '10. Changes to This Policy',
    paragraphs: [
      'Material changes are communicated via in-app notification or email at least 14 days prior. Continued use constitutes acceptance.',
    ],
  },
];

export default function PrivacyPolicyPage() {
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
            <Link to="/terms" className="text-[13px] font-medium text-[#54647a] dark:text-[#c2c6d9] hover:text-[#004bca] transition-colors">Terms</Link>
            <Link to="/security" className="text-[13px] font-medium text-[#54647a] dark:text-[#c2c6d9] hover:text-[#004bca] transition-colors">Security</Link>
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
                <span className="material-symbols-outlined text-[24px] text-[#004bca]">privacy_tip</span>
              </div>
              <div>
                <h1 className="font-['Geist'] text-3xl font-bold">Privacy Policy</h1>
                <p className="text-sm text-[#54647a] dark:text-[#c2c6d9]/70">Effective: {EFFECTIVE_DATE}</p>
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
                      const [label, ...rest] = b.split(': ');
                      const desc = rest.join(': ');
                      return (
                        <li key={bi} className="flex items-start gap-3 text-sm">
                          <div className="w-1.5 h-1.5 rounded-full bg-[#004bca] mt-2 shrink-0" />
                          <span className="text-[#54647a] dark:text-[#c2c6d9] leading-relaxed">
                            {desc ? (
                              <>
                                <strong className="text-[#131b2e] dark:text-white font-semibold">{label}: </strong>
                                {desc}
                              </>
                            ) : (
                              b
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
              <h3 className="font-['Geist'] text-xl font-bold mb-2">Questions or Concerns?</h3>
              <p className="text-sm text-[#54647a] dark:text-[#c2c6d9] mb-1">Contact our Privacy Team:</p>
              <a href={`mailto:${SUPPORT_EMAIL}`} className="text-[#004bca] font-bold text-lg hover:underline">{SUPPORT_EMAIL}</a>
            </div>

            {/* Jurisdiction */}
            <div className="bg-[#f2f3ff] dark:bg-white/3 border border-[#c2c6d9]/25 dark:border-white/5 rounded-xl p-6 text-center">
              <p className="text-xs text-[#54647a] dark:text-[#c2c6d9]/70 leading-relaxed">
                This Privacy Policy is governed by the laws of the {JURISDICTION}. Disputes shall be subject to the exclusive jurisdiction of the courts of Addis Ababa.
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
            <Link to="/privacy" className="text-xs text-[#004bca] font-semibold">Privacy</Link>
            <Link to="/terms" className="text-xs text-[#54647a] dark:text-[#c2c6d9] hover:text-[#004bca] transition-colors">Terms</Link>
            <Link to="/security" className="text-xs text-[#54647a] dark:text-[#c2c6d9] hover:text-[#004bca] transition-colors">Security</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
