import React, { useMemo } from 'react';
import { useVerificationHistory } from '@/src/hooks/useVerification';
import { useSubscriptionStatus } from '@/src/hooks/useSubscription';
import { Link } from 'react-router-dom';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  BarElement, 
  Title, 
  Tooltip, 
  Legend 
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export default function DashboardPage() {
  const { data: subStatus } = useSubscriptionStatus();
  
  // Fetch verification history
  const { data, isLoading } = useVerificationHistory({ limit: 50 });
  const allVerifications = data?.pages?.flatMap(page => page.data) || [];
  const verifications = allVerifications.slice(0, 5);

  // Computed metrics from real data
  const computed = useMemo(() => {
    if (allVerifications.length === 0) return null;
    const total = allVerifications.length;
    const completed = allVerifications.filter((v: any) => v.status === 'completed').length;
    const successRate = total > 0 ? ((completed / total) * 100).toFixed(1) : '0';
    const totalVolume = allVerifications.reduce((a: number, v: any) => a + (v.amount || 0), 0);

    // Daily grouping for chart
    const dailyCounts: Record<string, number> = {};
    allVerifications.forEach((v: any) => {
      const day = new Date(v.createdAt).toLocaleDateString('en-US', { weekday: 'short' });
      dailyCounts[day] = (dailyCounts[day] || 0) + 1;
    });

    return { total, completed, successRate, totalVolume, dailyCounts };
  }, [allVerifications]);

  const chartData = {
    labels: computed ? Object.keys(computed.dailyCounts) : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [
      {
        label: 'Verifications Checked',
        data: computed ? Object.values(computed.dailyCounts) : [0, 0, 0, 0, 0, 0, 0],
        backgroundColor: '#004bca',
        borderRadius: 6,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
    },
    scales: {
      y: {
        grid: {
          color: 'rgba(115, 118, 135, 0.1)',
        },
      },
      x: {
        grid: {
          display: false,
        },
      },
    },
  };

  return (
    <div className="space-y-8">
      {/* Welcome banner with active subscription check banner details */}
      <div className="bg-[#004bca] rounded-3xl p-8 text-white relative overflow-hidden shadow-md">
        <div className="relative z-10 max-w-xl">
          <span className="text-[#b4c5ff] font-bold text-xs uppercase tracking-widest block mb-2">Workspace Console</span>
          <h2 className="text-3xl font-bold mb-3">Counter Desk Analytics</h2>
          <p className="text-sm text-[#b4c5ff] leading-relaxed">
            Reconcile digital payment details instantly. Ensure cashier clerks copy and paste transfer references exactly to eliminate double claims.
          </p>
        </div>
        <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none translate-x-12 translate-y-12">
          <span className="material-symbols-outlined text-[200px]">verified_user</span>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-[#131b2e] border border-[#c2c6d9]/30 rounded-2xl p-6 shadow-xs">
          <span className="text-[#54647a] dark:text-[#c2c6d9] text-xs font-semibold uppercase tracking-wider block">Terminal Plan</span>
          <div className="mt-3 flex items-center justify-between">
            <span className="text-2xl font-bold text-[#131b2e] dark:text-white capitalize">
              {subStatus?.data?.subscription?.status === 'active' ? 'Premium active' : 'Trial package'}
            </span>
            <span className="material-symbols-outlined text-[#004bca]">card_membership</span>
          </div>
        </div>

        <div className="bg-white dark:bg-[#131b2e] border border-[#c2c6d9]/30 rounded-2xl p-6 shadow-xs">
          <span className="text-[#54647a] dark:text-[#c2c6d9] text-xs font-semibold uppercase tracking-wider block">Remaining Trial Days</span>
          <div className="mt-3 flex items-center justify-between">
            <span className="text-2xl font-bold text-[#131b2e] dark:text-white">
              {subStatus?.data?.subsAccessTrialExpiresAt ? '5 Days' : 'Unlimited'}
            </span>
            <span className="material-symbols-outlined text-[#004bca]">hourglass_empty</span>
          </div>
        </div>

        <div className="bg-white dark:bg-[#131b2e] border border-[#c2c6d9]/30 rounded-2xl p-6 shadow-xs">
          <span className="text-[#54647a] dark:text-[#c2c6d9] text-xs font-semibold uppercase tracking-wider block">Success Rate</span>
          <div className="mt-3 flex items-center justify-between">
            <span className="text-2xl font-bold text-[#131b2e] dark:text-white">{computed ? `${computed.successRate}%` : '—'}</span>
            <span className="material-symbols-outlined text-green-500">trending_up</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Verification Volume Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-[#131b2e] border border-[#c2c6d9]/30 rounded-2xl p-6 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-bold text-[#131b2e] dark:text-white mb-1">Check volume history</h3>
            <p className="text-xs text-[#54647a] dark:text-[#c2c6d9] mb-6">Daily reference verification requests</p>
          </div>
          <div className="h-64 relative">
            <Bar data={chartData} options={chartOptions} />
          </div>
        </div>

        {/* Quick Action links */}
        <div className="bg-white dark:bg-[#131b2e] border border-[#c2c6d9]/30 rounded-2xl p-6 shadow-xs">
          <h3 className="text-base font-bold text-[#131b2e] dark:text-white mb-6">Cashier Quick Actions</h3>
          <div className="space-y-4">
            <Link
              to="/dashboard/verify/manual"
              className="flex items-center gap-4 p-4 rounded-xl border border-[#c2c6d9]/20 hover:bg-[#eaedff] dark:hover:bg-white/5 transition-all"
            >
              <div className="w-10 h-10 rounded-lg bg-[#004bca]/10 text-[#004bca] flex items-center justify-center">
                <span className="material-symbols-outlined">add</span>
              </div>
              <div className="text-left">
                <span className="text-sm font-bold block text-[#131b2e] dark:text-white">Verify Reference</span>
                <span className="text-[10px] text-[#54647a] dark:text-[#c2c6d9]">Manual input reference check</span>
              </div>
            </Link>

            <Link
              to="/dashboard/verify"
              className="flex items-center gap-4 p-4 rounded-xl border border-[#c2c6d9]/20 hover:bg-[#eaedff] dark:hover:bg-white/5 transition-all"
            >
              <div className="w-10 h-10 rounded-lg bg-[#004bca]/10 text-[#004bca] flex items-center justify-center">
                <span className="material-symbols-outlined">history</span>
              </div>
              <div className="text-left">
                <span className="text-sm font-bold block text-[#131b2e] dark:text-white">History Logs</span>
                <span className="text-[10px] text-[#54647a] dark:text-[#c2c6d9]">Check past verification details</span>
              </div>
            </Link>
          </div>
        </div>
      </div>

      {/* Recent Activity Table */}
      <div className="bg-white dark:bg-[#131b2e] border border-[#c2c6d9]/30 rounded-2xl p-6 shadow-xs">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-base font-bold text-[#131b2e] dark:text-white">Recent Counter Submissions</h3>
          <Link to="/dashboard/verify" className="text-xs font-bold text-[#004bca] hover:underline">View History</Link>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-6">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#004bca]" />
          </div>
        ) : verifications.length === 0 ? (
          <div className="text-center py-8 text-xs text-[#54647a]">No recent submissions. Click New Verification to begin.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#c2c6d9]/35 text-[#54647a] uppercase font-bold tracking-wider">
                  <th className="pb-3">Reference</th>
                  <th className="pb-3">Payer Name</th>
                  <th className="pb-3">Amount</th>
                  <th className="pb-3">Provider</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#c2c6d9]/20">
                {verifications.map((item: any) => (
                  <tr key={item._id || item.id} className="hover:bg-[#faf8ff] dark:hover:bg-white/5">
                    <td className="py-3 font-mono font-bold text-[#1F2937] dark:text-white">{item.referenceNumber}</td>
                    <td className="py-3 text-gray-700 dark:text-gray-300">{item.payerName || 'Unknown'}</td>
                    <td className="py-3 font-bold text-[#1F2937] dark:text-white">{item.amount} {item.currency}</td>
                    <td className="py-3 text-xs uppercase text-[#54647a]">{item.provider}</td>
                    <td className="py-3">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                        item.status === 'completed' 
                          ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400' 
                          : item.status === 'failed' 
                            ? 'bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400'
                            : 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400'
                      }`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="py-3 text-right">
                      <Link 
                        to={`/dashboard/verify/${item._id || item.id}`}
                        className="bg-[#505f76]/10 hover:bg-[#505f76]/15 hover:text-[#004bca] dark:text-[#c2c6d9] px-3 py-1.5 rounded-lg text-xs font-semibold"
                      >
                        Inspect
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
