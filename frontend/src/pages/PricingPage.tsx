import React, { useState } from 'react';
import { motion, type Variants } from 'framer-motion';
import { Check, ShieldCheck, Building2, Sparkles, Clock, Info } from 'lucide-react';
import SubscriptionModal from '../components/SubscriptionModal';
import { useAuthStore } from '../store/authStore';
import { usePublicStats } from '@/src/hooks/usePublicStats';

// Keep in sync with backend/src/constants/index.ts (SUBSCRIPTION_PRICING,
// YEARLY_PLAN_AVAILABLE, DATA_RETENTION_GRACE_DAYS).
const MONTHLY_PRICE = 2000;
const YEARLY_PRICE = 21600; // 10% off (2000 * 12 = 24000)
const YEARLY_SAVINGS_PCT = Math.round((1 - YEARLY_PRICE / (MONTHLY_PRICE * 12)) * 100);
const YEARLY_PLAN_AVAILABLE = false;
const DATA_RETENTION_GRACE_DAYS = 30;

const fadeUpItem: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 70, damping: 15 } },
};

const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const coreFeatures = [
  'Real-time payment verification across CBE, BOA, Telebirr, Dashen, Awash, M-Pesa & more',
  'Unlimited verification requests for the branch',
  'Owner + employee roles with branch-scoped permissions',
  'On-device AI receipt scanning (OCR) — screenshots never leave the device',
  'Immutable audit trail for every verification and administrative action',
  'Analytics dashboard with fraud & trend intelligence',
  'CSV/Excel and PDF export center',
  'Push notifications for verification results and account activity',
];

const faqs = [
  {
    q: 'Why is billing per branch?',
    a: 'Each branch operates as its own verification unit — its own settlement accounts, its own employees, its own audit trail. Billing per branch means you only pay for the locations actually running verifications, and can add or pause branches independently as your business grows.',
  },
  {
    q: 'How does the free trial work?',
    a: 'Every new business gets a 5-day trial with full platform access — no card required. If you don’t subscribe before the trial ends, the account moves to a 3-day read-only grace period before verification access is paused.',
  },
  {
    q: 'How do I actually pay?',
    a: 'Bank transfer, the same way your customers pay you. Transfer the plan amount to our settlement account via CBE, BOA, Telebirr, or another supported provider, then paste the transaction reference into the app — it verifies and activates instantly, using the exact same engine that powers the product.',
  },
  {
    q: 'What happens if I only pay part of the amount?',
    a: 'TrustPay tracks partial payments automatically. If your transfer doesn’t cover the full plan amount, the branch shows a "Partial Payment" status with the remaining balance — top it up any time to activate.',
  },
  {
    q: 'Can I switch between monthly and yearly?',
    a: 'Yearly billing is coming soon. Once it launches you’ll be able to switch anytime from the branch’s subscription settings, effective on your next billing cycle.',
  },
  {
    q: 'Where is my data stored, and does that affect the price?',
    a: `The Per Branch price above assumes your data stays on TrustPay's infrastructure for no more than ${DATA_RETENTION_GRACE_DAYS} days (e.g. during onboarding or a migration to your own systems). If you need TrustPay to retain your data for longer than that, you'll need the custom plan instead. Pricing may also be adjusted periodically to reflect our own server costs — as long as your usage stays within these terms, you're kept on the agreed rate rather than facing surprise increases.`,
  },
];

