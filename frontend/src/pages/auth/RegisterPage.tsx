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

const COMPANY_TYPES = [
  { value: 'HOTEL', label: 'Hotel' },
  { value: 'RESTAURANT', label: 'Restaurant' },
  { value: 'FUEL_STATION', label: 'Fuel Station' },
  { value: 'SUPERMARKET', label: 'Supermarket' },
  { value: 'PHARMACY', label: 'Pharmacy' },
  { value: 'RETAIL', label: 'Retail' },
  { value: 'CAFE', label: 'Cafe' },
  { value: 'OTHER', label: 'Other' },
];

const PROVIDERS = ['cbe', 'boa', 'telebirr', 'mpesa', 'cbebirr', 'dashen', 'awash', 'siinqee', 'kaafiebirr'];

const TOTAL_STEPS = 5;

export default function RegisterPage() {
  const [step, setStep] = useState<number>(1);
  const [errorMsg, setErrorMsg] = useState<string>('');

  // Step 1 — Owner
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Step 2 — Company
  const [companyName, setCompanyName] = useState('');
  const [companyType, setCompanyType] = useState('RETAIL');
  const [website, setWebsite] = useState('');
  const [companyRegion, setCompanyRegion] = useState('');
  const [companyCity, setCompanyCity] = useState('');
  const [companyAddress, setCompanyAddress] = useState('');

  // Step 3 — Initial Branch
  const [branchName, setBranchName] = useState('');
  const [branchPhone, setBranchPhone] = useState('');
  const [branchEmail, setBranchEmail] = useState('');
  const [branchRegion, setBranchRegion] = useState('');
  const [branchCity, setBranchCity] = useState('');
  const [branchSubCity, setBranchSubCity] = useState('');
  const [branchWereda, setBranchWereda] = useState('');
  const [branchKebele, setBranchKebele] = useState('');
  const [branchAddress, setBranchAddress] = useState('');

  // Step 4 — Branch accounts
  const [accounts, setAccounts] = useState<AccountConfig[]>([]);
  const [currentAccountNumber, setCurrentAccountNumber] = useState('');
  const [currentAccountProvider, setCurrentAccountProvider] = useState('cbe');

  const [modal, setModal] = useState<ModalState>({ visible: false, type: 'info', title: '', message: '' });

  const registerMutation = useRegister();
  const navigate = useNavigate();

  const handleAddAccount = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (!currentAccountNumber.trim()) {
      setModal({ visible: true, type: 'error', title: 'Input Error', message: 'Please enter an account number.' });
      return;
    }
    if (accounts.some((acc) => acc.accountProvider === currentAccountProvider)) {
      setModal({ visible: true, type: 'error', title: 'Duplicate Provider', message: `You have already added an account for ${currentAccountProvider.toUpperCase()}.` });
      return;
    }
    setAccounts([...accounts, { accountNumber: currentAccountNumber.trim(), accountProvider: currentAccountProvider }]);
    setCurrentAccountNumber('');
  };

  const handleRemoveAccount = (index: number) => {
    setAccounts(accounts.filter((_, i) => i !== index));
  };

  const validateStep = (): boolean => {
    if (step === 1) {
      if (!name.trim() || !email.trim() || !password) {
        setErrorMsg('Please fill your name, email, and password.');
        return false;
      }
      if (password.length < 6) {
        setErrorMsg('Password must be at least 6 characters.');
        return false;
      }
    } else if (step === 2) {
      if (!companyName.trim() || !companyRegion.trim() || !companyCity.trim() || !companyAddress.trim()) {
        setErrorMsg('Please fill company name, region, city, and address.');
        return false;
      }
    } else if (step === 3) {
      if (!branchName.trim() || !branchPhone.trim() || !branchEmail.trim() || !branchRegion.trim() || !branchCity.trim() || !branchAddress.trim()) {
        setErrorMsg('Please fill branch name, phone, email, region, city, and address.');
        return false;
      }
    } else if (step === 4) {
      if (accounts.length === 0) {
        setErrorMsg('Please add at least one settlement account.');
        return false;
      }
    }
    setErrorMsg('');
    return true;
  };

  const handleNext = () => {
    if (validateStep()) setStep((s) => Math.min(s + 1, TOTAL_STEPS));
  };

  const handleBack = () => {
    setErrorMsg('');
    setStep((s) => Math.max(s - 1, 1));
  };

  const handleRegister = () => {
    const payload = {
      name: name.trim(),
      email: email.trim(),
      password,
      companyInfo: {
        companyName: companyName.trim(),
        companyType,
        website: website.trim() || undefined,
        country: 'Ethiopia',
        region: companyRegion.trim(),
        city: companyCity.trim(),
        address: companyAddress.trim(),
      },
      initialBranch: {
        branchName: branchName.trim(),
        country: 'Ethiopia',
        region: branchRegion.trim(),
        city: branchCity.trim(),
        subCity: branchSubCity.trim() || undefined,
        wereda: branchWereda.trim() || undefined,
        kebele: branchKebele.trim() || undefined,
        address: branchAddress.trim(),
        phone: branchPhone.trim(),
        email: branchEmail.trim(),
        accounts,
      },
    };

    registerMutation.mutate(payload, {
      onSuccess: () => {
        setModal({
          visible: true,
          type: 'success',
          title: 'Account Created',
          message: 'Your owner profile and first branch are set up. Enjoy your trial — welcome to Trust Pay!',
        });
      },
      onError: (err: any) => {
        setModal({
          visible: true,
          type: 'error',
          title: 'Registration Failed',
          message: err.response?.data?.message || err.message || 'Something went wrong. Please try again.',
        });
      },
    });
  };

  const inputCls =
    'w-full bg-background text-foreground text-sm border border-input rounded-lg px-4 py-3 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-muted-foreground';
  const labelCls = 'block text-[13px] font-medium text-foreground mb-2';

  const stepTitles = ['Owner Profile', 'Company Details', 'Initial Branch', 'Settlement Accounts', 'Confirm & Submit'];

  return (
    <div className="bg-background text-foreground min-h-screen flex flex-col font-sans antialiased">
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

      <main className="flex-grow flex justify-center py-10 px-4 sm:px-8 w-full max-w-[720px] mx-auto">
        <div className="w-full space-y-6">
          {/* Progress */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <h1 className="text-[26px] font-semibold tracking-tight text-foreground">{stepTitles[step - 1]}</h1>
              <span className="text-xs font-semibold text-muted-foreground">Step {step} of {TOTAL_STEPS}</span>
            </div>
            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-primary transition-all duration-300" style={{ width: `${(step / TOTAL_STEPS) * 100}%` }} />
            </div>
          </div>

          {errorMsg && (
            <div className="p-4 bg-destructive/10 border border-destructive/20 text-destructive rounded-xl text-xs font-semibold">
              {errorMsg}
            </div>
          )}

          <section className="bg-card rounded-xl border border-border shadow-sm p-6 md:p-8 space-y-4">
            {/* Step 1 — Owner */}
            {step === 1 && (
              <>
                <div>
                  <label className={labelCls}>Full Legal Name</label>
                  <input type="text" placeholder="e.g. Samuel Ayele" value={name} onChange={(e) => setName(e.target.value)} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Work Email</label>
                  <input type="email" placeholder="name@company.com" value={email} onChange={(e) => setEmail(e.target.value)} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Password</label>
                  <input type="password" placeholder="Min 6 characters" value={password} onChange={(e) => setPassword(e.target.value)} className={inputCls} />
                </div>
              </>
            )}

            {/* Step 2 — Company */}
            {step === 2 && (
              <>
                <div>
                  <label className={labelCls}>Company Name</label>
                  <input type="text" placeholder="e.g. Samuel Foods PLC" value={companyName} onChange={(e) => setCompanyName(e.target.value)} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Company Type</label>
                  <select value={companyType} onChange={(e) => setCompanyType(e.target.value)} className={inputCls}>
                    {COMPANY_TYPES.map((ct) => (
                      <option key={ct.value} value={ct.value}>{ct.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Website <span className="text-muted-foreground font-normal">(optional)</span></label>
                  <input type="url" placeholder="https://example.com" value={website} onChange={(e) => setWebsite(e.target.value)} className={inputCls} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>Region</label>
                    <input type="text" placeholder="e.g. Addis Ababa" value={companyRegion} onChange={(e) => setCompanyRegion(e.target.value)} className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>City</label>
                    <input type="text" placeholder="e.g. Addis Ababa" value={companyCity} onChange={(e) => setCompanyCity(e.target.value)} className={inputCls} />
                  </div>
                </div>
                <div>
                  <label className={labelCls}>Headquarters Address</label>
                  <input type="text" placeholder="e.g. Bole Sub-city, Wereda 08" value={companyAddress} onChange={(e) => setCompanyAddress(e.target.value)} className={inputCls} />
                </div>
              </>
            )}

            {/* Step 3 — Initial Branch */}
            {step === 3 && (
              <>
                <div>
                  <label className={labelCls}>Branch Name</label>
                  <input type="text" placeholder="e.g. Bole Medhanialem Store" value={branchName} onChange={(e) => setBranchName(e.target.value)} className={inputCls} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>Contact Phone</label>
                    <input type="tel" placeholder="+251..." value={branchPhone} onChange={(e) => setBranchPhone(e.target.value)} className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Contact Email</label>
                    <input type="email" placeholder="branch@company.com" value={branchEmail} onChange={(e) => setBranchEmail(e.target.value)} className={inputCls} />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>Region</label>
                    <input type="text" placeholder="Addis Ababa" value={branchRegion} onChange={(e) => setBranchRegion(e.target.value)} className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>City</label>
                    <input type="text" placeholder="Addis Ababa" value={branchCity} onChange={(e) => setBranchCity(e.target.value)} className={inputCls} />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className={labelCls}>Sub-City</label>
                    <input type="text" placeholder="Bole" value={branchSubCity} onChange={(e) => setBranchSubCity(e.target.value)} className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Wereda</label>
                    <input type="text" placeholder="03" value={branchWereda} onChange={(e) => setBranchWereda(e.target.value)} className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Kebele</label>
                    <input type="text" placeholder="12" value={branchKebele} onChange={(e) => setBranchKebele(e.target.value)} className={inputCls} />
                  </div>
                </div>
                <div>
                  <label className={labelCls}>Detailed Address</label>
                  <input type="text" placeholder="e.g. Near Edna Mall" value={branchAddress} onChange={(e) => setBranchAddress(e.target.value)} className={inputCls} />
                </div>
              </>
            )}

            {/* Step 4 — Accounts */}
            {step === 4 && (
              <>
                <p className="text-sm text-muted-foreground">Add the payment accounts used by this branch to receive settlements.</p>
                <div className="flex flex-col md:flex-row gap-3 items-end bg-background p-4 rounded-lg border border-border">
                  <div className="w-full md:w-1/3">
                    <label className={labelCls}>Provider</label>
                    <select value={currentAccountProvider} onChange={(e) => setCurrentAccountProvider(e.target.value)} className={inputCls}>
                      {PROVIDERS.map((p) => (
                        <option key={p} value={p}>{p.toUpperCase()}</option>
                      ))}
                    </select>
                  </div>
                  <div className="w-full md:flex-grow">
                    <label className={labelCls}>Account / Phone Number</label>
                    <input type="text" placeholder="Enter account number" value={currentAccountNumber} onChange={(e) => setCurrentAccountNumber(e.target.value)} className={inputCls} />
                  </div>
                  <button type="button" onClick={handleAddAccount} className="w-full md:w-auto h-[44px] px-5 flex items-center justify-center gap-1.5 text-[13px] font-medium bg-secondary hover:bg-secondary/80 text-foreground border border-input rounded-lg transition-colors">
                    <span className="material-symbols-outlined text-[18px]">add</span>
                    Add
                  </button>
                </div>

                <div className="border border-border rounded-lg divide-y divide-border">
                  {accounts.map((acc, idx) => (
                    <div key={idx} className="flex items-center justify-between px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-[18px] text-muted-foreground">account_balance</span>
                        <span className="text-sm font-medium text-foreground uppercase">{acc.accountProvider}</span>
                        <span className="text-[13px] text-muted-foreground">· {acc.accountNumber}</span>
                      </div>
                      <button type="button" onClick={() => handleRemoveAccount(idx)} className="p-1.5 text-destructive hover:bg-destructive/10 rounded-lg transition-colors">
                        <span className="material-symbols-outlined text-[18px]">delete</span>
                      </button>
                    </div>
                  ))}
                  {accounts.length === 0 && (
                    <div className="p-6 text-center text-xs text-muted-foreground">No accounts added yet.</div>
                  )}
                </div>
              </>
            )}

            {/* Step 5 — Confirm */}
            {step === 5 && (
              <div className="space-y-4 text-sm">
                <div>
                  <h3 className="text-foreground font-semibold mb-1">Owner</h3>
                  <p className="text-muted-foreground">{name} · {email}</p>
                </div>
                <div>
                  <h3 className="text-foreground font-semibold mb-1">Company</h3>
                  <p className="text-muted-foreground">{companyName} · {COMPANY_TYPES.find((c) => c.value === companyType)?.label}</p>
                  <p className="text-muted-foreground">{companyCity}, {companyRegion}</p>
                </div>
                <div>
                  <h3 className="text-foreground font-semibold mb-1">Initial Branch</h3>
                  <p className="text-muted-foreground">{branchName} · {branchPhone}</p>
                  <p className="text-muted-foreground">{branchCity}, {branchRegion} · {accounts.length} account(s)</p>
                </div>
              </div>
            )}
          </section>

          {/* Actions */}
          <div className="flex items-center justify-between gap-4">
            <button
              type="button"
              onClick={handleBack}
              disabled={step === 1}
              className="px-6 py-3 h-[46px] text-[13px] font-semibold text-foreground bg-secondary hover:bg-secondary/80 disabled:opacity-40 rounded-lg transition-all"
            >
              Back
            </button>

            {step < TOTAL_STEPS ? (
              <button
                type="button"
                onClick={handleNext}
                className="px-8 py-3 h-[46px] bg-primary hover:bg-primary/90 text-primary-foreground text-[13px] font-bold rounded-lg transition-all flex items-center gap-2"
              >
                <span>Next</span>
                <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleRegister}
                disabled={registerMutation.isPending}
                className="px-8 py-3 h-[46px] bg-primary hover:bg-primary/90 disabled:bg-muted text-primary-foreground text-[13px] font-bold rounded-lg transition-all flex items-center gap-2"
              >
                {registerMutation.isPending ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Create Account</span>
                    <span className="material-symbols-outlined text-[18px]">how_to_reg</span>
                  </>
                )}
              </button>
            )}
          </div>

          <div className="text-xs text-muted-foreground text-center">
            Already have an account?{' '}
            <Link to="/login" className="text-primary hover:underline font-bold ml-1">Sign In</Link>
          </div>
        </div>
      </main>

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
