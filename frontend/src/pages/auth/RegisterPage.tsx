import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useRegister } from '@/src/hooks/useAuth';
import { StatusModal } from '@/src/components/StatusModal';

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [accounts, setAccounts] = useState<Array<{ accountNumber: string; accountProvider: string }>>([]);
  
  const [currentAccountNumber, setCurrentAccountNumber] = useState('');
  const [currentAccountProvider, setCurrentAccountProvider] = useState('cbe');
  
  const [errorMsg, setErrorMsg] = useState('');
  const [confirmModalVisible, setConfirmModalVisible] = useState(false);
  const [modal, setModal] = useState<{
    visible: boolean;
    type: 'success' | 'error' | 'info';
    title: string;
    message: string;
  }>({ visible: false, type: 'info', title: '', message: '' });

  const registerMutation = useRegister();
  const navigate = useNavigate();

  const handleAddAccount = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!currentAccountNumber.trim()) {
      setModal({ visible: true, type: 'error', title: 'Input Error', message: 'Please enter an account number.' });
      return;
    }
    if (accounts.some(acc => acc.accountProvider === currentAccountProvider)) {
      setModal({ visible: true, type: 'error', title: 'Duplicate Provider', message: `You have already added an account for ${currentAccountProvider.toUpperCase()}.` });
      return;
    }
    setAccounts([...accounts, { accountNumber: currentAccountNumber.trim(), accountProvider: currentAccountProvider }]);
    setCurrentAccountNumber('');
  };

  const handleRemoveAccount = (index: number) => {
    setAccounts(accounts.filter((_, i) => i !== index));
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!name.trim() || !email.trim() || !password) {
      setModal({ visible: true, type: 'error', title: 'Input Error', message: 'Please fill name, email and password.' });
      return;
    }
    if (accounts.length === 0) {
      setModal({ visible: true, type: 'error', title: 'Input Error', message: 'Please add at least one settlement account.' });
      return;
    }

    setConfirmModalVisible(true);
  };

  const executeRegistration = () => {
    setConfirmModalVisible(false);
    registerMutation.mutate(
      { name: name.trim(), email: email.trim(), password, accounts },
      {
        onSuccess: () => {
          setModal({
            visible: true,
            type: 'success',
            title: 'Account Created',
            message: 'Your account has been created successfully. Welcome to VeriPay!',
          });
        },
        onError: (err: any) => {
          setModal({
            visible: true,
            type: 'error',
            title: 'Registration Failed',
            message: err.response?.data?.message || err.message || 'Something went wrong. Please try again.'
          });
        }
      }
    );
  };

  return (
    <div className="bg-white dark:bg-[#131b2e] border border-[#c2c6d9]/35 rounded-[32px] p-8 md:p-10 shadow-lg relative overflow-hidden max-w-4xl w-full mx-auto">
      {/* Brand header */}
      <div className="flex items-center justify-between mb-8 pb-4 border-b border-[#c2c6d9]/20">
          <Link to='/' className="flex items-center gap-3">
          <span className="material-symbols-outlined text-[32px] text-[#004bca]">shield</span>
          <div>
            <h1 className="text-lg font-bold text-[#131b2e] dark:text-white leading-tight">VeriPay Registration</h1>
            <p className="text-xs text-[#54647a]">Integrate your cashier settlement desks</p>
          </div>
          </Link>
        <Link to="/login" className="text-xs text-[#004bca] hover:underline font-semibold">Already have an account? Sign In</Link>
      </div>

      {errorMsg && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-[#ba1a1a]/10 border border-red-200 dark:border-red-505/20 text-[#ba1a1a] rounded-xl text-xs font-semibold">
          {errorMsg}
        </div>
      )}

      <form onSubmit={handleRegister} className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Left Hand side: User Credentials */}
        <div className="space-y-5">
          <h3 className="text-sm font-bold uppercase tracking-wider text-[#54647a]">1. Core Credentials</h3>
          
          <div>
            <label className="block text-xs font-semibold text-[#131b2e] dark:text-[#eef0ff] uppercase tracking-wider mb-2">Full Name</label>
            <div className="relative flex items-center bg-[#faf8ff] dark:bg-[#0b0e14] border border-[#c2c6d9] dark:border-white/10 rounded-xl px-4 py-3">
              <span className="material-symbols-outlined text-[20px] text-[#54647a] mr-3">person</span>
              <input
                type="text"
                required
                placeholder="eg. Yamlak Negash"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-transparent text-sm outline-none text-[#131b2e] dark:text-white"
              />
            </div>
            <p className="text-[10px] text-amber-600 dark:text-amber-500 font-medium mt-1 leading-normal">
              Must match official bank registry names exactly.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#131b2e] dark:text-[#eef0ff] uppercase tracking-wider mb-2">Corporate Email</label>
            <div className="relative flex items-center bg-[#faf8ff] dark:bg-[#0b0e14] border border-[#c2c6d9] dark:border-white/10 rounded-xl px-4 py-3">
              <span className="material-symbols-outlined text-[20px] text-[#54647a] mr-3">mail</span>
              <input
                type="email"
                required
                placeholder="name@business.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-transparent text-sm outline-none text-[#131b2e] dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#131b2e] dark:text-[#eef0ff] uppercase tracking-wider mb-2">Access Password</label>
            <div className="relative flex items-center bg-[#faf8ff] dark:bg-[#0b0e14] border border-[#c2c6d9] dark:border-white/10 rounded-xl px-4 py-3">
              <span className="material-symbols-outlined text-[20px] text-[#54647a] mr-3">lock</span>
              <input
                type="password"
                required
                placeholder="Min. 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-transparent text-sm outline-none text-[#131b2e] dark:text-white"
              />
            </div>
          </div>
        </div>

        {/* Right Hand side: Settlement Accounts */}
        <div className="space-y-5 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-[#54647a] mb-3">2. Settlement Account</h3>
            
            {/* Added details */}
            {accounts.length > 0 && (
              <div className="mb-4 space-y-2 max-h-40 overflow-y-auto pr-1">
                {accounts.map((acc, idx) => (
                  <div key={idx} className="bg-[#faf8ff] dark:bg-[#0b0e14] border border-[#c2c6d9]/30 rounded-xl p-3 flex justify-between items-center text-xs">
                    <div>
                      <span className="font-bold uppercase text-[#004bca]">{acc.accountProvider}</span>
                      <p className="font-mono mt-0.5 text-gray-700 dark:text-gray-300">{acc.accountNumber}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveAccount(idx)}
                      className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-white/5 rounded-lg"
                    >
                      <span className="material-symbols-outlined text-[18px]">delete</span>
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Input Box */}
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-[#131b2e] dark:text-[#eef0ff] uppercase tracking-wider mb-2">Account Number</label>
                <div className="flex items-center bg-[#faf8ff] dark:bg-[#0b0e14] border border-[#c2c6d9] dark:border-white/10 rounded-xl px-4 py-2.5">
                  <input
                    type="text"
                    placeholder="Enter account or phone number"
                    value={currentAccountNumber}
                    onChange={(e) => setCurrentAccountNumber(e.target.value)}
                    className="w-full bg-transparent text-xs outline-none text-[#131b2e] dark:text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#131b2e] dark:text-[#eef0ff] uppercase tracking-wider mb-2">Account Provider</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'cbe', name: 'CBE' },
                    { id: 'telebirr', name: 'Telebirr' },
                    { id: 'mpesa', name: 'M-Pesa' }
                  ].map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setCurrentAccountProvider(p.id)}
                      className={`py-2 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                        currentAccountProvider === p.id 
                          ? 'bg-[#004bca] border-[#004bca] text-white' 
                          : 'bg-white border-[#c2c6d9] dark:bg-transparent dark:border-[#c2c6d9]/35 text-[#54647a]'
                      }`}
                    >
                      {p.name}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="button"
                onClick={handleAddAccount}
                className="w-full bg-[#004bca]/10 border border-[#004bca]/20 text-[#004bca] py-2 rounded-lg text-xs font-bold transition-all cursor-pointer"
              >
                + Add Account
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={registerMutation.isPending}
            className="w-full bg-[#004bca] hover:bg-[#0061ff] active:scale-95 text-white font-bold py-3.5 rounded-xl transition-all cursor-pointer text-sm shadow-md flex justify-center items-center gap-2"
          >
            {registerMutation.isPending ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <span>Register Workspace</span>
                <span className="material-symbols-outlined text-[18px]">how_to_reg</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* Confirmation Overlay Modal */}
      {confirmModalVisible && (
        <div className="fixed inset-0 z-[1100] bg-black/60 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#131b2e] w-full max-w-sm rounded-[24px] p-6 border border-[#c2c6d9]/35 text-center">
            <span className="material-symbols-outlined text-[48px] text-[#004bca] mb-4">gpp_maybe</span>
            <h4 className="text-lg font-bold text-[#131b2e] dark:text-white mb-2">Confirm Legal Name</h4>
            <p className="text-xs text-[#54647a] mb-5 leading-normal">
              Ensure this name matches the legal account names on your CBE accounts exactly. If incorrect, payment audits will fail.
            </p>
            <div className="bg-[#faf8ff] dark:bg-[#0b0e14] p-3 rounded-lg font-extrabold text-sm mb-6 border border-[#c2c6d9]/20 font-mono">
              {name.trim()}
            </div>
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => setConfirmModalVisible(false)}
                className="w-1/2 bg-gray-100 hover:bg-gray-250 text-gray-700 py-2.5 rounded-lg text-xs font-bold transition-all"
              >
                Edit Name
              </button>
              <button
                type="button"
                onClick={executeRegistration}
                className="w-1/2 bg-[#004bca] hover:bg-[#005cff] text-white py-2.5 rounded-lg text-xs font-bold transition-all shadow-xs"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      <StatusModal 
        visible={modal.visible}
        type={modal.type}
        title={modal.title}
        message={modal.message}
        onClose={() => {
          setModal({ ...modal, visible: false });
          if (modal.type === 'success') navigate('/dashboard');
        }} 
      />
    </div>
  );
}
