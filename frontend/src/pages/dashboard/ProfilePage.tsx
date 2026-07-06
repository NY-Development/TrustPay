import React, { useState } from 'react';
import { useAuthStore } from '@/src/store/authStore';
import { 
  useAccounts, 
  useAddAccount, 
  useUpdateAccount,
  useRemoveAccount, 
  useChangePassword, 
  useUpdateProfile 
} from '@/src/hooks/useAuth';
import { StatusModal } from '@/src/components/StatusModal';

export default function ProfilePage() {
  const { user } = useAuthStore();
  const { data: accountsData, isLoading: loadingAccounts } = useAccounts();

  const addAccountMutation = useAddAccount();
  const updateAccountMutation = useUpdateAccount();
  const removeAccountMutation = useRemoveAccount();
  const updateProfileMutation = useUpdateProfile();
  const changePasswordMutation = useChangePassword();

  const [accNumber, setAccNumber] = useState('');
  const [provider, setProvider] = useState('cbe');

  // Edit states for existing accounts
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editNumber, setEditNumber] = useState('');
  const [editProvider, setEditProvider] = useState('cbe');

  // Profile details form
  const [profileName, setProfileName] = useState(user?.name || '');
  const [profileEmail, setProfileEmail] = useState(user?.email || '');

  // Password fields
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const [modal, setModal] = useState<{
    visible: boolean;
    type: 'success' | 'error' | 'info';
    title: string;
    message: string;
  }>({ visible: false, type: 'info', title: '', message: '' });

  const handleAddAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!accNumber.trim()) return;

    addAccountMutation.mutate(
      { accountNumber: accNumber.trim(), accountProvider: provider },
      {
        onSuccess: () => {
          setAccNumber('');
          setModal({
            visible: true,
            type: 'success',
            title: 'Account Registered',
            message: 'Settlement details have been updated successfully.',
          });
        },
        onError: (err: any) => {
          setModal({
            visible: true,
            type: 'error',
            title: 'Add Account Failed',
            message: err.response?.data?.message || err.message || 'Could not verify account creation.',
          });
        },
      }
    );
  };

  const handleUpdateAccount = (originalNumber: string, originalProvider: string) => {
    if (!editNumber.trim()) return;

    updateAccountMutation.mutate(
      {
        accountNumber: originalNumber,
        accountProvider: originalProvider,
        newAccountNumber: editNumber.trim(),
        newAccountProvider: editProvider,
      },
      {
        onSuccess: () => {
          setEditingIndex(null);
          setModal({
            visible: true,
            type: 'success',
            title: 'Account Updated',
            message: 'Reconciliation settlement details updated successfully.',
          });
        },
        onError: (err: any) => {
          setModal({
            visible: true,
            type: 'error',
            title: 'Update Failed',
            message: err.response?.data?.message || err.message || 'Could not modify account records.',
          });
        },
      }
    );
  };

  const handleStartEdit = (idx: number, num: string, prov: string) => {
    setEditingIndex(idx);
    setEditNumber(num);
    setEditProvider(prov);
  };

  const handleRemoveAccount = (number: string, prov: string) => {
    removeAccountMutation.mutate(
      { accountNumber: number, accountProvider: prov },
      {
        onSuccess: () => {
          setModal({
            visible: true,
            type: 'success',
            title: 'Account Deleted',
            message: 'Selected settlement account has been removed.',
          });
        },
        onError: (err: any) => {
          setModal({
            visible: true,
            type: 'error',
            title: 'Update Action Failed',
            message: err.response?.data?.message || err.message || 'Could not remove account details.',
          });
        },
      }
    );
  };

  const handleUpdateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfileMutation.mutate(
      { name: profileName, email: profileEmail },
      {
        onSuccess: () => {
          setModal({
            visible: true,
            type: 'success',
            title: 'Profile Updated',
            message: 'Workspace credentials updated successfully.',
          });
        },
        onError: (err: any) => {
          setModal({
            visible: true,
            type: 'error',
            title: 'Profile Update Failed',
            message: err.response?.data?.message || err.message || 'Could not updates database records.',
          });
        },
      }
    );
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword) return;

    changePasswordMutation.mutate(
      { currentPassword, newPassword },
      {
        onSuccess: () => {
          setCurrentPassword('');
          setNewPassword('');
          setModal({
            visible: true,
            type: 'success',
            title: 'Password Updated',
            message: 'Your desk console login password was changed.',
          });
        },
        onError: (err: any) => {
          setModal({
            visible: true,
            type: 'error',
            title: 'Change Password Failed',
            message: err.response?.data?.message || err.message || 'Verification of current password failed.',
          });
        },
      }
    );
  };

  const accountsList = accountsData?.data || user?.accounts || [];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Profile Details Adjustments */}
      <div className="lg:col-span-2 space-y-8">
        <div className="bg-white dark:bg-[#131b2e] border border-[#c2c6d9]/35 rounded-[32px] p-8 shadow-xs">
          <h2 className="text-lg font-bold text-[#131b2e] dark:text-white mb-6">Profile Settings</h2>
          
          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#131b2e] dark:text-[#eef0ff] uppercase tracking-wider mb-2">Display Name</label>
              <input
                type="text"
                required
                value={profileName}
                onChange={(e) => setProfileName(e.target.value)}
                className="w-full bg-[#faf8ff] dark:bg-[#0b0e14] border border-[#c2c6d9] dark:border-white/10 rounded-xl p-3 text-xs outline-none text-[#131b2e] dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#131b2e] dark:text-[#eef0ff] uppercase tracking-wider mb-2">Workspace Email Address</label>
              <input
                type="email"
                required
                value={profileEmail}
                onChange={(e) => setProfileEmail(e.target.value)}
                className="w-full bg-[#faf8ff] dark:bg-[#0b0e14] border border-[#c2c6d9] dark:border-white/10 rounded-xl p-3 text-xs outline-none text-[#131b2e] dark:text-white"
              />
            </div>
            
            <button
              type="submit"
              disabled={updateProfileMutation.isPending}
              className="bg-[#004bca] hover:bg-[#0061ff] text-white py-2.5 px-6 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
            >
              {updateProfileMutation.isPending ? 'Saving...' : 'Update Profile'}
            </button>
          </form>
        </div>

        {/* Change Password settings */}
        <div className="bg-white dark:bg-[#131b2e] border border-[#c2c6d9]/35 rounded-[32px] p-8 shadow-xs">
          <h2 className="text-lg font-bold text-[#131b2e] dark:text-white mb-6">Security Credentials</h2>

          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#131b2e] dark:text-[#eef0ff] uppercase tracking-wider mb-2">Current Password</label>
              <input
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full bg-[#faf8ff] dark:bg-[#0b0e14] border border-[#c2c6d9] dark:border-white/10 rounded-xl p-3 text-xs outline-none text-[#131b2e] dark:text-white"
              />
            </div>
            
            <div>
              <label className="block text-xs font-semibold text-[#131b2e] dark:text-[#eef0ff] uppercase tracking-wider mb-2">New Password Area</label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full bg-[#faf8ff] dark:bg-[#0b0e14] border border-[#c2c6d9] dark:border-white/10 rounded-xl p-3 text-xs outline-none text-[#131b2e] dark:text-white"
              />
            </div>

            <button
              type="submit"
              disabled={changePasswordMutation.isPending}
              className="bg-[#004bca] hover:bg-[#0061ff] text-white py-2.5 px-6 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
            >
              {changePasswordMutation.isPending ? 'Updating...' : 'Change Password'}
            </button>
          </form>
        </div>
      </div>

      {/* Settlement Accounts Management panel */}
      <div className="space-y-6">
        <div className="bg-white dark:bg-[#131b2e] border border-[#c2c6d9]/35 rounded-[32px] p-6 shadow-xs">
          <h3 className="text-base font-bold text-[#131b2e] dark:text-white mb-4">Reconciliation Dest Accounts</h3>
          
          {loadingAccounts ? (
            <div className="flex justify-center py-4">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[#004bca]" />
            </div>
          ) : accountsList.length === 0 ? (
            <div className="text-center py-6 text-xs text-[#54647a]">No active reconciliation accounts. Add one below.</div>
          ) : (
            <div className="space-y-3 mb-6 pr-1 max-h-60 overflow-y-auto">
              {accountsList.map((acc: any, idx: number) => {
                const isEditing = editingIndex === idx;
                return (
                  <div key={idx} className="bg-[#faf8ff] dark:bg-[#0b0e14] border border-[#c2c6d9]/30 rounded-xl p-3 text-xs leading-normal">
                    {isEditing ? (
                      <div className="space-y-2">
                        <div>
                          <label className="block text-[10px] text-gray-400 font-bold uppercase mb-1">Provider</label>
                          <select
                            value={editProvider}
                            onChange={(e) => setEditProvider(e.target.value)}
                            className="w-full bg-white dark:bg-[#131b2e] border border-[#c2c6d9]/40 dark:border-white/10 rounded-lg p-2 text-xs outline-none text-[#131b2e] dark:text-white"
                          >
                            <option value="cbe">CBE</option>
                            <option value="telebirr">Telebirr</option>
                            <option value="mpesa">M-Pesa</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] text-gray-400 font-bold uppercase mb-1">Account ID</label>
                          <input
                            type="text"
                            value={editNumber}
                            onChange={(e) => setEditNumber(e.target.value)}
                            className="w-full bg-white dark:bg-[#131b2e] border border-[#c2c6d9]/40 dark:border-white/10 rounded-lg p-2 font-mono text-xs outline-none text-[#131b2e] dark:text-white"
                          />
                        </div>
                        <div className="flex gap-2 justify-end pt-1">
                          <button
                            onClick={() => setEditingIndex(null)}
                            className="px-2.5 py-1 text-gray-500 hover:bg-gray-100 dark:hover:bg-white/5 rounded text-[10px] font-bold cursor-pointer"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => handleUpdateAccount(acc.accountNumber, acc.accountProvider)}
                            disabled={updateAccountMutation.isPending}
                            className="bg-[#004bca] hover:bg-[#0061ff] text-white px-2.5 py-1 rounded text-[10px] font-bold cursor-pointer"
                          >
                            {updateAccountMutation.isPending ? 'Saving...' : 'Save'}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex justify-between items-center">
                        <div>
                          <span className="font-extrabold uppercase text-[#004bca]">{acc.accountProvider}</span>
                          <p className="font-mono text-gray-700 dark:text-gray-300 mt-1">{acc.accountNumber}</p>
                        </div>
                        <div className="flex gap-1">
                          <button
                            onClick={() => handleStartEdit(idx, acc.accountNumber, acc.accountProvider)}
                            className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-lg dark:hover:bg-white/5 cursor-pointer"
                            title="Edit Account Details"
                          >
                            <span className="material-symbols-outlined text-[18px]">edit</span>
                          </button>
                          <button
                            onClick={() => handleRemoveAccount(acc.accountNumber, acc.accountProvider)}
                            className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg dark:hover:bg-white/5 cursor-pointer"
                            title="Remove Account"
                          >
                            <span className="material-symbols-outlined text-[18px]">delete</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Add Account details inline form */}
          <form onSubmit={handleAddAccount} className="pt-4 border-t border-[#c2c6d9]/25 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#131b2e] dark:text-[#eef0ff] uppercase tracking-wider mb-2">Account/Wallet ID</label>
              <input
                type="text"
                required
                value={accNumber}
                onChange={(e) => setAccNumber(e.target.value)}
                placeholder="1000..."
                className="w-full bg-[#faf8ff] dark:bg-[#0b0e14] border border-[#c2c6d9] dark:border-white/10 rounded-xl p-2.5 text-xs outline-none text-[#131b2e] dark:text-white font-mono"
              />
            </div>
            
            <div>
              <label className="block text-xs font-semibold text-[#131b2e] dark:text-[#eef0ff] uppercase tracking-wider mb-2">Account Provider</label>
              <select
                value={provider}
                onChange={(e) => setProvider(e.target.value)}
                className="w-full bg-[#faf8ff] dark:bg-[#0b0e14] border border-[#c2c6d9] dark:border-white/10 rounded-xl p-2.5 text-xs outline-none text-[#131b2e] dark:text-white"
              >
                <option value="cbe">CBE (Commercial Bank of Ethiopia)</option>
                <option value="telebirr">Telebirr Wallet</option>
                <option value="mpesa">M-Pesa Safaricom</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={addAccountMutation.isPending}
              className="w-full bg-[#004bca] hover:bg-[#0061ff] text-white py-2 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
            >
              {addAccountMutation.isPending ? 'Adding...' : 'Add Account'}
            </button>
          </form>
        </div>
      </div>

      <StatusModal 
        visible={modal.visible}
        type={modal.type}
        title={modal.title}
        message={modal.message}
        onClose={() => setModal({ ...modal, visible: false })} 
      />
    </div>
  );
}
