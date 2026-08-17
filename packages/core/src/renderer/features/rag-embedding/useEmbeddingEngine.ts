/**
 * ============================================================================
 * @file useEmbeddingEngine.ts
 * @system AMEVA OS Desktop Workstation
 * @location packages/core/src/renderer/features/rag-embedding/useEmbeddingEngine.ts
 * @role React Hook Facade for RAG Lifecycle, Hybrid Search & Prompt Orchestration
 * 
 * [소비처 - CONSUMERS / USAGE CONTEXT]
 * - 소비처 A (components/statusbar/EmbeddingStatusIndicator.tsx): 임베딩 상태 모니터링 및 수동 트리거.
 * - 소비처 B (hooks/editor/useLLMAction.ts): RAG 검색 결과 기반 인라인 질의응답 처리.
 * - 소비처 C (App.tsx): 전역 AI 어시스턴트 RAG 파이프라인 연동.
 * 
 * [책임 범위 - RESPONSIBILITY]
 * - 임베딩 Web Worker의 생명주기를 안전하게 초기화/해제(`Worker.terminate`)한다.
 * - 지능형 청킹(`chunkBlocksWithContext`)을 통한 계층 문맥 보존 임베딩을 트리거한다.
 * - RRF(Reciprocal Rank Fusion) 하이브리드 검색 및 AI 프롬프트 자동 조립(`searchAndBuildPrompt`)을 수행한다.
 * 
 * [절대 깨면 안 되는 계약 - CONTRACT]
 * - MUST: 모델 미로드 상태에서 질의 시 크래시 없이 어휘(Keyword-only) 검색으로 자동 폴백할 것.
 * - MUST: 언마운트 시 활성 Web Worker를 정상 종료하여 브라우저 메모리 누수를 차단할 것.
 * ============================================================================
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { getState, subscribe, setStatus, setProgress, setError, addChunk, clearChunks, setState } from './embeddingStore';
import type { EmbeddingChunk, EmbeddingState, HybridSearchOptions, RetrievalSearchMode } from './types';
import * as vectorStore from './vectorStore';
import { chunkBlocksWithContext } from '../../utils/ragUtils';
import { PromptManager } from '../../services/llm/prompts/PromptManager';

export const useEmbeddingEngine = () => {
  const [state, setLocalState] = useState<EmbeddingState>(getState());
  const workerRef = useRef<Worker | null>(null);
  const resolversRef = useRef<{ [key: string]: (vector: number[]) => void }>({});

  // 1. 전역 임베딩 스토어 구독
  useEffect(() => {
    const unsubscribe = subscribe((newState) => {
      setLocalState(newState);
    });
    return unsubscribe;
  }, []);

  // 2. Web Worker 초기화 및 메시지 핸들러 등록
  useEffect(() => {
    workerRef.current = new Worker(new URL('./embeddingWorker.ts', import.meta.url), { type: 'module' });

    workerRef.current.onmessage = async (event: MessageEvent) => {
      const { type, progress, errorMsg, chunk, vector, queryId } = event.data;

      switch (type) {
        case 'PROGRESS':
          if (progress !== undefined) setProgress(progress);
          break;
        case 'MODEL_LOADED':
          setState({ modelLoaded: true, status: 'ready', progress: 100 });
          break;
        case 'CHUNK_READY':
          if (chunk) {
            addChunk(chunk);
            await vectorStore.saveChunk(chunk);
          }
          if (progress !== undefined) setProgress(progress);
          break;
        case 'DONE':
          setStatus('ready');
          break;
        case 'ERROR':
          setError(errorMsg || '알 수 없는 오류');
          break;
        case 'QUERY_EMBEDDED':
          if (queryId && resolversRef.current[queryId]) {
            resolversRef.current[queryId](vector);
            delete resolversRef.current[queryId];
          }
          break;
      }
    };

    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
        workerRef.current = null;
      }
    };
  }, []);

  /**
   * initEngine 함수
   * HuggingFace ONNX 임베딩 모델(WebGPU/WASM)을 백그라운드 로드합니다.
   */
  const initEngine = useCallback(() => {
    if (state.modelLoaded || state.status === 'loading-model') return;
    setStatus('loading-model');
    setProgress(0);
    workerRef.current?.postMessage({ type: 'LOAD_MODEL' });
  }, [state.modelLoaded, state.status]);

  /**
   * embedDocument 함수
   * 에디터 블록 트리(`AmevaBlock[]`) 또는 마크다운 텍스트를 전달받아
   * 지능형 문맥 청킹을 거친 후 Web Worker로 임베딩을 일괄 수행합니다.
   */
  const embedDocument = useCallback(async (content: any[] | string) => {
    if (!state.modelLoaded) {
      console.warn('[useEmbeddingEngine] 임베딩 모델이 아직 로드되지 않았습니다.');
      return;
    }
    
    setStatus('embedding');
    setProgress(0);
    clearChunks();
    await vectorStore.clearChunks();
    
    // 지능형 문맥 청킹 수행 (헤딩 계층 및 섹션 메타데이터 포함)
    const contextualChunks = chunkBlocksWithContext(content);
    
    if (contextualChunks.length === 0) {
      setStatus('ready');
      return;
    }

    workerRef.current?.postMessage({ type: 'EMBED_BLOCKS', blocks: contextualChunks });
  }, [state.modelLoaded]);

  /**
   * searchRAG 함수 (하이브리드 RRF 검색)
   * 사용자 질문에 대해 벡터 유사도와 키워드 매칭을 융합하여 상위 청크를 반환합니다.
   */
  const searchRAG = useCallback(async (
    query: string,
    options?: number | HybridSearchOptions
  ): Promise<EmbeddingChunk[]> => {
    const opts: HybridSearchOptions = typeof options === 'number' 
      ? { topK: options } 
      : (options || {});

    const topK = opts.topK ?? 5;
    const mode = opts.mode ?? 'hybrid';

    // 저장소에서 전체 청크 로드 (DB 실패 시 메모리 청크 사용)
    let allChunks: EmbeddingChunk[] = [];
    try {
      allChunks = await vectorStore.loadAllChunks();
    } catch {
      allChunks = state.chunks;
    }

    if (allChunks.length === 0) {
      allChunks = state.chunks;
    }

    if (allChunks.length === 0) {
      return [];
    }

    // 1. 모델이 준비되지 않았거나 키워드 모드인 경우 어휘 검색으로 폴백
    if (!state.modelLoaded || !workerRef.current || mode === 'keyword') {
      return vectorStore.searchKeywordOnly(query, topK, allChunks);
    }

    // 2. 쿼리 벡터 생성 (Web Worker 비동기 요청)
    const queryId = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const vectorPromise = new Promise<number[]>((resolve) => {
      resolversRef.current[queryId] = resolve;
    });

    workerRef.current.postMessage({ type: 'EMBED_QUERY', query, queryId });
    const queryVector = await vectorPromise;

    // 3. 전략 패턴을 통한 검색 실행 (기본: Hybrid RRF)
    const strategy = vectorStore.getRetrievalStrategy(mode);
    return strategy.search(query, queryVector, allChunks, opts);
  }, [state.modelLoaded, state.chunks]);

  /**
   * searchAndBuildPrompt 함수
   * RAG 검색을 수행하고, 모델 규격에 맞는 시스템 프롬프트를 자동으로 조립하여 반환합니다.
   */
  const searchAndBuildPrompt = useCallback(async (
    query: string,
    options?: {
      topK?: number;
      modelId?: string;
      userInstructions?: string;
      mode?: RetrievalSearchMode;
    }
  ): Promise<{ prompt: string; chunks: EmbeddingChunk[] }> => {
    const chunks = await searchRAG(query, {
      topK: options?.topK ?? 5,
      mode: options?.mode ?? 'hybrid'
    });

    const factory = PromptManager.getFactory(options?.modelId);
    const prompt = factory.createRAGPrompt(query, chunks, options?.userInstructions);

    return { prompt, chunks };
  }, [searchRAG]);

  return {
    ...state,
    initEngine,
    embedDocument,
    searchRAG,
    searchHybrid: searchRAG,
    searchAndBuildPrompt,
  };
};
