import React, { useMemo } from 'react';
import { useVerificationHistory } from '@/src/hooks/useVerification';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement, 
  BarElement,
  Title, 
  Tooltip, 
  Legend, 
  ArcElement 
} from 'chart.js';
import { Line, Pie, Bar } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, ArcElement);

export default function AnalyticsPage() {
  const { data } = useVerificationHistory({ limit: 100 });
  const verifications = data?.pages?.flatMap(page => page.data) || [];

  // ── Computed Metrics ──
  const metrics = useMemo(() => {
    if (verifications.length === 0) return null;

    const total = verifications.length;
    const completed = verifications.filter((v: any) => v.status === 'completed').length;
    const failed = verifications.filter((v: any) => v.status === 'failed').length;
    const successRate = total > 0 ? ((completed / total) * 100).toFixed(1) : '0';
    const fraudCount = verifications.filter((v: any) => v.verificationSummary?.severity === 'fraud_risk').length;
    const fraudRate = total > 0 ? ((fraudCount / total) * 100).toFixed(1) : '0';

    const amounts = verifications.map((v: any) => v.amount || 0);
    const totalVolume = amounts.reduce((a: number, b: number) => a + b, 0);
    const avgAmount = total > 0 ? (totalVolume / total).toFixed(2) : '0';

    // Provider distribution
    const providerCounts: Record<string, number> = {};
    verifications.forEach((v: any) => {
      const p = (v.provider || 'unknown').toUpperCase();
      providerCounts[p] = (providerCounts[p] || 0) + 1;
    });
    const topProvider = Object.entries(providerCounts).sort((a, b) => b[1] - a[1])[0];

    // Daily volume grouping
    const dailyCounts: Record<string, number> = {};
    verifications.forEach((v: any) => {
      const day = new Date(v.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      dailyCounts[day] = (dailyCounts[day] || 0) + 1;
    });

    // Revenue by provider
    const providerRevenue: Record<string, number> = {};
    verifications.forEach((v: any) => {
      const p = (v.provider || 'unknown').toUpperCase();
      providerRevenue[p] = (providerRevenue[p] || 0) + (v.amount || 0);
    });

    return {
      total, completed, failed, successRate, fraudCount, fraudRate,
      totalVolume, avgAmount, topProvider, providerCounts,
      dailyCounts, providerRevenue,
    };
  }, [verifications]);

  // ── Chart Data ──
  const lineData = {
    labels: metrics ? Object.keys(metrics.dailyCounts) : [],
    datasets: [{
      label: 'Verifications per day',
      data: metrics ? Object.values(metrics.dailyCounts) : [],
      borderColor: '#004bca',
      backgroundColor: '#004bca20',
      tension: 0.3,
      fill: true,
    }],
  };

  const pieData = {
    labels: metrics ? Object.keys(metrics.providerCounts) : [],
    datasets: [{
      label: 'Share by Provider',
      data: metrics ? Object.values(metrics.providerCounts) : [],
      backgroundColor: ['#8E24AA', '#00E5FF', '#4CAF50', '#FFD600', '#FF5722', '#2196F3', '#E91E63'],
    }],
  };

  const barData = {
    labels: metrics ? Object.keys(metrics.providerRevenue) : [],
    datasets: [{
      label: 'Revenue (ETB)',
      data: metrics ? Object.values(metrics.providerRevenue) : [],
      backgroundColor: '#004bca',
      borderRadius: 6,
    }],
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-[#131b2e] dark:text-white">Business Analytics</h1>
        <p className="text-xs text-[#54647a]">Reconciled values, provider distributions, and system growth metrics</p>
      </div>

      {/* ── Insight Cards ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Success Rate', value: metrics ? `${metrics.successRate}%` : '—', icon: 'trending_up', color: 'text-emerald-500' },
          { label: 'Avg Transaction', value: metrics ? `${metrics.avgAmount} ETB` : '—', icon: 'payments', color: 'text-[#004bca]' },
          { label: 'Top Provider', value: metrics?.topProvider ? metrics.topProvider[0] : '—', icon: 'account_balance', color: 'text-purple-500' },
          { label: 'Fraud Detection', value: metrics ? `${metrics.fraudRate}%` : '—', icon: 'gpp_bad', color: 'text-red-500' },
        ].map((card) => (
          <div key={card.label} className="bg-white dark:bg-[#131b2e] border border-[#c2c6d9]/30 rounded-2xl p-5 shadow-xs">
            <div className="flex justify-between items-start">
              <span className="text-[10px] font-bold text-[#54647a] uppercase tracking-wider">{card.label}</span>
              <span className={`material-symbols-outlined text-[20px] ${card.color}`}>{card.icon}</span>
            </div>
            <p className="text-xl font-bold text-[#131b2e] dark:text-white mt-2">{card.value}</p>
          </div>
        ))}
      </div>

      {/* ── Charts Grid ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white dark:bg-[#131b2e] border border-[#c2c6d9]/30 rounded-2xl p-6 shadow-xs flex flex-col justify-between">
          <h3 className="text-sm font-bold text-[#131b2e] dark:text-white mb-4">Daily Verification Volume</h3>
          <div className="h-64 relative">
            <Line data={lineData} options={{ responsive: true, maintainAspectRatio: false }} />
          </div>
        </div>

        <div className="bg-white dark:bg-[#131b2e] border border-[#c2c6d9]/30 rounded-2xl p-6 shadow-xs flex flex-col justify-between">
          <h3 className="text-sm font-bold text-[#131b2e] dark:text-white mb-4">Verification share by gateway</h3>
          <div className="h-64 relative flex justify-center">
            {metrics && Object.keys(metrics.providerCounts).length > 0 ? (
              <Pie data={pieData} options={{ responsive: true, maintainAspectRatio: false }} />
            ) : (
              <div className="text-center py-12 text-xs text-[#54647a]">No gateway logs data found yet.</div>
            )}
          </div>
        </div>
      </div>

      {/* ── Revenue by Provider Bar ── */}
      <div className="bg-white dark:bg-[#131b2e] border border-[#c2c6d9]/30 rounded-2xl p-6 shadow-xs">
        <h3 className="text-sm font-bold text-[#131b2e] dark:text-white mb-4">Revenue by Provider (ETB)</h3>
        <div className="h-64 relative">
          <Bar data={barData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }} />
        </div>
      </div>

      {/* ── AI-Style Recommendation ── */}
      {metrics && (
        <div className="bg-gradient-to-r from-[#004bca]/5 to-purple-500/5 border border-[#004bca]/15 rounded-2xl p-6">
          <div className="flex items-start gap-3">
            <span className="material-symbols-outlined text-[#004bca] text-[24px] mt-0.5">auto_awesome</span>
            <div>
              <h4 className="font-bold text-sm text-[#131b2e] dark:text-white mb-2">Business Insights</h4>
              <ul className="text-xs text-[#54647a] dark:text-[#c2c6d9] space-y-1.5 leading-relaxed">
                <li>• Your success rate is <strong>{metrics.successRate}%</strong> across <strong>{metrics.total}</strong> verifications.</li>
                <li>• <strong>{metrics.topProvider?.[0]}</strong> accounts for most transactions ({metrics.topProvider?.[1]} out of {metrics.total}).</li>
                <li>• Total processed volume: <strong>{metrics.totalVolume.toLocaleString()} ETB</strong>.</li>
                {Number(metrics.fraudRate) > 0 && (
                  <li>• ⚠️ Fraud detection rate is at <strong>{metrics.fraudRate}%</strong>. Review flagged verifications.</li>
                )}
                {Number(metrics.successRate) >= 95 && (
                  <li>• ✅ Excellent transaction health. Your verification success rate is above 95%.</li>
                )}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
