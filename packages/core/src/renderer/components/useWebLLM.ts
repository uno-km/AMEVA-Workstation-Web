/**
 * ============================================================================
 * @file useWebLLM.ts
 * @system AMEVA OS Desktop Workstation - Core LLM Engine Layer
 * @location packages/core/src/renderer/components/useWebLLM.ts
 * @role High-Performance Dual-Engine (General + Coder) Manager with Track-Switching Fault-Tolerance
 * 
 * [Architecture: Dual-Engine + Track-Switching Fallback]
 * 1. General Engine: Qwen2.5 0.5B (390MB) -> AI Panel, Daily Conversation, Summaries
 * 2. Coder Engine: Qwen2.5-Coder 0.5B/1.5B (390MB/890MB) -> In-Block AI, 1-Click Debug, $O(N)$ Optimization
 * 3. Dual-Resident VRAM: ~780MB Total VRAM footprint for zero-latency concurrent inference
 * 4. Railway Track-Switching Safeguard: If VRAM limit is hit, dynamically rotates engines in VRAM gracefully
 * 5. Smart Eco-Lifecycle: 10-minute Idle Auto-Unload & 3-minute Tab-Hidden Sleep
 * ============================================================================
 */

import { useState, useCallback, useEffect } from 'react';
import type { MLCEngine, InitProgressReport } from '@mlc-ai/web-llm';

export const SUPPORTED_WEBGPU_MODELS = [
  { id: 'Qwen2.5-0.5B-Instruct-q4f32_1-MLC', label: 'Qwen2.5 0.5B (범용 초경량 디폴트·390MB)', vram: '390MB', category: 'general' },
  { id: 'Qwen2.5-Coder-0.5B-Instruct-q4f32_1-MLC', label: 'Qwen2.5-Coder 0.5B (코딩/디버깅 특화 초경량·390MB)', vram: '390MB', category: 'coder' },
  { id: 'Qwen2.5-Coder-1.5B-Instruct-q4f32_1-MLC', label: 'Qwen2.5-Coder 1.5B (코딩/디버깅 고품질·890MB)', vram: '890MB', category: 'coder' },
  { id: 'Qwen2.5-1.5B-Instruct-q4f32_1-MLC', label: 'Qwen2.5 1.5B (범용 고품질 모델·890MB)', vram: '890MB', category: 'general' },
  { id: 'Qwen2.5-3B-Instruct-q4f32_1-MLC', label: 'Qwen2.5 3B (고성능 요약·1.8GB)', vram: '1.8GB', category: 'general' },
  { id: 'Llama-3.2-1B-Instruct-q4f32_1-MLC', label: 'Llama-3.2 1B (Meta 공식·790MB)', vram: '790MB', category: 'general' },
  { id: 'SmolLM2-1.7B-Instruct-q4f32_1-MLC', label: 'SmolLM2 1.7B (HuggingFace 고속 모델·920MB)', vram: '920MB', category: 'general' }
];

export const DEFAULT_WEBGPU_MODEL = 'Qwen2.5-0.5B-Instruct-q4f32_1-MLC';
export const DEFAULT_CODER_MODEL = 'Qwen2.5-Coder-0.5B-Instruct-q4f32_1-MLC';

// ─── Dual Engine Global Singletons ─────────────────────────────
let globalMainEngine: MLCEngine | null = null;
let globalCoderEngine: MLCEngine | null = null;

let globalIsMainLoading = false;
let globalIsCoderLoading = false;
let globalIsMainReady = false;
let globalIsCoderReady = false;

let globalMainProgressText = '';
let globalCoderProgressText = '';
let globalMainProgress = 0;
let globalCoderProgress = 0;

let globalActiveModelId = DEFAULT_WEBGPU_MODEL;
let globalActiveCoderModelId = DEFAULT_CODER_MODEL;

