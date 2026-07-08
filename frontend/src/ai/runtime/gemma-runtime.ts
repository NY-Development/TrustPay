/**
 * Browser AI Runtime Manager
 *
 * Manages the lifecycle of a browser-based AI inference engine.
 * Handles initialization, request queuing, concurrency protection,
 * memory monitoring, and graceful shutdown.
 *
 * Currently provides the infrastructure shell for Google AI Edge /
 * Gemma browser integration. When the SDK becomes available,
 * _loadEngine() and _runInference() will be updated.
 */
import type { RuntimeMetrics, InferenceRequest } from '../types/model.types';
import { v4 as uuidv4 } from 'uuid';

const MAX_CONCURRENT = 1;
const INFERENCE_TIMEOUT_MS = 60_000;
const IDLE_UNLOAD_MS = 5 * 60_000; // 5 minutes

interface QueueEntry {
  request: InferenceRequest;
  resolve: (value: string) => void;
  reject: (reason: Error) => void;
}

export class BrowserAIRuntime {
  private _isReady = false;
  private _isGenerating = false;
  private _queue: QueueEntry[] = [];
  private _engine: any = null; // Future: google-ai-edge LlmInference
  private _idleTimer: ReturnType<typeof setTimeout> | null = null;
  private _metrics: RuntimeMetrics = {
    memoryUsedBytes: 0,
    memoryTotalBytes: 0,
    queueLength: 0,
    avgInferenceMs: 0,
    isGenerating: false,
  };
  private _inferenceTimes: number[] = [];

  get isReady() { return this._isReady; }
  get isGenerating() { return this._isGenerating; }
  get metrics() { return { ...this._metrics, queueLength: this._queue.length }; }

  async initialize(): Promise<void> {
    try {
      await this._loadEngine();
      this._isReady = true;
      this._resetIdleTimer();
      console.log('[BrowserAIRuntime] Engine initialized');
    } catch (err: any) {
      console.warn('[BrowserAIRuntime] Engine load failed:', err.message);
      this._isReady = false;
    }
  }

  async dispose(): Promise<void> {
    this._clearIdleTimer();
    this._queue.forEach(entry => entry.reject(new Error('Runtime disposed')));
    this._queue = [];
    this._engine = null;
    this._isReady = false;
    this._isGenerating = false;
    console.log('[BrowserAIRuntime] Disposed');
  }

  async runInference(prompt: string, signal?: AbortSignal): Promise<string> {
    if (!this._isReady) throw new Error('Runtime not ready');

    return new Promise<string>((resolve, reject) => {
      const request: InferenceRequest = {
        id: uuidv4(),
        prompt,
        task: 'general',
        signal,
        createdAt: Date.now(),
      };

      this._queue.push({ request, resolve, reject });
      this._processQueue();
    });
  }

  cancelRequest(requestId: string): void {
    const idx = this._queue.findIndex(e => e.request.id === requestId);
    if (idx >= 0) {
      this._queue[idx].reject(new Error('Cancelled'));
      this._queue.splice(idx, 1);
    }
  }

  async warmModel(): Promise<void> {
    if (!this._isReady) await this.initialize();
    this._resetIdleTimer();
  }

  async unloadModel(): Promise<void> {
    this._engine = null;
    this._isReady = false;
    this._clearIdleTimer();
    console.log('[BrowserAIRuntime] Model unloaded');
  }

  async getMemoryUsage(): Promise<{ used: number; total: number }> {
    try {
      if ('memory' in performance) {
        const mem = (performance as any).memory;
        return { used: mem.usedJSHeapSize || 0, total: mem.jsHeapSizeLimit || 0 };
      }
      const nav = navigator as any;
      const deviceMem = nav.deviceMemory ? nav.deviceMemory * 1024 * 1024 * 1024 : 0;
      return { used: 0, total: deviceMem };
    } catch {
      return { used: 0, total: 0 };
    }
  }

  // ─── Private ─────────────────────────────────────────────────

  private async _loadEngine(): Promise<void> {
    // Future: import and instantiate Google AI Edge LlmInference
    // const { LlmInference } = await import('@anthropic/...');
    // this._engine = await LlmInference.createFromModelPath(modelPath);
    //
    // For now, the engine remains null (heuristic fallback mode).
    this._engine = null;
  }

  private async _processQueue(): Promise<void> {
    if (this._isGenerating || this._queue.length === 0) return;

    this._isGenerating = true;
    this._metrics.isGenerating = true;
    const entry = this._queue.shift()!;

    try {
      const start = performance.now();

      // Check abort signal
      if (entry.request.signal?.aborted) {
        throw new Error('Aborted');
      }

      // Set up timeout
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Inference timeout')), INFERENCE_TIMEOUT_MS)
      );

      const inferencePromise = this._executeInference(entry.request.prompt);
      const result = await Promise.race([inferencePromise, timeoutPromise]);

      const durationMs = performance.now() - start;
      this._inferenceTimes.push(durationMs);
      if (this._inferenceTimes.length > 20) this._inferenceTimes.shift();
      this._metrics.avgInferenceMs = this._inferenceTimes.reduce((a, b) => a + b, 0) / this._inferenceTimes.length;

      entry.resolve(result);
    } catch (err: any) {
      entry.reject(err);
    } finally {
      this._isGenerating = false;
      this._metrics.isGenerating = false;
      this._resetIdleTimer();

      // Process next in queue
      if (this._queue.length > 0) {
        this._processQueue();
      }
    }
  }

  private async _executeInference(prompt: string): Promise<string> {
    if (!this._engine) {
      // No engine loaded — return empty for heuristic fallback
      return '';
    }

    // Future: return await this._engine.generateResponse(prompt);
    return '';
  }

  private _resetIdleTimer(): void {
    this._clearIdleTimer();
    this._idleTimer = setTimeout(() => {
      if (!this._isGenerating && this._queue.length === 0) {
        console.log('[BrowserAIRuntime] Idle timeout, unloading model');
        this.unloadModel();
      }
    }, IDLE_UNLOAD_MS);
  }

  private _clearIdleTimer(): void {
    if (this._idleTimer) {
      clearTimeout(this._idleTimer);
      this._idleTimer = null;
    }
  }
}
