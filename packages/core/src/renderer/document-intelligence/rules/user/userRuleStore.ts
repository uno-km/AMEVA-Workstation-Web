import type { DomainRule } from '../types';
import { getDnaDb } from '../dnaDb';

const STORE_NAME = 'userDomainRules';

class UserRuleStore {
  async saveUserRule(rule: DomainRule): Promise<void> {
    const db = await getDnaDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const request = tx.objectStore(STORE_NAME).put(rule);
      request.onsuccess = () => resolve();
      request.onerror = () => reject('Failed to save user rule');
    });
  }

  async listUserRules(): Promise<DomainRule[]> {
    const db = await getDnaDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const request = tx.objectStore(STORE_NAME).getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject('Failed to list user rules');
    });
  }

  async getUserRule(id: string): Promise<DomainRule | null> {
    const db = await getDnaDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const request = tx.objectStore(STORE_NAME).get(id);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject('Failed to get user rule');
    });
  }

  async deleteUserRule(id: string): Promise<void> {
    const db = await getDnaDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const request = tx.objectStore(STORE_NAME).delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject('Failed to delete user rule');
    });
  }

  async clearUserRules(): Promise<void> {
    const db = await getDnaDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const request = tx.objectStore(STORE_NAME).clear();
      request.onsuccess = () => resolve();
      request.onerror = () => reject('Failed to clear user rules');
    });
  }
}

export const userRuleStore = new UserRuleStore();
