/**
 * ============================================================================
 * @file ragUtils.ts
 * @system AMEVA OS Desktop Workstation
 * @location packages/core/src/renderer/utils/ragUtils.ts
 * @role Core RAG Information Retrieval, Context-Aware Chunking & Scoring Engine
 * 
 * [소비처 - CONSUMERS / USAGE CONTEXT]
 * - 소비처 A (features/rag-embedding/vectorStore.ts): RRF 하이브리드 검색의 어휘 점수 산출 및 랭킹 융합 로직으로 소비.
 * - 소비처 B (features/rag-embedding/useEmbeddingEngine.ts): 지능형 문서 청킹(`chunkBlocksWithContext`) 전처리 유틸리티로 소비.
 * - 소비처 C (features/rag-embedding/embeddingWorker.ts): 컨텍스트 강화 청크 데이터 규격 호환.
 * - 소비처 D (hooks/app/useAppAISuggestions.ts): 블록 트리 평탄화 및 제안 파싱 보조로 소비.
 * 
 * [책임 범위 - RESPONSIBILITY]
 * - 중첩 트리 구조(BlockNote/ProseMirror) 및 순수 마크다운의 지능형 계층 문맥(헤딩/섹션) 보존 청킹을 담당한다.
 * - 어휘 빈도수(TF) 및 단어 경계(Word Boundary) 매칭 알고리즘을 캡슐화하여 제공한다.
 * - RRF (Reciprocal Rank Fusion) 수학 공식을 공통화하여 하이브리드 검색 엔진 전반에 일관된 랭킹 점수를 보장한다.
 * 
 * [절대 깨면 안 되는 계약 - CONTRACT]
 * - MUST: 모든 청킹 함수는 원문 텍스트(`text`)와 임베딩용 문맥 텍스트(`contextualText`)를 명확히 분리하여 반환할 것.
 * - MUST NOT: 빈 검색어나 특수기호만으로 구성된 쿼리에 대해 런타임 예외를 발생시키지 말고 빈 배열 또는 안전 폴백을 수행할 것.
 * ============================================================================
 */

import type { ContextualChunkPayload } from '../features/rag-embedding/types';

/**
 * FlatBlock 인터페이스
 * 에디터의 중첩된 블록 구조를 평탄화(Flatten)했을 때 개별 블록이 가지는 데이터 스키마입니다.
 */
export interface FlatBlock {
  id: string;
  text: string;
  type: string;
  heading?: string;
  section?: string;
  level?: number;
  blockIndex?: number;
  contextualText?: string;
  metadata?: Record<string, any>;
}

/**
 * scoreLexicalMatch 함수
 * 단일 텍스트에 대해 검색 질의(Query)의 어휘 일치도 가중치 점수를 계산하는 순수 함수입니다.
 * 
 * [가중치 부여 체계]
 * 1. 단순 부분 일치 (Substring Inclusion): +10점
 * 2. 독립 단어 경계 일치 (Word Boundary Exact Match): 추가 +10점
 * 3. 출현 빈도수 (Term Frequency): 빈도 1회당 추가 +2점
 * 
 * @param query 사용자의 검색 질의 문자열
 * @param targetText 검색 대상 텍스트
 * @returns 0 이상의 어휘 일치도 점수
 */
export function scoreLexicalMatch(query: string, targetText: string): number {
  if (!query || !targetText) return 0;

  const queryTerms = query.toLowerCase().split(/\s+/).filter(term => term.length > 1);
  if (queryTerms.length === 0) return 0;

  const targetLower = targetText.toLowerCase();
  let totalScore = 0;

  for (const term of queryTerms) {
    if (targetLower.includes(term)) {
      // 1. 단순 부분 일치 기본 점수
      totalScore += 10;

      // 2. 단어 경계 정규식 매칭 (독립된 단어로 쓰였는지 확인)
      const boundaryRegex = new RegExp('(?:^|\\s|[.,!?`\'"(\\[{])' + term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '(?:$|\\s|[.,!?`\'")\\]}])', 'i');
      if (boundaryRegex.test(targetLower)) {
        totalScore += 10;
      }

      // 3. 용어 빈도수(TF) 가산점 계산
      const occurrences = targetLower.split(term).length - 1;
      totalScore += Math.max(0, occurrences) * 2;
    }
  }

  return totalScore;
}

