/**
 * 파일명: embeddingStore.ts
 * 역할: RAG 임베딩 엔진의 전역 상태 관리
 */

import type { EmbeddingState, EmbeddingStatus, EmbeddingChunk } from './types';

// [초기 상태]
let state: EmbeddingState = {
  status: 'idle',
  progress: 0,
  errorMsg: null,
  chunks: [],
  modelLoaded: false,
};

// [구독자 관리]
type Listener = (state: EmbeddingState) => void;
const listeners: Set<Listener> = new Set();

// [상태 조회]
export const getState = (): EmbeddingState => state;

// [상태 업데이트 및 구독자 알림]
export const setState = (partial: Partial<EmbeddingState>): void => {
  state = { ...state, ...partial };
  listeners.forEach((listener) => listener(state));
};

// [구독]
export const subscribe = (listener: Listener): (() => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

// [액션]
export const setStatus = (status: EmbeddingStatus): void => {
  setState({ status });
};

export const setProgress = (progress: number): void => {
  setState({ progress });
};

export const addChunk = (chunk: EmbeddingChunk): void => {
  setState({ chunks: [...state.chunks, chunk] });
};

export const clearChunks = (): void => {
  setState({ chunks: [] });
};

export const setError = (errorMsg: string): void => {
  setState({ status: 'error', errorMsg });
};
