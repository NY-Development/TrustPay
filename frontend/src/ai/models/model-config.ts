/**
 * Model Configuration Constants
 *
 * Download URLs, file sizes, token limits, and quantization details
 * for all supported models.
 */
import type { ModelInfo } from '../types/model.types';

export const MODEL_CONFIGS: Record<string, ModelInfo> = {
  'gemma-2b': {
    id: 'gemma-2b',
    name: 'Gemma 2B',
    family: 'gemma',
    variant: '2b-it',
    size: 2_500_000_000, // ~2.5 GB
    contextWindow: 8192,
    quantization: 'int8',
    tasks: ['receipt-extraction', 'insight-generation', 'audit-generation', 'categorization', 'summarization', 'anomaly-detection', 'general'],
    downloadUrl: 'https://huggingface.co/google/gemma-2b-it/resolve/main/model.bin',
    tokenizerUrl: 'https://huggingface.co/google/gemma-2b-it/resolve/main/tokenizer.model',
    checksum: '',
    version: '1.0.0',
  },
  'gemma-4b': {
    id: 'gemma-4b',
    name: 'Gemma 4B',
    family: 'gemma',
    variant: '4b-it',
    size: 4_800_000_000, // ~4.8 GB
    contextWindow: 32768,
    quantization: 'int8',
    tasks: ['receipt-extraction', 'insight-generation', 'audit-generation', 'categorization', 'summarization', 'anomaly-detection', 'general'],
    downloadUrl: 'https://huggingface.co/google/gemma-4b-it/resolve/main/model.bin',
    tokenizerUrl: 'https://huggingface.co/google/gemma-4b-it/resolve/main/tokenizer.model',
    checksum: '',
    version: '1.0.0',
  },
};

/** Default model used when none is specified */
export const DEFAULT_MODEL_ID = 'gemma-2b';

/** Maximum prompt length before truncation (chars) */
export const MAX_PROMPT_LENGTH = 12_000;

/** Maximum response tokens */
export const MAX_RESPONSE_TOKENS = 2048;
