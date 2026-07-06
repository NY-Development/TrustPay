import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { authApi } from '@/src/api/auth.api';

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const emailParam = searchParams.get('email') || '';
  
  const [email, setEmail] = useState(emailParam);
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const navigate = useNavigate();

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      const response = await authApi.verifyOtp(email, otp);
      const token = response.resetToken;
      navigate(`/reset-password?email=${encodeURIComponent(email)}&token=${encodeURIComponent(token)}&otp=${encodeURIComponent(otp)}`);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || err.message || 'OTP verification failed. Double-check code.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-[#131b2e] border border-[#c2c6d9]/35 rounded-[32px] p-8 md:p-10 shadow-lg relative">
      <h2 className="text-2xl font-bold font-headline-sm text-[#131b2e] dark:text-white mb-2">Verify OTP</h2>
      <p className="text-xs text-[#54647a] dark:text-[#c2c6d9] mb-6">
        Please input the OTP confirmation code sent to your email inbox.
      </p>

      {errorMsg && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-[#ba1a1a]/10 border border-red-200 dark:border-red-500/20 text-[#ba1a1a] rounded-xl text-xs font-semibold">
          {errorMsg}
        </div>
      )}

      <form onSubmit={handleVerify} className="space-y-5">
        <div>
          <label className="block text-xs font-semibold text-[#131b2e] dark:text-[#eef0ff] uppercase tracking-wider mb-2">Email Address</label>
          <div className="relative flex items-center bg-[#faf8ff] dark:bg-[#0b0e14] border border-[#c2c6d9] dark:border-white/10 rounded-xl px-4 py-3">
            <span className="material-symbols-outlined text-[20px] text-[#54647a] mr-3">mail</span>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-transparent text-sm outline-none text-[#131b2e] dark:text-white"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-[#131b2e] dark:text-[#eef0ff] uppercase tracking-wider mb-2">Verification Code (OTP)</label>
          <div className="relative flex items-center bg-[#faf8ff] dark:bg-[#0b0e14] border border-[#c2c6d9] dark:border-white/10 rounded-xl px-4 py-3">
            <span className="material-symbols-outlined text-[20px] text-[#54647a] mr-3">password</span>
            <input
              type="text"
              required
              maxLength={6}
              placeholder="123456"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              className="w-full bg-transparent text-sm outline-none text-[#131b2e] dark:text-white font-mono tracking-widest font-bold"
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
            <span>Verify OTP</span>
          )}
        </button>
      </form>
    </div>
  );
}
