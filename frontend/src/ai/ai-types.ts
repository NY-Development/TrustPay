/**
 * AI Global Types Hub
 *
 * Re-exports all sub-types for backward compatibility and clean importing.
 */

export * from './types/model.types';
export * from './types/receipt.types';
export * from './types/analytics.types';
export * from './types/audit.types';

// Compatibility aliases for pages/components
export type ReceiptData = import('./types/receipt.types').ValidatedReceiptData;
export type ExpenseCategory = import('./types/receipt.types').ValidatedExpenseCategory;
export type InsightReport = import('./types/analytics.types').ValidatedInsightReport;
export type AuditReport = import('./types/audit.types').ValidatedAuditReport;
export type AnomalyReport = import('./types/audit.types').ValidatedAnomalyReport;

// Expose the core interface that matches both Mobile and Web controllers
export interface IAIOrganizer {
  status: import('./types/model.types').AIStatus;
  initialize(): Promise<void>;
  extractReceiptData(ocrText: string): Promise<ReceiptData>;
  generateInsights(receipts: ReceiptData[]): Promise<InsightReport>;
  generateAudit(receipts: ReceiptData[]): Promise<AuditReport>;
  categorizeExpense(text: string): Promise<ExpenseCategory>;
  summarizeDocument(text: string): Promise<string>;
  detectAnomalies(receipts: ReceiptData[]): Promise<AnomalyReport>;
  dispose(): Promise<void>;
}
