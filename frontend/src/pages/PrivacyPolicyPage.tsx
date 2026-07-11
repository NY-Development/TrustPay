import React from 'react';
import { Link } from 'react-router-dom';

const EFFECTIVE_DATE = 'July 8, 2026';
const COMPANY = 'NY-Development';
const APP_NAME = 'TrustPay';
const SUPPORT_EMAIL = 'yamlaknegash96@gmail.com';
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
    paragraphs: [
      'We collect information you provide directly (such as when setting up your business, branches, and employees), information generated through your usage, and limited information from third-party payment verification partners.',
    ],
    bullets: [
      'Account & Business Registration Data: Business owner full legal name, email address, password, company info (name, type, TIN, address), and trading license documents uploaded for approval.',
      'Branch and Employee Data: Branch names, physical locations, branch codes, phone numbers, and employee names, emails, roles, and branch assignments managed by the Owner.',
      'Settlement Account Data: Bank account numbers and wallet identifiers registered for verification matching (e.g., CBE, BOA, Telebirr, Dashen, Awash, M-Pesa account numbers), which can be managed at a branch level.',
      'Transaction Verification Data: Payment reference numbers, transaction IDs, verification request timestamps, provider responses including payer name, receiver name, and amounts.',
      'Device & Usage Data: Device model, operating system version, app version, IP address, session duration, feature usage patterns, and crash reports.',
      'OCR & AI Processing Data: Receipt images you upload are processed locally on your device using on-device AI. Trading license uploads are stored securely on remote servers.',
      'Communication Data: Support messages, feedback submissions, and system-level communications between owners and branch employees (e.g., announcements, task alerts).',
      'Subscription & Billing Data: Subscription plan type, payment status, renewal dates, and transaction records for branch-level subscription purchases.',
    ],
  },
  {
    id: 'usage',
    icon: 'analytics',
    title: '2. How We Use Your Information',
    paragraphs: [
      'We process your personal information only for legitimate business purposes directly related to providing and improving the Service:',
    ],
    bullets: [
      'Transaction Verification: Matching payment references against banking settlement records via Verify.ET API to confirm payer identity, amounts, and receiver account details, isolated for each respective branch.',
      'Multi-Actor Authentication & Management: Enforcing separate login flows for Owners vs. Employees and providing management tools for owners to invite, update, and manage employee accounts and branch assignments.',
      'On-Device AI Processing: Running local inference models (Llama 3.2 via ExecuTorch) to extract reference numbers, categorize transactions, and generate business insights — entirely on your device.',
      'Fraud Prevention & Audit: Detecting duplicate submissions, anomaly detection, and keeping immutable logs of actions taken by users and employees.',
      'Service Improvement: Analyzing aggregated, anonymized usage patterns to improve user experience, optimize verification speed, and develop new features.',
      'Legal Compliance: Fulfilling obligations under Ethiopian financial regulations, anti-money laundering (AML) directives, and verifying trading licenses for active business operations.',
      'Communication: Sending critical account alerts, security notifications, subscription reminders, and support responses. We will never send marketing communications without your explicit opt-in consent.',
    ],
  },
  {
    id: 'sharing',
    icon: 'group',
    title: '3. Information Sharing & Disclosure',
    paragraphs: [
      `${APP_NAME} does not sell, rent, or trade your personal data to third parties for marketing purposes. We share data only in the following limited circumstances:`,
    ],
    bullets: [
      'Payment Verification Partners: When you initiate a verification, we transmit the reference number and provider identifier to the Verify.ET API gateway to retrieve settlement status. Only the minimum data necessary for verification is shared.',
      'Cloud Storage & Document Verification: We upload trading license documents securely to Cloudinary for our administrative team to review and verify merchant credentials.',
      'SMTP Email Service: We use Brevo (Sendinblue) SMTP relay for transactional emails (OTP codes, password resets, employee invitations). Your email address is shared with Brevo solely for delivery.',
      'Legal Obligations: We may disclose information if required by law, court order, or governmental regulation, or if we believe disclosure is necessary to protect national security, enforce our Terms of Use, or protect the rights and safety of any person.',
      'Business Transfers: In the event of a merger, acquisition, or asset sale, your personal data may be transferred to the acquiring entity, subject to this Privacy Policy.',
      'Aggregated Analytics: We may share anonymized, aggregated statistics (e.g., total verifications processed, average verification time) that cannot reasonably identify any individual user.',
    ],
  },
  {
    id: 'retention',
    icon: 'schedule',
    title: '4. Data Retention',
    paragraphs: [
      'We retain your personal information only as long as necessary to fulfill the purposes outlined in this policy:',
    ],
    bullets: [
      'Account, Branch, and Employee Data: Retained for the lifetime of your organization account plus 30 days after deletion request to allow recovery. When an employee or copy of a branch is deleted by the owner, associated employee credentials and roles are immediately deactivated.',
      'Verification Records & Audit Logs: Transaction verification results and employee audit history are retained for 3 years to support dispute resolution, branch analytics, and regulatory audits.',
      'OTP Codes: Automatically purged via MongoDB TTL indexes within 10 minutes of generation.',
      'Session Tokens: JWT tokens expire after 7 days. Refresh tokens are rotated and old tokens are invalidated immediately.',
      'AI-Processed Data: Receipt images processed by on-device AI are never stored on our servers. Local model inference data remains exclusively on your device.',
      'Trading License Images: Securely retained in our Cloudinary storage for the duration of the business validation process and active status.',
    ],
  },
  {
    id: 'security',
    icon: 'lock',
    title: '5. Data Security',
    paragraphs: [
      'We implement industry-standard security measures to protect your data:',
    ],
    bullets: [
      'Encryption in Transit: All network communications use TLS 1.3 encryption. API endpoints enforce HTTPS exclusively.',
      'Encryption at Rest: Sensitive database fields (passwords, settlement account numbers) are hashed or encrypted using industry-standard patterns.',
      'Access Control & Branch Scoping: Multi-actor role-based access control (RBAC) ensures employees can only access data scoped to their assigned branch. Admin actions and employee operations are logged in immutable audit trails.',
      'Infrastructure: MongoDB Atlas with encryption at rest, automated backups, and network isolation via VPC peering.',
      'On-Device Security: AI models run entirely within the device sandbox. Biometric authentication (fingerprint/face) is handled natively and never transmitted to our servers.',
      'Vulnerability Management: We conduct periodic security reviews and apply dependency patches promptly.',
    ],
  },
  {
    id: 'rights',
    icon: 'gavel',
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
    icon: 'child_care',
    title: "7. Children's Privacy",
    paragraphs: [
      `The Service is intended for merchants and business professionals aged 18 and older. We do not knowingly collect personal information from individuals under 18 years of age. If we become aware that we have inadvertently collected data from a minor, we will promptly delete such information and terminate the associated account.`,
    ],
  },
  {
    id: 'international',
    icon: 'public',
    title: '8. International Data Transfers',
    paragraphs: [
      `Your data is primarily stored and processed within infrastructure located in Africa and/or the European Economic Area. If data is transferred internationally (e.g., for cloud service provider operations), we ensure adequate protective measures are in place, including standard contractual clauses or equivalent safeguards recognized under applicable law.`,
    ],
  },
  {
    id: 'cookies',
    icon: 'cookie',
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
    icon: 'edit_note',
    title: '10. Changes to This Policy',
    paragraphs: [
      `We may update this Privacy Policy periodically. When material changes are made, we will notify you via in-app notification, email, or a prominent notice on the Service at least 14 days prior to the change taking effect. Continued use of the Service after the effective date constitutes acceptance of the revised policy.`,
      `The "Last Updated" date at the top of this document reflects the most recent revision.`,
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
