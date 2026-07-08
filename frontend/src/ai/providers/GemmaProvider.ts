/**
 * GemmaProvider — Browser-Based Google Gemma AI Edge Provider
 *
 * All Google-specific code is isolated here. No Google-specific
 * imports or logic should appear anywhere else in the codebase.
 *
 * Uses the browser AI runtime for local inference,
 * IndexedDB caching for model storage, and Web Workers
 * to prevent UI blocking.
 *
 * NOTE: Browser Gemma integration is under active development.
 * This provider is architecturally complete and ready for
 * Google AI Edge SDK when it becomes available for browsers.
 * Until then, it delegates to heuristic fallback.
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
import { ReceiptDataSchema } from '../types/receipt.types';
import { InsightReportSchema } from '../types/analytics.types';
import { AuditReportSchema, AnomalyReportSchema } from '../types/audit.types';
import { buildPrompt } from '../utils/prompt-builder';
import { repairJson } from '../parsers/json-repair';
import { validateOrFallback } from '../utils/json-validator';
import { BrowserAIRuntime } from '../runtime/gemma-runtime';
import { v4 as uuidv4 } from 'uuid';

export class GemmaProvider extends BaseAIProvider {
  private _runtime: BrowserAIRuntime;
  private _runtimeReady = false;

  constructor(config?: Partial<AIProviderConfig>) {
    super({ type: 'gemma', ...config });
    this._runtime = new BrowserAIRuntime();
  }

  async initialize(): Promise<void> {
    try {
      this._status = 'loading';
      await this._runtime.initialize();
      this._runtimeReady = this._runtime.isReady;
      this._status = this._runtimeReady ? 'ready' : 'ready'; // Heuristic mode if runtime not available
      console.log(`[GemmaProvider] Initialized (runtime=${this._runtimeReady ? 'active' : 'heuristic-fallback'})`);
    } catch (err: any) {
      console.warn('[GemmaProvider] Runtime init failed, falling back to heuristics:', err.message);
      this._status = 'ready'; // Still usable via heuristics
    }
  }

  async dispose(): Promise<void> {
    await this._runtime.dispose();
    this._runtimeReady = false;
    this._status = 'disposed';
  }

  async generate(prompt: string, task: ModelTask, signal?: AbortSignal): Promise<InferenceResult> {
    const start = performance.now();

    if (!this._runtimeReady) {
      return {
        requestId: uuidv4(),
        response: '',
        durationMs: 0,
        tokenCount: 0,
        truncated: false,
      };
    }

    try {
      const response = await this._runtime.runInference(prompt, signal);
      return {
        requestId: uuidv4(),
        response,
        durationMs: performance.now() - start,
        tokenCount: Math.ceil(response.length / 4),
        truncated: false,
      };
    } catch (err: any) {
      console.warn('[GemmaProvider] Inference failed:', err.message);
      return {
        requestId: uuidv4(),
        response: '',
        durationMs: performance.now() - start,
        tokenCount: 0,
        truncated: false,
      };
    }
  }

  // ─── Structured Operations ───────────────────────────────────

  async extractReceipt(ocrText: string): Promise<ValidatedReceiptData> {
    try {
      const prompt = buildPrompt('receipt-extraction', ocrText);
      const result = await this.generate(prompt, 'receipt-extraction');
      if (!result.response) return this._heuristicReceipt(ocrText);

      const repaired = repairJson(result.response);
      return validateOrFallback(ReceiptDataSchema, repaired, this._heuristicReceipt(ocrText));
    } catch {
      return this._heuristicReceipt(ocrText);
    }
  }

  async generateInsights(receipts: ValidatedReceiptData[]): Promise<ValidatedInsightReport> {
    const fallback = this._fallbackInsight(receipts);
    if (receipts.length === 0) return fallback;

    try {
      const prompt = buildPrompt('insight-generation', JSON.stringify(
        receipts.map(r => ({ merchant: r.merchant, total: r.total, category: r.category, date: r.date }))
      ));
      const result = await this.generate(prompt, 'insight-generation');
      if (!result.response) return fallback;

      const repaired = repairJson(result.response);
      return validateOrFallback(InsightReportSchema, repaired, fallback);
    } catch {
      return fallback;
    }
  }

  async generateAudit(receipts: ValidatedReceiptData[]): Promise<ValidatedAuditReport> {
    const fallback = this._fallbackAudit(receipts);
    if (receipts.length === 0) return fallback;

    try {
      const prompt = buildPrompt('audit-generation', JSON.stringify(
        receipts.map(r => ({ referenceNumber: r.referenceNumber, merchant: r.merchant, total: r.total, date: r.date, bank: r.bank }))
      ));
      const result = await this.generate(prompt, 'audit-generation');
      if (!result.response) return fallback;

      const repaired = repairJson(result.response);
      return validateOrFallback(AuditReportSchema, repaired, fallback);
    } catch {
      return fallback;
    }
  }

  async categorize(text: string): Promise<string> {
    try {
      const prompt = buildPrompt('categorization', text);
      const result = await this.generate(prompt, 'categorization');
      if (!result.response) return 'other';

      const repaired = repairJson(result.response);
      const parsed = JSON.parse(repaired);
      return parsed?.category || 'other';
    } catch {
      return 'other';
    }
  }

  async detectAnomalies(receipts: ValidatedReceiptData[]): Promise<ValidatedAnomalyReport> {
    const fallback: ValidatedAnomalyReport = { anomalies: [], riskScore: 0, summary: 'Runtime unavailable.', generatedAt: new Date().toISOString() };
    if (receipts.length === 0) return fallback;

    try {
      const prompt = buildPrompt('anomaly-detection', JSON.stringify(receipts));
      const result = await this.generate(prompt, 'anomaly-detection');
      if (!result.response) return fallback;

      const repaired = repairJson(result.response);
      return validateOrFallback(AnomalyReportSchema, repaired, fallback);
    } catch {
      return fallback;
    }
  }

  async healthCheck() {
    return {
      healthy: this._status === 'ready',
      message: this._runtimeReady ? 'Gemma runtime active' : 'Heuristic fallback mode',
    };
  }

  // ─── Private Heuristic Fallbacks ─────────────────────────────

  private _heuristicReceipt(text: string): ValidatedReceiptData {
    const lower = text.toLowerCase();
    let bank = 'unknown';
    if (lower.includes('cbe') || lower.includes('commercial bank')) bank = 'cbe';
    else if (lower.includes('telebirr')) bank = 'telebirr';
    else if (lower.includes('boa') || lower.includes('abyssinia')) bank = 'boa';
    else if (lower.includes('dashen')) bank = 'dashen';
    else if (lower.includes('awash')) bank = 'awash';

    let total: number | null = null;
    const amountMatch = text.match(/[\d,]+\.\d{2}/) || text.match(/amount\s*:\s*([\d,]+)/i);
    if (amountMatch) {
      const raw = amountMatch[1] || amountMatch[0];
      const cleaned = parseFloat(raw.replace(/,/g, ''));
      if (!isNaN(cleaned)) total = cleaned;
    }

    let referenceNumber: string | null = null;
    const refMatch = text.match(/\b(FT[A-Z0-9]{8,15})\b/i) || text.match(/\b([A-Z0-9]{10,12})\b/);
    if (refMatch) referenceNumber = refMatch[0].trim();

    return {
      merchant: null, date: new Date().toISOString().split('T')[0],
      subtotal: total ? +(total * 0.85).toFixed(2) : null, tax: total ? +(total * 0.15).toFixed(2) : null,
      vat: null, total, currency: 'ETB', paymentMethod: 'transfer', items: [], category: 'other',
      confidence: 0.45, referenceNumber, transactionNumber: referenceNumber, bank,
      senderName: null, receiverName: null,
    };
  }

  private _fallbackInsight(receipts: ValidatedReceiptData[]): ValidatedInsightReport {
    const totalSpend = receipts.reduce((s, r) => s + (r.total || 0), 0);
    return {
      spendingTrends: [{ category: 'all', amount: totalSpend, percentage: 100 }],
      recurringMerchants: [], budgetWarnings: [],
      monthlySummary: `Heuristic analysis of ${receipts.length} transactions (${totalSpend.toLocaleString()} ETB).`,
      recommendations: ['Enable Gemma runtime for AI-powered insights.'],
      generatedAt: new Date().toISOString(),
    };
  }

  private _fallbackAudit(receipts: ValidatedReceiptData[]): ValidatedAuditReport {
    return {
      suspiciousTransactions: [], duplicateCount: 0, unusualExpenses: [],
      taxIssues: [], missingReceipts: [], overallConfidence: 0,
      summary: `Basic heuristic audit of ${receipts.length} transactions.`,
      generatedAt: new Date().toISOString(),
    };
  }
}
