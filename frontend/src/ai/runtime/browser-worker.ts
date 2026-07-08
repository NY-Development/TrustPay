/**
 * Browser Worker Bridge — Comlink Communication Layer
 *
 * Wraps Web Worker inference via Comlink to prevent UI blocking.
 * When the Gemma worker is available, inference runs off-thread.
 */
import { wrap, type Remote } from 'comlink';

export interface GemmaWorkerAPI {
  initialize(modelPath: string): Promise<boolean>;
  generate(prompt: string): Promise<string>;
  dispose(): Promise<void>;
  isReady(): Promise<boolean>;
}

let workerInstance: Worker | null = null;
let workerAPI: Remote<GemmaWorkerAPI> | null = null;

export async function getWorkerAPI(): Promise<Remote<GemmaWorkerAPI> | null> {
  if (workerAPI) return workerAPI;

  try {
    workerInstance = new Worker(
      new URL('../../workers/gemma.worker.ts', import.meta.url),
      { type: 'module' },
    );
    workerAPI = wrap<GemmaWorkerAPI>(workerInstance);
    return workerAPI;
  } catch (err) {
    console.warn('[BrowserWorker] Web Worker creation failed:', err);
    return null;
  }
}

export function terminateWorker(): void {
  if (workerInstance) {
    workerInstance.terminate();
    workerInstance = null;
    workerAPI = null;
    console.log('[BrowserWorker] Worker terminated');
  }
}

export function isWorkerAvailable(): boolean {
  return typeof Worker !== 'undefined';
}
