/**
 * ============================================================================
 * @file documentHostIpcContract.ts
 * @description documentHostIpcContract.ts 시스템 모듈 구성요소로, 관련 UI 렌더링 및 비즈니스 로직을 담당합니다.
 * @usage 문서 에디터 및 뷰어 내부에서 동적으로 호출되거나 유틸리티 함수로 사용됩니다.
 * @example
 * // 예시 로직 (자동 생성됨)
 * import { something } from './documentHostIpcContract';
 * 
 * @created 2026-08-10 20:30:36
 * @updated 2026-08-10 20:30:36
 * @author uno-km
 * @commit docs: 전체 소스코드 한글 주석 및 사내 컨벤션 일괄 적용
 * ============================================================================
 */

// [내부 프로젝트 의존성 모듈 임포트: ../types]
import { DocumentArtifactFormat } from '../types'; // I need to make sure this import resolves or just define the types directly if easier.

/**
 * DocumentHostRequestBase 모듈 내외부에서 사용되는 데이터 통신 규격 및 타입을 정의합니다.
 * @remarks 이 주석은 컨벤션에 따라 자동 생성된 문서화 내용입니다.
 */
export interface DocumentHostRequestBase {
  missionId: string;
  taskId: string;
  attemptId: string;
  workbenchSessionId: string;
  sessionCapabilityToken: string;
  documentJobId: string;
  documentId: string;
  artifactId: string;
  artifactRevision: string;
  artifactFormat: string;
  idempotencyKey: string;
}

/**
 * DocumentArtifactGenerateRequest 모듈 내외부에서 사용되는 데이터 통신 규격 및 타입을 정의합니다.
 * @remarks 이 주석은 컨벤션에 따라 자동 생성된 문서화 내용입니다.
 */
export interface DocumentArtifactGenerateRequest extends DocumentHostRequestBase {
  integratedDocumentReference: string; // The full text or a reference ID
  outputLogicalPath: string; // e.g. "output.docx"
  expectedContentDigest?: string;
  generationOptions?: any;
}

/**
 * DocumentArtifactExtractRequest 모듈 내외부에서 사용되는 데이터 통신 규격 및 타입을 정의합니다.
 * @remarks 이 주석은 컨벤션에 따라 자동 생성된 문서화 내용입니다.
 */
export interface DocumentArtifactExtractRequest extends DocumentHostRequestBase {
  artifactReference: string; // The logical path
  expectedArtifactDigest?: string;
  expectedDocumentId?: string;
  reopenPolicyVersion?: string;
}

/**
 * GenerationResult 모듈 내외부에서 사용되는 데이터 통신 규격 및 타입을 정의합니다.
 * @remarks 이 주석은 컨벤션에 따라 자동 생성된 문서화 내용입니다.
 */
export interface GenerationResult {
  success: boolean;
  format: string;
  generatorName: string;
  generatorVersion: string;
  generatorCapability: string;
  generationExecutionProvenance: string;
  generatedByteLength: number;
  artifactDigest: string;
  outputArtifactReference: string;
  warnings: string[];
  errorCode?: string;
}

/**
 * ExtractionResult 모듈 내외부에서 사용되는 데이터 통신 규격 및 타입을 정의합니다.
 * @remarks 이 주석은 컨벤션에 따라 자동 생성된 문서화 내용입니다.
 */
export interface ExtractionResult {
  success: boolean;
  format: string;
  extractorName: string;
  extractorVersion: string;
  extractorCapability: string;
  extractionExecutionProvenance: string;
  extractedTextLength: number;
  extractedText?: string;
  normalizedText?: string;
  normalizedTextDigest: string;
  extractionDigest: string;
  sectionCandidates: string[];
  warnings: string[];
  errorCode?: string;
  retryable?: boolean;
}

/**
 * DocumentHostResponse 모듈 내외부에서 사용되는 데이터 통신 규격 및 타입을 정의합니다.
 * @remarks 이 주석은 컨벤션에 따라 자동 생성된 문서화 내용입니다.
 */
export type DocumentHostResponse<T> = 
  | { success: true; result: T }
  | { success: false; errorCode: string; safeMessage: string; retryable: boolean };
