/**
 * ============================================================================
 * @file types.ts
 * @description types.ts 시스템 모듈 구성요소로, 관련 UI 렌더링 및 비즈니스 로직을 담당합니다.
 * @usage 문서 에디터 및 뷰어 내부에서 동적으로 호출되거나 유틸리티 함수로 사용됩니다.
 * @example
 * // 예시 로직 (자동 생성됨)
 * import { something } from './types';
 * 
 * @created 2026-08-10 20:30:36
 * @updated 2026-08-10 20:30:36
 * @author uno-km
 * @commit docs: 전체 소스코드 한글 주석 및 사내 컨벤션 일괄 적용
 * ============================================================================
 */

/**
 * DocumentSourceMeta 모듈 내외부에서 사용되는 데이터 통신 규격 및 타입을 정의합니다.
 * @remarks 이 주석은 컨벤션에 따라 자동 생성된 문서화 내용입니다.
 */
export interface DocumentSourceMeta {
  fileName: string;
  docType: 'pdf' | 'docx' | 'pptx' | 'xlsx' | 'unknown';
  fileSize: number;
  pageCount: number;
  sheetCount?: number;
  slideCount?: number;
}

/**
 * KeywordStat 모듈 내외부에서 사용되는 데이터 통신 규격 및 타입을 정의합니다.
 * @remarks 이 주석은 컨벤션에 따라 자동 생성된 문서화 내용입니다.
 */
export interface KeywordStat {
  term: string;
  count: number;
  score: number;
  pages: number[];
}

/**
 * CoOccurrence 모듈 내외부에서 사용되는 데이터 통신 규격 및 타입을 정의합니다.
 * @remarks 이 주석은 컨벤션에 따라 자동 생성된 문서화 내용입니다.
 */
export interface CoOccurrence {
  terms: [string, string];
  count: number;
  pages: number[];
}

/**
 * SectionCandidate 모듈 내외부에서 사용되는 데이터 통신 규격 및 타입을 정의합니다.
 * @remarks 이 주석은 컨벤션에 따라 자동 생성된 문서화 내용입니다.
 */
export interface SectionCandidate {
  title: string;
  page: number;
  level: number;
  confidence: number;
  source: 'outline' | 'pattern' | 'heuristic';
}

/**
 * Entities 모듈 내외부에서 사용되는 데이터 통신 규격 및 타입을 정의합니다.
 * @remarks 이 주석은 컨벤션에 따라 자동 생성된 문서화 내용입니다.
 */
export interface Entities {
  dates: string[];
  money: string[];
  organizations: string[];
  emails: string[];
  urls: string[];
  percentages: string[];
  phones: string[];
}

/**
 * DocumentSubDomainResult 모듈 내외부에서 사용되는 데이터 통신 규격 및 타입을 정의합니다.
 * @remarks 이 주석은 컨벤션에 따라 자동 생성된 문서화 내용입니다.
 */
export interface DocumentSubDomainResult {
  primary: string;
  label: string;
  confidence: number;
  scores: Record<string, number>;
  evidence: string[];
}

/**
 * DocumentIntentResult 모듈 내외부에서 사용되는 데이터 통신 규격 및 타입을 정의합니다.
 * @remarks 이 주석은 컨벤션에 따라 자동 생성된 문서화 내용입니다.
 */
export interface DocumentIntentResult {
  primary: string;
  label: string;
  confidence: number;
  evidence: string[];
}

/**
 * DocumentClassificationResult 모듈 내외부에서 사용되는 데이터 통신 규격 및 타입을 정의합니다.
 * @remarks 이 주석은 컨벤션에 따라 자동 생성된 문서화 내용입니다.
 */
export interface DocumentClassificationResult {
  primary: string;
  confidence: number;
  scores: Record<string, number>;
  evidence: string[];
}

/**
 * TopicCluster 모듈 내외부에서 사용되는 데이터 통신 규격 및 타입을 정의합니다.
 * @remarks 이 주석은 컨벤션에 따라 자동 생성된 문서화 내용입니다.
 */
export interface TopicCluster {
  id: string;
  label: string;
  terms: string[];
  phrases: string[];
  pages: number[];
  score: number;
  confidence: number;
  evidence: string[];
}

/**
 * DocumentProfileResult 모듈 내외부에서 사용되는 데이터 통신 규격 및 타입을 정의합니다.
 * @remarks 이 주석은 컨벤션에 따라 자동 생성된 문서화 내용입니다.
 */
export interface DocumentProfileResult {
  version: string;
  source: DocumentSourceMeta;
  profile: {
    primaryType: string;
    displayLabel: string;
    classificationStatus: 'classified' | 'low_confidence' | 'domain_detected_shape_unknown' | 'shape_detected_domain_unknown' | 'unknown';
    documentShape: DocumentClassificationResult;
    documentDomain: DocumentClassificationResult;
    documentSubDomain?: DocumentSubDomainResult;
    intent?: DocumentIntentResult;
    discoveredTopics?: TopicCluster[];
    primaryTopic?: TopicCluster;
    confidence: number;
    evidence: string[];
    fallbackMessage?: string;
  };
  keywords: KeywordStat[];
  coOccurrences: CoOccurrence[];
  sections: SectionCandidate[];
  entities: Entities;
  importantPages: { page: number; score: number; reasons: string[] }[];
  pageStats: { page: number; charCount: number; tokenCount: number; topTerms: string[] }[];
  warnings: string[];
}
