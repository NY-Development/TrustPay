import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/src/api/client';

const fetchPendingLicenses = async () => {
  const response = await apiClient.get('/api/v1/admin/licenses/pending');
  return response.data;
};

const approveLicense = async (ownerId: string) => {
  const response = await apiClient.put(`/api/v1/admin/licenses/${ownerId}/approve`);
  return response.data;
};

const rejectLicense = async (ownerId: string) => {
  const response = await apiClient.put(`/api/v1/admin/licenses/${ownerId}/reject`);
  return response.data;
};

const suspendOwner = async (ownerId: string) => {
  const response = await apiClient.put(`/api/v1/admin/licenses/${ownerId}/suspend`);
  return response.data;
};

const restoreOwner = async (ownerId: string) => {
  const response = await apiClient.put(`/api/v1/admin/licenses/${ownerId}/restore`);
  return response.data;
};

export default function AdminLicensesPage() {
  const queryClient = useQueryClient();

  const { data: licensesRes, isLoading } = useQuery({
    queryKey: ['admin-licenses'],
    queryFn: fetchPendingLicenses,
  });

  const approveMutation = useMutation({
    mutationFn: approveLicense,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-licenses'] }),
  });

  const rejectMutation = useMutation({
    mutationFn: rejectLicense,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-licenses'] }),
  });

  const suspendMutation = useMutation({
    mutationFn: suspendOwner,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-licenses'] }),
  });

  const restoreMutation = useMutation({
    mutationFn: restoreOwner,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-licenses'] }),
  });

  const owners = licensesRes?.data || [];

  const statusColors: Record<string, string> = {
    PENDING_LICENSE: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
    ACTIVE: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
    REJECTED: 'bg-red-500/10 text-red-500 border-red-500/20',
    SUSPENDED: 'bg-gray-500/10 text-gray-500 border-gray-500/20',
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[#131b2e] dark:text-white font-['Geist']">License Management</h1>
        <p className="text-sm text-[#54647a] dark:text-[#c2c6d9] mt-1">Review and manage owner trading license submissions</p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-3 border-[#004bca] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : owners.length === 0 ? (
        <div className="bg-white dark:bg-[#131b2e] border border-[#c2c6d9]/30 dark:border-white/10 rounded-2xl p-12 text-center">
          <span className="material-symbols-outlined text-[48px] text-[#c2c6d9] mb-4 block">verified</span>
          <p className="text-[#54647a] dark:text-[#c2c6d9] font-medium">No pending license requests</p>
        </div>
      ) : (
        <div className="space-y-4">
          {owners.map((owner: any) => (
            <div
              key={owner._id}
              className="bg-white dark:bg-[#131b2e] border border-[#c2c6d9]/30 dark:border-white/10 rounded-2xl p-6 hover:shadow-md transition-all"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-[#004bca]/10 flex items-center justify-center">
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
                <span className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase border ${statusColors[owner.ownerStatus] || statusColors.PENDING_LICENSE}`}>
                  {owner.ownerStatus?.replace(/_/g, ' ')}
                </span>
              </div>

              {/* License Info */}
              <div className="bg-[#faf8ff] dark:bg-[#0b0e14] border border-[#c2c6d9]/15 dark:border-white/5 rounded-xl p-4 mb-4">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-xs">
                  <div>
                    <span className="text-[#54647a] dark:text-[#c2c6d9] block mb-0.5">Company Type</span>
                    <span className="text-[#131b2e] dark:text-white font-bold">{owner.companyInfo?.companyType || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-[#54647a] dark:text-[#c2c6d9] block mb-0.5">City</span>
                    <span className="text-[#131b2e] dark:text-white font-bold">{owner.companyInfo?.city || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-[#54647a] dark:text-[#c2c6d9] block mb-0.5">Branches</span>
                    <span className="text-[#131b2e] dark:text-white font-bold">{owner.branches?.length || 0}</span>
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
                      className="px-4 py-2 bg-emerald-500/10 text-emerald-600 rounded-xl text-xs font-bold hover:bg-emerald-500/20 transition-colors border border-emerald-500/20"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => rejectMutation.mutate(owner._id)}
                      disabled={rejectMutation.isPending}
                      className="px-4 py-2 bg-red-500/10 text-red-500 rounded-xl text-xs font-bold hover:bg-red-500/20 transition-colors border border-red-500/20"
                    >
                      Reject
                    </button>
                  </>
                )}
                {owner.ownerStatus === 'ACTIVE' && (
                  <button
                    onClick={() => suspendMutation.mutate(owner._id)}
                    disabled={suspendMutation.isPending}
                    className="px-4 py-2 bg-gray-500/10 text-gray-600 dark:text-gray-400 rounded-xl text-xs font-bold hover:bg-gray-500/20 transition-colors border border-gray-500/20"
                  >
                    Suspend
                  </button>
                )}
                {owner.ownerStatus === 'SUSPENDED' && (
                  <button
                    onClick={() => restoreMutation.mutate(owner._id)}
                    disabled={restoreMutation.isPending}
                    className="px-4 py-2 bg-blue-500/10 text-blue-500 rounded-xl text-xs font-bold hover:bg-blue-500/20 transition-colors border border-blue-500/20"
                  >
                    Restore
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
