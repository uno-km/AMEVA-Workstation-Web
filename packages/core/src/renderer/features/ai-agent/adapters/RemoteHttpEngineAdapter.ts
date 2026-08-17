/**
 * ============================================================================
 * @file RemoteHttpEngineAdapter.ts
 * @system AMEVA OS Desktop Workstation - AI Intelligence Core
 * @location packages/core/src/renderer/features/ai-agent/adapters/RemoteHttpEngineAdapter.ts
 * @role OpenAI-Compatible HTTP Streaming API Engine Adapter (Ollama / Cloud / Backend)
 * ============================================================================
 */

import type { IAIEngineAdapter, InferenceOptions } from '../types';

export interface RemoteHttpConfig {
  endpoint: string; // e.g. 'http://localhost:11434/v1/chat/completions' or 'https://api.openai.com/v1/chat/completions'
  apiKey?: string;
  model: string;
}

export class RemoteHttpEngineAdapter implements IAIEngineAdapter {
  readonly id = 'remote-http-adapter';
  readonly name = 'Remote HTTP API (OpenAI/Ollama/Cloud)';
  private config: RemoteHttpConfig;

  constructor(config?: Partial<RemoteHttpConfig>) {
    this.config = {
      endpoint: config?.endpoint || 'http://localhost:11434/v1/chat/completions',
      apiKey: config?.apiKey || '',
      model: config?.model || 'qwen2.5:3b'
    };
  }

  setConfig(config: Partial<RemoteHttpConfig>) {
    this.config = { ...this.config, ...config };
  }

  getConfig(): RemoteHttpConfig {
    return { ...this.config };
  }

  get isReady(): boolean {
    return !!this.config.endpoint && !!this.config.model;
  }

  async init(modelId?: string): Promise<void> {
    if (modelId) {
      this.config.model = modelId;
    }
  }

  async *generateStream(
    systemPrompt: string,
    userPrompt: string,
    options?: InferenceOptions
  ): AsyncGenerator<string, void, unknown> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };

    if (this.config.apiKey) {
      headers['Authorization'] = `Bearer ${this.config.apiKey}`;
    }

    const payload = {
      model: this.config.model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      stream: true,
      temperature: options?.temperature ?? 0.6,
      max_tokens: options?.max_tokens ?? 1024,
      stop: options?.stop
    };

    const response = await fetch(this.config.endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
      signal: options?.signal
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`[RemoteHttpEngineAdapter] HTTP ${response.status}: ${errText}`);
    }

    if (!response.body) {
      throw new Error('[RemoteHttpEngineAdapter] Response body is null');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || trimmed.startsWith(':')) continue;

          if (trimmed === 'data: [DONE]') {
            return;
          }

          if (trimmed.startsWith('data: ')) {
            try {
              const json = JSON.parse(trimmed.slice(6));
              const delta = json.choices?.[0]?.delta?.content || json.choices?.[0]?.text;
              if (delta) {
                yield delta;
              }
            } catch (err) {
              // Ignore partial JSON parse errors in streaming
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }
}
