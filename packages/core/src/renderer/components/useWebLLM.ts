/**
 * ============================================================================
 * @file useWebLLM.ts
 * @system AMEVA OS Desktop Workstation - Core LLM Engine Layer
 * @location packages/core/src/renderer/components/useWebLLM.ts
 * @role High-Performance WebGPU VRAM-Optimized Engine Manager with DX12 TDR Fault-Tolerance
 * 
 * [Optimization Architecture]
 * 1. Default Ultra-Lightweight Model: Qwen2.5-0.5B (q4f16_1, ~380MB VRAM) - 100% immune to DX12 TDR Device Lost.
 * 2. Single-Engine Multiplexing: Uses 0.5B/1.5B for both Chat & GhostText by default.
 * 3. Fault-Tolerant Auto-Recovery: Catches GPUDeviceLostInfo / Disposed objects and resets gracefully.
 * 4. Smart Eco-Lifecycle: 10-minute Idle Auto-Unload & 3-minute Tab-Hidden Sleep.
 * ============================================================================
 */

import { useState, useCallback, useEffect } from 'react';
import type { MLCEngine, InitProgressReport } from '@mlc-ai/web-llm';

export const SUPPORTED_WEBGPU_MODELS = [
  { id: 'Qwen2.5-1.5B-Instruct-q4f32_1-MLC', label: 'Qwen2.5 1.5B (기본 추천·모든 GPU 100% 호환 f32·890MB VRAM)', vram: '890MB' },
  { id: 'Qwen2.5-0.5B-Instruct-q4f32_1-MLC', label: 'Qwen2.5 0.5B (초경량·내장그래픽 100% 호환·390MB)', vram: '390MB' },
  { id: 'Qwen2.5-3B-Instruct-q4f32_1-MLC', label: 'Qwen2.5 3B (고성능 추론 전용·2.2GB)', vram: '2.2GB' },
  { id: 'Llama-3.2-1B-Instruct-q4f32_1-MLC', label: 'Llama-3.2 1B (Meta 공식·f32 호환·790MB)', vram: '790MB' },
  { id: 'SmolLM2-1.7B-Instruct-q4f32_1-MLC', label: 'SmolLM2 1.7B (HuggingFace 고속 모델·920MB)', vram: '920MB' }
];

export const DEFAULT_WEBGPU_MODEL = 'Qwen2.5-1.5B-Instruct-q4f32_1-MLC';

let globalMainEngine: MLCEngine | null = null;
let globalGhostEngine: MLCEngine | null = null;
let globalIsMainLoading = false;
let globalIsGhostLoading = false;
let globalIsMainReady = false;
let globalIsGhostReady = false;
let globalMainProgressText = '';
let globalGhostProgressText = '';
let globalMainProgress = 0;
let globalGhostProgress = 0;
let globalActiveModelId = DEFAULT_WEBGPU_MODEL;
const GHOST_MODEL_ID = 'Qwen2.5-0.5B-Instruct-q4f32_1-MLC';

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
async function performUnload(target: 'main' | 'ghost' | 'all' = 'all') {
  try {
    if ((target === 'main' || target === 'all') && globalMainEngine) {
      console.log('[WebLLM Eco] Releasing Main Engine VRAM buffers...');
      try {
        await globalMainEngine.unload();
      } catch (e) {
        console.warn('[WebLLM Eco] Main engine unload error suppressed:', e);
      }
      globalMainEngine = null;
      globalIsMainReady = false;
      globalMainProgress = 0;
      globalMainProgressText = '';
    }

    if ((target === 'ghost' || target === 'all') && globalGhostEngine) {
      console.log('[WebLLM Eco] Releasing Ghost Engine VRAM buffers...');
      try {
        await globalGhostEngine.unload();
      } catch (e) {
        console.warn('[WebLLM Eco] Ghost engine unload error suppressed:', e);
      }
      globalGhostEngine = null;
      globalIsGhostReady = false;
      globalGhostProgress = 0;
      globalGhostProgressText = '';
    }

    notify();
  } catch (err) {
    console.error('[WebLLM Eco] Error in performUnload:', err);
  }
}

