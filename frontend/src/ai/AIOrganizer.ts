/**
 * AIOrganizer — Provider-Agnostic AI Orchestrator
 *
 * The ONLY public AI API. No page should import providers,
 * runtime classes, or parsers directly. Everything goes
 * through AIOrganizer.
 *
 * Internally selects and delegates to the configured provider.
 */
import type { AIProviderType, AIStatus } from './types/model.types';
import type { ValidatedReceiptData } from './types/receipt.types';
import type { ValidatedInsightReport } from './types/analytics.types';
import type { ValidatedAuditReport, ValidatedAnomalyReport } from './types/audit.types';
import type { IAIOrganizer, ExpenseCategory } from './ai-types';
import { BaseAIProvider } from './providers/BaseAIProvider';
import { MockProvider } from './providers/MockProvider';
import { CloudProvider } from './providers/CloudProvider';
import { GemmaProvider } from './providers/GemmaProvider';

// ─── Provider Factory ────────────────────────────────────────────

function createProvider(type: AIProviderType): BaseAIProvider {
  switch (type) {
    case 'gemma':
      return new GemmaProvider();
    case 'cloud':
      return new CloudProvider();
    case 'mock':
    default:
      return new MockProvider();
  }
}

// ─── AIOrganizer Class ───────────────────────────────────────────

export class AIOrganizer implements IAIOrganizer {
  private _provider: BaseAIProvider;
  private _status: AIStatus = 'uninitialized';

  constructor(providerType: AIProviderType = 'mock') {
    this._provider = createProvider(providerType);
  }

  get status(): AIStatus {
    return this._status;
  }

  get providerType(): AIProviderType {
    return this._provider.providerType;
  }

  // ─── Lifecycle ───────────────────────────────────────────────

  async initialize(): Promise<void> {
    try {
      this._status = 'loading';
      await this._provider.initialize();
      this._status = this._provider.status === 'error' ? 'error' : 'ready';
      console.log(`[AIOrganizer] Initialized with ${this._provider.providerType} provider (status: ${this._status})`);
    } catch (err: any) {
      this._status = 'error';
      console.error('[AIOrganizer] Initialization failed:', err.message);
    }
  }

  async dispose(): Promise<void> {
    await this._provider.dispose();
    this._status = 'disposed';
  }

  /** Hot-swap the active provider at runtime */
  async switchProvider(type: AIProviderType): Promise<void> {
    console.log(`[AIOrganizer] Switching provider: ${this._provider.providerType} → ${type}`);
    await this._provider.dispose();
    this._provider = createProvider(type);
    await this.initialize();
  }

  // ─── Public API ──────────────────────────────────────────────

  async extractReceiptData(ocrText: string): Promise<ValidatedReceiptData> {
    this._ensureReady();
    return this._provider.extractReceipt(ocrText);
  }

  async generateInsights(receipts: ValidatedReceiptData[]): Promise<ValidatedInsightReport> {
    this._ensureReady();
    return this._provider.generateInsights(receipts);
  }

  async generateAudit(receipts: ValidatedReceiptData[]): Promise<ValidatedAuditReport> {
    this._ensureReady();
    return this._provider.generateAudit(receipts);
  }

  async categorizeExpense(text: string): Promise<ExpenseCategory> {
    this._ensureReady();
    return (await this._provider.categorize(text)) as ExpenseCategory;
  }

  async summarizeDocument(text: string): Promise<string> {
    this._ensureReady();
    const result = await this._provider.generate(text, 'summarization');
    if (!result.response) return 'Summarization unavailable.';
    try {
      const parsed = JSON.parse(result.response);
      return parsed.summary || result.response;
    } catch {
      return result.response;
    }
  }

  async detectAnomalies(receipts: ValidatedReceiptData[]): Promise<ValidatedAnomalyReport> {
    this._ensureReady();
    return this._provider.detectAnomalies(receipts);
  }

  async healthCheck(): Promise<{ healthy: boolean; message: string }> {
    return this._provider.healthCheck();
  }

  // ─── Private ─────────────────────────────────────────────────

  private _ensureReady(): void {
    // Allow requests even if not fully ready — providers have fallbacks
    if (this._status === 'disposed') {
      throw new Error('AIOrganizer has been disposed');
    }
  }
}

// ─── Default Instance ────────────────────────────────────────────
// The default is created as 'mock'; AIProvider will replace it.

export const aiOrganizer = new AIOrganizer('mock');
