/**
 * ============================================================================
 * @file semanticCache.ts
 * @system AMEVA OS Desktop Workstation - AI Intelligence Core
 * @location packages/core/src/renderer/features/ai-agent/core/semanticCache.ts
 * @role High-Performance In-Memory LRU & IndexedDB Semantic Prompt Cache
 * ============================================================================
 */

import { calculateCosineSimilarity } from '../../rag-embedding/vectorStore';
import type { AgentMessage, InsertSuggestion } from '../types';

export interface SemanticCacheEntry {
  id: string;
  query: string;
  queryVector?: number[];
  response: {
    content: string;
    thought?: string;
    citations?: Array<{ chunkId?: string; blockId?: string; text: string; heading?: string; section?: string; score?: number }>;
    insertSuggestions?: InsertSuggestion[];
  };
  createdAt: number;
  hitCount: number;
}

const DB_NAME = 'ameva-semantic-cache-v2';
const STORE_NAME = 'cache_entries';
const DB_VERSION = 1;
const DEFAULT_SIMILARITY_THRESHOLD = 0.95;
const DEFAULT_TTL_MS = 24 * 60 * 60 * 1000; // 24시간
const MAX_MEMORY_ENTRIES = 100;

// In-Memory Fast LRU Cache Buffer
const memoryCache = new Map<string, SemanticCacheEntry>();

let idbInstance: IDBDatabase | null = null;

async function getCacheDB(): Promise<IDBDatabase | null> {
  if (typeof indexedDB === 'undefined') return null;
  if (idbInstance) return idbInstance;

  return new Promise((resolve) => {
    try {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = (e: any) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        }
      };
      request.onsuccess = (e: any) => {
        idbInstance = e.target.result;
        resolve(idbInstance);
      };
      request.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

export class SemanticCache {
  private threshold: number;
  private ttlMs: number;

  constructor(threshold: number = DEFAULT_SIMILARITY_THRESHOLD, ttlMs: number = DEFAULT_TTL_MS) {
    this.threshold = threshold;
    this.ttlMs = ttlMs;
  }

  /**
   * Search for a cached response using Exact Match or High-Confidence Vector Similarity (>= 0.95)
   */
  async findMatch(query: string, queryVector?: number[]): Promise<SemanticCacheEntry | null> {
    const trimmedQuery = query.trim().toLowerCase();
    const now = Date.now();

    // 1. In-Memory Exact Match (0.001ms)
    for (const entry of memoryCache.values()) {
      if (now - entry.createdAt > this.ttlMs) continue;

      if (entry.query.trim().toLowerCase() === trimmedQuery) {
        entry.hitCount++;
        return entry;
      }
    }

    // 2. Vector Semantic Similarity Check (In-Memory)
    if (queryVector && queryVector.length > 0) {
      let bestEntry: SemanticCacheEntry | null = null;
      let highestSim = 0;

      for (const entry of memoryCache.values()) {
        if (now - entry.createdAt > this.ttlMs) continue;
        if (!entry.queryVector || entry.queryVector.length === 0) continue;

        const sim = calculateCosineSimilarity(queryVector, entry.queryVector);
        if (sim >= this.threshold && sim > highestSim) {
          highestSim = sim;
          bestEntry = entry;
        }
      }

      if (bestEntry) {
        bestEntry.hitCount++;
        return bestEntry;
      }
    }

    // 3. Fallback: IndexedDB Scan
    try {
      const db = await getCacheDB();
      if (!db) return null;

      const entries = await new Promise<SemanticCacheEntry[]>((resolve) => {
        const tx = db.transaction([STORE_NAME], 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const req = store.getAll();
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => resolve([]);
      });

      for (const entry of entries) {
        if (now - entry.createdAt > this.ttlMs) continue;

        // Exact Match
        if (entry.query.trim().toLowerCase() === trimmedQuery) {
          memoryCache.set(entry.id, entry);
          return entry;
        }

        // Semantic Match
        if (queryVector && entry.queryVector && entry.queryVector.length > 0) {
          const sim = calculateCosineSimilarity(queryVector, entry.queryVector);
          if (sim >= this.threshold) {
            memoryCache.set(entry.id, entry);
            return entry;
          }
        }
      }
    } catch (err) {
      console.warn('[SemanticCache] Lookup failed:', err);
    }

    return null;
  }

  /**
   * Save a newly generated AI response to semantic cache
   */
  async set(
    query: string,
    response: SemanticCacheEntry['response'],
    queryVector?: number[]
  ): Promise<void> {
    const id = `cache-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const entry: SemanticCacheEntry = {
      id,
      query,
      queryVector,
      response,
      createdAt: Date.now(),
      hitCount: 1
    };

    // 1. Update In-Memory Cache (LRU bounded)
    if (memoryCache.size >= MAX_MEMORY_ENTRIES) {
      const oldestKey = memoryCache.keys().next().value;
      if (oldestKey) memoryCache.delete(oldestKey);
    }
    memoryCache.set(id, entry);

    // 2. Persist to IndexedDB
    try {
      const db = await getCacheDB();
      if (db) {
        const tx = db.transaction([STORE_NAME], 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        store.put(entry);
      }
    } catch (err) {
      console.warn('[SemanticCache] Persistence failed:', err);
    }
  }

  /**
   * Clear all semantic cache entries
   */
  async clear(): Promise<void> {
    memoryCache.clear();
    try {
      const db = await getCacheDB();
      if (db) {
        const tx = db.transaction([STORE_NAME], 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        store.clear();
      }
    } catch (err) {
      console.warn('[SemanticCache] Clear failed:', err);
    }
  }

  get size(): number {
    return memoryCache.size;
  }
}

export const semanticCache = new SemanticCache();
