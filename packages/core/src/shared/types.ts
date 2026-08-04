/**
 * @file types.ts
 * @system AMEVA OS Desktop Workstation
 * @location src/shared/types.ts
 * @role Core module helper and integration logic
 * 
 * [소비처 - CONSUMERS / USAGE CONTEXT]
 * - 소비처 A (src/renderer/App.tsx): AMEVA OS 최상위 마운트 레이어에서 의존성 로더로 연동 소비.
 * - 소비처 B (src/renderer/main.tsx): 렌더러 엔트리 라이프사이클의 기본 기능으로 수입 소비.
 * 
 * [책임 범위 - RESPONSIBILITY]
 * - 본 파일은 AMEVA 시스템 내에서 도메인 목적에 부합하는 연산 및 데이터 처리 흐름을 안전하게 캡슐화한다.
 * - 외부 라이브러리 및 하위 종속성을 조율하고 결과 규격을 일관되게 제공한다.
 * 
 * [절대 깨면 안 되는 계약 - CONTRACT]
 * - MUST: 모든 예외 발생 시 에러를 침묵시키지 말고 에러 로그를 명확하게 남길 것.
 * - MUST NOT: TypeScript any 형식을 우회 수단으로 함부로 선언하지 말 것.
 */

export type EditorMode = 'edit' | 'preview' | 'raw' | 'welcome' | 'kanban'

export type ExportFormat = 'md' | 'pdf' | 'docx' | 'xlsx' | 'pptx' | 'hwpx' | 'html' | 'xml'

export interface DocumentSnapshot {
  id: string
  timestamp: number
  content: string
  title: string
}

/** 타 사용자 블록 하이라이트 상태 */
export interface PeerBlockHighlight {
  /** 현재 커서가 있는 블록 ID */
  blockId: string
  /** 편집 중 여부 (타이핑이 감지됨) */
  isEditing: boolean
  /** 타임스탬프 — 500ms 이상 변화 없으면 idle 처리 */
  updatedAt: number
}

export interface PeerState {
  id: string
  name: string
  color: string
  pointer?: {
    x: number // % percentage from editor left
    y: number // absolute px relative to editor container scroll height
  }
  dragSelection?: {
    anchorBlockId: string
    focusBlockId: string
    rects: { top: number; left: number; width: number; height: number }[]
  }
  /** 블록 단위 하이라이트 (협업 모드) */
  blockHighlight?: PeerBlockHighlight
}

/** 내보내기 단계 (공통 타입) */
export type ExportPhase = 'idle' | 'converting' | 'uploading' | 'running' | 'success' | 'done' | 'error' | string

/** 내보내기 진행 상태 (공통 타입) */
export interface ExportProgress {
  phase: ExportPhase
  format: string
  percent: number
  message: string
  savedPath?: string
  error?: string
}

