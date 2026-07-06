import React from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

export const AdminLayout: React.FC = () => {
  const { user, logout } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  // Restrict access on UI side just in case (already guarded in backend routes)
  if (user?.role !== 'SUPER_ADMIN') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white font-sans p-8">
        <div className="max-w-md w-full text-center space-y-6 bg-gray-800 p-8 rounded-2xl shadow-xl border border-red-500/20">
          <span className="material-symbols-outlined text-[64px] text-red-500">gpp_bad</span>
          <h2 className="text-2xl font-bold text-red-400">Access Denied</h2>
          <p className="text-gray-300 text-sm">
            This module requires Super Administrator privileges. Your current role: <strong className="text-blue-400 font-bold uppercase">{user?.role}</strong>.
          </p>
          <Link
            to="/dashboard"
            className="inline-block bg-[#004bca] hover:bg-[#0061ff] text-white text-sm font-semibold py-2.5 px-6 rounded-lg transition-colors cursor-pointer"
          >
            Return to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const adminLinks = [
    { to: '/admin/dashboard', label: 'Admin Panel', icon: 'gavel' },
    { to: '/admin/users', label: 'User Registry', icon: 'group' },
    { to: '/admin/verifications', label: 'Verifications Pool', icon: 'verified' },
    { to: '/admin/subscriptions', label: 'Subscriptions Management', icon: 'monetization_on' },
    { to: '/admin/audit', label: 'System Audit Logs', icon: 'shield' },
  ];

  return (
    <div className="min-h-screen flex bg-[#faf8ff] dark:bg-[#0b0e14] text-[#131b2e] dark:text-[#eef0ff]">
      {/* Sidebar navigation */}
      <aside className="fixed left-0 top-0 h-full w-64 bg-red-950 dark:bg-gray-950 text-[#f8fafc]/90 flex flex-col py-6 px-4 z-50 border-r border-[#c2c6d9]/10 shadow-lg">
        <div className="mb-8 px-2">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-[32px] text-red-500 animate-pulse">lock_open</span>
            <div>
              <h1 className="text-lg font-bold text-white leading-tight">TrustPay GOD Mode</h1>
              <p className="text-[10px] text-red-400 font-bold uppercase tracking-widest">{user?.name}</p>
            </div>
          </div>
          
          <Link
            to="/dashboard"
            className="mt-6 w-full bg-white/10 hover:bg-white/20 text-white text-xs font-semibold py-2 px-3 rounded-lg flex items-center justify-center gap-2 transition-colors border border-white/10"
          >
            <span className="material-symbols-outlined text-[16px]">arrow_back</span>
            Back to Client App
          </Link>
        </div>

        <nav className="flex-1 space-y-1">
          {adminLinks.map((link) => {
            const isActive = location.pathname === link.to;
            return (
              <Link
                key={link.to}
                to={link.to}
                className={`flex items-center gap-3 rounded-lg px-4 py-2.5 cursor-pointer text-sm font-medium transition-colors hover:bg-white/10 ${
                  isActive ? 'bg-red-700 text-white shadow-md border-l-4 border-red-500' : 'text-gray-300'
                }`}
              >
                <span className="material-symbols-outlined">{link.icon}</span>
                <span>{link.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto pt-6 border-t border-white/10 space-y-1">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 text-red-400 hover:text-red-300 hover:bg-white/5 rounded-lg px-4 py-2.5 cursor-pointer text-sm font-medium transition-colors"
          >
            <span className="material-symbols-outlined">logout</span>
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main content body */}
      <div className="flex-1 ml-64 flex flex-col min-h-screen">
        {/* Top Header navbar */}
        <header className="sticky top-0 w-full z-45 bg-white dark:bg-[#131b2e] border-b border-[#c2c6d9]/30 flex justify-between items-center px-8 h-16 shadow-xs">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-bold font-headline-md text-red-700 dark:text-red-400 capitalize">
              {location.pathname.split('/').pop() || 'Overview'}
            </h2>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-4">
              <span className="bg-red-900/10 text-red-500 text-xs font-semibold px-3 py-1 rounded-full border border-red-500/20">
                Super Admin Access
              </span>
              <div className="h-8 w-px bg-[#c2c6d9]/50 mx-1"></div>
              <div className="flex items-center gap-3 pl-1">
                <div className="w-8 h-8 rounded-full bg-red-700 text-white flex items-center justify-center font-bold text-xs uppercase shadow-xs">
                  SA
                </div>
                <div className="hidden md:flex flex-col text-left">
                  <span className="text-sm font-semibold text-[#131b2e] dark:text-[#eef0ff]">{user?.name}</span>
                  <span className="text-[10px] text-[#54647a] dark:text-[#c2c6d9]">{user?.email}</span>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Content canvas container */}
        <main className="flex-1 p-8 bg-[#faf8ff] dark:bg-[#0b0e14] overflow-y-auto">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};
