/**
 * ============================================================================
 * @file useWebLLM.ts
 * @description useWebLLM.ts 시스템 모듈 구성요소로, 관련 UI 렌더링 및 비즈니스 로직을 담당합니다.
 * @usage 문서 에디터 및 뷰어 내부에서 동적으로 호출되거나 유틸리티 함수로 사용됩니다.
 * @example
 * // 예시 로직 (자동 생성됨)
 * import { something } from './useWebLLM';
 * 
 * @created 2026-08-10 20:30:36
 * @updated 2026-08-10 20:30:36
 * @author uno-km
 * @commit docs: 전체 소스코드 한글 주석 및 사내 컨벤션 일괄 적용
 * ============================================================================
 */

// [외부 패키지 및 라이브러리 임포트: react]
import { useState, useCallback, useEffect } from 'react';
// CreateMLCEngine is imported dynamically to save initial bundle size and avoid auto-loading WASM.
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

const listeners = new Set<() => void>();
const notify = () => listeners.forEach(fn => fn());

/**
 * useWebLLM 상태, 변수 또는 상수 선언부입니다.
 * @type {any} - Typescript 컴파일러에 의한 타입 추론(Inferred)
 */
export const useWebLLM = () => {
  const [state, setState] = useState({
    isMainReady: globalIsMainReady,
    isGhostReady: globalIsGhostReady,
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
        isGhostReady: globalIsGhostReady,
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

  const initModel = useCallback(async (modelId?: string) => {
    if (globalMainEngine || globalIsMainLoading) return;
    
    const targetModelId = modelId || globalActiveModelId;
    globalActiveModelId = targetModelId;
    globalIsMainLoading = true;
    globalIsGhostLoading = true;
    notify();

    try {
      const { CreateMLCEngine } = await import('@mlc-ai/web-llm');
      
      const p1 = CreateMLCEngine(targetModelId, { 
        initProgressCallback: (report: InitProgressReport) => {
          globalMainProgressText = `[Main] ${report.text}`;
          if (report.progress != null) globalMainProgress = report.progress;
          notify();
        } 
      }).then(engine => {
        globalMainEngine = engine;
        globalIsMainReady = true;
      });

      const p2 = CreateMLCEngine(GHOST_MODEL_ID, { 
        initProgressCallback: (report: InitProgressReport) => {
          globalGhostProgressText = `[Ghost] ${report.text}`;
          if (report.progress != null) globalGhostProgress = report.progress;
          notify();
        } 
      }).then(engine => {
        globalGhostEngine = engine;
        globalIsGhostReady = true;
      });

      await Promise.all([p1, p2]);
    } catch (error) {
      console.error('Failed to init WebLLM:', error);
      alert('AI 모델 초기화 실패. 브라우저가 WebGPU를 지원하지 않을 수 있습니다.');
    } finally {
      globalIsMainLoading = false;
      globalIsGhostLoading = false;
      notify();
    }
  }, []);


  const generateStream = useCallback(async function* (systemPrompt: string, userPrompt: string, options?: any) {
    if (!globalMainEngine) throw new Error('Main model not initialized');
    
    const chunks = await globalMainEngine.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      stream: true,
      temperature: options?.temperature ?? 0.2,
      max_tokens: options?.max_tokens ?? 1024,
      stop: options?.stop,
    });

    for await (const chunk of chunks) {
      const content = chunk.choices[0]?.delta?.content;
      if (content) {
        yield content;
      }
    }
  }, []);

  const generateGhostStream = useCallback(async function* (systemPrompt: string, userPrompt: string, options?: any) {
    if (!globalGhostEngine) throw new Error('Ghost model not initialized');
    
    const chunks = await globalGhostEngine.chat.completions.create({
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
  }, []);

  return { ...state, initModel, generateStream, generateGhostStream };
};
