/**
 * AIOrganizer — Central AI Service (Mobile / ExecuTorch)
 *
 * This is the single entry point for all AI operations.
 * No screen should directly call ExecuTorch — everything goes through here.
 *
 * Internally uses ExecuTorch LLM for inference, with a heuristic
 * fallback for offline/no-model scenarios.
 */
import type {
  IAIOrganizer,
  AIStatus,
  ReceiptData,
  InsightReport,
  AuditReport,
  AnomalyReport,
  ExpenseCategory,
  ReceiptItem,
} from './ai-types';
import {
  RECEIPT_EXTRACTION_PROMPT,
  INSIGHT_GENERATION_PROMPT,
  AUDIT_GENERATION_PROMPT,
  CATEGORIZATION_PROMPT,
  SUMMARIZATION_PROMPT,
  ANOMALY_DETECTION_PROMPT,
} from './prompt-templates';
import { queueRequest } from './local-model-server';
import { detectProvider } from '../utils/provider-detector';

// ─── Heuristic Fallback ──────────────────────────────────────────
// Preserved from the original ai-organizer.ts for offline/error modes

function runHeuristics(text: string): ReceiptData {
  const lower = text.toLowerCase();

  // Provider detection
  let bank = 'unknown';
  if (lower.includes('cbe') || lower.includes('commercial bank')) bank = 'cbe';
  else if (lower.includes('telebirr') || lower.includes('tele birr')) bank = 'telebirr';
  else if (lower.includes('abyssinia') || lower.includes('boa')) bank = 'boa';
  else if (lower.includes('dashen') || lower.includes('amole')) bank = 'dashen';
  else if (lower.includes('awash')) bank = 'awash';
  else if (lower.includes('siinqee')) bank = 'siinqee';
  else if (lower.includes('mpesa') || lower.includes('m-pesa')) bank = 'mpesa';
  else if (lower.includes('kaafi')) bank = 'kaafiebirr';

  // Reference number
  let referenceNumber: string | null = null;
  const refMatches =
    text.match(/\b(FT[A-Z0-9]{8,15})|(0[0-9]{9})\b/i) ||
    text.match(/\b(TXN[A-Z0-9]{8,15})\b/i) ||
    text.match(/\b([A-Z0-9]{10,12})\b/);
  if (refMatches) {
    referenceNumber = refMatches[0].trim();
  }

  // Amount
  let total: number | null = null;
  const amountMatch =
    text.match(/[\d,]+\.\d{2}/) || text.match(/amount\s*:\s*([\d,]+)/i);
  if (amountMatch) {
    const rawVal = amountMatch[1] || amountMatch[0];
    const cleaned = parseFloat(rawVal.replace(/,/g, ''));
    if (!isNaN(cleaned)) total = cleaned;
  }

  // Provider detection fallback
  if (bank === 'unknown' && referenceNumber) {
    bank = detectProvider(referenceNumber);
  }

  return {
    merchant: null,
    date: null,
    subtotal: null,
    tax: null,
    vat: null,
    total,
    currency: 'ETB',
    paymentMethod: null,
    items: [],
    category: 'other',
    confidence: 0.4,
    referenceNumber,
    transactionNumber: referenceNumber,
    bank,
    senderName: null,
    receiverName: null,
  };
}

// ─── JSON Parser Helper ──────────────────────────────────────────

function parseJsonResponse<T>(response: string, fallback: T): T {
  try {
    // Find JSON in the response (models sometimes add extra text)
    const start = response.indexOf('{');
    const end = response.lastIndexOf('}');
    if (start !== -1 && end !== -1 && end > start) {
      const jsonStr = response.slice(start, end + 1);
      return JSON.parse(jsonStr);
    }

    // Try array format
    const arrStart = response.indexOf('[');
    const arrEnd = response.lastIndexOf(']');
    if (arrStart !== -1 && arrEnd !== -1 && arrEnd > arrStart) {
      const jsonStr = response.slice(arrStart, arrEnd + 1);
      return JSON.parse(jsonStr);
    }

    return fallback;
  } catch {
    return fallback;
  }
}

// ─── AIOrganizer Class ───────────────────────────────────────────

