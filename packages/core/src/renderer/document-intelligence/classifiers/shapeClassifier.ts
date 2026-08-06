import { ruleRegistry } from '../rules/rulePluginRegistry';
import type { KeywordStat, DocumentClassificationResult } from '../types';

export function classifyShape(fileName: string, keywords: KeywordStat[]): DocumentClassificationResult {
  const rules = ruleRegistry.getShapeRules();
  const scores: Record<string, number> = {};
  const evidence: string[] = [];
  
  rules.forEach(rule => { scores[rule.id] = 0; });
  
  let maxScore = 0;
  let primary = 'unknown';

  rules.forEach(rule => {
    if (rule.keywords.some(w => fileName.toLowerCase().includes(w))) {
      scores[rule.id] += 40;
      evidence.push(`파일명에 [${rule.label}] 관련 형식 식별자 포함됨`);
    }
  });

  keywords.slice(0, 30).forEach(kw => {
    rules.forEach(rule => {
      if (rule.keywords.includes(kw.term)) {
        scores[rule.id] += kw.score;
      }
    });
  });

  Object.entries(scores).forEach(([shape, score]) => {
    if (score > maxScore) { maxScore = score; primary = shape; }
  });

  const confidence = maxScore > 0 ? Math.min(100, Math.floor(maxScore / 1.5)) : 0;
  if (confidence < 15) {
    primary = 'unknown';
  } else {
    evidence.push(`본문에 [${rules.find(r => r.id === primary)?.label}] 형식 핵심 키워드 감지`);
  }

  return { primary, confidence, scores, evidence };
}
