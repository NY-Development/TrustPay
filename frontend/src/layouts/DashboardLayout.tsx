import React, { useState, useEffect } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

export const DashboardLayout: React.FC = () => {
  const { user, logout } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();

  // Load and persist sidebar collapsed state
  const [collapsed, setCollapsed] = useState<boolean>(() => {
    const saved = localStorage.getItem('sidebar_collapsed');
    return saved === 'true';
  });

  useEffect(() => {
    localStorage.setItem('sidebar_collapsed', String(collapsed));
  }, [collapsed]);

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
    { to: '/dashboard/pricing', label: 'Pricing', icon: 'money' },
  ];

  return (
    <div className="min-h-screen flex bg-[#faf8ff] dark:bg-[#0b0e14] text-[#131b2e] dark:text-[#eef0ff]">
      {/* Sidebar navigation */}
      <aside className={`fixed left-0 top-0 h-full bg-[#283044] dark:bg-[#0b0e14] text-[#b4c5ff] flex flex-col py-6 px-4 z-50 border-r border-[#c2c6d9]/10 transition-all duration-300 ${
        collapsed ? 'w-20' : 'w-64'
      }`}>
        <div className="mb-8 px-2 flex items-center justify-between">
          <div className="flex items-center gap-3 overflow-hidden">
            <span className="material-symbols-outlined text-[32px] text-white shrink-0">shield</span>
            {!collapsed && (
              <div className="transition-opacity duration-300">
                <h1 className="text-lg font-bold text-white leading-tight whitespace-nowrap">VeriPay Admin</h1>
                <p className="text-xs text-[#b7c8e1]/80 max-w-[150px] truncate">{user?.role || 'Enterprise Tier'}</p>
              </div>
            )}
          </div>
        </div>

        {/* New Verification Quick Action button */}
        <div className="mb-4">
          <Link
            to="/dashboard/verify/manual"
            className={`w-full bg-[#004bca] hover:bg-[#0061ff] text-white text-sm font-semibold rounded-lg flex items-center justify-center gap-2 transition-all shadow-sm ${
              collapsed ? 'p-2.5 h-10 w-10 mx-auto rounded-full' : 'py-2.5 px-4'
            }`}
            title="New Verification"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            {!collapsed && <span>New Verification</span>}
          </Link>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto">
          {navLinks.map((link) => {
            const isActive = location.pathname === link.to || (link.to !== '/dashboard' && location.pathname.startsWith(link.to));
            return (
              <Link
                key={link.to}
                to={link.to}
                className={`flex items-center gap-3 rounded-lg py-2.5 transition-colors hover:bg-white/10 ${
                  collapsed ? 'justify-center px-1' : 'px-4'
                } ${
                  isActive ? 'bg-[#004bca] text-white' : 'text-[#b7c8e1]/90'
                }`}
                title={collapsed ? link.label : undefined}
              >
                <span className="material-symbols-outlined shrink-0">{link.icon}</span>
                {!collapsed && <span className="text-sm font-medium tracking-wide whitespace-nowrap truncate">{link.label}</span>}
              </Link>
            );
          })}

          {/* Super Admin Panel Link in Sidebar if authorized */}
          {user?.role === 'SUPER_ADMIN' && (
            <Link
              to="/admin/dashboard"
              className={`flex items-center gap-3 rounded-lg py-2.5 transition-colors hover:bg-red-950/20 text-red-400 hover:text-red-300 border border-red-500/20 bg-red-900/5 ${
                collapsed ? 'justify-center px-1' : 'px-4 justify-start'
              }`}
              title={collapsed ? 'Super Admin Panel' : undefined}
            >
              <span className="material-symbols-outlined shrink-0 text-red-500">lock_open</span>
              {!collapsed && <span className="text-sm font-semibold tracking-wide whitespace-nowrap truncate">Super Admin Panel</span>}
            </Link>
          )}
        </nav>

        <div className="mt-auto pt-6 border-t border-white/10 space-y-1">
          <button
            onClick={handleLogout}
            className={`w-full flex items-center gap-3 text-red-400 hover:text-red-300 hover:bg-white/5 rounded-lg py-2.5 text-sm font-medium transition-colors cursor-pointer ${
              collapsed ? 'justify-center px-1' : 'px-4'
            }`}
            title={collapsed ? 'Sign Out' : undefined}
          >
            <span className="material-symbols-outlined shrink-0">logout</span>
            {!collapsed && <span>Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* Main content body */}
      <div className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ${
        collapsed ? 'ml-20' : 'ml-64'
      }`}>
        {/* Top Header navbar */}
        <header className="sticky top-0 w-full z-40 bg-white dark:bg-[#131b2e] border-b border-[#c2c6d9]/30 flex justify-between items-center px-8 h-16 shadow-xs">
          <div className="flex items-center gap-4">
            {/* Collapse toggle button */}
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="hover:bg-[#eaedff] dark:hover:bg-white/10 p-2 rounded-full flex items-center justify-center transition-colors cursor-pointer text-[#131b2e] dark:text-white"
              title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
            >
              <span className="material-symbols-outlined">
                {collapsed ? 'menu' : 'menu_open'}
              </span>
            </button>
            
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
