/**
 * 파일명: useEmbeddingEngine.ts
 * 역할: RAG 임베딩 엔진과 상호작용하는 React 훅
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { getState, subscribe, setStatus, setProgress, setError, addChunk, clearChunks, setState } from './embeddingStore';
import { EmbeddingChunk, EmbeddingState } from './types';
import * as vectorStore from './vectorStore';

export const useEmbeddingEngine = () => {
  const [state, setLocalState] = useState<EmbeddingState>(getState());
  const workerRef = useRef<Worker | null>(null);
  const resolversRef = useRef<{ [key: string]: (vector: number[]) => void }>({});

  useEffect(() => {
    const unsubscribe = subscribe((newState) => {
      setLocalState(newState);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    workerRef.current = new Worker(new URL('./embeddingWorker.ts', import.meta.url), { type: 'module' });

    workerRef.current.onmessage = async (event: MessageEvent) => {
      const { type, progress, errorMsg, chunk, vector, queryId } = event.data;

      switch (type) {
        case 'PROGRESS':
          setProgress(progress);
          break;
        case 'MODEL_LOADED':
          setState({ modelLoaded: true, status: 'ready', progress: 100 });
          break;
        case 'CHUNK_READY':
          addChunk(chunk);
          await vectorStore.saveChunk(chunk);
          break;
        case 'DONE':
          setStatus('ready');
          break;
        case 'ERROR':
          setError(errorMsg);
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

  const initEngine = useCallback(() => {
    if (state.modelLoaded || state.status === 'loading-model') return;
    setStatus('loading-model');
    setProgress(0);
    workerRef.current?.postMessage({ type: 'LOAD_MODEL' });
  }, [state.modelLoaded, state.status]);

  const embedDocument = useCallback(async (editorMarkdown: string) => {
    if (!state.modelLoaded) {
      console.warn('모델이 아직 로드되지 않았습니다.');
      return;
    }
    
    setStatus('embedding');
    clearChunks();
    await vectorStore.clearChunks();
    
    const blocks = editorMarkdown.split(/(?:\n\n|---)/).map(b => b.trim()).filter(b => b.length > 0);
    workerRef.current?.postMessage({ type: 'EMBED_BLOCKS', blocks });
  }, [state.modelLoaded]);

  const searchRAG = useCallback(async (query: string, topK: number = 5): Promise<EmbeddingChunk[]> => {
    if (!state.modelLoaded || !workerRef.current) {
      console.warn('엔진이 준비되지 않았습니다.');
      return [];
    }
    
    const queryId = Date.now().toString() + Math.random().toString();
    const vectorPromise = new Promise<number[]>((resolve) => {
      resolversRef.current[queryId] = resolve;
    });
    
    workerRef.current.postMessage({ type: 'EMBED_QUERY', query, queryId });
    const queryVector = await vectorPromise;
    
    const allChunks = await vectorStore.loadAllChunks();
    return vectorStore.searchSimilar(queryVector, topK, allChunks);
  }, [state.modelLoaded]);

  return {
    ...state,
    initEngine,
    embedDocument,
    searchRAG,
  };
};
