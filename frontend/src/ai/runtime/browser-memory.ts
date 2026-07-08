/**
 * Browser Memory Monitor
 *
 * Monitors browser memory usage to prevent OOM when loading
 * large AI models. Uses performance.memory (Chrome) and
 * navigator.deviceMemory as fallback signals.
 */

export interface MemoryInfo {
  usedHeapMB: number;
  totalHeapMB: number;
  deviceMemoryGB: number;
  isLowMemory: boolean;
  canLoadModelMB: number;
}

const LOW_MEMORY_THRESHOLD_MB = 200;
const MODEL_SAFETY_MARGIN = 1.3; // 30% overhead

export function getMemoryInfo(): MemoryInfo {
  let usedHeapMB = 0;
  let totalHeapMB = 0;
  let deviceMemoryGB = 4; // Conservative default

  try {
    if ('memory' in performance) {
      const mem = (performance as any).memory;
      usedHeapMB = (mem.usedJSHeapSize || 0) / 1024 / 1024;
      totalHeapMB = (mem.jsHeapSizeLimit || 0) / 1024 / 1024;
    }
  } catch { /* unsupported */ }

  try {
    const nav = navigator as any;
    if (nav.deviceMemory) {
      deviceMemoryGB = nav.deviceMemory;
    }
  } catch { /* unsupported */ }

  const availableMB = totalHeapMB > 0
    ? totalHeapMB - usedHeapMB
    : deviceMemoryGB * 1024 * 0.6; // Assume 60% available

  const isLowMemory = availableMB < LOW_MEMORY_THRESHOLD_MB;
  const canLoadModelMB = Math.max(0, availableMB / MODEL_SAFETY_MARGIN);

  return { usedHeapMB, totalHeapMB, deviceMemoryGB, isLowMemory, canLoadModelMB };
}

export function canLoadModel(modelSizeMB: number): boolean {
  const info = getMemoryInfo();
  return info.canLoadModelMB >= modelSizeMB;
}

export function formatMemory(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`;
}