/**
 * calculateRRFScore 함수
 * Reciprocal Rank Fusion (RRF) 공식을 사용하여 다중 순위 결과(벡터 랭크 + 키워드 랭크)를 통합하는 공통 수학 연산자입니다.
 * 
 * 공식: RRF = (w_vector / (rrfK + rank_vector)) + (w_keyword / (rrfK + rank_keyword))
 * 
 * @param vectorRank 벡터 검색에서의 순위 (1부터 시작, 미발견 시 null)
 * @param keywordRank 키워드 검색에서의 순위 (1부터 시작, 미발견 시 null)
 * @param rrfK 스무딩 상수 (기본값: 60)
 * @param weights 가중치 벡터 { vectorWeight, keywordWeight }
 */
export function calculateRRFScore(
  vectorRank: number | null,
  keywordRank: number | null,
  rrfK = 60,
  weights: { vectorWeight: number; keywordWeight: number } = { vectorWeight: 0.5, keywordWeight: 0.5 }
): number {
  let score = 0;
  if (vectorRank !== null && vectorRank > 0) {
    score += (weights.vectorWeight || 0.5) * (1 / (rrfK + vectorRank));
  }
  if (keywordRank !== null && keywordRank > 0) {
    score += (weights.keywordWeight || 0.5) * (1 / (rrfK + keywordRank));
  }
  return score;
}

/**
 * flattenBlocks 함수
 * 중첩된 트리 형태의 에디터 블록(BlockNote 등) 데이터를 1차원 배열로 평탄화합니다.
 * 순회 과정에서 상위 헤딩(H1, H2, H3) 계층을 실시간으로 추적하여 각 블록에 계층 문맥을 태깅합니다.
 */
export function flattenBlocks(blocks: any[]): FlatBlock[] {
  const result: FlatBlock[] = [];
  const headingStack: { level: number; text: string }[] = [];
  let blockCounter = 0;

  function traverse(items: any[], currentSection?: string) {
    if (!Array.isArray(items)) return;

    for (const item of items) {
      if (!item) continue;

      let text = '';
      const itemType = item.type || 'paragraph';

      // 1. 일반 인라인 텍스트 추출
      if (item.content) {
        if (Array.isArray(item.content)) {
          text = item.content.map((c: any) => c.text || '').join('');
        } else if (typeof item.content === 'string') {
          text = item.content;
        }
      }

      // 2. 표(Table) 셀 데이터 직렬화
      if (itemType === 'table' && item.content?.rows) {
        const cellTexts: string[] = [];
        for (const row of item.content.rows) {
          if (row.cells) {
            for (const cell of row.cells) {
              if (Array.isArray(cell)) {
                cellTexts.push(cell.map((c: any) => c.text || '').join(''));
              }
            }
          }
        }
        text = cellTexts.join(' | ');
      }

      // 3. 주피터 노트북(Jupyter) 및 코드 블록 직렬화
      if ((itemType === 'jupyter' || itemType === 'codeBlock') && (item.props?.code || item.props?.content)) {
        text = item.props?.code || item.props?.content || '';
      }

      const trimmedText = text.trim();
      
      // 4. 헤딩 블록인 경우 계층 스택 갱신
      if (itemType === 'heading') {
        const level = item.props?.level || 1;
        while (headingStack.length > 0 && headingStack[headingStack.length - 1].level >= level) {
          headingStack.pop();
        }
        if (trimmedText) {
          headingStack.push({ level, text: trimmedText });
        }
      }

      // 현재 헤딩 경로 브레드크럼 구성
      const currentHeadingBreadcrumb = headingStack.map(h => h.text).join(' > ');

      if (trimmedText) {
        const contextualPrefix = currentHeadingBreadcrumb ? `[섹션: ${currentHeadingBreadcrumb}] ` : '';
        result.push({
          id: item.id || `block-${Date.now()}-${blockCounter}`,
          text: trimmedText,
          type: itemType,
          heading: currentHeadingBreadcrumb || undefined,
          section: currentSection || (headingStack.length > 0 ? headingStack[0].text : undefined),
          level: headingStack.length,
          blockIndex: blockCounter++,
          contextualText: `${contextualPrefix}${trimmedText}`,
          metadata: item.props || {}
        });
      }

      // 5. 자식 블록 재귀 순회 (DFS)
      if (item.children && item.children.length > 0) {
        traverse(item.children, currentSection);
      }
    }
  }

  traverse(blocks);
  return result;
}

