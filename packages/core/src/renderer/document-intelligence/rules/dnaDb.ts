import type { DocumentFeedback, RuleCandidate } from '../feedback/feedbackTypes';
import type { DomainRule } from './types';

const DB_NAME = 'ameva-document-dna';
const DB_VERSION = 1;

let dbInstance: IDBDatabase | null = null;

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
