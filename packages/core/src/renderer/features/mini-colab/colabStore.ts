/**
 * ============================================================================
 * @file colabStore.ts
 * @description colabStore.ts 시스템 모듈 구성요소로, 관련 UI 렌더링 및 비즈니스 로직을 담당합니다.
 * @usage 문서 에디터 및 뷰어 내부에서 동적으로 호출되거나 유틸리티 함수로 사용됩니다.
 * @example
 * // 예시 로직 (자동 생성됨)
 * import { something } from './colabStore';
 * 
 * @created 2026-08-11 08:57:45
 * @updated 2026-08-11 08:57:45
 * @author uno-km
 * @commit docs: 전체 소스코드 한글 주석 및 사내 컨벤션 일괄 적용
 * ============================================================================
 */

import type { ColabState, ColabCell } from './types'

let state: ColabState = {
  cells: [],
  kernelReady: false,
  gpuEnabled: false,
  totalExecutions: 0
}

const listeners = new Set<(state: ColabState) => void>()

export const colabStore = {
  getState: () => state,
  setState: (partial: Partial<ColabState>) => {
    state = { ...state, ...partial }
    listeners.forEach(listener => listener(state))
  },
  subscribe: (listener: (state: ColabState) => void) => {
    listeners.add(listener)
    return () => listeners.delete(listener)
  },
  addCell: (cell: ColabCell) => {
    colabStore.setState({ cells: [...state.cells, cell] })
  },
  removeCell: (id: string) => {
    colabStore.setState({ cells: state.cells.filter(c => c.id !== id) })
  },
  updateCell: (id: string, partial: Partial<ColabCell>) => {
    colabStore.setState({
      cells: state.cells.map(c => c.id === id ? { ...c, ...partial } : c)
    })
  },
  updateCellOutput: (id: string, output: string, status: ColabCell['status']) => {
    colabStore.setState({
      cells: state.cells.map(c => c.id === id ? { ...c, output, status, executionCount: c.executionCount + 1 } : c),
      totalExecutions: state.totalExecutions + 1
    })
  },
  setKernelReady: (b: boolean) => {
    colabStore.setState({ kernelReady: b })
  },
  setGpuEnabled: (b: boolean) => {
    colabStore.setState({ gpuEnabled: b })
  }
}
