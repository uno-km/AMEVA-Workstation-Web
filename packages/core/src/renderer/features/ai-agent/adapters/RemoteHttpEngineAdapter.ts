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

    const historyMessages = (options?.history || []).map((h) => ({
      role: h.role === 'assistant' ? 'assistant' : 'user',
      content: h.content
    }));

    const payload = {
      model: this.config.model,
      messages: [
        { role: 'system', content: systemPrompt },
        ...historyMessages,
        { role: 'user', content: userPrompt }
      ],
      stream: true,
      temperature: options?.temperature ?? 0.6,
      max_tokens: options?.max_tokens ?? 1024,
      stop: options?.stop
    };

    let response: Response;
    try {
      response = await fetch(this.config.endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
        signal: options?.signal
      });
    } catch (fetchErr: any) {
      if (this.config.endpoint.includes('localhost') || this.config.endpoint.includes('127.0.0.1')) {
        throw new Error(
          `로컬 AI 서버(${this.config.endpoint})에 연결할 수 없습니다. 컴퓨터에 Ollama를 실행해 두셨거나, 상단 제목 옆의 [🌐 API] 버튼을 눌러 설치가 필요 없는 [⚡ WebGPU] 모드로 전환해 주세요!`
        );
      }
      throw new Error(`원격 API 서버 연결 실패: ${fetchErr?.message || '네트워크 오류'}`);
    }

    if (!response.ok) {
      const errText = await response.text();
      let parsedMsg = errText;
      try {
        const json = JSON.parse(errText);
        if (json?.error?.message) {
          const rawMsg = json.error.message;
          if (rawMsg.includes('unsupported toolchain') || rawMsg.includes('CUDA error')) {
            parsedMsg = 'Ollama의 CUDA 그래픽 드라이버 버전 충돌이 감지되었습니다. 상단 제목 옆의 [🌐 API] 버튼을 눌러 [⚡ WebGPU] 모드로 전환하시면 CUDA 충돌 없이 내 그래픽카드로 즉시 쌩쌩 실행됩니다!';
          } else {
            parsedMsg = rawMsg;
          }
        }
      } catch {}
      throw new Error(`[RemoteHttpEngineAdapter] HTTP ${response.status}: ${parsedMsg}`);
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