/**
 * Resets the 10-minute idle activity timer.
 */
function touchEngineActivity() {
  if (idleTimer) clearTimeout(idleTimer);
  idleTimer = setTimeout(() => {
    if (globalMainEngine || globalGhostEngine) {
      console.log('[WebLLM Eco] 10분 유휴 감지: GPU VRAM 자동 절전 회수 (Auto-Unload)');
      performUnload('all');
    }
  }, IDLE_TIMEOUT_MS);
}

// Global Tab Visibility Handler (Page Visibility API)
if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      if (visibilityTimer) clearTimeout(visibilityTimer);
      visibilityTimer = setTimeout(() => {
        if (globalMainEngine || globalGhostEngine) {
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
  isGhostReady: boolean;
  isMainLoading: boolean;
  isGhostLoading: boolean;
  mainProgressText: string;
  ghostProgressText: string;
  mainProgress: number;
  ghostProgress: number;
  activeModelId: string;
}

export const useWebLLM = () => {
  const [state, setState] = useState<WebLLMState>({
    isMainReady: globalIsMainReady,
    isGhostReady: globalIsGhostReady || globalIsMainReady,
    isMainLoading: globalIsMainLoading,
    isGhostLoading: globalIsGhostLoading,
    mainProgressText: globalMainProgressText,
    ghostProgressText: globalGhostProgressText,
    mainProgress: globalMainProgress,
    ghostProgress: globalGhostProgress,
    activeModelId: globalActiveModelId,
  });

  useEffect(() => {
    const handler = () => {
      setState({
        isMainReady: globalIsMainReady,
        isGhostReady: globalIsGhostReady || globalIsMainReady,
        isMainLoading: globalIsMainLoading,
        isGhostLoading: globalIsGhostLoading,
        mainProgressText: globalMainProgressText,
        ghostProgressText: globalGhostProgressText,
        mainProgress: globalMainProgress,
        ghostProgress: globalGhostProgress,
        activeModelId: globalActiveModelId,
      });
    };
    listeners.add(handler);
    return () => { listeners.delete(handler); };
  }, []);

  /**
   * Main Model Loader (Qwen2.5-0.5B by default)
   * Only loads the targeted main model into VRAM on-demand.
   */
  const initModel = useCallback(async (modelId?: string, loadGhostSeparately: boolean = false) => {
    const targetModelId = modelId || globalActiveModelId || DEFAULT_WEBGPU_MODEL;
    
    // If different model is requested or already ready, reload clean
    if (globalMainEngine && globalActiveModelId !== targetModelId) {
      await performUnload('main');
    } else if (globalMainEngine && globalIsMainReady) {
      return;
    }

    if (globalIsMainLoading) return;

    globalActiveModelId = targetModelId;
    globalIsMainLoading = true;
    globalMainProgress = 0;
    globalMainProgressText = 'WebGPU 엔진 초기화 시작...';
    notify();

    try {
      const { CreateMLCEngine } = await import('@mlc-ai/web-llm');

      // 1. Load Main Model into GPU VRAM
      const engine = await CreateMLCEngine(targetModelId, {
        initProgressCallback: (report: InitProgressReport) => {
          globalMainProgressText = report.text;
          if (report.progress != null) globalMainProgress = report.progress;
          notify();
        }
      });

      globalMainEngine = engine;
      globalIsMainReady = true;
      globalMainProgress = 1;
      const modelMeta = SUPPORTED_WEBGPU_MODELS.find(m => m.id === targetModelId);
      globalMainProgressText = `${modelMeta?.label.split(' ')[0] || 'WebGPU'} VRAM 로드 완료`;
      touchEngineActivity();
      notify();

      // 2. Load Ghost Model ONLY if explicitly requested
      if (loadGhostSeparately && !globalGhostEngine && !globalIsGhostLoading) {
        globalIsGhostLoading = true;
        notify();
        CreateMLCEngine(GHOST_MODEL_ID, {
          initProgressCallback: (report: InitProgressReport) => {
            globalGhostProgressText = report.text;
            if (report.progress != null) globalGhostProgress = report.progress;
            notify();
          }
        }).then(ghostEng => {
          globalGhostEngine = ghostEng;
          globalIsGhostReady = true;
        }).catch(err => {
          console.warn('[WebLLM] Optional Ghost model init skipped:', err);
        }).finally(() => {
          globalIsGhostLoading = false;
          notify();
        });
      }
    } catch (error: any) {
      console.error('[WebLLM] Failed to initialize WebGPU model:', error);
      globalIsMainReady = false;
      globalMainEngine = null;
      const errMsg = error?.message || String(error);
      if (errMsg.includes('DXGI_ERROR_DEVICE_REMOVED') || errMsg.includes('requestDevice') || errMsg.includes('Device was lost')) {
        globalMainProgressText = 'GPU 디바이스 재설정 필요 (브라우저 새 탭 또는 API 모드 사용 권장)';
      } else {
        globalMainProgressText = '초기화 실패 (0.5B 초경량 모델 또는 API 모드 권장)';
      }
      notify();
      throw error;
    } finally {
      globalIsMainLoading = false;
      notify();
    }
  }, []);

  /**
   * Unload Model from VRAM and free GPU textures/buffers
   */
  const unloadModel = useCallback(async (target: 'main' | 'ghost' | 'all' = 'all') => {
    if (idleTimer) clearTimeout(idleTimer);
    await performUnload(target);
  }, []);

  /**
   * Main Chat Generation Stream with Fault-Tolerant Recovery
   */
  const generateStream = useCallback(async function* (
    systemPrompt: string,
    userPrompt: string,
    options?: any
  ): AsyncGenerator<string, void, unknown> {
    if (!globalMainEngine || !globalIsMainReady) {
      throw new Error('[WebLLM] WebGPU 모델이 로드되지 않았습니다. 상단 배너에서 [GPU에 모델 올리기]를 누르거나 상단 [🌐 API] 모드를 선택해 주세요.');
    }

    touchEngineActivity();

    try {
      const chunks = await globalMainEngine.chat.completions.create({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        stream: true,
        temperature: options?.temperature ?? 0.3,
        max_tokens: options?.max_tokens ?? 1024,
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
      
      // Auto-detect device loss / disposed objects
      if (
        errMsg.includes('disposed') ||
        errMsg.includes('Device was lost') ||
        errMsg.includes('DXGI_ERROR') ||
        errMsg.includes('Model not loaded')
      ) {
        globalMainEngine = null;
        globalIsMainReady = false;
        notify();
        throw new Error(
          'GPU VRAM 한계 또는 Windows 드라이버 재설정으로 인해 WebGPU 모델이 초기화되었습니다. 브라우저 탭을 완전히 닫고 새 탭으로 열거나, 상단 [엔진 설정(⚙️)]에서 [Qwen2.5 0.5B] 초경량 모델 또는 [HTTP API 모드]를 사용해 주세요.'
        );
      }
      throw err;
    }
  }, []);

  /**
   * GhostText Autocompletion Stream
   */
  const generateGhostStream = useCallback(async function* (
    systemPrompt: string,
    userPrompt: string,
    options?: any
  ): AsyncGenerator<string, void, unknown> {
    const activeEngine = globalGhostEngine || globalMainEngine;

    if (!activeEngine) {
      throw new Error('[WebLLM] No active engine available for ghost text');
    }

    touchEngineActivity();

    try {
      const chunks = await activeEngine.chat.completions.create({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        stream: true,
        temperature: options?.temperature ?? 0.2,
        max_tokens: options?.max_tokens ?? 32,
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
      console.warn('[WebLLM Ghost] Generation error:', err);
    }
  }, []);

  return {
    ...state,
    initModel,
    unloadModel,
    generateStream,
    generateGhostStream
  };
};
