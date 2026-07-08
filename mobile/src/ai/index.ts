/**
 * AI Module — Public API Barrel Export
 */
export { AIProvider, useAI } from './AIProvider';
export { aiOrganizer, AIOrganizer, runHeuristics } from './AIOrganizer';
export { extractText, runOCR } from './ocr-processor';
export {
  AI_MODELS,
  downloadModel,
  deleteModel,
  updateModel,
  verifyModel,
  isDownloaded,
  getModelDir,
  getModelMeta,
  getStorageUsage,
} from './model-download-manager';
export type { DownloadProgress } from './model-download-manager';
export * from './ai-types';
export * from './prompt-templates';