/**
 * chunkBlocksWithContext 함수
 * 에디터 블록 트리 또는 원시 마크다운 텍스트를 인자로 받아,
 * 헤딩 계층과 섹션 메타데이터가 보존된 지능형 청크(`ContextualChunkPayload[]`) 배열로 변환합니다.
 * 
 * @param input BlockNote 블록 트리 배열 또는 마크다운 텍스트 문자열
 * @returns 임베딩 워커로 전달 가능한 정제된 ContextualChunkPayload 배열
 */
export function chunkBlocksWithContext(input: any[] | string): ContextualChunkPayload[] {
  // Case 1: 이미 구조화된 블록 배열인 경우
  if (Array.isArray(input)) {
    const flatBlocks = flattenBlocks(input);
    return flatBlocks.map((fb, idx) => ({
      id: fb.id,
      blockIndex: idx,
      text: fb.text,
      contextualText: fb.contextualText || fb.text,
      blockId: fb.id,
      blockType: fb.type,
      heading: fb.heading,
      section: fb.section,
      level: fb.level,
      metadata: fb.metadata
    }));
  }

  // Case 2: 마크다운 문자열인 경우
  if (typeof input === 'string') {
    const lines = input.split('\n');
    const payloads: ContextualChunkPayload[] = [];
    const headingStack: { level: number; title: string }[] = [];
    let currentChunkLines: string[] = [];
    let currentBlockType = 'paragraph';
    let chunkCounter = 0;

    const flushCurrentChunk = () => {
      if (currentChunkLines.length === 0) return;
      const rawText = currentChunkLines.join('\n').trim();
      if (!rawText) {
        currentChunkLines = [];
        return;
      }

      const headingPath = headingStack.map(h => h.title).join(' > ');
      const contextualPrefix = headingPath ? `[문맥: ${headingPath}] ` : '';

      payloads.push({
        id: `chunk-${Date.now()}-${chunkCounter}`,
        blockIndex: chunkCounter++,
        text: rawText,
        contextualText: `${contextualPrefix}${rawText}`,
        blockType: currentBlockType,
        heading: headingPath || undefined,
        section: headingStack.length > 0 ? headingStack[0].title : undefined,
        level: headingStack.length,
      });

      currentChunkLines = [];
      currentBlockType = 'paragraph';
    };

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();

      // 구분선(---) 또는 빈 줄이 2개 이상 연속될 때 청크 분할
      if (trimmed === '---' || trimmed === '***') {
        flushCurrentChunk();
        continue;
      }

      // 마크다운 헤딩(#, ##, ###) 감지
      const headingMatch = line.match(/^(#{1,6})\s+(.*)$/);
      if (headingMatch) {
        flushCurrentChunk();
        const level = headingMatch[1].length;
        const title = headingMatch[2].trim();

        while (headingStack.length > 0 && headingStack[headingStack.length - 1].level >= level) {
          headingStack.pop();
        }
        headingStack.push({ level, title });
        currentBlockType = 'heading';
        currentChunkLines.push(title);
        flushCurrentChunk();
        continue;
      }

      // 코드 블록 (```) 감지
      if (trimmed.startsWith('```')) {
        flushCurrentChunk();
        currentBlockType = 'codeBlock';
        const codeLines = [line];
        i++;
        while (i < lines.length && !lines[i].trim().startsWith('```')) {
          codeLines.push(lines[i]);
          i++;
        }
        if (i < lines.length) codeLines.push(lines[i]); // 닫는 ``` 포함
        currentChunkLines = codeLines;
        flushCurrentChunk();
        continue;
      }

      // 빈 줄 만났을 때 기존 청크 플러시
      if (trimmed === '') {
        if (currentChunkLines.length > 0) {
          flushCurrentChunk();
        }
        continue;
      }

      // 일반 문단 라인 누적
      currentChunkLines.push(line);
    }

    flushCurrentChunk();
    return payloads;
  }

  return [];
}

/**
 * retrieveRelevantBlocks 함수
 * 사용자의 질의와 평탄화된 블록 배열을 대조하여, 어휘 일치도가 높은 상위 블록들을 추출합니다.
 */
export function retrieveRelevantBlocks(query: string, flatBlocks: FlatBlock[], topK = 5): FlatBlock[] {
  if (!query || flatBlocks.length === 0) return flatBlocks.slice(0, topK);

  const scored = flatBlocks.map(block => ({
    block,
    score: scoreLexicalMatch(query, block.text)
  }));

  return scored
    .filter(x => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .map(x => x.block)
    .slice(0, topK);
}

/**
 * 제안 파서 헬퍼 (기존 호환성 유지)
 */
export const parseEditSuggestion = (t: string) => t;
export const parseInsertSuggestions = (t: string) => t;
