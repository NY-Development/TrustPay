import React, { useMemo } from 'react';
import { useVerificationHistory } from '@/src/hooks/useVerification';
import { useSubscriptionStatus } from '@/src/hooks/useSubscription';
import { Link } from 'react-router-dom';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";

import {
  type ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

const COLORS = ["#004bca", "#7c3aed", "#06b6d4", "#10b981", "#f59e0b", "#ef4444"];

const chartConfig = {
  volume: { label: "Verifications", color: "#004bca" },
} satisfies ChartConfig;

export default function DashboardPage() {
  const { data: subStatus } = useSubscriptionStatus();
  const { data, isLoading } = useVerificationHistory({ limit: 50 });
  
  const allVerifications = data?.pages?.flatMap(page => page.data) || [];
  const verifications = allVerifications.slice(0, 5);

  const computed = useMemo(() => {
    if (allVerifications.length === 0) return null;
    const total = allVerifications.length;
    const completed = allVerifications.filter((v: any) => v.status === 'completed').length;
    const successRate = total > 0 ? ((completed / total) * 100).toFixed(1) : '0';
    
    const dailyCounts: Record<string, number> = {};
    const providerCounts: Record<string, number> = {};
    
    allVerifications.forEach((v: any) => {
      const day = new Date(v.createdAt).toLocaleDateString('en-US', { weekday: 'short' });
      dailyCounts[day] = (dailyCounts[day] || 0) + 1;
      const provider = (v.provider || "Unknown").toUpperCase();
      providerCounts[provider] = (providerCounts[provider] || 0) + 1;
    });

    return { 
      total, 
      successRate, 
      lineData: Object.entries(dailyCounts).map(([date, volume]) => ({ date, volume })),
      pieData: Object.entries(providerCounts).map(([provider, value]) => ({ provider, value }))
    };
  }, [allVerifications]);

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
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
        {[
          { label: "Terminal Plan", value: subStatus?.data?.subscription?.status === 'active' ? 'Premium active' : 'Trial package', icon: "card_membership" },
          { label: "Remaining Trial", value: subStatus?.data?.subsAccessTrialExpiresAt ? '5 Days' : 'Unlimited', icon: "hourglass_empty" },
          { label: "Success Rate", value: computed ? `${computed.successRate}%` : '—', icon: "trending_up" }
        ].map((stat, i) => (
          <div key={i} className="bg-white dark:bg-[#131b2e] border border-[#c2c6d9]/30 rounded-2xl p-6 shadow-xs">
            <span className="text-[#54647a] dark:text-[#c2c6d9] text-xs font-semibold uppercase tracking-wider block">{stat.label}</span>
            <div className="mt-3 flex items-center justify-between">
              <span className="text-2xl font-bold text-[#131b2e] dark:text-white">{stat.value}</span>
              <span className="material-symbols-outlined text-[#004bca]">{stat.icon}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Area Chart: Volume */}
        <div className="bg-white dark:bg-[#131b2e] border border-border/60 rounded-2xl p-6 shadow-xs">
          <h3 className="font-bold text-lg mb-1">Check volume history</h3>
          <p className="text-xs text-muted-foreground mb-6">Daily reference verification requests</p>
          <ChartContainer config={chartConfig} className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={computed?.lineData ?? []}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="date" />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Area type="monotone" dataKey="volume" stroke="#004bca" fill="#004bca" fillOpacity={0.2} />
              </AreaChart>
            </ResponsiveContainer>
          </ChartContainer>
        </div>

        {/* Pie Chart: Distribution */}
        <div className="bg-white dark:bg-[#131b2e] border border-border/60 rounded-2xl p-6 shadow-xs">
          <h3 className="font-bold text-lg mb-1">Provider Distribution</h3>
          <p className="text-xs text-muted-foreground mb-6">Requests by gateway</p>
          <ChartContainer config={chartConfig} className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={computed?.pieData ?? []} dataKey="value" nameKey="provider" innerRadius={60} outerRadius={80}>
                  {(computed?.pieData ?? []).map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <ChartTooltip content={<ChartTooltipContent />} />
                <ChartLegend content={<ChartLegendContent />} />
              </PieChart>
            </ResponsiveContainer>
          </ChartContainer>
        </div>
      </div>

      {/* Recent Activity Table */}
      <div className="bg-white dark:bg-[#131b2e] border border-[#c2c6d9]/30 rounded-2xl p-6 shadow-xs">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-base font-bold text-[#131b2e] dark:text-white">Recent Counter Submissions</h3>
          <Link to="/dashboard/verify" className="text-xs font-bold text-[#004bca] hover:underline">View History</Link>
        </div>
        {isLoading ? (
          <div className="flex justify-center py-6"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#004bca]" /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#c2c6d9]/35 text-[#54647a] uppercase font-bold tracking-wider">
                  <th className="pb-3">Reference</th>
                  <th className="pb-3">Amount</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#c2c6d9]/20">
                {verifications.map((item: any) => (
                  <tr key={item._id} className="hover:bg-[#faf8ff]">
                    <td className="py-3 font-mono font-bold">{item.referenceNumber}</td>
                    <td className="py-3 font-bold">{item.amount} {item.currency}</td>
                    <td className="py-3"><span className="px-2 py-1 rounded-full bg-emerald-50 text-emerald-600">{item.status}</span></td>
                    <td className="py-3 text-right"><Link to={`/dashboard/verify/${item._id}`} className="text-[#004bca] font-semibold">Inspect</Link></td>
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