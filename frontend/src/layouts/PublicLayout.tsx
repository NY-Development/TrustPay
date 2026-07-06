import React from 'react';
import { Link, Outlet, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

export const PublicLayout: React.FC = () => {
  const { isAuthenticated, logout } = useAuthStore();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col bg-[#faf8ff] dark:bg-[#0b0e14]">
      {/* TopNavBar Shared Component */}
      <nav className="fixed top-0 w-full z-50 bg-[#faf8ff]/80 dark:bg-[#0b0e14]/80 backdrop-blur-md border-b border-[#c2c6d9]/30 shadow-sm">
        <div className="flex justify-between items-center px-6 py-4 max-w-7xl mx-auto">
          <div className="flex items-center gap-6">
            <Link to="/" className="text-xl font-bold text-[#004bca] dark:text-[#b4c5ff] hover:opacity-90">
              VeriPay
            </Link>
            <div className="hidden md:flex gap-6 text-sm font-medium">
              <Link to="/features" className="text-[#424656] dark:text-[#c2c6d9] hover:text-[#004bca] transition-colors">
                Platform
              </Link>
              <Link to="/pricing" className="text-[#424656] dark:text-[#c2c6d9] hover:text-[#004bca] transition-colors">
                Pricing
              </Link>
              <Link to="/about" className="text-[#424656] dark:text-[#c2c6d9] hover:text-[#004bca] transition-colors">
                About Us
              </Link>
              <Link to="/contact" className="text-[#424656] dark:text-[#c2c6d9] hover:text-[#004bca] transition-colors">
                Contact
              </Link>
            </div>
          </div>
          
          <div className="flex items-center gap-4 text-sm font-medium">
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
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-grow pt-16">
        <Outlet />
      </main>

      {/* Shared Footer component from designs */}
      <footer className="w-full py-8 bg-white dark:bg-[#0b0e14] border-t border-[#c2c6d9]/35 mt-auto">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="flex flex-col gap-2">
            <span className="font-bold text-[#131b2e] dark:text-white text-lg">VeriPay</span>
            <span className="text-xs text-[#54647a]">Scale your verification infrastructure.</span>
          </div>
          <div className="flex flex-col gap-2 text-sm">
            <Link to="/legal" className="text-[#54647a] hover:text-[#004bca]">Privacy Policy</Link>
            <Link to="/legal" className="text-[#54647a] hover:text-[#004bca]">Terms of Service</Link>
          </div>
          <div className="flex flex-col gap-2 text-sm">
            <Link to="/features" className="text-[#54647a] hover:text-[#004bca]">Security</Link>
            <Link to="/pricing" className="text-[#54647a] hover:text-[#004bca]">Pricing Plans</Link>
          </div>
          <div className="text-sm text-[#54647a] md:text-right">
            © 2026 VeriPay Verification Systems. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};
