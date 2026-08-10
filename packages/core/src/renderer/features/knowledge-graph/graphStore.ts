/**
 * ============================================================================
 * @file graphStore.ts
 * @description graphStore.ts 시스템 모듈 구성요소로, 관련 UI 렌더링 및 비즈니스 로직을 담당합니다.
 * @usage 문서 에디터 및 뷰어 내부에서 동적으로 호출되거나 유틸리티 함수로 사용됩니다.
 * @example
 * // 예시 로직 (자동 생성됨)
 * import { something } from './graphStore';
 * 
 * @created 2026-08-11 08:57:45
 * @updated 2026-08-11 08:57:45
 * @author uno-km
 * @commit docs: 전체 소스코드 한글 주석 및 사내 컨벤션 일괄 적용
 * ============================================================================
 */

import type { GraphState, GraphNode, GraphEdge } from './types'

let state: GraphState = {
  nodes: [],
  edges: [],
  simulation: 'stopped',
  gpuAccelerated: false
}

const listeners = new Set<(state: GraphState) => void>()

export const graphStore = {
  getState: () => state,
  setState: (partial: Partial<GraphState>) => {
    state = { ...state, ...partial }
    listeners.forEach(listener => listener(state))
  },
  subscribe: (listener: (state: GraphState) => void) => {
    listeners.add(listener)
    return () => listeners.delete(listener)
  },
  addNode: (node: GraphNode) => {
    graphStore.setState({ nodes: [...state.nodes, node] })
  },
  removeNode: (id: string) => {
    graphStore.setState({
      nodes: state.nodes.filter(n => n.id !== id),
      edges: state.edges.filter(e => e.source !== id && e.target !== id)
    })
  },
  addEdge: (edge: GraphEdge) => {
    graphStore.setState({ edges: [...state.edges, edge] })
  },
  setSimulationState: (simulationState: 'running' | 'paused' | 'stopped') => {
    graphStore.setState({ simulation: simulationState })
  },
  setGpuAccelerated: (b: boolean) => {
    graphStore.setState({ gpuAccelerated: b })
  }
}
