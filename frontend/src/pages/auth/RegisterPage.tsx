import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useRegister } from '@/src/hooks/useAuth';
import { StatusModal } from '@/src/components/StatusModal';

interface AccountConfig {
  accountNumber: string;
  accountProvider: string;
}

interface ModalState {
  visible: boolean;
  type: 'info' | 'success' | 'error';
  title: string;
  message: string;
}

export default function RegisterPage() {
  const [name, setName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [accounts, setAccounts] = useState<AccountConfig[]>([]);
  
  const [currentAccountNumber, setCurrentAccountNumber] = useState<string>('');
  const [currentAccountProvider, setCurrentAccountProvider] = useState<string>('cbe');
  
  const [confirmModalVisible, setConfirmModalVisible] = useState<boolean>(false);
  const [modal, setModal] = useState<ModalState>({ visible: false, type: 'info', title: '', message: '' });

  const registerMutation = useRegister();
  const navigate = useNavigate();

  const handleAddAccount = (e: React.MouseEvent<HTMLButtonElement>) => {
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
            message: 'Your account has been created successfully. Welcome to Nexus Verify!',
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
    <div className="bg-[#faf8ff] text-[#131b2e] min-h-screen flex flex-col font-['Inter'] antialiased selection:bg-[#0061ff] selection:text-[#f1f2ff]">
      
      {/* Transactional Shell Header */}
      <header className="w-full py-4 px-8 flex justify-between items-center border-b border-[#c2c6d9]/25 bg-white">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded bg-[#004bca] flex items-center justify-center text-white">
            <span className="material-symbols-outlined text-[20px]">shield</span>
          </div>
          <span className="font-['Geist'] text-2xl font-medium text-[#131b2e]">Nexus Verify</span>
        </Link>
        <div className="font-['Geist'] text-[13px] font-medium text-[#424656] flex items-center gap-1">
          <span className="material-symbols-outlined text-[16px]">lock</span>
          Secure Registration
        </div>
      </header>

      {/* Full-Width Workspace Container Canvas */}
      <main className="flex-grow flex justify-center py-10 px-8 w-full max-w-[1440px] mx-auto">
        <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Descriptive Informational Side Panel Column (Span 4) */}
          <div className="lg:col-span-4 space-y-4">
            <div>
              <h1 className="font-['Geist'] text-[32px] font-semibold tracking-[-0.02em] text-[#131b2e] mb-2">Create your account</h1>
              <p className="text-[16px] text-[#424656] leading-relaxed">
                Set up your administrative environment workspace parameters and dynamic payment routing preferences.
              </p>
            </div>
            <div className="bg-[#f2f3ff] border border-[#c2c6d9]/40 rounded-xl p-4 flex items-start gap-3">
              <span className="material-symbols-outlined text-[#004bca] text-[22px] mt-0.5">verified_user</span>
              <p className="text-xs text-[#424656] leading-normal">
                Credentials entered will undergo an validation trace matching regulatory identification protocols before settlement network distribution triggers activation.
              </p>
            </div>
            <div className="text-xs text-[#54647a] pt-2">
              Already have a register trace?{' '}
              <Link to="/login" className="text-[#004bca] hover:underline font-bold ml-1">Sign In</Link>
            </div>
          </div>

          {/* Form Processing Panel Input Base Stack (Span 8) */}
          <form onSubmit={handleRegister} className="lg:col-span-8 space-y-6">
            
            {/* Form Section 1: Principal Authorization Credentials */}
            <section className="bg-white rounded-xl border border-[#c2c6d9]/40 shadow-sm p-6 md:p-8">
              <h2 className="font-['Geist'] text-[20px] font-medium text-[#131b2e] mb-4">Account Details</h2>
              <div className="space-y-4">
                <div>
                  <label className="block font-['Geist'] text-[13px] font-medium text-[#131b2e] mb-2" htmlFor="fullName">Full Legal Name</label>
                  <input 
                    id="fullName"
                    type="text" 
                    required
                    placeholder="e.g. Jane Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-[#faf8ff] text-[#131b2e] text-sm border border-[#c2c6d9] rounded-lg px-4 py-3 focus:outline-none focus:border-[#004bca] focus:ring-2 focus:ring-[#004bca]/20 transition-all placeholder:text-[#424656]/50" 
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-['Geist'] text-[13px] font-medium text-[#131b2e] mb-2" htmlFor="email">Work Email</label>
                    <input 
                      id="email"
                      type="email" 
                      required
                      placeholder="name@company.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-[#faf8ff] text-[#131b2e] text-sm border border-[#c2c6d9] rounded-lg px-4 py-3 focus:outline-none focus:border-[#004bca] focus:ring-2 focus:ring-[#004bca]/20 transition-all placeholder:text-[#424656]/50" 
                    />
                  </div>
                  <div>
                    <label className="block font-['Geist'] text-[13px] font-medium text-[#131b2e] mb-2" htmlFor="password">Password</label>
                    <input 
                      id="password"
                      type="password" 
                      required
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-[#faf8ff] text-[#131b2e] text-sm border border-[#c2c6d9] rounded-lg px-4 py-3 focus:outline-none focus:border-[#004bca] focus:ring-2 focus:ring-[#004bca]/20 transition-all placeholder:text-[#424656]/50" 
                    />
                  </div>
                </div>
              </div>
            </section>

            {/* Form Section 2: Financial Routing Matrix Topology */}
            <section className="bg-white rounded-xl border border-[#c2c6d9]/40 shadow-sm p-6 md:p-8">
              <div className="mb-4">
                <h2 className="font-['Geist'] text-[20px] font-medium text-[#131b2e] mb-0.5">Settlement Accounts</h2>
                <p className="text-sm text-[#424656]">Add primary banking nodes or digital ledgers for routing settlement flows.</p>
              </div>

              {/* Dynamic Parameter Entry Row */}
              <div className="flex flex-col md:flex-row gap-3 items-end bg-[#faf8ff] p-4 rounded-lg border border-[#c2c6d9]/30 mb-4">
                <div className="w-full md:w-1/3">
                  <label className="block font-['Geist'] text-[13px] font-medium text-[#131b2e] mb-2" htmlFor="provider">Provider</label>
                  <select 
                    id="provider"
                    value={currentAccountProvider}
                    onChange={(e) => setCurrentAccountProvider(e.target.value)}
                    className="w-full bg-white text-[#131b2e] text-sm border border-[#c2c6d9] rounded-lg px-4 py-3 focus:outline-none focus:border-[#004bca] focus:ring-2 focus:ring-[#004bca]/20 appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%23424656%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-no-repeat bg-[position:right_12px_center] pr-10"
                  >
                    <option value="cbe">CBE</option>
                    <option value="telebirr">Telebirr</option>
                    <option value="mpesa">M-Pesa</option>
                  </select>
                </div>
                <div className="w-full md:flex-grow">
                  <label className="block font-['Geist'] text-[13px] font-medium text-[#131b2e] mb-2" htmlFor="accountNumber">Account / Phone Number</label>
                  <input 
                    id="accountNumber"
                    type="text" 
                    placeholder="Enter alphanumeric route reference"
                    value={currentAccountNumber}
                    onChange={(e) => setCurrentAccountNumber(e.target.value)}
                    className="w-full bg-white text-[#131b2e] text-sm font-['JetBrains_Mono'] border border-[#c2c6d9] rounded-lg px-4 py-[11px] focus:outline-none focus:border-[#004bca] focus:ring-2 focus:ring-[#004bca]/20 placeholder:text-[#424656]/50"
                  />
                </div>
                <button 
                  type="button"
                  onClick={handleAddAccount}
                  className="w-full md:w-auto h-[44px] px-5 flex items-center justify-center gap-1.5 font-['Geist'] text-[13px] font-medium bg-[#f2f3ff] hover:bg-[#eaedff] text-[#131b2e] border border-[#c2c6d9] rounded-lg transition-colors whitespace-nowrap"
                >
                  <span className="material-symbols-outlined text-[18px]">add</span>
                  Add Account
                </button>
              </div>

              {/* Layout Config Pipeline Matrix Grid */}
              <div className="border border-[#c2c6d9]/30 rounded-lg overflow-hidden">
                <div className="grid grid-cols-12 gap-2 px-4 py-2.5 bg-[#f2f3ff] border-b border-[#c2c6d9]/30 font-['Geist'] text-[11px] font-semibold text-[#424656] uppercase tracking-wider">
                  <div className="col-span-4">Provider</div>
                  <div className="col-span-5">Account Details</div>
                  <div className="col-span-3 text-right">Action</div>
                </div>

                <div className="divide-y divide-[#c2c6d9]/20">
                  {accounts.map((acc, idx) => (
                    <div key={idx} className="grid grid-cols-12 gap-2 px-4 py-3 items-center hover:bg-[#faf8ff]/50 transition-colors">
                      <div className="col-span-4 flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-[#eaedff] border border-[#c2c6d9]/30 flex items-center justify-center">
                          <span className="material-symbols-outlined text-[16px] text-[#505f76]">
                            {acc.accountProvider === 'cbe' ? 'account_balance' : 'smartphone'}
                          </span>
                        </div>
                        <span className="text-sm font-medium text-[#131b2e] uppercase">{acc.accountProvider}</span>
                      </div>
                      <div className="col-span-5 font-['JetBrains_Mono'] text-[13px] text-[#424656]">
                        {acc.accountNumber}
                      </div>
                      <div className="col-span-3 flex justify-end">
                        <button
                          type="button"
                          onClick={() => handleRemoveAccount(idx)}
                          className="p-1.5 text-[#ba1a1a] hover:bg-[#ffdad6] rounded-lg transition-colors focus:outline-none"
                        >
                          <span className="material-symbols-outlined text-[18px]">delete</span>
                        </button>
                      </div>
                    </div>
                  ))}
                  {accounts.length === 0 && (
                    <div className="p-6 text-center text-xs text-[#424656]">No accounts appended to configuration stack yet.</div>
                  )}
                </div>
              </div>
            </section>

            {/* Core Interaction Sub-Action Container Footer */}
            <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-xs text-[#424656] text-center sm:text-left max-w-md leading-normal">
                By creating an account, you agree to our{' '}
                <a className="text-[#004bca] hover:underline" href="#">Terms of Service</a> and{' '}
                <a className="text-[#004bca] hover:underline" href="#">Privacy Policy</a>.
              </p>
              <button 
                type="submit"
                disabled={registerMutation.isPending}
                className="w-full sm:w-auto px-8 py-3 h-[46px] bg-[#004bca] hover:bg-[#0061ff] disabled:bg-[#c2c6d9] text-white font-['Geist'] text-[13px] font-bold rounded-lg transition-all flex items-center justify-center shadow-sm gap-2 focus:outline-none"
              >
                {registerMutation.isPending ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Initialize Core Registration</span>
                    <span className="material-symbols-outlined text-[18px]">how_to_reg</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </main>

      {/* Global Environmental Full Desktop Sticky Footer */}
      <footer className="w-full py-6 bg-white border-t border-[#c2c6d9]/20 mt-auto">
        <div className="max-w-[1440px] mx-auto px-8 flex flex-col md:flex-row justify-between items-center gap-2">
          <span className="text-sm text-[#424656] text-[13px]">
            © 2026 Nexus Verify Systems. Secure environment framework runtime active.
          </span>
          <div className="flex gap-6 text-sm text-[#424656] text-[13px]">
            <a className="hover:text-[#004bca] transition-colors" href="#">Help Center</a>
            <a className="hover:text-[#004bca] transition-colors" href="#">System Status</a>
          </div>
        </div>
      </footer>

      {/* Audit Confirmation Intercept Modal Panel */}
      {confirmModalVisible && (
        <div className="fixed inset-0 z-[1100] bg-black/60 flex items-center justify-center p-4 backdrop-blur-[2px]">
          <div className="bg-white w-full max-w-sm rounded-[24px] p-6 border border-[#c2c6d9]/35 text-center shadow-2xl">
            <span className="material-symbols-outlined text-[48px] text-[#004bca] mb-4">gpp_maybe</span>
            <h4 className="text-lg font-bold text-[#131b2e] mb-2">Confirm Legal Name</h4>
            <p className="text-xs text-[#54647a] mb-5 leading-normal">
              Ensure this name matches the legal account names on your registry accounts exactly. If incorrect, payment audits will fail.
            </p>
            <div className="bg-[#faf8ff] p-3 rounded-lg font-extrabold text-sm mb-6 border border-[#c2c6d9]/20 font-['JetBrains_Mono']">
              {name.trim()}
            </div>
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => setConfirmModalVisible(false)}
                className="w-1/2 bg-[#f2f3ff] hover:bg-[#eaedff] text-[#131b2e] py-2.5 rounded-lg text-xs font-bold transition-all"
              >
                Edit Name
              </button>
              <button
                type="button"
                onClick={executeRegistration}
                className="w-1/2 bg-[#004bca] hover:bg-[#0061ff] text-white py-2.5 rounded-lg text-xs font-bold transition-all shadow-sm"
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