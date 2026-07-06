import React from 'react';

export default function LegalPage() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-20 text-sm text-[#424656] dark:text-[#c2c6d9] leading-relaxed">
      <h1 className="text-3xl font-bold mb-6 text-[#131b2e] dark:text-white">Legal Agreements</h1>
      <p className="mb-4">
        Last updated: July 2026.
      </p>
      
      <h2 className="text-lg font-bold mt-8 mb-4 text-[#131b2e] dark:text-white">1. Terms of Operations</h2>
      <p className="mb-4">
        Nexus Verify is designed solely to audit transaction references. We do not hold cash deposits, settle local assets directly, or process third-party banking withdrawals. Users must maintain credentials securely.
      </p>

      <h2 className="text-lg font-bold mt-8 mb-4 text-[#131b2e] dark:text-white">2. Privacy & Data Integrity</h2>
      <p className="mb-4">
        We respect operational secrecy. Transaction payloads, verification results, and business account info are encrypted and never distributed to third party advertising brokers.
      </p>

      <h2 className="text-lg font-bold mt-8 mb-4 text-[#131b2e] dark:text-white">3. Subscription Refunds</h2>
      <p className="mb-4">
        Due to verification polling costs, active monthly subscription charges are non-refundable. You can cancel at any time via support desk to avoid upcoming billing cycles.
      </p>
    </div>
  );
}
