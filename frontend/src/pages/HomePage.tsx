import React from 'react';
import { Link } from 'react-router-dom';

export default function HomePage() {
  return (
    <div className="bg-[#faf8ff] dark:bg-[#0b0e14]">
      {/* Hero Section */}
      <section className="text-center py-20 px-6 max-w-7xl mx-auto flex flex-col items-center justify-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#eaedff] text-[#004bca] text-xs font-semibold uppercase tracking-wider mb-6 animate-pulse">
          <span className="material-symbols-outlined text-[16px]">verified</span>
          Next-generation KYC & Pay Verification
        </div>
        <h1 className="text-5xl md:text-6xl font-bold font-display-lg text-[#131b2e] dark:text-white max-w-4xl tracking-tight leading-tight mb-6">
          Transparent trust for <span className="text-[#004bca] dark:text-[#b4c5ff]">verified transactions</span>.
        </h1>
        <p className="text-lg md:text-xl text-[#424656] dark:text-[#c2c6d9] max-w-2xl leading-relaxed mb-10">
          Reconcile and verify manual payments instantly. Built for hotel, restaurant, and retail reception desks to eliminate fraud and double transactions.
        </p>
        <div className="flex gap-4">
          <Link to="/register" className="bg-[#004bca] hover:bg-[#0061ff] text-white px-8 py-3 rounded-lg font-semibold shadow-md active:scale-95 transition-all">
            Get Started Free
          </Link>
          <Link to="/pricing" className="bg-white border border-[#c2c6d9] dark:bg-transparent dark:border-[#c2c6d9]/30 text-[#131b2e] dark:text-white px-8 py-3 rounded-lg font-semibold hover:bg-gray-50 dark:hover:bg-white/5 transition-all">
            View Pricing
          </Link>
        </div>
      </section>

      {/* Grid Features System */}
      <section className="py-20 bg-white dark:bg-[#131b2e] border-y border-[#c2c6d9]/20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-[#131b2e] dark:text-white">Why VeriPay?</h2>
            <p className="text-[#424656] dark:text-[#c2c6d9] mt-2">The ultimate platform for desktop payment verification.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-8 bg-[#faf8ff] dark:bg-[#0b0e14] rounded-xl border border-[#c2c6d9]/20 shadow-xs">
              <span className="material-symbols-outlined text-[36px] text-[#004bca] mb-4">account_balance</span>
              <h3 className="text-lg font-bold mb-2">Automated Settlement</h3>
              <p className="text-sm text-[#424656] dark:text-[#c2c6d9] leading-relaxed">
                Connect your business accounts (CBE, Telebirr, M-Pesa) and reconcile transaction references instantly.
              </p>
            </div>
            <div className="p-8 bg-[#faf8ff] dark:bg-[#0b0e14] rounded-xl border border-[#c2c6d9]/20 shadow-xs">
              <span className="material-symbols-outlined text-[36px] text-[#004bca] mb-4">security</span>
              <h3 className="text-lg font-bold mb-2">Anti-Fraud Engine</h3>
              <p className="text-sm text-[#424656] dark:text-[#c2c6d9] leading-relaxed">
                Real-time duplicate references check and bank payload verification prevents screenshot tampering.
              </p>
            </div>
            <div className="p-8 bg-[#faf8ff] dark:bg-[#0b0e14] rounded-xl border border-[#c2c6d9]/20 shadow-xs">
              <span className="material-symbols-outlined text-[36px] text-[#004bca] mb-4">monitoring</span>
              <h3 className="text-lg font-bold mb-2">Audit Logs & Analytics</h3>
              <p className="text-sm text-[#424656] dark:text-[#c2c6d9] leading-relaxed">
                Detailed reporting and transaction logs for reconciliation and accountability at receptionist counters.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
