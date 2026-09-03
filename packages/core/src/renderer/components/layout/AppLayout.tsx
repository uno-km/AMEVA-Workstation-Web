/**
 * @file AppLayout.tsx
 * @system AMEVA OS Desktop Workstation - Client Renderer
 * @location src/renderer/components/layout/AppLayout.tsx
 * @role Root UI Layout & Presentational View Container (Container Component)
 * 
 * [책임 범위 - RESPONSIBILITY]
 * - 전체 어플리케이션의 그리드 레이아웃 구조(MenuBar, Sidebar, MarkdownEditor, AIPanel, RightTabStrip, StatusBar)를 설계 및 배치한다.
 * - 드래그 앤 드롭을 통한 패널 너비 변경(사이드바, AI 패널)의 동적인 CSS width 스타일 변수를 마운트/패치한다.
 * - 토스트 메시지 알림바 및 검색 바(FindReplaceBar) 등 플로팅 보조 UI들의 노출 영역을 격리 렌더링한다.
 * 
 * [책임이 아닌 것 - NON-RESPONSIBILITY]
 * - 비즈니스 상태 관리 및 액션 핸들링 (부모 App.tsx 및 Zustand 스토어들이 상태 제어권을 가짐).
 * - 단축키 매핑이나 로컬 파일 저장 로직 소유 금지 (`MUST NOT possess business logic`).
 * 
 * [절대 깨면 안 되는 계약 - CONTRACT]
 * - MUST: Presentational Component 성격을 엄격히 보존하기 위해, 이 파일 내에서 직접 API를 쏘거나 Zustand 스토어 세터를 통해 비즈니스 정책을 결정하지 마라.
 * - MUST NOT bypass transition control: 드래그 중에는 패널 리사이징의 반응 속도 극대화를 위해 `transition: 'none'`을 보장해야 하며,
 *   유휴 상태로 복귀할 때는 부드러운 애니메이션(`transition: 'width 0.25s cubic-bezier(...)'`)을 유지할 것.
 
 * [소비처 - CONSUMERS / USAGE CONTEXT]
 * - 소비처 A (src/renderer/AppLayout.tsx): 레이아웃 그리드 내부 또는 플로팅 레이어 영역 내에서 그리기로 소비.
 * - 소비처 B (src/renderer/App.tsx): 전역 모달 매니저 및 뷰포트 상태 스위칭에 따라 동적 마운트되어 소비.
 */

/* 
 * [IMPORT SEGMENTATION & CONTRACTS]
 * - React: 레이아웃 뷰 렌더링용 핵심 React API.
 */
import React from 'react'
import { useUIStore } from '../../stores/useUIStore'
import { useWorkspaceStore } from '../../stores/useWorkspaceStore'

/* 
 * [LUCIDE ICONS]
 * - PanelLeft: 사이드바 개폐 단추 아이콘.
 * - Sparkles: 토스트 메시지 알림 효과 아이콘.
 */
import { PanelLeft, Sparkles } from 'lucide-react'

/* 
 * [SUB COMPONENT PARTS]
 * - Sidebar: 좌측 파일 트리 및 협업 참여실 뷰.
 * - MarkdownEditor: WYSIWYG 블록노트 마크다운 편집부 뷰.
 * - StatusBar: 하단 성능 지표 및 환경 수치 표시바.
 * - MenuBar: 최상단 타이틀바 아래 풀다운 메뉴바.
 * - AIPanel: 우측 로컬 AI 대화형 비서 패널.
 * - Minimap: 에디터 단락 헤더 네비게이션 아웃라인 미니맵.
 * - RightTabStrip: 우측 사이드 툴바 전환 아이콘 목록.
 * - ResizeHandle: 사이드 패널 마우스 그랩 크기 조절선.
 * - FloatingChat: 협업 참여자 간 플로팅 메신저 대화방.
 * - AILogDrawer: 하단 슬라이딩 AI WebGPU 추론 상세 모니터 콘솔.
 * - FindReplaceBar: 텍스트 찾기/바꾸기 플로팅 툴바.
 * - FloatingPiPVideo: PIP 화면 띄우기 비디오 오버레이.
 * - ModalManager: 전역 공용 모달(설정, 정보창 등) 렌더링 라우터.
 */
import { StatusBar } from '../StatusBar'
import { MenuBar } from '../MenuBar'
import { RightTabStrip } from '../RightTabStrip'
import { ResizeHandle } from '../ResizeHandle'
import { FloatingChat } from '../FloatingChat'

