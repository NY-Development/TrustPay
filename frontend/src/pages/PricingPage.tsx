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

  const currentSubscription = null; // Normally fetched from subscription-status API

  return (
    <div className="bg-[#faf8ff] dark:bg-[#0b0e14] min-h-screen py-20 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h1 className="text-4xl md:text-5xl font-extrabold text-[#131b2e] dark:text-white leading-tight">
            Tailored pricing for cashier desks
          </h1>
          <p className="text-lg text-[#424656] dark:text-[#c2c6d9] mt-4 leading-relaxed">
            Eliminate double payments, reference check verification fraud, and manual logging error today.
          </p>
        </div>

        {/* Pricing Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Starter Plan */}
          <div className="bg-white dark:bg-[#131b2e] border border-[#c2c6d9]/35 rounded-3xl p-8 shadow-xs flex flex-col justify-between">
            <div>
              <h3 className="text-lg font-bold text-[#131b2e] dark:text-white">Trial Tier</h3>
              <p className="text-xs text-[#54647a] dark:text-[#c2c6d9] mt-1">Get started checking references</p>
              <div className="mt-6 flex items-baseline gap-1 text-[#131b2e] dark:text-white">
                <span className="text-4xl font-extrabold">0 ETB</span>
                <span className="text-xs text-[#54647a] dark:text-[#c2c6d9]">/ month</span>
              </div>
              <ul className="mt-8 space-y-4 text-sm text-[#424656] dark:text-[#c2c6d9]">
                <li className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-[18px] text-[#004bca]">check</span>
                  1 desk receptionist account
                </li>
                <li className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-[18px] text-[#004bca]">check</span>
                  15 verifications per day
                </li>
                <li className="flex items-center gap-3 text-gray-400">
                  <span className="material-symbols-outlined text-[18px]">block</span>
                  No CSV export logs
                </li>
              </ul>
            </div>
            <button
              onClick={handlePricingAction}
              className="mt-8 w-full bg-[#505f76]/10 hover:bg-[#505f76]/15 hover:text-[#131b2e] dark:text-[#eef0ff] py-3 rounded-xl font-semibold transition-all cursor-pointer text-center text-sm"
            >
              {isAuthenticated ? 'No Setup Required' : 'Get Started'}
            </button>
          </div>

          {/* Premium Plan */}
          <div className="bg-white dark:bg-[#131b2e] border-2 border-[#004bca] rounded-3xl p-8 shadow-md relative flex flex-col justify-between">
            <div className="absolute top-0 right-8 -translate-y-1/2 bg-[#004bca] text-white px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
              Popular Choice
            </div>
            <div>
              <h3 className="text-lg font-bold text-[#131b2e] dark:text-white">Premium Tier</h3>
              <p className="text-xs text-[#54647a] dark:text-[#c2c6d9] mt-1">Full transaction assurance</p>
              <div className="mt-6 flex items-baseline gap-1 text-[#131b2e] dark:text-white">
                <span className="text-4xl font-extrabold">1,499.99 ETB</span>
                <span className="text-xs text-[#54647a] dark:text-[#c2c6d9]">/ month</span>
              </div>
              <ul className="mt-8 space-y-4 text-sm text-[#424656] dark:text-[#c2c6d9]">
                <li className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-[18px] text-[#004bca]">check</span>
                  Unlimited receptionist desks
                </li>
                <li className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-[18px] text-[#004bca]">check</span>
                  Unlimited payment verifications
                </li>
                <li className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-[18px] text-[#004bca]">check</span>
                  Real-time double spend alerts
                </li>
                <li className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-[18px] text-[#004bca]">check</span>
                  Excel/CSV export reporting logs
                </li>
              </ul>
            </div>
            <button
              onClick={handlePricingAction}
              className="mt-8 w-full bg-[#004bca] hover:bg-[#0061ff] text-white py-3 rounded-xl font-bold transition-all cursor-pointer text-center text-sm shadow-md"
            >
              {isAuthenticated ? 'Verify CBE Reference Now' : 'Start Premium Trial'}
            </button>
          </div>
        </div>

        {/* Subscription Verification Drawer/Modal */}
        {modalVisible && (
          <SubscriptionModal
            visible={modalVisible}
            canClose={true}
            onClose={() => setModalVisible(false)}
            partialSubscription={currentSubscription}
          />
        )}
      </div>
    </div>
  );
}
