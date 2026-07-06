import React, { useState } from 'react';
import { useAdminUsers, useUpdateAdminUser, useDeleteAdminUser } from '../../hooks/useAdmin';
import { ALL_ROLES } from '../../../../backend/src/constants';

export default function AdminUsersPage() {
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const { data: usersRes, isLoading, refetch } = useAdminUsers({
    search: search || undefined,
    role: roleFilter || undefined,
    isActive: statusFilter === 'active' ? true : statusFilter === 'inactive' ? false : undefined,
  });

  const users = usersRes?.data || [];

  const updateMutation = useUpdateAdminUser();
  const deleteMutation = useDeleteAdminUser();

  const handleToggleStatus = (id: string, currentStatus: boolean) => {
    if (confirm(`Are you sure you want to ${currentStatus ? 'deactivate' : 'activate'} this user?`)) {
      updateMutation.mutate({ id, data: { isActive: !currentStatus } });
    }
  };

  const handleChangeRole = (id: string, newRole: string) => {
    updateMutation.mutate({ id, data: { role: newRole } });
  };

  const handleDeleteUser = (id: string, name: string) => {
    if (confirm(`⚠️ WARNING: Permanently delete user "${name}"? This operation cannot be undone.`)) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold font-headline-md text-gray-900 dark:text-white">User Registry</h1>
          <p className="text-xs text-gray-500">Enable/disable user accounts, change server roles, and clean up registry profiles.</p>
        </div>
      </div>

      {/* Filters bar */}
      <div className="bg-white dark:bg-[#131b2e] p-4 rounded-xl border border-[#c2c6d9]/30 flex flex-wrap gap-4 items-center">
        <div className="flex-1 min-w-[200px] relative">
          <span className="material-symbols-outlined text-gray-400 absolute left-3 top-2.5 text-[20px]">search</span>
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-250 dark:border-white/10 rounded-lg text-sm bg-transparent outline-none focus:border-red-500 dark:text-white"
          />
        </div>

        <div className="w-[180px]">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="w-full px-3 py-2 border border-gray-250 dark:border-white/10 rounded-lg text-sm bg-transparent outline-none focus:border-red-500 dark:text-white"
          >
            <option value="" className="dark:bg-[#131b2e]">All Roles</option>
            {Object.values(ALL_ROLES).map((role) => (
              <option key={role} value={role} className="dark:bg-[#131b2e]">{role}</option>
            ))}
          </select>
        </div>

        <div className="w-[180px]">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-3 py-2 border border-gray-250 dark:border-white/10 rounded-lg text-sm bg-transparent outline-none focus:border-red-500 dark:text-white"
          >
            <option value="" className="dark:bg-[#131b2e]">All Statuses</option>
            <option value="active" className="dark:bg-[#131b2e]">Active</option>
            <option value="inactive" className="dark:bg-[#131b2e]">Deactivated</option>
          </select>
        </div>

        <button
          onClick={() => refetch()}
          className="bg-red-700 hover:bg-red-800 text-white font-semibold text-sm px-4 py-2 rounded-lg transition-colors cursor-pointer flex items-center gap-2"
        >
          <span className="material-symbols-outlined text-[18px]">refresh</span>
          Refresh
        </button>
      </div>

      {/* Users table */}
      <div className="bg-white dark:bg-[#131b2e] border border-[#c2c6d9]/30 rounded-xl overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="p-8 text-center text-xs text-gray-500 animate-pulse">Loading user profiles...</div>
        ) : users.length === 0 ? (
          <div className="p-8 text-center text-xs text-gray-400">No users found matching query filters.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-900 border-b border-[#c2c6d9]/20 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  <th className="px-6 py-4">Name / ID</th>
                  <th className="px-6 py-4">Email</th>
                  <th className="px-6 py-4">Role</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Linked Accounts</th>
                  <th className="px-6 py-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#c2c6d9]/10 text-sm">
                {users.map((u: any) => (
                  <tr key={u._id} className="hover:bg-gray-50/50 dark:hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-gray-900 dark:text-white">{u.name}</div>
                      <span className="text-[10px] text-gray-400 font-mono select-all">{u._id}</span>
                    </td>
                    <td className="px-6 py-4 text-gray-650 dark:text-[#c2c6d9]">{u.email}</td>
                    <td className="px-6 py-4">
                      <select
                        value={u.role}
                        onChange={(e) => handleChangeRole(u._id, e.target.value)}
                        className="px-2 py-1 rounded bg-gray-100 dark:bg-gray-800 text-xs font-semibold border-none outline-none focus:ring-1 focus:ring-red-500 dark:text-white cursor-pointer"
                      >
                        {Object.values(ALL_ROLES).map((role) => (
                          <option key={role} value={role}>{role}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleToggleStatus(u._id, u.isActive)}
                        className={`text-xs font-bold px-2.5 py-1 rounded-full cursor-pointer transition-colors ${
                          u.isActive
                            ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400 hover:bg-green-200'
                            : 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400 hover:bg-red-200'
                        }`}
                      >
                        {u.isActive ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td className="px-6 py-4 font-mono text-xs max-w-[200px] truncate">
                      {u.accounts && u.accounts.length > 0 ? (
                        <div className="flex flex-col gap-1">
                          {u.accounts.map((acc: any, i: number) => (
                            <span key={i} className="bg-red-50 dark:bg-red-950/20 text-red-650 dark:text-red-400 px-2 py-0.5 rounded text-[10px] inline-block font-semibold">
                              {acc.accountProvider.toUpperCase()}: {acc.accountNumber}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-gray-400 text-[10px]">No linked accounts</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => handleDeleteUser(u._id, u.name)}
                        className="text-red-500 hover:text-red-750 dark:hover:text-red-400 font-semibold p-1 hover:bg-red-50 dark:hover:bg-red-950/20 rounded cursor-pointer transition-colors"
                        title="Delete User"
                      >
                        <span className="material-symbols-outlined text-[18px]">delete</span>
                      </button>
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
