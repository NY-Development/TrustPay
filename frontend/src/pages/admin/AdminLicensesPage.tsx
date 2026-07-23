import React, { useState } from 'react';
import {
  useAdminUsers,
  useApproveLicense,
  useRejectLicense,
  useSuspendOwner,
  useRestoreOwner,
} from '../../hooks/useAdmin';

const STATUS_PRIORITY: Record<string, number> = {
  PENDING_LICENSE: 0,
  ACTIVE: 1,
  SUSPENDED: 2,
  REJECTED: 3,
};

const statusColors: Record<string, string> = {
  PENDING_LICENSE: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
  ACTIVE: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
  REJECTED: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20',
  SUSPENDED: 'bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-500/20',
};

export default function AdminLicensesPage() {
  const { data: ownersRes, isLoading } = useAdminUsers({ role: 'OWNER' });
  const approveMutation = useApproveLicense();
  const rejectMutation = useRejectLicense();
  const suspendMutation = useSuspendOwner();
  const restoreMutation = useRestoreOwner();

  const [rejectTarget, setRejectTarget] = useState<{ id: string; name: string } | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const owners = [...(ownersRes?.data || [])].sort(
    (a: any, b: any) => (STATUS_PRIORITY[a.ownerStatus] ?? 9) - (STATUS_PRIORITY[b.ownerStatus] ?? 9)
  );
  const pendingCount = owners.filter((o: any) => o.ownerStatus === 'PENDING_LICENSE').length;

  const submitReject = () => {
    if (!rejectTarget) return;
    rejectMutation.mutate(
      { ownerId: rejectTarget.id, reason: rejectReason.trim() || undefined },
      { onSuccess: () => { setRejectTarget(null); setRejectReason(''); } }
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">License Approvals</h1>
          <p className="text-xs text-gray-500 mt-1">Review trading license submissions and manage owner account access.</p>
        </div>
        <span className="bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-bold px-3 py-1.5 rounded-full border border-amber-500/20">
          {pendingCount} Pending
        </span>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-3 border-red-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : owners.length === 0 ? (
        <div className="bg-white dark:bg-[#131b2e] border border-[#c2c6d9]/30 dark:border-white/10 rounded-2xl p-12 text-center">
          <span className="material-symbols-outlined text-[48px] text-[#c2c6d9] mb-4 block">verified</span>
          <p className="text-[#54647a] dark:text-[#c2c6d9] font-medium">No business owners registered yet</p>
          <p className="text-xs text-gray-400 mt-1">New owner registrations will appear here for review.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {owners.map((owner: any) => (
            <div
              key={owner._id}
              className="bg-white dark:bg-[#131b2e] border border-[#c2c6d9]/30 dark:border-white/10 rounded-2xl p-6 hover:shadow-md transition-all"
            >
              <div className="flex items-start justify-between mb-4 flex-wrap gap-3">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-[#004bca]/10 flex items-center justify-center shrink-0">
                    <span className="text-[#004bca] font-bold text-lg">{owner.name?.[0]?.toUpperCase()}</span>
                  </div>
                  <div>
                    <h3 className="font-bold text-[#131b2e] dark:text-white">{owner.name}</h3>
                    <p className="text-xs text-[#54647a] dark:text-[#c2c6d9]">{owner.email}</p>
                    {owner.companyInfo?.companyName && (
                      <p className="text-xs text-[#004bca] font-semibold mt-0.5">{owner.companyInfo.companyName}</p>
                    )}
                  </div>
                </div>
                <span className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase border shrink-0 ${statusColors[owner.ownerStatus] || statusColors.PENDING_LICENSE}`}>
                  {owner.ownerStatus?.replace(/_/g, ' ')}
                </span>
              </div>

              {/* License Info */}
              <div className="bg-[#faf8ff] dark:bg-[#0b0e14] border border-[#c2c6d9]/15 dark:border-white/5 rounded-xl p-4 mb-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                  <div>
                    <span className="text-[#54647a] dark:text-[#c2c6d9] block mb-0.5">Company Type</span>
                    <span className="text-[#131b2e] dark:text-white font-bold">{owner.companyInfo?.companyType || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-[#54647a] dark:text-[#c2c6d9] block mb-0.5">City</span>
                    <span className="text-[#131b2e] dark:text-white font-bold">{owner.companyInfo?.city || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-[#54647a] dark:text-[#c2c6d9] block mb-0.5">Address</span>
                    <span className="text-[#131b2e] dark:text-white font-bold">{owner.companyInfo?.address || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-[#54647a] dark:text-[#c2c6d9] block mb-0.5">Registered</span>
                    <span className="text-[#131b2e] dark:text-white font-bold">
                      {owner.createdAt ? new Date(owner.createdAt).toLocaleDateString() : 'N/A'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 flex-wrap">
                {owner.ownerStatus === 'PENDING_LICENSE' && (
                  <>
                    <button
                      onClick={() => approveMutation.mutate(owner._id)}
                      disabled={approveMutation.isPending}
                      className="px-4 py-2 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl text-xs font-bold hover:bg-emerald-500/20 transition-colors border border-emerald-500/20 disabled:opacity-50"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => setRejectTarget({ id: owner._id, name: owner.name })}
                      disabled={rejectMutation.isPending}
                      className="px-4 py-2 bg-red-500/10 text-red-600 dark:text-red-400 rounded-xl text-xs font-bold hover:bg-red-500/20 transition-colors border border-red-500/20 disabled:opacity-50"
                    >
                      Reject
                    </button>
                  </>
                )}
                {owner.ownerStatus === 'ACTIVE' && (
                  <button
                    onClick={() => suspendMutation.mutate(owner._id)}
                    disabled={suspendMutation.isPending}
                    className="px-4 py-2 bg-gray-500/10 text-gray-600 dark:text-gray-400 rounded-xl text-xs font-bold hover:bg-gray-500/20 transition-colors border border-gray-500/20 disabled:opacity-50"
                  >
                    Suspend
                  </button>
                )}
                {owner.ownerStatus === 'SUSPENDED' && (
                  <button
                    onClick={() => restoreMutation.mutate(owner._id)}
                    disabled={restoreMutation.isPending}
                    className="px-4 py-2 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-xl text-xs font-bold hover:bg-blue-500/20 transition-colors border border-blue-500/20 disabled:opacity-50"
                  >
                    Restore
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Reject reason modal */}
      {rejectTarget && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-[#131b2e] rounded-2xl max-w-md w-full border border-[#c2c6d9]/30 dark:border-white/10 shadow-2xl p-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">Reject License</h3>
            <p className="text-xs text-gray-500 mb-4">
              Rejecting <strong>{rejectTarget.name}</strong>'s trading license. This reason is emailed to the owner.
            </p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="e.g. Document was illegible or invalid."
              rows={4}
              className="w-full px-3 py-2 border border-[#c2c6d9]/40 dark:border-white/10 rounded-lg text-sm bg-transparent outline-none focus:border-red-500 dark:text-white resize-none"
            />
            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => { setRejectTarget(null); setRejectReason(''); }}
                className="px-4 py-2 text-xs font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={submitReject}
                disabled={rejectMutation.isPending}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg transition-colors disabled:opacity-50"
              >
                {rejectMutation.isPending ? 'Rejecting...' : 'Confirm Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
