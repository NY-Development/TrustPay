import React from "react"

const EFFECTIVE_DATE = "July 8, 2026"
const COMPANY = "NY-Development"
const APP_NAME = "TrustPay"
const SUPPORT_EMAIL = "nydevofficial@gmail.com"
const JURISDICTION = "Federal Democratic Republic of Ethiopia"

type Section = {
  id: string
  icon: string
  title: string
  paragraphs: string[]
  bullets?: string[]
}

const sections: Section[] = [
  {
    id: "acceptance",
    icon: "check_circle",
    title: "1. Acceptance of Terms",
    paragraphs: [
      `These Terms of Use ("Terms") constitute a legally binding agreement between you ("User") and ${COMPANY} ("Company"), the operator of the ${APP_NAME} platform.`,
      "By creating an account, accessing, or using any part of the Service — including the mobile application, web dashboard, and API endpoints — you agree to be bound by these Terms and our Privacy Policy.",
      "If you do not agree, you must immediately cease all use of the Service.",
    ],
  },
  {
    id: "eligibility",
    icon: "person",
    title: "2. Eligibility",
    paragraphs: ["To use the Service, you must:"],
    bullets: [
      "Be at least 18 years of age or the legal majority in your jurisdiction.",
      "Be a registered business entity or authorized representative operating within the Ethiopian financial ecosystem.",
      "Provide accurate, truthful registration information, including your full legal name and business details for owner verification.",
      "Maintain the security of your account credentials. You are solely responsible for all activities under your account, including those of your invited employees.",
    ],
  },
  {
    id: "service",
    icon: "build",
    title: "3. Service Description",
    paragraphs: [`${APP_NAME} provides:`],
    bullets: [
      "Transaction Reference Verification: Validating payment references against banking records via Verify.ET API.",
      "On-Device AI Receipt Processing: Local ML models (ExecuTorch, Google ML Kit) for reference extraction — processed entirely on-device.",
      "Subscription Access Control: Managing branch-level subscriptions (each branch is billed individually) with access gating for premium features.",
      "Multi-Branch & Employee Features: Support for configuring multiple physical or digital branches under a single owner account, inviting employees, allocating branch access permissions, and viewing isolated verification records.",
      "Business Analytics & Audit: AI-driven financial insights, spending trends, and anomaly detection.",
      "Push Notifications: Critical alerts, verification results, and subscription reminders.",
    ],
  },
  {
    id: "limitations",
    icon: "block",
    title: "4. What TrustPay Is NOT",
    paragraphs: ["Critical limitations:"],
    bullets: [
      `${APP_NAME} is NOT a bank, money transfer operator, or payment processor. We do not hold, transfer, or settle funds.`,
      `${APP_NAME} does NOT guarantee accuracy of third-party verification API results. Results are provided "as-is" from banking partners.`,
      `${APP_NAME} does NOT serve as a legal arbiter in payment disputes. Results are informational, not legal proof.`,
      `${APP_NAME} does NOT provide financial, legal, or tax advice. AI insights are automated suggestions only.`,
    ],
  },
  {
    id: "accounts",
    icon: "key",
    title: "5. User Accounts & Settlement Registration",
    paragraphs: [
      "Your registration name must exactly match your banking settlement accounts because:",
    ],
    bullets: [
      "Verification results compare receiver names against your registered identity. Name mismatches cause failures.",
      "Organization Roles: Owners are fully responsible for the operation and permissions of all sub-accounts (Cashier, Manager, etc.) created underneath their organization business profile.",
      "Branch Account Allocation: Settlement accounts can be registered and tied to specific branches to allow correct verification checking.",
      "You may register multiple accounts across CBE, BOA, Telebirr, Dashen, Awash, M-Pesa, and CBE Birr.",
      "You are responsible for keeping settlement account information current.",
      "Account sharing is strictly prohibited. Each account = one identifiable merchant entity.",
      "We reserve the right to suspend accounts exhibiting fraud or abuse patterns.",
    ],
  },
  {
    id: "subscriptions",
    icon: "credit_card",
    title: "6. Subscriptions & Billing",
    paragraphs: ["Key billing terms:"],
    bullets: [
      "Plans: Monthly (2,000 ETB per branch). Yearly billing (10% discount) is coming soon and not yet purchasable. Pricing subject to change with 30 days notice.",
      "Branch Billing: TrustPay plans are charged per branch. Owners must maintain an active subscription for each configured branch to allow employees at that branch to run verifications.",
      "Data Hosting Terms: Standard pricing assumes your data is stored on TrustPay's infrastructure for no more than 30 days (e.g. during onboarding). Longer-term data hosting on TrustPay's servers requires the custom/enterprise plan.",
      "Auto-Renewal: Subscriptions renew automatically unless cancelled before the renewal date.",
      "Refund Policy: Active subscription charges are non-refundable due to verification API polling costs. Cancel anytime to prevent future charges.",
      "Grace Period: 3-day read-only access after expiration before access gating activates.",
    ],
  },
  {
    id: "acceptable-use",
    icon: "thumb_up",
    title: "7. Acceptable Use Policy",
    paragraphs: ["You agree NOT to:"],
    bullets: [
      "Submit fabricated or fraudulent transaction references.",
      "Reverse-engineer, decompile, or extract proprietary algorithms or AI models.",
      "Circumvent subscription controls, rate limits, or security mechanisms.",
      "Allow unauthorized employees or third parties to access branch dashboards or verification history.",
      "Provide fake or fraudulent business details during organization onboarding.",
      "Use bots, scrapers, or automated tools without written permission.",
      "Impersonate another person, business, or entity.",
      "Transmit malware or code designed to disrupt our systems.",
      "Violate any applicable local, national, or international law.",
      "Use the Service for money laundering, terrorist financing, or any illegal financial activity.",
    ],
  },
  {
    id: "ip",
    icon: "lightbulb",
    title: "8. Intellectual Property",
    paragraphs: [
      `All content, software, AI models, and documentation are the exclusive property of ${COMPANY}, protected by Ethiopian and international IP laws.`,
      "Your subscription grants a limited, non-exclusive, non-transferable, revocable license. User-generated content remains yours; you grant us a limited license to process it for Service delivery.",
    ],
  },
  {
    id: "liability",
    icon: "warning",
    title: "9. Limitation of Liability",
    paragraphs: [
      `TO THE MAXIMUM EXTENT PERMITTED BY LAW, ${COMPANY.toUpperCase()} SHALL NOT BE LIABLE FOR:`,
    ],
    bullets: [
      "Indirect, incidental, special, consequential, or punitive damages.",
      "Losses from inaccurate third-party API verification results.",
      "Financial decisions based on AI-generated insights.",
      "Unauthorized access due to user credential negligence.",
      "Force majeure interruptions (natural disasters, API outages, government actions).",
      `Total aggregate liability shall not exceed fees paid in the 12 months preceding the claim.`,
    ],
  },
  {
    id: "indemnification",
    icon: "shield",
    title: "10. Indemnification",
    paragraphs: [
      "You agree to indemnify and hold harmless the Company from claims arising from:",
    ],
    bullets: [
      "Your use or misuse of the Service.",
      "Violation of these Terms or any applicable law.",
      "Infringement of third-party rights.",
      "Content or data you submit through the Service.",
    ],
  },
  {
    id: "termination",
    icon: "logout",
    title: "11. Termination",
    paragraphs: ["We may suspend or terminate access if:"],
    bullets: [
      "You violate these Terms or the Acceptable Use Policy.",
      "Your account exhibits suspicious or fraudulent activity.",
      "You fail to maintain an active subscription beyond the grace period.",
      "Required by law enforcement or regulatory authorities.",
    ],
  },
  {
    id: "modifications",
    icon: "edit",
    title: "12. Modifications",
    paragraphs: [
      "We may modify these Terms with 14 days advance notice via in-app notification or email. Continued use constitutes acceptance. If you disagree, your remedy is to terminate your account.",
    ],
  },
  {
    id: "governing",
    icon: "flag",
    title: "13. Governing Law & Dispute Resolution",
    paragraphs: [`Governed by the laws of the ${JURISDICTION}.`],
    bullets: [
      "Informal Resolution: Contact nydevofficial@gmail.com first. We aim to resolve within 30 business days.",
      "Arbitration: Binding arbitration under Ethiopian Arbitration and Conciliation Center rules.",
      "Jurisdiction: Courts of Addis Ababa for non-arbitrable matters.",
    ],
  },
  {
    id: "severability",
    icon: "account_tree",
    title: "14. Severability",
    paragraphs: [
      "If any provision is found unenforceable, remaining provisions continue in full force. The unenforceable provision is modified minimally to preserve intent.",
    ],
  },
]

