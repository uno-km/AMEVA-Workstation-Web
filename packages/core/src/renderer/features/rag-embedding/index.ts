/**
 * ============================================================================
 * @file index.ts
 * @system AMEVA OS Desktop Workstation
 * @location packages/core/src/renderer/features/rag-embedding/index.ts
 * @role RAG Embedding & Hybrid Retrieval Module Public Entry Point
 * ============================================================================
 */

export type {
  EmbeddingStatus,
  EmbeddingChunk,
  EmbeddingState,
  ContextualChunkPayload,
  HybridSearchOptions,
  RetrievalSearchMode,
  IRetrievalStrategy
} from './types';

export { useEmbeddingEngine } from './useEmbeddingEngine';
export * as vectorStore from './vectorStore';
