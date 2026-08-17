/**
 * ============================================================================
 * @file vectorStore.ts
 * @system AMEVA OS Desktop Workstation
 * @location packages/core/src/renderer/features/rag-embedding/vectorStore.ts
 * @role IndexedDB Vector Persistence, Hybrid RRF Search Engine & Strategy Layer
 * 
 * [소비처 - CONSUMERS / USAGE CONTEXT]
 * - 소비처 A (useEmbeddingEngine.ts): 벡터 저장, 로드, 하이브리드 RRF 검색 실행.
 * - 소비처 B (embeddingWorker.ts): 산출된 청크의 IndexedDB 저장 파이프라인.
 * 
 * [책임 범위 - RESPONSIBILITY]
 * - 브라우저 로컬 IndexedDB(`ameva-rag-vectors`)를 통한 청크 및 벡터 데이터 영구 저장/조회.
 * - 코사인 유사도(Cosine Similarity) 및 어휘 매칭(Lexical TF) 점수 연산.
 * - Reciprocal Rank Fusion (RRF) 기반 다중 랭킹 융합 하이브리드 검색.
 * - 전략 패턴(Strategy Pattern) 기반 검색 알고리즘 분기 지원.
 * 
 * [절대 깨면 안 되는 계약 - CONTRACT]
 * - MUST: 모든 하이브리드 검색 결과 객체는 `score`, `cosineScore`, `keywordScore`, `rrfScore` 메타데이터를 보존하여 반환할 것.
 * - MUST NOT: DB 트랜잭션 오류 발생 시 상위 호출자가 인지할 수 있도록 명확한 Error를 reject할 것.
 * ============================================================================
 */

import type { EmbeddingChunk, HybridSearchOptions, IRetrievalStrategy, RetrievalSearchMode } from './types';
import { scoreLexicalMatch, calculateRRFScore } from '../../utils/ragUtils';

const DB_NAME = 'ameva-rag-vectors';
const STORE_NAME = 'chunks';
const DB_VERSION = 1;

let dbInstance: IDBDatabase | null = null;

/**
 * getDB 함수
 * IndexedDB 싱글톤 커넥션을 반환하거나 없으면 신규 생성합니다.
 */
const getDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB is not available in current environment'));
      return;
    }
    if (dbInstance) {
      resolve(dbInstance);
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };

    request.onsuccess = (event: Event) => {
      dbInstance = (event.target as IDBOpenDBRequest).result;
      resolve(dbInstance);
    };

    request.onerror = (event: Event) => {
      reject((event.target as IDBOpenDBRequest).error);
    };
  });
};

/**
 * saveChunk 함수
 * 단일 임베딩 청크를 IndexedDB에 업서트(Upsert) 저장합니다.
 */
export const saveChunk = async (chunk: EmbeddingChunk): Promise<void> => {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.put(chunk);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

/**
 * saveChunksBatch 함수
 * 다수의 임베딩 청크를 단일 트랜잭션으로 일괄 저장합니다.
 */
export const saveChunksBatch = async (chunks: EmbeddingChunk[]): Promise<void> => {
  if (!chunks || chunks.length === 0) return;
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);

    for (const chunk of chunks) {
      store.put(chunk);
    }

    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
};

/**
 * loadAllChunks 함수
 * IndexedDB에 저장된 모든 청크를 비동기로 불러옵니다.
 */
