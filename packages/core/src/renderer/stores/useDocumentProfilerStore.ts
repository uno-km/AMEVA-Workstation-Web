/**
 * ============================================================================
 * @file useDocumentProfilerStore.ts
 * @description useDocumentProfilerStore.ts 시스템 모듈 구성요소로, 관련 UI 렌더링 및 비즈니스 로직을 담당합니다.
 * @usage 문서 에디터 및 뷰어 내부에서 동적으로 호출되거나 유틸리티 함수로 사용됩니다.
 * @example
 * // 예시 로직 (자동 생성됨)
 * import { something } from './useDocumentProfilerStore';
 * 
 * @created 2026-08-10 20:30:36
 * @updated 2026-08-10 20:30:36
 * @author uno-km
 * @commit docs: 전체 소스코드 한글 주석 및 사내 컨벤션 일괄 적용
 * ============================================================================
 */

// [외부 패키지 및 라이브러리 임포트: zustand]
import { create } from 'zustand';
// [내부 프로젝트 의존성 모듈 임포트: ../document-intelligence/extractors/pdfTextExtractor]
import { extractPdfText } from '../document-intelligence/extractors/pdfTextExtractor';
// [내부 프로젝트 의존성 모듈 임포트: ../document-intelligence/documentProfiler]
import { profileDocument } from '../document-intelligence/documentProfiler';
// [내부 프로젝트 의존성 모듈 임포트: ../document-intelligence/types]
import type { DocumentProfileResult } from '../document-intelligence/types';

/**
 * QueueItem 모듈 내외부에서 사용되는 데이터 통신 규격 및 타입을 정의합니다.
 * @remarks 이 주석은 컨벤션에 따라 자동 생성된 문서화 내용입니다.
 */
interface QueueItem {
  id: string; // fileId
  file: File;
}

/**
 * DocumentProfilerState 모듈 내외부에서 사용되는 데이터 통신 규격 및 타입을 정의합니다.
 * @remarks 이 주석은 컨벤션에 따라 자동 생성된 문서화 내용입니다.
 */
interface DocumentProfilerState {
  profiles: Record<string, DocumentProfileResult>; // fileId -> profile
  queue: QueueItem[];
  isProcessing: boolean;
  enqueue: (fileId: string, file: File) => void;
  processQueue: () => Promise<void>;
}

/**
 * useDocumentProfilerStore 상태, 변수 또는 상수 선언부입니다.
 * @type {any} - Typescript 컴파일러에 의한 타입 추론(Inferred)
 */
export const useDocumentProfilerStore = create<DocumentProfilerState>((set, get) => ({
  profiles: {},
  queue: [],
  isProcessing: false,
  enqueue: (fileId, file) => {
    // Only process PDF for now, and don't re-process if already processed or in queue
    if (!file.name.toLowerCase().endsWith('.pdf')) return;
    
    set((state) => {
      if (state.profiles[fileId] || state.queue.some(q => q.id === fileId)) {
        return state;
      }
      return { queue: [...state.queue, { id: fileId, file }] };
    });
    
    get().processQueue();
  },
  processQueue: async () => {
    const state = get();
    if (state.isProcessing || state.queue.length === 0) return;

    set({ isProcessing: true });

    while (get().queue.length > 0) {
      const item = get().queue[0];
      try {
        console.log(`[Document DNA] Starting analysis for ${item.file.name}`);
        const pagesText = await extractPdfText(item.file);
        
        const profile = await profileDocument(
          { fileName: item.file.name, docType: 'pdf', fileSize: item.file.size },
          pagesText
        );
        
        console.log(`[Document DNA] Completed analysis for ${item.file.name}`, profile);
        
        set((s) => ({
          profiles: { ...s.profiles, [item.id]: profile },
        }));
      } catch (err) {
        console.error(`[Document DNA] Error analyzing ${item.file.name}:`, err);
      } finally {
        set((s) => ({
          queue: s.queue.slice(1) // Dequeue
        }));
      }
      
      // Let the UI breathe between documents
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    set({ isProcessing: false });
  }
}));
