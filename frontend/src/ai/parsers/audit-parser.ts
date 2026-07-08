/**
 * Audit Parser — Audit Report Validation
 */
import { AuditReportSchema, AnomalyReportSchema, type ValidatedAuditReport, type ValidatedAnomalyReport } from '../types/audit.types';
import { safeParseJson } from './json-repair';

export function parseAuditResponse(raw: string, receiptCount: number): ValidatedAuditReport {
  const fallback: ValidatedAuditReport = {
    suspiciousTransactions: [], duplicateCount: 0, unusualExpenses: [],
    taxIssues: [], missingReceipts: [], overallConfidence: 0,
    summary: `Audit of ${receiptCount} transactions.`,
    generatedAt: new Date().toISOString(),
  };

  const parsed = safeParseJson<Record<string, unknown>>(raw);
  if (!parsed) return fallback;

  const result = AuditReportSchema.safeParse(parsed);
  if (result.success) {
    return { ...result.data, generatedAt: new Date().toISOString() };
  }

  return AuditReportSchema.parse({ ...fallback, ...parsed, generatedAt: new Date().toISOString() });
}

export function parseAnomalyResponse(raw: string): ValidatedAnomalyReport {
  const fallback: ValidatedAnomalyReport = {
    anomalies: [], riskScore: 0,
    summary: 'No anomalies detected.',
    generatedAt: new Date().toISOString(),
  };

  const parsed = safeParseJson<Record<string, unknown>>(raw);
  if (!parsed) return fallback;

  const result = AnomalyReportSchema.safeParse(parsed);
  if (result.success) {
    return { ...result.data, generatedAt: new Date().toISOString() };
  }

  return AnomalyReportSchema.parse({ ...fallback, ...parsed, generatedAt: new Date().toISOString() });
}
