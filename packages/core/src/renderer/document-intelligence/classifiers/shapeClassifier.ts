/**
 * ============================================================================
 * @file shapeClassifier.ts
 * @description shapeClassifier.ts 시스템 모듈 구성요소로, 관련 UI 렌더링 및 비즈니스 로직을 담당합니다.
 * @usage 문서 에디터 및 뷰어 내부에서 동적으로 호출되거나 유틸리티 함수로 사용됩니다.
 * @example
 * // 예시 로직 (자동 생성됨)
 * import { something } from './shapeClassifier';
 * 
 * @created 2026-08-10 20:30:36
 * @updated 2026-08-10 20:30:36
 * @author uno-km
 * @commit docs: 전체 소스코드 한글 주석 및 사내 컨벤션 일괄 적용
 * ============================================================================
 */

// [내부 프로젝트 의존성 모듈 임포트: ../rules/rulePluginRegistry]
import { ruleRegistry } from '../rules/rulePluginRegistry';
// [내부 프로젝트 의존성 모듈 임포트: ../types]
import type { KeywordStat, DocumentClassificationResult, Entities } from '../types';

/**
 * classifyShape 함수의 핵심 비즈니스 로직 및 상태 제어를 처리합니다.
 * @remarks 이 주석은 컨벤션에 따라 자동 생성된 문서화 내용입니다.
 */
export function classifyShape(
  fileName: string, 
  keywords: KeywordStat[], 
  pageCount: number = 0, 
  entities?: Entities,
  fullText?: string
): DocumentClassificationResult {
  const rules = ruleRegistry.getShapeRules();
  const scores: Record<string, number> = {};
  const evidence: string[] = [];
  
  rules.forEach(rule => { scores[rule.id] = 0; });
  
  let maxScore = 0;
  let primary = 'unknown';

  rules.forEach(rule => {
    const matchedFilenameKeywords = rule.keywords.filter(w => fileName.toLowerCase().includes(w));
    if (matchedFilenameKeywords.length > 0) {
      scores[rule.id] += 40;
      evidence.push(`파일명에서 '${matchedFilenameKeywords.join("', '")}' 표현 감지`);
    }
  });

  keywords.slice(0, 30).forEach(kw => {
    rules.forEach(rule => {
      if (rule.keywords.includes(kw.term)) {
        scores[rule.id] += kw.score;
      }
    });
  });

  // report 신호 보강
  if (pageCount >= 130) {
    const matchedFilename = ['분석', '사례', '모음집'].filter(w => fileName.includes(w));
    const matchedText = fullText ? ['출처', '결론', '사례', '분석'].filter(w => fullText.includes(w)) : [];
    const matchedOrg = entities?.organizations?.filter(o => o.includes('대학교') || o.includes('학회') || o.includes('연구센터')) || [];
    
    if (matchedFilename.length > 0 || matchedText.length > 0 || matchedOrg.length > 0) {
      scores['report'] = (scores['report'] || 0) + 60;
      if (matchedOrg.length > 0) {
        evidence.push(`조직명에서 '${matchedOrg.join("', '")}' 감지`);
      }
      evidence.push(`피해 사례와 출처 기반 설명이 포함되어 분석 보고서 성격이 강함`);
    }
  } else if (pageCount >= 50 && fullText && ['분석', '현황', '결과', '사례', '결론', '보고서'].some(w => fullText.includes(w))) {
    scores['report'] = (scores['report'] || 0) + 30;
  }
  
  // research_paper 신호 보강
  if (pageCount >= 10 && entities?.organizations?.some(o => o.includes('대학') || o.includes('연구') || o.includes('학회'))) {
    if (['abstract', '초록', '서론', '연구', '실험', '결론', '참고문헌', '논문'].some(w => keywords.some(k => k.term.toLowerCase() === w))) {
      scores['research_paper'] = (scores['research_paper'] || 0) + 40;
    }
  }

  Object.entries(scores).forEach(([shape, score]) => {
    if (score > maxScore) { maxScore = score; primary = shape; }
  });

  const confidence = maxScore > 0 ? Math.min(100, Math.floor(maxScore / 1.5)) : 0;
  if (confidence < 15) {
    primary = 'unknown';
  } else {
    const primaryRule = rules.find(r => r.id === primary);
    const matchedTextKeywords = keywords.slice(0, 30).filter(kw => primaryRule?.keywords.includes(kw.term)).map(k => k.term);
    if (matchedTextKeywords.length > 0) {
      evidence.push(`본문에서 '${matchedTextKeywords.slice(0, 3).join("', '")}' 표현 감지`);
    } else {
      evidence.push(`본문에서 [${primaryRule?.label}] 관련 핵심 표현 감지`);
    }
  }

  return { primary, confidence, scores, evidence };
}
