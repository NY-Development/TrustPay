import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColorScheme } from 'nativewind';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useVerificationHistory } from '@/src/hooks/useVerification';
import { format, parseISO } from 'date-fns';

export default function Insights() {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const themePrimary = isDark ? '#3b82f6' : '#003ec7';

  const { data: historyRes, isLoading, refetch } = useVerificationHistory();
  const history = historyRes?.data || [];

  // Analytical derivations
  const analytics = React.useMemo(() => {
    // 1. Peak Hour calculation
    const hourCounts: Record<number, number> = {};
    // 2. Risk analysis (frauds & duplicates count by provider)
    const providerRisks: Record<string, { total: number; bad: number }> = {};
    // 3. Provider Share distribution
    const providerShares: Record<string, number> = {};

    let totalSuccess = 0;
    let totalSecIssues = 0;

    history.forEach((record) => {
      // Hour extract
      try {
        const date = record.paymentDate ? new Date(record.paymentDate) : new Date(record.createdAt);
        const hour = date.getHours();
        hourCounts[hour] = (hourCounts[hour] || 0) + 1;
      } catch (e) {}

      // Provider parsing
      const provider = (record.provider || 'unknown').toLowerCase();
      providerShares[provider] = (providerShares[provider] || 0) + 1;

      // Risk profiling
      if (!providerRisks[provider]) {
        providerRisks[provider] = { total: 0, bad: 0 };
      }
      providerRisks[provider].total++;

      const isFraud = record.verificationSummary?.severity === 'fraud_risk';
      const isDuplicate = record.verificationSummary?.severity === 'duplicate' || 
                          (record.rawResponse?.confirmationHistory && 
                            (record.rawResponse.confirmationHistory.confirmationCount > 1 || 
                             record.rawResponse.confirmationHistory.confirmedBefore === true));

      if (isFraud || isDuplicate) {
        providerRisks[provider].bad++;
        totalSecIssues++;
      }

      if (record.verified === true && record.status === 'completed') {
        totalSuccess++;
      }
    });

    // Find peak hour
    let peakHour = -1;
    let peakCount = 0;
    Object.entries(hourCounts).forEach(([h, count]) => {
      if (count > peakCount) {
        peakCount = count;
        peakHour = parseInt(h);
      }
    });

    // Peak hour string formatter
    let peakHourStr = 'No data';
    if (peakHour !== -1) {
      const start = peakHour;
      const end = (peakHour + 1) % 24;
      const formatTime = (h: number) => {
        const ampm = h >= 12 ? 'PM' : 'AM';
        const displayH = h % 12 === 0 ? 12 : h % 12;
        return `${displayH} ${ampm}`;
      };
      peakHourStr = `${formatTime(start)} - ${formatTime(end)}`;
    }

    // Determine highest risk provider
    let worstProvider = 'None';
    let maxRiskRate = 0;
    Object.entries(providerRisks).forEach(([p, stats]) => {
      const rate = stats.bad / stats.total;
      if (rate > maxRiskRate && stats.bad > 0) {
        maxRiskRate = rate;
        worstProvider = p;
      }
    });

    // Determine highest share provider
    let topProvider = 'None';
    let maxShare = 0;
    Object.entries(providerShares).forEach(([p, count]) => {
      if (count > maxShare) {
        maxShare = count;
        topProvider = p;
      }
    });

    // Compile dynamic smart suggestions list
    const suggestions: Array<{ title: string; desc: string; type: 'info' | 'warning' | 'security' }> = [];

    if (peakHour !== -1) {
      suggestions.push({
        title: 'High Volume Staffing',
        desc: `Verification counts surge around ${peakHourStr}. Ensure front-desk checkout staff are active during this hour range.`,
        type: 'info',
      });
    }

    if (worstProvider !== 'None') {
      suggestions.push({
        title: `Replay / Fraud Risk on ${worstProvider.toUpperCase()}`,
        desc: `About ${Math.round(maxRiskRate * 100)}% of transactions sent from ${worstProvider.toUpperCase()} flagged warnings. Remind staff to strictly inspect transaction dates.`,
        type: 'security',
      });
    } else if (history.length > 0) {
      suggestions.push({
        title: 'Clean Security Profile',
        desc: 'All recent verification transactions matched and settled safely with no replay attacks detected.',
        type: 'info',
      });
    }

    if (topProvider !== 'None') {
      suggestions.push({
        title: `Maximize ${topProvider.toUpperCase()} Channels`,
        desc: `${topProvider.toUpperCase()} is your most dominant customer settlement provider. Perform weekly checkout reconciliations to maximize cache rates.`,
        type: 'info',
      });
    }

    if (history.length === 0) {
      suggestions.push({
        title: 'Awaiting Audit Data',
        desc: 'Once transactional verification history accumulates, tailored business suggestions will automatically compile here.',
        type: 'info',
      });
    }

    return {
      peakHourStr,
      worstProvider,
      topProvider,
      maxRiskRate,
      suggestions,
      providerShares,
    };
  }, [history]);

  return (
    <View className="flex-1 bg-background">
      <SafeAreaView className="flex-1" edges={['top']}>
        {/* Header */}
        <View className="px-6 py-4 flex-row items-center justify-between bg-card border-b border-border">
          <View className="flex-row items-center">
            <TouchableOpacity onPress={() => router.back()} className="mr-3 p-1">
              <Ionicons name="chevron-back" size={24} color={isDark ? 'white' : 'black'} />
            </TouchableOpacity>
            <Text className="text-foreground text-2xl font-bold">Business Insights</Text>
          </View>
          <TouchableOpacity
            onPress={() => refetch()}
            className="w-10 h-10 rounded-xl bg-muted items-center justify-center border border-border"
          >
            <Ionicons name="refresh" size={18} color={isDark ? 'white' : 'black'} />
          </TouchableOpacity>
        </View>

        <ScrollView
          className="flex-1 px-6 pt-6"
          contentContainerStyle={{ paddingBottom: 60 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isLoading}
              onRefresh={refetch}
              tintColor={themePrimary}
            />
          }
        >
          {/* Key Stat Items Cards */}
          <Text className="text-foreground font-bold text-lg mb-3">Key Metrics</Text>
          
          <View className="flex-row flex-wrap justify-between mb-6">
            {/* Peak Hour Card */}
            <View className="w-[48%] bg-card border border-border rounded-3xl p-5 mb-4 shadow-sm">
              <View className="bg-primary/10 w-10 h-10 rounded-xl items-center justify-center mb-3">
                <Ionicons name="time" size={20} color={themePrimary} />
              </View>
              <Text className="text-muted-foreground text-xs font-semibold uppercase tracking-wider mb-1">Peak hour</Text>
              <Text className="text-foreground text-base font-bold flex-wrap">{analytics.peakHourStr}</Text>
            </View>

            {/* Popular Bank Card */}
            <View className="w-[48%] bg-card border border-border rounded-3xl p-5 mb-4 shadow-sm">
              <View className="bg-green-500/10 w-10 h-10 rounded-xl items-center justify-center mb-3">
                <Ionicons name="business" size={20} color="#22c55e" />
              </View>
              <Text className="text-muted-foreground text-xs font-semibold uppercase tracking-wider mb-1">Top Channel</Text>
              <Text className="text-foreground text-base font-bold uppercase">{analytics.topProvider}</Text>
            </View>

            {/* Fraud/Warn Hotspot Card */}
            <View className="w-full bg-card border border-border rounded-3xl p-5 shadow-sm">
              <View className="flex-row items-center justify-between mb-3">
                <View className="flex-row items-center">
                  <View className="bg-red-500/10 w-10 h-10 rounded-xl items-center justify-center mr-3">
                    <Ionicons name="shield-half-outline" size={20} color="#ef4444" />
                  </View>
                  <View>
                    <Text className="text-muted-foreground text-xs font-semibold uppercase tracking-wider">Risk Focus Hotspot</Text>
                    <Text className="text-foreground font-bold text-base uppercase mt-0.5">{analytics.worstProvider}</Text>
                  </View>
                </View>
                {analytics.worstProvider !== 'None' && (
                  <View className="bg-red-500/10 px-3 py-1 rounded-full">
                    <Text className="text-red-500 text-xs font-bold">{Math.round(analytics.maxRiskRate * 100)}% Alert Rate</Text>
                  </View>
                )}
              </View>
            </View>
          </View>

          {/* Core Suggestions Section */}
          <Text className="text-foreground font-bold text-lg mb-3">Recommendations & Suggestions</Text>

          <View className="space-y-4 gap-4">
            {analytics.suggestions.map((sug, i) => (
              <View
                key={i}
                className={`bg-card border rounded-3xl p-5 shadow-sm flex-row items-start ${
                  sug.type === 'security' ? 'border-red-500/20 bg-red-500/[0.02]' : 'border-border'
                }`}
              >
                <View className={`p-2.5 rounded-xl mr-4 ${
                  sug.type === 'security'
                    ? 'bg-red-500/10'
                    : 'bg-primary/10'
                }`}>
                  <Ionicons
                    name={sug.type === 'security' ? 'shield-outline' : 'bulb-outline'}
                    size={22}
                    color={sug.type === 'security' ? '#ef4444' : themePrimary}
                  />
                </View>
                <View className="flex-1">
                  <Text className="text-foreground font-bold text-base">{sug.title}</Text>
                  <Text className="text-muted-foreground text-sm leading-6 mt-1">{sug.desc}</Text>
                </View>
              </View>
            ))}
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
