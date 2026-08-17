/**
 * ============================================================================
 * @file WebLLMEngineAdapter.ts
 * @system AMEVA OS Desktop Workstation - AI Intelligence Core
 * @location packages/core/src/renderer/features/ai-agent/adapters/WebLLMEngineAdapter.ts
 * @role In-Browser WebGPU LLM Inference Engine Adapter
 * ============================================================================
 */

import type { IAIEngineAdapter, InferenceOptions } from '../types';

export class WebLLMEngineAdapter implements IAIEngineAdapter {
  readonly id = 'webllm-adapter';
  readonly name = 'In-Browser WebGPU (WebLLM)';
  private generatorFn: ((sys: string, user: string, opt?: InferenceOptions) => AsyncGenerator<string, void, unknown>) | null = null;
  private readyState: boolean = false;

  constructor(generatorFn?: (sys: string, user: string, opt?: InferenceOptions) => AsyncGenerator<string, void, unknown>, isReady: boolean = false) {
    this.generatorFn = generatorFn || null;
    this.readyState = isReady;
  }

  setGenerator(fn: (sys: string, user: string, opt?: InferenceOptions) => AsyncGenerator<string, void, unknown>, ready: boolean = true) {
    this.generatorFn = fn;
    this.readyState = ready;
  }

  get isReady(): boolean {
    return this.readyState && !!this.generatorFn;
  }

  async init(_modelId?: string): Promise<void> {
    // WebLLM 초기화는 useWebLLM 훅의 생명주기와 연동됨
    this.readyState = true;
  }

  async *generateStream(
    systemPrompt: string,
    userPrompt: string,
    options?: InferenceOptions
  ): AsyncGenerator<string, void, unknown> {
    if (!this.generatorFn) {
      throw new Error('[WebLLMEngineAdapter] WebLLM engine is not initialized or generator is not set.');
    }
    yield* this.generatorFn(systemPrompt, userPrompt, options);
  }
}
