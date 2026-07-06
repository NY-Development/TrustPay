import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useVerificationDetail } from '@/src/hooks/useVerification';

export default function VerificationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data, isLoading, error } = useVerificationDetail(id || '');

  const verification = data?.data;

  return (
    <div className="max-w-2xl mx-auto py-10 px-6">
      <div className="bg-white dark:bg-[#131b2e] border border-[#c2c6d9]/35 rounded-[32px] p-8 md:p-10 shadow-lg">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8 pb-4 border-b border-[#c2c6d9]/25">
          <button 
            onClick={() => navigate('/dashboard/verify')}
            className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 dark:bg-white/10 dark:hover:bg-white/20 flex items-center justify-center transition-colors text-gray-700 dark:text-gray-300"
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <div>
            <h1 className="text-2xl font-bold text-[#131b2e] dark:text-white">Verification Receipt</h1>
            <p className="text-xs text-[#54647a]">Detailed reference query inspect results</p>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#004bca]" />
          </div>
        ) : error || !verification ? (
          <div className="text-center py-8 text-xs text-[#ba1a1a]">
            Could not retrieve details for this verification record.
          </div>
        ) : (
          <div className="space-y-6">
            {/* Status Panel Banner */}
            <div className={`p-6 rounded-2xl border text-center flex flex-col items-center justify-center ${
              verification.status === 'completed' 
                ? 'bg-emerald-50 border-emerald-500/20 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400' 
                : verification.status === 'failed'
                  ? 'bg-rose-50 border-rose-500/20 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400'
                  : 'bg-amber-50 border-amber-500/20 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400'
            }`}>
              <span className="material-symbols-outlined text-[48px] mb-2">
                {verification.status === 'completed' ? 'check_circle' : verification.status === 'failed' ? 'error' : 'pending'}
              </span>
              <h2 className="text-xl font-bold capitalize">{verification.status} Checking</h2>
              <p className="text-xs mt-1 opacity-80">Reference Code matched CBE core database payloads</p>
            </div>

            {/* Properties Grid */}
            <div className="bg-[#faf8ff] dark:bg-[#0b0e14] border border-[#c2c6d9]/30 rounded-2xl p-5 space-y-4 text-xs">
              <div className="flex justify-between py-1 border-b border-[#c2c6d9]/15">
                <span className="text-[#54647a] dark:text-[#c2c6d9] font-medium">Transaction Reference</span>
                <span className="font-mono font-bold text-[#131b2e] dark:text-white uppercase">{verification.referenceNumber}</span>
              </div>

              <div className="flex justify-between py-1 border-b border-[#c2c6d9]/15">
                <span className="text-[#54647a] dark:text-[#c2c6d9] font-medium">Amount Received</span>
                <span className="font-bold text-[#131b2e] dark:text-white">{verification.amount} {verification.currency}</span>
              </div>

              <div className="flex justify-between py-1 border-b border-[#c2c6d9]/15">
                <span className="text-[#54647a] dark:text-[#c2c6d9] font-medium">Depositor/Payer</span>
                <span className="font-bold text-[#131b2e] dark:text-white">{verification.payerName || 'Unknown'}</span>
              </div>

              <div className="flex justify-between py-1 border-b border-[#c2c6d9]/15">
                <span className="text-[#54647a] dark:text-[#c2c6d9] font-medium">Provider Channel</span>
                <span className="uppercase font-bold text-[#004bca] dark:text-[#b4c5ff]">{verification.provider}</span>
              </div>

              <div className="flex justify-between py-1 border-b border-[#c2c6d9]/15">
                <span className="text-[#54647a] dark:text-[#c2c6d9] font-medium">Payment Timestamp</span>
                <span className="font-mono text-[#131b2e] dark:text-white">
                  {new Date(verification.paymentDate).toLocaleString()}
                </span>
              </div>

              <div className="flex justify-between py-1">
                <span className="text-[#54647a] dark:text-[#c2c6d9] font-medium">Verified By User</span>
                <span className="font-bold text-[#131b2e] dark:text-white">{verification.verifiedBy}</span>
              </div>
            </div>

            {/* Verification Metadata/Raw logs if present */}
            {verification.rawResponse && (
              <div className="space-y-2">
                <span className="block text-xs font-semibold text-[#54647a] uppercase tracking-wider pl-1">
                  Bank Settlement Data
                </span>
                <pre className="bg-[#faf8ff] dark:bg-[#0b0e14] border border-[#c2c6d9]/30 rounded-2xl p-4 text-[10px] font-mono text-[#131b2e] dark:text-gray-300 overflow-x-auto whitespace-pre-wrap">
                  {JSON.stringify(verification.rawResponse, null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