import { FindReplaceBar } from '../FindReplaceBar'
import { FloatingPiPVideo } from './FloatingPiPVideo'
import { ModalManager } from './ModalManager'
import { PluginTabPanel } from './PluginTabPanel'
import { ChatPanel } from '../ChatPanel'

/* 
 * [DYNAMIC COMPONENT IMPORTS - PERFORMANCE OPTIMIZATION]
 * - Rationale: Sidebar와 AIPanel은 협업용 소켓 모듈 및 로컬 AI 추론 엔진 등 무거운 하위 디펜던시들을 다수 import하고 있습니다.
 * - 앱 최초 마운팅 시의 번들 해석 및 자바스크립트 엔진 평가 blocking을 방지하여 에디터 화면의 노출 속도를 가속화하기 위해 lazy 로딩을 도입합니다.
 */
const Sidebar = React.lazy(() => import('../Sidebar').then(m => ({ default: m.Sidebar })))
const MarkdownEditor = React.lazy(() => import('../MarkdownEditor').then(m => ({ default: m.MarkdownEditor })))
const Minimap = React.lazy(() => import('../Minimap').then(m => ({ default: m.Minimap })))


/* 
 * [TYPES & STYLES INJECTIONS]
 * - AppEditor: 블록노트 커스텀 에디터 규격.
 * - useNatureThemeColors: 다크/네이처 테마별 CSS 테마 변수 실시간 적용기.
 * - GlobalDownloadProgress: GGUF 파일 원격 설치용 하단 진행바.
 * - useDownloadManager: 모델 다운로드 큐 정보 감청 매니저.
 */
import { type AmevaEditor as AppEditor } from '../../editor/amevaBlockSchema'
import { useNatureThemeColors } from '../../hooks/app/useNatureThemeColors'
import { GlobalDownloadProgress } from '../download/GlobalDownloadProgress'
import { useDownloadManager } from '../../hooks/app/useDownloadManager'

/**
 * @interface AppLayoutProps
 * @description 부모 Composition Root(App.tsx)로부터 주입받는 레이아웃 조립용 프로퍼티 정의.
 */
export interface AppLayoutProps {
  settings: any
  showStatusBar: boolean
  showSidebar: boolean
  setShowSidebar: (show: boolean) => void
  sidebarWidth: number
  isSidebarReady: boolean
  editor: AppEditor | null
  editorContainerRef: React.RefObject<HTMLDivElement | null>
  
  
  
  
  
  
  
  handleSidebarResizeStart: (e: React.MouseEvent) => void
  isSidebarDragging: boolean
  editorZoom: number
  handleMouseMove: (e: React.MouseEvent) => void
  updateDragSelection: any
  updateBlockHighlight: any
  setSelectedText: (text: string) => void
  taggedBlocks: any[]
  setTaggedBlocks: (blocks: any[]) => void
  isChatFloating: boolean
  toastMessage: string | null
  showFindReplace: boolean
  setShowFindReplace: (show: boolean) => void
  handleScrollToBlock: (id: string) => void
  findReplaceMode: 'find' | 'replace'
}

/**
 * @component AppLayout
 * @description 워크스테이션 렌더러의 최상위 그리드 레이아웃 구조를 렌더링하는 컨테이너 컴포넌트.
 */
