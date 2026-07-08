/**
 * Audit & Anomaly Zod Schemas
 *
 * Validates AI-generated audit and anomaly detection reports.
 */
import { z } from 'zod';

export const SuspiciousTransactionSchema = z.object({
  referenceNumber: z.string().default(''),
  reason: z.string().default('Unknown'),
  severity: z.enum(['low', 'medium', 'high', 'critical']).default('low'),
  amount: z.number().optional(),
  merchant: z.string().optional(),
});

export const UnusualExpenseSchema = z.object({
  description: z.string(),
  amount: z.number().default(0),
  reason: z.string().default(''),
});

export const AuditReportSchema = z.object({
  suspiciousTransactions: z.array(SuspiciousTransactionSchema).default([]),
  duplicateCount: z.number().default(0),
  unusualExpenses: z.array(z.union([UnusualExpenseSchema, z.string()])).default([]),
  taxIssues: z.array(z.string()).default([]),
  missingReceipts: z.array(z.string()).default([]),
  overallConfidence: z.number().min(0).max(1).default(0),
  summary: z.string().default('No audit data available.'),
  generatedAt: z.string().optional(),
});

export const AnomalySchema = z.object({
  type: z.enum(['amount_spike', 'unusual_merchant', 'duplicate', 'time_anomaly', 'category_mismatch']).optional(),
  description: z.string(),
  riskScore: z.number().default(0),
  referenceNumber: z.string().optional(),
  severity: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  relatedTransaction: z.string().optional(),
});

export const AnomalyReportSchema = z.object({
  anomalies: z.array(AnomalySchema).default([]),
  riskScore: z.number().min(0).max(100).default(0),
  summary: z.string().default('No anomalies detected.'),
  generatedAt: z.string().optional(),
});

export type ValidatedAuditReport = z.infer<typeof AuditReportSchema>;
export type ValidatedAnomalyReport = z.infer<typeof AnomalyReportSchema>;
