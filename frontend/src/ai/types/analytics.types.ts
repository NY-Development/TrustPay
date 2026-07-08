/**
 * Analytics / Insight Zod Schemas
 *
 * Validates AI-generated insight reports.
 */
import { z } from 'zod';

export const SpendingTrendSchema = z.object({
  category: z.string(),
  amount: z.number(),
  percentage: z.number().default(0),
  period: z.string().optional(),
  changePercent: z.number().optional(),
  direction: z.enum(['up', 'down', 'stable']).optional(),
});

export const RecurringMerchantSchema = z.object({
  merchant: z.string(),
  frequency: z.number().default(0),
  totalAmount: z.number().default(0),
  isRecurring: z.boolean().optional(),
  averageAmount: z.number().optional(),
});

export const BudgetWarningSchema = z.object({
  category: z.string(),
  limit: z.number().default(0),
  currentSpending: z.number().default(0),
  severity: z.enum(['low', 'medium', 'high']).optional(),
  message: z.string().optional(),
});

export const InsightReportSchema = z.object({
  spendingTrends: z.array(SpendingTrendSchema).default([]),
  recurringMerchants: z.array(RecurringMerchantSchema).default([]),
  budgetWarnings: z.array(BudgetWarningSchema).default([]),
  monthlySummary: z.string().default('No summary available.'),
  recommendations: z.array(z.string()).default([]),
  generatedAt: z.string().optional(),
});

export type ValidatedInsightReport = z.infer<typeof InsightReportSchema>;
export type ValidatedSpendingTrend = z.infer<typeof SpendingTrendSchema>;
export type ValidatedRecurringMerchant = z.infer<typeof RecurringMerchantSchema>;
