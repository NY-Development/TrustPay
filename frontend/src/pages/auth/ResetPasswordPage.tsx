import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { authApi } from '@/src/api/auth.api';

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const email = searchParams.get('email') || '';
  const token = searchParams.get('token') || '';
  const otp = searchParams.get('otp') || '';

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      await authApi.resetPassword({ email, otp, resetToken: token, password });
      setSuccess(true);
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || err.message || 'Failed to update passcode.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-[#131b2e] border border-[#c2c6d9]/35 rounded-[32px] p-8 md:p-10 shadow-lg relative">
      <h2 className="text-2xl font-bold font-headline-sm text-[#131b2e] dark:text-white mb-2">New Password</h2>
      <p className="text-xs text-[#54647a] dark:text-[#c2c6d9] mb-6">
        Specify your new securely locked desktop access passcode credentials.
      </p>

      {errorMsg && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-[#ba1a1a]/10 border border-red-200 dark:border-red-500/20 text-[#ba1a1a] rounded-xl text-xs font-semibold">
          {errorMsg}
        </div>
      )}

      {success ? (
        <div className="p-4 bg-green-50 dark:bg-green-500/10 text-green-600 dark:text-green-400 rounded-xl text-xs font-semibold mb-6">
          Password updated! You can now log in. Redirecting...
        </div>
      ) : (
        <form onSubmit={handleReset} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold text-[#131b2e] dark:text-[#eef0ff] uppercase tracking-wider mb-2">New Password</label>
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

          <div>
            <label className="block text-xs font-semibold text-[#131b2e] dark:text-[#eef0ff] uppercase tracking-wider mb-2">Confirm Password</label>
            <div className="relative flex items-center bg-[#faf8ff] dark:bg-[#0b0e14] border border-[#c2c6d9] dark:border-white/10 rounded-xl px-4 py-3">
              <span className="material-symbols-outlined text-[20px] text-[#54647a] mr-3">lock_reset</span>
              <input
                type="password"
                required
                placeholder="Re-enter password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full bg-transparent text-sm outline-none text-[#131b2e] dark:text-white"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#004bca] hover:bg-[#0061ff] text-white font-bold py-3.5 rounded-xl transition-all cursor-pointer text-sm shadow-md flex justify-center items-center"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <span>Reset Password</span>
            )}
          </button>
        </form>
      )}
    </div>
  );
}
