/**
 * ============================================================================
 * @file PromptFactory.ts
 * @system AMEVA OS Desktop Workstation
 * @location packages/core/src/renderer/services/llm/prompts/PromptFactory.ts
 * @role Abstract Prompt Factory & RAG Context Formatting Interface
 * 
 * [소비처 - CONSUMERS / USAGE CONTEXT]
 * - 소비처 A (PromptManager.ts): 모델별 팩토리 인스턴스 반환 시 인터페이스 규격으로 소비.
 * - 소비처 B (hooks/editor/useLLMAction.ts): 톤/요약/번역/RAG 질의 프롬프트 생성 호출.
 * - 소비처 C (features/rag-embedding/useEmbeddingEngine.ts): RAG 검색 결과 연동 프롬프트 조립에 소비.
 * 
 * [책임 범위 - RESPONSIBILITY]
 * - LLM 추론 엔진에 전달될 시스템 프롬프트(System Prompt) 규격을 추상화한다.
 * - RAG 검색 결과 청크 컬렉션을 AI가 이해하기 쉬운 정형화된 컨텍스트 마크다운으로 직렬화하는 공통 유틸리티를 제공한다.
 * 
 * [절대 깨면 안 되는 계약 - CONTRACT]
 * - MUST: 모든 RAG 프롬프트는 전달된 참조 컨텍스트(`[RELEVANT RETRIEVED KNOWLEDGE CONTEXT]`)를 명확한 구획으로 포함해야 한다.
 * ============================================================================
 */

import type { EmbeddingChunk } from '../../../features/rag-embedding/types';

/**
 * formatRAGContext 공통 헬퍼 함수
 * 다수의 RAG 임베딩 청크 또는 단일 문자열을 AI 모델이 파싱하기 쉬운 마크다운 문서 컨텍스트 블록으로 직렬화합니다.
 */
export function formatRAGContext(
  contextChunks: Array<EmbeddingChunk | { text: string; heading?: string; section?: string; score?: number }> | string
): string {
  if (typeof contextChunks === 'string') {
    return contextChunks.trim();
  }

  if (!Array.isArray(contextChunks) || contextChunks.length === 0) {
    return '제공된 참조 문서 정보가 없습니다.';
  }

  return contextChunks.map((chunk, idx) => {
    const text = typeof chunk === 'string' ? chunk : chunk.text;
    const heading = typeof chunk === 'object' && chunk.heading ? ` [위치/섹션: ${chunk.heading}]` : '';
    const scoreInfo = typeof chunk === 'object' && chunk.score !== undefined && chunk.score > 0
      ? ` (관련도 점수: ${(chunk.score * 100).toFixed(1)}%)`
      : '';
    return `### [참조 문서 ${idx + 1}${heading}${scoreInfo}]\n${text.trim()}`;
  }).join('\n\n');
}

/**
 * PromptFactory 인터페이스
 */
export interface PromptFactory {
  /** 비즈니스/경어체 어조 변환 프롬프트 생성 */
  createTonePrompt(contextText?: string): string;
  /** 핵심 요약 프롬프트 생성 */
  createSummaryPrompt(contextText?: string): string;
  /** 다국어 번역 프롬프트 생성 */
  createTranslationPrompt(targetLang: string, contextText?: string): string;
  /** RAG 검색 기반 문서 질의응답 시스템 프롬프트 생성 */
  createRAGPrompt(
    query: string,
    contextChunks: Array<EmbeddingChunk | { text: string; heading?: string; section?: string; score?: number }> | string,
    userInstructions?: string
  ): string;
}
