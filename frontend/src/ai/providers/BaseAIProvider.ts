/**
 * BaseAIProvider — Abstract Provider Interface
 *
 * Every AI provider (Gemma, Cloud, Mock, future LiteRT/MediaPipe)
 * must implement this contract. AIOrganizer delegates to whichever
 * provider is active — pages never know which one is running.
 */
import type {
  AIStatus,
  AIProviderConfig,
  InferenceResult,
  ModelTask,
} from '../types/model.types';
import type { ValidatedReceiptData } from '../types/receipt.types';
import type { ValidatedInsightReport } from '../types/analytics.types';
import type { ValidatedAuditReport, ValidatedAnomalyReport } from '../types/audit.types';

export abstract class BaseAIProvider {
  protected _status: AIStatus = 'uninitialized';
  protected _config: AIProviderConfig;

  constructor(config: AIProviderConfig) {
    this._config = config;
  }

  get status(): AIStatus {
    return this._status;
  }

  get providerType() {
    return this._config.type;
  }

  // ─── Lifecycle ───────────────────────────────────────────────

  /** Initialize runtime, download models, warm up caches */
  abstract initialize(): Promise<void>;

  /** Clean up all resources, unload models, close workers */
  abstract dispose(): Promise<void>;

  // ─── Core Inference ──────────────────────────────────────────

  /** Raw text generation from prompt */
  abstract generate(prompt: string, task: ModelTask, signal?: AbortSignal): Promise<InferenceResult>;

  // ─── Structured Operations ───────────────────────────────────

  /** Extract structured receipt data from OCR text */
  abstract extractReceipt(ocrText: string): Promise<ValidatedReceiptData>;

  /** Generate spending insights from receipt history */
  abstract generateInsights(receipts: ValidatedReceiptData[]): Promise<ValidatedInsightReport>;

  /** Generate audit report from receipt history */
  abstract generateAudit(receipts: ValidatedReceiptData[]): Promise<ValidatedAuditReport>;

  /** Categorize a single expense */
  abstract categorize(text: string): Promise<string>;

  /** Detect anomalies in receipt data */
  abstract detectAnomalies(receipts: ValidatedReceiptData[]): Promise<ValidatedAnomalyReport>;

  // ─── Health ──────────────────────────────────────────────────

  /** Check if provider is healthy and able to serve requests */
  abstract healthCheck(): Promise<{ healthy: boolean; message: string }>;
}
