import React, { useMemo } from "react";
import { useVerificationHistory } from "@/src/hooks/useVerification";

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
  const { data } = useVerificationHistory({
    limit: 100,
  });

  const verifications =
    data?.pages?.flatMap((page) => page.data) || [];

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
    <div className="space-y-1">
      <h1 className="text-3xl font-bold tracking-tight text-[#131b2e] dark:text-white">
        Business Analytics
      </h1>

      <p className="text-sm text-[#54647a]">
        Monitor verification performance, revenue trends, provider
        distribution and fraud intelligence.
      </p>
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

            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#004bca]/10">
              <span className="material-symbols-outlined text-[#004bca] text-2xl">
                auto_awesome
              </span>
            </div>

            <div className="flex-1">

              <h3 className="text-lg font-semibold text-[#131b2e] dark:text-white">
                Business Insights
              </h3>

              <p className="mt-1 text-sm text-muted-foreground">
                AI-generated operational summary based on the latest
                verification activity.
              </p>

              <div className="mt-6 grid gap-4 md:grid-cols-2">

                <div className="rounded-xl border bg-background p-4">
                  <h4 className="font-medium mb-2">
                    Verification Performance
                  </h4>

                  <ul className="space-y-2 text-sm leading-relaxed text-muted-foreground">

                    <li>
                      ✅ Success rate:
                      <strong className="ml-1 text-foreground">
                        {metrics.successRate}%
                      </strong>
                    </li>

                    <li>
                      📦 Total verifications:
                      <strong className="ml-1 text-foreground">
                        {metrics.total}
                      </strong>
                    </li>

                    <li>
                      ✔ Completed:
                      <strong className="ml-1 text-foreground">
                        {metrics.completed}
                      </strong>
                    </li>

                    <li>
                      ✖ Failed:
                      <strong className="ml-1 text-foreground">
                        {metrics.failed}
                      </strong>
                    </li>

                  </ul>
                </div>

                <div className="rounded-xl border bg-background p-4">

                  <h4 className="font-medium mb-2">
                    Financial Overview
                  </h4>

                  <ul className="space-y-2 text-sm leading-relaxed text-muted-foreground">

                    <li>
                      💰 Total Volume:
                      <strong className="ml-1 text-foreground">
                        {metrics.totalVolume.toLocaleString()} ETB
                      </strong>
                    </li>

                    <li>
                      💳 Average Transaction:
                      <strong className="ml-1 text-foreground">
                        {Number(metrics.avgAmount).toLocaleString()} ETB
                      </strong>
                    </li>

                    <li>
                      🏆 Leading Provider:
                      <strong className="ml-1 text-foreground">
                        {metrics.topProvider?.[0] ?? "--"}
                      </strong>
                    </li>

                  </ul>

                </div>

                <div className="rounded-xl border bg-background p-4">

                  <h4 className="font-medium mb-2">
                    Risk Assessment
                  </h4>

                  <ul className="space-y-2 text-sm leading-relaxed text-muted-foreground">

                    <li>
                      🚨 Fraud Rate:
                      <strong className="ml-1 text-red-500">
                        {metrics.fraudRate}%
                      </strong>
                    </li>

                    <li>
                      ⚠ Flagged Verifications:
                      <strong className="ml-1 text-foreground">
                        {metrics.fraudCount}
                      </strong>
                    </li>

                    {Number(metrics.fraudRate) > 5 && (
                      <li className="text-red-500">
                        High fraud activity detected. Review verification
                        logs immediately.
                      </li>
                    )}

                    {Number(metrics.fraudRate) <= 5 && (
                      <li className="text-emerald-600">
                        Fraud indicators remain within acceptable levels.
                      </li>
                    )}

                  </ul>

                </div>

                <div className="rounded-xl border bg-background p-4">

                  <h4 className="font-medium mb-2">
                    Recommendations
                  </h4>

                  <ul className="space-y-2 text-sm leading-relaxed text-muted-foreground">

                    {Number(metrics.successRate) >= 98 && (
                      <li>
                        🚀 Excellent transaction health. Current processing
                        quality is outstanding.
                      </li>
                    )}

                    {Number(metrics.successRate) >= 95 &&
                      Number(metrics.successRate) < 98 && (
                        <li>
                          👍 Overall platform performance is very stable.
                        </li>
                      )}

                    {Number(metrics.successRate) < 95 && (
                      <li>
                        ⚠ Investigate failed verification requests to improve
                        customer experience.
                      </li>
                    )}

                    <li>
                      📈 Continue monitoring provider distribution to avoid
                      over-reliance on a single payment gateway.
                    </li>

                    <li>
                      💡 Consider enabling automated alerts for abnormal
                      fraud spikes.
                    </li>

                  </ul>

                </div>

              </div>

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