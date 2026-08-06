import { ruleRegistry } from '../rules/rulePluginRegistry';
import type { KeywordStat, DocumentClassificationResult } from '../types';

export function classifyDomain(fileName: string, keywords: KeywordStat[], fullText: string): DocumentClassificationResult {
  const rules = ruleRegistry.getDomainRules();
  const scores: Record<string, number> = {};
  const evidence: string[] = [];
  
  rules.forEach(rule => { scores[rule.id] = 0; });
  
  let maxScore = 0;
  let primary = 'unknown';

  rules.forEach(rule => {
    if (rule.keywords.some(w => fileName.toLowerCase().includes(w))) {
      scores[rule.id] += 40 * (rule.weight || 1);
      evidence.push(`파일명에 [${rule.label}] 도메인 식별자 포함됨`);
    }
  });

  keywords.slice(0, 40).forEach(kw => {
    rules.forEach(rule => {
      if (rule.keywords.includes(kw.term)) {
        scores[rule.id] += kw.score * (rule.weight || 1);
      }
    });
  });

  // 단위 및 정규식 기반 도메인 추가 점수
  rules.forEach(rule => {
    if (rule.unitHints && rule.unitHints.length > 0) {
      const unitsRegex = new RegExp(`(?:${rule.unitHints.join('|')})`, 'g');
      if (unitsRegex.test(fullText)) {
        scores[rule.id] += 20 * (rule.weight || 1);
        evidence.push(`본문에 [${rule.label}] 도메인 관련 특수 단위(${rule.unitHints.join(', ')}) 패턴 감지`);
      }
    }
  });

  Object.entries(scores).forEach(([domain, score]) => {
    if (score > maxScore) { maxScore = score; primary = domain; }
  });

  const confidence = maxScore > 0 ? Math.min(100, Math.floor(maxScore / 2)) : 0;
  if (confidence < 15) {
    primary = 'unknown';
  } else {
    evidence.push(`본문에 [${rules.find(r => r.id === primary)?.label}] 도메인 핵심 키워드 다수 출현`);
  }

  return { primary, confidence, scores, evidence };
}
