/**
 * @file App.tsx
 * @system AMEVA OS Desktop Workstation - Client Renderer
 * @location src/renderer/App.tsx
 * @role Composition Root & Global Orchestrator (Facade)
 * 
 * [소비처 - CONSUMERS / USAGE CONTEXT]
 * - 소비처 A (src/renderer/main.tsx): React App 마운팅 노드 `root.render(<App />)` 에서 최상위 루트 엔트리 컴포넌트로 호출되어 렌더링을 시작함.
 * - 시스템 연동: Electron의 `BrowserWindow.loadURL` 에 의해 가상 프레임 내부에서 실행되는 최상위 어플리케이션 본체.
 * 
 * [책임 범위 - RESPONSIBILITY]
 * - 전역 상태 저장소(Zustand)와 비즈니스 기능별 Custom Hook들의 생명주기를 통합/조립(Composition)한다.
 * - Context Provider Nesting의 최종 루트 노드로 기능한다.
 * - 개별 도메인 로직이나 비즈니스 규칙을 직접 소유하지 않고, 조율(Orchestration)만 담당한다.
 * 
 * [책임이 아닌 것 - NON-RESPONSIBILITY]
 * - API 직접 호출, 로컬 DB(SQLite) 직접 쿼리, LLM 추론 직접 처리 (하위 hook에 위임).
 * - 마크다운 파싱이나 에디터 DOM의 직접적 조작 (AmevaEditor 객체와 markdownEditor 컴포넌트가 소유).
 * 
 * [입력/출력 계약 - CONTRACT]
 * - INVARIANT: App 컴포넌트는 단 하나의 전역 <AppProvider>를 제공하며, 자식 컴포넌 <AppLayout>으로 레이아웃과 이벤트를 바인딩한다.
 * - MUST NOT: App.tsx 내에 비즈니스 관련 useEffect를 직접 2개 이상 추가하지 않는다. 만약 orchestration hook이 필요할 시 별도 분리해야 한다.
 * 
 * [Provider Nesting Order & Rationale]
 * - 1. <AppProvider>: 에디터 생명주기 및 콜라보레이션, 전역 설정을 전파하는 가장 최상위 Context.
 *   - Rationale: 하위 Layout 및 AI Panel, StatusBar 등 모든 컴포넌트가 이 컨텍스트의 settings와 editor 인스턴스를 공유해야 하기 때문.
 * 
 * [ADR - 쪼개기 및 분리 임계치 기준 (AI Agent Mandatory Guideline)]
 * - Route가 5개를 초과할 시: `src/renderer/routes/registry.ts`로 분리할 것.
 * - Provider가 4개를 초과할 시: `src/renderer/providers/AppProviders.tsx`로 통합 분리할 것.
 * - Layout 조건 분기가 3개를 초과할 시: `src/renderer/components/layouts/` 하위 모듈로 즉각 분리할 것.
 * - useEffect가 2개 이상 추가되거나 중첩될 시: `src/renderer/hooks/app/useAppOrchestration.ts` 등으로 결합도를 격리할 것.
 * - 이 파일의 총 코드 라인수가 250라인을 초과할 시: Composition 책임을 재검토하여 즉각 쪼갤 것. (현재 약 240~250라인 수준으로 임계치에 도달함).
 * - 조건문이 3단계 이상 중첩될 시: Helper 함수나 Strategy 패턴으로 분리할 것.
 */

/* 
 * [IMPORT SEGMENTATION & CONTRACTS]
 * - React 라이프사이클 훅 (상태 관리, 부작용 제어, 메모이제이션 바인딩)
 */
import { useState, useEffect, useCallback } from 'react'

/* 
 * [ZUSTAND GLOBAL STORES]
 * - UIStore: 모달 활성화 및 테마, 패널 레이아웃 가시성 관리 스토어.
 * - WorkspaceStore: 파일 콘텐츠 버퍼, 문서 탭 및 선택 영역 관리 스토어.
 * - ProcessStore: 로컬 AI 모델 다운로드 큐 및 브라우저/에디터 줌 제어 스토어.
 */
