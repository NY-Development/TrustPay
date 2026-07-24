import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useVerificationDetail } from '@/src/hooks/useVerification';

const severityStyles: Record<string, string> = {
  success: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
  info: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  warning: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
  duplicate: 'bg-orange-500/10 text-orange-600 border-orange-500/20',
  fraud_risk: 'bg-red-600/10 text-red-600 border-red-600/20',
  error: 'bg-rose-500/10 text-rose-600 border-rose-500/20',
};

const DetailRow = ({ label, value, mono }: { label: string; value: React.ReactNode; mono?: boolean }) => (
  <div className="flex justify-between py-1.5 border-b border-[#c2c6d9]/15 last:border-b-0">
    <span className="text-[#54647a] dark:text-[#c2c6d9] font-medium">{label}</span>
    <span className={`font-bold text-[#131b2e] dark:text-white text-right max-w-[60%] break-all ${mono ? 'font-mono' : ''}`}>{value}</span>
  </div>
);

export default function VerificationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data, isLoading, error } = useVerificationDetail(id || '');
  const [showRaw, setShowRaw] = useState(false);

  const v = data?.data;

  return (
    <div className="max-w-3xl mx-auto py-10 px-6">
      <div className="bg-white dark:bg-[#131b2e] border border-[#c2c6d9]/35 rounded-[32px] p-8 md:p-10 shadow-lg">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8 pb-4 border-b border-[#c2c6d9]/25">
          <button
            onClick={() => navigate('/dashboard/verify')}
            className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 dark:bg-white/10 dark:hover:bg-white/20 flex items-center justify-center transition-colors text-gray-700 dark:text-gray-300 cursor-pointer"
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
        ) : error || !v ? (
          <div className="text-center py-8 text-xs text-[#ba1a1a]">
            Could not retrieve details for this verification record.
          </div>
        ) : (
          <div className="space-y-6">
            {/* ── Status Banner ── */}
            <div className={`p-6 rounded-2xl border text-center flex flex-col items-center justify-center ${
              v.processingStatus === 'completed'
                ? 'bg-emerald-50 border-emerald-500/20 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400'
                : v.processingStatus === 'failed'
                  ? 'bg-rose-50 border-rose-500/20 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400'
                  : 'bg-amber-50 border-amber-500/20 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400'
            }`}>
              <span className="material-symbols-outlined text-[48px] mb-2">
                {v.processingStatus === 'completed' ? 'check_circle' : v.processingStatus === 'failed' ? 'error' : 'pending'}
              </span>
              <h2 className="text-xl font-bold capitalize">{v.processingStatus} Verification</h2>
              <p className="text-xs mt-1 opacity-80">
                {v.verified ? 'Payment authenticity confirmed by provider' : 'Awaiting settlement confirmation from provider'}
              </p>
            </div>

            {/* ── Verification Summary (Severity Badge) ── */}
            {v.verificationSummary && (
              <div className={`p-4 rounded-xl border flex items-start gap-3 ${severityStyles[v.verificationSummary.severity] || severityStyles.info}`}>
                <span className="material-symbols-outlined text-[22px] mt-0.5">
                  {v.verificationSummary.severity === 'fraud_risk' ? 'gpp_bad' : v.verificationSummary.severity === 'duplicate' ? 'content_copy' : v.verificationSummary.severity === 'error' ? 'error' : v.verificationSummary.severity === 'warning' ? 'warning' : 'verified'}
                </span>
                <div>
                  <h4 className="font-bold text-sm">{v.verificationSummary.title}</h4>
                  <p className="text-xs mt-0.5 opacity-80">{v.verificationSummary.description}</p>
                </div>
              </div>
            )}

            {/* ── Core Transaction Fields ── */}
            <div className="bg-[#faf8ff] dark:bg-[#0b0e14] border border-[#c2c6d9]/30 rounded-2xl p-5 space-y-1 text-xs">
              <h3 className="text-[10px] font-bold uppercase tracking-wider text-[#54647a] mb-3">Transaction Details</h3>
              <DetailRow label="Transaction ID" value={v.transactionId} mono />
              <DetailRow label="Reference Number" value={v.referenceNumber} mono />
              <DetailRow label="Amount" value={`${v.amount} ${v.currency}`} />
              <DetailRow label="Provider" value={<span className="uppercase text-[#004bca] dark:text-[#b4c5ff]">{v.provider}</span>} />
              <DetailRow label="Payer (Sender)" value={v.payerName || 'Unknown'} />
              {v.receiverName && <DetailRow label="Receiver" value={v.receiverName} />}
              {v.receiverAccount && <DetailRow label="Receiver Account" value={v.receiverAccount} mono />}
              <DetailRow label="Payment Date" value={new Date(v.paymentDate).toLocaleString()} mono />
              <DetailRow label="Source" value={<span className="capitalize">{v.source}</span>} />
              <DetailRow label="Verified" value={v.verified ? '✅ Yes' : '❌ No'} />
              <DetailRow label="Verified By" value={v.verifiedBy} />
              <DetailRow label="Record Created" value={new Date(v.createdAt).toLocaleString()} mono />
            </div>

            {/* ── Verification Result — Bank Specific ── */}
            {v.verificationResult?.bankSpecific && Object.keys(v.verificationResult.bankSpecific).length > 0 && (
              <div className="bg-[#faf8ff] dark:bg-[#0b0e14] border border-[#c2c6d9]/30 rounded-2xl p-5 space-y-1 text-xs">
                <h3 className="text-[10px] font-bold uppercase tracking-wider text-[#54647a] mb-3">Bank-Specific Data</h3>
                {Object.entries(v.verificationResult.bankSpecific).map(([key, val]) => (
                  <DetailRow key={key} label={key.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase())} value={String(val ?? '-')} mono={typeof val === 'number'} />
                ))}
              </div>
            )}

            {/* ── Settlement Account Match ── */}
            {v.verificationResult?.settlementAccountMatch && (
              <div className="bg-[#faf8ff] dark:bg-[#0b0e14] border border-[#c2c6d9]/30 rounded-2xl p-5 space-y-1 text-xs">
                <h3 className="text-[10px] font-bold uppercase tracking-wider text-[#54647a] mb-3">Settlement Account Match</h3>
                {Object.entries(v.verificationResult.settlementAccountMatch).filter(([k]) => k !== 'debug').map(([key, val]) => (
                  <DetailRow key={key} label={key.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase())} value={typeof val === 'boolean' ? (val ? '✅' : '❌') : String(val ?? '-')} />
                ))}
              </div>
            )}

            {/* ── Confirmation History ── */}
            {v.verificationResult?.confirmationHistory && (
              <div className="bg-[#faf8ff] dark:bg-[#0b0e14] border border-[#c2c6d9]/30 rounded-2xl p-5 space-y-1 text-xs">
                <h3 className="text-[10px] font-bold uppercase tracking-wider text-[#54647a] mb-3">Confirmation History</h3>
                {Object.entries(v.verificationResult.confirmationHistory).map(([key, val]) => (
                  <DetailRow key={key} label={key.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase())} value={typeof val === 'boolean' ? (val ? 'Yes' : 'No') : String(val ?? '-')} />
                ))}
              </div>
            )}

            {/* ── Raw Provider Response (Collapsible) ── */}
            {v.rawResponse && (
              <div className="space-y-2">
                <button
                  onClick={() => setShowRaw(!showRaw)}
                  className="flex items-center gap-2 text-xs font-semibold text-[#54647a] dark:text-[#c2c6d9] uppercase tracking-wider pl-1 hover:text-[#004bca] transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px]">{showRaw ? 'expand_less' : 'expand_more'}</span>
                  Raw Provider Response
                </button>
                {showRaw && (
                  <pre className="bg-[#faf8ff] dark:bg-[#0b0e14] border border-[#c2c6d9]/30 rounded-2xl p-4 text-[10px] font-mono text-[#131b2e] dark:text-gray-300 overflow-x-auto whitespace-pre-wrap max-h-96 overflow-y-auto">
                    {JSON.stringify(v.rawResponse, null, 2)}
                  </pre>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
