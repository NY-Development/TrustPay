import React from 'react';
import { Link } from 'react-router-dom';

export default function FeaturesPage() {
  const steps = [
    { icon: 'shield_locked', title: 'Payment Verification', desc: 'Verify CBE, Telebirr and M-Pesa references live over our polling engine.' },
    { icon: 'list_alt', title: 'Audit Reporting', desc: 'Automatically export daily verification histories for finance desks.' },
    { icon: 'manage_accounts', title: 'Multi-Tenant Workspaces', desc: 'Add receptionist accounts and track who verified what transaction.' },
    { icon: 'bolt', title: 'Webhooks & Callback', desc: 'Integrate directly into your billing/POS softwares if needed.' }
  ];

  return (
    <div className="max-w-7xl mx-auto px-6 py-20">
      <div className="text-center max-w-3xl mx-auto mb-16">
        <h1 className="text-4xl font-bold text-[#131b2e] dark:text-white">Enterprise Features</h1>
        <p className="text-[#424656] dark:text-[#c2c6d9] mt-4 text-lg">
          Designed specifically for hotels, retail counters, and restaurants where manual payment details need rigorous tracking.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
        {steps.map((s, idx) => (
          <div key={idx} className="flex gap-4 p-6 bg-white dark:bg-[#131b2e] rounded-xl border border-[#c2c6d9]/25 shadow-xs">
            <div className="w-12 h-12 rounded-lg bg-[#004bca]/10 text-[#004bca] flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[28px]">{s.icon}</span>
            </div>
            <div>
              <h3 className="text-lg font-bold mb-2 text-[#131b2e] dark:text-white">{s.title}</h3>
              <p className="text-sm text-[#424656] dark:text-[#c2c6d9] leading-relaxed">{s.desc}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-20 p-8 md:p-12 text-center bg-[#eaedff] dark:bg-[#eaedff]/5 rounded-2xl border border-[#004bca]/15">
        <h2 className="text-2xl font-bold text-[#131b2e] dark:text-white">Ready to secure your cashier desks?</h2>
        <p className="text-[#424656] dark:text-[#c2c6d9] mt-2 max-w-2xl mx-auto">
          Start verifying digital push receipts immediately with minimal setup.
        </p>
        <Link to="/register" className="mt-6 inline-block bg-[#004bca] hover:bg-[#0061ff] text-white px-8 py-3 rounded-lg font-semibold shadow-md active:scale-95 transition-all">
          Get Started Now
        </Link>
      </div>
    </div>
  );
}
