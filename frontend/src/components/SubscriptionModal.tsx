import React, { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { useVerifySubscription, useTopUpSubscription } from '../hooks/useSubscription';
import { StatusModal } from './StatusModal';
import type { Subscription } from '../types';
import { ShieldAlert, LogOut, CheckCircle2, Wallet, X, Receipt } from 'lucide-react';

interface SubscriptionModalProps {
  visible: boolean;
  canClose?: boolean;
  onClose?: () => void;
  partialSubscription?: Subscription | null;
}

export default function SubscriptionModal({ visible, canClose = false, onClose, partialSubscription }: SubscriptionModalProps) {
  const logoutUser = useAuthStore(state => state.logout);
  const verifyMutation = useVerifySubscription();
  const topUpMutation = useTopUpSubscription();

  const [plan, setPlan] = useState<'monthly' | 'yearly'>('monthly');
  const [reference, setReference] = useState('');
  const [modal, setModal] = useState<{
    visible: boolean;
    type: 'success' | 'error' | 'info';
    title: string;
    message: string;
  }>({ visible: false, type: 'info', title: '', message: '' });

  if (!visible) return null;

  const isPartialPayment = !!partialSubscription && partialSubscription.status === 'partial_payment';
  const remainingAmount = isPartialPayment ? (partialSubscription.requiredAmount - partialSubscription.paidAmount) : 0;

  const handleVerify = () => {
    if (!reference.trim()) {
      setModal({
        visible: true,
        type: 'error',
        title: 'Reference Missing',
        message: 'Please enter the transaction reference ID shown on your payment confirmation.'
      });
      return;
    }

    verifyMutation.mutate({ reference: reference.trim(), plan }, {
      onSuccess: (res) => {
        setReference('');
        const isFullyPaid = res.fullyPaid !== false;
        
        setModal({
          visible: true,
          type: isFullyPaid ? 'success' : 'info',
          title: isFullyPaid ? 'Subscription Active' : 'Partial Payment Received',
          message: res.message || 'Your subscription payment has been verified!'
        });
        
        if (isFullyPaid && canClose && onClose) setTimeout(onClose, 1500);
      },
      onError: (err: any) => {
        setModal({
          visible: true,
          type: 'error',
          title: 'Verification Failed',
          message: err.response?.data?.message || err.message || 'Could not verify payment. Please double-check details.'
        });
      }
    });
  };

  const handleTopUp = () => {
    if (!reference.trim()) {
      setModal({
        visible: true,
        type: 'error',
        title: 'Reference Missing',
        message: 'Please enter the transaction reference ID for your top-up payment.'
      });
      return;
    }

    topUpMutation.mutate({ reference: reference.trim() }, {
      onSuccess: (res) => {
        setReference('');
        const isFullyPaid = res.fullyPaid !== false;

        setModal({
          visible: true,
          type: isFullyPaid ? 'success' : 'info',
          title: isFullyPaid ? 'Subscription Active!' : 'Top-Up Received',
          message: res.message || 'Top-up payment processed.'
        });

        if (isFullyPaid && canClose && onClose) setTimeout(onClose, 1500);
      },
      onError: (err: any) => {
        setModal({
          visible: true,
          type: 'error',
          title: 'Top-Up Failed',
          message: err.response?.data?.message || err.message || 'Could not verify top-up payment.'
        });
      }
    });
  };

  const currentPrice = plan === 'monthly' ? '1,499.99' : '14,999.99';
  const currentTransferPrice = plan === 'monthly' ? '1500' : '15000';
  const isLoading = verifyMutation.isPending || topUpMutation.isPending;

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white dark:bg-[#131b2e] rounded-3xl border border-[#c2c6d9]/30 shadow-2xl p-6 md:p-8 max-h-[90vh] overflow-y-auto flex flex-col justify-between">
        
        {/* Header row */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <span className="text-[#004bca] dark:text-[#b4c5ff] font-bold tracking-wider text-xs uppercase">
              {isPartialPayment ? 'Complete Payment' : canClose ? 'Premium Features' : 'Paywall Locked'}
            </span>
            <h2 className="text-2xl md:text-3xl font-extrabold mt-1 text-[#131b2e] dark:text-white">
              {isPartialPayment ? 'Finish Payment' : 'TrustPay Premium'}
            </h2>
          </div>

          {canClose ? (
            <button 
              onClick={onClose}
              className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 dark:bg-white/10 dark:hover:bg-white/20 items-center justify-center flex transition-colors text-gray-700 dark:text-gray-300"
            >
              <X size={20} />
            </button>
          ) : (
            <button 
              onClick={() => logoutUser()}
              className="flex items-center gap-2 bg-[#ba1a1a]/10 hover:bg-[#ba1a1a]/15 text-[#ba1a1a] px-4 py-2 rounded-full font-bold text-xs transition-colors"
            >
              <LogOut size={16} />
              <span>Sign Out</span>
            </button>
          )}
        </div>

        <div className="flex-1 space-y-6">
          {isPartialPayment ? (
            /* ─── PARTIAL PAYMENT TOP-UP VIEW ─── */
            <>
              {/* Payment Progress Card */}
              <div className="bg-[#faf8ff] dark:bg-[#0b0e14] border border-amber-500/30 p-5 rounded-2xl">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-500">
                    <ShieldAlert size={22} />
                  </div>
                  <h3 className="text-lg font-bold text-[#131b2e] dark:text-white">Incomplete Payment</h3>
                </div>
                
                <p className="text-sm text-[#424656] dark:text-[#c2c6d9] leading-relaxed mb-4">
                  Your {partialSubscription?.plan} subscription payment is incomplete. Please send the remaining amount to activate your account.
                </p>

                {/* Progress Bar */}
                <div className="bg-[#c2c6d9]/30 rounded-full h-3 mb-3 overflow-hidden">
                  <div 
                    className="bg-amber-500 h-full rounded-full transition-all duration-505"
                    style={{ width: `${Math.min((partialSubscription!.paidAmount / partialSubscription!.requiredAmount) * 100, 100)}%` }}
                  />
                </div>

                <div className="flex justify-between text-xs text-[#54647a] dark:text-[#c2c6d9]">
                  <span>Paid: <strong className="text-[#131b2e] dark:text-white">{partialSubscription!.paidAmount} ETB</strong></span>
                  <span>Total: <strong className="text-[#131b2e] dark:text-white">{partialSubscription!.requiredAmount} ETB</strong></span>
                </div>

                <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 mt-4 text-center">
                  <div className="text-amber-700 dark:text-amber-400 font-bold text-lg">
                    {remainingAmount} ETB remaining
                  </div>
                  <div className="text-[#424656] dark:text-[#c2c6d9] text-xs mt-1 font-semibold">
                    Send exactly {remainingAmount} ETB to CBE Account: 1000403196928 (YAMLAK NEGASH DUGO)
                  </div>
                </div>
              </div>

              {/* Instructions */}
              <div className="space-y-3 bg-[#faf8ff] dark:bg-[#0b0e14] border border-[#c2c6d9]/25 p-5 rounded-2xl text-sm">
                <h4 className="font-bold text-[#131b2e] dark:text-white">Complete Your Payment</h4>
                <div className="space-y-2">
                  <PaymentStep number="1" text={`Transfer exactly ${remainingAmount} ETB to CBE Account: 1000403196928.`} />
                  <PaymentStep number="2" text="Receiver Name: YAMLAK NEGASH DUGO" />
                  <PaymentStep number="3" text="Copy the new CBE transaction reference number from the confirmation screen." />
                  <PaymentStep number="4" text="Paste it below and verify to activate your subscription." />
                </div>
              </div>

              {/* Input & Action */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold mb-2 pl-1 text-[#131b2e] dark:text-white">Top-Up Transaction Reference</label>
                  <div className="relative flex items-center bg-[#faf8ff] dark:bg-[#0b0e14] border border-[#c2c6d9]/40 rounded-xl px-4 py-3">
                    <Receipt className="text-[#54647a] mr-3" size={20} />
                    <input
                      type="text"
                      value={reference}
                      onChange={(e) => setReference(e.target.value)}
                      placeholder="e.g. FT23126..."
                      autoCapitalize="characters"
                      className="w-full bg-transparent text-sm font-bold uppercase text-[#131b2e] dark:text-white placeholder-gray-400 outline-none"
                    />
                  </div>
                </div>

                <button 
                  onClick={handleTopUp}
                  disabled={isLoading}
                  className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-md select-none transition-colors"
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Wallet size={20} />
                      <span>Complete Payment</span>
                    </>
                  )}
                </button>
              </div>
            </>
          ) : (
            /* ─── STANDARD SUBSCRIPTION VIEW ─── */
            <>
              <p className="text-sm text-[#424656] dark:text-[#c2c6d9] leading-relaxed">
                TrustPay requires merchants to maintain an active subscription. Select a billing plan, complete your transaction, and register below.
              </p>

              {/* Plan Selector */}
              <div className="flex gap-4">
                <button 
                  onClick={() => setPlan('monthly')}
                  className={`flex-grow-1 text-left bg-[#faf8ff] dark:bg-[#0b0e14] border-2 p-5 rounded-2xl transition-all cursor-pointer ${
                    plan === 'monthly' ? 'border-[#004bca]' : 'border-[#c2c6d9]/30'
                  }`}
                >
                  <span className="text-[#54647a] dark:text-[#c2c6d9] font-medium text-xs block uppercase">Monthly Plan</span>
                  <span className="text-2xl font-black mt-2 block text-[#131b2e] dark:text-white">1,499.99 ETB</span>
                  <span className="text-[#54647a] dark:text-[#c2c6d9] text-xs mt-1 block">Billed monthly</span>
                </button>
              </div>

              {/* Instructions */}
              <div className="space-y-3 bg-[#faf8ff] dark:bg-[#0b0e14] border border-[#c2c6d9]/25 p-5 rounded-2xl text-sm">
                <h4 className="font-bold text-[#131b2e] dark:text-white">Payment Instructions</h4>
                <div className="space-y-2">
                  <PaymentStep number="1" text={`Transfer exactly ${currentTransferPrice} ETB to CBE Account: 1000403196928.`} />
                  <PaymentStep number="2" text="Receiver Name: YAMLAK NEGASH DUGO" />
                  <PaymentStep number="3" text="Copy the unique CBE transaction reference ID from your receipt, and paste it below." />
                  <PaymentStep number="4" text="Note: Subscription checks are currently processed for CBE payments only." />
                </div>
              </div>

              {/* Input & Action */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold mb-2 pl-1 text-[#131b2e] dark:text-white">Transaction Reference (ID)</label>
                  <div className="relative flex items-center bg-[#faf8ff] dark:bg-[#0b0e14] border border-[#c2c6d9]/40 rounded-xl px-4 py-3">
                    <Receipt className="text-[#54647a] mr-3" size={20} />
                    <input
                      type="text"
                      value={reference}
                      onChange={(e) => setReference(e.target.value)}
                      placeholder="e.g. FT23126..."
                      autoCapitalize="characters"
                      className="w-full bg-transparent text-sm font-bold uppercase text-[#131b2e] dark:text-white placeholder-gray-400 outline-none"
                    />
                  </div>
                </div>

                <button 
                  onClick={handleVerify}
                  disabled={isLoading}
                  className="w-full bg-[#004bca] hover:bg-[#0061ff] text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-md select-none transition-colors"
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <CheckCircle2 size={20} />
                      <span>Verify & Activate</span>
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      <StatusModal 
        {...modal} 
        onClose={() => setModal({ ...modal, visible: false })} 
      />
    </div>
  );
}

function PaymentStep({ number, text }: { number: string; text: string }) {
  return (
    <div className="flex items-start py-0.5">
      <div className="w-5 h-5 rounded-full bg-[#004bca]/10 text-[#004bca] flex items-center justify-center font-bold text-xs shrink-0 mr-3 mt-0.5">
        {number}
      </div>
      <p className="text-gray-600 dark:text-gray-300 text-xs flex-1 leading-normal">{text}</p>
    </div>
  );
}