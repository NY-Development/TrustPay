import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { listEmployeesApi, inviteEmployeeApi, deactivateEmployeeApi, activateEmployeeApi, deleteEmployeeApi } from '@/src/api/employee.api';
import { listBranchesApi } from '@/src/api/branch.api';
import { useAuthStore } from '@/src/store/authStore';

export default function EmployeesPage() {
  const { actorType, selectedBranch } = useAuthStore();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [filterBranch, setFilterBranch] = useState('');
  const [showInvite, setShowInvite] = useState(false);
  const [inviteData, setInviteData] = useState({ name: '', email: '', password: '', role: 'CASHIER', branchId: '' });

  const { data: employeesRes, isLoading } = useQuery({
    queryKey: ['employees', filterBranch],
    queryFn: () => listEmployeesApi(filterBranch ? { branchId: filterBranch } : undefined),
  });

  const { data: branchesRes } = useQuery({
    queryKey: ['branches'],
    queryFn: listBranchesApi,
    enabled: actorType === 'owner',
  });

  const inviteMutation = useMutation({
    mutationFn: inviteEmployeeApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      setShowInvite(false);
      setInviteData({ name: '', email: '', password: '', role: 'CASHIER', branchId: '' });
    },
  });

  const deactivateMutation = useMutation({
    mutationFn: deactivateEmployeeApi,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['employees'] }),
  });

  const activateMutation = useMutation({
    mutationFn: activateEmployeeApi,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['employees'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteEmployeeApi,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['employees'] }),
  });

  const employees = employeesRes?.data || [];
  const branches = branchesRes?.data || [];
  const roles = ['MANAGER', 'CASHIER', 'VERIFIER', 'RECEPTIONIST', 'OTHER'];

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-[#131b2e] dark:text-white font-['Geist']">Employee Directory</h1>
          <p className="text-sm text-[#54647a] dark:text-[#c2c6d9] mt-1">Manage staff access across your branches</p>
        </div>
        {actorType === 'owner' && (
          <button
            onClick={() => setShowInvite(true)}
            className="bg-[#004bca] hover:bg-[#0061ff] text-white px-5 py-3 rounded-xl text-sm font-bold flex items-center gap-2 transition-all active:scale-[0.97]"
          >
            <span className="material-symbols-outlined text-[18px]">person_add</span>
            Invite Employee
          </button>
        )}
      </div>

      {/* Filter Bar */}
      {actorType === 'owner' && branches.length > 1 && (
        <div className="flex gap-3 mb-6">
          <select
            value={filterBranch}
            onChange={(e) => setFilterBranch(e.target.value)}
            className="bg-white dark:bg-[#131b2e] border border-[#c2c6d9]/30 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm text-[#131b2e] dark:text-white outline-none"
          >
            <option value="">All Branches</option>
            {branches.map((b: any) => (
              <option key={b._id} value={b._id}>{b.branchName} ({b.branchCode})</option>
            ))}
          </select>
        </div>
      )}

      {/* Employee Grid */}
      {isLoading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-3 border-[#004bca] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : employees.length === 0 ? (
        <div className="bg-white dark:bg-[#131b2e] border border-[#c2c6d9]/30 dark:border-white/10 rounded-2xl p-12 text-center">
          <span className="material-symbols-outlined text-[48px] text-[#c2c6d9] dark:text-[#54647a] mb-4 block">group</span>
          <p className="text-[#54647a] dark:text-[#c2c6d9] font-medium">No employees found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {employees.map((emp: any) => (
            <div
              key={emp._id}
              className="bg-white dark:bg-[#131b2e] border border-[#c2c6d9]/30 dark:border-white/10 rounded-2xl p-5 hover:shadow-lg transition-all group"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#004bca]/10 flex items-center justify-center">
                    <span className="text-[#004bca] font-bold text-sm">{emp.name?.[0]?.toUpperCase()}</span>
                  </div>
                  <div>
                    <h3 className="font-bold text-[#131b2e] dark:text-white text-sm">{emp.name}</h3>
                    <p className="text-xs text-[#54647a] dark:text-[#c2c6d9]">{emp.email}</p>
                  </div>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                  emp.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' :
                  emp.status === 'INACTIVE' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' :
                  'bg-red-500/10 text-red-500 border border-red-500/20'
                }`}>
                  {emp.status}
                </span>
              </div>

              <div className="flex items-center gap-2 mb-4">
                <span className="bg-[#faf8ff] dark:bg-[#0b0e14] border border-[#c2c6d9]/20 dark:border-white/5 px-2.5 py-1 rounded-lg text-[11px] font-semibold text-[#004bca]">
                  {emp.role}
                </span>
                {typeof emp.branchId === 'object' && emp.branchId?.branchCode && (
                  <span className="bg-[#faf8ff] dark:bg-[#0b0e14] border border-[#c2c6d9]/20 dark:border-white/5 px-2.5 py-1 rounded-lg text-[11px] font-semibold text-[#54647a] dark:text-[#c2c6d9]">
                    {emp.branchId.branchCode}
                  </span>
                )}
              </div>

              {actorType === 'owner' && (
                <div className="flex gap-2 pt-3 border-t border-[#c2c6d9]/15 dark:border-white/5">
                  {emp.status === 'ACTIVE' ? (
                    <button onClick={() => deactivateMutation.mutate(emp._id)} className="flex-1 text-xs font-semibold py-2 rounded-lg bg-amber-500/10 text-amber-600 hover:bg-amber-500/20 transition-colors">
                      Deactivate
                    </button>
                  ) : (
                    <button onClick={() => activateMutation.mutate(emp._id)} className="flex-1 text-xs font-semibold py-2 rounded-lg bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 transition-colors">
                      Activate
                    </button>
                  )}
                  <button onClick={() => deleteMutation.mutate(emp._id)} className="text-xs font-semibold py-2 px-3 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors">
                    <span className="material-symbols-outlined text-[16px]">delete</span>
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Invite Modal */}
      {showInvite && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-6">
          <div className="bg-white dark:bg-[#131b2e] border border-[#c2c6d9]/30 dark:border-white/10 rounded-3xl p-8 max-w-md w-full shadow-2xl">
            <h3 className="text-xl font-bold text-[#131b2e] dark:text-white mb-6 font-['Geist']">Invite Employee</h3>
            
            <div className="space-y-4">
              <input
                placeholder="Full Name"
                value={inviteData.name}
                onChange={(e) => setInviteData({ ...inviteData, name: e.target.value })}
                className="w-full bg-[#faf8ff] dark:bg-[#0b0e14] border border-[#c2c6d9]/30 dark:border-white/10 rounded-xl px-4 py-3 text-sm outline-none text-[#131b2e] dark:text-white"
              />
              <input
                placeholder="Email"
                type="email"
                value={inviteData.email}
                onChange={(e) => setInviteData({ ...inviteData, email: e.target.value })}
                className="w-full bg-[#faf8ff] dark:bg-[#0b0e14] border border-[#c2c6d9]/30 dark:border-white/10 rounded-xl px-4 py-3 text-sm outline-none text-[#131b2e] dark:text-white"
              />
              <input
                placeholder="Password"
                type="password"
                value={inviteData.password}
                onChange={(e) => setInviteData({ ...inviteData, password: e.target.value })}
                className="w-full bg-[#faf8ff] dark:bg-[#0b0e14] border border-[#c2c6d9]/30 dark:border-white/10 rounded-xl px-4 py-3 text-sm outline-none text-[#131b2e] dark:text-white"
              />
              <select
                value={inviteData.role}
                onChange={(e) => setInviteData({ ...inviteData, role: e.target.value })}
                className="w-full bg-[#faf8ff] dark:bg-[#0b0e14] border border-[#c2c6d9]/30 dark:border-white/10 rounded-xl px-4 py-3 text-sm outline-none text-[#131b2e] dark:text-white"
              >
                {roles.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
              <select
                value={inviteData.branchId}
                onChange={(e) => setInviteData({ ...inviteData, branchId: e.target.value })}
                className="w-full bg-[#faf8ff] dark:bg-[#0b0e14] border border-[#c2c6d9]/30 dark:border-white/10 rounded-xl px-4 py-3 text-sm outline-none text-[#131b2e] dark:text-white"
              >
                <option value="">Select Branch</option>
                {branches.map((b: any) => (
                  <option key={b._id} value={b._id}>{b.branchName} ({b.branchCode})</option>
                ))}
              </select>
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowInvite(false)} className="flex-1 bg-[#faf8ff] dark:bg-[#0b0e14] border border-[#c2c6d9]/30 dark:border-white/10 py-3 rounded-xl text-sm font-bold text-[#131b2e] dark:text-white">
                Cancel
              </button>
              <button
                onClick={() => inviteMutation.mutate(inviteData)}
                disabled={inviteMutation.isPending}
                className="flex-1 bg-[#004bca] hover:bg-[#0061ff] text-white py-3 rounded-xl text-sm font-bold disabled:opacity-50"
              >
                {inviteMutation.isPending ? 'Sending...' : 'Send Invite'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