export class AIOrganizer implements IAIOrganizer {
  private _status: AIStatus = 'uninitialized';
  private _generateFn: ((prompt: string) => Promise<string>) | null = null;

  get status(): AIStatus {
    return this._status;
  }

  /**
   * Set the LLM generate function.
   * Called by AIProvider when the ExecuTorch hook is ready.
   */
  setGenerateFunction(fn: (prompt: string) => Promise<string>): void {
    this._generateFn = fn;
    this._status = 'ready';
  }

  setStatus(status: AIStatus): void {
    this._status = status;
  }

  async initialize(): Promise<void> {
    // Initialization is handled by AIProvider mounting the ExecuTorch hook.
    // This is a no-op for imperative callers.
    if (this._generateFn) {
      this._status = 'ready';
    }
  }

  // ─── Receipt Extraction ──────────────────────────────────────

  async extractReceiptData(ocrText: string): Promise<ReceiptData> {
    if (!this._generateFn || this._status !== 'ready') {
      console.log('[AIOrganizer] Using heuristic fallback (model not ready)');
      return runHeuristics(ocrText);
    }

    try {
      const prompt = RECEIPT_EXTRACTION_PROMPT + ocrText;
      const { promise } = queueRequest(prompt, this._generateFn);
      const response = await promise;

      const parsed = parseJsonResponse<Partial<ReceiptData>>(response, {});

      // Merge AI result with sensible defaults
      return {
        merchant: parsed.merchant || null,
        date: parsed.date || null,
        subtotal: parsed.subtotal ?? null,
        tax: parsed.tax ?? null,
        vat: parsed.vat ?? null,
        total: parsed.total ?? null,
        currency: parsed.currency || 'ETB',
        paymentMethod: parsed.paymentMethod || null,
        items: Array.isArray(parsed.items) ? parsed.items : [],
        category: parsed.category || 'other',
        confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 0.7,
        referenceNumber: parsed.referenceNumber || null,
        transactionNumber: parsed.transactionNumber || null,
        bank: parsed.bank || 'unknown',
        senderName: parsed.senderName || null,
        receiverName: parsed.receiverName || null,
      };
    } catch (error) {
      console.warn('[AIOrganizer] Extraction failed, falling back to heuristics:', error);
      return runHeuristics(ocrText);
    }
  }

  // ─── Insights ────────────────────────────────────────────────

  async generateInsights(receipts: ReceiptData[]): Promise<InsightReport> {
    const fallback: InsightReport = {
      spendingTrends: [],
      recurringMerchants: [],
      budgetWarnings: [],
      monthlySummary: 'Insufficient data for AI-generated insights.',
      recommendations: ['Continue recording receipts for more accurate analysis.'],
      generatedAt: new Date().toISOString(),
    };

    if (!this._generateFn || this._status !== 'ready' || receipts.length === 0) {
      return fallback;
    }

    try {
      const dataStr = JSON.stringify(
        receipts.map((r) => ({
          merchant: r.merchant,
          total: r.total,
          category: r.category,
          date: r.date,
          currency: r.currency,
        })),
      );
      const prompt = INSIGHT_GENERATION_PROMPT + dataStr;
      const { promise } = queueRequest(prompt, this._generateFn);
      const response = await promise;

      const parsed = parseJsonResponse<Partial<InsightReport>>(response, {});

      return {
        spendingTrends: Array.isArray(parsed.spendingTrends) ? parsed.spendingTrends : [],
        recurringMerchants: Array.isArray(parsed.recurringMerchants)
          ? parsed.recurringMerchants
          : [],
        budgetWarnings: Array.isArray(parsed.budgetWarnings) ? parsed.budgetWarnings : [],
        monthlySummary: parsed.monthlySummary || fallback.monthlySummary,
        recommendations: Array.isArray(parsed.recommendations)
          ? parsed.recommendations
          : fallback.recommendations,
        generatedAt: new Date().toISOString(),
      };
    } catch (error) {
      console.warn('[AIOrganizer] Insight generation failed:', error);
      return fallback;
    }
  }

  // ─── Audit ───────────────────────────────────────────────────

