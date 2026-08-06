import type { SectionCandidate } from '../types';

export function detectSections(pagesText: { page: number; text: string }[]): SectionCandidate[] {
  const sections: SectionCandidate[] = [];
  
  // 섹션 정규식 확장
  // 1. 기존: 제 1 장, Chapter 1, 1. 개요
  // 2. 신규: "제목 - 부제", "제목 – 1) 단계명" (하이픈, 엔대시, 엠대시 허용)
  const sectionRegex = /^(?:제\s*\d+\s*장|Chapter\s*\d+|\d+\.\s*[가-힣a-zA-Z]{2,10}|[가-힣a-zA-Z0-9\s]+[-–—]\s*(?:\d+\))?\s*[가-힣a-zA-Z0-9\s]+)\s*$/m;

  pagesText.forEach(({ page, text }) => {
    const lines = text.split('\n');
    lines.forEach(line => {
      const trimmed = line.trim();
      const match = trimmed.match(sectionRegex);
      if (match && trimmed.length > 2 && trimmed.length < 50) {
        sections.push({
          title: match[0],
          page,
          level: 1,
          confidence: 0.8,
          source: 'pattern'
        });
      }
    });
  });

  return sections;
}
