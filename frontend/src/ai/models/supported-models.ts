/**
 * Supported Models Catalog
 *
 * Human-readable catalog of all models the platform supports.
 * Used by UI components to show model selection options.
 */
import type { ModelInfo } from '../types/model.types';
import { modelRegistry } from './model-registry';

export interface ModelCatalogEntry {
  model: ModelInfo;
  displayName: string;
  description: string;
  recommended: boolean;
  minDeviceMemoryGB: number;
}

export function getSupportedModels(): ModelCatalogEntry[] {
  return modelRegistry.getAll().map((model): ModelCatalogEntry => {
    switch (model.id) {
      case 'gemma-2b':
        return {
          model,
          displayName: 'Gemma 2B Instruct',
          description: 'Lightweight model ideal for receipt extraction and categorization. Works on most devices.',
          recommended: true,
          minDeviceMemoryGB: 4,
        };
      case 'gemma-4b':
        return {
          model,
          displayName: 'Gemma 4B Instruct',
          description: 'Higher-capacity model for complex financial analysis and detailed audit reports.',
          recommended: false,
          minDeviceMemoryGB: 8,
        };
      default:
        return {
          model,
          displayName: model.name,
          description: `${model.family} family model (${model.variant})`,
          recommended: false,
          minDeviceMemoryGB: 4,
        };
    }
  });
}

export function getRecommendedModel(): ModelCatalogEntry | undefined {
  return getSupportedModels().find(e => e.recommended);
}