export const loadAllChunks = async (): Promise<EmbeddingChunk[]> => {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

/**
 * clearChunks 함수
 * IndexedDB 내의 모든 청크 데이터를 삭제합니다.
 */
export const clearChunks = async (): Promise<void> => {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.clear();

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

/**
 * calculateCosineSimilarity 함수
 * 두 1차원 숫자 벡터 간의 코사인 유사도(Cosine Similarity)를 계산합니다.
 */
export const calculateCosineSimilarity = (vecA: number[], vecB: number[]): number => {
  if (!vecA || !vecB || vecA.length !== vecB.length) return 0;
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
};

/**
 * searchSimilar 함수 (순수 벡터 검색)
 * 질의 벡터와 청크 목록의 코사인 유사도를 계산하여 상위 topK 개를 반환합니다.
 */
export const searchSimilar = (queryVector: number[], topK: number, chunks: EmbeddingChunk[]): EmbeddingChunk[] => {
  if (!queryVector || queryVector.length === 0 || chunks.length === 0) return [];

  const scoredChunks = chunks.map(chunk => {
    const cosine = calculateCosineSimilarity(queryVector, chunk.vector);
    return {
      ...chunk,
      score: cosine,
      cosineScore: cosine,
      keywordScore: 0,
      rrfScore: cosine
    };
  });

  scoredChunks.sort((a, b) => (b.score || 0) - (a.score || 0));
  return scoredChunks.slice(0, topK);
};

/**
 * searchKeywordOnly 함수 (순수 키워드 검색)
 * 질의 텍스트와 청크 원문의 어휘 매칭 점수를 계산하여 상위 topK 개를 반환합니다.
 */
export const searchKeywordOnly = (queryText: string, topK: number, chunks: EmbeddingChunk[]): EmbeddingChunk[] => {
  if (!queryText || chunks.length === 0) return [];

  const scoredChunks = chunks.map(chunk => {
    const kwScore = scoreLexicalMatch(queryText, chunk.text);
    return {
      ...chunk,
      score: kwScore,
      cosineScore: 0,
      keywordScore: kwScore,
      rrfScore: kwScore
    };
  });

  return scoredChunks
    .filter(c => (c.score || 0) > 0)
    .sort((a, b) => (b.score || 0) - (a.score || 0))
    .slice(0, topK);
};

/**
 * searchHybrid 함수 (RRF 기반 하이브리드 검색)
 * 
 * 1. 벡터 코사인 유사도 랭킹 산출
 * 2. 어휘/키워드 매칭(TF + Word Boundary) 랭킹 산출
 * 3. Reciprocal Rank Fusion (RRF) 공식으로 랭킹 결합
 * 4. 정렬 후 Top-K 반환
 */
export const searchHybrid = (
  queryText: string,
  queryVector: number[] | null,
  chunks: EmbeddingChunk[],
  options?: HybridSearchOptions
): EmbeddingChunk[] => {
  if (chunks.length === 0) return [];

  const topK = options?.topK ?? 5;
  const rrfK = options?.rrfK ?? 60;
  const vectorWeight = options?.vectorWeight ?? 0.5;
  const keywordWeight = options?.keywordWeight ?? 0.5;
  const minScore = options?.minScore ?? 0;

  // 1. 벡터 검색 랭킹 산출 (질의 벡터가 유효한 경우)
  const vectorRankMap = new Map<string, { rank: number; cosineScore: number }>();
  if (queryVector && queryVector.length > 0) {
    const vectorScored = chunks
      .map(chunk => ({
        id: chunk.id,
        cosine: calculateCosineSimilarity(queryVector, chunk.vector)
      }))
      .filter(item => item.cosine > 0)
      .sort((a, b) => b.cosine - a.cosine);

    vectorScored.forEach((item, index) => {
      vectorRankMap.set(item.id, { rank: index + 1, cosineScore: item.cosine });
    });
  }

  // 2. 키워드 검색 랭킹 산출 (질의 텍스트가 유효한 경우)
  const keywordRankMap = new Map<string, { rank: number; keywordScore: number }>();
  if (queryText && queryText.trim().length > 0) {
    const keywordScored = chunks
      .map(chunk => ({
        id: chunk.id,
        kwScore: scoreLexicalMatch(queryText, chunk.text)
      }))
      .filter(item => item.kwScore > 0)
      .sort((a, b) => b.kwScore - a.kwScore);

    keywordScored.forEach((item, index) => {
      keywordRankMap.set(item.id, { rank: index + 1, keywordScore: item.kwScore });
    });
  }

  // 3. RRF 점수 결합
  const hybridScored: EmbeddingChunk[] = chunks.map(chunk => {
    const vData = vectorRankMap.get(chunk.id);
    const kData = keywordRankMap.get(chunk.id);

    const vRank = vData ? vData.rank : null;
    const kRank = kData ? kData.rank : null;

    const cosineScore = vData ? vData.cosineScore : 0;
    const keywordScore = kData ? kData.keywordScore : 0;

    const rrfScore = calculateRRFScore(vRank, kRank, rrfK, { vectorWeight, keywordWeight });

    return {
      ...chunk,
      score: rrfScore,
      rrfScore,
      cosineScore,
      keywordScore
    };
  });

  // 4. 최소 점수 필터링 및 내림차순 정렬
  return hybridScored
    .filter(c => (c.score || 0) > minScore)
    .sort((a, b) => (b.score || 0) - (a.score || 0))
    .slice(0, topK);
};

/**
 * ============================================================================
 * Strategy Pattern Classes for Loose Coupling & Extensibility
 * ============================================================================
 */

export class HybridRetrievalStrategy implements IRetrievalStrategy {
  search(queryText: string, queryVector: number[] | null, chunks: EmbeddingChunk[], options?: HybridSearchOptions): EmbeddingChunk[] {
    return searchHybrid(queryText, queryVector, chunks, options);
  }
}

export class VectorRetrievalStrategy implements IRetrievalStrategy {
  search(_queryText: string, queryVector: number[] | null, chunks: EmbeddingChunk[], options?: HybridSearchOptions): EmbeddingChunk[] {
    if (!queryVector) return [];
    return searchSimilar(queryVector, options?.topK ?? 5, chunks);
  }
}

export class KeywordRetrievalStrategy implements IRetrievalStrategy {
  search(queryText: string, _queryVector: number[] | null, chunks: EmbeddingChunk[], options?: HybridSearchOptions): EmbeddingChunk[] {
    return searchKeywordOnly(queryText, options?.topK ?? 5, chunks);
  }
}

/**
 * getRetrievalStrategy 팩토리 함수
 * 검색 모드에 따라 적합한 IRetrievalStrategy 인스턴스를 반환합니다.
 */
export const getRetrievalStrategy = (mode: RetrievalSearchMode = 'hybrid'): IRetrievalStrategy => {
  switch (mode) {
    case 'vector':
      return new VectorRetrievalStrategy();
    case 'keyword':
      return new KeywordRetrievalStrategy();
    case 'hybrid':
    default:
      return new HybridRetrievalStrategy();
  }
};
