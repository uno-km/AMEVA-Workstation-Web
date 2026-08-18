/**
 * ============================================================================
 * @file types.ts
 * @system AMEVA OS Desktop Workstation - AI Intelligence Core
 * @location packages/core/src/renderer/features/ai-agent/types.ts
 * @role Platform-Agnostic AI Agent Domain Types & Port Interfaces
 * ============================================================================
 */

import type { EmbeddingChunk, HybridSearchOptions } from '../rag-embedding/types';

export interface HistoryMessage {
  role: 'user' | 'assistant';
  content: string;
}

/** 추론 제어 옵션 */
export interface InferenceOptions {
  signal?: AbortSignal;
  max_tokens?: number;
  temperature?: number;
  stop?: string[];
  history?: HistoryMessage[];
}

/** 블록 삽입 제안 (AI가 에디터에 새 블록을 추가하도록 추천) */
export interface InsertSuggestion {
  /** 이 블록 다음에 삽입. 'START' = 문서 맨 앞, 'END' = 문서 맨 끝 */
  afterBlockId: string;
  /** 삽입할 블록 타입 */
  blockType: 'heading' | 'paragraph' | 'bulletListItem' | 'numberedListItem' | 'table' | 'codeBlock';
  /** heading일 때 레벨 (1~3) */
  level?: 1 | 2 | 3;
  /** 삽입할 텍스트 내용 */
  content: string;
  /** AI가 해당 위치를 추천한 이유 */
  reasonText?: string;
  /** 제안 수락 상태 */
  status: 'pending' | 'accepted' | 'rejected';
}

/** 단락 수정/치환 제안 */
export interface EditSuggestion {
  blockId: string;
  originalText: string;
  proposedText: string;
  status: 'pending' | 'accepted' | 'rejected';
  reason?: string;
}

/** 에이전트 대화 메시지 규격 */
export interface AgentMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  isStreaming?: boolean;
  error?: boolean;
  /** 태그된 블록 참조 */
  taggedBlocks?: Array<{ id: string; text: string }>;
  /** CoT 사고 과정 (<think> 태그 내부 텍스트) */
  thought?: string;
  /** RAG 참조 청크 출처 */
  citations?: Array<{
    chunkId?: string;
    heading?: string;
    section?: string;
    text: string;
    score?: number;
    blockId?: string;
  }>;
  /** 블록 삽입 제안들 */
  insertSuggestions?: InsertSuggestion[];
  /** 단락 치환 제안 */
  editSuggestion?: EditSuggestion;
}

/** 1. LLM 추론 엔진 어댑터 포트 (Port) */
export interface IAIEngineAdapter {
  readonly id: string;
  readonly name: string;
  isReady: boolean;
  init(modelId?: string): Promise<void>;
  generateStream(
    systemPrompt: string,
    userPrompt: string,
    options?: InferenceOptions
  ): AsyncGenerator<string, void, unknown>;
}

/** 2. RAG 지식 검색 포트 (Port) */
export interface IRAGRetriever {
  search(query: string, options?: HybridSearchOptions): Promise<EmbeddingChunk[]>;
  buildContextPrompt(query: string, options?: HybridSearchOptions): Promise<{ prompt: string; chunks: EmbeddingChunk[] }>;
}

/** 3. 에이전트 도구 규격 및 레지스트리 포트 (Port) */
export interface ToolDefinition {
  name: string;
  description: string;
  parameters: Record<string, any>;
}

export interface ToolResult {
  success: boolean;
  output?: any;
  error?: string;
}

export interface IToolRegistry {
  listTools(): ToolDefinition[];
  executeTool(name: string, args: Record<string, any>): Promise<ToolResult>;
}
