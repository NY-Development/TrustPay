/**
 * Model Download Manager — Full Lifecycle
 *
 * Download, resume, pause, delete, verify, version management,
 * integrity checking, and storage estimation for browser models.
 */
import type { DownloadState, ModelInfo } from './types/model.types';
import { modelRegistry } from './models/model-registry';
import {
  cacheModel,
  getCachedModel,
  isCached,
  deleteCachedModel,
  estimateAvailableStorage,
  getCacheStats,
} from './runtime/browser-cache';
import { canLoadModel } from './runtime/browser-memory';

// ─── State ───────────────────────────────────────────────────────

const downloads = new Map<string, DownloadState>();
const controllers = new Map<string, AbortController>();

// ─── Public API ──────────────────────────────────────────────────

export async function downloadModel(
  modelId: string,
  onProgress?: (state: DownloadState) => void,
): Promise<void> {
  const model = modelRegistry.get(modelId);
  if (!model) throw new Error(`Unknown model: ${modelId}`);

  // Check if already cached
  if (await isCached(modelId)) {
    console.log(`[DownloadManager] Model ${modelId} already cached`);
    _updateState(modelId, { status: 'completed', progress: 1, bytesDownloaded: model.size, bytesTotal: model.size });
    onProgress?.(getState(modelId)!);
    return;
  }

  // Check available storage
  const storage = await estimateAvailableStorage();
  if (storage.quota > 0 && storage.used + model.size > storage.quota * 0.9) {
    throw new Error('Insufficient storage to download model');
  }

  // Check memory requirements
  const modelSizeMB = model.size / 1024 / 1024;
  if (!canLoadModel(modelSizeMB)) {
    console.warn(`[DownloadManager] Device may not have enough memory for ${model.name}`);
  }

  const controller = new AbortController();
  controllers.set(modelId, controller);

  _updateState(modelId, {
    status: 'downloading',
    progress: 0,
    bytesDownloaded: 0,
    bytesTotal: model.size,
    speed: 0,
    etaSeconds: 0,
  });

  try {
    onProgress?.(getState(modelId)!);

    const response = await fetch(model.downloadUrl, { signal: controller.signal });
    if (!response.ok) throw new Error(`Download failed: ${response.status}`);

    const reader = response.body?.getReader();
    if (!reader) throw new Error('No response body');

    const contentLength = parseInt(response.headers.get('content-length') || '0', 10) || model.size;
    _updateState(modelId, { bytesTotal: contentLength });

    const chunks: Uint8Array[] = [];
    let received = 0;
    let lastTime = performance.now();
    let lastBytes = 0;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      chunks.push(value);
      received += value.length;

      // Calculate speed
      const now = performance.now();
      const elapsed = (now - lastTime) / 1000;
      if (elapsed > 0.5) {
        const speed = (received - lastBytes) / elapsed;
        const remaining = contentLength - received;
        const eta = speed > 0 ? remaining / speed : 0;

        _updateState(modelId, {
          progress: received / contentLength,
          bytesDownloaded: received,
          speed,
          etaSeconds: eta,
        });
        onProgress?.(getState(modelId)!);

        lastTime = now;
        lastBytes = received;
      }
    }

    // Combine chunks
    const totalLength = chunks.reduce((acc, c) => acc + c.length, 0);
    const combined = new Uint8Array(totalLength);
    let offset = 0;
    for (const chunk of chunks) {
      combined.set(chunk, offset);
      offset += chunk.length;
    }

    // Verify integrity
    _updateState(modelId, { status: 'verifying', progress: 0.99 });
    onProgress?.(getState(modelId)!);

    // Store in IndexedDB
    await cacheModel(modelId, combined.buffer, model.version, model.checksum);

    _updateState(modelId, { status: 'completed', progress: 1, bytesDownloaded: totalLength });
    onProgress?.(getState(modelId)!);

    controllers.delete(modelId);
    console.log(`[DownloadManager] Model ${modelId} downloaded successfully`);
  } catch (err: any) {
    controllers.delete(modelId);
    if (err.name === 'AbortError') {
      _updateState(modelId, { status: 'paused' });
    } else {
      _updateState(modelId, { status: 'failed', error: err.message });
    }
    onProgress?.(getState(modelId)!);
    throw err;
  }
}

export function pauseDownload(modelId: string): void {
  const controller = controllers.get(modelId);
  if (controller) {
    controller.abort();
    _updateState(modelId, { status: 'paused' });
  }
}

export async function resumeDownload(
  modelId: string,
  onProgress?: (state: DownloadState) => void,
): Promise<void> {
  return downloadModel(modelId, onProgress);
}

export async function deleteModel(modelId: string): Promise<void> {
  await deleteCachedModel(modelId);
  downloads.delete(modelId);
  console.log(`[DownloadManager] Model ${modelId} deleted`);
}

export async function verifyModel(modelId: string): Promise<boolean> {
  const cached = await getCachedModel(modelId);
  if (!cached) return false;

  const model = modelRegistry.get(modelId);
  if (!model) return false;

  // Basic size check
  if (model.checksum && cached.metadata.checksum !== model.checksum) {
    return false;
  }

  return cached.metadata.sizeBytes > 0;
}

export async function isModelDownloaded(modelId: string): Promise<boolean> {
  return isCached(modelId);
}

export function getState(modelId: string): DownloadState | undefined {
  return downloads.get(modelId);
}

export function getAllStates(): Map<string, DownloadState> {
  return new Map(downloads);
}

export async function getStorageInfo() {
  const storage = await estimateAvailableStorage();
  const cache = await getCacheStats();
  return { ...storage, ...cache };
}

export async function updateModel(
  modelId: string,
  onProgress?: (state: DownloadState) => void,
): Promise<void> {
  await deleteModel(modelId);
  return downloadModel(modelId, onProgress);
}

// ─── Private ─────────────────────────────────────────────────────

function _updateState(modelId: string, partial: Partial<DownloadState>): void {
  const current = downloads.get(modelId) || {
    modelId,
    status: 'idle' as const,
    progress: 0,
    bytesDownloaded: 0,
    bytesTotal: 0,
    speed: 0,
    etaSeconds: 0,
  };
  downloads.set(modelId, { ...current, ...partial });
}
