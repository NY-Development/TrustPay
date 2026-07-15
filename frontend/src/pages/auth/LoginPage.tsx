import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useLogin, useLoginOwner, useLoginEmployee } from '@/src/hooks/useAuth';
import { Eye, EyeOff } from 'lucide-react';

type LoginMode = 'owner' | 'employee';

export default function LoginPage() {
  const [mode, setMode] = useState<LoginMode>('owner');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [branchCode, setBranchCode] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const loginMutation = useLogin();
  const ownerLogin = useLoginOwner();
  const employeeLogin = useLoginEmployee();
  const navigate = useNavigate();

  const isPending = loginMutation.isPending || ownerLogin.isPending || employeeLogin.isPending;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (mode === 'owner') {
      ownerLogin.mutate(
        { email, password, branchCode: branchCode || undefined },
        {
          onSuccess: (response: any) => {
            const role = response?.data?.user?.role;
            if (role === 'SUPER_ADMIN' || role === 'ADMIN') {
              navigate('/admin/dashboard');
            } else {
              navigate('/dashboard');
            }
          },
          onError: (err: any) => {
            setErrorMsg(err.response?.data?.message || 'Owner login failed. Please verify credentials.');
          },
        }
      );
    } else {
      employeeLogin.mutate(
        { email, password },
        {
          onSuccess: () => {
            navigate('/dashboard');
          },
          onError: (err: any) => {
            setErrorMsg(err.response?.data?.message || 'Employee login failed. Please verify credentials.');
          },
        }
      );
    }
  };

  return (
    <div className="bg-[#faf8ff] dark:bg-[#0b0e14] text-[#131b2e] dark:text-white min-h-screen flex flex-col font-['Inter'] antialiased">
      
      {/* Header */}
      <header className="w-full py-4 px-8 flex justify-between items-center border-b border-[#c2c6d9]/25 bg-white dark:bg-[#131b2e] transition-colors">
        <Link to="/" className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-[#004bca] flex items-center justify-center text-white">
            <span className="material-symbols-outlined text-[20px]">shield</span>
          </div>
          <div>
            <h1 className="text-md font-bold text-[#131b2e] dark:text-white leading-tight">Trust Pay</h1>
            <p className="text-[11px] text-[#54647a] dark:text-[#c2c6d9]/70">Payment Verification Platform</p>
          </div>
        </Link>
        <div className="font-['Geist'] text-[13px] font-medium text-[#424656] dark:text-[#c2c6d9] flex items-center gap-1.5">
          <span className="material-symbols-outlined text-[16px]">lock</span>
          Secure Environment
        </div>
      </header>

      {/* Main */}
      <main className="flex-grow flex items-center justify-center py-12 px-6">
        <div className="w-full max-w-[540px] bg-white dark:bg-[#131b2e] border border-[#c2c6d9]/35 dark:border-white/10 rounded-[24px] p-8 md:p-10 shadow-xl transition-all">
          
          <div className="mb-8">
            <h2 className="text-3xl font-bold font-['Geist'] tracking-[-0.02em] text-[#131b2e] dark:text-white mb-2">Welcome Back</h2>
            <p className="text-sm text-[#54647a] dark:text-[#c2c6d9]">Sign in to access your verification terminal.</p>
          </div>

          {/* Mode Toggle */}
          <div className="flex bg-[#faf8ff] dark:bg-[#0b0e14] border border-[#c2c6d9]/30 dark:border-white/10 rounded-xl p-1 mb-8">
            <button
              type="button"
              onClick={() => { setMode('owner'); setErrorMsg(''); }}
              className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition-all ${
                mode === 'owner'
                  ? 'bg-[#004bca] text-white shadow-sm'
                  : 'text-[#54647a] dark:text-[#c2c6d9] hover:text-[#131b2e] dark:hover:text-white'
              }`}
            >
              Business Owner
            </button>
            <button
              type="button"
              onClick={() => { setMode('employee'); setErrorMsg(''); }}
              className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition-all ${
                mode === 'employee'
                  ? 'bg-[#004bca] text-white shadow-sm'
                  : 'text-[#54647a] dark:text-[#c2c6d9] hover:text-[#131b2e] dark:hover:text-white'
              }`}
            >
              Employee
            </button>
          </div>

          {errorMsg && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-[#ba1a1a]/10 border border-red-200 dark:border-red-500/20 text-[#ba1a1a] rounded-xl text-xs font-semibold">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-xs font-semibold text-[#131b2e] dark:text-[#eef0ff] uppercase tracking-wider mb-2">Email Address</label>
              <div className="relative flex items-center bg-[#faf8ff] dark:bg-[#0b0e14] border border-[#c2c6d9] dark:border-white/10 rounded-xl px-4 py-3.5 focus-within:border-[#004bca] transition-all">
                <span className="material-symbols-outlined text-[20px] text-[#54647a] dark:text-[#c2c6d9] mr-3">mail</span>
                <input
                  type="email"
                  required
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-transparent text-sm outline-none text-[#131b2e] dark:text-white placeholder:text-[#54647a]/40"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-xs font-semibold text-[#131b2e] dark:text-[#eef0ff] uppercase tracking-wider">Password</label>
                <Link to="/forgot-password" className="text-xs text-[#004bca] dark:text-[#549aff] hover:underline font-medium">Forgot Password?</Link>
              </div>
              <div className="relative flex items-center bg-[#faf8ff] dark:bg-[#0b0e14] border border-[#c2c6d9] dark:border-white/10 rounded-xl px-4 py-3.5 focus-within:border-[#004bca] transition-all">
                <span className="material-symbols-outlined text-[20px] text-[#54647a] dark:text-[#c2c6d9] mr-3">lock</span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-transparent text-sm outline-none text-[#131b2e] dark:text-white placeholder:text-[#54647a]/40"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-[#54647a] dark:text-[#c2c6d9] hover:text-[#004bca] dark:hover:text-white ml-2 transition-colors focus:outline-none"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Branch Code — Owner Only */}
            {mode === 'owner' && (
              <div>
                <label className="block text-xs font-semibold text-[#131b2e] dark:text-[#eef0ff] uppercase tracking-wider mb-2">
                  Branch Code <span className="text-[#54647a] dark:text-[#c2c6d9]/60 normal-case font-normal">(optional, defaults to first branch)</span>
                </label>
                <div className="relative flex items-center bg-[#faf8ff] dark:bg-[#0b0e14] border border-[#c2c6d9] dark:border-white/10 rounded-xl px-4 py-3.5 focus-within:border-[#004bca] transition-all">
                  <span className="material-symbols-outlined text-[20px] text-[#54647a] dark:text-[#c2c6d9] mr-3">store</span>
                  <input
                    type="text"
                    placeholder="e.g. HTL-001"
                    value={branchCode}
                    onChange={(e) => setBranchCode(e.target.value)}
                    className="w-full bg-transparent text-sm outline-none text-[#131b2e] dark:text-white placeholder:text-[#54647a]/40 uppercase"
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={isPending}
              className="w-full mt-2 bg-[#004bca] hover:bg-[#0061ff] active:scale-[0.98] disabled:bg-[#c2c6d9] dark:disabled:bg-white/10 text-white font-bold py-4 rounded-xl transition-all cursor-pointer text-sm shadow-md flex justify-center items-center gap-2 focus:outline-none focus:ring-2 focus:ring-[#004bca]/40"
            >
              {isPending ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Sign In as {mode === 'owner' ? 'Owner' : 'Employee'}</span>
                  <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                </>
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-[#c2c6d9]/25 dark:border-white/5 text-center text-xs text-[#54647a] dark:text-[#c2c6d9]">
            Do not have a business terminal?{' '}
            <Link to="/register" className="text-[#004bca] dark:text-[#549aff] hover:underline font-bold ml-1">Register Business</Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full py-6 bg-white dark:bg-[#131b2e] border-t border-[#c2c6d9]/20 dark:border-white/5 transition-colors">
        <div className="max-w-[1440px] mx-auto px-8 flex flex-col md:flex-row justify-between items-center gap-2">
          <span className="text-[13px] text-[#424656] dark:text-[#c2c6d9]/70">
            © 2026 Trust Pay Systems. All rights reserved.
          </span>
          <div className="flex gap-6 text-[13px] text-[#424656] dark:text-[#c2c6d9]/70">
            <a className="hover:text-[#004bca] transition-colors" href="#">System Guidelines</a>
            <a className="hover:text-[#004bca] transition-colors" href="#">Privacy Framework</a>
          </div>
        </div>
      </footer>
    </div>
  );
}