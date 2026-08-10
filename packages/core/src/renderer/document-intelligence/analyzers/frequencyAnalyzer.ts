/**
 * ============================================================================
 * @file frequencyAnalyzer.ts
 * @description frequencyAnalyzer.ts 시스템 모듈 구성요소로, 관련 UI 렌더링 및 비즈니스 로직을 담당합니다.
 * @usage 문서 에디터 및 뷰어 내부에서 동적으로 호출되거나 유틸리티 함수로 사용됩니다.
 * @example
 * // 예시 로직 (자동 생성됨)
 * import { something } from './frequencyAnalyzer';
 * 
 * @created 2026-08-10 20:30:36
 * @updated 2026-08-10 20:30:36
 * @author uno-km
 * @commit docs: 전체 소스코드 한글 주석 및 사내 컨벤션 일괄 적용
 * ============================================================================
 */

// [내부 프로젝트 의존성 모듈 임포트: ../tokenizer]
import { tokenize } from '../tokenizer';
// [내부 프로젝트 의존성 모듈 임포트: ../types]
import type { KeywordStat } from '../types';

/**
 * analyzeFrequency 함수의 핵심 비즈니스 로직 및 상태 제어를 처리합니다.
 * @remarks 이 주석은 컨벤션에 따라 자동 생성된 문서화 내용입니다.
 */
export function analyzeFrequency(
  pagesText: { page: number; text: string }[],
  fileName: string = ''
): KeywordStat[] {
  const freqMap = new Map<string, { count: number; pages: Set<number> }>();

  for (const { page, text } of pagesText) {
    const tokens = tokenize(text);
    for (const token of tokens) {
      if (!freqMap.has(token)) {
        freqMap.set(token, { count: 0, pages: new Set() });
      }
      const data = freqMap.get(token)!;
      data.count += 1;
      data.pages.add(page);
    }
  }

  const results: KeywordStat[] = [];
  freqMap.forEach((data, term) => {
    // 기본 TF * (페이지 분산 가중치)
    let score = data.count * Math.log(1 + data.pages.size);
    
    // filenameBoost
    if (fileName && fileName.includes(term)) {
      score *= 1.5;
    }
    
    // 기능어 패널티 (tokenizer에서 제거안된 경우 대비)
    if (term.endsWith('합니다') || term.endsWith('있습니다') || term.endsWith('입니다')) {
      score *= 0.1;
    }

    results.push({ term, count: data.count, score, pages: Array.from(data.pages) });
  });

  return results.sort((a, b) => b.score - a.score).slice(0, 50); // 상위 50개 반환
}
