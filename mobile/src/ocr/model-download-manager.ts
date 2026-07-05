/**
 * Model Download Manager
 * 
 * Downloads MLC WebLLM model weight shards from HuggingFace to the device's
 * permanent documentDirectory. Uses a `.complete` marker to skip re-downloads.
 */
import * as FileSystem from 'expo-file-system/legacy';

// ─── Model Registry ──────────────────────────────────────────────

export type AIModelId =
  | 'gemma-4-e2b-it-q4f16_1-MLC'
  | 'Qwen2.5-1.5B-Instruct-q4f16_1-MLC';

export const AI_MODELS: { id: AIModelId; label: string; size: string; description: string; repoUrl: string }[] = [
  {
    id: 'gemma-4-e2b-it-q4f16_1-MLC',
    label: 'Gemma 4 E2B',
    size: '~1.5 GB',
    description: "Google's edge-optimized model. Great accuracy for receipt parsing.",
    repoUrl: 'https://huggingface.co/mlc-ai/gemma-4-e2b-it-q4f16_1-MLC/resolve/main/',
  },
  {
    id: 'Qwen2.5-1.5B-Instruct-q4f16_1-MLC',
    label: 'Qwen 2.5 1.5B',
    size: '~900 MB',
    description: 'Lightweight & fast. Excellent at structured text extraction.',
    repoUrl: 'https://huggingface.co/mlc-ai/Qwen2.5-1.5B-Instruct-q4f16_1-MLC/resolve/main/',
  },
];

// ─── Config Files that every MLC model needs ─────────────────────

const BASE_CONFIG_FILES = [
  'mlc-chat-config.json',
  'ndarray-cache.json',
  'tokenizer.json',
  'tokenizer.model',
  'tokenizer_config.json',
];

// ─── Helpers ─────────────────────────────────────────────────────

function getModelDir(modelId: AIModelId): string {
  return `${FileSystem.documentDirectory}mlc-models/${modelId}/`;
}

function getMarkerPath(modelId: AIModelId): string {
  return `${getModelDir(modelId)}.complete`;
}

export async function isModelDownloaded(modelId: AIModelId): Promise<boolean> {
  const marker = getMarkerPath(modelId);
  const info = await FileSystem.getInfoAsync(marker);
  return info.exists;
}

export function getModelLocalPath(modelId: AIModelId): string {
  return getModelDir(modelId);
}

// ─── Download Logic ──────────────────────────────────────────────

export type DownloadProgress = {
  phase: 'config' | 'weights';
  downloaded: number;   // bytes
  total: number;        // bytes
  percent: number;      // 0–1
  file: string;         // current file name
};

export async function downloadModel(
  modelId: AIModelId,
  onProgress: (progress: DownloadProgress) => void,
): Promise<string> {
  const model = AI_MODELS.find(m => m.id === modelId);
  if (!model) throw new Error(`Unknown model: ${modelId}`);

  const modelDir = getModelDir(modelId);

  // Ensure directory exists
  await FileSystem.makeDirectoryAsync(modelDir, { intermediates: true });

  // ── Phase 1: Download config files ──────────────────────────
  for (let i = 0; i < BASE_CONFIG_FILES.length; i++) {
    const file = BASE_CONFIG_FILES[i];
    const localPath = modelDir + file;
    const info = await FileSystem.getInfoAsync(localPath);

    if (!info.exists) {
      onProgress({
        phase: 'config',
        downloaded: i,
        total: BASE_CONFIG_FILES.length,
        percent: i / BASE_CONFIG_FILES.length,
        file,
      });

      try {
        await FileSystem.downloadAsync(model.repoUrl + file, localPath);
      } catch (err) {
        // tokenizer.model may not exist for all models — skip gracefully
        if (file === 'tokenizer.model' || file === 'tokenizer_config.json') {
          console.warn(`[ModelManager] Optional file ${file} not found, skipping.`);
          continue;
        }
        throw err;
      }
    }
  }

  // ── Phase 2: Parse ndarray-cache.json for weight shards ─────
  const cacheManifestPath = modelDir + 'ndarray-cache.json';
  const manifestInfo = await FileSystem.getInfoAsync(cacheManifestPath);
  if (!manifestInfo.exists) {
    throw new Error('ndarray-cache.json missing after download.');
  }

  const manifestRaw = await FileSystem.readAsStringAsync(cacheManifestPath);
  const manifest = JSON.parse(manifestRaw);

  // The manifest has a `records` array, each with a `dataPath` field
  // pointing to a binary shard file (relative to the model root).
  const shardFiles: { path: string; byteLength: number }[] = [];
  const seenPaths = new Set<string>();

  if (Array.isArray(manifest.records)) {
    for (const record of manifest.records) {
      const dataPath: string = record.dataPath;
      if (dataPath && !seenPaths.has(dataPath)) {
        seenPaths.add(dataPath);
        shardFiles.push({
          path: dataPath,
          byteLength: record.byteLength || 0,
        });
      }
    }
  }

  const totalBytes = shardFiles.reduce((acc, s) => acc + s.byteLength, 0);
  let downloadedBytes = 0;

  // ── Phase 3: Download weight shards with progress ───────────
  for (let i = 0; i < shardFiles.length; i++) {
    const shard = shardFiles[i];
    const localShardPath = modelDir + shard.path;

    // Ensure subdirectory exists
    const slashIdx = shard.path.lastIndexOf('/');
    if (slashIdx !== -1) {
      const subDir = modelDir + shard.path.substring(0, slashIdx);
      await FileSystem.makeDirectoryAsync(subDir, { intermediates: true });
    }

    const shardInfo = await FileSystem.getInfoAsync(localShardPath);
    if (!shardInfo.exists) {
      onProgress({
        phase: 'weights',
        downloaded: downloadedBytes,
        total: totalBytes,
        percent: totalBytes > 0 ? downloadedBytes / totalBytes : 0,
        file: shard.path,
      });

      const downloadResumable = FileSystem.createDownloadResumable(
        model.repoUrl + shard.path,
        localShardPath,
        {},
        (downloadProgress) => {
          const currentBytes = downloadedBytes + downloadProgress.totalBytesWritten;
          onProgress({
            phase: 'weights',
            downloaded: currentBytes,
            total: totalBytes,
            percent: totalBytes > 0 ? currentBytes / totalBytes : 0,
            file: shard.path,
          });
        }
      );

      const result = await downloadResumable.downloadAsync();
      if (!result) throw new Error(`Failed to download shard: ${shard.path}`);
    }

    downloadedBytes += shard.byteLength;
  }

  // ── Phase 4: Write completion marker ────────────────────────
  await FileSystem.writeAsStringAsync(getMarkerPath(modelId), JSON.stringify({
    modelId,
    completedAt: new Date().toISOString(),
    shardCount: shardFiles.length,
  }));

  onProgress({
    phase: 'weights',
    downloaded: totalBytes,
    total: totalBytes,
    percent: 1,
    file: 'complete',
  });

  return modelDir;
}

export async function deleteModel(modelId: AIModelId): Promise<void> {
  const dir = getModelDir(modelId);
  const info = await FileSystem.getInfoAsync(dir);
  if (info.exists) {
    await FileSystem.deleteAsync(dir, { idempotent: true });
  }
}
