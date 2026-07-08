/**
 * Shared AI Type Definitions
 *
 * These interfaces define the contract between the AI layer and
 * application screens. Both mobile (ExecuTorch) and web (cloud-backed)
 * implementations must conform to these types.
 */

// ─── Receipt & Document Types ────────────────────────────────────

export interface ReceiptItem {
  name: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface ReceiptData {
  merchant: string | null;
  date: string | null;
  subtotal: number | null;
  tax: number | null;
  vat: number | null;
  total: number | null;
  currency: string;
  paymentMethod: string | null;
  items: ReceiptItem[];
  category: ExpenseCategory;
  confidence: number;
  /** Raw fields for backward compat with verification pipeline */
  referenceNumber: string | null;
  transactionNumber: string | null;
  bank: string;
  senderName: string | null;
  receiverName: string | null;
}

// ─── Expense Categories ──────────────────────────────────────────

export type ExpenseCategory =
  | 'food_dining'
  | 'groceries'
  | 'transportation'
  | 'utilities'
  | 'entertainment'
  | 'healthcare'
  | 'education'
  | 'shopping'
  | 'travel'
  | 'business'
  | 'rent_housing'
  | 'subscriptions'
  | 'personal_care'
  | 'donations'
  | 'taxes_fees'
  | 'other';

// ─── Insight Report ──────────────────────────────────────────────

export interface SpendingTrend {
  period: string;
  amount: number;
  changePercent: number;
  direction: 'up' | 'down' | 'flat';
}

export interface MerchantInsight {
  merchant: string;
  totalSpent: number;
  transactionCount: number;
  isRecurring: boolean;
  averageAmount: number;
}

export interface BudgetWarning {
  category: ExpenseCategory;
  currentSpend: number;
  projectedSpend: number;
  severity: 'low' | 'medium' | 'high';
  message: string;
}

export interface InsightReport {
  spendingTrends: SpendingTrend[];
  recurringMerchants: MerchantInsight[];
  budgetWarnings: BudgetWarning[];
  monthlySummary: string;
  recommendations: string[];
  generatedAt: string;
}

// ─── Audit Report ────────────────────────────────────────────────

export interface SuspiciousTransaction {
  referenceNumber: string;
  reason: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  amount: number;
  merchant: string;
}

export interface AuditReport {
  suspiciousTransactions: SuspiciousTransaction[];
  duplicateCount: number;
  unusualExpenses: string[];
  taxIssues: string[];
  missingReceipts: string[];
  overallConfidence: number;
  summary: string;
  generatedAt: string;
}

// ─── Anomaly Report ──────────────────────────────────────────────

export interface Anomaly {
  type: 'amount_spike' | 'unusual_merchant' | 'duplicate' | 'time_anomaly' | 'category_mismatch';
  description: string;
  severity: 'low' | 'medium' | 'high';
  relatedTransaction?: string;
}

export interface AnomalyReport {
  anomalies: Anomaly[];
  riskScore: number;
  summary: string;
  generatedAt: string;
}

// ─── AI Service Status ───────────────────────────────────────────

export type AIStatus = 'uninitialized' | 'downloading' | 'loading' | 'ready' | 'error';

export interface AIProgressEvent {
  phase: 'download' | 'init' | 'inference';
  progress: number; // 0–1
  message: string;
}

// ─── Model Registry ──────────────────────────────────────────────

export type AIModelId =
  | 'receipt-parser'
  | 'expense-classifier'
  | 'insight-generator'
  | 'audit-generator';

export interface AIModelMeta {
  id: AIModelId;
  label: string;
  size: string;
  description: string;
  version: string;
}

// ─── AIOrganizer Interface ───────────────────────────────────────

export interface IAIOrganizer {
  /** Current runtime status */
  readonly status: AIStatus;

  /** Initialize the AI runtime */
  initialize(): Promise<void>;

  /** Extract structured receipt data from OCR text */
  extractReceiptData(ocrText: string): Promise<ReceiptData>;

  /** Generate spending insights from receipt history */
  generateInsights(receipts: ReceiptData[]): Promise<InsightReport>;

  /** Generate audit report from receipt history */
  generateAudit(receipts: ReceiptData[]): Promise<AuditReport>;

  /** Classify an expense into a category */
  categorizeExpense(text: string): Promise<ExpenseCategory>;

  /** Summarize a document's content */
  summarizeDocument(text: string): Promise<string>;

  /** Detect anomalies in a set of receipts */
  detectAnomalies(receipts: ReceiptData[]): Promise<AnomalyReport>;
}