  async generateAudit(receipts: ReceiptData[]): Promise<AuditReport> {
    const fallback: AuditReport = {
      suspiciousTransactions: [],
      duplicateCount: 0,
      unusualExpenses: [],
      taxIssues: [],
      missingReceipts: [],
      overallConfidence: 0,
      summary: 'Insufficient data for AI-generated audit.',
      generatedAt: new Date().toISOString(),
    };

    if (!this._generateFn || this._status !== 'ready' || receipts.length === 0) {
      return fallback;
    }

    try {
      const dataStr = JSON.stringify(
        receipts.map((r) => ({
          referenceNumber: r.referenceNumber,
          merchant: r.merchant,
          total: r.total,
          category: r.category,
          date: r.date,
          bank: r.bank,
        })),
      );
      const prompt = AUDIT_GENERATION_PROMPT + dataStr;
      const { promise } = queueRequest(prompt, this._generateFn);
      const response = await promise;

      const parsed = parseJsonResponse<Partial<AuditReport>>(response, {});

      return {
        suspiciousTransactions: Array.isArray(parsed.suspiciousTransactions)
          ? parsed.suspiciousTransactions
          : [],
        duplicateCount: parsed.duplicateCount ?? 0,
        unusualExpenses: Array.isArray(parsed.unusualExpenses) ? parsed.unusualExpenses : [],
        taxIssues: Array.isArray(parsed.taxIssues) ? parsed.taxIssues : [],
        missingReceipts: Array.isArray(parsed.missingReceipts) ? parsed.missingReceipts : [],
        overallConfidence: parsed.overallConfidence ?? 0,
        summary: parsed.summary || fallback.summary,
        generatedAt: new Date().toISOString(),
      };
    } catch (error) {
      console.warn('[AIOrganizer] Audit generation failed:', error);
      return fallback;
    }
  }

  // ─── Categorization ──────────────────────────────────────────

  async categorizeExpense(text: string): Promise<ExpenseCategory> {
    if (!this._generateFn || this._status !== 'ready') {
      return 'other';
    }

    try {
      const prompt = CATEGORIZATION_PROMPT + text;
      const { promise } = queueRequest(prompt, this._generateFn);
      const response = await promise;
      const parsed = parseJsonResponse<{ category?: ExpenseCategory }>(response, {});
      return parsed.category || 'other';
    } catch {
      return 'other';
    }
  }

  // ─── Summarization ──────────────────────────────────────────

  async summarizeDocument(text: string): Promise<string> {
    if (!this._generateFn || this._status !== 'ready') {
      return 'AI model not available for summarization.';
    }

    try {
      const prompt = SUMMARIZATION_PROMPT + text;
      const { promise } = queueRequest(prompt, this._generateFn);
      const response = await promise;
      const parsed = parseJsonResponse<{ summary?: string }>(response, {});
      return parsed.summary || 'Unable to generate summary.';
    } catch {
      return 'Summarization failed.';
    }
  }

  // ─── Anomaly Detection ───────────────────────────────────────

  async detectAnomalies(receipts: ReceiptData[]): Promise<AnomalyReport> {
    const fallback: AnomalyReport = {
      anomalies: [],
      riskScore: 0,
      summary: 'Insufficient data for anomaly detection.',
      generatedAt: new Date().toISOString(),
    };

    if (!this._generateFn || this._status !== 'ready' || receipts.length === 0) {
      return fallback;
    }

    try {
      const dataStr = JSON.stringify(
        receipts.map((r) => ({
          referenceNumber: r.referenceNumber,
          merchant: r.merchant,
          total: r.total,
          category: r.category,
          date: r.date,
        })),
      );
      const prompt = ANOMALY_DETECTION_PROMPT + dataStr;
      const { promise } = queueRequest(prompt, this._generateFn);
      const response = await promise;

      const parsed = parseJsonResponse<Partial<AnomalyReport>>(response, {});

      return {
        anomalies: Array.isArray(parsed.anomalies) ? parsed.anomalies : [],
        riskScore: parsed.riskScore ?? 0,
        summary: parsed.summary || fallback.summary,
        generatedAt: new Date().toISOString(),
      };
    } catch (error) {
      console.warn('[AIOrganizer] Anomaly detection failed:', error);
      return fallback;
    }
  }
}

// ─── Singleton Instance ──────────────────────────────────────────

export const aiOrganizer = new AIOrganizer();

// Re-export heuristics for backward compat
export { runHeuristics };
