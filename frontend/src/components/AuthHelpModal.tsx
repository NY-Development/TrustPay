import React from 'react';
import { X, Building2, UserRound } from 'lucide-react';

export interface AuthHelpModalProps {
  visible: boolean;
  onClose: () => void;
}

export const AuthHelpModal: React.FC<AuthHelpModalProps> = ({ visible, onClose }) => {
  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-md bg-white dark:bg-[#131b2e] rounded-3xl border border-[#c2c6d9]/30 dark:border-white/10 shadow-2xl p-6 md:p-8 animate-in fade-in zoom-in-95 duration-200">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[#54647a] hover:text-[#131b2e] dark:hover:text-white transition-colors"
        >
          <X size={18} />
        </button>

        <h3 className="text-xl font-bold mb-1.5 text-[#131b2e] dark:text-white leading-tight">
          Signing in for the first time?
        </h3>
        <p className="text-sm text-[#54647a] dark:text-[#c2c6d9] mb-6 leading-relaxed">
          Trust Pay accounts work in two tiers — here's which one applies to you.
        </p>

        <div className="space-y-4">
          <div className="flex gap-4 p-4 rounded-2xl bg-[#faf8ff] dark:bg-[#0b0e14] border border-[#c2c6d9]/25 dark:border-white/10">
            <div className="w-10 h-10 shrink-0 rounded-xl bg-[#004bca]/10 flex items-center justify-center text-[#004bca] dark:text-[#549aff]">
              <Building2 size={20} />
            </div>
            <div>
              <p className="text-sm font-bold text-[#131b2e] dark:text-white mb-1">I'm a business owner</p>
              <p className="text-xs text-[#54647a] dark:text-[#c2c6d9] leading-relaxed">
                Tap <strong className="text-[#131b2e] dark:text-white">Register Business</strong> to set up your company and first branch. Once you're in, invite your staff from{' '}
                <strong className="text-[#131b2e] dark:text-white">Dashboard → Employees</strong> — each invite creates their own employee login.
              </p>
            </div>
          </div>

          <div className="flex gap-4 p-4 rounded-2xl bg-[#faf8ff] dark:bg-[#0b0e14] border border-[#c2c6d9]/25 dark:border-white/10">
            <div className="w-10 h-10 shrink-0 rounded-xl bg-[#004bca]/10 flex items-center justify-center text-[#004bca] dark:text-[#549aff]">
              <UserRound size={20} />
            </div>
            <div>
              <p className="text-sm font-bold text-[#131b2e] dark:text-white mb-1">I'm an employee</p>
              <p className="text-xs text-[#54647a] dark:text-[#c2c6d9] leading-relaxed">
                You don't need to register. Switch to the <strong className="text-[#131b2e] dark:text-white">Employee</strong> tab on the sign-in form and use the email and password your business owner set up for you.
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full mt-6 bg-[#004bca] hover:bg-[#0061ff] active:scale-[0.98] text-white font-bold py-3 rounded-xl transition-all cursor-pointer shadow-sm text-sm"
        >
          Got it
        </button>
      </div>
    </div>
  );
};
