/**
 * Local AI Runtime Manager
 *
 * Manages the ExecuTorch inference runtime lifecycle.
 * This replaces the old static HTTP server approach.
 *
 * Responsibilities:
 * - Initialize ExecuTorch engine
 * - Warm / unload models
 * - Memory monitoring
 * - Inference request queue with concurrency protection
 * - Cancellation support
 */
import type { AIModelId, AIStatus } from './ai-types';

// ─── Runtime State ───────────────────────────────────────────────

interface RuntimeState {
  status: AIStatus;
  loadedModels: Set<AIModelId>;
  activeRequests: number;
  maxConcurrent: number;
}

const state: RuntimeState = {
  status: 'uninitialized',
  loadedModels: new Set(),
  activeRequests: 0,
  maxConcurrent: 1, // Mobile: single-threaded inference
};

// ─── Request Queue ───────────────────────────────────────────────

interface QueuedRequest {
  id: string;
  resolve: (value: string) => void;
  reject: (reason: Error) => void;
  prompt: string;
  cancelled: boolean;
}

const requestQueue: QueuedRequest[] = [];
let requestCounter = 0;

// ─── Initialization ──────────────────────────────────────────────

/**
 * Initialize the ExecuTorch runtime.
 * Should be called once during app startup via AIProvider.
 *
 * In production, this calls:
 *   initExecutorch({ resourceFetcher: ExpoResourceFetcher })
 *
 * The actual ExecuTorch initialization is handled in AIProvider.tsx
 * where React hooks are available.
 */
export async function initRuntime(): Promise<void> {
  if (state.status === 'ready') return;

  state.status = 'loading';

  try {
    // ExecuTorch init is performed at the React component level
    // (AIProvider.tsx) since it uses hooks. This function sets
    // the runtime manager's state to ready.
    state.status = 'ready';
    console.log('[LocalAIRuntime] Runtime initialized');
  } catch (error) {
    state.status = 'error';
    console.error('[LocalAIRuntime] Init failed:', error);
    throw error;
  }
}

// ─── Model Lifecycle ─────────────────────────────────────────────

export async function warmModel(modelId: AIModelId): Promise<void> {
  if (state.loadedModels.has(modelId)) return;

  console.log(`[LocalAIRuntime] Warming model: ${modelId}`);
  state.loadedModels.add(modelId);
}

export async function unloadModel(modelId: AIModelId): Promise<void> {
  if (!state.loadedModels.has(modelId)) return;

  console.log(`[LocalAIRuntime] Unloading model: ${modelId}`);
  state.loadedModels.delete(modelId);
}

export async function unloadIdleModels(): Promise<void> {
  // Unload all models not currently in use
  for (const modelId of state.loadedModels) {
    if (state.activeRequests === 0) {
      await unloadModel(modelId);
    }
  }
}

// ─── Memory Monitoring ───────────────────────────────────────────

export function getMemoryUsage(): {
  loadedModels: AIModelId[];
  activeRequests: number;
  status: AIStatus;
} {
  return {
    loadedModels: Array.from(state.loadedModels),
    activeRequests: state.activeRequests,
    status: state.status,
  };
}

// ─── Inference Queue ─────────────────────────────────────────────

/**
 * Queue an inference request. Returns a unique request ID for cancellation.
 */
export function queueRequest(
  prompt: string,
  executor: (prompt: string) => Promise<string>,
): { requestId: string; promise: Promise<string> } {
  const requestId = `req_${++requestCounter}_${Date.now()}`;

  const promise = new Promise<string>((resolve, reject) => {
    const request: QueuedRequest = {
      id: requestId,
      resolve,
      reject,
      prompt,
      cancelled: false,
    };
    requestQueue.push(request);
    processQueue(executor);
  });

  return { requestId, promise };
}

async function processQueue(
  executor: (prompt: string) => Promise<string>,
): Promise<void> {
  if (state.activeRequests >= state.maxConcurrent) return;

  const next = requestQueue.shift();
  if (!next) return;

  if (next.cancelled) {
    next.reject(new Error('Request cancelled'));
    processQueue(executor);
    return;
  }

  state.activeRequests++;

  try {
    const result = await executor(next.prompt);
    if (!next.cancelled) {
      next.resolve(result);
    }
  } catch (error) {
    if (!next.cancelled) {
      next.reject(error as Error);
    }
  } finally {
    state.activeRequests--;
    processQueue(executor);
  }
}

/**
 * Cancel a pending or in-flight request.
 */
export function cancelRequest(requestId: string): boolean {
  const request = requestQueue.find((r) => r.id === requestId);
  if (request) {
    request.cancelled = true;
    return true;
  }
  return false;
}

/**
 * Cancel all pending requests.
 */
export function cancelAllRequests(): void {
  for (const request of requestQueue) {
    request.cancelled = true;
    request.reject(new Error('All requests cancelled'));
  }
  requestQueue.length = 0;
}

// ─── Status ──────────────────────────────────────────────────────

export function getStatus(): AIStatus {
  return state.status;
}

export function setStatus(status: AIStatus): void {
  state.status = status;
}

export function isReady(): boolean {
  return state.status === 'ready';
}