import { useUIStore } from './stores/useUIStore'
import { useWorkspaceStore } from './stores/useWorkspaceStore'
import { useProcessStore } from './stores/useProcessStore'

/* 
 * [APPLICATION LIFE CYCLE & CONTROLLERS]
 * - useAppBootstrap: 플러그인 동적 로드 및 최초 환경 인스턴스 초기화 조율 훅.
 * - useAppTabs: 다중 문서 브라우징 모드 제어 훅.
 * - useAppIpcBridge: Electron 주 프로세스의 파일 IO 시그널을 수신하여 렌더러로 라우팅하는 훅.
 */
import { useAppBootstrap } from './hooks/app/useAppBootstrap'
import { useAppTabs } from './hooks/app/useAppTabs'
import { useAppIpcBridge } from './hooks/app/useAppIpcBridge'

/* 
 * [ZUSTAND REACT SHALLOW COMPARISON]
 * - Zustand 구독 모델에서 불필요한 전체 렌더링을 차단하기 위해 얕은 비교 가드를 제공하는 유틸.
 */
import { useShallow } from 'zustand/react/shallow'

/* 
 * [KEYBOARD & FILE I/O WRAPPERS]
 * - useGlobalShortcuts: 단축키 리스너 바인딩.
 * - useAppFileOperations: IPC 파일 저장, 로드, 새창 띄우기 등의 로직 바인딩.
 * - useAppAISuggestions: AI의 EDIT/INSERT 제안을 실제 블록 위치에 주입하는 동작 제어.
 */
import { useGlobalShortcuts } from './hooks/app/useGlobalShortcuts'
import { useAppFileOperations } from './hooks/app/useAppFileOperations'
import { useAppAISuggestions } from './hooks/app/useAppAISuggestions'

/* 
 * [COLLABORATION & HISTORY SERVICES]
 * - useCollaboration: Yjs 및 WebRTC 기반 동시 편집 서버 브릿지.
 * - useHistory: 문서 변경 내역 히스토리 스냅샷 DB 연동 훅.
 */
import { useCollaboration } from './hooks/useCollaboration'
import { useHistory } from './hooks/useHistory'
import { useWebLLM } from './components/useWebLLM'
import { PwaReloadPrompt } from './components/ui/PwaReloadPrompt'

/* 
 * [AI INTERACTION & COMMUNICATION HOOKS]
 * - useAI: AI Facade 진입점 훅.
 * - useChat: 피어 간 동시 편집 채팅 동기화 훅.
 * - usePanelResize: 마우스 드래그를 이용한 사이드/AI 패널 크기 리사이저.
 * - useAppExport: 다양한 외부 문서 포맷 내보내기 훅.
 */

import { useChat } from './hooks/useChat'
import { usePanelResize } from './hooks/usePanelResize'
import { useAppExport } from './hooks/app/useAppExport'

/* 
 * [SHARED SCHEMAS & TYPES]
 * - EditorMode: 웰컴화면/편집기/미리보기 모드 타입 정의.
 * - AppEditor: BlockNote 기반의 커스텀 블록 스키마 바인딩 형식.
 */
import { type EditorMode } from '../shared/types'
import { type AmevaEditor as AppEditor } from './editor/amevaBlockSchema'

/* 
 * [RENDERER ROOT APP LIFECYCLE CONTROLLERS]
 * - useAppSettingsManager: 설정 파일 변경 감지 및 로드.
 * - useAppEditorInit: Yjs 협업 에디터 인스턴스 팩토리.
 * - useAppGlobalApi: 외부 브라우저 플러그인을 위한 API 노출 브릿지.
 * - useAppEditorSync: 에디터 갱신과 Zustand 스냅샷 동기화 가드.
 * - useAppModeSwitch: 편집/미리보기 화면 전환 조율.
 */
