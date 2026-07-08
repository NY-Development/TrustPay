/**
 * Model Registry — Central Source of Truth
 *
 * Maps model IDs to their configurations. Single place to
 * add or remove supported models.
 */
import type { ModelInfo, ModelTask } from '../types/model.types';
import { MODEL_CONFIGS, DEFAULT_MODEL_ID } from './model-config';

class ModelRegistryService {
  private _models = new Map<string, ModelInfo>();

  constructor() {
    // Register all known models
    Object.values(MODEL_CONFIGS).forEach(m => this._models.set(m.id, m));
  }

  get(modelId: string): ModelInfo | undefined {
    return this._models.get(modelId);
  }

  getDefault(): ModelInfo {
    return this._models.get(DEFAULT_MODEL_ID) || Object.values(MODEL_CONFIGS)[0];
  }

  getAll(): ModelInfo[] {
    return Array.from(this._models.values());
  }

  getByFamily(family: string): ModelInfo[] {
    return this.getAll().filter(m => m.family === family);
  }

  getByTask(task: ModelTask): ModelInfo[] {
    return this.getAll().filter(m => m.tasks.includes(task));
  }

  /** Register a new model at runtime (for future LiteRT/MediaPipe) */
  register(model: ModelInfo): void {
    this._models.set(model.id, model);
    console.log(`[ModelRegistry] Registered model: ${model.name}`);
  }

  /** Unregister a model */
  unregister(modelId: string): void {
    this._models.delete(modelId);
  }

  has(modelId: string): boolean {
    return this._models.has(modelId);
  }
}

export const modelRegistry = new ModelRegistryService();