let globalMainLoadingPromise: Promise<void> | null = null;
let globalCoderLoadingPromise: Promise<void> | null = null;

// Smart Eco-Lifecycle Timers
let idleTimer: any = null;
let visibilityTimer: any = null;
const IDLE_TIMEOUT_MS = 10 * 60 * 1000; // 10분 유휴 시 자동 VRAM 반환
const HIDDEN_TAB_TIMEOUT_MS = 3 * 60 * 1000; // 3분 백그라운드 탭 유지 시 절전 반환

const listeners = new Set<() => void>();
const notify = () => listeners.forEach(fn => fn());

/**
 * Internal VRAM Deallocation
 */
async function performUnload(target: 'main' | 'coder' | 'ghost' | 'all' = 'all') {
  try {
    if ((target === 'main' || target === 'all') && globalMainEngine) {
      console.log('[WebLLM Dual-Eco] Releasing General Main Engine VRAM...');
      try {
        await globalMainEngine.unload();
      } catch (e) {
        console.warn('[WebLLM Dual-Eco] Main engine unload suppressed:', e);
      }
      globalMainEngine = null;
      globalIsMainReady = false;
      globalMainProgress = 0;
      globalMainProgressText = '';
    }

    if ((target === 'coder' || target === 'ghost' || target === 'all') && globalCoderEngine) {
      console.log('[WebLLM Dual-Eco] Releasing Coder Engine VRAM...');
      try {
        await globalCoderEngine.unload();
      } catch (e) {
        console.warn('[WebLLM Dual-Eco] Coder engine unload suppressed:', e);
      }
      globalCoderEngine = null;
      globalIsCoderReady = false;
      globalCoderProgress = 0;
      globalCoderProgressText = '';
    }

    notify();
  } catch (err) {
    console.error('[WebLLM Dual-Eco] Error in performUnload:', err);
  }
}

/**
 * Resets the 10-minute idle activity timer.
 */
function touchEngineActivity() {
  if (idleTimer) clearTimeout(idleTimer);
  idleTimer = setTimeout(() => {
    if (globalMainEngine || globalCoderEngine) {
      console.log('[WebLLM Eco] 10분 유휴 감지: GPU VRAM 자동 절전 회수 (Auto-Unload)');
      performUnload('all');
    }
  }, IDLE_TIMEOUT_MS);
}

// Global Tab Visibility Handler
if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      if (visibilityTimer) clearTimeout(visibilityTimer);
      visibilityTimer = setTimeout(() => {
        if (globalMainEngine || globalCoderEngine) {
          console.log('[WebLLM Eco] 백그라운드 탭 3분 초과 감지: VRAM 절전 회수');
          performUnload('all');
        }
      }, HIDDEN_TAB_TIMEOUT_MS);
    } else {
      if (visibilityTimer) {
        clearTimeout(visibilityTimer);
        visibilityTimer = null;
      }
      touchEngineActivity();
    }
  });
}

export interface WebLLMState {
  isMainReady: boolean;
  isCoderReady: boolean;
  isGhostReady: boolean; // Alias for isCoderReady
  isMainLoading: boolean;
  isCoderLoading: boolean;
  isGhostLoading: boolean; // Alias for isCoderLoading
  mainProgressText: string;
  coderProgressText: string;
  ghostProgressText: string; // Alias for coderProgressText
  mainProgress: number;
  coderProgress: number;
  ghostProgress: number; // Alias for coderProgress
  activeModelId: string;
  activeCoderModelId: string;
}

