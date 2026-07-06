import React, { useState } from 'react';
import SubscriptionModal from '../components/SubscriptionModal';
import { useAuthStore } from '../store/authStore';

export default function PricingPage() {
  const { isAuthenticated, user } = useAuthStore();
  const [modalVisible, setModalVisible] = useState(false);

  const handlePricingAction = () => {
    if (!isAuthenticated) {
      window.location.href = '/register';
    } else {
      setModalVisible(true);
    }
  };

  const currentSubscription = null;

  return (
    <div className="bg-[#faf8ff] text-[#131b2e] antialiased min-h-screen flex flex-col font-['Inter']">
      <style>{`
        .pricing-card-hover:hover { 
          transform: translateY(-4px); 
          box-shadow: 0 12px 24px -8px rgba(0, 0, 0, 0.1); 
          border-color: #004bca; 
        }
        .table-row-hover:hover { 
          background-color: #f2f3ff; 
        }
      `}</style>

      <main className="flex-grow pt-24 pb-10 px-6 max-w-[1280px] mx-auto w-full">
        {/* Clean Header Grid */}
        <section className="text-center py-10 mb-6">
          <h1 className="font-['Geist'] text-[32px] md:text-[48px] font-semibold text-[#131b2e] tracking-[-0.02em] mb-4">
            Transparent pricing for verified trust.
          </h1>
          <p className="text-[18px] text-[#424656] max-w-2xl mx-auto leading-[1.6]">
            Scale your verification infrastructure with plans designed for startups to global enterprises. No hidden fees, just reliable APIs.
          </p>
        </section>

        {/* Structural Pricing Cards Bento Layout */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16 pt-4">
          
          {/* Starter Plan Box */}
          <div className="bg-[#ffffff] border border-[#c2c6d9] rounded-xl p-6 flex flex-col pricing-card-hover transition-all duration-300 text-left">
            <div className="mb-4">
              <h3 className="font-['Geist'] text-[24px] font-medium text-[#131b2e] mb-1">Starter</h3>
              <p className="text-[14px] text-[#424656]">For early-stage startups needing basic KYC.</p>
            </div>
            <div className="mb-6">
              <span className="font-['Geist'] text-[48px] font-semibold tracking-[-0.02em] text-[#131b2e]">0 ETB</span>
              <span className="text-[14px] text-[#424656]">/mo</span>
            </div>
            <ul className="text-[14px] text-[#131b2e] space-y-3 mb-6 flex-grow">
              <li className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#004bca] text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span> 
                1 desk receptionist account
              </li>
              <li className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#004bca] text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span> 
                15 verifications per day
              </li>
            </ul>
            <button 
              onClick={handlePricingAction}
              className="w-full border border-[#737687] text-[#131b2e] font-['Geist'] text-[13px] font-medium py-2.5 rounded hover:bg-[#e2e7ff] transition-colors"
            >
              {isAuthenticated ? 'No Setup Required' : 'Get Started'}
            </button>
          </div>

          {/* Premium Plan Box (Highlighted) */}
          <div className="bg-[#ffffff] border-2 border-[#004bca] rounded-xl p-6 flex flex-col relative shadow-sm pricing-card-hover transition-all duration-300 transform scale-105 z-10 text-left">
            <div className="absolute top-0 right-0 bg-[#004bca] text-white font-['Geist'] text-[13px] font-medium px-3 py-1 rounded-bl-lg rounded-tr-sm">Most Popular</div>
            <div className="mb-4">
              <h3 className="font-['Geist'] text-[24px] font-medium text-[#131b2e] mb-1">Business</h3>
              <p className="text-[14px] text-[#424656]">Advanced risk mitigation for scaling platforms.</p>
            </div>
            <div className="mb-6">
              <span className="font-['Geist'] text-[48px] font-semibold tracking-[-0.02em] text-[#131b2e]">1,499.99 ETB</span>
              <span className="text-[14px] text-[#424656]">/mo</span>
            </div>
            <ul className="text-[14px] text-[#131b2e] space-y-3 mb-6 flex-grow">
              <li className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#004bca] text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span> 
                Unlimited receptionist desks
              </li>
              <li className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#004bca] text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span> 
                Unlimited payment verifications
              </li>
              <li className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#004bca] text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span> 
                Real-time double spend alerts
              </li>
              <li className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#004bca] text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span> 
                Excel/CSV export reporting logs
              </li>
            </ul>
            <button 
              onClick={handlePricingAction}
              className="w-full bg-[#004bca] text-white font-['Geist'] text-[13px] font-medium py-2.5 rounded hover:bg-[#0061ff] transition-colors"
            >
              {isAuthenticated ? 'Verify CBE Reference Now' : 'Start Premium Trial'}
            </button>
          </div>

          {/* Custom Enterprise Box */}
          <div className="bg-[#ffffff] border border-[#c2c6d9] rounded-xl p-6 flex flex-col pricing-card-hover transition-all duration-300 text-left">
            <div className="mb-4">
              <h3 className="font-['Geist'] text-[24px] font-medium text-[#131b2e] mb-1">Enterprise</h3>
              <p className="text-[14px] text-[#424656]">Custom workflows and high-volume SLAs.</p>
            </div>
            <div className="mb-6 flex items-end h-[53px]">
              <span className="font-['Geist'] text-[32px] font-semibold text-[#131b2e] tracking-[-0.02em]">Custom Pricing</span>
            </div>
            <ul className="text-[14px] text-[#131b2e] space-y-3 mb-6 flex-grow">
              <li className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#004bca] text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span> 
                Unlimited verifications
              </li>
              <li className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#004bca] text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span> 
                99.99% Uptime SLA
              </li>
            </ul>
            <button className="w-full border border-[#737687] text-[#131b2e] font-['Geist'] text-[13px] font-medium py-2.5 rounded hover:bg-[#e2e7ff] transition-colors">Contact Sales</button>
          </div>
        </section>

        {/* Feature Matrix Table Section */}
        <section className="mb-16 overflow-x-auto">
          <h2 className="font-['Geist'] text-[32px] font-semibold text-[#131b2e] mb-6 text-center tracking-[-0.02em]">Compare Features</h2>
          <div className="min-w-[800px] border border-[#c2c6d9] rounded-lg bg-[#ffffff] text-left">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-[#f2f3ff] border-b border-[#c2c6d9]">
                  <th className="p-4 font-['Geist'] text-[13px] font-medium text-[#424656] uppercase tracking-wider w-1/4">Feature</th>
                  <th className="p-4 font-['Geist'] text-[13px] font-medium text-[#424656] uppercase tracking-wider w-1/4 text-center">Starter</th>
                  <th className="p-4 font-['Geist'] text-[13px] font-medium text-[#004bca] uppercase tracking-wider w-1/4 text-center bg-[#004bca]/5">Business</th>
                  <th className="p-4 font-['Geist'] text-[13px] font-medium text-[#424656] uppercase tracking-wider w-1/4 text-center">Enterprise</th>
                </tr>
              </thead>
              <tbody className="text-[14px] text-[#131b2e]">
                <tr className="border-b border-[#c2c6d9]/50 table-row-hover transition-colors">
                  <td className="p-4">Identity Document Verification</td>
                  <td className="p-4 text-center"><span className="material-symbols-outlined text-[#424656] text-[20px]">check</span></td>
                  <td className="p-4 text-center bg-[#004bca]/5"><span className="material-symbols-outlined text-[#004bca] text-[20px]">check</span></td>
                  <td className="p-4 text-center"><span className="material-symbols-outlined text-[#424656] text-[20px]">check</span></td>
                </tr>
                <tr className="border-b border-[#c2c6d9]/50 table-row-hover transition-colors">
                  <td className="p-4">Audit Logs Retention</td>
                  <td className="p-4 text-center">30 Days</td>
                  <td className="p-4 text-center bg-[#004bca]/5">1 Year</td>
                  <td className="p-4 text-center">Unlimited</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      </main>

      {/* Subscription Verification Drawer/Modal System */}
      {modalVisible && (
        <SubscriptionModal
          visible={modalVisible}
          canClose={true}
          onClose={() => setModalVisible(false)}
          partialSubscription={currentSubscription}
        />
      )}
    </div>
  );
}