/**
 * ============================================================================
 * @file graphStore.ts
 * @system AMEVA OS Desktop Workstation
 * @location packages/core/src/renderer/features/knowledge-graph/graphStore.ts
 * @role Knowledge Graph State Store & GraphRAG Automatic Graph Generator
 * 
 * [소비처 - CONSUMERS / USAGE CONTEXT]
 * - 소비처 A (KnowledgeGraphViewer.tsx): 노드/엣지 데이터 구독 및 실시간 물리 시뮬레이션 렌더링.
 * - 소비처 B (KnowledgeGraphBlock.tsx): 에디터 내 지식 그래프 캔버스 렌더링.
 * - 소비처 C (features/rag-embedding): RAG 청크 데이터로부터 지식 그래프 자동 추출.
 * 
 * [책임 범위 - RESPONSIBILITY]
 * - RAG 청크 컬렉션(`EmbeddingChunk[]`)으로부터 계층형 및 의미적 유사도 엣지를 추출하여 지식 그래프를 자동 구축(`buildGraphFromChunks`)한다.
 * ============================================================================
 */

import type { GraphState, GraphNode, GraphEdge } from './types';
import type { EmbeddingChunk } from '../rag-embedding/types';
import { calculateCosineSimilarity } from '../rag-embedding/vectorStore';

let state: GraphState = {
  nodes: [],
  edges: [],
  simulation: 'stopped',
  gpuAccelerated: false,
  selectedNodeId: null,
};

const listeners = new Set<(state: GraphState) => void>();

export const graphStore = {
  getState: () => state,
  setState: (partial: Partial<GraphState>) => {
    state = { ...state, ...partial };
    listeners.forEach(listener => listener(state));
  },
  subscribe: (listener: (state: GraphState) => void) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  addNode: (node: GraphNode) => {
    graphStore.setState({ nodes: [...state.nodes, node] });
  },
  removeNode: (id: string) => {
    graphStore.setState({
      nodes: state.nodes.filter(n => n.id !== id),
      edges: state.edges.filter(e => e.source !== id && e.target !== id)
    });
  },
  addEdge: (edge: GraphEdge) => {
    graphStore.setState({ edges: [...state.edges, edge] });
  },
  setSimulationState: (simulationState: 'running' | 'paused' | 'stopped') => {
    graphStore.setState({ simulation: simulationState });
  },
  setSelectedNodeId: (nodeId: string | null) => {
    graphStore.setState({ selectedNodeId: nodeId });
  },
  setGpuAccelerated: (b: boolean) => {
    graphStore.setState({ gpuAccelerated: b });
  },

  /**
   * buildGraphFromChunks 함수 (GraphRAG 자동 생성기)
   * RAG 임베딩 청크 컬렉션으로부터 문서 계층 트리 및 의미적 유사도 엣지를 자동 생성합니다.
   */
  buildGraphFromChunks: (chunks: EmbeddingChunk[], documentTitle: string = '현재 문서') => {
    if (!chunks || chunks.length === 0) {
      graphStore.setState({ nodes: [], edges: [] });
      return;
    }

    const nodes: GraphNode[] = [];
    const edges: GraphEdge[] = [];
    const sectionNodeMap = new Map<string, string>(); // section/heading path -> nodeId

    // 1. 루트 문서 노드 생성
    const rootId = 'node-doc-root';
    nodes.push({
      id: rootId,
      label: documentTitle,
      x: 400 + (Math.random() - 0.5) * 50,
      y: 200 + (Math.random() - 0.5) * 50,
      vx: 0,
      vy: 0,
      size: 24,
      color: '#2563eb', // 보라색 (Root)
      nodeType: 'root',
      summary: `총 ${chunks.length}개 청크로 구성된 문서`
    });

    // 2. 섹션 / 헤딩 노드 및 청크 노드 생성
    chunks.forEach((chunk, index) => {
      const headingPath = chunk.heading || chunk.section || '일반 내용';
      let parentNodeId = rootId;

      if (!sectionNodeMap.has(headingPath)) {
        const sectionNodeId = `section-${nodes.length}`;
        sectionNodeMap.set(headingPath, sectionNodeId);

        nodes.push({
          id: sectionNodeId,
          label: headingPath.split('>').pop()?.trim() || headingPath,
          heading: headingPath,
          section: chunk.section,
          x: 400 + (Math.random() - 0.5) * 300,
          y: 200 + (Math.random() - 0.5) * 300,
          vx: 0,
          vy: 0,
          size: 18,
          color: '#3b82f6', // 파란색 (Section/Heading)
          nodeType: 'heading',
          summary: headingPath
        });

        // 루트 -> 섹션 연결 엣지
        edges.push({
          id: `edge-root-${sectionNodeId}`,
          source: rootId,
          target: sectionNodeId,
          weight: 2,
          relationType: 'parent-child'
        });
      }

      parentNodeId = sectionNodeMap.get(headingPath)!;

      // 3. 개별 청크 리프 노드 생성
      const chunkNodeId = `chunk-node-${chunk.id || index}`;
      const previewText = chunk.text.length > 25 ? chunk.text.slice(0, 25) + '...' : chunk.text;

      nodes.push({
        id: chunkNodeId,
        label: previewText,
        x: 400 + (Math.random() - 0.5) * 400,
        y: 200 + (Math.random() - 0.5) * 400,
        vx: 0,
        vy: 0,
        size: 12,
        color: '#10b981', // 초록색 (Chunk)
        nodeType: 'chunk',
        chunkId: chunk.id,
        blockId: chunk.blockId,
        heading: chunk.heading,
        section: chunk.section,
        summary: chunk.text
      });

      // 섹션 -> 청크 연결 엣지
      edges.push({
        id: `edge-sec-${chunkNodeId}`,
        source: parentNodeId,
        target: chunkNodeId,
        weight: 1,
        relationType: 'parent-child'
      });
    });

    // 4. 의미적 유사도(Semantic Cosine Similarity > 0.70) 교차 엣지 생성
    for (let i = 0; i < chunks.length; i++) {
      for (let j = i + 1; j < chunks.length; j++) {
        const chunkA = chunks[i];
        const chunkB = chunks[j];

        if (chunkA.vector && chunkB.vector && chunkA.vector.length > 0 && chunkB.vector.length > 0) {
          const sim = calculateCosineSimilarity(chunkA.vector, chunkB.vector);
          if (sim >= 0.72) {
            const nodeAId = `chunk-node-${chunkA.id || i}`;
            const nodeBId = `chunk-node-${chunkB.id || j}`;
            edges.push({
              id: `edge-sim-${nodeAId}-${nodeBId}`,
              source: nodeAId,
              target: nodeBId,
              weight: Math.round(sim * 5),
              label: `유사도 ${(sim * 100).toFixed(0)}%`,
              relationType: 'semantic-similarity'
            });
          }
        }
      }
    }

    graphStore.setState({ nodes, edges, simulation: 'running' });
    return { nodes, edges };
  }
};

export const buildGraphFromChunks = graphStore.buildGraphFromChunks;
