/**
 * ============================================================================
 * @file embeddingWorker.ts
 * @system AMEVA OS Desktop Workstation
 * @location packages/core/src/renderer/features/rag-embedding/embeddingWorker.ts
 * @role Background Web Worker for On-Device Context-Aware Embedding Pipeline
 * 
 * [소비처 - CONSUMERS / USAGE CONTEXT]
 * - 소비처 A (useEmbeddingEngine.ts): Web Worker 인스턴스를 생성하여 메인 스레드 비차단 임베딩 수행.
 * 
 * [책임 범위 - RESPONSIBILITY]
 * - `@xenova/transformers` (HuggingFace ONNX) 라이브러리를 동적 로드하고 WebGPU/WASM 환경을 초기화한다.
 * - 문맥 강화 텍스트(`contextualText`)를 기반으로 384차원 임베딩 벡터를 고속 연산한다.
 * - 청크 메타데이터(헤딩, 섹션, 블록 ID)를 온전히 보존한 `EmbeddingChunk` 객체를 메인 스레드로 스트리밍 전송한다.
 * 
 * [절대 깨면 안 되는 계약 - CONTRACT]
 * - MUST: WebGPU(`navigator.gpu`) 가용 시 WASM 스레드를 1로 제한하여 메모리 및 스레드 경합 오버헤드를 방지할 것.
 * - MUST: 에러 발생 시 크래시 없이 `type: 'ERROR'` 메시지를 전송하여 UI 상태를 안전하게 복구할 것.
 * ============================================================================
 */

import type { ContextualChunkPayload, EmbeddingChunk } from './types';

let pipelineInstance: any = null;

// [웹 워커 메시지 리스너]
self.addEventListener('message', async (event: MessageEvent) => {
  const { type, blocks, query, queryId } = event.data;

  // 1. 임베딩 모델 로드 핸들러
  if (type === 'LOAD_MODEL') {
    try {
      const { pipeline, env } = await import('@xenova/transformers');

      // [WebGPU 또는 WASM 스레드 설정]
      if (navigator.gpu) {
        env.backends.onnx.wasm.numThreads = 1; // WebGPU 사용 시 WASM 스레드 경합 최소화
      } else {
        env.backends.onnx.wasm.numThreads = navigator.hardwareConcurrency || 4;
      }
      
      // Vite SPA Fallback 라우터 오작동 방지
      env.allowLocalModels = false;
      
      self.postMessage({ type: 'PROGRESS', progress: 10 });

      // Xenova/all-MiniLM-L6-v2 파이프라인 로드
      pipelineInstance = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2', {
        progress_callback: (progressInfo: any) => {
          if (progressInfo.status === 'progress') {
            const progress = progressInfo.progress || 0;
            self.postMessage({ type: 'PROGRESS', progress: Math.round(progress) });
          }
        },
      });

      self.postMessage({ type: 'MODEL_LOADED' });
    } catch (error) {
      console.error('[EmbeddingWorker] 임베딩 모델 로딩 실패:', error);
      self.postMessage({ type: 'ERROR', errorMsg: error instanceof Error ? error.message : 'Unknown error' });
    }
  }

  // 2. 문서 블록 일괄 임베딩 처리 핸들러 (지능형 Contextual Chunking 지원)
  if (type === 'EMBED_BLOCKS' && pipelineInstance) {
    if (!blocks || !Array.isArray(blocks)) {
      self.postMessage({ type: 'ERROR', errorMsg: '유효하지 않은 블록 데이터입니다.' });
      return;
    }

    try {
      const total = blocks.length;
      for (let i = 0; i < total; i++) {
        const item = blocks[i];
        const isStructured = typeof item === 'object' && item !== null;
        
        const textToEmbed: string = isStructured ? (item.contextualText || item.text || '') : String(item);
        const rawText: string = isStructured ? (item.text || '') : String(item);

        if (!textToEmbed.trim() && !rawText.trim()) continue;

        // [Xenova Feature-Extraction 추론]
        // Mean pooling 및 L2 normalize를 적용하여 코사인 유사도 연산에 최적화된 단위 벡터 추출
        const output = await pipelineInstance(textToEmbed, { pooling: 'mean', normalize: true });
        const vector = Array.from(output.data) as number[];

        const chunk: EmbeddingChunk = {
          id: isStructured && item.id ? item.id : `chunk-${Date.now()}-${i}`,
          blockIndex: isStructured && item.blockIndex !== undefined ? item.blockIndex : i,
          text: rawText,
          contextualText: textToEmbed,
          vector,
          timestamp: Date.now(),
          blockId: isStructured ? item.blockId : undefined,
          blockType: isStructured ? item.blockType : undefined,
          heading: isStructured ? item.heading : undefined,
          section: isStructured ? item.section : undefined,
          level: isStructured ? item.level : undefined,
          metadata: isStructured ? item.metadata : undefined,
        };

        // 개별 청크 준비 완료 이벤트 발송
        self.postMessage({
          type: 'CHUNK_READY',
          chunk,
          progress: Math.round(((i + 1) / total) * 100)
        });
      }

      self.postMessage({ type: 'DONE' });
    } catch (error) {
      console.error('[EmbeddingWorker] 블록 임베딩 처리 실패:', error);
      self.postMessage({ type: 'ERROR', errorMsg: error instanceof Error ? error.message : 'Unknown error' });
    }
  }

  // 3. 사용자 검색 질의(Query) 단일 임베딩 핸들러
  if (type === 'EMBED_QUERY' && pipelineInstance) {
    try {
      const output = await pipelineInstance(query, { pooling: 'mean', normalize: true });
      const vector = Array.from(output.data) as number[];
      self.postMessage({ type: 'QUERY_EMBEDDED', queryId, vector });
    } catch (error) {
      console.error('[EmbeddingWorker] 쿼리 임베딩 실패:', error);
      self.postMessage({ type: 'ERROR', errorMsg: error instanceof Error ? error.message : 'Unknown error' });
    }
  }
});