export const AppLayout: React.FC<AppLayoutProps> = (props) => {
  /*
   * [INVARIANT - UI Sliding Log Drawer State]
   * - isLogsExpanded: 하단 AI 추론 로그 창의 확장/축소 높이 조절 여부.
   */
  const [isLogsExpanded, setIsLogsExpanded] = React.useState(false)

  // 주입받은 프롭스 비구조화 해제
  const {
    settings, showStatusBar, showSidebar, setShowSidebar, sidebarWidth, isSidebarReady,
    editor, editorContainerRef, 
    
    handleSidebarResizeStart, isSidebarDragging, editorZoom,
    handleMouseMove, updateDragSelection, updateBlockHighlight, setSelectedText,
    taggedBlocks, setTaggedBlocks, isChatFloating, toastMessage, showFindReplace,
    setShowFindReplace, handleScrollToBlock, findReplaceMode
  } = props

  // [FIX-PANEL-001] UIStore에서 실제 패널 상태값 읽기 (이전엔 강제 false 고정이었음)
  const {
    showAIPanel,
    activeRightTab,
    setShowAIPanel,
  } = useUIStore()

  const isSplitView = useWorkspaceStore(s => s.isSplitView)

  // AI 패널 너비: 설정에서 저장된 값 사용, 기본 320px
  const [aiPanelWidth, setAIPanelWidth] = React.useState<number>(320)
  const [isAIPanelDragging, setIsAIPanelDragging] = React.useState(false)
  const isAIPanelReady = showAIPanel
  const showModelHub = false
  const AILogDrawer = (_props: any) => null

  const handleAIPanelResizeStart = (e: React.MouseEvent) => {
    e.preventDefault()
    setIsAIPanelDragging(true)
    const startX = e.clientX
    const startW = aiPanelWidth
    const onMove = (ev: MouseEvent) => {
      const delta = startX - ev.clientX
      setAIPanelWidth(Math.max(220, Math.min(700, startW + delta)))
    }
    const onUp = () => {
      setIsAIPanelDragging(false)
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }
  const handleAIPanelDoubleClick = () => setAIPanelWidth(320)

  // 플러그인 탭 패널 (마켓플레이스에서 설치된 플러그인 탭 클릭 시 렌더링)
  const AI_TAB_IDS = ['ai']
  const isPluginTab = showAIPanel && !AI_TAB_IDS.includes(activeRightTab || '')

  // AIPanel: ChatPanel 직접 래핑 (ai 탭 전용)
  const AIPanel = React.useCallback(() => (
    <PluginTabPanel tabId="ai" />
  ), [])

  // 테마 변수 실시간 HTML 주입기 가동
  useNatureThemeColors(settings.theme)

  // 원격 다운로드 매니징 감청 기동
  useDownloadManager()

  const isOverlayMode = showAIPanel && aiPanelWidth > 450;

  return (
    <div
      data-theme={settings.theme}
      style={{
        display: 'flex', flexDirection: 'column',
        width: '100vw', height: '100vh',
        backgroundColor: 'var(--bg-deep)', overflow: 'hidden',
      }}
    >
      {/* 최상단 파일/설정 시스템 풀다운 메뉴바 (통합 타이틀바로 기능) */}
      <MenuBar />

      {/* 사이드바, 에디터 및 우측 AI 패널을 수평으로 나열하는 메인 레이아웃 행 */}
      <div className="main-layout-row">
        
        {/* 
         * [SIDEBAR LEFTPANEL TRIGGER]
         * - 사이드바가 완전히 닫힌 경우, 화면 좌측 상단에 팝업하여 다시 펼칠 수 있도록 고유 제어 단추를 플로팅 렌더링한다.
         */
        }
        {!showSidebar && (
          <button
            onClick={() => setShowSidebar(true)}
            style={{
              position: 'absolute',
              left: '10px',
              top: '12px', width: '28px', height: '28px',
              borderRadius: '6px', background: 'var(--bg-glass)',
              border: '1px solid var(--border-glow)', color: 'var(--text-main)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', zIndex: 102,
              boxShadow: '0 4px 10px rgba(0,0,0,0.3)',
            }}
            title="사이드바 열기"
          >
            <PanelLeft size={16} />
          </button>
        )}

        {/* 
         * [RESIZABLE SIDEBAR CONTAINER]
         * - 드래그 너비에 맞추어 absolute width 스타일이 강제 매핑된다.
         * - INVARIANT: 사이드바 개폐 시 뚝 끊기는 연출을 배제하기 위해 cubic-bezier 가속 트랜지션을 적용함.
         */
        }
        <div
          style={{
            width: showSidebar ? sidebarWidth : 0,
            opacity: showSidebar ? 1 : 0,
            flexShrink: 0,
            flexGrow: 0,
            height: '100%',
            position: 'relative',
            overflow: 'hidden',
            transition: 'width 0.4s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s ease',
          }}
        >
          {isSidebarReady ? (
            <React.Suspense
              fallback={
                <div style={{ padding: '24px', color: 'var(--text-muted)', fontSize: '11px', display: 'flex', flexDirection: 'column', gap: '14px', background: 'var(--bg-deep)', height: '100%', borderRight: '1px solid var(--border-muted)', userSelect: 'none' }}>
                  <div style={{ height: '24px', background: 'rgba(59, 130, 246,0.08)', borderRadius: '6px', width: '70%', opacity: 0.5 }} />
                  <div style={{ height: '32px', background: 'rgba(255,255,255,0.03)', borderRadius: '6px', opacity: 0.5 }} />
                  <div style={{ flex: 1, background: 'rgba(255,255,255,0.01)', borderRadius: '8px', opacity: 0.3 }} />
                </div>
              }
            >
              <Sidebar />
            </React.Suspense>
          ) : (
            // 로딩 스켈레톤 가이드 (성능 상 visual jump를 없애기 위함)
            <div style={{ padding: '24px', color: 'var(--text-muted)', fontSize: '11px', display: 'flex', flexDirection: 'column', gap: '14px', background: 'var(--bg-deep)', height: '100%', borderRight: '1px solid var(--border-muted)', userSelect: 'none' }}>
              <div style={{ height: '24px', background: 'rgba(59, 130, 246,0.08)', borderRadius: '6px', width: '70%', opacity: 0.5 }} />
              <div style={{ height: '32px', background: 'rgba(255,255,255,0.03)', borderRadius: '6px', opacity: 0.5 }} />
              <div style={{ flex: 1, background: 'rgba(255,255,255,0.01)', borderRadius: '8px', opacity: 0.3 }} />
            </div>
          )}
          <ResizeHandle
            onMouseDown={handleSidebarResizeStart}
            isDragging={isSidebarDragging}
            placement="right"
          />
        </div>

        {/* 
         * [EDITOR INTERACTION LAYER & ZOOM WRAPPER]
         * - 윈도우 배율과 별도로 에디터 작업 영역만의 독립적인 화면 Zoom(1.0~2.0) 비율을 인라인 줌 속성으로 강제 주입함.
         * - WARNING: CSS zoom 속성을 쓰므로 내부 요소 100% 면적 대응을 위해 height를 역수로 계산하여 바인딩함 (`height: ${100/zoom}%`).
         */
        }
        <div
          className="editor-zoom-wrapper"
          data-focus-region="editor"
          style={{
            zoom: editorZoom,
            height: '100%',
            minHeight: '100%',
            position: 'relative',
            display: 'flex',
            flexDirection: 'row',
            width: '100%',
            willChange: 'transform',
            transform: 'translateZ(0)',
          }}
        >
          {/* PRIMARY EDITOR PANE */}
          <div style={{ flex: 1, position: 'relative', borderRight: isSplitView ? '1px solid var(--border-muted)' : 'none', minWidth: 0, height: '100%' }}>
            <React.Suspense fallback={<div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>에디터 로딩 중...</div>}>
              <MarkdownEditor
                onMouseMove={handleMouseMove}
                onSelectionChange={updateDragSelection}
                onBlockHighlight={updateBlockHighlight}
                editorContainerRef={editorContainerRef}
                onSelectedTextChange={setSelectedText}
                taggedBlocks={taggedBlocks}
                setTaggedBlocks={setTaggedBlocks}
              />
              {settings.showMinimap && (settings.installedPlugins || []).includes('minimap') && editor && (
                <Minimap
                  editor={editor}
                  editorContainerRef={editorContainerRef}
                  blocks={editor.document}
                />
              )}
            </React.Suspense>
          </div>

          {/* SPLIT (SECONDARY) EDITOR PANE */}
          {isSplitView && (
            <div style={{ flex: 1, position: 'relative', minWidth: 0, height: '100%' }}>
              <React.Suspense fallback={<div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>에디터 로딩 중...</div>}>
                <MarkdownEditor
                  isSplitViewInstance={true}
                  onMouseMove={handleMouseMove}
                  onSelectionChange={updateDragSelection}
                  onBlockHighlight={updateBlockHighlight}
                  editorContainerRef={editorContainerRef}
                  onSelectedTextChange={setSelectedText}
                  taggedBlocks={taggedBlocks}
                  setTaggedBlocks={setTaggedBlocks}
                />
              </React.Suspense>
            </div>
          )}

          <AILogDrawer 
            isExpanded={isLogsExpanded} 
            onToggle={() => setIsLogsExpanded(!isLogsExpanded)} 
          />
        </div>

        {/* 
         * [RESIZABLE AI PANEL CONTAINER]
         * - AI 패널의 드래그 조절 너비를 가둔다.
         * - WARNING: 패널 폭이 0 이하로 떨어질 때 내부 챗 리스트 자식 컴포넌트의 가로 배율 깨짐(visual clipping)을 막기 위해 
         *   반드시 `overflow: 'hidden'` 제약을 유지할 것.
         */
        }
        <div
          className="ai-panel-wrapper"
          data-focus-region="ai-panel"
          style={{
            position: isOverlayMode ? 'absolute' : 'relative',
            right: isOverlayMode ? '40px' : 'auto',
            top: isOverlayMode ? 0 : 'auto',
            bottom: isOverlayMode ? 0 : 'auto',
            zIndex: isOverlayMode ? 99 : 'auto',
            width: showAIPanel ? aiPanelWidth : 0,
            minWidth: 0,
            overflow: 'hidden',
            height: '100%',
            flexShrink: 0,
            backgroundColor: isOverlayMode ? 'var(--bg-deep)' : 'transparent',
            borderLeft: isOverlayMode ? '1px solid var(--border-muted)' : 'none',
            boxShadow: isOverlayMode ? '-8px 0 24px rgba(0, 0, 0, 0.45)' : 'none',
            transition: isAIPanelDragging ? 'none' : 'width 0.25s cubic-bezier(0.4, 0, 0.2, 1), right 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        >
          {showAIPanel && (
            <ResizeHandle
              onMouseDown={handleAIPanelResizeStart}
              isDragging={isAIPanelDragging}
              placement="left"
              onDoubleClick={handleAIPanelDoubleClick}
            />
          )}
          {isAIPanelReady ? (
            <React.Suspense
              fallback={
                <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-deep)', padding: '20px', borderLeft: '1px solid var(--border-muted)', userSelect: 'none' }}>
                  <div style={{ width: '24px', height: '24px', borderRadius: '50%', border: '2px solid var(--primary)', borderTopColor: 'transparent', animation: 'spin 1s linear infinite' }} />
                  <span style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '12px' }}>패널 준비 중...</span>
                </div>
              }
            >
              {/* [FIX] 탭 ID에 따라 패널 분기 렌더링 */}
              {isPluginTab
                ? <PluginTabPanel tabId={activeRightTab || ''} />
                : <AIPanel />
              }
            </React.Suspense>
          ) : null}
        </div>

        {/* 최우측 툴바 아이콘 스트립 */}
        <RightTabStrip />

      </div>

      {/* 하단 시스템 스태터스 바 */}
      {showStatusBar && (
        <StatusBar />
      )}

      {/* PIP 띄우기 비디오 오버레이 */}
      <FloatingPiPVideo />

      {/* 전역 모달 컨트롤 허브 */}
      <ModalManager />

      {/* 협업 플로팅 챗 모달 */}
      {isChatFloating && (
        <FloatingChat />
      )}

      {/* AI 모델 뷰 허브 */}
      {showModelHub && (!showAIPanel || !isAIPanelReady) && (
        <React.Suspense
          fallback={
            <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-deep)', padding: '20px', borderLeft: '1px solid var(--border-muted)', userSelect: 'none' }}>
              <div style={{ width: '24px', height: '24px', borderRadius: '50%', border: '2px solid var(--primary)', borderTopColor: 'transparent', animation: 'spin 1s linear infinite' }} />
              <span style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '12px' }}>AI 엔진 및 도구 준비 중...</span>
            </div>
          }
        >
          <AIPanel />
        </React.Suspense>
      )}

      {/* 
       * [GLOBAL SYSTEM TOAST NOTIFICATION]
       * - 저장 완료, 플러그인 로드 성공 등 핵심 라이프사이클 이벤트를 뷰 하단에 은은한 Glassmorphism 토스트로 일시 표출한다.
       */
      }
      {toastMessage && (
        <div style={{
          position: 'fixed',
          bottom: '46px',
          right: '20px',
          background: 'rgba(5, 5, 10, 0.85)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(6, 182, 212, 0.4)',
          borderRadius: '8px',
          padding: '10px 16px',
          color: '#fff',
          fontSize: '12.5px',
          fontWeight: 600,
          boxShadow: '0 8px 32px rgba(6, 182, 212, 0.15)',
          zIndex: 99999,
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          animation: 'slideUp 0.3s ease-out',
        }}>
          <Sparkles size={14} style={{ color: 'var(--secondary)' }} />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 하단 글로벌 모델 다운로드 상태창 */}
      <GlobalDownloadProgress />

      {/* 에디터 텍스트 찾기/바꾸기 컨트롤 도구 */}
      <FindReplaceBar
        isOpen={showFindReplace}
        onClose={() => setShowFindReplace(false)}
        editor={editor}
        onScrollToBlock={handleScrollToBlock}
        initialMode={findReplaceMode}
      />
    </div>
  )
}

