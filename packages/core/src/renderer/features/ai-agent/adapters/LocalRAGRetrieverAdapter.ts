/**
 * ============================================================================
 * @file LocalRAGRetrieverAdapter.ts
 * @system AMEVA OS Desktop Workstation - AI Intelligence Core
 * @location packages/core/src/renderer/features/ai-agent/adapters/LocalRAGRetrieverAdapter.ts
 * @role In-Memory & IndexedDB RAG Hybrid Search & GraphRAG Relation Synthesizer
 * ============================================================================
 */

import type { IRAGRetriever } from '../types';
import type { EmbeddingChunk, HybridSearchOptions } from '../../rag-embedding/types';
import { searchHybrid, loadAllChunks } from '../../rag-embedding/vectorStore';
import { PromptManager } from '../../../services/llm/prompts/PromptManager';
import { graphStore } from '../../knowledge-graph/graphStore';

export class LocalRAGRetrieverAdapter implements IRAGRetriever {
  private activeModelId: string = 'default';

  constructor(modelId: string = 'default') {
    this.activeModelId = modelId;
  }

  setModelId(modelId: string) {
    this.activeModelId = modelId;
  }

  async search(query: string, options?: HybridSearchOptions): Promise<EmbeddingChunk[]> {
    if (typeof indexedDB === 'undefined') return [];
    try {
      const allChunks = await loadAllChunks();
      if (!allChunks || allChunks.length === 0) return [];
      return searchHybrid(query, null, allChunks, options);
    } catch (err) {
      console.warn('[LocalRAGRetrieverAdapter] search failed:', err);
      return [];
    }
  }

  async buildContextPrompt(query: string, options?: HybridSearchOptions): Promise<{ prompt: string; chunks: EmbeddingChunk[] }> {
    const rawChunks = await this.search(query, options);

    // 높은 관련도 청크 상위 2개로 압축 및 청크 길이 450자로 캡
    const chunks = (rawChunks || [])
      .filter(c => (c.score || 0) > 0.2)
      .slice(0, 2)
      .map(c => ({
        ...c,
        text: c.text && c.text.length > 450 ? c.text.slice(0, 450) + '...' : c.text
      }));

    const factory = PromptManager.getFactory(this.activeModelId);
    let prompt = factory.createRAGPrompt(query, chunks);

    // GraphRAG: Synthesize concept relationship edges from graphStore
    try {
      const { edges, nodes } = graphStore.getState();
      const simEdges = edges.filter(e => e.relationType === 'semantic-similarity');

      if (simEdges.length > 0 && chunks.length > 0) {
        const nodeMap = new Map(nodes.map(n => [n.id, n.label]));
        const graphRelations = simEdges.slice(0, 3).map(e => {
          const src = nodeMap.get(e.source) || e.source;
          const tgt = nodeMap.get(e.target) || e.target;
          return `- [연관] "${src}" <---> "${tgt}"`;
        }).join('\n');

        prompt += `\n\n[KNOWLEDGE GRAPH]\n${graphRelations}\n`;
      }
    } catch (err) {
      console.warn('[LocalRAGRetrieverAdapter] GraphRAG synthesis skipped:', err);
    }

    return { prompt, chunks };
  }
}
