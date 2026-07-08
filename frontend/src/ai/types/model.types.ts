/**
 * Model & Provider Type Definitions
 *
 * Core interfaces for the provider-based AI architecture.
 * No provider-specific code belongs here.
 */

// ─── Provider Types ──────────────────────────────────────────────

export type AIProviderType = 'gemma' | 'cloud' | 'mock';

export type AIStatus =
  | 'uninitialized'
  | 'loading'
  | 'downloading'
  | 'ready'
  | 'error'
  | 'disposed';

export interface AIProviderConfig {
  type: AIProviderType;
  /** Cloud endpoint URL (only for CloudProvider) */
  endpoint?: string;
  /** API key for cloud authentication */
  apiKey?: string;
  /** Default model ID to use */
  defaultModel?: string;
  /** Max inference timeout in ms */
  timeoutMs?: number;
  /** Enable debug logging */
  debug?: boolean;
}

// ─── Model Types ─────────────────────────────────────────────────

export type ModelStatus =
  | 'not_downloaded'
  | 'downloading'
  | 'paused'
  | 'downloaded'
  | 'loading'
  | 'ready'
  | 'error';

export type ModelTask =
  | 'receipt-extraction'
  | 'insight-generation'
  | 'audit-generation'
  | 'categorization'
  | 'summarization'
  | 'anomaly-detection'
  | 'general';

export type QuantizationType = 'f32' | 'f16' | 'int8' | 'int4';

export interface ModelInfo {
  id: string;
  name: string;
  family: string;
  variant: string;
  /** Size in bytes */
  size: number;
  /** Max token context window */
  contextWindow: number;
  quantization: QuantizationType;
  tasks: ModelTask[];
  /** HuggingFace or CDN URL */
  downloadUrl: string;
  /** Tokenizer URL */
  tokenizerUrl?: string;
  /** SHA-256 checksum for integrity */
  checksum?: string;
  /** Semver version string */
  version: string;
}

// ─── Runtime Types ───────────────────────────────────────────────

export interface RuntimeMetrics {
  /** Estimated browser memory used in bytes */
  memoryUsedBytes: number;
  /** Total available memory in bytes (if detectable) */
  memoryTotalBytes: number;
  /** Number of queued inference requests */
  queueLength: number;
  /** Average inference time in ms */
  avgInferenceMs: number;
  /** Whether the runtime is actively generating */
  isGenerating: boolean;
}

export interface InferenceRequest {
  id: string;
  prompt: string;
  /** Which task this inference serves */
  task: ModelTask;
  /** AbortController signal */
  signal?: AbortSignal;
  /** Max tokens to generate */
  maxTokens?: number;
  /** Temperature for sampling */
  temperature?: number;
  /** Created timestamp */
  createdAt: number;
}

export interface InferenceResult {
  requestId: string;
  response: string;
  /** Time taken in ms */
  durationMs: number;
  /** Estimated token count of the response */
  tokenCount: number;
  /** Whether the response was truncated */
  truncated: boolean;
}

// ─── Download Types ──────────────────────────────────────────────

export interface DownloadState {
  modelId: string;
  status: 'idle' | 'downloading' | 'paused' | 'completed' | 'failed' | 'verifying';
  /** Progress 0.0 to 1.0 */
  progress: number;
  /** Bytes downloaded so far */
  bytesDownloaded: number;
  /** Total bytes to download */
  bytesTotal: number;
  /** Error message if failed */
  error?: string;
  /** Download speed in bytes/sec */
  speed: number;
  /** Estimated time remaining in seconds */
  etaSeconds: number;
}

// ─── Cache Types ─────────────────────────────────────────────────

export interface CacheEntry {
  key: string;
  data: ArrayBuffer | string;
  metadata: {
    modelId: string;
    version: string;
    checksum?: string;
    createdAt: number;
    lastAccessedAt: number;
    sizeBytes: number;
  };
}

export interface CacheStats {
  totalEntries: number;
  totalSizeBytes: number;
  oldestEntryAge: number;
  modelsCached: string[];
}
