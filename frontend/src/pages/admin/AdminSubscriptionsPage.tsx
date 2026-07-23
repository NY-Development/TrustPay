import React, { useState } from 'react';
import { useAdminSubscriptions, useUpdateAdminSubscription } from '../../hooks/useAdmin';

const STATUS_BADGE: Record<string, string> = {
  active: 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400',
  expired: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400',
  pending: 'bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400',
  partial_payment: 'bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400',
};

export default function AdminSubscriptionsPage() {
  const [status, setStatus] = useState('');
  const [plan, setPlan] = useState('');

  const { data: subscriptionsRes, isLoading, refetch } = useAdminSubscriptions({
    status: status || undefined,
    plan: plan || undefined,
  });

  const subscriptions = subscriptionsRes?.data || [];
  const updateMutation = useUpdateAdminSubscription();

  const handleUpdateStatus = (id: string, newStatus: string) => {
    if (confirm(`Change subscription status to "${newStatus}"?`)) {
      updateMutation.mutate({ id, data: { status: newStatus } });
    }
  };

  const handleToggleFullyPaid = (id: string, currentPaid: boolean) => {
    updateMutation.mutate({ id, data: { fullyPaid: !currentPaid } });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Subscriptions Catalog</h1>
          <p className="text-xs text-gray-500 mt-1">Track active billing contract records, verify manual bank deposits, and adjust payment statuses.</p>
        </div>
        <span className="bg-purple-500/10 text-purple-600 dark:text-purple-400 text-xs font-bold px-3 py-1.5 rounded-full border border-purple-500/20">
          {subscriptions.length} Contracts
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
            <option value="active" className="dark:bg-[#131b2e]">Active</option>
            <option value="expired" className="dark:bg-[#131b2e]">Expired</option>
            <option value="pending" className="dark:bg-[#131b2e]">Pending</option>
            <option value="partial_payment" className="dark:bg-[#131b2e]">Partial Payment</option>
          </select>
        </div>

        <div className="w-[180px]">
          <select
            value={plan}
            onChange={(e) => setPlan(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-white/10 rounded-lg text-sm bg-transparent outline-none focus:border-red-500 dark:text-white"
          >
            <option value="" className="dark:bg-[#131b2e]">All Plans</option>
            <option value="monthly" className="dark:bg-[#131b2e]">Monthly</option>
            <option value="yearly" className="dark:bg-[#131b2e]">Yearly</option>
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

      {/* Catalog table */}
      <div className="bg-white dark:bg-[#131b2e] border border-[#c2c6d9]/30 dark:border-white/10 rounded-xl overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="p-8 text-center text-xs text-gray-500 animate-pulse">Retrieving subscriptions catalog...</div>
        ) : subscriptions.length === 0 ? (
          <div className="p-8 text-center text-xs text-gray-400">No subscriptions found matching query filters.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-900 border-b border-[#c2c6d9]/20 dark:border-white/10 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  <th className="px-6 py-4">Owner</th>
                  <th className="px-6 py-4">Branch</th>
                  <th className="px-6 py-4">Plan / Duration</th>
                  <th className="px-6 py-4">Cost Structure</th>
                  <th className="px-6 py-4">Paid Amount</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Fully Paid</th>
                  <th className="px-6 py-4">TXN Reference</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#c2c6d9]/10 dark:divide-white/5 text-sm">
                {subscriptions.map((s: any) => (
                  <tr key={s._id} className="hover:bg-gray-50/50 dark:hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4">
                      {s.ownerId ? (
                        <>
                          <div className="font-semibold text-gray-900 dark:text-white">{s.ownerId.name}</div>
                          <span className="text-[10px] text-gray-400 font-mono">{s.ownerId.email}</span>
                        </>
                      ) : (
                        <span className="text-gray-400 font-bold italic">Owner removed</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-xs">
                      {s.branchId ? (
                        <>
                          <div className="font-semibold text-gray-800 dark:text-gray-200">{s.branchId.branchName}</div>
                          <span className="text-gray-400 font-mono text-[10px]">{s.branchId.branchCode}</span>
                        </>
                      ) : (
                        <span className="text-gray-400 italic">Unknown</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-xs uppercase font-bold text-red-600 dark:text-red-400">{s.plan}</div>
                      <span className="text-[10px] text-gray-500 dark:text-gray-400">
                        {new Date(s.startDate).toLocaleDateString()} - {new Date(s.endDate).toLocaleDateString()}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-bold text-gray-900 dark:text-white">
                      {s.amount} {s.currency || 'ETB'}
                    </td>
                    <td className="px-6 py-4 text-gray-900 dark:text-white">
                      {s.paidAmount ?? 0} {s.currency || 'ETB'}
                    </td>
                    <td className="px-6 py-4">
                      <select
                        value={s.status}
                        onChange={(e) => handleUpdateStatus(s._id, e.target.value)}
                        className={`px-2 py-1 rounded-full text-xs font-semibold border-none outline-none focus:ring-1 focus:ring-red-500 cursor-pointer ${STATUS_BADGE[s.status] || STATUS_BADGE.pending}`}
                      >
                        <option value="active">Active</option>
                        <option value="expired">Expired</option>
                        <option value="pending">Pending</option>
                        <option value="partial_payment">Partial Payment</option>
                      </select>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleToggleFullyPaid(s._id, s.fullyPaid)}
                        className={`text-xs font-bold px-2 py-1 rounded cursor-pointer transition-colors ${
                          s.fullyPaid
                            ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                            : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400'
                        }`}
                      >
                        {s.fullyPaid ? 'Fully Paid' : 'Pending Verification'}
                      </button>
                    </td>
                    <td className="px-6 py-4 font-mono text-[10px] select-all max-w-[125px] overflow-hidden truncate" title={s.transactionId}>
                      {s.transactionId}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
