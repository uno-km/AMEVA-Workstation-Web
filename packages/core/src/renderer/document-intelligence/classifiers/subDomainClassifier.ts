/**
 * ============================================================================
 * @file subDomainClassifier.ts
 * @description subDomainClassifier.ts 시스템 모듈 구성요소로, 관련 UI 렌더링 및 비즈니스 로직을 담당합니다.
 * @usage 문서 에디터 및 뷰어 내부에서 동적으로 호출되거나 유틸리티 함수로 사용됩니다.
 * @example
 * // 예시 로직 (자동 생성됨)
 * import { something } from './subDomainClassifier';
 * 
 * @created 2026-08-10 20:30:36
 * @updated 2026-08-10 20:30:36
 * @author uno-km
 * @commit docs: 전체 소스코드 한글 주석 및 사내 컨벤션 일괄 적용
 * ============================================================================
 */

// [내부 프로젝트 의존성 모듈 임포트: ../rules/types]
import type { DomainRule } from '../rules/types';
// [내부 프로젝트 의존성 모듈 임포트: ../types]
import type { DocumentSubDomainResult, KeywordStat, Entities } from '../types';

/**
 * classifySubDomain 함수의 핵심 비즈니스 로직 및 상태 제어를 처리합니다.
 * @remarks 이 주석은 컨벤션에 따라 자동 생성된 문서화 내용입니다.
 */
export function classifySubDomain(
  domainRule: DomainRule,
  fileName: string,
  keywords: KeywordStat[],
  sections: any[],
  fullText: string,
  entities: Entities
): DocumentSubDomainResult {
  const subDomains = domainRule.subDomains;
  if (!subDomains || subDomains.length === 0) {
    return { primary: 'unknown', label: '미분류', confidence: 0, scores: {}, evidence: [] };
  }

  const scores: Record<string, number> = {};
  const evidence: string[] = [];
  subDomains.forEach(sd => { scores[sd.id] = 0; });

  const fileNameLower = fileName.toLowerCase();
  
  subDomains.forEach(sd => {
    // Filename Hints
    sd.filenameHints?.forEach(hint => {
      if (fileNameLower.includes(hint.toLowerCase())) {
        scores[sd.id] += 40;
        evidence.push(`파일명에서 [${sd.label}] 관련 힌트 감지`);
      }
    });

    // Keywords
    keywords.slice(0, 50).forEach(kw => {
      if (sd.keywords.includes(kw.term)) {
        scores[sd.id] += kw.score;
      }
    });

    // Phrases
    sd.phrases?.forEach(phrase => {
      if (fullText.includes(phrase)) {
        scores[sd.id] += 20;
      }
    });

    // Sections
    sections.forEach(sec => {
      const secTitleLower = sec.title.toLowerCase();
      sd.sectionHints?.forEach(hint => {
        if (secTitleLower.includes(hint.toLowerCase())) {
          scores[sd.id] += 30;
        }
      });
    });
  });

  let maxScore = 0;
  let primary = 'unknown';
  let primaryLabel = '미분류';

  Object.entries(scores).forEach(([id, score]) => {
    if (score > maxScore) {
      maxScore = score;
      primary = id;
      primaryLabel = subDomains.find(s => s.id === id)?.label || id;
    }
  });

  const confidence = maxScore > 0 ? Math.min(100, Math.floor(maxScore / 2)) : 0;
  if (confidence < 20) {
    primary = 'unknown';
    primaryLabel = '미분류';
  } else {
    evidence.push(`세부 도메인(SubDomain) 분석 결과 [${primaryLabel}] 성격 강함`);
  }

  return { primary, label: primaryLabel, confidence, scores, evidence };
}
