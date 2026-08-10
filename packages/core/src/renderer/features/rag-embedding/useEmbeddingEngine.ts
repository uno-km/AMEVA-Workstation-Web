/**
 * 파일명: useEmbeddingEngine.ts
 * 역할: RAG 임베딩 엔진과 상호작용하는 React 훅
 */

// [React 임포트]
import { useState, useEffect, useCallback, useRef } from 'react';

// [내부 모듈 임포트]
import { getState, subscribe, setStatus, setProgress, setError, addChunk, clearChunks, setState } from './embeddingStore';
import { EmbeddingChunk, EmbeddingState } from './types';

export const useEmbeddingEngine = () => {
  const [state, setLocalState] = useState<EmbeddingState>(getState());
  const workerRef = useRef<Worker | null>(null);

  // [상태 구독]
  useEffect(() => {
    const unsubscribe = subscribe((newState) => {
      setLocalState(newState);
    });
    return unsubscribe;
  }, []);

  // [워커 초기화 및 정리]
  useEffect(() => {
    workerRef.current = new Worker(new URL('./embeddingWorker.ts', import.meta.url), { type: 'module' });

    workerRef.current.onmessage = (event: MessageEvent) => {
      const { type, progress, errorMsg, chunk } = event.data;

      switch (type) {
        case 'PROGRESS':
          setProgress(progress);
          break;
        case 'MODEL_LOADED':
          setState({ modelLoaded: true, status: 'idle', progress: 100 });
          break;
        case 'CHUNK_READY':
          addChunk(chunk);
          break;
        case 'DONE':
          setStatus('ready');
          break;
        case 'ERROR':
          setError(errorMsg);
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

  // [모델 로드 시작]
  const loadModel = useCallback(() => {
    if (state.modelLoaded || state.status === 'loading-model') return;
    setStatus('loading-model');
    setProgress(0);
    workerRef.current?.postMessage({ type: 'LOAD_MODEL' });
  }, [state.modelLoaded, state.status]);

  // [임베딩 시작]
  const startEmbedding = useCallback((blocks: string[]) => {
    if (!state.modelLoaded) {
      loadModel();
      // Wait for model load? We could queue it, but simpler to expect modelLoaded to be true.
      // Let's just return for now if model isn't loaded, or maybe load and then we can't await easily since it's worker based without promises.
      // For phase 1, assume we load model first via onActivate, then user triggers embedding or we do it automatically.
      // Actually, if not loaded, load it and maybe return.
      console.warn('모델이 아직 로드되지 않았습니다.');
      return;
    }
    
    setStatus('embedding');
    clearChunks();
    workerRef.current?.postMessage({ type: 'EMBED_BLOCKS', blocks });
  }, [state.modelLoaded, loadModel]);

  // [코사인 유사도 계산]
  const cosineSimilarity = useCallback((a: number[], b: number[]): number => {
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    if (normA === 0 || normB === 0) return 0;
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }, []);

  // [청크 검색]
  const searchChunks = useCallback(async (query: string, topK: number = 3): Promise<EmbeddingChunk[]> => {
    // This implies we need to embed the query first.
    // However, our worker only sends chunks back. We might need a separate mechanism to embed a query.
    // For phase 1 stub/hook structure, we can just return empty or throw if not implemented.
    // Let's just return empty array for now since query embedding would require sending query to worker and awaiting result.
    console.warn('검색 기능은 향후 구현 예정입니다. (워커 연동 필요)');
    return [];
  }, []);

  return {
    status: state.status,
    progress: state.progress,
    modelLoaded: state.modelLoaded,
    loadModel,
    startEmbedding,
    cosineSimilarity,
    searchChunks,
  };
};
