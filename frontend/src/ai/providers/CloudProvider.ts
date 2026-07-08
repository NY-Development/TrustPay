/**
 * CloudProvider — Server-Side Inference Provider
 *
 * Calls a configurable cloud endpoint for AI inference.
 * Same interface as every other provider — pages never know
 * whether inference is local or remote.
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
import { v4 as uuidv4 } from 'uuid';

const DEFAULT_TIMEOUT = 30_000;

export class CloudProvider extends BaseAIProvider {
  private _endpoint: string;
  private _apiKey: string;

  constructor(config?: Partial<AIProviderConfig>) {
    super({ type: 'cloud', ...config });
    this._endpoint = config?.endpoint || import.meta.env.VITE_AI_ENDPOINT || '';
    this._apiKey = config?.apiKey || import.meta.env.VITE_AI_API_KEY || '';
  }

  async initialize(): Promise<void> {
    this._status = 'ready';
    console.log('[CloudProvider] Initialized', this._endpoint ? `→ ${this._endpoint}` : '(no endpoint configured, heuristic mode)');
  }

  async dispose(): Promise<void> {
    this._status = 'disposed';
  }

  async generate(prompt: string, task: ModelTask, signal?: AbortSignal): Promise<InferenceResult> {
    const start = performance.now();
    const timeout = this._config.timeoutMs || DEFAULT_TIMEOUT;

    if (!this._endpoint) {
      // No cloud endpoint — return heuristic fallback marker
      return {
        requestId: uuidv4(),
        response: '',
        durationMs: 0,
        tokenCount: 0,
        truncated: false,
      };
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    const mergedSignal = signal || controller.signal;

    try {
      const res = await fetch(this._endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this._apiKey ? { Authorization: `Bearer ${this._apiKey}` } : {}),
        },
        body: JSON.stringify({ prompt, task, maxTokens: 2048 }),
        signal: mergedSignal,
      });

      clearTimeout(timeoutId);

      if (!res.ok) {
        throw new Error(`Cloud inference failed: ${res.status} ${res.statusText}`);
      }

      const data = await res.json();
      const durationMs = performance.now() - start;

      return {
        requestId: uuidv4(),
        response: typeof data.response === 'string' ? data.response : JSON.stringify(data),
        durationMs,
        tokenCount: data.tokenCount || 0,
        truncated: data.truncated || false,
      };
    } catch (err: any) {
      clearTimeout(timeoutId);
      if (err.name === 'AbortError') {
        throw new Error('Cloud inference timed out');
      }
      throw err;
    }
  }

  // ─── Structured Operations (with heuristic fallback) ─────────

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
        receipts.map(r => ({ merchant: r.merchant, total: r.total, category: r.category, date: r.date, currency: r.currency }))
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
        receipts.map(r => ({ referenceNumber: r.referenceNumber, merchant: r.merchant, total: r.total, category: r.category, date: r.date, bank: r.bank }))
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
    const fallback: ValidatedAnomalyReport = { anomalies: [], riskScore: 0, summary: 'Cloud unavailable.', generatedAt: new Date().toISOString() };
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
    if (!this._endpoint) {
      return { healthy: false, message: 'No cloud endpoint configured (VITE_AI_ENDPOINT)' };
    }
    try {
      const res = await fetch(this._endpoint, { method: 'HEAD', signal: AbortSignal.timeout(5000) });
      return { healthy: res.ok, message: res.ok ? 'Cloud endpoint reachable' : `Status ${res.status}` };
    } catch {
      return { healthy: false, message: 'Cloud endpoint unreachable' };
    }
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
      confidence: 0.5, referenceNumber, transactionNumber: referenceNumber, bank,
      senderName: null, receiverName: null,
    };
  }

  private _fallbackInsight(receipts: ValidatedReceiptData[]): ValidatedInsightReport {
    return {
      spendingTrends: [], recurringMerchants: [], budgetWarnings: [],
      monthlySummary: `Heuristic analysis of ${receipts.length} transactions.`,
      recommendations: ['Configure cloud endpoint for AI-powered insights.'],
      generatedAt: new Date().toISOString(),
    };
  }

  private _fallbackAudit(receipts: ValidatedReceiptData[]): ValidatedAuditReport {
    return {
      suspiciousTransactions: [], duplicateCount: 0, unusualExpenses: [],
      taxIssues: [], missingReceipts: [], overallConfidence: 0,
      summary: `Heuristic audit of ${receipts.length} transactions.`,
      generatedAt: new Date().toISOString(),
    };
  }
}
