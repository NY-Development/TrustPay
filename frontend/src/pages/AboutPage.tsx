import React from 'react';

export default function AboutPage() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-20">
      <h1 className="text-4xl font-bold text-[#131b2e] dark:text-white mb-6">About TrustPay</h1>
      <p className="text-lg text-[#424656] dark:text-[#c2c6d9] leading-relaxed mb-8">
        At TrustPay, we build transactional trust infrastructure. Our primary product, Nexus Verify, solves the real-world operational challenges of digital payment confirmations in East Africa.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
        <div className="border border-[#c2c6d9]/30 rounded-xl p-6 bg-white dark:bg-[#131b2e]">
          <h2 className="text-lg font-semibold text-[#131b2e] dark:text-white mb-2">Our Mission</h2>
          <p className="text-sm text-[#424656] dark:text-[#c2c6d9] leading-relaxed">
            To eliminate reference fraud, check manipulation, and double payments at checking counters, saving hours of manual audit logs.
          </p>
        </div>
        <div className="border border-[#c2c6d9]/30 rounded-xl p-6 bg-white dark:bg-[#131b2e]">
          <h2 className="text-lg font-semibold text-[#131b2e] dark:text-white mb-2">Reliable API Platform</h2>
          <p className="text-sm text-[#424656] dark:text-[#c2c6d9] leading-relaxed">
            By connecting directly into verifying gateways, we offer automated settlements and risk ratings for every transaction reference submitted.
          </p>
        </div>
      </div>
      <p className="text-sm text-[#424656] dark:text-[#c2c6d9] leading-relaxed">
        TrustPay systems operate with enterprise grade bank compliance regulations and SSL encryptions. Founded in 2024 to support the rapidly moving cash-to-digital payments economy.
      </p>
    </div>
  );
}
