/**
 * ============================================================================
 * @file types.ts
 * @description types.ts 시스템 모듈 구성요소로, 관련 UI 렌더링 및 비즈니스 로직을 담당합니다.
 * @usage 문서 에디터 및 뷰어 내부에서 동적으로 호출되거나 유틸리티 함수로 사용됩니다.
 * @example
 * // 예시 로직 (자동 생성됨)
 * import { something } from './types';
 * 
 * @created 2026-08-10 20:30:36
 * @updated 2026-08-10 20:30:36
 * @author uno-km
 * @commit docs: 전체 소스코드 한글 주석 및 사내 컨벤션 일괄 적용
 * ============================================================================
 */

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

/**
 * ExportFormat 모듈 내외부에서 사용되는 데이터 통신 규격 및 타입을 정의합니다.
 * @remarks 이 주석은 컨벤션에 따라 자동 생성된 문서화 내용입니다.
 */
export type ExportFormat = 'md' | 'pdf' | 'docx' | 'xlsx' | 'pptx' | 'hwpx' | 'html' | 'xml' | 'adc'

/**
 * DocumentSnapshot 모듈 내외부에서 사용되는 데이터 통신 규격 및 타입을 정의합니다.
 * @remarks 이 주석은 컨벤션에 따라 자동 생성된 문서화 내용입니다.
 */
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

/**
 * PeerState 모듈 내외부에서 사용되는 데이터 통신 규격 및 타입을 정의합니다.
 * @remarks 이 주석은 컨벤션에 따라 자동 생성된 문서화 내용입니다.
 */
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

