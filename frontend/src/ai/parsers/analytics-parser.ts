/**
 * Analytics Parser — Insight Report Validation
 */
import { InsightReportSchema, type ValidatedInsightReport } from '../types/analytics.types';
import { safeParseJson } from './json-repair';

export function parseInsightResponse(raw: string, receiptCount: number): ValidatedInsightReport {
  const fallback: ValidatedInsightReport = {
    spendingTrends: [], recurringMerchants: [], budgetWarnings: [],
    monthlySummary: `Analysis of ${receiptCount} transactions.`,
    recommendations: ['Continue recording receipts for more accurate analysis.'],
    generatedAt: new Date().toISOString(),
  };

  const parsed = safeParseJson<Record<string, unknown>>(raw);
  if (!parsed) return fallback;

  const result = InsightReportSchema.safeParse(parsed);
  if (result.success) {
    return { ...result.data, generatedAt: new Date().toISOString() };
  }

  // Attempt partial
  return InsightReportSchema.parse({ ...fallback, ...parsed, generatedAt: new Date().toISOString() });
}
