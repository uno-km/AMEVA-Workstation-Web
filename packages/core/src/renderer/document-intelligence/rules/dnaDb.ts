/**
 * ============================================================================
 * @file dnaDb.ts
 * @description dnaDb.ts 시스템 모듈 구성요소로, 관련 UI 렌더링 및 비즈니스 로직을 담당합니다.
 * @usage 문서 에디터 및 뷰어 내부에서 동적으로 호출되거나 유틸리티 함수로 사용됩니다.
 * @example
 * // 예시 로직 (자동 생성됨)
 * import { something } from './dnaDb';
 * 
 * @created 2026-08-10 20:30:36
 * @updated 2026-08-10 20:30:36
 * @author uno-km
 * @commit docs: 전체 소스코드 한글 주석 및 사내 컨벤션 일괄 적용
 * ============================================================================
 */

// [내부 프로젝트 의존성 모듈 임포트: ../feedback/feedbackTypes]
import type { DocumentFeedback, RuleCandidate } from '../feedback/feedbackTypes';
// [내부 프로젝트 의존성 모듈 임포트: ./types]
import type { DomainRule } from './types';

const DB_NAME = 'ameva-document-dna';
const DB_VERSION = 1;

let dbInstance: IDBDatabase | null = null;

/**
 * getDnaDb 함수의 핵심 비즈니스 로직 및 상태 제어를 처리합니다.
 * @remarks 이 주석은 컨벤션에 따라 자동 생성된 문서화 내용입니다.
 */
export async function getDnaDb(): Promise<IDBDatabase> {
  if (dbInstance) return dbInstance;
  
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onerror = () => reject('DNA DB open error');
    
    request.onsuccess = (e) => {
      dbInstance = (e.target as IDBOpenDBRequest).result;
      resolve(dbInstance);
    };
    
    request.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result;
      
      // 1. documentFeedbacks
      if (!db.objectStoreNames.contains('documentFeedbacks')) {
        const store = db.createObjectStore('documentFeedbacks', { keyPath: 'feedbackId' });
        store.createIndex('fileId', 'fileId', { unique: false });
        store.createIndex('domain', 'corrected.domain', { unique: false });
        store.createIndex('shape', 'corrected.shape', { unique: false });
        store.createIndex('createdAt', 'createdAt', { unique: false });
      }

      // 2. ruleCandidates
      if (!db.objectStoreNames.contains('ruleCandidates')) {
        const store = db.createObjectStore('ruleCandidates', { keyPath: 'candidateId' });
        store.createIndex('targetDomain', 'targetDomain', { unique: false });
        store.createIndex('targetShape', 'targetShape', { unique: false });
        store.createIndex('status', 'status', { unique: false });
        store.createIndex('createdAt', 'createdAt', { unique: false });
      }

      // 3. userDomainRules
      if (!db.objectStoreNames.contains('userDomainRules')) {
        const store = db.createObjectStore('userDomainRules', { keyPath: 'id' });
        store.createIndex('id', 'id', { unique: true });
        store.createIndex('source', 'source', { unique: false });
      }
    };
  });
}
