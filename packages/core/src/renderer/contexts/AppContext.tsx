/**
 * @file AppContext.tsx
 * @system AMEVA OS Desktop Workstation - Client Renderer
 * @location src/renderer/contexts/AppContext.tsx
 * @role Application global context provider & consumer adapter (React Context)
 * 
 * [책임 범위 - RESPONSIBILITY]
 * - 리액트 Context API를 활용하여, 루트 노드(App.tsx)에서 조립된 전역 컨트롤러 메서드와 공용 설정들을 리프 뷰 노드까지 전달 전파한다.
 * - 에디터 조작(editor, editorMode), 파일 I/O(handleSaveFile 등), 히스토리 백업(snapshots), 실시간 협업(peers, ydoc), Yjs 채팅(chatMessages), MCP 서버 정보의 전달 통로로 기능한다.
 * - 컨텍스트 범위 외 호출 예외 가드(`useAppContext`)를 제공한다.
 * 
 * [책임이 아닌 것 - NON-RESPONSIBILITY]
 * - 전역 상태를 직접 메모리에 수록 관리 (Zustand 스토어들에 책임을 위임).
 * 
 * [절대 깨면 안 되는 계약 - CONTRACT]
 * - MUST: `useAppContext` 호출 시 컨텍스트 바인딩이 누락되어 `null`이 잡히는 경우,
 *   런타임 NPE(NullPointerException) 오작동을 차단하기 위해 반드시 `'useAppContext must be used within an AppProvider'` 예외를 throw 하도록 가드 계약을 유지할 것.
 
 * [소비처 - CONSUMERS / USAGE CONTEXT]
 * - 소비처 A (src/renderer/App.tsx): AMEVA OS 최상위 마운트 레이어에서 의존성 로더로 연동 소비.
 * - 소비처 B (src/renderer/main.tsx): 렌더러 엔트리 라이프사이클의 기본 기능으로 수입 소비.
 */

/* 
 * [IMPORT SEGMENTATION & CONTRACTS]
 * - React, createContext, useContext: 전역 컨텍스트를 선언하고 하위 자식 노드에서 꺼내 쓰기 위한 React 코어 API.
 */
import React, { createContext, useContext } from 'react'

/* 
 * [SHARED SCHEMAS & TYPES]
 * - EditorMode: 웰컴/편집/미리보기 모드 타입 정의.
 * - ExportFormat: PDF, Word, Excel, PPT, HWPX 등의 파일 포맷 타입.
 * - DocumentSnapshot: 로컬 DB에 수록된 백업 이력 구조체.
 * - PeerState: 실시간 협업에 참여 중인 동료 캐럿 및 포인터 좌표 구조체.
 * - AppEditor: BlockNote 기반 커스텀 에디터 타입.
 * - ChatMessage: Yjs WebRTC 룸 참여 피어 간의 메신저 노드 타입.
 * - AppSettings: 줄바꿈, 로컬 AI 경로, 플러그인 등 사용자 환경설정 구조체.
 */
import type { EditorMode, ExportFormat, DocumentSnapshot, PeerState } from '../../shared/types'
import type { AmevaEditor as AppEditor } from '../editor/amevaBlockSchema'
import type { ChatMessage } from '../hooks/useChat'
import type { AppSettings } from '../components/SettingsModal'

/**
 * AppContextType 인터페이스 정의.
 * 전역 렌더 트리 전반에 공유 분배되는 환경 변수, 에디터 및 협업 정보 구조.
 */
export interface AppContextType {
  // ── [1. App UI/Environment] 설정 및 줌 제어 ──
  settings: AppSettings
  handleUpdateSettings: (newSettings: Partial<AppSettings>) => void
  handleInstallPlugin: (id: string, scriptUrl: string) => Promise<void>
  handleUninstallPlugin: (id: string) => void
  handleOpenGithub: () => void
  handleCloseApp: () => void
  handleToggleFullscreen: () => void
  handleZoomIn: () => void
  handleZoomOut: () => void
  handleZoomReset: () => void

  // ── [2. Editor & Documents] 핵심 상태 바인딩 ──
  documentId: string
  setDocumentId: (id: string) => void
  editor: AppEditor | null
  splitEditor: AppEditor | null
  editorMode: EditorMode
  setEditorMode: (mode: EditorMode) => void
  handleSwitchMode: (mode: EditorMode) => void
  handleStartWelcomeEdit: () => void
  handleStartNewDocument: () => void
  loadMarkdownIntoEditor: (targetEditor: any, rawContent: string, isBinary: boolean, path: string) => Promise<void>

  // ── [3. File Operations] 물리 디스크 I/O ──
  handleOpenFile: () => void
  handleSaveFile: () => void
  handleSaveAsFile: () => void
  handleExport: (format: ExportFormat) => void

  // ── [4. History & Snapshots] 자동 백업 및 이력 롤백 ──
  snapshots: DocumentSnapshot[]
  createSnapshot: (title: string, content?: string) => Promise<void> | void
  deleteSnapshot: (id: string) => void
  handleSelectSnapshotForDiff: (snap: DocumentSnapshot) => void
  handleRollback: (content: string) => void
  getLineDiff: any

  // ── [5. Collaboration] 실시간 Yjs 협업 세션 ──
  peers: PeerState[]
  serverRunning: boolean
  serverPort: number
  setServerPort: (port: number) => void
  serverHost: string
  setServerHost: (host: string) => void
  useLocalServer: boolean
  setUseLocalServer: (use: boolean) => void
  toggleLocalServer: (port: number) => void
  collaborationLink: string
  isConnected: boolean
  username: string
  setUsername: (name: string) => void
  userColor: string
  setUserColor: (color: string) => void

  // ── [6. Chat] 실시간 피어 메시징 ──
  chatMessages: ChatMessage[]
  sendChatMessage: (msg: string) => void
  clearChatMessages: () => void

  // ── [7. MCP] Model Context Protocol 연동 ──
  mcpServers: any[]
  refreshMcpServers: () => void
}

/**
 * AppContext 전역 공유 저장소 선언 (초기값 null).
 */
export const AppContext = createContext<AppContextType | null>(null)

/**
 * @component AppProvider
 * @description Context.Provider의 가독성을 높이고 하위 Children 트리를 감싸는 전송 노드 컴포넌트.
 */
export function AppProvider({ 
  /*
   * [PROPERTY MAPPINGS]
   * - children: 하위 리프 레이아웃 컴포넌트 트리.
   * - value: 조립된 AppContextType 사양 개체.
   */
  children, 
  value 
}: { 
  children: React.ReactNode, 
  value: AppContextType 
}) {
  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  )
}

/**
 * @hook useAppContext
 * @description 하위 컴포넌트에서 Context API에 접근하여 value 값을 안전하게 꺼내 쓰는 훅.
 */
export function useAppContext(): AppContextType {
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `context`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const context = ...` 형태로 안전 캐싱 후 가공 기동.
       */
  const context = useContext(AppContext)
  
  // CONTRACT: null 검사 예외 가드 작동 계약 준수
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider')
  }
  return context
}

