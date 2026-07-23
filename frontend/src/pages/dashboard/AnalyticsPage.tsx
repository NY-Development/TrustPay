import React, { useMemo, useState, useEffect } from "react";
import type { DateRange } from "react-day-picker";
import { useVerificationHistory } from "@/src/hooks/useVerification";
import { useAI } from "@/src/ai/AIProvider";
import type { ReceiptData, InsightReport } from "@/src/ai/ai-types";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { X } from "lucide-react";

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

const COLORS = [
  "#004bca",
  "#7c3aed",
  "#06b6d4",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#6366f1",
];

const chartConfig = {
  volume: {
    label: "Verification Volume",
    color: "#004bca",
  },
  revenue: {
    label: "Revenue",
    color: "#7c3aed",
  },
} satisfies ChartConfig;

export default function AnalyticsPage() {
  const { organizer, status: aiStatus } = useAI();
  const { data } = useVerificationHistory({
    limit: 100,
  });

  const allVerifications =
    data?.pages?.flatMap((page) => page.data) || [];

  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);

  const verifications = useMemo(() => {
    if (!dateRange?.from && !dateRange?.to) return allVerifications;

    const rangeStart = dateRange?.from
      ? new Date(dateRange.from.getFullYear(), dateRange.from.getMonth(), dateRange.from.getDate(), 0, 0, 0)
      : null;
    const rangeEnd = dateRange?.to
      ? new Date(dateRange.to.getFullYear(), dateRange.to.getMonth(), dateRange.to.getDate(), 23, 59, 59, 999)
      : null;

    return allVerifications.filter((v: any) => {
      if (!v.createdAt) return false;
      const created = new Date(v.createdAt);
      if (rangeStart && created < rangeStart) return false;
      if (rangeEnd && created > rangeEnd) return false;
      return true;
    });
  }, [allVerifications, dateRange]);

  const [aiInsights, setAiInsights] = useState<InsightReport | null>(null);
  const [loadingAi, setLoadingAi] = useState(false);

  // Convert history items to unified ReceiptData for AI organizer insights
  const receiptDataItems = useMemo((): ReceiptData[] => {
    return verifications.map((item: any) => ({
      merchant: item.provider || item.bank || 'Unknown',
      date: item.paymentDate || item.createdAt || new Date().toISOString(),
      subtotal: Number(item.amount) || 0,
      tax: null,
      vat: null,
      total: Number(item.amount) || 0,
      currency: item.currency || 'ETB',
      paymentMethod: 'transfer',
      items: [],
      category: 'other',
      confidence: 1.0,
      referenceNumber: item.referenceNumber || null,
      transactionNumber: item.referenceNumber || null,
      bank: item.provider || item.bank || 'Unknown',
      senderName: item.rawResponse?.senderName || null,
      receiverName: item.rawResponse?.receiverName || null,
    }));
  }, [verifications]);

  useEffect(() => {
    if (receiptDataItems.length > 0 && aiStatus === 'ready') {
      const fetchAiInsights = async () => {
        setLoadingAi(true);
        try {
          const report = await organizer.generateInsights(receiptDataItems);
          setAiInsights(report);
        } catch (err) {
          console.warn('[AI Web Analytics Error]', err);
        } finally {
          setLoadingAi(false);
        }
      };
      fetchAiInsights();
    }
  }, [receiptDataItems, aiStatus]);


  const metrics = useMemo(() => {
    if (!verifications.length) return null;

    const total = verifications.length;

    const completed = verifications.filter(
      (v: any) => v.status === "completed"
    ).length;

    const failed = verifications.filter(
      (v: any) => v.status === "failed"
    ).length;

    const successRate =
      total > 0
        ? ((completed / total) * 100).toFixed(1)
        : "0";

    const fraudCount = verifications.filter(
      (v: any) =>
        v.verificationSummary?.severity === "fraud_risk"
    ).length;

    const fraudRate =
      total > 0
        ? ((fraudCount / total) * 100).toFixed(1)
        : "0";

    const amounts = verifications.map(
      (v: any) => v.amount || 0
    );

    const totalVolume = amounts.reduce(
      (a: number, b: number) => a + b,
      0
    );

    const avgAmount =
      total > 0
        ? (totalVolume / total).toFixed(2)
        : "0";

    const providerCounts: Record<string, number> = {};

    verifications.forEach((v: any) => {
      const provider = (
        v.provider || "Unknown"
      ).toUpperCase();

      providerCounts[provider] =
        (providerCounts[provider] || 0) + 1;
    });

    const topProvider = Object.entries(
      providerCounts
    ).sort((a, b) => b[1] - a[1])[0];

    const dailyCounts: Record<string, number> = {};

    verifications.forEach((v: any) => {
      const day = new Date(
        v.createdAt
      ).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });

      dailyCounts[day] =
        (dailyCounts[day] || 0) + 1;
    });

    const providerRevenue: Record<
      string,
      number
    > = {};

    verifications.forEach((v: any) => {
      const provider = (
        v.provider || "Unknown"
      ).toUpperCase();

      providerRevenue[provider] =
        (providerRevenue[provider] || 0) +
        (v.amount || 0);
    });

    const lineData = Object.entries(
      dailyCounts
    ).map(([date, volume]) => ({
      date,
      volume,
    }));

    const pieData = Object.entries(
      providerCounts
    ).map(([provider, value]) => ({
      provider,
      value,
    }));

    const barData = Object.entries(
      providerRevenue
    ).map(([provider, revenue]) => ({
      provider,
      revenue,
    }));

    return {
      total,
      completed,
      failed,
      successRate,
      fraudCount,
      fraudRate,
      totalVolume,
      avgAmount,
      providerCounts,
      providerRevenue,
      topProvider,
      lineData,
      pieData,
      barData,
    };
  }, [verifications]);
  return (
  <div className="space-y-8">
    {/* Header */}
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight text-[#131b2e] dark:text-white">
          Business Analytics
        </h1>

        <p className="text-sm text-[#54647a]">
          Monitor verification performance, revenue trends, provider
          distribution and fraud intelligence.
        </p>
      </div>

      <div className="flex items-center gap-2">
        <DateRangePicker
          value={dateRange}
          onChange={setDateRange}
          placeholder="Filter by date range"
          className={`rounded-full text-xs ${
            dateRange?.from
              ? 'border-[#004bca]/30 bg-[#004bca]/10 text-[#004bca] hover:bg-[#004bca]/15 hover:text-[#004bca]'
              : 'border-[#c2c6d9]/30 dark:border-white/10'
          }`}
        />
        {dateRange?.from && (
          <button
            onClick={() => setDateRange(undefined)}
            aria-label="Clear date range"
            className="flex items-center gap-1 text-[10px] font-bold text-[#54647a] hover:text-red-500 px-2 py-1.5 rounded-full transition-colors cursor-pointer"
          >
            <X size={12} />
            Clear
          </button>
        )}
      </div>
    </div>

    {/* KPI Cards */}

    <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
      {[
        {
          label: "Success Rate",
          value: metrics ? `${metrics.successRate}%` : "--",
          icon: "trending_up",
          color: "text-emerald-500",
        },

        {
          label: "Average Amount",
          value: metrics
            ? `${Number(metrics.avgAmount).toLocaleString()} ETB`
            : "--",

          icon: "payments",

          color: "text-blue-600",
        },

        {
          label: "Top Provider",

          value: metrics?.topProvider
            ? metrics.topProvider[0]
            : "--",

          icon: "account_balance",

          color: "text-purple-600",
        },

        {
          label: "Fraud Rate",

          value: metrics
            ? `${metrics.fraudRate}%`
            : "--",

          icon: "gpp_bad",

          color: "text-red-500",
        },
      ].map((card) => (
        <div
          key={card.label}
          className="
          rounded-2xl
          border
          border-border/60
          bg-white
          dark:bg-[#131b2e]
          shadow-sm
          p-6
        "
        >
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
              {card.label}
            </span>

            <span
              className={`material-symbols-outlined text-2xl ${card.color}`}
            >
              {card.icon}
            </span>
          </div>

          <div className="mt-5 text-3xl font-bold text-[#131b2e] dark:text-white">
            {card.value}
          </div>
        </div>
      ))}
    </div>

    {/* Charts */}

    <div className="grid gap-8 xl:grid-cols-2">

      {/* Area Chart */}

      <div className="rounded-2xl border border-border/60 bg-white dark:bg-[#131b2e] p-6">

        <div className="mb-6">
          <h2 className="font-semibold text-lg">
            Daily Verification Volume
          </h2>

          <p className="text-sm text-muted-foreground">
            Verification requests processed each day.
          </p>
        </div>

        <ChartContainer
          config={chartConfig}
          className="h-[320px] w-full"
        >
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={metrics?.lineData ?? []}>
              <defs>
                <linearGradient
                  id="volumeFill"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop
                    offset="5%"
                    stopColor="#004bca"
                    stopOpacity={0.4}
                  />

                  <stop
                    offset="95%"
                    stopColor="#004bca"
                    stopOpacity={0}
                  />
                </linearGradient>
              </defs>

              <CartesianGrid vertical={false} />

              <XAxis dataKey="date" />

              <YAxis />

              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent />}
              />

              <Area
                type="monotone"
                dataKey="volume"
                stroke="#004bca"
                strokeWidth={3}
                fill="url(#volumeFill)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartContainer>
      </div>

      {/* Provider Distribution */}

      <div className="rounded-2xl border border-border/60 bg-white dark:bg-[#131b2e] p-6">

        <div className="mb-6">
          <h2 className="font-semibold text-lg">
            Provider Distribution
          </h2>

          <p className="text-sm text-muted-foreground">
            Verification requests by payment gateway.
          </p>
        </div>

        <ChartContainer
          config={chartConfig}
          className="h-[320px]"
        >
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>

              <Pie
                data={metrics?.pieData ?? []}
                dataKey="value"
                nameKey="provider"
                innerRadius={70}
                outerRadius={110}
                paddingAngle={3}
              >
                {(metrics?.pieData ?? []).map((_, index) => (
                  <Cell
                    key={index}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>

              <ChartTooltip
                content={<ChartTooltipContent hideLabel />}
              />

              <ChartLegend
                content={<ChartLegendContent />}
              />
            </PieChart>
          </ResponsiveContainer>
        </ChartContainer>
      </div>
    </div>

    {/* Revenue */}

    <div className="rounded-2xl border border-border/60 bg-white dark:bg-[#131b2e] p-6">

      <div className="mb-6">
        <h2 className="font-semibold text-lg">
          Revenue by Provider
        </h2>

        <p className="text-sm text-muted-foreground">
          Total processed transaction value.
        </p>
      </div>

      <ChartContainer
        config={chartConfig}
        className="h-[340px]"
      >
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={metrics?.barData ?? []}
          >
            <CartesianGrid vertical={false} />

            <XAxis
              dataKey="provider"
            />

            <YAxis />

            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent />}
            />

            <Bar
              dataKey="revenue"
              radius={[8, 8, 0, 0]}
            >
              {(metrics?.barData ?? []).map(
                (_, index) => (
                  <Cell
                    key={index}
                    fill={
                      COLORS[index % COLORS.length]
                    }
                  />
                )
              )}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </ChartContainer>
    </div>

    {/* ───────────────── Business Insights ───────────────── */}

    {metrics && (
      <div className="rounded-2xl border border-[#004bca]/15 bg-gradient-to-r from-[#004bca]/5 via-white to-violet-500/5 dark:from-[#004bca]/10 dark:to-violet-500/10 p-6">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#004bca]/10 shrink-0">
            <span className="material-symbols-outlined text-[#004bca] text-2xl">
              auto_awesome
            </span>
          </div>

          <div className="flex-1">
            <div className="flex flex-wrap justify-between items-center gap-2 mb-2">
              <h3 className="text-lg font-semibold text-[#131b2e] dark:text-white">
                Business Insights
              </h3>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-[#004bca]/10 text-[#004bca] border border-[#004bca]/10">
                Cloud Gemma AI
              </span>
            </div>

            {loadingAi ? (
              <div className="flex items-center gap-2 text-xs text-muted-foreground py-6">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#004bca]" />
                Generating specialized revenue analysis...
              </div>
            ) : aiInsights ? (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {aiInsights.monthlySummary}
                </p>

                <div className="grid gap-4 md:grid-cols-2 mt-4">
                  <div className="rounded-xl border bg-background p-4">
                    <h4 className="font-semibold text-sm mb-2 text-[#131b2e] dark:text-white flex items-center gap-2">
                      <span className="material-symbols-outlined text-[16px] text-green-500">poll</span>
                      Verification Statistics
                    </h4>
                    <ul className="space-y-2 text-xs text-muted-foreground">
                      <li>✅ Success rate: <strong className="text-foreground">{metrics.successRate}%</strong></li>
                      <li>📦 Total verifications: <strong className="text-foreground">{metrics.total}</strong></li>
                      <li>✔ Completed: <strong className="text-foreground">{metrics.completed}</strong></li>
                      <li>✖ Failed: <strong className="text-foreground">{metrics.failed}</strong></li>
                    </ul>
                  </div>

                  <div className="rounded-xl border bg-background p-4">
                    <h4 className="font-semibold text-sm mb-2 text-[#131b2e] dark:text-white flex items-center gap-2">
                      <span className="material-symbols-outlined text-[16px] text-blue-500">payments</span>
                      Financial Breakdown
                    </h4>
                    <ul className="space-y-2 text-xs text-muted-foreground">
                      <li>💰 Total Volume: <strong className="text-foreground">{metrics.totalVolume.toLocaleString()} ETB</strong></li>
                      <li>💳 Average Transaction: <strong className="text-foreground">{Number(metrics.avgAmount).toLocaleString()} ETB</strong></li>
                      <li>🏆 Leading Provider: <strong className="text-foreground uppercase">{metrics.topProvider?.[0] ?? "--"}</strong></li>
                    </ul>
                  </div>
                </div>

                <div className="rounded-xl border bg-background p-4 mt-2">
                  <h4 className="font-semibold text-sm mb-2 text-[#131b2e] dark:text-white flex items-center gap-2">
                    <span className="material-symbols-outlined text-[16px] text-purple-500">lightbulb</span>
                    AI Operational Recommendations
                  </h4>
                  <ul className="space-y-2 text-xs text-muted-foreground">
                    {aiInsights.recommendations.map((rec, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="text-[#004bca] font-bold">•</span>
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground py-4">No insights could be computed. Continue logs check.</p>
            )}
          </div>
        </div>
      </div>
    )}

    {!metrics && (
      <div className="rounded-2xl border border-dashed py-20 text-center">
        <span className="material-symbols-outlined text-6xl text-muted-foreground">
          analytics
        </span>

        <h3 className="mt-6 text-xl font-semibold">
          No analytics available
        </h3>

        <p className="mt-2 text-muted-foreground">
          Analytics will appear once verification data has been collected.
        </p>
      </div>
    )}
  </div>
);
}