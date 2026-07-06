import React from 'react';
import { useAdminSystemStats } from '../../hooks/useAdmin';
import { Link } from 'react-router-dom';

export default function AdminDashboardPage() {
  const { data: statsRes, isLoading, error } = useAdminSystemStats();
  const stats = statsRes?.data || {};

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-700"></div>
        <p className="mt-4 text-xs text-gray-500">Retrieving system diagnostics...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-550/15 border border-red-500/20 text-red-700 p-4 rounded-xl">
        Failed to retrieve system diagnostics. Please check database connectivity.
      </div>
    );
  }

  const statCards = [
    {
      title: 'Total Users Registered',
      value: stats.totalUsers ?? 0,
      icon: 'people',
      color: 'bg-blue-500',
      description: 'Active merchant profiles',
    },
    {
      title: 'Verifications Checked',
      value: stats.totalVerifications ?? 0,
      icon: 'verified_user',
      color: 'bg-green-500',
      description: 'Manual + OCR requests',
    },
    {
      title: 'System Fraud Threats',
      value: stats.fraudThreats ?? 0,
      icon: 'gpp_maybe',
      color: stats.fraudThreats > 0 ? 'bg-red-650' : 'bg-gray-500',
      description: 'Flagged transactions',
      highlight: stats.fraudThreats > 0,
    },
    {
      title: 'Estimated Active Revenue',
      value: `${(stats.totalRevenue ?? 0).toLocaleString()} ETB`,
      icon: 'payments',
      color: 'bg-purple-500',
      description: 'Fully paid subscription total',
    },
  ];

  const quickLinks = [
    { to: '/admin/users', label: 'User Registry', desc: 'Inspect & change permissions', icon: 'group' },
    { to: '/admin/verifications', label: 'Verification Logs', desc: 'Review fraud and failures', icon: 'history' },
    { to: '/admin/subscriptions', label: 'Sub Connection', desc: 'Adjust and verify cash tiers', icon: 'card_membership' },
    { to: '/admin/audit', label: 'Audit Trail', desc: 'Trace developer & runtime inputs', icon: 'receipt_long' },
  ];

  return (
    <div className="space-y-8 font-sans">
      <div className="flex justify-between items-center bg-gray-900 text-white p-6 rounded-2xl border border-red-500/10 shadow-lg">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Super Administration Hub</h1>
          <p className="text-gray-400 text-xs mt-1">GOD-level access to TrustPay schemas, active databases, and verifications.</p>
        </div>
        <span className="material-symbols-outlined text-[48px] text-red-500">security_update_warning</span>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((c, i) => (
          <div key={i} className="bg-white dark:bg-[#131b2e] border border-[#c2c6d9]/30 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
            {c.highlight && (
              <div className="absolute top-0 right-0 w-16 h-16 bg-red-600/10 rounded-bl-full flex items-center justify-center">
                <span className="animate-ping absolute inline-flex h-3 w-3 rounded-full bg-red-500 opacity-75"></span>
              </div>
            )}
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs text-gray-500 dark:text-[#c2c6d9] font-medium leading-none">{c.title}</p>
                <h3 className="text-2xl font-bold mt-2 font-headline-md text-gray-900 dark:text-white">{c.value}</h3>
              </div>
              <span className={`material-symbols-outlined p-2.5 rounded-lg text-white ${c.color}`}>
                {c.icon}
              </span>
            </div>
            <p className="text-xs text-gray-400 dark:text-gray-400 mt-4 flex items-center gap-1">
              <span>{c.description}</span>
            </p>
          </div>
        ))}
      </div>

      {/* Administration Quick Access */}
      <div className="bg-white dark:bg-[#131b2e] border border-[#c2c6d9]/30 rounded-2xl p-6 shadow-sm">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Database Registry Quick Links</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {quickLinks.map((q, idx) => (
            <Link
              key={idx}
              to={q.to}
              className="group p-5 rounded-xl border border-gray-150 hover:border-red-500/25 dark:border-white/10 dark:hover:border-red-500/30 hover:bg-red-50/5 transition-all text-left flex items-start gap-4"
            >
              <span className="material-symbols-outlined text-red-500 bg-red-500/10 p-3 rounded-lg group-hover:scale-110 transition-transform">
                {q.icon}
              </span>
              <div>
                <h4 className="font-semibold text-sm text-gray-800 dark:text-gray-200 group-hover:text-red-650 dark:group-hover:text-red-400 transition-colors">
                  {q.label}
                </h4>
                <p className="text-xs text-gray-400 mt-1">{q.desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Danger Zone notices */}
      <div className="bg-red-950/10 border border-red-500/25 rounded-2xl p-6">
        <div className="flex items-start gap-4">
          <span className="material-symbols-outlined text-red-500 text-[32px]">warning</span>
          <div>
            <h3 className="text-sm font-bold text-red-400">Strict Operational Warning</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">
              Every action committed in this module is bound to your super-admin token footprint. Deleting records, updating account connections, or disabling users will trigger logs stored irreversibly in the system audit registry. All payment failures are dispatched directly to admin emails.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
