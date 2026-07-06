import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useLogin } from '@/src/hooks/useAuth';
import { Eye, EyeOff} from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const loginMutation = useLogin();
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    loginMutation.mutate(
      { email, password },
      {
        onSuccess: () => {
          navigate('/dashboard');
        },
        onError: (err: any) => {
          setErrorMsg(err.response?.data?.message || err.message || 'Login failed. Please verify credentials.');
        },
      }
    );
  };

  return (
    <div className="bg-white dark:bg-[#131b2e] border border-[#c2c6d9]/35 rounded-[32px] p-8 md:p-10 shadow-lg relative overflow-hidden">
      {/* Brand logo details */}
      <Link to='/' className="flex items-center gap-3 mb-8">
        <span className="material-symbols-outlined text-[32px] text-[#004bca]">shield</span>
        <div>
          <h1 className="text-lg font-bold text-[#131b2e] dark:text-white leading-tight">VeriPay Admin</h1>
          <p className="text-xs text-[#54647a]">Access verification terminal</p>
        </div>
      </Link>

      <h2 className="text-2xl font-bold font-headline-sm text-[#131b2e] dark:text-white mb-6">Welcome Back</h2>

      {errorMsg && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-[#ba1a1a]/10 border border-red-200 dark:border-red-505/20 text-[#ba1a1a] rounded-xl text-xs font-semibold">
          {errorMsg}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-xs font-semibold text-[#131b2e] dark:text-[#eef0ff] uppercase tracking-wider mb-2">Email Address</label>
          <div className="relative flex items-center bg-[#faf8ff] dark:bg-[#0b0e14] border border-[#c2c6d9] dark:border-white/10 rounded-xl px-4 py-3">
            <span className="material-symbols-outlined text-[20px] text-[#54647a] mr-3">mail</span>
            <input
              type="email"
              required
              placeholder="name@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-transparent text-sm outline-none text-[#131b2e] dark:text-white"
            />
          </div>
        </div>

        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="block text-xs font-semibold text-[#131b2e] dark:text-[#eef0ff] uppercase tracking-wider">Password</label>
            <Link to="/forgot-password" className="text-xs text-[#004bca] hover:underline font-medium">Forgot Password?</Link>
          </div>
          <div className="relative flex items-center bg-[#faf8ff] dark:bg-[#0b0e14] border border-[#c2c6d9] dark:border-white/10 rounded-xl px-4 py-3">
            <span className="material-symbols-outlined text-[20px] text-[#54647a] mr-3">lock</span>
            <input
              type={showPassword ? 'text' : 'password'}
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-transparent text-sm outline-none text-[#131b2e] dark:text-white"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="text-[#54647a] hover:text-[#004bca]"
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loginMutation.isPending}
          className="w-full mt-2 bg-[#004bca] hover:bg-[#0061ff] active:scale-95 text-white font-bold py-3.5 rounded-xl transition-all cursor-pointer text-sm shadow-md flex justify-center items-center gap-2"
        >
          {loginMutation.isPending ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <span>Sign In</span>
              <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
            </>
          )}
        </button>
      </form>

      <div className="mt-8 text-center text-xs text-[#54647a] dark:text-[#c2c6d9]">
        Do not have a business terminal?{' '}
        <Link to="/register" className="text-[#004bca] hover:underline font-bold">Register Business</Link>
      </div>
    </div>
  );
}
