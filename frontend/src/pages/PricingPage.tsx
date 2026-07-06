import React, { useState } from 'react';
import SubscriptionModal from '../components/SubscriptionModal';
import { useAuthStore } from '../store/authStore';

export default function PricingPage() {
  const { isAuthenticated } = useAuthStore();
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<any>(null);

  const prices = [
    { name: 'Starter', price: 0, trialDays: 5, id: 'starter' },
    { name: 'Business', price: 1499.99, trialDays: 0, id: 'business' },
    { name: 'Enterprise', price: null, trialDays: 0, id: 'enterprise' }
  ];

  const handlePricingAction = (plan: any) => {
    if (plan.id === 'enterprise') {
      window.location.href = '/contact';
      return;
    }

    if (!isAuthenticated) {
      window.location.href = '/register';
    } else {
      setSelectedPlan(plan);
      setModalVisible(true);
    }
  };

  return (
    <div className="bg-background text-foreground antialiased min-h-screen">
      <main className="max-w-[1280px] mx-auto px-6 pt-24 pb-10">
        
        {/* Title and Description Before */}
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold mb-4">Choose Your Plan</h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Scale your verification operations with our flexible pricing models designed for growing enterprises.
          </p>
        </div>

        {/* Pricing Cards Section */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16 pt-4">
          {/* Starter */}
          <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
            <h3 className="text-[24px] font-medium mb-1">Starter</h3>
            <div className="mb-6">
              <span className="text-[48px] font-semibold">0 ETB</span>
              <p className="text-xs text-emerald-600">Includes 5 days trial</p>
            </div>
            <button onClick={() => handlePricingAction(prices[0])} className="w-full border border-input py-2.5 rounded-lg hover:bg-secondary transition-colors">
              Get Started
            </button>
          </div>

          {/* Business (Popular) */}
          <div className="bg-card border-2 border-primary rounded-xl p-6 relative scale-105 z-10 shadow-lg">
            <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-[13px] px-3 py-1 rounded-bl-lg font-medium">Most Popular</div>
            <h3 className="text-[24px] font-medium mb-1">Business</h3>
            <div className="mb-6"><span className="text-[48px] font-semibold">1,499.99 ETB</span></div>
            <button onClick={() => handlePricingAction(prices[1])} className="w-full bg-primary text-primary-foreground py-2.5 rounded-lg font-medium hover:bg-primary/90 transition-colors">
              Start Premium Trial
            </button>
          </div>

          {/* Enterprise */}
          <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
            <h3 className="text-[24px] font-medium mb-1">Enterprise</h3>
            <div className="mb-6 h-[53px] flex items-end"><span className="text-[32px] font-semibold">Custom Pricing</span></div>
            <button onClick={() => handlePricingAction(prices[2])} className="w-full border border-input py-2.5 rounded-lg hover:bg-secondary transition-colors">
              Contact Sales
            </button>
          </div>
        </section>

        {/* Description After */}
        {!isAuthenticated && (
          <section className="bg-card p-8 rounded-2xl border border-border shadow-sm text-center mb-10">
            <h2 className="text-2xl font-bold mb-4">Why verify with our platform?</h2>
            <p className="text-muted-foreground max-w-xl mx-auto mb-6">
              Reconcile digital payment details instantly. Ensure cashier clerks copy and paste transfer references exactly to eliminate double claims. 
              Join our growing network of businesses securing their revenue streams today.
            </p>
            <a href="/register" className="inline-block bg-foreground text-background px-8 py-3 rounded-lg font-medium hover:bg-primary transition-colors">
              Create Free Account
            </a>
          </section>
        )}
      </main>

      {modalVisible && isAuthenticated && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-card w-full max-w-lg rounded-2xl p-6 border border-border">
            <SubscriptionModal
              visible={modalVisible}
              canClose={true}
              onClose={() => setModalVisible(false)}
              partialSubscription={{ plan: selectedPlan }}
            />
          </div>
        </div>
      )}
    </div>
  );
}