import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColorScheme } from 'nativewind';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useVerificationHistory } from '@/src/hooks/useVerification';
import { useAI } from '@/src/ai/AIProvider';
import type { ReceiptData, AuditReport } from '@/src/ai/ai-types';

type FilterPeriod = 'all' | 'today' | 'week' | 'month' | '3month' | '6month' | 'year';

interface FilterOption {
  id: FilterPeriod;
  label: string;
}

export default function Audit() {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const themePrimary = isDark ? '#3b82f6' : '#003ec7';

  const { organizer, status: aiStatus } = useAI();
  const { data: historyRes, isLoading, refetch } = useVerificationHistory();

  // Safely flatten multi-page infinite dataset chunks
  const history = useMemo(() => {
    return historyRes?.pages?.flatMap(page => page.data) || [];
  }, [historyRes]);

  // Active filter state
  const [activeFilter, setActiveFilter] = useState<FilterPeriod>('all');
  const [generatingAi, setGeneratingAi] = useState(false);
  const [aiReport, setAiReport] = useState<AuditReport | null>(null);

  const filterOptions: FilterOption[] = [
    { id: 'all', label: 'All Time' },
    { id: 'today', label: 'Today' },
    { id: 'week', label: 'Week' },
    { id: 'month', label: 'Month' },
    { id: '3month', label: '3 Months' },
    { id: '6month', label: '6 Months' },
    { id: 'year', label: 'Year' },
  ];

  // Convert history items to unified ReceiptData type
  const receiptDataItems = useMemo((): ReceiptData[] => {
    return history.map((item: any) => ({
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
  }, [history]);

  // Load AI audit when receipt data is loaded
  useEffect(() => {
    if (receiptDataItems.length > 0 && aiStatus === 'ready') {
      const getAiAudit = async () => {
        setGeneratingAi(true);
        try {
          const report = await organizer.generateAudit(receiptDataItems);
          setAiReport(report);
        } catch (err) {
          console.warn('[AI Audit Error]', err);
        } finally {
          setGeneratingAi(false);
        }
      };
      getAiAudit();
    }
  }, [receiptDataItems, aiStatus]);

  // Compute metrics with time-based filtering applied
  const metrics = useMemo(() => {
    let totalMoney = 0;
    let successCount = 0;
    let fraudCount = 0;
    let duplicateCount = 0;
    let failedCount = 0;

    const providerStats: Record<string, { totalAmount: number; verifiedCount: number; fraudCount: number }> = {};
    const now = new Date();

    const filteredHistory = history.filter((record) => {
      if (activeFilter === 'all') return true;

      const recordDateStr = record.createdAt;
      if (!recordDateStr) return false;

      const recordDate = new Date(recordDateStr);
      const diffTime = now.getTime() - recordDate.getTime();
      const diffDays = diffTime / (1000 * 60 * 60 * 24);

      switch (activeFilter) {
        case 'today':
          return recordDate.toDateString() === now.toDateString();
        case 'week':
          return diffDays <= 7;
        case 'month':
          return diffDays <= 30;
        case '3month':
          return diffDays <= 90;
        case '6month':
          return diffDays <= 180;
        case 'year':
          return diffDays <= 365;
        default:
          return true;
      }
    });

    filteredHistory.forEach((record) => {
      const provider = (record.provider || 'unknown').toLowerCase();
      if (!providerStats[provider]) {
        providerStats[provider] = { totalAmount: 0, verifiedCount: 0, fraudCount: 0 };
      }

      const isFailed = record.verified === false || record.processingStatus === 'failed' || record.verificationSummary?.severity === 'error';
      const isFraud = record.verificationSummary?.severity === 'fraud_risk';
      const isDuplicate = record.verificationSummary?.severity === 'duplicate' ||
                          (record.rawResponse?.confirmationHistory &&
                            (record.rawResponse.confirmationHistory.confirmationCount > 1 ||
                             record.rawResponse.confirmationHistory.confirmedBefore === true));

      const isSuccess = record.verified === true && record.processingStatus !== 'failed' && !isFraud && !isDuplicate;

      if (isFailed) {
        failedCount++;
      } else if (isFraud) {
        fraudCount++;
        providerStats[provider].fraudCount++;
      } else if (isDuplicate) {
        duplicateCount++;
      } else if (isSuccess) {
        successCount++;
        totalMoney += record.amount || 0;
        providerStats[provider].totalAmount += record.amount || 0;
        providerStats[provider].verifiedCount++;
      }
    });

    return {
      totalMoney,
      successCount,
      fraudCount,
      duplicateCount,
      failedCount,
      providerStats,
      totalCount: filteredHistory.length,
    };
  }, [history, activeFilter]);

  const handleRefresh = async () => {
    await refetch();
  };

  return (
    <View className="flex-1 bg-background">
      <SafeAreaView className="flex-1" edges={['top']}>
        {/* Header */}
        <View className="px-6 py-4 flex-row justify-between items-center bg-card border-b border-border">
          <View className="flex-row items-center">
            <View className="w-10 h-10 rounded-xl bg-primary/10 items-center justify-center mr-3">
              <Ionicons name="stats-chart" size={20} color={themePrimary} />
            </View>
            <Text className="text-foreground text-2xl font-bold">Audit Hub</Text>
          </View>
          <TouchableOpacity
            onPress={handleRefresh}
            className="w-10 h-10 rounded-xl bg-muted items-center justify-center border border-border"
          >
            <Ionicons name="refresh" size={18} color={isDark ? 'white' : 'black'} />
          </TouchableOpacity>
        </View>

        {/* Scrollable Filter Badges Container */}
        <View className="border-b border-border bg-card/50 py-3">
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 24 }}
          >
            {filterOptions.map((option) => {
              const isSelected = activeFilter === option.id;
              return (
                <TouchableOpacity
                  key={option.id}
                  onPress={() => setActiveFilter(option.id)}
                  className={`mr-2 px-4 py-2 rounded-full border transition-all ${
                    isSelected
                      ? 'bg-primary border-primary'
                      : 'bg-card border-border active:bg-muted'
                  }`}
                >
                  <Text
                    className={`text-xs font-semibold ${
                      isSelected ? 'text-primary-foreground' : 'text-muted-foreground'
                    }`}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        <ScrollView
          className="flex-1 px-6 pt-6"
          contentContainerStyle={{ paddingBottom: 130 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isLoading}
              onRefresh={handleRefresh}
              tintColor={themePrimary}
            />
          }
        >
          {/* Total Money Card */}
          <View className="bg-primary rounded-[32px] p-6 mb-6 shadow-lg shadow-primary/20 relative overflow-hidden">
            <View className="absolute top-[-20px] right-[-20px] opacity-10">
              <Ionicons name="cash" size={150} color="white" />
            </View>
            <Text className="text-primary-foreground/75 text-sm font-semibold uppercase tracking-wider mb-2">
              Total Verified Payments
            </Text>
            <Text className="text-primary-foreground text-3xl font-extrabold mb-1">
              {metrics.totalMoney.toLocaleString(undefined, { minimumFractionDigits: 2 })} ETB
            </Text>
            <Text className="text-primary-foreground/60 text-xs">
              Based on {metrics.successCount} verified settlements ({filterOptions.find(o => o.id === activeFilter)?.label})
            </Text>
          </View>

          {/* Counts Grid section */}
          <Text className="text-foreground font-bold text-lg mb-3">Verification Summary</Text>

          <View className="flex-row flex-wrap justify-between mb-6">
            {/* Success (Verified) */}
            <View className="w-[48%] bg-card border border-border rounded-2xl p-4 mb-4 shadow-sm">
              <View className="flex-row justify-between items-center mb-2">
                <Text className="text-muted-foreground text-xs font-semibold">Success</Text>
                <View className="bg-green-500/10 p-1.5 rounded-lg">
                  <Ionicons name="checkmark-circle" size={18} color="#22c55e" />
                </View>
              </View>
              <Text className="text-foreground text-2xl font-bold">{metrics.successCount}</Text>
              <Text className="text-muted-foreground text-[10px]">Settled perfectly</Text>
            </View>

            {/* Repeated / Duplicates */}
            <View className="w-[48%] bg-card border border-border rounded-2xl p-4 mb-4 shadow-sm">
              <View className="flex-row justify-between items-center mb-2">
                <Text className="text-muted-foreground text-xs font-semibold">Repeated</Text>
                <View className="bg-amber-500/10 p-1.5 rounded-lg">
                  <Ionicons name="copy-outline" size={18} color="#f59e0b" />
                </View>
              </View>
              <Text className="text-foreground text-2xl font-bold">{metrics.duplicateCount}</Text>
              <Text className="text-muted-foreground text-[10px]">Duplicate attempts</Text>
            </View>

            {/* Frauds */}
            <View className="w-[48%] bg-card border border-border rounded-2xl p-4 shadow-sm">
              <View className="flex-row justify-between items-center mb-2">
                <Text className="text-muted-foreground text-xs font-semibold">Frauds</Text>
                <View className="bg-red-500/10 p-1.5 rounded-lg">
                  <Ionicons name="warning-outline" size={18} color="#ef4444" />
                </View>
              </View>
              <Text className="text-foreground text-2xl font-bold">{metrics.fraudCount}</Text>
              <Text className="text-muted-foreground text-[10px]">Canceled/fake slips</Text>
            </View>

            {/* Failed */}
            <View className="w-[48%] bg-card border border-border rounded-2xl p-4 shadow-sm">
              <View className="flex-row justify-between items-center mb-2">
                <Text className="text-muted-foreground text-xs font-semibold">Failed</Text>
                <View className="bg-slate-500/10 p-1.5 rounded-lg">
                  <Ionicons name="close-circle-outline" size={18} color="#64748b" />
                </View>
              </View>
              <Text className="text-foreground text-2xl font-bold">{metrics.failedCount}</Text>
              <Text className="text-muted-foreground text-[10px]">Verification errors</Text>
            </View>
          </View>

          {/* AI Auditing Hub Panel */}
          <View className="mb-6">
            <View className="flex-row items-center mb-3">
              <Text className="text-foreground font-bold text-lg tracking-tight">AI Fraud & Security Hub</Text>
              <View className="bg-primary/20 px-2 py-0.5 rounded-md ml-2 border border-primary/20 flex-row items-center">
                <Ionicons name="shield-checkmark" size={10} color={themePrimary} />
                <Text className="text-primary text-[10px] font-bold uppercase ml-1">ExecuTorch</Text>
              </View>
            </View>

            {generatingAi ? (
              <View className="bg-card border border-border rounded-3xl p-6 items-center justify-center shadow-sm">
                <ActivityIndicator color={themePrimary} size="small" />
                <Text className="text-muted-foreground text-xs mt-3">Compiling fraud/risk markers...</Text>
              </View>
            ) : aiReport ? (
              <View className="space-y-4 gap-4">
                {/* AI Auditing Summary Card */}
                <View className="bg-card border border-border rounded-3xl p-5 shadow-sm">
                  <View className="flex-row justify-between items-center mb-3">
                    <Text className="text-foreground font-bold text-sm">Security Audit Summary</Text>
                    <View className="flex-row items-center bg-primary/10 px-2.5 py-1 rounded-lg">
                      <Text className="text-primary text-[11px] font-black mr-1">Trust Score:</Text>
                      <Text className="text-primary text-[11px] font-extrabold font-mono">
                        {(aiReport.overallConfidence * 100).toFixed(0)}%
                      </Text>
                    </View>
                  </View>
                  <Text className="text-muted-foreground text-xs leading-5">{aiReport.summary}</Text>
                </View>

                {/* Audit Detections */}
                {aiReport.suspiciousTransactions.length > 0 ? (
                  aiReport.suspiciousTransactions.map((tx, idx) => (
                    <View
                      key={idx}
                      className={`border rounded-3xl p-5 shadow-sm flex-row items-start bg-card ${
                        tx.severity === 'critical' || tx.severity === 'high'
                          ? 'border-red-500/20'
                          : 'border-border'
                      }`}
                    >
                      <View
                        className={`p-2.5 rounded-xl mr-4 ${
                          tx.severity === 'critical' || tx.severity === 'high'
                            ? 'bg-red-500/10'
                            : 'bg-amber-500/10'
                        }`}
                      >
                        <Ionicons
                          name="warning"
                          size={20}
                          color={tx.severity === 'critical' || tx.severity === 'high' ? '#ef4444' : '#f59e0b'}
                        />
                      </View>
                      <View className="flex-1">
                        <Text className="text-foreground font-bold text-sm">
                          Flagged Txn: {tx.referenceNumber}
                        </Text>
                        <Text className="text-muted-foreground text-xs leading-5 mt-1">
                          {tx.reason} (Severity: {tx.severity.toUpperCase()})
                        </Text>
                      </View>
                    </View>
                  ))
                ) : (
                  <View className="bg-card border border-border rounded-3xl p-5 flex-row items-center shadow-sm">
                    <View className="bg-green-500/10 p-2.5 rounded-xl mr-4">
                      <Ionicons name="shield-checkmark-outline" size={20} color="#22c55e" />
                    </View>
                    <View className="flex-1">
                      <Text className="text-foreground font-bold text-sm">Clear Check Profile</Text>
                      <Text className="text-muted-foreground text-xs mt-0.5">
                        Deep learning validation has not flagged any suspicious transactions.
                      </Text>
                    </View>
                  </View>
                )}
              </View>
            ) : (
              <View className="bg-card border border-border rounded-3xl p-5 items-center justify-center shadow-sm">
                <Text className="text-muted-foreground text-xs">Run verification scanning to populate security audit markers.</Text>
              </View>
            )}
          </View>

          {/* Visual Distribution Progress Bar Chart */}
          {metrics.totalCount > 0 && (
            <View className="bg-card border border-border rounded-2xl p-5 mb-6 shadow-sm">
              <Text className="text-foreground font-bold text-sm mb-3">Verification Ratio</Text>
              <View className="h-4 bg-muted rounded-full overflow-hidden flex-row">
                <View style={{ width: `${(metrics.successCount / metrics.totalCount) * 100}%` }} className="bg-green-500 h-full" />
                <View style={{ width: `${(metrics.duplicateCount / metrics.totalCount) * 100}%` }} className="bg-amber-500 h-full" />
                <View style={{ width: `${(metrics.fraudCount / metrics.totalCount) * 100}%` }} className="bg-red-500 h-full" />
                <View style={{ width: `${(metrics.failedCount / metrics.totalCount) * 100}%` }} className="bg-slate-500 h-full" />
              </View>
              <View className="flex-row justify-between flex-wrap mt-3">
                <View className="flex-row items-center mr-4">
                  <View className="w-2.5 h-2.5 rounded-full bg-green-500 mr-1.5" />
                  <Text className="text-muted-foreground text-xs">Success: {((metrics.successCount / metrics.totalCount) * 100).toFixed(0)}%</Text>
                </View>
                <View className="flex-row items-center mr-4">
                  <View className="w-2.5 h-2.5 rounded-full bg-amber-500 mr-1.5" />
                  <Text className="text-muted-foreground text-xs">Repeat: {((metrics.duplicateCount / metrics.totalCount) * 100).toFixed(0)}%</Text>
                </View>
                <View className="flex-row items-center mr-4">
                  <View className="w-2.5 h-2.5 rounded-full bg-red-500 mr-1.5" />
                  <Text className="text-muted-foreground text-xs">Fraud: {((metrics.fraudCount / metrics.totalCount) * 100).toFixed(0)}%</Text>
                </View>
                <View className="flex-row items-center">
                  <View className="w-2.5 h-2.5 rounded-full bg-slate-500 mr-1.5" />
                  <Text className="text-muted-foreground text-xs">Failed: {((metrics.failedCount / metrics.totalCount) * 100).toFixed(0)}%</Text>
                </View>
              </View>
            </View>
          )}

          {/* Reconciliation Breakdown */}
          <Text className="text-foreground font-bold text-lg mb-3">Reconciliation by Provider</Text>
          <View className="bg-card border border-border rounded-[28px] overflow-hidden mb-6 shadow-sm">
            {Object.keys(metrics.providerStats).length === 0 ? (
              <View className="p-8 items-center justify-center">
                <Ionicons name="file-tray-outline" size={32} color={isDark ? '#475569' : '#cbd5e1'} />
                <Text className="text-muted-foreground text-sm mt-2 text-center">No structural provider data located within this period.</Text>
              </View>
            ) : (
              Object.entries(metrics.providerStats).map(([provider, stats], index, arr) => (
                <View
                  key={provider}
                  className={`p-5 flex-row justify-between items-center ${
                    index !== arr.length - 1 ? 'border-b border-border' : ''
                  }`}
                >
                  <View className="flex-row items-center">
                    <View className="w-10 h-10 rounded-xl bg-primary/10 items-center justify-center mr-3">
                      <Text className="text-primary font-bold text-xs uppercase">{provider.slice(0, 3)}</Text>
                    </View>
                    <View>
                      <Text className="text-foreground font-bold text-base uppercase">{provider}</Text>
                      <Text className="text-muted-foreground text-xs">
                        {stats.verifiedCount} verified • {stats.fraudCount} blocked
                      </Text>
                    </View>
                  </View>
                  <View className="items-end">
                    <Text className="text-foreground font-bold text-base">
                      {stats.totalAmount.toLocaleString()} ETB
                    </Text>
                    <Text className="text-green-500 text-[10px] font-semibold">Matched</Text>
                  </View>
                </View>
              ))
            )}
          </View>

          {/* Navigate to Insights Card CTA */}
          <TouchableOpacity
            onPress={() => router.push('/insights')}
            className="w-full mb-6 bg-primary/10 border border-primary/20 rounded-[24px] p-5 flex-row justify-between items-center active:bg-primary/20"
          >
            <View className="flex-row items-center flex-1 pr-4">
              <View className="bg-primary/20 p-2.5 rounded-xl mr-4">
                <Ionicons name="sparkles" size={22} color={themePrimary} />
              </View>
              <View className="flex-1">
                <Text className="text-foreground font-bold text-base">Business Analytics & Insights</Text>
                <Text className="text-muted-foreground text-xs mt-0.5">
                  Analyze verification trends, peak hours, and safety suggestions.
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color={themePrimary} />
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}