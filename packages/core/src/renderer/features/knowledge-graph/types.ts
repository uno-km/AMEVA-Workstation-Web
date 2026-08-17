/**
 * ============================================================================
 * @file types.ts
 * @system AMEVA OS Desktop Workstation
 * @location packages/core/src/renderer/features/knowledge-graph/types.ts
 * @role Knowledge Graph & GraphRAG Data Model Definitions
 * ============================================================================
 */

export interface GraphNode { 
  id: string; 
  label: string; 
  x: number; 
  y: number; 
  vx: number; 
  vy: number; 
  size: number; 
  color: string;
  /** 연결된 BlockNote 블록 ID */
  blockId?: string;
  /** 소속 헤딩 타이틀 */
  heading?: string;
  /** 소속 대단원/섹션 타이틀 */
  section?: string;
  /** 소속 RAG 임베딩 청크 ID */
  chunkId?: string;
  /** 노드 유형 */
  nodeType?: 'root' | 'section' | 'heading' | 'chunk' | 'entity';
  /** 요약 또는 내용 미리보기 */
  summary?: string;
}

export interface GraphEdge { 
  id: string; 
  source: string; 
  target: string; 
  weight: number;
  label?: string;
  relationType?: 'parent-child' | 'semantic-similarity' | 'cross-reference';
}

export interface GraphState { 
  nodes: GraphNode[]; 
  edges: GraphEdge[]; 
  simulation: 'running' | 'paused' | 'stopped'; 
  gpuAccelerated: boolean;
  selectedNodeId?: string | null;
}