export default function TermsOfUsePage() {
  return (
    <div className="px-8 pt-12 pb-20 font-['Inter'] antialiased">
      <div className="mx-auto max-w-[900px]">
        {/* Hero */}
        <div className="mb-12">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#004bca]/10">
              <span className="material-symbols-outlined text-[24px] text-[#004bca]">
                description
              </span>
            </div>
            <div>
              <h1 className="font-['Geist'] text-3xl font-bold">
                Terms of Use
              </h1>
              <p className="text-sm text-[#54647a] dark:text-[#c2c6d9]/70">
                Effective: {EFFECTIVE_DATE}
              </p>
            </div>
          </div>
        </div>

        {/* Sections */}
        <div className="space-y-8">
          {sections.map((s) => (
            <section
              key={s.id}
              id={s.id}
              className="rounded-2xl border border-[#c2c6d9]/30 bg-white p-8 shadow-xs transition-colors hover:border-[#004bca]/30 dark:border-white/8 dark:bg-[#131b2e]"
            >
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#004bca]/8">
                  <span className="material-symbols-outlined text-[20px] text-[#004bca]">
                    {s.icon}
                  </span>
                </div>
                <h2 className="font-['Geist'] text-xl font-bold">{s.title}</h2>
              </div>

              {s.paragraphs.map((p, i) => (
                <p
                  key={i}
                  className="mb-4 text-sm leading-relaxed text-[#54647a] dark:text-[#c2c6d9]"
                >
                  {p}
                </p>
              ))}

              {s.bullets && (
                <ul className="mt-2 space-y-3">
                  {s.bullets.map((b, bi) => {
                    const colonIdx = b.indexOf(": ")
                    const hasLabel = colonIdx > 0 && colonIdx < 40
                    const label = hasLabel ? b.substring(0, colonIdx) : null
                    const desc = hasLabel ? b.substring(colonIdx + 2) : b
                    return (
                      <li key={bi} className="flex items-start gap-3 text-sm">
                        <div className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#004bca]" />
                        <span className="leading-relaxed text-[#54647a] dark:text-[#c2c6d9]">
                          {label ? (
                            <>
                              <strong className="font-semibold text-[#131b2e] dark:text-white">
                                {label}:{" "}
                              </strong>
                              {desc}
                            </>
                          ) : (
                            desc
                          )}
                        </span>
                      </li>
                    )
                  })}
                </ul>
              )}
            </section>
          ))}

          {/* Contact */}
          <div className="border-t border-[#c2c6d9]/25 py-10 text-center dark:border-white/5">
            <h3 className="mb-2 font-['Geist'] text-xl font-bold">
              Legal Questions?
            </h3>
            <p className="mb-1 text-sm text-[#54647a] dark:text-[#c2c6d9]">
              Contact our Legal Team:
            </p>
            <a
              href={`mailto:${SUPPORT_EMAIL}`}
              className="text-lg font-bold text-[#004bca] hover:underline"
            >
              {SUPPORT_EMAIL}
            </a>
          </div>

          {/* Footer note */}
          <div className="rounded-xl border border-[#c2c6d9]/25 bg-[#f2f3ff] p-6 text-center dark:border-white/5 dark:bg-white/3">
            <p className="text-xs leading-relaxed text-[#54647a] dark:text-[#c2c6d9]/70">
              © 2024–2026 {COMPANY}. All rights reserved. These Terms constitute
              the entire agreement between you and {COMPANY} regarding{" "}
              {APP_NAME}, superseding any prior agreements.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
