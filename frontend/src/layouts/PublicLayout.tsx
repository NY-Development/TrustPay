import React from 'react';
import { Link, Outlet, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X } from 'lucide-react';
import { useAuthStore } from '../store/authStore';

const NAV_LINKS = [
  { to: '/features', label: 'Platform' },
  { to: '/pricing', label: 'Pricing' },
  { to: '/about', label: 'About Us' },
  { to: '/contact', label: 'Contact' },
];

const LEGAL_LINKS = [
  { to: '/security', label: 'Security' },
  { to: '/privacy', label: 'Privacy Policy' },
  { to: '/terms', label: 'Terms of Service' },
];

export const PublicLayout: React.FC = () => {
  const { isAuthenticated, logout } = useAuthStore();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = React.useState(false);

  const closeMenu = () => setMenuOpen(false);

  return (
    <div className="min-h-screen flex flex-col bg-[#faf8ff] dark:bg-[#0b0e14]">
      {/* TopNavBar Shared Component */}
      <nav className="fixed top-0 w-full z-50 bg-[#faf8ff]/80 dark:bg-[#0b0e14]/80 backdrop-blur-md border-b border-[#c2c6d9]/30 shadow-sm">
        <div className="flex justify-between items-center px-6 py-4 max-w-7xl mx-auto">
          <div className="flex items-center gap-6">
            <Link to="/" className="flex items-center gap-2.5 hover:opacity-90 transition-opacity">
              <div className="w-8 h-8 rounded-lg bg-white shadow-sm overflow-hidden shrink-0">
                <img src="/logo.png" alt="Trust Pay" className="w-full h-full object-cover" style={{ objectPosition: '50% 22%' }} />
              </div>
              <span className="text-xl font-bold text-[#004bca] dark:text-[#b4c5ff]">Trust Pay</span>
            </Link>
            <div className="hidden md:flex gap-6 text-sm font-medium">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className="text-[#424656] dark:text-[#c2c6d9] hover:text-[#004bca] transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Desktop auth CTAs */}
          <div className="hidden md:flex items-center gap-4 text-sm font-medium">
            {isAuthenticated ? (
              <>
                <Link to="/dashboard" className="text-[#424656] hover:text-[#004bca] dark:text-[#c2c6d9] transition-colors">
                  Go to Dashboard
                </Link>
                <button
                  onClick={() => logout().then(() => navigate('/login'))}
                  className="bg-[#ba1a1a] text-white px-4 py-2 rounded hover:bg-[#ba1a1a]/95 transition-colors"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="text-[#424656] hover:text-[#004bca] dark:text-[#c2c6d9] transition-colors">
                  Sign In
                </Link>
                <Link to="/register" className="bg-[#004bca] text-white px-4 py-2 rounded hover:bg-[#0061ff] transition-colors">
                  Get Started
                </Link>
              </>
            )}
          </div>

          {/* Mobile / tablet menu trigger */}
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            aria-label="Open menu"
            className="md:hidden flex items-center justify-center w-10 h-10 rounded-lg border border-[#c2c6d9]/40 dark:border-white/10 text-[#131b2e] dark:text-white hover:bg-[#eaedff] dark:hover:bg-white/5 transition-colors"
          >
            <Menu size={20} />
          </button>
        </div>
      </nav>

      {/* Mobile / tablet nav modal */}
      <AnimatePresence>
        {menuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeMenu}
              className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm md:hidden"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 32 }}
              className="fixed top-0 right-0 z-[70] h-full w-[85%] max-w-sm bg-white dark:bg-[#0b0e14] shadow-2xl md:hidden flex flex-col"
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-[#c2c6d9]/25 dark:border-white/10">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-white shadow-sm overflow-hidden shrink-0">
                    <img src="/logo.png" alt="Trust Pay" className="w-full h-full object-cover" style={{ objectPosition: '50% 22%' }} />
                  </div>
                  <span className="text-lg font-bold text-[#004bca] dark:text-[#b4c5ff]">Trust Pay</span>
                </div>
                <button
                  type="button"
                  onClick={closeMenu}
                  aria-label="Close menu"
                  className="flex items-center justify-center w-9 h-9 rounded-lg text-[#54647a] dark:text-[#c2c6d9] hover:bg-[#eaedff] dark:hover:bg-white/5 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-6 py-6 flex flex-col gap-1">
                {NAV_LINKS.map((link) => (
                  <Link
                    key={link.to}
                    to={link.to}
                    onClick={closeMenu}
                    className="py-3 text-base font-semibold text-[#131b2e] dark:text-white hover:text-[#004bca] dark:hover:text-[#549aff] transition-colors border-b border-[#c2c6d9]/15 dark:border-white/5"
                  >
                    {link.label}
                  </Link>
                ))}

                <div className="mt-4 mb-1 text-[11px] font-bold uppercase tracking-widest text-[#54647a] dark:text-[#c2c6d9]/60">
                  Legal &amp; Trust
                </div>
                {LEGAL_LINKS.map((link) => (
                  <Link
                    key={link.to}
                    to={link.to}
                    onClick={closeMenu}
                    className="py-2.5 text-sm font-medium text-[#424656] dark:text-[#c2c6d9] hover:text-[#004bca] transition-colors"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>

              <div className="px-6 py-6 border-t border-[#c2c6d9]/25 dark:border-white/10 flex flex-col gap-3">
                {isAuthenticated ? (
                  <>
                    <Link
                      to="/dashboard"
                      onClick={closeMenu}
                      className="w-full text-center py-3 rounded-xl border border-[#c2c6d9]/40 dark:border-white/10 text-sm font-semibold text-[#131b2e] dark:text-white hover:bg-[#eaedff] dark:hover:bg-white/5 transition-colors"
                    >
                      Go to Dashboard
                    </Link>
                    <button
                      onClick={() => {
                        closeMenu();
                        logout().then(() => navigate('/login'));
                      }}
                      className="w-full py-3 rounded-xl bg-[#ba1a1a] text-white text-sm font-semibold hover:bg-[#ba1a1a]/95 transition-colors"
                    >
                      Sign Out
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      to="/login"
                      onClick={closeMenu}
                      className="w-full text-center py-3 rounded-xl border border-[#c2c6d9]/40 dark:border-white/10 text-sm font-semibold text-[#131b2e] dark:text-white hover:bg-[#eaedff] dark:hover:bg-white/5 transition-colors"
                    >
                      Sign In
                    </Link>
                    <Link
                      to="/register"
                      onClick={closeMenu}
                      className="w-full text-center py-3 rounded-xl bg-[#004bca] text-white text-sm font-semibold hover:bg-[#0061ff] transition-colors"
                    >
                      Get Started
                    </Link>
                  </>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <main className="flex-grow pt-16">
        <Outlet />
      </main>

      {/* Shared Footer component from designs */}
      <footer className="w-full py-8 bg-white dark:bg-[#0b0e14] border-t border-[#c2c6d9]/35 mt-auto">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-white shadow-sm overflow-hidden shrink-0">
                <img src="/logo.png" alt="Trust Pay" className="w-full h-full object-cover" style={{ objectPosition: '50% 22%' }} />
              </div>
              <span className="font-bold text-[#131b2e] dark:text-white text-lg">Trust Pay</span>
            </div>
            <span className="text-xs text-[#54647a]">Scale your verification infrastructure.</span>
          </div>
          <div className="flex flex-col gap-2 text-sm">
            <Link to="/privacy" className="text-[#54647a] hover:text-[#004bca]">Privacy Policy</Link>
            <Link to="/terms" className="text-[#54647a] hover:text-[#004bca]">Terms of Service</Link>
          </div>
          <div className="flex flex-col gap-2 text-sm">
            <Link to="/security" className="text-[#54647a] hover:text-[#004bca]">Security</Link>
            <Link to="/pricing" className="text-[#54647a] hover:text-[#004bca]">Pricing Plans</Link>
          </div>
          <div className="text-sm text-[#54647a] md:text-right">
            © 2026 Trust Pay Verification Systems. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};
