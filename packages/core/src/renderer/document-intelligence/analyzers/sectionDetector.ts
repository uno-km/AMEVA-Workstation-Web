/**
 * ============================================================================
 * @file sectionDetector.ts
 * @description sectionDetector.ts 시스템 모듈 구성요소로, 관련 UI 렌더링 및 비즈니스 로직을 담당합니다.
 * @usage 문서 에디터 및 뷰어 내부에서 동적으로 호출되거나 유틸리티 함수로 사용됩니다.
 * @example
 * // 예시 로직 (자동 생성됨)
 * import { something } from './sectionDetector';
 * 
 * @created 2026-08-10 20:30:36
 * @updated 2026-08-10 20:30:36
 * @author uno-km
 * @commit docs: 전체 소스코드 한글 주석 및 사내 컨벤션 일괄 적용
 * ============================================================================
 */

// [내부 프로젝트 의존성 모듈 임포트: ../types]
import type { SectionCandidate } from '../types';

/**
 * detectSections 함수의 핵심 비즈니스 로직 및 상태 제어를 처리합니다.
 * @remarks 이 주석은 컨벤션에 따라 자동 생성된 문서화 내용입니다.
 */
export function detectSections(pagesText: { page: number; text: string }[]): SectionCandidate[] {
  const sections: SectionCandidate[] = [];
  
  // 섹션 정규식 확장
  // 1. 기존: 제 1 장, Chapter 1, 1. 개요
  // 2. 신규: "제목 - 부제", "제목 – 1) 단계명" (하이픈, 엔대시, 엠대시 허용)
  const sectionRegex = /^(?:제\s*\d+\s*장|Chapter\s*\d+|\d+\.\s*[가-힣a-zA-Z]{2,10}|[가-힣a-zA-Z0-9\s]+[-–—]\s*(?:\d+\))?\s*[가-힣a-zA-Z0-9\s]+)\s*$/m;

  pagesText.forEach(({ page, text }) => {
    const lines = text.split('\n');
    lines.forEach(line => {
      const trimmed = line.trim();
      const match = trimmed.match(sectionRegex);
      if (match && trimmed.length > 2 && trimmed.length < 50) {
        sections.push({
          title: match[0],
          page,
          level: 1,
          confidence: 0.8,
          source: 'pattern'
        });
      }
    });
  });

  return sections;
}
