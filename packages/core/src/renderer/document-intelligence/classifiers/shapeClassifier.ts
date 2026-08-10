import { ruleRegistry } from '../rules/rulePluginRegistry';
import type { KeywordStat, DocumentClassificationResult, Entities } from '../types';

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
