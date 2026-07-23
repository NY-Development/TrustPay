import React from 'react';
import { Link, Outlet } from 'react-router-dom';
import { Info } from 'lucide-react';
import { usePublicStats } from '@/src/hooks/usePublicStats';
import { AuthHelpModal } from '@/src/components/AuthHelpModal';

const AUTH_HELP_SEEN_KEY = 'trustpay_auth_help_seen';

function StatItem({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <div className="font-['Geist'] text-2xl font-bold text-white">{value}</div>
      <div className="text-[11px] font-semibold uppercase tracking-wider text-white/60 mt-0.5">{label}</div>
    </div>
  );
}

export const AuthLayout: React.FC = () => {
  const { data } = usePublicStats();
  const stats = data?.data;

  const [helpOpen, setHelpOpen] = React.useState(false);

  React.useEffect(() => {
    try {
      if (!localStorage.getItem(AUTH_HELP_SEEN_KEY)) setHelpOpen(true);
    } catch {
      // localStorage unavailable (e.g. private browsing) — skip the auto-prompt.
    }
  }, []);

  const closeHelp = () => {
    setHelpOpen(false);
    try {
      localStorage.setItem(AUTH_HELP_SEEN_KEY, '1');
    } catch {
      // ignore
    }
  };

  const statItems = [
    { value: stats ? `${stats.companies}+` : '—', label: 'Businesses' },
    { value: stats ? `${stats.branches}+` : '—', label: 'Branches' },
    { value: stats ? `${stats.verifications.toLocaleString()}+` : '—', label: 'Verified' },
    { value: stats ? `${stats.successRate}%` : '—', label: 'Accuracy' },
  ];

  return (
    <div className="min-h-screen flex bg-white dark:bg-[#0b0e14] text-[#131b2e] dark:text-white antialiased">
      {/* Left: branding + live stats — hidden below lg, form takes full width there */}
      <div className="hidden lg:flex lg:w-[42%] xl:w-[38%] relative overflow-hidden bg-gradient-to-br from-[#003ec7] to-[#0032a3] text-white flex-col justify-between p-12 shrink-0">
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-white/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 -left-24 w-96 h-96 rounded-full bg-[#00d1ff]/10 blur-3xl pointer-events-none" />

        <Link to="/" className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white shadow-md overflow-hidden shrink-0">
            <img src="/logo.png" alt="Trust Pay" className="w-full h-full object-cover" style={{ objectPosition: '50% 22%' }} />
          </div>
          <span className="font-['Geist'] text-lg font-bold">Trust Pay</span>
        </Link>

        <div className="relative z-10">
          {/* Full mark, floated as a badge — plenty of room here for the whole illustration. */}
          <div className="w-20 h-20 rounded-2xl bg-white shadow-xl overflow-hidden mb-8">
            <img src="/logo.png" alt="" className="w-full h-full object-cover" style={{ objectPosition: '50% 30%' }} />
          </div>
          <h2 className="font-['Geist'] text-[32px] font-bold leading-[1.15] mb-4">
            The verification infrastructure trusted by growing businesses.
          </h2>
          <p className="text-white/70 text-sm leading-relaxed max-w-sm">
            Real-time payment verification, immutable audit trails, and multi-branch management — built for how modern merchants actually operate.
          </p>
        </div>

        <div className="relative z-10 grid grid-cols-2 gap-6 pt-8 border-t border-white/15">
          {statItems.map((item) => (
            <StatItem key={item.label} value={item.value} label={item.label} />
          ))}
        </div>
      </div>

      {/* Right: the actual auth form */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="w-full py-4 px-6 md:px-10 flex items-center justify-between border-b border-[#c2c6d9]/25 dark:border-white/10">
          <Link to="/" className="flex items-center gap-2 lg:hidden">
            <div className="w-8 h-8 rounded-lg bg-white shadow-sm overflow-hidden shrink-0">
              <img src="/logo.png" alt="Trust Pay" className="w-full h-full object-cover" style={{ objectPosition: '50% 22%' }} />
            </div>
            <span className="font-['Geist'] font-bold text-sm text-[#131b2e] dark:text-white">Trust Pay</span>
          </Link>
          <span className="hidden lg:block" />
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setHelpOpen(true)}
              aria-label="How do I sign in or register?"
              className="flex items-center gap-1.5 text-[12px] font-semibold text-[#004bca] dark:text-[#549aff] hover:underline"
            >
              <Info size={15} />
              How this works
            </button>
            <div className="hidden sm:flex items-center gap-1.5 text-[12px] font-medium text-[#54647a] dark:text-[#c2c6d9]">
              <span className="material-symbols-outlined text-[16px]">lock</span>
              Secure Environment
            </div>
          </div>
        </header>

        <main className="flex-1 flex items-center justify-center p-6 md:p-12 overflow-y-auto">
          <Outlet />
        </main>

        <footer className="w-full py-5 px-6 md:px-10 border-t border-[#c2c6d9]/20 dark:border-white/5 flex flex-col sm:flex-row justify-between items-center gap-2">
          <span className="text-[12px] text-[#54647a] dark:text-[#c2c6d9]/70">
            © {new Date().getFullYear()} Trust Pay Systems. All rights reserved.
          </span>
          <div className="flex gap-5 text-[12px] text-[#54647a] dark:text-[#c2c6d9]/70">
            <Link to="/privacy" className="hover:text-[#004bca] transition-colors">Privacy</Link>
            <Link to="/terms" className="hover:text-[#004bca] transition-colors">Terms</Link>
          </div>
        </footer>
      </div>

      <AuthHelpModal visible={helpOpen} onClose={closeHelp} />
    </div>
  );
};