import { useAppSettingsManager } from './hooks/app/useAppSettingsManager'
import { useAppEditorInit } from './hooks/app/useAppEditorInit'
import { useAppGlobalApi } from './hooks/app/useAppGlobalApi'
import { useAppEditorSync } from './hooks/app/useAppEditorSync'
import { useAppModeSwitch } from './hooks/app/useAppModeSwitch'

/* 
 * [PRESENTATION LAYER COMPONENTS]
 * - AppLayout: 화면 최상단 뷰 레이아웃 그리드 컨테이너.
 * - AppProvider: 리액트 Context API 루트 전송 노드.
 */

import { safeJsonParse } from './utils/safeJson'
import { AppLayout } from './components/layout/AppLayout'
import { AppProvider } from './contexts/AppContext'

const { setBrowserZoom } = useProcessStore.getState()

/**
 * 전역 협업 마우스 포인터 및 텍스트 커서 색상 팔레트.
 * INVARIANT: 동적으로 접속하는 Peer 들에게 일관적인 고유 식별 색상을 분배하기 위해 7가지 팔레트로 제한함.
 */
const COLLAB_COLORS = ['#a855f7', '#06b6d4', '#ec4899', '#10b981', '#f59e0b', '#3b82f6', '#f43f5e']
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `randomColor`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const randomColor = ...` 형태로 안전 캐싱 후 가공 기동.
       */
const randomColor = COLLAB_COLORS[Math.floor(Math.random() * COLLAB_COLORS.length)]
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `randomUsername`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const randomUsername = ...` 형태로 안전 캐싱 후 가공 기동.
       */
const randomUsername = `User_${Math.random().toString(36).substring(2, 7).toUpperCase()}`

/**
 * @component App
 * @description 워크스테이션 렌더러의 최상위 Composition Root 컴포넌트.
 * 외부 상태 및 도메인 전용 훅들을 하나의 단일 리액트 컴포넌트 컨텍스트 내에서 조립 및 구동한다.
 */
import { useBackgroundInit } from './stores/useBackgroundInit'

