import { tokenize } from '../tokenizer';
import type { KeywordStat } from '../types';

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
