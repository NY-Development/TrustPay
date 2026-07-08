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
            message: 'Your account has been created successfully. Welcome to Trust Pay!',
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
    <div className="bg-background text-foreground min-h-screen flex flex-col font-sans antialiased selection:bg-primary selection:text-primary-foreground">
      
      <header className="w-full py-4 px-8 flex justify-between items-center border-b border-border bg-card">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded bg-primary flex items-center justify-center text-primary-foreground">
            <span className="material-symbols-outlined text-[20px]">shield</span>
          </div>
          <span className="font-heading text-2xl font-medium text-foreground">Trust Pay</span>
        </Link>
        <div className="text-[13px] font-medium text-muted-foreground flex items-center gap-1">
          <span className="material-symbols-outlined text-[16px]">lock</span>
          Secure Registration
        </div>
      </header>

      <main className="flex-grow flex justify-center py-10 px-8 w-full max-w-[1440px] mx-auto">
        <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          <div className="lg:col-span-4 space-y-4">
            <div>
              <h1 className="text-[32px] font-semibold tracking-tight text-foreground mb-2">Create your account</h1>
              <p className="text-[16px] text-muted-foreground leading-relaxed">
                Set up your administrative environment workspace parameters and dynamic payment routing preferences.
              </p>
            </div>
            <div className="bg-secondary border border-border rounded-xl p-4 flex items-start gap-3">
              <span className="material-symbols-outlined text-primary text-[22px] mt-0.5">verified_user</span>
              <p className="text-xs text-muted-foreground leading-normal">
                Credentials entered will undergo an validation trace matching regulatory identification protocols before settlement network distribution triggers activation.
              </p>
            </div>
            <div className="text-xs text-muted-foreground pt-2">
              Already have a register trace?{' '}
              <Link to="/login" className="text-primary hover:underline font-bold ml-1">Sign In</Link>
            </div>
          </div>

          <form onSubmit={handleRegister} className="lg:col-span-8 space-y-6">
            <section className="bg-card rounded-xl border border-border shadow-sm p-6 md:p-8">
              <h2 className="text-[20px] font-medium text-foreground mb-4">Account Details</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-[13px] font-medium text-foreground mb-2" htmlFor="fullName">Full Legal Name</label>
                  <input 
                    id="fullName"
                    type="text" 
                    required
                    placeholder="e.g. Jane Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-background text-foreground text-sm border border-input rounded-lg px-4 py-3 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-muted-foreground" 
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[13px] font-medium text-foreground mb-2" htmlFor="email">Work Email</label>
                    <input 
                      id="email"
                      type="email" 
                      required
                      placeholder="name@company.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-background text-foreground text-sm border border-input rounded-lg px-4 py-3 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-muted-foreground" 
                    />
                  </div>
                  <div>
                    <label className="block text-[13px] font-medium text-foreground mb-2" htmlFor="password">Password</label>
                    <input 
                      id="password"
                      type="password" 
                      required
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-background text-foreground text-sm border border-input rounded-lg px-4 py-3 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-muted-foreground" 
                    />
                  </div>
                </div>
              </div>
            </section>

            <section className="bg-card rounded-xl border border-border shadow-sm p-6 md:p-8">
              <div className="mb-4">
                <h2 className="text-[20px] font-medium text-foreground mb-0.5">Settlement Accounts</h2>
                <p className="text-sm text-muted-foreground">Add primary banking nodes or digital ledgers for routing settlement flows.</p>
              </div>

              <div className="flex flex-col md:flex-row gap-3 items-end bg-background p-4 rounded-lg border border-border mb-4">
                <div className="w-full md:w-1/3">
                  <label className="block text-[13px] font-medium text-foreground mb-2" htmlFor="provider">Provider</label>
                  <select 
                    id="provider"
                    value={currentAccountProvider}
                    onChange={(e) => setCurrentAccountProvider(e.target.value)}
                    className="w-full bg-card text-foreground text-sm border border-input rounded-lg px-4 py-3 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                  >
                    <option value="cbe">CBE</option>
                    <option value="telebirr">Telebirr</option>
                    <option value="mpesa">M-Pesa</option>
                  </select>
                </div>
                <div className="w-full md:flex-grow">
                  <label className="block text-[13px] font-medium text-foreground mb-2" htmlFor="accountNumber">Account / Phone Number</label>
                  <input 
                    id="accountNumber"
                    type="text" 
                    placeholder="Enter alphanumeric route reference"
                    value={currentAccountNumber}
                    onChange={(e) => setCurrentAccountNumber(e.target.value)}
                    className="w-full bg-card text-foreground text-sm border border-input rounded-lg px-4 py-[11px] focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 placeholder:text-muted-foreground"
                  />
                </div>
                <button 
                  type="button"
                  onClick={handleAddAccount}
                  className="w-full md:w-auto h-[44px] px-5 flex items-center justify-center gap-1.5 text-[13px] font-medium bg-secondary hover:bg-secondary/80 text-foreground border border-input rounded-lg transition-colors"
                >
                  <span className="material-symbols-outlined text-[18px]">add</span>
                  Add Account
                </button>
              </div>

              <div className="border border-border rounded-lg overflow-hidden">
                <div className="grid grid-cols-12 gap-2 px-4 py-2.5 bg-secondary border-b border-border text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                  <div className="col-span-4">Provider</div>
                  <div className="col-span-5">Account Details</div>
                  <div className="col-span-3 text-right">Action</div>
                </div>

                <div className="divide-y divide-border">
                  {accounts.map((acc, idx) => (
                    <div key={idx} className="grid grid-cols-12 gap-2 px-4 py-3 items-center hover:bg-muted/50 transition-colors">
                      <div className="col-span-4 flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-background border border-border flex items-center justify-center">
                          <span className="material-symbols-outlined text-[16px] text-muted-foreground">
                            {acc.accountProvider === 'cbe' ? 'account_balance' : 'smartphone'}
                          </span>
                        </div>
                        <span className="text-sm font-medium text-foreground uppercase">{acc.accountProvider}</span>
                      </div>
                      <div className="col-span-5 text-[13px] text-muted-foreground">
                        {acc.accountNumber}
                      </div>
                      <div className="col-span-3 flex justify-end">
                        <button
                          type="button"
                          onClick={() => handleRemoveAccount(idx)}
                          className="p-1.5 text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                        >
                          <span className="material-symbols-outlined text-[18px]">delete</span>
                        </button>
                      </div>
                    </div>
                  ))}
                  {accounts.length === 0 && (
                    <div className="p-6 text-center text-xs text-muted-foreground">No accounts appended to configuration stack yet.</div>
                  )}
                </div>
              </div>
            </section>

            <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-xs text-muted-foreground text-center sm:text-left max-w-md">
                By creating an account, you agree to our{' '}
                <a className="text-primary hover:underline" href="#">Terms of Service</a> and{' '}
                <a className="text-primary hover:underline" href="#">Privacy Policy</a>.
              </p>
              <button 
                type="submit"
                disabled={registerMutation.isPending}
                className="w-full sm:w-auto px-8 py-3 h-[46px] bg-primary hover:bg-primary/90 disabled:bg-muted text-primary-foreground text-[13px] font-bold rounded-lg transition-all flex items-center justify-center gap-2"
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

      <footer className="w-full py-6 bg-card border-t border-border mt-auto">
        <div className="max-w-[1440px] mx-auto px-8 flex flex-col md:flex-row justify-between items-center gap-2">
          <span className="text-muted-foreground text-[13px]">
            © 2026 Trust Pay Systems. Secure environment framework runtime active.
          </span>
          <div className="flex gap-6 text-muted-foreground text-[13px]">
            <a className="hover:text-primary transition-colors" href="#">Help Center</a>
            <a className="hover:text-primary transition-colors" href="#">System Status</a>
          </div>
        </div>
      </footer>

      {confirmModalVisible && (
        <div className="fixed inset-0 z-[1100] bg-black/60 flex items-center justify-center p-4 backdrop-blur-[2px]">
          <div className="bg-card w-full max-w-sm rounded-[24px] p-6 border border-border text-center shadow-2xl">
            <span className="material-symbols-outlined text-[48px] text-primary mb-4">gpp_maybe</span>
            <h4 className="text-lg font-bold text-foreground mb-2">Confirm Legal Name</h4>
            <p className="text-xs text-muted-foreground mb-5">
              Ensure this name matches the legal account names on your registry accounts exactly.
            </p>
            <div className="bg-background p-3 rounded-lg font-extrabold text-sm mb-6 border border-border">
              {name.trim()}
            </div>
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => setConfirmModalVisible(false)}
                className="w-1/2 bg-secondary hover:bg-secondary/80 text-foreground py-2.5 rounded-lg text-xs font-bold transition-all"
              >
                Edit Name
              </button>
              <button
                type="button"
                onClick={executeRegistration}
                className="w-1/2 bg-primary hover:bg-primary/90 text-primary-foreground py-2.5 rounded-lg text-xs font-bold transition-all"
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