export default function App() {
  useBackgroundInit()
  
  /* 
   * [ADR - React Local State vs Zustand Store]
   * - documentId: 현재 열려있는 주 문서의 고유 식별자. 로컬 세션 종속.
   * - username: 협업 피어들에게 공개되는 로컬 유저 닉네임.
   * - userColor: Yjs 텍스트 캐럿 및 실시간 포인터 식별 컬러.
   * - editor: BlockNote 에디터 인스턴스 참조 보존 상태.
   * - editorMode: 에디터의 마운트 뷰 상태(welcome/edit/preview).
   * - serverPort: 로컬 협업 서버 바인딩용 포트.
   * - serverHost: 로컬 협업 서버 타깃 호스트.
   * - useLocalServer: 로컬 협업 서버 활성화 옵션.
   */
  const [documentId, setDocumentId] = useState('default-doc')
  const [username, setUsername] = useState(randomUsername)
  const [userColor, setUserColor] = useState(randomColor)
  const [editor, setEditor] = useState<AppEditor | null>(null)
  const [splitEditor, setSplitEditor] = useState<AppEditor | null>(null)
  const [editorMode, setEditorMode] = useState<EditorMode>('welcome')
  const [serverPort, setServerPort] = useState(1234)
  const [serverHost, setServerHost] = useState('localhost')
  const [useLocalServer, setUseLocalServer] = useState(true)

  /**
   * [CONTRACT - Workspace Store Subscription]
   * - filePath: 현재 작업 중인 물리 파일 경로.
   * - setFilePath: 파일 경로 변경 세터.
   * - currentContent: 실시간 마크다운 문자열 버퍼.
   * - setCurrentContent: 콘텐츠 문자열 갱신 세터.
   * - appendContent: 에디터 끝부분에 내용을 덧붙이는 함수.
   * - originalContent: 변경 내역(isDirty) 비교를 위한 최초 로드/저장 시점 원본 내용.
   * - setOriginalContent: 원본 내용 세터.
   * - lastSavedTime: 마지막 자동 저장 또는 수동 저장 타임스태프.
   * - setLastSavedTime: 타임스탬프 세터.
   * - fileOpenMode: 파일 열기 모드 플래그 (tab/append/replace).
   * - updateActiveTab: 탭 문서 정보 동적 업데이트 콜백.
   * - activeTabId: 현재 활성화된 탭 노드의 고유 키.
   * - setSelectedText: 에디터 내 드래그 선택된 텍스트 보존 세터.
   * - setActiveBlockId: 포커싱된 에디터 블록 노드 ID 갱신 세터.
   * - taggedBlocks: 사용자가 AI 지시를 위해 태그 지정(Cmd+T)한 블록 메타 리스트.
   * - setTaggedBlocks: 태그 블록 리스트 갱신 세터.
   * - setSelectedSnapshot: 비교(Diff) 대상 마크다운 스냅샷 상태 갱신 세터.
   */
  const {
    filePath, setFilePath, currentContent, setCurrentContent, appendContent,
    originalContent, setOriginalContent, lastSavedTime, setLastSavedTime,
    fileOpenMode, updateActiveTab, activeTabId, setSelectedText, setActiveBlockId,
    taggedBlocks, setTaggedBlocks, setSelectedSnapshot, isSplitView
  } = useWorkspaceStore()

  /**
   * [DOWNSTREAM DEPENDENCY - Collaboration Adapter States]
   * - ydoc: 실시간 변경 정합성을 보장하는 CRDT 공유 문서 인스턴스.
   * - provider: WebRTC/WebSocket 피어 연결 제공자.
   * - peers: 현재 문서 편집에 접속한 모든 피어 상태 리스트.
   * - serverRunning: 로컬 협업 브릿지 서버의 가동 여부.
   * - isConnected: 협업 세션 연결 완료 플래그.
   * - toggleLocalServer: 협업 엔진 기동 및 중지 API.
   * - handleMouseMove: 피어 포인터 위치 공유 콜백.
   * - updateDragSelection: 드래그 텍스트 범위 실시간 동기화.
   * - updateBlockHighlight: 특정 블록 포커싱 하이라이트 동동 동기화.
   * - editorContainerRef: 에디터 렌더링 DOM 래퍼 엘리먼트 참조값.
   * - isActive: 현재 협업 방이 개설 및 동작 중인지 플래그.
   * - collaborationLink: 다른 피어들을 초대하기 위한 공유 주소.
   */
  const {
    ydoc, provider, peers, serverRunning,
    isConnected, toggleLocalServer, handleMouseMove,
    updateDragSelection, updateBlockHighlight, editorContainerRef,
    isActive, collaborationLink,
  } = useCollaboration(documentId, username, userColor, 1234, 'localhost', true)

  /** 
   * [HISTORY ENGINE SYSTEM]
   * - snapshots: 데이터베이스에 영구 보존된 자동/수동 백업 스냅샷 리스트.
   * - createSnapshot: 현 문서의 상태를 로컬 저장소 스냅샷으로 저장.
   * - deleteSnapshot: 특정 스냅샷 삭제.
   * - getLineDiff: 스냅샷과 실시간 문서의 줄 단위 차이 계산기.
   */
  const { snapshots, createSnapshot, deleteSnapshot, getLineDiff } = useHistory(documentId)

  /** [SPLIT VIEW SYNCHRONIZATION] */
  useEffect(() => {
    if (isSplitView && !splitEditor) {
      import('@blocknote/core').then(({ BlockNoteEditor }) => {
        import('./editor/amevaBlockSchema').then(({ amevaSchema }) => {
          const customDictionary = {
            slash_menu: { jupyter: { title: 'Jupyter Code', aliases: ['jupyter', 'code'], group: 'AMEVA' } }
          }
          const editor2 = BlockNoteEditor.create({
            schema: amevaSchema,
            dictionary: customDictionary as any,
            collaboration: isActive ? {
              provider,
              fragment: ydoc.getXmlFragment('document-store'),
              user: { name: username + " (Split)", color: '#06b6d4' }
            } : undefined
          })
          setSplitEditor(editor2 as AppEditor)
        })
      })
    } else if (!isSplitView && splitEditor) {
      setSplitEditor(null)
    }
  }, [isSplitView, splitEditor, provider, ydoc, isActive, username])

  /** 
   * [FILE I/O ACTIONS]
   */
  const {
    loadMarkdownIntoEditor, appendMarkdownIntoEditor, openFileInTab,
    handleStartNewDocument, handleOpenFile, handleSaveFile, handleSaveAsFile
  } = useAppFileOperations(editor, setEditorMode, createSnapshot)

  /** AI 편집 영역 패치 바인딩 */
  const { handleScrollToBlock } = useAppAISuggestions(editor)

  /** 문서 탭 조작기 */
  const { handleNewTab } = useAppTabs(
    editor, filePath, setFilePath, currentContent, setCurrentContent,
    originalContent, setOriginalContent, lastSavedTime, setLastSavedTime
  )

  /** 파일 내보내기 조율 훅 */
  const { handleExport } = useAppExport(editor)

  /**
   * [ADR - useShallow Store Selector mapping]
   * - showModelHub: 로컬 LLM 기동을 위한 모델 설치 모달 노출 여부.
   * - showAIPanel: AI 사이드바 노출 제어 플래그.
   * - setShowAIPanel: AI 사이드바 노출 세터.
   * - toggleAIPanel: AI 사이드바 개폐 토글 콜백.
   * - activeRightTab: 우측 탭 스트립 내 활성 탭 (ai/outline/plugins).
   * - setActiveRightTab: 우측 탭 설정 세터.
   * - showSidebar: 좌측 문서/피어 사이드바 노출 제어 플래그.
   * - setShowSidebar: 좌측 사이드바 노출 세터.
   * - showStatusBar: 하단 스태터스 바 노출 여부.
   * - toastMessage: 토스트 알림으로 렌더링될 메세지 버퍼.
   * - showFindReplace: 에디터 찾기/바꾸기 UI 활성화 플래그.
   * - setShowFindReplace: 찾기/바꾸기 노출 세터.
   * - findReplaceMode: 찾기/바꾸기 탭 모드 설정.
   * - isChatFloating: 협업 메신저 창의 플로팅 여부 플래그.
   * - setIsDiffOpen: 스냅샷 비교 창(DiffModal) 활성 제어.
   * - setHasChatUnread: 읽지 않은 메시지 뱃지 갱신 세터.
   */
  const {
    showModelHub,
    showAIPanel, setShowAIPanel, toggleAIPanel, activeRightTab, setActiveRightTab,
    showSidebar, setShowSidebar, showStatusBar,
    toastMessage, showFindReplace, setShowFindReplace,
    findReplaceMode, isChatFloating,
    setIsDiffOpen, setHasChatUnread
  } = useUIStore(useShallow((s) => ({
    showModelHub: s.showModelHub,
    showAIPanel: s.showAIPanel,
    setShowAIPanel: s.setShowAIPanel,
    toggleAIPanel: s.toggleAIPanel,
    activeRightTab: s.activeRightTab,
    setActiveRightTab: s.setActiveRightTab,
    showSidebar: s.showSidebar,
    setShowSidebar: s.setShowSidebar,
    showStatusBar: s.showStatusBar,
    toastMessage: s.toastMessage,
    showFindReplace: s.showFindReplace,
    setShowFindReplace: s.setShowFindReplace,
    findReplaceMode: s.findReplaceMode,
    isChatFloating: s.isChatFloating,
    setIsDiffOpen: s.setIsDiffOpen,
    setHasChatUnread: s.setHasChatUnread
  })))

  /**
   * [ZUSTAND PROCESS STORE SUBSCRIPTION]
   * - isProPlan: 프로 요금제 활성화 여부.
   * - setIsProPlan: 플랜 변경 세터.
   * - mcpServersState: 런타임에 로드된 MCP 서버 인스턴스 정보.
   * - setMcpServersState: MCP 서버 목록 정보 동기화 세터.
   * - editorZoom: 마크다운 에디터 렌더링 배율 값.
   */
  const {
    mcpServersState, setMcpServersState,
    editorZoom
  } = useProcessStore()

  /** 전역 설정 상태 정보 로드 및 IPC 세터 바인딩 */
  const {
    settings, handleUpdateSettings, handleInstallPlugin, handleUninstallPlugin,
    handleOpenGithub, handleCloseApp, handleToggleFullscreen,
    handleZoomIn, handleZoomOut, handleZoomReset,
  } = useAppSettingsManager(activeRightTab, setActiveRightTab)

  /** 최초 부팅 시 플러그인 구동 */
  const { isSidebarReady, isAIPanelReady } = useAppBootstrap(settings, handleInstallPlugin)

  /** 에디터 마운트 초기 문서 버퍼 삽입 조율 */
  const { DEFAULT_WELCOME_TEXT } = useAppEditorInit({
    ydoc, provider, isActive, username, userColor, setEditor, setCurrentContent
  })

  /** 웹/앱 연동을 위한 전역 어댑터 노출 */
  useAppGlobalApi({
    editor, currentContent, setCurrentContent, appendContent, setShowAIPanel, setActiveRightTab
  })

  /** 에디터 문서 수정 시 전역 동기화 및 자동 백업 구동 */
  useAppEditorSync({
    editor, setActiveBlockId, setCurrentContent, currentContent,
    autoSnapshot: settings.autoSnapshot, createSnapshot
  })

  /** 화면 모드 조율기 */
  const { handleRollback, handleSwitchMode, handleStartWelcomeEdit } = useAppModeSwitch({
    editor, editorMode, setEditorMode, currentContent, setCurrentContent,
    setOriginalContent, loadMarkdownIntoEditor, DEFAULT_WELCOME_TEXT
  })

  /**
   * [SIDE EFFECT INTENTIONAL - IPC File Loader]
   * - Electron 주 프로세스로부터 OS 파일 열기 신호 수신 시,
   *   fileOpenMode 속성에 따라 분기 처리하여 에디터 캔버스에 내용을 주입한다.
   */
  useAppIpcBridge(useCallback(async (file) => {
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `!editor`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (!editor)` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
    if (!editor) return
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `fileOpenMode === 'append'`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (fileOpenMode === 'append')` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
    if (fileOpenMode === 'append') {
      await appendMarkdownIntoEditor(editor, file.content, file.filePath.split(/[\\/]/).pop() || '파일', file.isBinary, file.filePath)
    } else if (fileOpenMode === 'tab') {
      await openFileInTab(editor, file.content, file.filePath, file.isBinary)
    } else {
      setFilePath(file.filePath)
      await loadMarkdownIntoEditor(editor, file.content, file.isBinary, file.filePath)
    }
  }, [editor, fileOpenMode, appendMarkdownIntoEditor, openFileInTab, loadMarkdownIntoEditor, setFilePath]))

  /**
   * [CONTRACT - Drag Resize Constants]
   * - 유저 조정한 레이아웃 너비 캐시를 복원하여 사이드바 및 AI 패널 렌더링 스타일의 절댓값으로 공급한다.
   */
  const { width: sidebarWidth, isDragging: isSidebarDragging, handleMouseDown: handleSidebarResizeStart } = usePanelResize({
    storageKey: 'sidebar', defaultWidth: 280, minWidth: 160, maxWidth: 520, direction: 'right'
  })
  const maxAIPanelWidth = Math.min(
    window.innerWidth * 0.5,
    window.innerWidth - (showSidebar ? sidebarWidth : 0) - 40 - 6
  )

  const { width: aiPanelWidth, isDragging: isAIPanelDragging, handleMouseDown: handleAIPanelResizeStart, setWidth: setAIPanelWidth } = usePanelResize({
    storageKey: 'ai-panel', defaultWidth: 320, minWidth: 220, maxWidth: maxAIPanelWidth, direction: 'left'
  })

  const handleAIPanelDoubleClick = useCallback(() => {
    if (Math.abs(aiPanelWidth - maxAIPanelWidth) < 20) {
      setAIPanelWidth(320)
    } else {
      setAIPanelWidth(maxAIPanelWidth)
    }
  }, [aiPanelWidth, maxAIPanelWidth, setAIPanelWidth])

  // Keep AI Panel width clamped within maxAIPanelWidth at all times to prevent overlapping left sidebar/edges
  useEffect(() => {
    if (aiPanelWidth > maxAIPanelWidth) {
      setAIPanelWidth(maxAIPanelWidth)
    }
  }, [maxAIPanelWidth, aiPanelWidth, setAIPanelWidth])

  /**
   * [SIDE EFFECT - Active Tab Sync]
   * - 탭 브라우징 시, 현재 수정 중인 임시 버퍼 정보를 활성화된 탭 노드 상태 정보에 실시간 역매핑한다.
   */
  useEffect(() => {
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `fileOpenMode === 'tab' && activeTabId`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (fileOpenMode === 'tab' && activeTabId)` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
    if (fileOpenMode === 'tab' && activeTabId) {
      updateActiveTab({ content: currentContent })
    }
  }, [currentContent, activeTabId, fileOpenMode, updateActiveTab])

  /** MCP 연결 정보 복원 및 플랜 정보 갱신 */
  const refreshMcpServers = () => {
    try {
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `stored`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const stored = ...` 형태로 안전 캐싱 후 가공 기동.
       */
      const stored = localStorage.getItem('mcp-servers-config')
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `stored) setMcpServersState(JSON.parse(stored)`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (stored) setMcpServersState(JSON.parse(stored))` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
      if (stored) setMcpServersState(safeJsonParse(stored, []))
      } catch {}
  }

  /** Yjs 협업 메신저 메시지 스트림 관리 */
  const { messages: chatMessages, sendMessage: sendChatMessage, clearMessages: clearChatMessages } = useChat(
    ydoc, provider, username, userColor, serverRunning || isConnected
  )

  /**
   * [SIDE EFFECT - Unread Badge Trigger]
   * - 채팅창이 가려져 있거나 포커스되지 않은 상태에서 다른 사용자의 메시지가 유입되면 읽지 않음(Badge) 표시를 활성화한다.
   */
  useEffect(() => {
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `chatMessages.length === 0`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (chatMessages.length === 0)` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
    if (chatMessages.length === 0) return
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `lastMsg`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const lastMsg = ...` 형태로 안전 캐싱 후 가공 기동.
       */
    const lastMsg = chatMessages[chatMessages.length - 1]
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `lastMsg.author !== username && (isChatFloating || activeTabId !== 'chat')`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (lastMsg.author !== username && (isChatFloating || activeTabId !== 'chat'))` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
    if (lastMsg.author !== username && (isChatFloating || activeTabId !== 'chat')) {
      setHasChatUnread(true)
    }
  }, [chatMessages, isChatFloating, activeTabId, username, setHasChatUnread])

  /** 스냅샷 비교 모달 로드 */
  const handleSelectSnapshotForDiff = (snapshot: any) => {
    setSelectedSnapshot(snapshot)
    setIsDiffOpen(true)
  }

  /**
   * [GLOBAL KEYBOARD SHORTCUTS]
   * - Ctrl+S, Ctrl+O, Zoom In/Out, AI 토글 등 핵심 액셀러레이터를 전역 리스너에 등록한다.
   */
  useGlobalShortcuts({
    settings, editor, filePath, currentContent, editorMode,
    onSave: handleSaveFile, onOpen: handleOpenFile, 
    onNewTab: () => {
      if (fileOpenMode === 'replace' || fileOpenMode === 'append') {
        useUIStore.getState().setIsNewDocumentConfirmOpen(true);
      } else if (fileOpenMode === 'tab') {
        handleNewTab();
        if (editorMode === 'welcome') {
          setEditorMode('edit');
        }
      }
    },
    onToggleAI: toggleAIPanel,
    onToggleMode: () => { setEditorMode(editorMode === 'edit' ? 'preview' : 'edit') },
    onZoomIn: handleZoomIn, onZoomOut: handleZoomOut, onZoomReset: handleZoomReset
  })

  return (
    <AppProvider value={{
      settings, handleUpdateSettings, handleInstallPlugin, handleUninstallPlugin,
      handleOpenGithub, handleCloseApp, handleToggleFullscreen, handleZoomIn, handleZoomOut, handleZoomReset,
      documentId, setDocumentId, editor, splitEditor, editorMode, setEditorMode, handleSwitchMode, handleStartWelcomeEdit, handleStartNewDocument,
      loadMarkdownIntoEditor,
      handleOpenFile, handleSaveFile, handleSaveAsFile, handleExport,
      snapshots, createSnapshot, deleteSnapshot, handleSelectSnapshotForDiff, handleRollback, getLineDiff,
      peers, serverRunning, serverPort, setServerPort, serverHost, setServerHost,
      useLocalServer, setUseLocalServer, toggleLocalServer, collaborationLink, isConnected,
      username, setUsername, userColor, setUserColor,
      chatMessages, sendChatMessage, clearChatMessages,
      mcpServers: mcpServersState,
      refreshMcpServers
    }}>
      <AppLayout
        settings={settings}
        showStatusBar={showStatusBar}
        showSidebar={showSidebar}
        setShowSidebar={setShowSidebar}
        sidebarWidth={sidebarWidth}
        isSidebarReady={isSidebarReady}
        editor={editor}
        editorContainerRef={editorContainerRef}
        
        
        
        
        
        
        
        handleSidebarResizeStart={handleSidebarResizeStart}
        isSidebarDragging={isSidebarDragging}
        editorZoom={editorZoom}
        handleMouseMove={handleMouseMove}
        updateDragSelection={updateDragSelection}
        updateBlockHighlight={updateBlockHighlight}
        setSelectedText={setSelectedText}
        taggedBlocks={taggedBlocks}
        setTaggedBlocks={setTaggedBlocks}
        isChatFloating={isChatFloating}
        toastMessage={toastMessage}
        showFindReplace={showFindReplace}
        setShowFindReplace={setShowFindReplace}
        handleScrollToBlock={handleScrollToBlock}
        findReplaceMode={findReplaceMode}
      />
      <PwaReloadPrompt />
    </AppProvider>
  )
}

