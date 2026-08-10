/**
 * 파일명: embeddingWorker.ts
 * 역할: 웹 워커를 사용한 백그라운드 임베딩 처리
 */

let pipelineInstance: any = null;

// [웹 워커 메시지 리스너]
self.addEventListener('message', async (event: MessageEvent) => {
  const { type, blocks } = event.data;

  if (type === 'LOAD_MODEL') {
    try {
      // [@xenova/transformers 동적 임포트]
      // @ts-ignore
      const { pipeline, env } = await import('https://cdn.jsdelivr.net/npm/@xenova/transformers@2.14.0');

      // [WebGPU 또는 WASM 설정]
      // WebGPU 지원 여부 확인
      if (navigator.gpu) {
        env.backends.onnx.wasm.numThreads = 1; // WebGPU를 사용할 때는 WASM 스레드를 1로 설정하여 오버헤드 최소화 (권장)
      } else {
        env.backends.onnx.wasm.numThreads = navigator.hardwareConcurrency || 4;
      }
      
      self.postMessage({ type: 'PROGRESS', progress: 10 });

      // 파이프라인 로드
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
      console.error('임베딩 모델 로딩 실패:', error);
      self.postMessage({ type: 'ERROR', errorMsg: error instanceof Error ? error.message : 'Unknown error' });
    }
  }

  if (type === 'EMBED_BLOCKS' && pipelineInstance) {
    if (!blocks || !Array.isArray(blocks)) {
      self.postMessage({ type: 'ERROR', errorMsg: '유효하지 않은 블록 데이터입니다.' });
      return;
    }

    try {
      for (let i = 0; i < blocks.length; i++) {
        const text = blocks[i];
        if (!text.trim()) continue;

        // [임베딩 생성]
        const output = await pipelineInstance(text, { pooling: 'mean', normalize: true });
        
        // 결과값을 숫자 배열로 변환
        const vector = Array.from(output.data) as number[];

        self.postMessage({
          type: 'CHUNK_READY',
          chunk: {
            id: `chunk-${Date.now()}-${i}`,
            blockIndex: i,
            text,
            vector,
            timestamp: Date.now()
          }
        });
      }

      self.postMessage({ type: 'DONE' });
    } catch (error) {
      console.error('임베딩 처리 실패:', error);
      self.postMessage({ type: 'ERROR', errorMsg: error instanceof Error ? error.message : 'Unknown error' });
    }
  }
});
