import React, { useMemo, useState, useEffect } from 'react';
import { useVerificationHistory } from '@/src/hooks/useVerification';
import { ShieldCheck, Copy, ShieldAlert, AlertTriangle, RefreshCw, Layers, X } from 'lucide-react';
import type { DateRange } from 'react-day-picker';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { useAI } from '@/src/ai/AIProvider';
import type { ReceiptData, AuditReport } from '@/src/ai/ai-types';

type FilterPeriod = 'all' | 'today' | 'week' | 'month' | 'year';

export default function AuditPage() {
  const { organizer, status: aiStatus } = useAI();
  const { data: historyRes, isLoading, refetch } = useVerificationHistory({ limit: 100 });
  // Memoized so the reference is stable across renders — this prevents the AI
  // audit effect below from re-firing on every render (runaway generateAudit).
  const history = useMemo(() => historyRes?.pages?.flatMap(page => page.data) || [], [historyRes]);

  const [activeFilter, setActiveFilter] = useState<FilterPeriod>('all');
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [generatingAi, setGeneratingAi] = useState(false);
  const [aiReport, setAiReport] = useState<AuditReport | null>(null);

  const filterOptions = [
    { id: 'all', label: 'All Time' },
    { id: 'today', label: 'Today' },
    { id: 'week', label: 'This Week' },
    { id: 'month', label: 'This Month' },
    { id: 'year', label: 'This Year' },
  ] as const;

  // Single filtered set shared by the metrics AND the AI audit, so every panel
  // reflects the selected period + custom date range consistently.
  const filteredHistory = useMemo(() => {
    const now = new Date();
    const rangeStart = dateRange?.from ? new Date(dateRange.from.getFullYear(), dateRange.from.getMonth(), dateRange.from.getDate(), 0, 0, 0) : null;
    const rangeEnd = dateRange?.to ? new Date(dateRange.to.getFullYear(), dateRange.to.getMonth(), dateRange.to.getDate(), 23, 59, 59, 999) : null;

    return history.filter((record: any) => {
      const recordDateStr = record.createdAt;

      // Preset period filter
      if (activeFilter !== 'all') {
        if (!recordDateStr) return false;
        const recordDate = new Date(recordDateStr);
        const diffDays = (now.getTime() - recordDate.getTime()) / (1000 * 60 * 60 * 24);
        let passes = true;
        switch (activeFilter) {
          case 'today': passes = recordDate.toDateString() === now.toDateString(); break;
          case 'week': passes = diffDays <= 7; break;
          case 'month': passes = diffDays <= 30; break;
          case 'year': passes = diffDays <= 365; break;
        }
        if (!passes) return false;
      }

      // Begin/end date-range filter (records within the chosen window, inclusive)
      if (rangeStart || rangeEnd) {
        if (!recordDateStr) return false;
        const recordDate = new Date(recordDateStr);
        if (rangeStart && recordDate < rangeStart) return false;
        if (rangeEnd && recordDate > rangeEnd) return false;
      }

      return true;
    });
  }, [history, activeFilter, dateRange]);

  // Convert histories into unified structure for audit checking
  const receiptDataItems = useMemo((): ReceiptData[] => {
    return filteredHistory.map((item: any) => ({
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
  }, [filteredHistory]);

  useEffect(() => {
    if (aiStatus !== 'ready') return;

    // Nothing in the current filter → clear any stale report.
    if (receiptDataItems.length === 0) {
      setAiReport(null);
      setGeneratingAi(false);
      return;
    }

    let cancelled = false;
    const getAiAudit = async () => {
      setGeneratingAi(true);
      try {
        const report = await organizer.generateAudit(receiptDataItems);
        if (!cancelled) setAiReport(report);
      } catch (err) {
        console.warn('[AI Web Audit Error]', err);
        if (!cancelled) setAiReport(null);
      } finally {
        if (!cancelled) setGeneratingAi(false);
      }
    };
    getAiAudit();

    // Prevent a slow, stale response from overwriting a newer filter selection.
    return () => { cancelled = true; };
  }, [receiptDataItems, aiStatus, organizer]);

  const metrics = useMemo(() => {
    let totalMoney = 0;
    let successCount = 0;
    let fraudCount = 0;
    let duplicateCount = 0;
    let failedCount = 0;

    const providerStats: Record<string, { totalAmount: number; verifiedCount: number; fraudCount: number }> = {};

    filteredHistory.forEach((record: any) => {
      const provider = (record.provider || 'unknown').toLowerCase();
      if (!providerStats[provider]) {
        providerStats[provider] = { totalAmount: 0, verifiedCount: 0, fraudCount: 0 };
      }

      const isFailed = record.verified === false || record.status === 'failed' || record.verificationSummary?.severity === 'error';
      const isFraud = record.verificationSummary?.severity === 'fraud_risk';
      const isDuplicate = record.verificationSummary?.severity === 'duplicate' || 
                          (record.rawResponse?.confirmationHistory && 
                            (record.rawResponse.confirmationHistory.confirmationCount > 1 || 
                             record.rawResponse.confirmationHistory.confirmedBefore === true));
      
      const isSuccess = record.verified === true && record.status !== 'failed' && !isFraud && !isDuplicate;

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
  }, [filteredHistory]);

  return (
    <div className="space-y-8">
      {/* Header element */}
      <div className="flex justify-between items-center bg-white dark:bg-[#131b2e] border border-[#c2c6d9]/35 p-6 rounded-2xl shadow-xs">
        <div>
          <h1 className="text-2xl font-bold text-[#131b2e] dark:text-white">Audit Hub</h1>
          <p className="text-xs text-[#54647a]">Reconcile counter claims, double spend logs, and fraud alerts</p>
        </div>
        <button
          onClick={() => refetch()}
          disabled={isLoading}
          className="w-10 h-10 rounded-xl bg-[#505f76]/10 hover:bg-[#505f76]/20 flex items-center justify-center transition-all cursor-pointer text-[#131b2e] dark:text-white"
        >
          <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Filter Options bar */}
      <div className="flex flex-wrap gap-2 pb-2 items-center">
        {filterOptions.map((opt) => (
          <button
            key={opt.id}
            onClick={() => setActiveFilter(opt.id)}
            className={`px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${
              activeFilter === opt.id
                ? 'bg-[#004bca] text-white shadow-xs'
                : 'bg-white border border-[#c2c6d9]/30 dark:bg-transparent dark:border-white/10 text-[#54647a]'
            }`}
          >
            {opt.label}
          </button>
        ))}

        {/* Begin/end date-range filter */}
        <div className="flex items-center gap-2 sm:ml-auto">
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

      {/* Hero Volume Card */}
      <div className="bg-[#004bca] text-white rounded-[32px] p-8 shadow-md relative overflow-hidden">
        <span className="text-[#b4c5ff] text-xs font-bold uppercase tracking-wider block mb-2">Total Verified Payments</span>
        <h2 className="text-4xl font-extrabold">{metrics.totalMoney.toLocaleString(undefined, { minimumFractionDigits: 2 })} ETB</h2>
        <p className="text-[#b4c5ff] text-xs mt-3">
          Calculated across {metrics.successCount} verified payments within selected timeline.
        </p>
      </div>

      {/* Metrics breakdown card grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-[#131b2e] border border-[#c2c6d9]/25 rounded-2xl p-5 shadow-xs">
          <div className="flex justify-between items-center text-emerald-500 mb-2">
            <span className="text-gray-500 text-xs font-semibold">Success</span>
            <ShieldCheck size={20} />
          </div>
          <span className="text-2xl font-bold text-[#131b2e] dark:text-white block">{metrics.successCount}</span>
          <span className="text-[10px] text-gray-400 mt-1 block">Successfully reconciled</span>
        </div>

        <div className="bg-white dark:bg-[#131b2e] border border-[#c2c6d9]/25 rounded-2xl p-5 shadow-xs">
          <div className="flex justify-between items-center text-amber-500 mb-2">
            <span className="text-gray-500 text-xs font-semibold">Repeated</span>
            <Copy size={20} />
          </div>
          <span className="text-2xl font-bold text-[#131b2e] dark:text-white block">{metrics.duplicateCount}</span>
          <span className="text-[10px] text-gray-400 mt-1 block">Duplicate checks blocked</span>
        </div>

        <div className="bg-white dark:bg-[#131b2e] border border-[#c2c6d9]/25 rounded-2xl p-5 shadow-xs">
          <div className="flex justify-between items-center text-rose-500 mb-2">
            <span className="text-gray-500 text-xs font-semibold">Frauds</span>
            <ShieldAlert size={20} />
          </div>
          <span className="text-2xl font-bold text-[#131b2e] dark:text-white block">{metrics.fraudCount}</span>
          <span className="text-[10px] text-gray-400 mt-1 block">Fraud/Fake slips detected</span>
        </div>

        <div className="bg-white dark:bg-[#131b2e] border border-[#c2c6d9]/25 rounded-2xl p-5 shadow-xs">
          <div className="flex justify-between items-center text-slate-500 mb-2">
            <span className="text-gray-500 text-xs font-semibold">Failed</span>
            <AlertTriangle size={20} />
          </div>
          <span className="text-2xl font-bold text-[#131b2e] dark:text-white block">{metrics.failedCount}</span>
          <span className="text-[10px] text-gray-400 mt-1 block">Verification errors</span>
        </div>
      </div>

      {/* AI Auditing Hub Panel */}
      <div className="bg-white dark:bg-[#131b2e] border border-[#c2c6d9]/35 rounded-[28px] overflow-hidden p-6 shadow-xs">
        <div className="flex flex-wrap justify-between items-center gap-3 mb-6">
          <div>
            <h3 className="text-lg font-bold text-[#131b2e] dark:text-white">AI Fraud & Security Hub</h3>
            <p className="text-xs text-[#54647a]">Deep learning verification and transaction safety analysis</p>
          </div>
          <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-[#004bca]/10 text-[#004bca] border border-[#004bca]/10">
            Cloud Gemma AI
          </span>
        </div>

        {generatingAi ? (
          <div className="flex items-center justify-center p-8 gap-2 text-xs text-muted-foreground">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#004bca]" />
            Analyzing verification log patterns for anomalies...
          </div>
        ) : aiReport ? (
          <div className="space-y-6">
            <div className="p-5 rounded-2xl bg-[#faf8ff] dark:bg-[#0b0e14] border border-[#c2c6d9]/20 flex flex-wrap justify-between items-center gap-4">
              <div className="flex-1 min-w-[240px]">
                <h4 className="font-semibold text-sm mb-1 text-[#131b2e] dark:text-white">Security Audit Summary</h4>
                <p className="text-xs text-muted-foreground leading-5">{aiReport.summary}</p>
              </div>
              <div className="shrink-0 flex items-center bg-[#004bca]/10 text-[#004bca] px-3 py-1.5 rounded-lg border border-[#004bca]/20 font-bold text-xs select-none">
                Risk Confidence Level: <span className="font-mono ml-1">{(aiReport.overallConfidence * 100).toFixed(0)}%</span>
              </div>
            </div>

            {aiReport.suspiciousTransactions.length > 0 ? (
              <div className="space-y-3">
                <h4 className="font-semibold text-xs text-[#54647a] tracking-wider uppercase">Detections Required Action</h4>
                {aiReport.suspiciousTransactions.map((tx, idx) => (
                  <div
                    key={idx}
                    className={`flex items-start gap-4 p-4 rounded-xl border ${
                      tx.severity === 'critical' || tx.severity === 'high'
                        ? 'border-red-500/20 bg-red-500/5'
                        : 'border-amber-500/20 bg-amber-500/5'
                    }`}
                  >
                    <ShieldAlert size={20} className={tx.severity === 'critical' || tx.severity === 'high' ? 'text-red-500 mt-0.5' : 'text-amber-500 mt-0.5'} />
                    <div>
                      <h5 className="font-bold text-xs text-[#131b2e] dark:text-white uppercase">Reference ID: {tx.referenceNumber}</h5>
                      <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{tx.reason}</p>
                      <span className="inline-block mt-2 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-[#505f76]/10 text-slate-500">
                        Severity: {tx.severity}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center gap-4 p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5 text-emerald-600 dark:text-emerald-400">
                <ShieldCheck size={24} />
                <div>
                  <h5 className="font-bold text-xs uppercase">Platform Check Complete</h5>
                  <p className="text-[11px] mt-0.5 opacity-90">Verification logs show no high-severity risk indicators. System health is stable.</p>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="p-8 text-center text-xs text-muted-foreground">Verify more transaction slips to compile Deep AI audits.</div>
        )}
      </div>

      {/* Provider Details breakdown */}
      <div className="bg-white dark:bg-[#131b2e] border border-[#c2c6d9]/35 rounded-[28px] overflow-hidden shadow-xs">
        <h3 className="text-sm font-bold text-[#131b2e] dark:text-white p-6 border-b border-[#c2c6d9]/20">Reconciliation by Provider</h3>
        {Object.keys(metrics.providerStats).length === 0 ? (
          <div className="p-8 text-center text-xs text-[#54647a]">No structural provider records matching filter parameters.</div>
        ) : (
          <div className="divide-y divide-[#c2c6d9]/20">
            {Object.entries(metrics.providerStats).map(([provider, stats]) => (
              <div key={provider} className="p-5 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#004bca]/10 text-[#004bca] flex items-center justify-center font-bold text-xs uppercase">
                    {provider.slice(0, 3)}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold uppercase text-[#131b2e] dark:text-white">{provider}</h4>
                    <p className="text-[10px] text-gray-400">{stats.verifiedCount} verified • {stats.fraudCount} blocked</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-bold text-sm text-[#131b2e] dark:text-white">{stats.totalAmount.toLocaleString()} ETB</span>
                  <span className="block text-[10px] text-green-500 uppercase tracking-widest mt-0.5">Matched</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