/**
 * ============================================================================
 * FUTURE DEVELOPMENT GUIDE (AI Agent Instruction Layer)
 * ============================================================================
 * 1. 신규 전역 다이얼로그 혹은 플로우 팝업을 추가해야 하는 경우:
 *    - 본 파일 App.tsx에 직접 모달 렌더링 태그나 UI 상태 코드를 추가하지 말 것.
 *    - 대신, `src/renderer/components/layout/ModalManager.tsx`에 신규 모달 매니징 사양을 추가하고,
 *      `useUIStore`를 통해 트리거할 것.
 * 
 * 2. 특정 단축키 매핑 규칙을 새로 할당하거나 수정해야 하는 경우:
 *    - `src/renderer/hooks/app/useGlobalShortcuts.ts` 내부의 단축키 리스너 바인딩 스펙에 추가할 것.
 * 
 * 3. 렌더링 성능 이슈 발생 시 최우선 조사 포인트:
 *    - App.tsx의 Context `AppProvider` value가 매 렌더링마다 불필요한 객체 인스턴스를 재생성하고 있는지 조사할 것.
 *    - Zustand 스토어 구독 시 `useShallow`를 누락하여 원치 않는 리렌더링 폭풍이 일어나는지 확인할 것.
 * 
 * 4. 모듈 쪼개기 기준:
 *    - App.tsx가 250라인을 넘거나 useEffect가 본문 내에 추가로 2개 이상 유입될 시,
 *      오케스트레이션 훅 `src/renderer/hooks/app/useAppOrchestration.ts`으로 결합 제어권을 완전히 분리 추출할 것.
 * ============================================================================
 */

