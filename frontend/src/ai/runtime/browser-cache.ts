/**
 * Browser Model Cache — IndexedDB Storage
 *
 * Stores downloaded model blobs, tokenizer data, prompt caches,
 * and metadata using IndexedDB via localforage.
 */
import localforage from 'localforage';
import type { CacheEntry, CacheStats } from '../types/model.types';

const STORE_NAME = 'trustpay-ai-cache';

const store = localforage.createInstance({
  name: STORE_NAME,
  storeName: 'models',
  description: 'TrustPay AI model and data cache',
});

const metaStore = localforage.createInstance({
  name: STORE_NAME,
  storeName: 'metadata',
  description: 'TrustPay AI cache metadata',
});

// ─── Public API ──────────────────────────────────────────────────

export async function cacheModel(
  modelId: string,
  data: ArrayBuffer,
  version: string,
  checksum?: string,
): Promise<void> {
  const entry: CacheEntry = {
    key: modelId,
    data,
    metadata: {
      modelId,
      version,
      checksum,
      createdAt: Date.now(),
      lastAccessedAt: Date.now(),
      sizeBytes: data.byteLength,
    },
  };
  await store.setItem(modelId, entry);
  console.log(`[BrowserCache] Cached model ${modelId} (${(data.byteLength / 1024 / 1024).toFixed(1)} MB)`);
}

export async function getCachedModel(modelId: string): Promise<CacheEntry | null> {
  const entry = await store.getItem<CacheEntry>(modelId);
  if (entry) {
    // Update last accessed time
    entry.metadata.lastAccessedAt = Date.now();
    await store.setItem(modelId, entry);
  }
  return entry;
}

export async function isCached(modelId: string): Promise<boolean> {
  const entry = await store.getItem<CacheEntry>(modelId);
  return entry !== null;
}

export async function deleteCachedModel(modelId: string): Promise<void> {
  await store.removeItem(modelId);
  console.log(`[BrowserCache] Deleted cached model ${modelId}`);
}

export async function clearAllCache(): Promise<void> {
  await store.clear();
  await metaStore.clear();
  console.log('[BrowserCache] All caches cleared');
}

export async function getCacheStats(): Promise<CacheStats> {
  const keys = await store.keys();
  let totalSize = 0;
  let oldest = Date.now();
  const modelIds: string[] = [];

  for (const key of keys) {
    const entry = await store.getItem<CacheEntry>(key);
    if (entry) {
      totalSize += entry.metadata.sizeBytes;
      oldest = Math.min(oldest, entry.metadata.createdAt);
      modelIds.push(entry.metadata.modelId);
    }
  }

  return {
    totalEntries: keys.length,
    totalSizeBytes: totalSize,
    oldestEntryAge: keys.length > 0 ? Date.now() - oldest : 0,
    modelsCached: modelIds,
  };
}

// ─── Prompt Cache ────────────────────────────────────────────────

export async function cachePromptResult(promptHash: string, result: string): Promise<void> {
  await metaStore.setItem(`prompt:${promptHash}`, {
    result,
    cachedAt: Date.now(),
  });
}

export async function getCachedPromptResult(promptHash: string): Promise<string | null> {
  const entry = await metaStore.getItem<{ result: string; cachedAt: number }>(`prompt:${promptHash}`);
  if (!entry) return null;

  // Expire after 1 hour
  if (Date.now() - entry.cachedAt > 60 * 60 * 1000) {
    await metaStore.removeItem(`prompt:${promptHash}`);
    return null;
  }

  return entry.result;
}

// ─── Storage Estimation ──────────────────────────────────────────

export async function estimateAvailableStorage(): Promise<{ used: number; quota: number }> {
  try {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      const est = await navigator.storage.estimate();
      return { used: est.usage || 0, quota: est.quota || 0 };
    }
  } catch { /* ignore */ }
  return { used: 0, quota: 0 };
}
