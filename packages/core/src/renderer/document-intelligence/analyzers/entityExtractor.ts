/**
 * ============================================================================
 * @file entityExtractor.ts
 * @description entityExtractor.ts 시스템 모듈 구성요소로, 관련 UI 렌더링 및 비즈니스 로직을 담당합니다.
 * @usage 문서 에디터 및 뷰어 내부에서 동적으로 호출되거나 유틸리티 함수로 사용됩니다.
 * @example
 * // 예시 로직 (자동 생성됨)
 * import { something } from './entityExtractor';
 * 
 * @created 2026-08-10 20:30:36
 * @updated 2026-08-10 20:30:36
 * @author uno-km
 * @commit docs: 전체 소스코드 한글 주석 및 사내 컨벤션 일괄 적용
 * ============================================================================
 */

// [내부 프로젝트 의존성 모듈 임포트: ../types]
import type { Entities } from '../types';

/**
 * extractEntities 함수의 핵심 비즈니스 로직 및 상태 제어를 처리합니다.
 * @remarks 이 주석은 컨벤션에 따라 자동 생성된 문서화 내용입니다.
 */
export function extractEntities(fullText: string): Entities {
  const entities: Entities = { dates: [], money: [], organizations: [], emails: [], urls: [], percentages: [], phones: [] };

  const moneyRegex = /(?:₩|KRW|\\\$|USD|\d+(?:,\d{3})*\s*(?:원|달러|달라)|\d+(?:\.\d+)?\s*(?:억|만|천)\s*(?:원|달러))/g;
  const dateRegex = /\d{4}년\s*\d{1,2}월(?:\s*\d{1,2}일)?|\d{4}[./-]\d{1,2}[./-]\d{1,2}/g;
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  const orgRegex = /[가-힣a-zA-Z]+(?:대학교|대학원|학과|학부|센터|연구소|기관|협회|주식회사|㈜|Inc\.|Corp\.|Co\.,\s*Ltd)|주식회사\s+[가-힣a-zA-Z]+/g;
  const phoneRegex = /(?:010|02|0[3-9]{1,2})[-.]?\d{3,4}[-.]?\d{4}/g;
  const urlRegex = /https?:\/\/[a-zA-Z0-9.-]+(?:\.[a-zA-Z]{2,})+(?:\/[a-zA-Z0-9_.-]*)*\/?/g;

  entities.money = Array.from(new Set(fullText.match(moneyRegex) || []));
  entities.dates = Array.from(new Set(fullText.match(dateRegex) || []));
  entities.emails = Array.from(new Set(fullText.match(emailRegex) || []));
  entities.organizations = Array.from(new Set(fullText.match(orgRegex) || []));
  entities.phones = Array.from(new Set(fullText.match(phoneRegex) || []));
  entities.urls = Array.from(new Set(fullText.match(urlRegex) || []));

  return entities;
}
