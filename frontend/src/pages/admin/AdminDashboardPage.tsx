import React from 'react';
import { Link } from 'react-router-dom';
import { useAdminSystemStats } from '../../hooks/useAdmin';

export default function AdminDashboardPage() {
  const { data: statsRes, isLoading, error } = useAdminSystemStats();
  const stats = statsRes?.data || {};

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-700" />
        <p className="mt-4 text-xs text-gray-500">Retrieving system diagnostics...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 p-4 rounded-xl">
        Failed to retrieve system diagnostics. Please check database connectivity.
      </div>
    );
  }

  const statCards = [
    {
      title: 'Total Users',
      value: stats.totalUsers ?? 0,
      icon: 'people',
      color: 'bg-blue-500',
      description: `${stats.totalOwners ?? 0} business owners`,
    },
    {
      title: 'Pending Licenses',
      value: stats.pendingLicenses ?? 0,
      icon: 'workspace_premium',
      color: stats.pendingLicenses > 0 ? 'bg-amber-500' : 'bg-gray-400',
      description: 'Awaiting approval decision',
      highlight: stats.pendingLicenses > 0,
      to: '/admin/licenses',
    },
    {
      title: 'Verifications Checked',
      value: stats.totalVerifications ?? 0,
      icon: 'verified_user',
      color: 'bg-green-500',
      description: `${stats.successfulVerifications ?? 0} verified successfully`,
    },
    {
      title: 'System Fraud Threats',
      value: stats.fraudThreats ?? 0,
      icon: 'gpp_maybe',
      color: stats.fraudThreats > 0 ? 'bg-red-600' : 'bg-gray-400',
      description: 'Flagged transactions',
      highlight: stats.fraudThreats > 0,
    },
    {
      title: 'Suspended Owners',
      value: stats.suspendedOwners ?? 0,
      icon: 'block',
      color: stats.suspendedOwners > 0 ? 'bg-orange-500' : 'bg-gray-400',
      description: 'Access currently revoked',
    },
    {
      title: 'Active Branches',
      value: stats.totalBranches ?? 0,
      icon: 'store',
      color: 'bg-indigo-500',
      description: 'Registered storefront branches',
    },
    {
      title: 'Failed Verifications',
      value: stats.failedVerifications ?? 0,
      icon: 'error',
      color: 'bg-rose-500',
      description: 'Provider or validation failures',
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
    { to: '/admin/licenses', label: 'License Approvals', desc: 'Approve, reject, suspend, or restore owners', icon: 'workspace_premium', badge: stats.pendingLicenses },
    { to: '/admin/users', label: 'User Registry', desc: 'Inspect & change permissions', icon: 'group' },
    { to: '/admin/verifications', label: 'Verification Logs', desc: 'Review fraud and failures', icon: 'history' },
    { to: '/admin/subscriptions', label: 'Subscriptions', desc: 'Adjust and verify billing status', icon: 'card_membership' },
    { to: '/admin/audit', label: 'Audit Trail', desc: 'Trace administrative and runtime actions', icon: 'receipt_long' },
  ];

  return (
    <div className="space-y-8 font-sans">
      <div className="flex justify-between items-center bg-gray-900 text-white p-6 rounded-2xl border border-red-500/10 shadow-lg">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Super Administration Hub</h1>
          <p className="text-gray-400 text-xs mt-1">Full-scope access to TrustPay accounts, subscriptions, and verification records.</p>
        </div>
        <span className="material-symbols-outlined text-[48px] text-red-500">security_update_warning</span>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((c) => {
          const Wrapper: any = c.to ? Link : 'div';
          return (
            <Wrapper
              key={c.title}
              {...(c.to ? { to: c.to } : {})}
              className="bg-white dark:bg-[#131b2e] border border-[#c2c6d9]/30 dark:border-white/10 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden block"
            >
              {c.highlight && (
                <div className="absolute top-0 right-0 w-16 h-16 bg-red-600/10 rounded-bl-full flex items-start justify-end p-3">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500" />
                  </span>
                </div>
              )}
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs text-gray-500 dark:text-[#c2c6d9] font-medium leading-none">{c.title}</p>
                  <h3 className="text-2xl font-bold mt-2 text-gray-900 dark:text-white">{c.value}</h3>
                </div>
                <span className={`material-symbols-outlined p-2.5 rounded-lg text-white ${c.color}`}>
                  {c.icon}
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-4">{c.description}</p>
            </Wrapper>
          );
        })}
      </div>

      {/* Administration Quick Access */}
      <div className="bg-white dark:bg-[#131b2e] border border-[#c2c6d9]/30 dark:border-white/10 rounded-2xl p-6 shadow-sm">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Administration Quick Links</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {quickLinks.map((q) => (
            <Link
              key={q.to}
              to={q.to}
              className="group p-5 rounded-xl border border-gray-200 dark:border-white/10 hover:border-red-500/40 hover:bg-red-50/40 dark:hover:bg-red-500/5 transition-all text-left flex items-start gap-4 relative"
            >
              <span className="material-symbols-outlined text-red-500 bg-red-500/10 p-3 rounded-lg group-hover:scale-110 transition-transform">
                {q.icon}
              </span>
              <div>
                <h4 className="font-semibold text-sm text-gray-800 dark:text-gray-200 group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors">
                  {q.label}
                </h4>
                <p className="text-xs text-gray-400 mt-1">{q.desc}</p>
              </div>
              {!!q.badge && (
                <span className="absolute top-4 right-4 min-w-[20px] h-5 px-1.5 rounded-full bg-amber-500 text-gray-950 text-[10px] font-bold flex items-center justify-center">
                  {q.badge}
                </span>
              )}
            </Link>
          ))}
        </div>
      </div>

      {/* Danger Zone notices */}
      <div className="bg-red-500/5 border border-red-500/25 rounded-2xl p-6">
        <div className="flex items-start gap-4">
          <span className="material-symbols-outlined text-red-500 text-[32px]">warning</span>
          <div>
            <h3 className="text-sm font-bold text-red-500 dark:text-red-400">Strict Operational Warning</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">
              Every action committed in this module is bound to your super-admin token footprint. Approving licenses,
              updating account status, or deleting records triggers an entry in the immutable system audit registry.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
