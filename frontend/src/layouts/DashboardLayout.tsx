import React from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

export const DashboardLayout: React.FC = () => {
  const { user, logout } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navLinks = [
    { to: '/dashboard', label: 'Overview', icon: 'dashboard' },
    { to: '/dashboard/verify', label: 'Verification', icon: 'verified_user' },
    { to: '/dashboard/audit', label: 'Audit Logs', icon: 'assignment' },
    { to: '/dashboard/analytics', label: 'Analytics', icon: 'monitoring' },
    { to: '/dashboard/notifications', label: 'Notifications', icon: 'notifications' },
    { to: '/dashboard/export', label: 'Export Center', icon: 'output' },
    { to: '/dashboard/profile', label: 'Profile Settings', icon: 'settings' },
  ];

  return (
    <div className="min-h-screen flex bg-[#faf8ff] dark:bg-[#0b0e14] text-[#131b2e] dark:text-[#eef0ff]">
      {/* Sidebar navigation */}
      <aside className="fixed left-0 top-0 h-full w-64 bg-[#283044] dark:bg-[#0b0e14] text-[#b4c5ff] dark:text-[#b4c5ff] flex flex-col py-6 px-4 z-50 border-r border-[#c2c6d9]/10">
        <div className="mb-8 px-2">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-[32px] text-white">shield</span>
            <div>
              <h1 className="text-lg font-bold text-white leading-tight">VeriPay Admin</h1>
              <p className="text-xs text-[#b7c8e1]/80">{user?.role || 'Enterprise Tier'}</p>
            </div>
          </div>
          <Link
            to="/dashboard/verify/manual"
            className="mt-6 w-full bg-[#004bca] hover:bg-[#0061ff] text-white text-sm font-semibold py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors shadow-sm"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            New Verification
          </Link>
        </div>

        <nav className="flex-1 space-y-1">
          {navLinks.map((link) => {
            const isActive = location.pathname === link.to || (link.to !== '/dashboard' && location.pathname.startsWith(link.to));
            return (
              <Link
                key={link.to}
                to={link.to}
                className={`flex items-center gap-3 rounded-lg px-4 py-2.5 cursor-pointer text-sm font-medium transition-colors hover:bg-white/10 ${
                  isActive ? 'bg-[#004bca] text-white' : 'text-[#b7c8e1]/90'
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
        <header className="sticky top-0 w-full z-40 bg-white dark:bg-[#131b2e] border-b border-[#c2c6d9]/30 flex justify-between items-center px-8 h-16 shadow-xs">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-bold font-headline-md text-[#131b2e] dark:text-white capitalize">
              {location.pathname.split('/').pop() || 'Overview'}
            </h2>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-4">
              <Link
                to="/dashboard/notifications"
                className="hover:bg-[#eaedff] dark:hover:bg-white/10 p-2 rounded-full flex items-center justify-center transition-colors relative"
              >
                <span className="material-symbols-outlined">notifications</span>
              </Link>
              <div className="h-8 w-px bg-[#c2c6d9]/50 mx-1"></div>
              <div className="flex items-center gap-3 pl-1">
                <div className="w-8 h-8 rounded-full bg-[#004bca] text-white flex items-center justify-center font-bold text-xs uppercase shadow-xs">
                  {user?.name?.slice(0, 2) || 'AD'}
                </div>
                <div className="hidden md:flex flex-col text-left">
                  <span className="text-sm font-semibold text-[#131b2e] dark:text-[#eef0ff]">{user?.name || 'Administrator'}</span>
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
