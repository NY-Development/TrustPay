import React, { useState } from 'react';
import { useAdminVerifications } from '../../hooks/useAdmin';

export default function AdminVerificationsPage() {
  const [status, setStatus] = useState('');
  const [severity, setSeverity] = useState('');
  const [provider, setProvider] = useState('');

  const { data: verificationsRes, isLoading, refetch } = useAdminVerifications({
    status: status || undefined,
    severity: severity || undefined,
    provider: provider || undefined,
  });

  const verifications = verificationsRes?.data || [];
  const [selectedVer, setSelectedVer] = useState<any | null>(null);

  const getSeverityBadgeClass = (sev: string) => {
    switch (sev) {
      case 'success':
        return 'bg-green-100 text-green-800 dark:bg-green-950/30 dark:text-green-400';
      case 'fraud_risk':
        return 'bg-red-200 text-red-900 dark:bg-red-950 dark:text-red-400 font-bold';
      case 'warning':
      case 'duplicate':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-950/30 dark:text-yellow-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Verifications Pool</h1>
          <p className="text-xs text-gray-500 mt-1">Monitor transaction verification outcomes, provider payloads, and fraud indicators.</p>
        </div>
        <span className="bg-green-500/10 text-green-600 dark:text-green-400 text-xs font-bold px-3 py-1.5 rounded-full border border-green-500/20">
          {verifications.length} Records
        </span>
      </div>

      {/* Filters bar */}
      <div className="bg-white dark:bg-[#131b2e] p-4 rounded-xl border border-[#c2c6d9]/30 dark:border-white/10 flex flex-wrap gap-4 items-center">
        <div className="w-[180px]">
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-white/10 rounded-lg text-sm bg-transparent outline-none focus:border-red-500 dark:text-white"
          >
            <option value="" className="dark:bg-[#131b2e]">All Statuses</option>
            <option value="pending" className="dark:bg-[#131b2e]">Pending</option>
            <option value="processing" className="dark:bg-[#131b2e]">Processing</option>
            <option value="completed" className="dark:bg-[#131b2e]">Completed</option>
            <option value="failed" className="dark:bg-[#131b2e]">Failed</option>
          </select>
        </div>

        <div className="w-[180px]">
          <select
            value={severity}
            onChange={(e) => setSeverity(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-white/10 rounded-lg text-sm bg-transparent outline-none focus:border-red-500 dark:text-white"
          >
            <option value="" className="dark:bg-[#131b2e]">All Severities</option>
            <option value="success" className="dark:bg-[#131b2e]">Success</option>
            <option value="warning" className="dark:bg-[#131b2e]">Warning</option>
            <option value="duplicate" className="dark:bg-[#131b2e]">Duplicate</option>
            <option value="fraud_risk" className="dark:bg-[#131b2e]">Fraud Risk</option>
            <option value="error" className="dark:bg-[#131b2e]">Error</option>
          </select>
        </div>

        <div className="w-[185px]">
          <select
            value={provider}
            onChange={(e) => setProvider(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-white/10 rounded-lg text-sm bg-transparent outline-none focus:border-red-500 dark:text-white"
          >
            <option value="" className="dark:bg-[#131b2e]">All Providers</option>
            <option value="cbe" className="dark:bg-[#131b2e]">CBE</option>
            <option value="boa" className="dark:bg-[#131b2e]">BOA</option>
            <option value="telebirr" className="dark:bg-[#131b2e]">Telebirr</option>
            <option value="mpesa" className="dark:bg-[#131b2e]">m-pesa</option>
          </select>
        </div>

        <button
          onClick={() => refetch()}
          className="bg-red-600 hover:bg-red-700 text-white font-semibold text-sm px-4 py-2 rounded-lg transition-colors cursor-pointer flex items-center gap-2"
        >
          <span className="material-symbols-outlined text-[18px]">refresh</span>
          Refresh
        </button>
      </div>

      {/* Verifications catalog */}
      <div className="bg-white dark:bg-[#131b2e] border border-[#c2c6d9]/30 dark:border-white/10 rounded-xl overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="p-8 text-center text-xs text-gray-500 animate-pulse">Querying verification records...</div>
        ) : verifications.length === 0 ? (
          <div className="p-8 text-center text-xs text-gray-400">No verifications matched criteria query.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-900 border-b border-[#c2c6d9]/20 dark:border-white/10 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  <th className="px-6 py-4">Transaction ID / Date</th>
                  <th className="px-6 py-4">Branch</th>
                  <th className="px-6 py-4">Payer / Receiver</th>
                  <th className="px-6 py-4">Amount</th>
                  <th className="px-6 py-4">Provider</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Severity</th>
                  <th className="px-6 py-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#c2c6d9]/10 dark:divide-white/5 text-sm">
                {verifications.map((v: any) => (
                  <tr key={v._id} className="hover:bg-gray-50/50 dark:hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-gray-900 dark:text-white font-mono uppercase tracking-tight select-all">{v.transactionId}</div>
                      <span className="text-[10px] text-gray-400">{new Date(v.createdAt).toLocaleString()}</span>
                    </td>
                    <td className="px-6 py-4 text-xs">
                      {v.branchId ? (
                        <>
                          <div className="font-semibold text-gray-800 dark:text-gray-200">{v.branchId.branchName}</div>
                          <span className="text-gray-400 font-mono text-[10px]">{v.branchId.branchCode}</span>
                        </>
                      ) : (
                        <span className="text-gray-400 italic">Unknown</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-gray-900 dark:text-gray-200 text-xs font-semibold">From: {v.senderName || 'Unknown'}</div>
                      <div className="text-gray-500 text-[10px]">To: {v.receiverName || 'Unknown'} ({v.receiverAccount || 'N/A'})</div>
                    </td>
                    <td className="px-6 py-4 font-bold text-gray-900 dark:text-white">
                      {v.amount} {v.currency}
                    </td>
                    <td className="px-6 py-4">
                      <span className="bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 px-2 py-0.5 rounded text-[10px] font-semibold uppercase">
                        {v.provider}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                        v.processingStatus === 'completed' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                      }`}>
                        {v.processingStatus}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${getSeverityBadgeClass(v.verificationSummary?.severity || 'info')}`}>
                        {v.verificationSummary?.severity || 'info'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => setSelectedVer(v)}
                        className="bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-xs font-bold px-3 py-1.5 rounded-lg transition-colors cursor-pointer dark:text-white"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Inspect Popup Modal */}
      {selectedVer && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50 backdrop-blur-sm transition-opacity">
          <div className="bg-white dark:bg-[#131b2e] rounded-2xl max-w-2xl w-full border border-red-500/20 max-h-[85vh] overflow-y-auto shadow-2xl p-6 relative">
            <button
              onClick={() => setSelectedVer(null)}
              className="absolute right-4 top-4 hover:bg-gray-100 dark:hover:bg-white/10 p-1.5 rounded-full text-gray-400 dark:text-[#c2c6d9] transition-colors"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>

            <h3 className="text-lg font-bold text-red-600 dark:text-red-400 mb-6">Verification Inspection Detail</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono text-gray-600 dark:text-gray-300">
              <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                <span className="text-[10px] text-gray-400 uppercase font-semibold">Verification DB ID</span>
                <p className="mt-1 text-gray-900 dark:text-white break-all select-all">{selectedVer._id}</p>
              </div>
              <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                <span className="text-[10px] text-gray-400 uppercase font-semibold">Transaction ID</span>
                <p className="mt-1 text-gray-900 dark:text-white select-all">{selectedVer.transactionId}</p>
              </div>
              <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                <span className="text-[10px] text-gray-400 uppercase font-semibold">Sender Payer Name</span>
                <p className="mt-1 text-gray-900 dark:text-white">{selectedVer.senderName || 'Unknown'}</p>
              </div>
              <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                <span className="text-[10px] text-gray-400 uppercase font-semibold">Receiver Name</span>
                <p className="mt-1 text-gray-900 dark:text-white">{selectedVer.receiverName || 'Unknown'}</p>
              </div>
              <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                <span className="text-[10px] text-gray-400 uppercase font-semibold">Amount Verified</span>
                <p className="mt-1 text-gray-900 dark:text-white font-bold text-sm">{selectedVer.amount} {selectedVer.currency}</p>
              </div>
              <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                <span className="text-[10px] text-gray-400 uppercase font-semibold">Processing Flow Input</span>
                <p className="mt-1 text-gray-900 dark:text-white uppercase font-bold">{selectedVer.source || 'manual'}</p>
              </div>
              <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg md:col-span-2">
                <span className="text-[10px] text-gray-400 uppercase font-semibold">Branch</span>
                <p className="mt-1 text-gray-900 dark:text-white">
                  {selectedVer.branchId ? `${selectedVer.branchId.branchName} (${selectedVer.branchId.branchCode})` : 'Unknown'}
                </p>
              </div>
            </div>

            {selectedVer.rawOcrText && (
              <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Extracted Screenshot Raw OCR</span>
                <pre className="mt-2 text-xs font-mono text-gray-600 dark:text-[#c2c6d9] whitespace-pre-wrap select-all">{selectedVer.rawOcrText}</pre>
              </div>
            )}

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setSelectedVer(null)}
                className="bg-gray-800 hover:bg-gray-700 text-white font-semibold text-xs px-4 py-2 rounded-lg transition-colors cursor-pointer"
              >
                Close Trace
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
