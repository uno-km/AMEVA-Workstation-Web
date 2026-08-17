/**
 * ============================================================================
 * @file useWebLLM.ts
 * @system AMEVA OS Desktop Workstation - Core LLM Engine Layer
 * @location packages/core/src/renderer/components/useWebLLM.ts
 * @role High-Performance WebGPU VRAM-Optimized Engine Manager
 * 
 * [Optimization Architecture]
 * 1. Single-Engine Multiplexing: Uses Qwen2.5-3B for both Chat & GhostText by default (1.8GB VRAM vs 3.5GB).
 * 2. Smart Eco-Lifecycle: 10-minute Idle Auto-Unload & 3-minute Tab-Hidden Sleep.
 * 3. Explicit VRAM Deallocation: Exposes unloadModel() to reclaim GPU buffers via engine.unload().
 * ============================================================================
 */

import { useState, useCallback, useEffect } from 'react';
import type { MLCEngine, InitProgressReport } from '@mlc-ai/web-llm';

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
let globalActiveModelId = 'Qwen2.5-3B-Instruct-q4f32_1-MLC';
const GHOST_MODEL_ID = 'Qwen2.5-1.5B-Instruct-q4f32_1-MLC';

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
      await globalMainEngine.unload();
      globalMainEngine = null;
      globalIsMainReady = false;
      globalMainProgress = 0;
      globalMainProgressText = '';
    }

    if ((target === 'ghost' || target === 'all') && globalGhostEngine) {
      console.log('[WebLLM Eco] Releasing Ghost Engine VRAM buffers...');
      await globalGhostEngine.unload();
      globalGhostEngine = null;
      globalIsGhostReady = false;
      globalGhostProgress = 0;
      globalGhostProgressText = '';
    }

    notify();
  } catch (err) {
    console.error('[WebLLM Eco] Error unloading engine:', err);
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
      // 탭이 백그라운드로 전환되면 3분 타이머 구동
      if (visibilityTimer) clearTimeout(visibilityTimer);
      visibilityTimer = setTimeout(() => {
        if (globalMainEngine || globalGhostEngine) {
          console.log('[WebLLM Eco] 백그라운드 탭 3분 초과 감지: VRAM 절전 회수');
          performUnload('all');
        }
      }, HIDDEN_TAB_TIMEOUT_MS);
    } else {
      // 탭이 다시 활성화되면 절전 타이머 취소
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
    isGhostReady: globalIsGhostReady || globalIsMainReady, // Main engine can serve ghost tasks
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
   * Main Model Loader (Qwen2.5-3B by default)
   * Only loads the targeted main model into VRAM on-demand.
   */
  const initModel = useCallback(async (modelId?: string, loadGhostSeparately: boolean = false) => {
    if (globalMainEngine || globalIsMainLoading) return;

    const targetModelId = modelId || globalActiveModelId;
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
      globalMainProgressText = 'Qwen2.5-3B VRAM 로드 완료';
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
    } catch (error) {
      console.error('[WebLLM] Failed to initialize WebGPU model:', error);
      globalIsMainReady = false;
      globalMainProgressText = '초기화 실패 (WebGPU 미지원 또는 메모리 부족)';
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
   * Main Chat Generation Stream
   */
  const generateStream = useCallback(async function* (
    systemPrompt: string,
    userPrompt: string,
    options?: any
  ): AsyncGenerator<string, void, unknown> {
    if (!globalMainEngine) {
      throw new Error('[WebLLM] Main model is not loaded in VRAM');
    }

    touchEngineActivity();

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
  }, []);

  /**
   * GhostText Autocompletion Stream
   * Multiplexes to Main Engine if Ghost Engine is not separately loaded (0 extra VRAM cost).
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
  }, []);

  return {
    ...state,
    initModel,
    unloadModel,
    generateStream,
    generateGhostStream
  };
};
