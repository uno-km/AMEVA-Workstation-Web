/**
 * 파일명: types.ts
 * 역할: RAG 임베딩 엔진의 상태 및 타입 정의
 */

// [타입 정의]
export type EmbeddingStatus = 'idle' | 'loading-model' | 'embedding' | 'ready' | 'error';

export interface EmbeddingChunk {
  id: string;
  blockIndex: number;
  text: string;
  vector: number[];
  timestamp: number;
}

export interface EmbeddingState {
  status: EmbeddingStatus;
  progress: number;
  errorMsg: string | null;
  chunks: EmbeddingChunk[];
  modelLoaded: boolean;
}
