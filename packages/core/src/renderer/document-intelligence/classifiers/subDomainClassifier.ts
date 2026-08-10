import type { DomainRule } from '../rules/types';
import type { DocumentSubDomainResult, KeywordStat, Entities } from '../types';

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
