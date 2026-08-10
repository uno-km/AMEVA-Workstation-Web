import type { KeywordStat, CoOccurrence, SectionCandidate, Entities, TopicCluster } from '../types';
import { AMBIGUOUS_TOPIC_WORDS } from '../stopwords';

export function discoverTopics(
  fileName: string,
  keywords: KeywordStat[],
  coOccurrences: CoOccurrence[],
  sections: SectionCandidate[],
  pagesText: { page: number; text: string }[],
  entities: Entities,
  fullText: string
): TopicCluster[] {
  const clusters: TopicCluster[] = [];
  
  // 1. Get top 30 valid keywords
  const topKeywords = keywords
    .filter(kw => !AMBIGUOUS_TOPIC_WORDS.has(kw.term))
    .slice(0, 30);

  const GENERIC_WORDS = new Set(['발생', '결과', '내용', '자료', '관련', '일반', '정보', '포함', '사용', '확인', '방법']);

  if (topKeywords.length === 0) return [];

  // Boost by filename (Nouns in filename)
  const filenameLower = fileName.toLowerCase();
  const boostedKeywords = topKeywords.map(kw => {
    let score = kw.score;
    if (filenameLower.includes(kw.term.toLowerCase())) {
      score += 50; // High boost for filename
    }
    // Boost by section titles
    sections.forEach(sec => {
      if (sec.title.toLowerCase().includes(kw.term.toLowerCase())) {
        score += 20;
      }
    });
    return { ...kw, boostedScore: score };
  }).sort((a, b) => b.boostedScore - a.boostedScore);

  // 2. Simple clustering
  // If coOccurrences exist, use them. Otherwise, group by top terms.
  const mainTerm = boostedKeywords[0];
  const relatedTerms = [mainTerm.term];
  const pages = new Set<number>(mainTerm.pages);
  
  if (coOccurrences.length > 0) {
    coOccurrences.slice(0, 5).forEach(co => {
      if (co.terms.includes(mainTerm.term)) {
        const other = co.terms[0] === mainTerm.term ? co.terms[1] : co.terms[0];
        if (!AMBIGUOUS_TOPIC_WORDS.has(other) && !relatedTerms.includes(other)) {
          relatedTerms.push(other);
          co.pages.forEach(p => pages.add(p));
        }
      }
    });
  } else {
    // Fallback co-occurrence based on page overlap
    boostedKeywords.slice(1, 10).forEach(kw => {
      const pageOverlap = kw.pages.filter(p => mainTerm.pages.includes(p));
      if (pageOverlap.length > 0) {
        relatedTerms.push(kw.term);
        kw.pages.forEach(p => pages.add(p));
      }
    });
  }

  // 3. Label generation (Combine top 2 related terms if it makes sense, or just use main term)
  let label = mainTerm.term;
  const validRelatedTerms = relatedTerms.filter(t => t !== mainTerm.term && !GENERIC_WORDS.has(t));
  
  if (validRelatedTerms.length > 0) {
    const secondaryTerm = validRelatedTerms[0];
    const phrase1 = `${mainTerm.term} ${secondaryTerm}`;
    const phrase2 = `${secondaryTerm} ${mainTerm.term}`;
    
    if (fullText.includes(phrase1)) {
      label = phrase1;
    } else if (fullText.includes(phrase2)) {
      label = phrase2;
    } else {
      label = phrase1; // Default to main + secondary if not perfectly matched but co-occurring
    }
  }

  // 4. Create primary cluster
  clusters.push({
    id: `topic_${label.replace(/\s+/g, '_')}`,
    label,
    terms: relatedTerms.slice(0, 5),
    phrases: [label],
    pages: Array.from(pages),
    score: mainTerm.boostedScore,
    confidence: Math.min(100, Math.floor(mainTerm.boostedScore / 2)),
    evidence: [`본문에서 '${label.split(' ').join("', '")}' 관련 표현이 여러 페이지에 걸쳐 반복 등장하여 핵심 토픽으로 추출됨`]
  });

  return clusters;
}
