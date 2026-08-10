/**
 * ============================================================================
 * @file domainClassifier.ts
 * @description domainClassifier.ts 시스템 모듈 구성요소로, 관련 UI 렌더링 및 비즈니스 로직을 담당합니다.
 * @usage 문서 에디터 및 뷰어 내부에서 동적으로 호출되거나 유틸리티 함수로 사용됩니다.
 * @example
 * // 예시 로직 (자동 생성됨)
 * import { something } from './domainClassifier';
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
import type { KeywordStat, DocumentClassificationResult } from '../types';

/**
 * classifyDomain 함수의 핵심 비즈니스 로직 및 상태 제어를 처리합니다.
 * @remarks 이 주석은 컨벤션에 따라 자동 생성된 문서화 내용입니다.
 */
export function classifyDomain(fileName: string, keywords: KeywordStat[], fullText: string): DocumentClassificationResult {
  const rules = ruleRegistry.getDomainRules();
  const textLower = fullText.toLowerCase();
  const fileLower = fileName.toLowerCase();
  
  // --- Stage 1: Fast Scan ---
  const fastScores: Record<string, number> = {};
  const fastEvidence: Record<string, string[]> = {};
  
  rules.forEach(rule => {
    fastScores[rule.id] = 0;
    fastEvidence[rule.id] = [];
    const weight = rule.weight || 1.0;

    // 1. filenameHints (+40)
    if (rule.filenameHints) {
      const hit = rule.filenameHints.find(h => fileLower.includes(h.toLowerCase()));
      if (hit) {
        fastScores[rule.id] += 40 * weight;
        fastEvidence[rule.id].push(`${rule.id}: 파일명에서 '${hit}' 감지 (Fast Scan)`);
      }
    }
    
    // 2. sectionHints (+35)
    if (rule.sectionHints) {
      const hit = rule.sectionHints.find(sec => textLower.includes(sec.toLowerCase()));
      if (hit) {
        fastScores[rule.id] += 35 * weight;
        fastEvidence[rule.id].push(`${rule.id}: 섹션에서 '${hit}' 감지`);
      }
    }

    // 3. weakKeywords (+3) & ambiguousKeywords (+1)
    if (rule.weakKeywords) {
      const hits = rule.weakKeywords.filter(w => textLower.includes(w.toLowerCase()));
      if (hits.length > 0) {
        fastScores[rule.id] += 3 * hits.length * weight;
      }
    }
    if (rule.ambiguousKeywords) {
      const hits = rule.ambiguousKeywords.filter(w => textLower.includes(w.toLowerCase()));
      if (hits.length > 0) {
        fastScores[rule.id] += 1 * hits.length * weight;
      }
    }
  });

  // keywords (+8 * score)
  keywords.slice(0, 40).forEach(kw => {
    rules.forEach(rule => {
      if (rule.keywords.includes(kw.term)) {
        fastScores[rule.id] += kw.score * 8 * (rule.weight || 1.0);
      }
    });
  });

  // Sort and pick Top 5 candidates
  const topCandidates = Object.entries(fastScores)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(entry => rules.find(r => r.id === entry[0])!);

  // --- Stage 2: Detailed Scoring ---
  const finalScores = { ...fastScores };
  const finalEvidence = { ...fastEvidence };

  topCandidates.forEach(rule => {
    // User rule 가중치 강화
    let weight = rule.weight || 1.0;
    if (rule.source === 'user') {
      weight = Math.max(weight, 1.25);
    }

    // 1. strongPhrases (+35)
    if (rule.strongPhrases) {
      rule.strongPhrases.forEach(phrase => {
        if (textLower.includes(phrase.toLowerCase())) {
          finalScores[rule.id] += 35 * weight;
          finalEvidence[rule.id].push(`${rule.id}: strong phrase '${phrase}' 감지`);
        }
      });
    }

    // 2. phrases (+25)
    if (rule.phrases) {
      rule.phrases.forEach(phrase => {
        if (textLower.includes(phrase.toLowerCase())) {
          finalScores[rule.id] += 25 * weight;
          finalEvidence[rule.id].push(`${rule.id}: 본문 구문 '${phrase}' 감지`);
        }
      });
    }

    // 3. entityHints (+15)
    if (rule.entityHints && rule.entityHints.length > 0) {
      const entityRegex = new RegExp(`(?:${rule.entityHints.join('|')})`, 'g');
      if (entityRegex.test(fullText)) {
        finalScores[rule.id] += 15 * weight;
        finalEvidence[rule.id].push(`${rule.id}: 엔티티 패턴 감지`);
      }
    }

    // 4. unitHints (+10)
    if (rule.unitHints && rule.unitHints.length > 0) {
      const unitsRegex = new RegExp(`(?:${rule.unitHints.join('|')})`, 'g');
      if (unitsRegex.test(fullText)) {
        finalScores[rule.id] += 10 * weight;
        finalEvidence[rule.id].push(`${rule.id}: 특수 단위 감지`);
      }
    }

    // 5. negativeKeywords (-30)
    if (rule.negativeKeywords) {
      rule.negativeKeywords.forEach(neg => {
        if (textLower.includes(neg.toLowerCase())) {
          finalScores[rule.id] -= 30 * weight;
          finalEvidence[rule.id].push(`${rule.id}: negative keyword '${neg}' 감지로 감점`);
        }
      });
    }
  });

  // Calculate Primary
  let maxScore = 0;
  let primary = 'unknown';

  Object.entries(finalScores).forEach(([domain, score]) => {
    if (score > maxScore) { 
      maxScore = score; 
      primary = domain; 
    }
  });

  const confidence = maxScore > 0 ? Math.min(100, Math.floor(maxScore / 4)) : 0;
  let resultEvidence: string[] = [];

  if (confidence < 15) {
    primary = 'unknown';
  } else {
    resultEvidence = finalEvidence[primary] || [];
    resultEvidence.push(`문서 도메인(Domain) 분석 결과 [${rules.find(r => r.id === primary)?.label}] 성격 강함`);
  }

  return { 
    primary, 
    confidence, 
    scores: finalScores, 
    evidence: Array.from(new Set(resultEvidence)) 
  };
}
