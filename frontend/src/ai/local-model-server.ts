/**
 * Browser AI Runtime Manager (formerly local-model-server)
 *
 * Manages the browser-side AI runtime lifecycle.
 * Exposes init, warm, queue, cancel, unload, and memory monitoring.
 * Used internally by GemmaProvider; not imported by pages.
 */
import type { AIStatus, RuntimeMetrics, InferenceRequest } from './types/model.types';
import { BrowserAIRuntime } from './runtime/gemma-runtime';
import { getMemoryInfo, canLoadModel } from './runtime/browser-memory';
// ─── Singleton Runtime ───────────────────────────────────────────

const runtime = new BrowserAIRuntime();

export async function initRuntime(): Promise<void> {
  await runtime.initialize();
}

export async function warmModel(): Promise<void> {
  await runtime.warmModel();
}

export async function unloadModel(): Promise<void> {
  await runtime.unloadModel();
}

export async function getMemoryUsage(): Promise<{ used: number; total: number }> {
  return runtime.getMemoryUsage();
}

export function getMetrics(): RuntimeMetrics {
  return runtime.metrics;
}

export function isRuntimeReady(): boolean {
  return runtime.isReady;
}

export function isGenerating(): boolean {
  return runtime.isGenerating;
}

/**
 * Queue an inference request.
 * Returns a promise that resolves with the generated text.
 */
export async function queueInference(prompt: string, signal?: AbortSignal): Promise<string> {
  return runtime.runInference(prompt, signal);
}

/**
 * Cancel a queued inference request.
 */
export function cancelInference(requestId: string): void {
  runtime.cancelRequest(requestId);
}

/**
 * Check if the browser can load a model of the given size (MB).
 */
export function canLoadModelOfSize(sizeMB: number): boolean {
  return canLoadModel(sizeMB);
}

/**
 * Get browser memory information.
 */
export function getBrowserMemory() {
  return getMemoryInfo();
}

/**
 * Dispose the runtime completely.
 */
export async function disposeRuntime(): Promise<void> {
  await runtime.dispose();
}
