import React, { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { useVerifySubscription, useTopUpSubscription } from '../hooks/useSubscription';
import { StatusModal } from './StatusModal';
import type { Subscription } from '../types';
import { ShieldAlert, LogOut, CheckCircle2, Wallet, X, Receipt } from 'lucide-react';

interface SubscriptionModalProps {
  visible: boolean;
  canClose: boolean;
  onClose: () => void;
  partialSubscription?: Partial<Subscription>;
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
  
  // Safe handling of partial data
  const paid = partialSubscription?.paidAmount ?? 0;
  const required = partialSubscription?.requiredAmount ?? 0;
  const remainingAmount = isPartialPayment ? (required - paid) : 0;
  const progressPercentage = required > 0 ? Math.min((paid / required) * 100, 100) : 0;

  const handleVerify = () => {
    if (!reference.trim()) {
      setModal({ visible: true, type: 'error', title: 'Reference Missing', message: 'Please enter the transaction reference ID.' });
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
          message: res.message || 'Payment verified!'
        });
        if (isFullyPaid && canClose && onClose) setTimeout(onClose, 1500);
      },
      onError: (err: any) => {
        setModal({
          visible: true,
          type: 'error',
          title: 'Verification Failed',
          message: err.response?.data?.message || err.message || 'Could not verify.'
        });
      }
    });
  };

  const handleTopUp = () => {
    if (!reference.trim()) {
      setModal({ visible: true, type: 'error', title: 'Reference Missing', message: 'Please enter the transaction reference ID.' });
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
          message: res.message || 'Top-up processed.'
        });
        if (isFullyPaid && canClose && onClose) setTimeout(onClose, 1500);
      },
      onError: (err: any) => {
        setModal({
          visible: true,
          type: 'error',
          title: 'Top-Up Failed',
          message: err.response?.data?.message || err.message || 'Could not verify top-up.'
        });
      }
    });
  };

  const currentTransferPrice = plan === 'monthly' ? '1500' : '15000';
  const isLoading = verifyMutation.isPending || topUpMutation.isPending;

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white dark:bg-[#131b2e] rounded-3xl border border-[#c2c6d9]/30 shadow-2xl p-6 md:p-8 max-h-[90vh] overflow-y-auto flex flex-col justify-between">
        <div className="flex justify-between items-center mb-6">
          <div>
            <span className="text-[#004bca] dark:text-[#b4c5ff] font-bold tracking-wider text-xs uppercase">
              {isPartialPayment ? 'Complete Payment' : 'TrustPay Premium'}
            </span>
          </div>
          {canClose ? (
            <button onClick={onClose} className="w-10 h-10 rounded-full bg-gray-100 dark:bg-white/10 items-center justify-center flex transition-colors">
              <X size={20} />
            </button>
          ) : (
            <button onClick={() => logoutUser()} className="flex items-center gap-2 bg-[#ba1a1a]/10 text-[#ba1a1a] px-4 py-2 rounded-full font-bold text-xs">
              <LogOut size={16} /> <span>Sign Out</span>
            </button>
          )}
        </div>

        <div className="flex-1 space-y-6">
          {isPartialPayment ? (
            <>
              <div className="bg-[#faf8ff] dark:bg-[#0b0e14] border border-amber-500/30 p-5 rounded-2xl">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-500">
                    <ShieldAlert size={22} />
                  </div>
                  <h3 className="text-lg font-bold">Incomplete Payment</h3>
                </div>
                <div className="bg-[#c2c6d9]/30 rounded-full h-3 mb-3 overflow-hidden">
                  <div className="bg-amber-500 h-full rounded-full transition-all duration-500" style={{ width: `${progressPercentage}%` }} />
                </div>
                <div className="flex justify-between text-xs text-[#54647a] dark:text-[#c2c6d9]">
                  <span>Paid: <strong>{paid} ETB</strong></span>
                  <span>Total: <strong>{required} ETB</strong></span>
                </div>
              </div>

              <div className="space-y-4">
                <input type="text" value={reference} onChange={(e) => setReference(e.target.value)} placeholder="Transaction Reference" className="w-full border p-3 rounded-xl" />
                <button onClick={handleTopUp} disabled={isLoading} className="w-full bg-amber-500 text-white font-bold py-3.5 rounded-xl">
                  {isLoading ? 'Processing...' : 'Complete Payment'}
                </button>
              </div>
            </>
          ) : (
            <>
              <p className="text-sm">TrustPay requires merchants to maintain an active subscription.</p>
              <div className="space-y-4">
                <input type="text" value={reference} onChange={(e) => setReference(e.target.value)} placeholder="Transaction Reference" className="w-full border p-3 rounded-xl" />
                <button onClick={handleVerify} disabled={isLoading} className="w-full bg-[#004bca] text-white font-bold py-3.5 rounded-xl">
                  {isLoading ? 'Processing...' : 'Verify & Activate'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
      <StatusModal {...modal} onClose={() => setModal({ ...modal, visible: false })} />
    </div>
  );
}

function PaymentStep({ number, text }: { number: string; text: string }) {
  return (
    <div className="flex items-start py-0.5">
      <div className="w-5 h-5 rounded-full bg-[#004bca]/10 text-[#004bca] flex items-center justify-center font-bold text-xs shrink-0 mr-3 mt-0.5">{number}</div>
      <p className="text-gray-600 dark:text-gray-300 text-xs flex-1">{text}</p>
    </div>
  );
}