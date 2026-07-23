import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/src/store/authStore';
import { useBranchDetail } from '@/src/hooks/useBranch';
import { updateBranchApi, deactivateBranchApi, addBranchAccountApi, removeBranchAccountApi } from '@/src/api/branch.api';
import { StatusModal } from '@/src/components/StatusModal';

export default function BranchDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const actorType = useAuthStore((s) => s.actorType);
  const readOnly = actorType === 'employee';

  const { data: branchData, isLoading, refetch } = useBranchDetail(id || '');
  const branch = branchData?.data as any;

  const [branchName, setBranchName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [country, setCountry] = useState('');
  const [region, setRegion] = useState('');
  const [city, setCity] = useState('');
  const [subCity, setSubCity] = useState('');
  const [wereda, setWereda] = useState('');
  const [kebele, setKebele] = useState('');
  const [address, setAddress] = useState('');

  const [newAccNum, setNewAccNum] = useState('');
  const [newAccProvider, setNewAccProvider] = useState('cbe');

  const [saving, setSaving] = useState(false);
  const [modal, setModal] = useState<{
    visible: boolean;
    type: 'success' | 'error' | 'info';
    title: string;
    message: string;
  }>({ visible: false, type: 'info', title: '', message: '' });

  useEffect(() => {
    if (branch) {
      setBranchName(branch.branchName || '');
      setPhone(branch.phone || '');
      setEmail(branch.email || '');
      setCountry(branch.country || '');
      setRegion(branch.region || '');
      setCity(branch.city || '');
      setSubCity(branch.subCity || '');
      setWereda(branch.wereda || '');
      setKebele(branch.kebele || '');
      setAddress(branch.address || '');
    }
  }, [branch]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !branchName.trim()) return;

    setSaving(true);
    try {
      await updateBranchApi(id, {
        branchName: branchName.trim(),
        phone: phone.trim() || undefined,
        email: email.trim() || undefined,
        country: country.trim() || undefined,
        region: region.trim() || undefined,
        city: city.trim() || undefined,
        subCity: subCity.trim() || undefined,
        wereda: wereda.trim() || undefined,
        kebele: kebele.trim() || undefined,
        address: address.trim() || undefined,
      });
      queryClient.invalidateQueries({ queryKey: ['branch-detail', id] });
      queryClient.invalidateQueries({ queryKey: ['branches'] });
      setModal({ visible: true, type: 'success', title: 'Branch Updated', message: 'Branch details saved successfully.' });
    } catch (err: any) {
      setModal({
        visible: true,
        type: 'error',
        title: 'Save Failed',
        message: err.response?.data?.message || 'Failed to save branch details.',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDeactivate = async () => {
    if (!id) return;
    setSaving(true);
    try {
      await deactivateBranchApi(id);
      queryClient.invalidateQueries({ queryKey: ['branch-detail', id] });
      queryClient.invalidateQueries({ queryKey: ['branches'] });
      setModal({ visible: true, type: 'success', title: 'Deactivated', message: 'Branch has been suspended.' });
    } catch (err: any) {
      setModal({
        visible: true,
        type: 'error',
        title: 'Failed',
        message: err.response?.data?.message || 'Deactivation failed.',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleAddAccount = async () => {
    if (!id || !newAccNum.trim()) return;
    if (branch?.accounts?.some((a: any) => a.accountProvider === newAccProvider)) {
      setModal({ visible: true, type: 'error', title: 'Duplicate Provider', message: `Account for ${newAccProvider.toUpperCase()} already exists.` });
      return;
    }
    try {
      await addBranchAccountApi(id, { accountNumber: newAccNum.trim(), accountProvider: newAccProvider });
      await refetch();
      setNewAccNum('');
    } catch (err: any) {
      setModal({ visible: true, type: 'error', title: 'Add Account Failed', message: err.response?.data?.message || 'Failed to add account.' });
    }
  };

  const handleRemoveAccount = async (accountId: string) => {
    if (!id) return;
    try {
      await removeBranchAccountApi(id, accountId);
      await refetch();
    } catch (err: any) {
      setModal({ visible: true, type: 'error', title: 'Remove Account Failed', message: err.response?.data?.message || 'Failed to remove account.' });
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-8 h-8 border-3 border-[#004bca] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const inputClass = "w-full bg-[#faf8ff] dark:bg-[#0b0e14] border border-[#c2c6d9] dark:border-white/10 rounded-xl p-3 text-xs outline-none text-[#131b2e] dark:text-white disabled:opacity-60 disabled:cursor-not-allowed";
  const labelClass = "block text-xs font-semibold text-[#131b2e] dark:text-[#eef0ff] uppercase tracking-wider mb-2";

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <Link
          to="/dashboard/branches"
          className="p-2 rounded-full hover:bg-[#eaedff] dark:hover:bg-white/10 transition-colors"
        >
          <span className="material-symbols-outlined text-[#131b2e] dark:text-white">arrow_back</span>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-[#131b2e] dark:text-white font-['Geist']">
            {readOnly ? 'Branch Details' : 'Branch Profile'}
          </h1>
          <p className="text-sm text-[#54647a] dark:text-[#c2c6d9] mt-1">{branch?.branchName}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <form onSubmit={handleSave} className="bg-white dark:bg-[#131b2e] border border-[#c2c6d9]/35 rounded-[32px] p-8 shadow-xs space-y-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-bold text-[#131b2e] dark:text-white">Branch Information</h2>
              {branch?.branchCode && (
                <span className="text-xs font-mono font-bold text-[#004bca] bg-[#004bca]/10 px-3 py-1 rounded-full">
                  {branch.branchCode}
                </span>
              )}
            </div>

            <div>
              <label className={labelClass}>Branch Name</label>
              <input type="text" required disabled={readOnly} value={branchName} onChange={(e) => setBranchName(e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Phone Number</label>
              <input type="text" disabled={readOnly} value={phone} onChange={(e) => setPhone(e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Email</label>
              <input type="email" disabled={readOnly} value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Country</label>
                <input type="text" disabled={readOnly} value={country} onChange={(e) => setCountry(e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Region</label>
                <input type="text" disabled={readOnly} value={region} onChange={(e) => setRegion(e.target.value)} className={inputClass} />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>City</label>
                <input type="text" disabled={readOnly} value={city} onChange={(e) => setCity(e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Sub-City</label>
                <input type="text" disabled={readOnly} value={subCity} onChange={(e) => setSubCity(e.target.value)} className={inputClass} />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Wereda</label>
                <input type="text" disabled={readOnly} value={wereda} onChange={(e) => setWereda(e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Kebele</label>
                <input type="text" disabled={readOnly} value={kebele} onChange={(e) => setKebele(e.target.value)} className={inputClass} />
              </div>
            </div>
            <div>
              <label className={labelClass}>Street Address</label>
              <input type="text" disabled={readOnly} value={address} onChange={(e) => setAddress(e.target.value)} className={inputClass} />
            </div>

            {!readOnly && (
              <button
                type="submit"
                disabled={saving}
                className="bg-[#004bca] hover:bg-[#0061ff] text-white py-2.5 px-6 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            )}
          </form>

          {/* Settlement Accounts */}
          <div className="bg-white dark:bg-[#131b2e] border border-[#c2c6d9]/35 rounded-[32px] p-8 shadow-xs">
            <h2 className="text-lg font-bold text-[#131b2e] dark:text-white mb-2">Branch Settlement Accounts</h2>
            <p className="text-xs text-[#54647a] dark:text-[#c2c6d9] mb-6">Payments processed for this branch are verified against these templates.</p>

            {(!branch?.accounts || branch.accounts.length === 0) ? (
              <div className="text-center py-6 text-xs text-[#54647a]">No settlement accounts configured.</div>
            ) : (
              <div className="space-y-3 mb-6">
                {branch.accounts.map((acc: any, idx: number) => (
                  <div key={acc._id || idx} className="bg-[#faf8ff] dark:bg-[#0b0e14] border border-[#c2c6d9]/30 rounded-xl p-3 flex justify-between items-center text-xs">
                    <div>
                      <span className="font-extrabold uppercase text-[#004bca]">{acc.accountProvider}</span>
                      <p className="font-mono text-gray-700 dark:text-gray-300 mt-1">{acc.accountNumber}</p>
                    </div>
                    {!readOnly && acc._id && (
                      <button
                        onClick={() => handleRemoveAccount(acc._id)}
                        className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-white/5 rounded-lg cursor-pointer"
                        title="Remove Account"
                      >
                        <span className="material-symbols-outlined text-[18px]">delete</span>
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}

            {!readOnly && (
              <div className="pt-4 border-t border-[#c2c6d9]/25 space-y-4">
                <div>
                  <label className={labelClass}>Account/Wallet ID</label>
                  <input
                    type="text"
                    value={newAccNum}
                    onChange={(e) => setNewAccNum(e.target.value)}
                    placeholder="1000..."
                    className={`${inputClass} font-mono`}
                  />
                </div>
                <div>
                  <label className={labelClass}>Account Provider</label>
                  <select
                    value={newAccProvider}
                    onChange={(e) => setNewAccProvider(e.target.value)}
                    className={inputClass}
                  >
                    <option value="cbe">CBE (Commercial Bank of Ethiopia)</option>
                    <option value="boa">BOA (Bank of Abyssinia)</option>
                    <option value="telebirr">Telebirr Wallet</option>
                    <option value="mpesa">M-Pesa Safaricom</option>
                    <option value="cbebirr">CBE Birr</option>
                    <option value="dashen">Dashen Bank</option>
                    <option value="awash">Awash Bank</option>
                    <option value="siinqee">Siinqee Bank</option>
                    <option value="kaafiebirr">Kaafi eBirr</option>
                  </select>
                </div>
                <button
                  type="button"
                  onClick={handleAddAccount}
                  className="w-full bg-[#004bca] hover:bg-[#0061ff] text-white py-2 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
                >
                  Add Account
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Overview panel */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-[#131b2e] border border-[#c2c6d9]/35 rounded-[32px] p-6 shadow-xs">
            <h3 className="text-base font-bold text-[#131b2e] dark:text-white mb-4">Branch Overview</h3>

            <div className="space-y-4 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-[#54647a] dark:text-[#c2c6d9]">Status</span>
                <span className={`px-2.5 py-1 rounded-full font-bold uppercase ${
                  branch?.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-500' :
                  branch?.status === 'INACTIVE' ? 'bg-amber-500/10 text-amber-500' :
                  'bg-red-500/10 text-red-500'
                }`}>
                  {branch?.status}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#54647a] dark:text-[#c2c6d9]">Employees</span>
                <span className="font-bold text-[#131b2e] dark:text-white">{branch?.employeeCount ?? 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#54647a] dark:text-[#c2c6d9]">Settlement Accounts</span>
                <span className="font-bold text-[#131b2e] dark:text-white">{branch?.accounts?.length ?? 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#54647a] dark:text-[#c2c6d9]">Subscription</span>
                <span className={`font-bold ${branch?.subscription?.status === 'active' ? 'text-emerald-500' : 'text-[#54647a] dark:text-[#c2c6d9]'}`}>
                  {branch?.subscription?.status === 'active'
                    ? 'Active'
                    : (branch?.trialDaysLeft ?? 0) > 0
                      ? `Trial • ${branch.trialDaysLeft}d left`
                      : 'Inactive'}
                </span>
              </div>
            </div>
          </div>

          {!readOnly && branch?.status !== 'SUSPENDED' && (
            <button
              onClick={handleDeactivate}
              disabled={saving}
              className="w-full text-xs font-semibold py-3 rounded-xl bg-amber-500/10 text-amber-600 hover:bg-amber-500/20 transition-colors disabled:opacity-50"
            >
              Deactivate Branch
            </button>
          )}
        </div>
      </div>

      <StatusModal
        visible={modal.visible}
        type={modal.type}
        title={modal.title}
        message={modal.message}
        onClose={() => {
          setModal({ ...modal, visible: false });
          if (modal.type === 'success' && modal.title === 'Deactivated') navigate('/dashboard/branches');
        }}
      />
    </div>
  );
}
