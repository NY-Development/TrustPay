import React, { useMemo, useState, useEffect } from 'react';
import { useVerificationHistory } from '@/src/hooks/useVerification';
import { Link } from 'react-router-dom';
import SubscriptionModal from '@/src/components/SubscriptionModal';
import {
  Area,
  AreaChart,
  CartesianGrid,
  Pie,
  PieChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Cell,
} from "recharts";

import {
  type ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { useAuthStore } from '@/src/store/authStore';
import { useSubscriptionStatus } from '@/src/hooks/useSubscription'; // Import hook[cite: 19]

const COLORS = ["#004bca", "#7c3aed", "#06b6d4", "#10b981", "#f59e0b", "#ef4444"];

const chartConfig = {
  volume: { label: "Verifications", color: "#004bca" },
} satisfies ChartConfig;

export default function DashboardPage() {
  const { data, isLoading } = useVerificationHistory({ limit: 50 });
  const { user } = useAuthStore();
  const { data: subData } = useSubscriptionStatus(); // Fetch status[cite: 19, 20]
  
  const [modalVisible, setModalVisible] = useState(false);
  const [timeLeft, setTimeLeft] = useState('');
  
  const allVerifications = data?.pages?.flatMap(page => page.data) || [];
  const verifications = allVerifications.slice(0, 5);

  // Enforce modal visibility based on trial and subscription status[cite: 20, 21]
  useEffect(() => {
    const isTrialExpired = user?.trial?.trialEndDate && new Date(user.trial.trialEndDate) < new Date();
    const isNotFullyPaid = subData?.data?.active !== true;

    if (isTrialExpired && isNotFullyPaid) {
      setModalVisible(true);
    }
  }, [user?.trial?.trialEndDate, subData]);

  // Countdown Logic
  useEffect(() => {
    if (!user?.trial?.trialEndDate) return;
    
    const interval = setInterval(() => {
      const end = new Date(user.trial!.trialEndDate!).getTime();
      const now = new Date().getTime();
      const diff = end - now;

      if (diff <= 0) {
        setTimeLeft('Expired');
        clearInterval(interval);
      } else {
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
        const minutes = Math.floor((diff / 1000 / 60) % 60);
        setTimeLeft(`${days}d ${hours}h ${minutes}m`);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [user?.trial?.trialEndDate]);

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
        {/* Terminal Plan */}
        <div className="bg-white dark:bg-[#131b2e] border border-[#c2c6d9]/30 rounded-2xl p-6 shadow-xs">
          <span className="text-[#54647a] dark:text-[#c2c6d9] text-xs font-semibold uppercase tracking-wider block">Terminal Plan</span>
          <div className="mt-3 flex items-center justify-between">
            <span className="text-2xl font-bold text-[#131b2e] dark:text-white">{subData?.data?.active ? 'Premium' : (user?.trial?.hasUsedTrial ? 'Trial Expired' : 'Trial Active')}</span>
            <span className="material-symbols-outlined text-[#004bca]">card_membership</span>
          </div>
        </div>

        {/* Remaining Trial & Clock */}
        <div className="bg-white dark:bg-[#131b2e] border border-[#c2c6d9]/30 rounded-2xl p-6 shadow-xs">
          <div className="flex justify-between items-center mb-1">
            <span className="text-[#54647a] dark:text-[#c2c6d9] text-xs font-semibold uppercase tracking-wider">Remaining Trial</span>
            <button onClick={() => setModalVisible(true)} className="text-[10px] bg-[#004bca] text-white px-2 py-1 rounded font-bold hover:bg-[#003da1]">Upgrade</button>
          </div>
          <div className="mt-1">
            <span className="text-2xl font-bold text-[#004bca]">{subData?.data?.active ? 'Active' : timeLeft}</span>
            <p className="text-[10px] text-[#54647a]">Ends: {user?.trial?.trialEndDate ? new Date(user.trial.trialEndDate).toLocaleDateString() : 'N/A'}</p>
          </div>
        </div>

        {/* Success Rate */}
        <div className="bg-white dark:bg-[#131b2e] border border-[#c2c6d9]/30 rounded-2xl p-6 shadow-xs">
          <span className="text-[#54647a] dark:text-[#c2c6d9] text-xs font-semibold uppercase tracking-wider block">Success Rate</span>
          <div className="mt-3 flex items-center justify-between">
            <span className="text-2xl font-bold text-[#131b2e] dark:text-white">{computed ? `${computed.successRate}%` : '—'}</span>
            <span className="material-symbols-outlined text-[#004bca]">trending_up</span>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
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

      {/* Subscription Modal Enforced Visibility[cite: 17, 21] */}
      <SubscriptionModal 
        visible={modalVisible} 
        canClose={subData?.data?.active === true} 
        onClose={() => setModalVisible(false)} 
        partialSubscription={subData?.data?.isPartialPayment ? subData.data.subscription : undefined}
      />
    </div>
  );
}