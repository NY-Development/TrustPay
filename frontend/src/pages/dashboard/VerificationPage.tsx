import React, { useState } from 'react';
import { useVerificationHistory } from '@/src/hooks/useVerification';
import { Link } from 'react-router-dom';

export default function VerificationPage() {
  const [provider, setProvider] = useState<string>('');
  const { data, isLoading, hasNextPage, fetchNextPage, isFetchingNextPage } = useVerificationHistory({ provider, limit: 15 });

  const verifications = data?.pages?.flatMap(page => page.data) || [];

  return (
    <div className="space-y-6">
      {/* Header action buttons */}
      <div className="flex flex-wrap justify-between items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#131b2e] dark:text-white">Verification History</h1>
          <p className="text-xs text-[#54647a]">All payment reference query records</p>
        </div>
        <div className="flex gap-3">
          <Link
            to="/dashboard/verify/manual"
            className="bg-[#004bca] hover:bg-[#0061ff] text-white px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-xs"
          >
            <span className="material-symbols-outlined text-[16px]">verified_user</span>
            Verify Manually
          </Link>
          <Link
            to="/dashboard/export"
            className="bg-[#505f76]/10 hover:bg-[#505f76]/20 text-[#54647a] dark:text-[#c2c6d9] px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all"
          >
            <span className="material-symbols-outlined text-[16px]">download</span>
            Export
          </Link>
        </div>
      </div>

      {/* Filters bar */}
      <div className="bg-white dark:bg-[#131b2e] border border-[#c2c6d9]/35 rounded-2xl p-4 flex flex-wrap gap-4 items-center justify-between shadow-xs">
        <div className="flex items-center gap-2 bg-[#faf8ff] dark:bg-[#0b0e14] border border-[#c2c6d9] dark:border-white/10 rounded-xl px-4 py-2 text-xs">
          <span className="material-symbols-outlined text-[16px] text-gray-500">search</span>
          <input
            type="text"
            placeholder="Search by reference ID..."
            className="bg-transparent outline-none text-[#131b2e] dark:text-white"
          />
        </div>

        <div className="flex gap-2">
          {[
            { id: '', name: 'All Providers' },
            { id: 'cbe', name: 'CBE' },
            { id: 'telebirr', name: 'Telebirr' },
            { id: 'mpesa', name: 'M-Pesa' },
          ].map((p) => (
            <button
              key={p.id}
              onClick={() => setProvider(p.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                provider === p.id 
                  ? 'bg-[#004bca] text-white' 
                  : 'bg-[#505f76]/10 hover:bg-[#505f76]/20 text-[#54647a]'
              }`}
            >
              {p.name}
            </button>
          ))}
        </div>
      </div>

      {/* Main List Table */}
      <div className="bg-white dark:bg-[#131b2e] border border-[#c2c6d9]/30 rounded-2xl p-6 shadow-xs">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#004bca]" />
          </div>
        ) : verifications.length === 0 ? (
          <div className="text-center py-12 text-xs text-[#54647a]">
            No verification transactions found. Click New Verification to submit.
          </div>
        ) : (
          <div className="space-y-6">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[#c2c6d9]/35 text-[#54647a] uppercase font-bold tracking-wider">
                    <th className="pb-3">Reference</th>
                    <th className="pb-3">Payer Name</th>
                    <th className="pb-3">Amount</th>
                    <th className="pb-3">Provider</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3">Date Checked</th>
                    <th className="pb-3 text-right">Inspect</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#c2c6d9]/25">
                  {verifications.map((item: any) => (
                    <tr key={item._id || item.id} className="hover:bg-[#faf8ff] dark:hover:bg-white/5">
                      <td className="py-4 font-mono font-bold text-[#1F2937] dark:text-white uppercase">{item.referenceNumber}</td>
                      <td className="py-4 text-gray-700 dark:text-gray-300">{item.payerName || 'Unknown'}</td>
                      <td className="py-4 font-bold text-[#1F2937] dark:text-white">{item.amount} {item.currency}</td>
                      <td className="py-4 text-xs uppercase text-[#54647a]">{item.provider}</td>
                      <td className="py-4">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                          item.processingStatus === 'completed'
                            ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400'
                            : item.processingStatus === 'failed'
                              ? 'bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400'
                              : 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400'
                        }`}>
                          {item.processingStatus}
                        </span>
                      </td>
                      <td className="py-4 text-[#54647a]">{new Date(item.createdAt).toLocaleDateString()}</td>
                      <td className="py-4 text-right">
                        <Link 
                          to={`/dashboard/verify/${item._id || item.id}`}
                          className="bg-[#505f76]/10 hover:bg-[#505f76]/15 hover:text-[#004bca] dark:text-[#c2c6d9] px-3 py-1.5 rounded-lg text-xs font-semibold"
                        >
                          Details
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Load More Button */}
            {hasNextPage && (
              <div className="flex justify-center pt-4">
                <button
                  onClick={() => fetchNextPage()}
                  disabled={isFetchingNextPage}
                  className="bg-[#004bca]/10 border border-[#004bca]/20 text-[#004bca] px-6 py-2.5 rounded-xl text-xs font-bold cursor-pointer hover:bg-[#004bca]/15 transition-all text-center select-none"
                >
                  {isFetchingNextPage ? 'Loading...' : 'Load More Results'}
                </button>
              </div>
            )}

            {/* Export Center Note */}
            <div className="text-center pt-2 text-[10px] text-[#54647a]">
              For full exports with date range filters, visit the{' '}
              <Link to="/dashboard/export" className="text-[#004bca] dark:text-[#549aff] font-bold hover:underline">Export Center</Link>.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
