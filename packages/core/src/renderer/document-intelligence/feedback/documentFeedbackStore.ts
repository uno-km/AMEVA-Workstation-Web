import { DocumentFeedback } from './feedbackTypes';
import { getDnaDb } from '../rules/dnaDb';

const STORE_NAME = 'documentFeedbacks';

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

export const documentFeedbackStore = new DocumentFeedbackStore();
