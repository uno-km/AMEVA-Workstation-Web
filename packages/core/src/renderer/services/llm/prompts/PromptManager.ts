import type { PromptFactory } from './PromptFactory';
import { DPlanPromptFactory } from './factories/DPlanPromptFactory';

export class PromptManager {
  private static factoryInstance: PromptFactory | null = null;

  /**
   * Retrieves the DPlanPromptFactory (Standardized for 3B+ models).
   * Caches the factory instance to avoid unnecessary allocations.
   */
  static getFactory(modelId?: string): PromptFactory {
    if (!this.factoryInstance) {
      this.factoryInstance = new DPlanPromptFactory();
    }
    return this.factoryInstance;
  }
}
