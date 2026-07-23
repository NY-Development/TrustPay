import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { listBranchesApi, createBranchApi, deactivateBranchApi } from '@/src/api/branch.api';
import { useAuthStore } from '@/src/store/authStore';

export default function BranchesPage() {
  const { actorType } = useAuthStore();
  const queryClient = useQueryClient();

  const [showCreate, setShowCreate] = useState(false);
  const emptyBranch = {
    branchName: '', phone: '', email: '', region: '', city: '', subCity: '', wereda: '', kebele: '', address: '',
  };
  const [newBranch, setNewBranch] = useState(emptyBranch);
  const [createError, setCreateError] = useState('');

  const REQUIRED_FIELDS: Array<keyof typeof emptyBranch> = ['branchName', 'region', 'city', 'address', 'phone', 'email'];
  const FIELD_LABELS: Record<keyof typeof emptyBranch, string> = {
    branchName: 'Branch Name', phone: 'Phone', email: 'Email', region: 'Region', city: 'City',
    subCity: 'Sub-City', wereda: 'Wereda', kebele: 'Kebele', address: 'Address',
  };

  const { data: branchesRes, isLoading } = useQuery({
    queryKey: ['branches'],
    queryFn: listBranchesApi,
  });

  const createMutation = useMutation({
    mutationFn: createBranchApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['branches'] });
      setShowCreate(false);
      setNewBranch(emptyBranch);
      setCreateError('');
    },
    onError: (err: any) => {
      setCreateError(err?.response?.data?.message || 'Failed to create branch. Please check the fields and try again.');
    },
  });

  const handleCreateSubmit = () => {
    const missing = REQUIRED_FIELDS.filter((key) => !newBranch[key].trim());
    if (missing.length > 0) {
      setCreateError(`Please fill in: ${missing.map((k) => FIELD_LABELS[k]).join(', ')}.`);
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(newBranch.email.trim())) {
      setCreateError('Please enter a valid email address.');
      return;
    }
    setCreateError('');
    createMutation.mutate(newBranch);
  };

  const deactivateMutation = useMutation({
    mutationFn: deactivateBranchApi,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['branches'] }),
  });

  const branches = branchesRes?.data || [];

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-[#131b2e] dark:text-white font-['Geist']">Branch Network</h1>
          <p className="text-sm text-[#54647a] dark:text-[#c2c6d9] mt-1">Manage your business locations</p>
        </div>
        {actorType === 'owner' && (
          <button
            onClick={() => setShowCreate(true)}
            className="bg-[#004bca] hover:bg-[#0061ff] text-white px-5 py-3 rounded-xl text-sm font-bold flex items-center gap-2 transition-all"
          >
            <span className="material-symbols-outlined text-[18px]">add_business</span>
            New Branch
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-3 border-[#004bca] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : branches.length === 0 ? (
        <div className="bg-white dark:bg-[#131b2e] border border-[#c2c6d9]/30 dark:border-white/10 rounded-2xl p-12 text-center">
          <span className="material-symbols-outlined text-[48px] text-[#c2c6d9] mb-4 block">store</span>
          <p className="text-[#54647a] dark:text-[#c2c6d9]">No branches configured yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {branches.map((branch: any) => (
            <div
              key={branch._id}
              className="bg-white dark:bg-[#131b2e] border border-[#c2c6d9]/30 dark:border-white/10 rounded-2xl p-6 hover:shadow-lg transition-all"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-bold text-[#131b2e] dark:text-white text-base">{branch.branchName}</h3>
                  <p className="text-xs text-[#004bca] font-mono font-bold mt-0.5">{branch.branchCode}</p>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                  branch.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' :
                  branch.status === 'INACTIVE' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' :
                  'bg-red-500/10 text-red-500 border border-red-500/20'
                }`}>
                  {branch.status}
                </span>
              </div>

              <div className="space-y-2 text-xs text-[#54647a] dark:text-[#c2c6d9]">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[14px]">location_on</span>
                  {branch.city}{branch.subCity ? `, ${branch.subCity}` : ''}
                </div>
                {branch.phone && (
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[14px]">phone</span>
                    {branch.phone}
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[14px]">account_balance</span>
                  {branch.accounts?.length || 0} settlement account(s)
                </div>
              </div>

              <Link
                to={`/dashboard/branches/${branch._id}`}
                className="mt-4 w-full block text-center text-xs font-semibold py-2.5 rounded-xl bg-[#004bca]/10 text-[#004bca] hover:bg-[#004bca]/20 transition-colors"
              >
                View Details
              </Link>

              {actorType === 'owner' && branch.status === 'ACTIVE' && (
                <button
                  onClick={() => deactivateMutation.mutate(branch._id)}
                  className="mt-2 w-full text-xs font-semibold py-2.5 rounded-xl bg-amber-500/10 text-amber-600 hover:bg-amber-500/20 transition-colors"
                >
                  Deactivate
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-6">
          <div className="bg-white dark:bg-[#131b2e] border border-[#c2c6d9]/30 dark:border-white/10 rounded-3xl p-8 max-w-md w-full shadow-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-[#131b2e] dark:text-white mb-6 font-['Geist']">Create New Branch</h3>

            {createError && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 rounded-xl text-xs font-semibold">
                {createError}
              </div>
            )}

            <div className="space-y-4">
              {(Object.keys(newBranch) as Array<keyof typeof newBranch>).map((key) => (
                <div key={key}>
                  <label className="block text-[11px] font-semibold text-[#54647a] dark:text-[#c2c6d9] uppercase tracking-wider mb-1.5">
                    {FIELD_LABELS[key]}{REQUIRED_FIELDS.includes(key) && <span className="text-red-500 ml-0.5">*</span>}
                  </label>
                  <input
                    type={key === 'email' ? 'email' : 'text'}
                    placeholder={FIELD_LABELS[key]}
                    value={newBranch[key]}
                    onChange={(e) => setNewBranch({ ...newBranch, [key]: e.target.value })}
                    className="w-full bg-[#faf8ff] dark:bg-[#0b0e14] border border-[#c2c6d9]/30 dark:border-white/10 rounded-xl px-4 py-3 text-sm outline-none text-[#131b2e] dark:text-white"
                  />
                </div>
              ))}
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => { setShowCreate(false); setCreateError(''); }} className="flex-1 bg-[#faf8ff] dark:bg-[#0b0e14] border border-[#c2c6d9]/30 dark:border-white/10 py-3 rounded-xl text-sm font-bold text-[#131b2e] dark:text-white">
                Cancel
              </button>
              <button
                onClick={handleCreateSubmit}
                disabled={createMutation.isPending}
                className="flex-1 bg-[#004bca] hover:bg-[#0061ff] text-white py-3 rounded-xl text-sm font-bold disabled:opacity-50"
              >
                {createMutation.isPending ? 'Creating...' : 'Create Branch'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
