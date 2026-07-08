/**
 * MockProvider — Deterministic Development / Testing Provider
 *
 * Returns realistic Ethiopian banking data without any model.
 * Useful during development or when models are unavailable.
 */
import { BaseAIProvider } from './BaseAIProvider';
import type {
  AIProviderConfig,
  InferenceResult,
  ModelTask,
} from '../types/model.types';
import type { ValidatedReceiptData } from '../types/receipt.types';
import type { ValidatedInsightReport } from '../types/analytics.types';
import type { ValidatedAuditReport, ValidatedAnomalyReport } from '../types/audit.types';
// A self-contained UUID generator to avoid dependency issues with vite bundling of npm uuid
const uuidv4 = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

export class MockProvider extends BaseAIProvider {
  constructor(config?: Partial<AIProviderConfig>) {
    super({ type: 'mock', ...config });
  }

  async initialize(): Promise<void> {
    this._status = 'ready';
    console.log('[MockProvider] Initialized (deterministic mode)');
  }

  async dispose(): Promise<void> {
    this._status = 'disposed';
  }

  async generate(prompt: string, task: ModelTask): Promise<InferenceResult> {
    await this._simulateLatency();
    return {
      requestId: uuidv4(),
      response: JSON.stringify({ result: 'Mock response for: ' + task }),
      durationMs: 150,
      tokenCount: 50,
      truncated: false,
    };
  }

  async extractReceipt(ocrText: string): Promise<ValidatedReceiptData> {
    await this._simulateLatency();
    const lower = ocrText.toLowerCase();
    let bank = 'unknown';
    if (lower.includes('cbe') || lower.includes('commercial bank')) bank = 'cbe';
    else if (lower.includes('telebirr')) bank = 'telebirr';
    else if (lower.includes('boa') || lower.includes('abyssinia')) bank = 'boa';
    else if (lower.includes('dashen')) bank = 'dashen';
    else if (lower.includes('awash')) bank = 'awash';

    let total: number | null = null;
    const amountMatch = ocrText.match(/[\d,]+\.\d{2}/);
    if (amountMatch) {
      total = parseFloat(amountMatch[0].replace(/,/g, ''));
    }

    let referenceNumber: string | null = null;
    const refMatch = ocrText.match(/\b(FT[A-Z0-9]{8,15})\b/i) || ocrText.match(/\b([A-Z0-9]{10,12})\b/);
    if (refMatch) referenceNumber = refMatch[0].trim();

    return {
      merchant: bank === 'cbe' ? 'Commercial Bank of Ethiopia' : 'Mock Merchant',
      date: new Date().toISOString().split('T')[0],
      subtotal: total ? +(total * 0.85).toFixed(2) : null,
      tax: total ? +(total * 0.15).toFixed(2) : null,
      vat: null,
      total,
      currency: 'ETB',
      paymentMethod: 'transfer',
      items: [],
      category: 'services',
      confidence: 0.92,
      referenceNumber,
      transactionNumber: referenceNumber,
      bank,
      senderName: 'Mock Customer',
      receiverName: 'Mock Merchant Pay',
    };
  }

  async generateInsights(receipts: ValidatedReceiptData[]): Promise<ValidatedInsightReport> {
    await this._simulateLatency();
    const totalSpend = receipts.reduce((sum, r) => sum + (r.total || 0), 0);
    return {
      spendingTrends: [
        { category: 'services', amount: totalSpend * 0.6, percentage: 60 },
        { category: 'meals', amount: totalSpend * 0.25, percentage: 25 },
        { category: 'other', amount: totalSpend * 0.15, percentage: 15 },
      ],
      recurringMerchants: [
        { merchant: 'CBE Birr Agent', frequency: Math.min(receipts.length, 5), totalAmount: totalSpend * 0.4 },
      ],
      budgetWarnings: totalSpend > 50000
        ? [{ category: 'services', limit: 50000, currentSpending: totalSpend }]
        : [],
      monthlySummary: `Mock analysis of ${receipts.length} transactions totaling ${totalSpend.toLocaleString()} ETB. CBE continues to dominate payment volume.`,
      recommendations: [
        'Diversify payment channels to reduce single-provider dependency.',
        'Consolidate end-of-day balances for optimized liquidity.',
        'Review recurring merchant agreements for potential savings.',
      ],
      generatedAt: new Date().toISOString(),
    };
  }

  async generateAudit(receipts: ValidatedReceiptData[]): Promise<ValidatedAuditReport> {
    await this._simulateLatency();
    return {
      suspiciousTransactions: [],
      duplicateCount: 0,
      unusualExpenses: [],
      taxIssues: [],
      missingReceipts: [],
      overallConfidence: 0.95,
      summary: `Mock audit of ${receipts.length} transactions. No anomalies detected. All reference numbers validated.`,
      generatedAt: new Date().toISOString(),
    };
  }

  async categorize(_text: string): Promise<string> {
    await this._simulateLatency();
    return 'services';
  }

  async detectAnomalies(receipts: ValidatedReceiptData[]): Promise<ValidatedAnomalyReport> {
    await this._simulateLatency();
    return {
      anomalies: [],
      riskScore: 5,
      summary: `Mock scan of ${receipts.length} transactions found no anomalies.`,
      generatedAt: new Date().toISOString(),
    };
  }

  async healthCheck() {
    return { healthy: true, message: 'MockProvider is always healthy' };
  }

  private async _simulateLatency(): Promise<void> {
    await new Promise((r) => setTimeout(r, 200 + Math.random() * 300));
  }
}
