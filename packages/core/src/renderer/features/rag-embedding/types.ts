/**
 * ============================================================================
 * @file types.ts
 * @system AMEVA OS Desktop Workstation
 * @location packages/core/src/renderer/features/rag-embedding/types.ts
 * @role Core RAG & Semantic Embedding Type System & Strategy Contracts
 * 
 * [소비처 - CONSUMERS / USAGE CONTEXT]
 * - 소비처 A (vectorStore.ts): 벡터 저장소 및 RRF 하이브리드 검색 데이터 모델 규격 소비.
 * - 소비처 B (embeddingWorker.ts): 웹 워커 통신 메시지 및 청크 직렬화 계약 소비.
 * - 소비처 C (useEmbeddingEngine.ts): 리액트 훅 계층 상태 및 전략 인터페이스 바인딩.
 * - 소비처 D (PromptFactory.ts): RAG 검색 결과 컨텍스트 포맷터 파라미터 타입 제공.
 * - 소비처 E (ragUtils.ts): 지능형 청킹 및 어휘 분석 통합 연동.
 * 
 * [책임 범위 - RESPONSIBILITY]
 * - RAG 엔진의 생명주기 상태, 청크 스키마, 하이브리드 검색 옵션 및 전략 패턴 인터페이스를 엄격하게 정의한다.
 * - 모듈 간 결합도를 낮추기 위한 추상화 계약(Interface)을 제공한다.
 * 
 * [절대 깨면 안 되는 계약 - CONTRACT]
 * - MUST: 모든 청크 객체는 고유 식별자(`id`)와 텍스트(`text`)를 필수로 포함해야 한다.
 * - MUST: 하이브리드 검색 옵션(`HybridSearchOptions`)은 가중치 및 랭킹 상수의 기본값을 보장해야 한다.
 * ============================================================================
 */

/**
 * 임베딩 엔진의 생명주기 상태 머신 열거형
 */
export type EmbeddingStatus = 'idle' | 'loading-model' | 'embedding' | 'ready' | 'error';

/**
 * RAG 검색 모드 전략 열거형
 */
export type RetrievalSearchMode = 'hybrid' | 'vector' | 'keyword';

/**
 * 지능형 블록 청킹 전처리 결과 페이로드 (임베딩 워커로 전송되는 원시 단위)
 */
export interface ContextualChunkPayload {
  /** 고유 청크 식별자 */
  id: string;
  /** 원본 문서 내 블록 순번 */
  blockIndex: number;
  /** 실제 원문 텍스트 (사용자에게 표시/치환될 순수 텍스트) */
  text: string;
  /** 상위 헤딩/섹션 정보가 포함된 문맥 강화 텍스트 (임베딩 벡터화 전용) */
  contextualText?: string;
  /** 원본 BlockNote 블록 ID */
  blockId?: string;
  /** 블록 타입 (paragraph, heading, table, jupyter 등) */
  blockType?: string;
  /** 소속 헤딩 타이틀 */
  heading?: string;
  /** 소속 대단원/섹션 타이틀 */
  section?: string;
  /** 계층 깊이 레벨 */
  level?: number;
  /** 추가 메타데이터 키-값 맵 */
  metadata?: Record<string, any>;
}

/**
 * 벡터 및 컨텍스트 메타데이터를 포함하는 최종 임베딩 청크 스키마
 */
export interface EmbeddingChunk extends ContextualChunkPayload {
  /** 384차원 (all-MiniLM-L6-v2) 정규화 임베딩 벡터 */
  vector: number[];
  /** 청크 생성/갱신 에포크 타임스탬프 (ms) */
  timestamp: number;
  /** 최종 융합 검색 점수 (RRF 점수 또는 복합 유사도) */
  score?: number;
  /** RRF (Reciprocal Rank Fusion) 산출 점수 */
  rrfScore?: number;
  /** 벡터 코사인 유사도 점수 (0.0 ~ 1.0) */
  cosineScore?: number;
  /** 어휘 빈도수 및 경계 매칭 기반 키워드 점수 */
  keywordScore?: number;
}

/**
 * 하이브리드 검색 및 랭킹 융합을 위한 파라미터 옵션
 */
export interface HybridSearchOptions {
  /** 상위 반환할 청크 수 (기본값: 5) */
  topK?: number;
  /** RRF 랭킹 스무딩 상수 k (기본값: 60) */
  rrfK?: number;
  /** 벡터 검색 가중치 (0.0 ~ 1.0, 기본값: 0.5) */
  vectorWeight?: number;
  /** 키워드 검색 가중치 (0.0 ~ 1.0, 기본값: 0.5) */
  keywordWeight?: number;
  /** 최소 유사도 컷오프 점수 필터 */
  minScore?: number;
  /** 검색 실행 모드 ('hybrid' | 'vector' | 'keyword') */
  mode?: RetrievalSearchMode;
}

/**
 * RAG 임베딩 엔진의 전역 상태 스키마
 */
export interface EmbeddingState {
  /** 현재 엔진 동작 상태 */
  status: EmbeddingStatus;
  /** 모델 로딩 또는 임베딩 진행률 (0 ~ 100) */
  progress: number;
  /** 에러 발생 시 에러 메시지 */
  errorMsg: string | null;
  /** 현재 메모리에 캐싱된 전체 청크 목록 */
  chunks: EmbeddingChunk[];
  /** 임베딩 모델 인스턴스 온디바이스 로드 완료 여부 */
  modelLoaded: boolean;
}

/**
 * 검색 알고리즘 전략 패턴을 위한 추상 인터페이스
 */
export interface IRetrievalStrategy {
  /**
   * 주어진 질의와 청크 컬렉션을 바탕으로 관련도 순위 청크를 반환
   */
  search(
    queryText: string,
    queryVector: number[] | null,
    chunks: EmbeddingChunk[],
    options?: HybridSearchOptions
  ): EmbeddingChunk[];
}
