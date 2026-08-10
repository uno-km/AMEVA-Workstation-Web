/**
 * ============================================================================
 * @file documentFeedbackStore.ts
 * @description documentFeedbackStore.ts 시스템 모듈 구성요소로, 관련 UI 렌더링 및 비즈니스 로직을 담당합니다.
 * @usage 문서 에디터 및 뷰어 내부에서 동적으로 호출되거나 유틸리티 함수로 사용됩니다.
 * @example
 * // 예시 로직 (자동 생성됨)
 * import { something } from './documentFeedbackStore';
 * 
 * @created 2026-08-10 20:30:36
 * @updated 2026-08-10 20:30:36
 * @author uno-km
 * @commit docs: 전체 소스코드 한글 주석 및 사내 컨벤션 일괄 적용
 * ============================================================================
 */

// [내부 프로젝트 의존성 모듈 임포트: ./feedbackTypes]
import type { DocumentFeedback } from './feedbackTypes';
// [내부 프로젝트 의존성 모듈 임포트: ../rules/dnaDb]
import { getDnaDb } from '../rules/dnaDb';

const STORE_NAME = 'documentFeedbacks';

/**
 * DocumentFeedbackStore 클래스의 인스턴스를 정의하고 관련 로직을 안전하게 캡슐화합니다.
 * @remarks 이 주석은 컨벤션에 따라 자동 생성된 문서화 내용입니다.
 */
class DocumentFeedbackStore {
  async saveDocumentFeedback(feedback: DocumentFeedback): Promise<void> {
    const db = await getDnaDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const request = store.put(feedback);
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject('Failed to save feedback');
    });
  }

  async getDocumentFeedback(feedbackId: string): Promise<DocumentFeedback | null> {
    const db = await getDnaDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const request = tx.objectStore(STORE_NAME).get(feedbackId);
      
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject('Failed to get feedback');
    });
  }

  async listDocumentFeedback(): Promise<DocumentFeedback[]> {
    const db = await getDnaDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const request = tx.objectStore(STORE_NAME).getAll();
      
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject('Failed to list feedbacks');
    });
  }

  async deleteDocumentFeedback(feedbackId: string): Promise<void> {
    const db = await getDnaDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const request = tx.objectStore(STORE_NAME).delete(feedbackId);
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject('Failed to delete feedback');
    });
  }

  async getFeedbackByDomain(domain: string): Promise<DocumentFeedback[]> {
    const db = await getDnaDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const index = store.index('domain');
      const request = index.getAll(domain);
      
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject('Failed to get feedbacks by domain');
    });
  }
}

/**
 * documentFeedbackStore 상태, 변수 또는 상수 선언부입니다.
 * @type {any} - Typescript 컴파일러에 의한 타입 추론(Inferred)
 */
export const documentFeedbackStore = new DocumentFeedbackStore();
