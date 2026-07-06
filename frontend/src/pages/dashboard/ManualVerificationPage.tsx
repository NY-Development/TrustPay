import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useVerifyManual } from '@/src/hooks/useVerification';
import { useAuthStore } from '@/src/store/authStore';
import { StatusModal } from '@/src/components/StatusModal';

const providers = [
  { id: 'cbe', name: 'CBE', placeholder: 'e.g. FT123456789' },
  { id: 'telebirr', name: 'Telebirr', placeholder: 'e.g. TELE123456789' },
  { id: 'mpesa', name: 'M-Pesa', placeholder: 'e.g. MP123456789' },
  { id: 'boa', name: 'BOA', placeholder: 'e.g. BOA123456789' },
  { id: 'cbebirr', name: 'CBE Birr', placeholder: 'e.g. CBE-BIRR123456789' },
  { id: 'dashen', name: 'Dashen', placeholder: 'e.g. DASHEN123456789' },
  { id: 'awash', name: 'Awash', placeholder: 'e.g. AWASH123456789' },
] as const;

export default function ManualVerificationPage() {
  const { user } = useAuthStore();
  const navigate = useNavigate();

  const registeredProviders = useMemo(() => {
    if (!user?.accounts) return [];
    return providers.filter(p => user.accounts.some(acc => acc.accountProvider === p.id));
  }, [user]);

  const [provider, setProvider] = useState<string>('cbe');
  const [reference, setReference] = useState('');
  const [amount, setAmount] = useState('');
  const [verifiedId, setVerifiedId] = useState<string | null>(null);
  const [showMobileBanner, setShowMobileBanner] = useState(true);
  
  const [modal, setModal] = useState<{
    visible: boolean;
    type: 'success' | 'error' | 'info';
    title: string;
    message: string;
  }>({ visible: false, type: 'info', title: '', message: '' });

  const verifyMutation = useVerifyManual();

  useEffect(() => {
    if (registeredProviders.length > 0 && !registeredProviders.some(p => p.id === provider)) {
      setProvider(registeredProviders[0].id);
    }
  }, [registeredProviders, provider]);

  const handlePasteFromClipboard = async (e: React.MouseEvent) => {
    e.preventDefault();
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setReference(text.trim().toUpperCase());
      }
    } catch (err) {
      console.warn('Failed to read from browser clipboard', err);
    }
  };

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reference.trim()) {
      setModal({ visible: true, type: 'error', title: 'Missing Info', message: 'Please enter the transaction reference ID.' });
      return;
    }

    verifyMutation.mutate({
      reference: reference.trim(),
      provider,
      amountExpected: amount ? parseFloat(amount) : undefined,
    }, {
      onSuccess: (res) => {
        if (res.success && res.data) {
          setVerifiedId(res.data._id || res.data.id || null);
        }
        setModal({
          visible: true,
          type: res.success ? 'success' : 'error',
          title: res.success ? 'Payment Verified' : 'Verification Failed',
          message: res.message || (res.success ? 'Transaction is valid and active.' : 'Invalid reference ID.')
        });
      },
      onError: (err: any) => {
        setModal({
          visible: true,
          type: 'error',
          title: 'Error',
          message: err.response?.data?.message || 'Verification service unreachable.'
        });
      }
    });
  };

  const activeProvider = providers.find(p => p.id === provider);
  const placeholderText = activeProvider ? activeProvider.placeholder : 'e.g. TXN123456789';

  return (
    <div className="max-w-2xl mx-auto py-10 px-6">
      <div className="bg-white dark:bg-[#131b2e] border border-[#c2c6d9]/35 rounded-[32px] p-8 md:p-10 shadow-lg">
        <div className="flex items-center gap-4 mb-6">
          <button 
            onClick={() => navigate('/dashboard/verify')}
            className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 dark:bg-white/10 dark:hover:bg-white/20 flex items-center justify-center transition-colors text-gray-700 dark:text-gray-300 cursor-pointer"
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <div>
            <h1 className="text-2xl font-bold text-[#131b2e] dark:text-white">Manual Verification</h1>
            <p className="text-xs text-[#54647a]">Validate CBE, Telebirr or M-Pesa reference receipts</p>
          </div>
        </div>

        {/* Mobile-Only Features Banner */}
        {showMobileBanner && (
          <div className="mb-6 bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 rounded-2xl p-4 flex items-start gap-3 relative">
            <span className="material-symbols-outlined text-blue-500 text-[28px] mt-0.5">smartphone</span>
            <div className="pr-8">
              <h4 className="text-sm font-bold text-blue-700 dark:text-blue-400">📱 Scan & OCR — Mobile Exclusive</h4>
              <p className="text-xs text-blue-600/80 dark:text-blue-300/70 mt-1 leading-relaxed">
                Screenshot scan and OCR receipt extraction features are available exclusively on our TrustPay mobile app. Download from Play Store or App Store for the full experience.
              </p>
            </div>
            <button
              onClick={() => setShowMobileBanner(false)}
              className="absolute top-3 right-3 text-blue-400 hover:text-blue-600 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          </div>
        )}

        {registeredProviders.length === 0 ? (
          <div className="bg-amber-500/10 border border-amber-500/20 p-6 rounded-2xl mb-8">
            <h3 className="text-amber-700 dark:text-amber-400 font-bold text-sm mb-2">No Settlement Accounts Registered</h3>
            <p className="text-xs text-[#54647a] dark:text-[#c2c6d9] leading-relaxed">
              To verify manual payments, please add at least one bank or mobile wallet account in Profile Settings.
            </p>
          </div>
        ) : (
          <form onSubmit={handleVerify} className="space-y-6">
            {/* Provider selector */}
            <div>
              <label className="block text-xs font-semibold text-[#131b2e] dark:text-[#eef0ff] uppercase tracking-wider mb-2">
                Select Provider
              </label>
              <div className="grid grid-cols-3 gap-3">
                {registeredProviders.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setProvider(p.id)}
                    className={`py-3 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                      provider === p.id 
                        ? 'bg-[#004bca] border-[#004bca] text-white shadow-sm' 
                        : 'bg-[#faf8ff] border-[#c2c6d9]/30 dark:bg-transparent dark:border-white/10 text-[#54647a]'
                    }`}
                  >
                    {p.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Reference Input */}
            <div>
              <label className="block text-xs font-semibold text-[#131b2e] dark:text-[#eef0ff] uppercase tracking-wider mb-2">
                Reference ID / Transaction ID
              </label>
              <div className="relative flex items-center bg-[#faf8ff] dark:bg-[#0b0e14] border border-[#c2c6d9] dark:border-white/10 rounded-xl px-4 py-3">
                <input
                  type="text"
                  required
                  placeholder={placeholderText}
                  value={reference}
                  onChange={(e) => setReference(e.target.value.toUpperCase())}
                  className="w-full bg-transparent text-sm font-bold uppercase text-[#131b2e] dark:text-white outline-none mr-2"
                />
                <button
                  type="button"
                  onClick={handlePasteFromClipboard}
                  className="flex items-center gap-1 bg-[#004bca]/10 border border-[#004bca]/20 text-[#004bca] px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px]">content_paste</span>
                  <span>Paste</span>
                </button>
              </div>
            </div>

            {/* Expected Amount */}
            <div>
              <label className="block text-xs font-semibold text-[#131b2e] dark:text-[#eef0ff] uppercase tracking-wider mb-2">
                Expected Amount (Optional)
              </label>
              <div className="relative flex items-center bg-[#faf8ff] dark:bg-[#0b0e14] border border-[#c2c6d9] dark:border-white/10 rounded-xl px-4 py-3">
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full bg-transparent text-sm outline-none text-[#131b2e] dark:text-white"
                />
                <span className="text-xs font-bold text-[#54647a] shrink-0 ml-2">ETB</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={verifyMutation.isPending}
              className="w-full mt-4 bg-[#004bca] hover:bg-[#0061ff] active:scale-95 text-white font-bold py-3.5 rounded-xl transition-all cursor-pointer text-sm shadow-md flex justify-center items-center gap-2"
            >
              {verifyMutation.isPending ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span className="material-symbols-outlined text-[18px]">verified_user</span>
                  <span>Verify Payment</span>
                </>
              )}
            </button>
          </form>
        )}
      </div>

      <StatusModal 
        visible={modal.visible}
        type={modal.type}
        title={modal.title}
        message={modal.message}
        onClose={() => {
          setModal({ ...modal, visible: false });
          if (modal.type === 'success' && verifiedId) {
            navigate(`/dashboard/verify/${verifiedId}`);
          }
        }} 
      />
    </div>
  );
}
