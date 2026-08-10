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
 * DomainSubRule 모듈 내외부에서 사용되는 데이터 통신 규격 및 타입을 정의합니다.
 * @remarks 이 주석은 컨벤션에 따라 자동 생성된 문서화 내용입니다.
 */
export interface DomainSubRule {
  id: string;
  label: string;
  keywords: string[];
  phrases?: string[];
  sectionHints?: string[];
  filenameHints?: string[];
  unitHints?: string[];
  entityHints?: string[];
  negativeKeywords?: string[];
  weight?: number;
}

/**
 * DomainRule 모듈 내외부에서 사용되는 데이터 통신 규격 및 타입을 정의합니다.
 * @remarks 이 주석은 컨벤션에 따라 자동 생성된 문서화 내용입니다.
 */
export interface DomainRule {
  id: string;
  label: string;
  source: 'builtin' | 'user' | 'team';
  version: string;

  keywords: string[];
  phrases?: string[];
  sectionHints?: string[];
  filenameHints?: string[];
  unitHints?: string[];
  entityHints?: string[];
  negativeKeywords?: string[];

  strongPhrases?: string[];
  weakKeywords?: string[];
  ambiguousKeywords?: string[];

  subDomains?: DomainSubRule[];
  weight: number;
}

/**
 * ShapeRule 모듈 내외부에서 사용되는 데이터 통신 규격 및 타입을 정의합니다.
 * @remarks 이 주석은 컨벤션에 따라 자동 생성된 문서화 내용입니다.
 */
export interface ShapeRule {
  id: string;
  label: string;
  keywords: string[];
}