export default function PricingPage() {
  const { isAuthenticated } = useAuthStore();
  const { data: statsRes } = usePublicStats();
  const stats = statsRes?.data;

  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly');
  const [modalVisible, setModalVisible] = useState(false);

  const handleSubscribe = () => {
    if (!isAuthenticated) {
      window.location.href = '/register';
      return;
    }
    setModalVisible(true);
  };

  const price = billingPeriod === 'monthly' ? MONTHLY_PRICE : YEARLY_PRICE;

  return (
    <div className="bg-background text-foreground antialiased font-['Inter']">
      <main className="max-w-[1200px] mx-auto px-6 pt-16 pb-24">
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-14 max-w-2xl mx-auto"
        >
          <span className="inline-flex items-center gap-1.5 text-[13px] font-bold text-[#004bca] dark:text-[#549aff] uppercase tracking-widest mb-4">
            <ShieldCheck size={15} />
            Simple, transparent pricing
          </span>
          <h1 className="font-['Geist'] text-4xl md:text-5xl font-semibold tracking-[-0.02em] mb-5">
            One plan. Priced per branch.
          </h1>
          <p className="text-muted-foreground text-lg leading-relaxed">
            No hidden tiers, no feature gates. Every branch gets the full verification platform —
            you only decide how many branches and how often you're billed.
          </p>
        </motion.div>

        {/* Billing toggle */}
        <div className="flex flex-col items-center mb-10">
          <div className="inline-flex bg-card border border-border rounded-full p-1 shadow-sm">
            {(['monthly', 'yearly'] as const).map((period) => {
              const disabled = period === 'yearly' && !YEARLY_PLAN_AVAILABLE;
              return (
                <button
                  key={period}
                  onClick={() => !disabled && setBillingPeriod(period)}
                  disabled={disabled}
                  className={`px-6 py-2.5 rounded-full text-sm font-bold capitalize transition-all ${
                    disabled
                      ? 'cursor-not-allowed text-muted-foreground/50'
                      : billingPeriod === period
                        ? 'bg-primary text-primary-foreground shadow-sm cursor-pointer'
                        : 'text-muted-foreground hover:text-foreground cursor-pointer'
                  }`}
                >
                  {period}
                  {period === 'yearly' && (
                    <span className={`ml-1.5 text-[10px] font-black ${disabled ? 'text-muted-foreground/50' : billingPeriod === 'yearly' ? 'text-primary-foreground/80' : 'text-emerald-600'}`}>
                      {disabled ? 'COMING SOON' : `SAVE ${YEARLY_SAVINGS_PCT}%`}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
          {!YEARLY_PLAN_AVAILABLE && (
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground mt-3">
              <Clock size={13} />
              Yearly billing (save {YEARLY_SAVINGS_PCT}%) is on its way — monthly is available today.
            </p>
          )}
        </div>

        {/* Pricing cards */}
        <motion.section
          variants={staggerContainer}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-60px' }}
          className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16"
        >
          {/* Standard Branch Plan */}
          <motion.div
            variants={fadeUpItem}
            className="relative bg-card border-2 border-primary rounded-[28px] p-8 md:p-10 shadow-lg flex flex-col"
          >
            <div className="absolute -top-3 right-8 bg-primary text-primary-foreground text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full shadow-sm">
              Most businesses choose this
            </div>

            <div className="flex items-center gap-2.5 mb-5">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Building2 size={20} className="text-primary" />
              </div>
              <h3 className="font-['Geist'] text-xl font-bold">Per Branch</h3>
            </div>

            <div className="mb-2 flex items-baseline gap-2">
              <span className="text-5xl font-bold font-['Geist'] tracking-tight">{price.toLocaleString()}</span>
              <span className="text-muted-foreground font-semibold">ETB / {billingPeriod === 'monthly' ? 'month' : 'year'}</span>
            </div>
            <p className="text-xs text-muted-foreground mb-8">
              {billingPeriod === 'yearly'
                ? `Equivalent to ${Math.round(YEARLY_PRICE / 12).toLocaleString()} ETB/month — billed annually.`
                : 'Billed monthly, per active branch. Cancel or switch to yearly anytime.'}
            </p>

            <ul className="space-y-3 mb-8 flex-1">
              {coreFeatures.map((f) => (
                <li key={f} className="flex items-start gap-2.5 text-sm">
                  <Check size={16} className="text-primary shrink-0 mt-0.5" />
                  <span className="text-foreground/90">{f}</span>
                </li>
              ))}
            </ul>

            <button
              onClick={handleSubscribe}
              className="w-full bg-primary text-primary-foreground py-3.5 rounded-xl font-bold hover:bg-primary/90 active:scale-[0.98] transition-all shadow-sm cursor-pointer"
            >
              {isAuthenticated ? 'Activate This Branch' : 'Start Your 5-Day Free Trial'}
            </button>
            <p className="text-center text-[11px] text-muted-foreground mt-3">No card required to start. Bank-transfer billing only.</p>
          </motion.div>

          {/* Enterprise / Multi-branch */}
          <motion.div variants={fadeUpItem} className="bg-card border border-border rounded-[28px] p-8 md:p-10 shadow-sm flex flex-col">
            <div className="flex items-center gap-2.5 mb-5">
              <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center">
                <Sparkles size={20} className="text-violet-600" />
              </div>
              <h3 className="font-['Geist'] text-xl font-bold">Multi-Branch & Enterprise</h3>
            </div>

            <div className="mb-2">
              <span className="text-4xl font-bold font-['Geist'] tracking-tight">Custom Rate</span>
            </div>
            <p className="text-xs text-muted-foreground mb-8">
              Running 10+ branches, or need TrustPay to retain your data beyond {DATA_RETENTION_GRACE_DAYS} days
              instead of hosting it yourself? We'll work out volume pricing, storage terms, and a dedicated
              settlement review process with you directly.
            </p>

            <ul className="space-y-3 mb-8 flex-1">
              {[
                'Everything in the Per Branch plan',
                'Long-term data hosting on TrustPay infrastructure',
                'Volume discount across all branches',
                'Priority support & onboarding assistance',
                'Dedicated account contact',
              ].map((f) => (
                <li key={f} className="flex items-start gap-2.5 text-sm">
                  <Check size={16} className="text-violet-600 shrink-0 mt-0.5" />
                  <span className="text-foreground/90">{f}</span>
                </li>
              ))}
            </ul>

            <a
              href="/contact"
              className="w-full text-center border border-border py-3.5 rounded-xl font-bold hover:bg-secondary transition-colors cursor-pointer"
            >
              Contact Sales
            </a>
          </motion.div>
        </motion.section>

        {/* Data hosting & pricing terms disclosure */}
        <div className="max-w-3xl mx-auto mb-16 flex items-start gap-3 bg-card border border-border rounded-2xl p-5">
          <Info size={18} className="text-primary shrink-0 mt-0.5" />
          <p className="text-xs text-muted-foreground leading-relaxed">
            <strong className="text-foreground">Data hosting terms:</strong> the Per Branch price assumes your data
            is stored on TrustPay's infrastructure for no more than {DATA_RETENTION_GRACE_DAYS} days (for example,
            while onboarding onto your own systems). Need TrustPay to host your data long-term instead? Use the
            custom plan. We may periodically adjust pricing to reflect our own server costs — staying within these
            terms keeps you on the agreed rate rather than an unannounced increase.
          </p>
        </div>

        {/* Live trust stats */}
        {stats && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-20 py-10 border-y border-border"
          >
            {[
              { label: 'Registered Businesses', value: `${stats.companies}+` },
              { label: 'Active Branches', value: `${stats.branches}+` },
              { label: 'Payments Verified', value: stats.verifications.toLocaleString() },
              { label: 'Verification Accuracy', value: `${stats.successRate}%` },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <div className="font-['Geist'] text-3xl font-bold text-primary">{s.value}</div>
                <div className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mt-1">{s.label}</div>
              </div>
            ))}
          </motion.section>
        )}

        {/* FAQ */}
        <div className="max-w-3xl mx-auto mb-16">
          <h2 className="font-['Geist'] text-2xl font-bold text-center mb-10">Frequently asked questions</h2>
          <div className="space-y-4">
            {faqs.map((item) => (
              <details key={item.q} className="group bg-card border border-border rounded-2xl p-5 open:shadow-sm transition-shadow">
                <summary className="flex items-center justify-between cursor-pointer font-semibold text-sm list-none">
                  {item.q}
                  <span className="material-symbols-outlined text-muted-foreground transition-transform group-open:rotate-180 text-[20px]">expand_more</span>
                </summary>
                <p className="text-sm text-muted-foreground leading-relaxed mt-3">{item.a}</p>
              </details>
            ))}
          </div>
        </div>

        {/* Bottom CTA */}
        {!isAuthenticated && (
          <section className="bg-gradient-to-br from-primary to-[#0032a3] text-primary-foreground p-10 md:p-14 rounded-[32px] text-center shadow-lg">
            <h2 className="font-['Geist'] text-2xl md:text-3xl font-bold mb-3">Stop chasing screenshots. Start verifying instantly.</h2>
            <p className="text-primary-foreground/80 max-w-xl mx-auto mb-7">
              Set up your first branch in minutes and start reconciling payments against real settlement
              records — no more manual back-and-forth with cashiers.
            </p>
            <a href="/register" className="inline-block bg-white text-primary px-8 py-3.5 rounded-xl font-bold hover:bg-white/90 transition-colors shadow-sm">
              Create Your Free Account
            </a>
          </section>
        )}
      </main>

      {modalVisible && isAuthenticated && (
        <SubscriptionModal
          visible={modalVisible}
          canClose={true}
          onClose={() => setModalVisible(false)}
          partialSubscription={{ plan: billingPeriod }}
        />
      )}
    </div>
  );
}