export const useWebLLM = () => {
  const [state, setState] = useState<WebLLMState>({
    isMainReady: globalIsMainReady,
    isCoderReady: globalIsCoderReady,
    isGhostReady: globalIsCoderReady || globalIsMainReady,
    isMainLoading: globalIsMainLoading,
    isCoderLoading: globalIsCoderLoading,
    isGhostLoading: globalIsCoderLoading,
    mainProgressText: globalMainProgressText,
    coderProgressText: globalCoderProgressText,
    ghostProgressText: globalCoderProgressText,
    mainProgress: globalMainProgress,
    coderProgress: globalCoderProgress,
    ghostProgress: globalCoderProgress,
    activeModelId: globalActiveModelId,
    activeCoderModelId: globalActiveCoderModelId,
  });

  useEffect(() => {
    const handler = () => {
      setState({
        isMainReady: globalIsMainReady,
        isCoderReady: globalIsCoderReady,
        isGhostReady: globalIsCoderReady || globalIsMainReady,
        isMainLoading: globalIsMainLoading,
        isCoderLoading: globalIsCoderLoading,
        isGhostLoading: globalIsCoderLoading,
        mainProgressText: globalMainProgressText,
        coderProgressText: globalCoderProgressText,
        ghostProgressText: globalCoderProgressText,
        mainProgress: globalMainProgress,
        coderProgress: globalCoderProgress,
        ghostProgress: globalCoderProgress,
        activeModelId: globalActiveModelId,
        activeCoderModelId: globalActiveCoderModelId,
      });
    };
    listeners.add(handler);
    return () => { listeners.delete(handler); };
  }, []);

  /**
   * 1. General Main Model Loader (Qwen2.5 0.5B/1.5B/3B)
   */
  const initModel = useCallback(async (modelId?: string, forceReload: boolean = false): Promise<void> => {
    const targetModelId = modelId || localStorage.getItem('ameva_selected_llm_model') || DEFAULT_WEBGPU_MODEL;
    
    if (globalMainEngine && globalIsMainReady && globalActiveModelId === targetModelId && !forceReload) {
      return;
    }

    if (globalIsMainLoading && globalMainLoadingPromise) {
      return globalMainLoadingPromise;
    }

    if (globalMainEngine && globalActiveModelId !== targetModelId) {
      await performUnload('main');
    }

    globalActiveModelId = targetModelId;
    globalIsMainLoading = true;
    globalMainProgress = 0;
    globalMainProgressText = '범용 WebGPU 엔진 로딩 시작...';
    notify();

    globalMainLoadingPromise = (async () => {
      try {
        const { CreateMLCEngine } = await import('@mlc-ai/web-llm');
        const isLargeModel = targetModelId.includes('1.5B') || targetModelId.includes('3B') || targetModelId.includes('1.7B');
        const boundedContextWindow = isLargeModel ? 1536 : 2048;

        const engine = await CreateMLCEngine(
          targetModelId,
          {
            initProgressCallback: (report: InitProgressReport) => {
              globalMainProgressText = report.text;
              if (report.progress != null) globalMainProgress = report.progress;
              notify();
            },
            logLevel: 'WARN'
          },
          {
            context_window_size: boundedContextWindow,
            sliding_window_size: -1,
            attention_sink_size: 4,
            temperature: 0.35,
            top_p: 0.85
          }
        );

        globalMainEngine = engine;
        globalIsMainReady = true;
        globalMainProgress = 1;
        const modelMeta = SUPPORTED_WEBGPU_MODELS.find(m => m.id === targetModelId);
        globalMainProgressText = `${modelMeta?.label.split(' ')[0] || 'WebGPU'} VRAM 준비 완료`;
        touchEngineActivity();
        notify();
      } catch (error: any) {
        console.error('[WebLLM] Failed to initialize General model:', error);
        globalIsMainReady = false;
        globalMainEngine = null;
        const errMsg = error?.message || String(error);
        
        // 기차선로식 안전 스위칭: 만약 VRAM 부족/GPU Device Lost로 실패한 경우 Coder 엔진 언로드
        if (globalCoderEngine && (errMsg.includes('Device was lost') || errMsg.includes('memory') || errMsg.includes('DXGI_ERROR') || errMsg.includes('DEVICE_REMOVED'))) {
          console.warn('[WebLLM Railway] VRAM 부족 감지: Coder 엔진 언로드 후 범용 모델 단독 로드 재시도...');
          await performUnload('coder');
          await new Promise(r => setTimeout(r, 300));
          return initModel(targetModelId, true);
        }

        // 대형 모델(1.5B/3B) VRAM 한계 시 0.5B 초경량 모델로 자동 안전 강등 폴백
        if (targetModelId !== DEFAULT_WEBGPU_MODEL && (errMsg.includes('Device was lost') || errMsg.includes('memory') || errMsg.includes('DXGI_ERROR') || errMsg.includes('DEVICE_REMOVED'))) {
          console.warn('[WebLLM Safe-Fallback] VRAM 한계 감지: 0.5B 초경량 모델로 자동 전환 후 재시도...');
          globalMainProgressText = '0.5B 초경량 모델로 안전 전환 중...';
          notify();
          await new Promise(r => setTimeout(r, 400));
          return initModel(DEFAULT_WEBGPU_MODEL, true);
        }

        globalMainProgressText = '초기화 실패 (0.5B 초경량 권장)';
        notify();
        throw error;
      } finally {
        globalIsMainLoading = false;
        globalMainLoadingPromise = null;
        notify();
      }
    })();

    return globalMainLoadingPromise;
  }, []);

  /**
   * 2. Dedicated Coder Model Loader (Qwen2.5-Coder 0.5B/1.5B)
   */
  const initCoderModel = useCallback(async (modelId?: string, forceReload: boolean = false): Promise<void> => {
    const targetModelId = modelId || DEFAULT_CODER_MODEL;

    if (globalCoderEngine && globalIsCoderReady && globalActiveCoderModelId === targetModelId && !forceReload) {
      return;
    }

    if (globalIsCoderLoading && globalCoderLoadingPromise) {
      return globalCoderLoadingPromise;
    }

    if (globalCoderEngine && globalActiveCoderModelId !== targetModelId) {
      await performUnload('coder');
    }

    globalActiveCoderModelId = targetModelId;
    globalIsCoderLoading = true;
    globalCoderProgress = 0;
    globalCoderProgressText = '코더 WebGPU 엔진 로딩 시작...';
    notify();

    globalCoderLoadingPromise = (async () => {
      try {
        const { CreateMLCEngine } = await import('@mlc-ai/web-llm');
        const isLarge = targetModelId.includes('1.5B');
        const boundedContextWindow = isLarge ? 1024 : 1536;

        const engine = await CreateMLCEngine(
          targetModelId,
          {
            initProgressCallback: (report: InitProgressReport) => {
              globalCoderProgressText = report.text;
              if (report.progress != null) globalCoderProgress = report.progress;
              notify();
            },
            logLevel: 'WARN'
          },
          {
            context_window_size: boundedContextWindow,
            sliding_window_size: -1,
            attention_sink_size: 4,
            temperature: 0.35,
            top_p: 0.85
          }
        );

        globalCoderEngine = engine;
        globalIsCoderReady = true;
        globalCoderProgress = 1;
        const modelMeta = SUPPORTED_WEBGPU_MODELS.find(m => m.id === targetModelId);
        globalCoderProgressText = `${modelMeta?.label.split(' ')[0] || 'Coder'} VRAM 준비 완료`;
        touchEngineActivity();
        notify();
      } catch (error: any) {
        console.error('[WebLLM] Failed to initialize Coder model:', error);
        globalIsCoderReady = false;
        globalCoderEngine = null;
        const errMsg = error?.message || String(error);

        // 기차선로식 안전 스위칭: VRAM 부족 시 메인 엔진을 잠시 언로드하고 코더 단독 로드
        if (globalMainEngine && (errMsg.includes('Device was lost') || errMsg.includes('memory') || errMsg.includes('DXGI_ERROR'))) {
          console.warn('[WebLLM Railway] VRAM 한계 도달: 범용 메인 엔진을 언로드하고 코더 엔진 단독 로드 진행...');
          await performUnload('main');
          return initCoderModel(targetModelId, true);
        }

        globalCoderProgressText = '코더 엔진 로드 실패';
        notify();
        throw error;
      } finally {
        globalIsCoderLoading = false;
        globalCoderLoadingPromise = null;
        notify();
      }
    })();

    return globalCoderLoadingPromise;
  }, []);

  /**
   * 3. Unload Model from VRAM
   */
  const unloadModel = useCallback(async (target: 'main' | 'coder' | 'ghost' | 'all' = 'all') => {
    if (idleTimer) clearTimeout(idleTimer);
    await performUnload(target);
  }, []);

  /**
   * 4. General Chat Generation Stream (Uses globalMainEngine, fallbacks to Coder if Main not loaded)
   */
  const generateStream = useCallback(async function* (
    systemPrompt: string,
    userPrompt: string,
    options?: any
  ): AsyncGenerator<string, void, unknown> {
    let activeEngine = globalMainEngine;

    // 만약 메인 엔진이 없고 코더 엔진만 로드되어 있는 경우 코더 엔진으로 유연한 폴백
    if (!activeEngine && globalCoderEngine && globalIsCoderReady) {
      activeEngine = globalCoderEngine;
    }

    if (!activeEngine || (!globalIsMainReady && !globalIsCoderReady)) {
      throw new Error('[WebLLM] WebGPU 모델이 로드되지 않았습니다. 상단 배너에서 [GPU에 모델 올리기]를 눌러주세요.');
    }

    touchEngineActivity();

    try {
      const historyMessages = (options?.history || [])
        .filter((h: any) => h?.content && typeof h.content === 'string' && h.content.trim().length > 0)
        .map((h: any) => ({
          role: h.role === 'assistant' ? 'assistant' : 'user',
          content: h.content.trim()
        }));

      const safeSystemPrompt = systemPrompt?.trim() || 'You are an intelligent AI assistant.';
      const safeUserPrompt = userPrompt?.trim() || 'Please summarize the content.';

      const fullMessages = [
        { role: 'system', content: safeSystemPrompt },
        ...historyMessages,
        { role: 'user', content: safeUserPrompt }
      ];

      const chunks = await activeEngine.chat.completions.create({
        messages: fullMessages as any,
        stream: true,
        temperature: options?.temperature ?? 0.35,
        max_tokens: options?.max_tokens ?? 1024,
        presence_penalty: options?.presence_penalty ?? 0.25,
        frequency_penalty: options?.frequency_penalty ?? 0.25,
        repetition_penalty: options?.repetition_penalty ?? 1.15,
        stop: options?.stop,
      });

      for await (const chunk of chunks) {
        const content = chunk.choices[0]?.delta?.content;
        if (content) {
          yield content;
        }
      }

      touchEngineActivity();
    } catch (err: any) {
      console.error('[WebLLM] GPU Runtime Error during inference:', err);
      const errMsg = err?.message || String(err);
      if (
        errMsg.includes('disposed') ||
        errMsg.includes('Device was lost') ||
        errMsg.includes('DXGI_ERROR') ||
        errMsg.includes('DEVICE_REMOVED') ||
        errMsg.includes('unmapped')
      ) {
        globalMainEngine = null;
        globalCoderEngine = null;
        globalIsMainReady = false;
        globalIsCoderReady = false;
        globalIsMainLoading = false;
        globalIsCoderLoading = false;
        globalMainLoadingPromise = null;
        globalCoderLoadingPromise = null;
        notify();
        throw new Error('GPU VRAM/연산 한계로 WebGPU 디바이스가 재설정되었습니다. 0.5B 초경량 모델로 재로딩을 권장합니다.');
      }
      throw err;
    }
  }, []);

  /**
   * 5. Dedicated Coder Generation Stream (Uses globalCoderEngine, fallbacks to Main if Coder not loaded)
   */
  const generateCoderStream = useCallback(async function* (
    systemPrompt: string,
    userPrompt: string,
    options?: any
  ): AsyncGenerator<string, void, unknown> {
    let activeEngine = globalCoderEngine;

    // 코더 엔진이 아직 로드되지 않은 경우 메인 엔진으로 즉시 폴백
    if (!activeEngine && globalMainEngine && globalIsMainReady) {
      activeEngine = globalMainEngine;
    }

    if (!activeEngine) {
      throw new Error('[WebLLM Coder] 코더 엔진이 로드되지 않았습니다. [AI 어시스턴트]에서 엔진을 로딩해 주세요.');
    }

    touchEngineActivity();

    try {
      const safeSystemPrompt = systemPrompt?.trim() || 'You are an intelligent AI coding assistant.';
      const safeUserPrompt = userPrompt?.trim() || 'Please analyze or generate code.';

      const fullMessages = [
        { role: 'system', content: safeSystemPrompt },
        { role: 'user', content: safeUserPrompt }
      ];

      const chunks = await activeEngine.chat.completions.create({
        messages: fullMessages as any,
        stream: true,
        temperature: options?.temperature ?? 0.35,
        max_tokens: options?.max_tokens ?? 1024,
        presence_penalty: options?.presence_penalty ?? 0.25,
        frequency_penalty: options?.frequency_penalty ?? 0.25,
        repetition_penalty: options?.repetition_penalty ?? 1.15,
        stop: options?.stop,
      });

      for await (const chunk of chunks) {
        const content = chunk.choices[0]?.delta?.content;
        if (content) {
          yield content;
        }
      }

      touchEngineActivity();
    } catch (err: any) {
      console.error('[WebLLM Coder] Inference error:', err);
      const errMsg = err?.message || String(err);
      if (
        errMsg.includes('disposed') ||
        errMsg.includes('Device was lost') ||
        errMsg.includes('DXGI_ERROR') ||
        errMsg.includes('DEVICE_REMOVED') ||
        errMsg.includes('unmapped')
      ) {
        globalMainEngine = null;
        globalCoderEngine = null;
        globalIsMainReady = false;
        globalIsCoderReady = false;
        globalIsMainLoading = false;
        globalIsCoderLoading = false;
        globalMainLoadingPromise = null;
        globalCoderLoadingPromise = null;
        notify();
        throw new Error('GPU VRAM/연산 한계로 코더 WebGPU 디바이스가 재설정되었습니다.');
      }
      throw err;
    }
  }, []);

  /**
   * 6. GhostText Autocompletion Stream
   */
  const generateGhostStream = useCallback(async function* (
    systemPrompt: string,
    userPrompt: string
  ): AsyncGenerator<string, void, unknown> {
    const activeEngine = globalCoderEngine || globalMainEngine;
    if (!activeEngine) return;

    touchEngineActivity();

    try {
      const chunks = await activeEngine.chat.completions.create({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        stream: true,
        temperature: 0.2,
        max_tokens: 64,
        stop: ['\n\n', '```']
      });

      for await (const chunk of chunks) {
        const content = chunk.choices[0]?.delta?.content;
        if (content) {
          yield content;
        }
      }

      touchEngineActivity();
    } catch (err) {
      console.debug('[WebLLM Ghost] Generation skipped:', err);
    }
  }, []);

  // Backward compatibility alias for Ghost model init
  const initGhostModel = useCallback(async () => {
    return initCoderModel();
  }, [initCoderModel]);

  return {
    ...state,
    initModel,
    initCoderModel,
    unloadModel,
    generateStream,
    generateCoderStream,
    initGhostModel,
    generateGhostStream,
    activeModelId: state.activeModelId,
    activeCoderModelId: state.activeCoderModelId,
  };
};
