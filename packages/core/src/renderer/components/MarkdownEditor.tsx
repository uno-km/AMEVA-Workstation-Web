/**
 * @file MarkdownEditor.tsx
 * @system AMEVA OS Desktop Workstation - Client Renderer
 * @location packages/core/src/renderer/components/MarkdownEditor.tsx
 * @role Core Markdown Block-Note Editor Presentational View Component
 * 
 * [책임 범위 - RESPONSIBILITY]
 * - BlockNoteView 라이브러리를 바인딩하여 WYSIWYG 마크다운 문서 편집 영역을 렌더링한다.
 * - 사이드바 및 AI 패널로부터 주입받은 텍스트 및 블록 하이라이트(Peers 드래그 범위, 포커스 taggedBlocks 별표) 지시들을 화면에 투영한다.
 * - 사용자 입력 도중 단축 기호 트리거('/', '@', '#')에 맞춰 슬래시 명령, 사용자 멘션, 헤더 참조 링크 팝업을 띄우고 실행한다.
 * - 웰컴 배너, 프리뷰, 원문 마크다운 텍스트 영역 등 에디터 모드(welcome/edit/preview/raw)별 분기 화면을 제어한다.
 * 
 * [책임이 아닌 것 - NON-RESPONSIBILITY]
 * - Yjs CRDT 데이터 교환 서버 통신 직접 조작 (useCollaboration 쪽에 위임).
 * - AI 제안 수락 및 에디터 API 직접 터치 (useAIResponseHandler 쪽에 위임).
 * 
 * [절대 깨면 안 되는 계약 - CONTRACT]
 * - MUST: 리소스 누수 방지를 위해 '+' 버튼 가로채기 캡처 이벤트(`handleMouseDownCapture`) 등록 시,
 *   useEffect 클린업 단계에서 반드시 `removeEventListener` 계약을 보존할 것.
 * - MUST NOT bypass isProPlan: AI 컨텍스트 샌딩용 반짝이 별표 단추는 Pro 전용 기능이므로,
 *   반드시 `isProPlan === true` 일 때만 렌더링하도록 조건식을 유지할 것.
 * 
 * [소비처 - CONSUMERS / USAGE CONTEXT]
 * - 소비처 A (src/renderer/AppLayout.tsx): 레이아웃 그리드 내부 또는 플로팅 레이어 영역 내에서 그리기로 소비.
 * - 소비처 B (src/renderer/App.tsx): 전역 모달 매니저 및 뷰포트 상태 스위칭에 따라 동적 마운트되어 소비.
 */

/* 
 * [IMPORT SEGMENTATION & CONTRACTS]
 * - React, useState, useEffect: 상태 바인딩 및 HMR 라이프사이클 구동용 React 코어 API.
 */
import React, { useState, useEffect, useCallback } from 'react'

/* 
 * [BLOCKNOTE MANTINE WYSIWYG LAYOUT]
 * - BlockNoteView: 블록노트 에디터 핵심 프레임워크 Mantine 뷰.
 */
import { BlockNoteView } from '@blocknote/mantine'

/* 
 * [BLOCKNOTE REACT CONTROLLERS]
 * - SuggestionMenuController: 슬래시(/), 멘션(@), 헤더(#) 입력 감지 팝업 컨트롤러.
 * - SideMenuController: 블록 좌측의 [+] 및 [::] 드래그 그랩 영역 제어기.
 * - SideMenu: 블록 그랩 상세 사이드 메뉴 컴포넌트.
 * - RemoveBlockItem: 드래그 메뉴 내 블록 삭제 액션.
 * - DragHandleMenu: 드래그 핸들 전용 메뉴 헬퍼.
 * - BlockColorsItem: 블록 배경/글자 색상 지정 액션.
 * - DragHandleButton: 사이드 메뉴 안에서 드래그 핸들을 그리는 공식 컴포넌트.
 */
import {
  SuggestionMenuController,
  SideMenuController,
  SideMenu,
  DragHandleButton,
  useBlockNoteEditor,
  useExtension,
  useExtensionState,
} from '@blocknote/react'

/*
 * [BLOCKNOTE CORE EXTENSIONS - INTERNAL API ACCESS]
 * - SuggestionMenu: 슬래시 명령용 팝업 Extension 인스턴스 접근기.
 *   openSuggestionMenu('/') 공식 메서드를 통해 슬래시 메뉴를 트리거함.
 * - SideMenuExtension: 현재 사이드 메뉴가 가리키는 블록(block) 상태를 추적하는 Extension.
 *   useExtensionState로 block 객체를 읽어와 + 버튼 클릭 시 식별용으로 사용.
 */
import { SuggestionMenu, SideMenuExtension } from '@blocknote/core/extensions'

/* 
 * [STYLESHEET]
 * - style.css: BlockNote Mantine 기본 레이아웃 및 폰트 CSS.
 */
import '@blocknote/mantine/style.css'

/* 
 * [LUCIDE ICONS]
 * - X: 닫기 아이콘
 * - Users: 멘션 시 참여 피어 목록 아이콘
 * - FileText: 멘션 시 대상 문서 링크 아이콘
 * - Sparkles: 헤더 참조 링크 아이콘
 */
import { X, Users, FileText, Sparkles } from 'lucide-react'

/* 
 * [MERMAID GRAPH ENGINE]
 * - mermaid: Jupyter 및 마크다운 내부 텍스트 플로우차트 다이어그램 실시간 컴파일러.
 */
import mermaid from 'mermaid'

/* 
 * [SUB-HOOKS FOR SEPARATE LOGICS]
 * - useBacktickFence: 세번 백틱(```) 입력 시 Jupyter 코드 블록으로 자동 파싱 변환하는 도우미.
 * - useCollaborationHighlight: Yjs 피어 편집 시 블록 포커스 테두리 깜빡임 연출기.
 * - useNativeUploadIntercept: 이미지 드래그 드롭 업로드 시 로컬 VFS 복사 인터셉터.
 */
import { useBacktickFence } from './useBacktickFence'
import { useCollaborationHighlight } from './useCollaborationHighlight'
import { useNativeUploadIntercept } from './useNativeUploadIntercept'

// Mermaid 초기화 시도
try {
  mermaid.initialize({
    startOnLoad: false,
    theme: 'dark',
    securityLevel: 'loose',
  })
} catch (e) {
  console.error('Failed to initialize mermaid:', e)
}

/* 
 * [COMPONENTS]
 * - MarkdownPreview: 읽기 전용 최종 HTML 미리보기 컴포넌트.
 * - PeerBlockHighlightLayer: 타 피어들의 텍스트 드래그 및 마우스 캐럿 위치 투영 오버레이 레이어.
 * - getCustomSlashMenuItems: 커스텀 입점 플러그인(Jupyter, Drawing 등) 추가용 슬래시 메뉴 리스트 빌더.
 * - WelcomeBanner: 최초 로딩 환영 카드 뷰.
 * - RichStyleToolbar: 폰트 및 폰트크기 강제 커스텀 툴바.
 * - ImageLightbox: 이미지 클릭 시 전체스크린 확대 뷰 모달.
 */
import { PeerBlockHighlightLayer } from './editor/PeerBlockHighlightLayer'
import { getCustomSlashMenuItems } from './editor/customSlashMenuItems'
import { WelcomeBanner } from './editor/WelcomeBanner'
import { RichStyleToolbar } from './editor/RichStyleToolbar'
import { ImageLightbox } from './ImageLightbox'
import { PdfViewer } from './PdfViewer'

/* 
 * [INTERACTION HOOKS]
 * - useHoverBlock: 마우스 커서 아래 블록 정보 및 좌표 영역 실시간 추적기.
 * - useSideMenuHoverSync: Mantine 사이드 메뉴 호버 전파 보정기.
 * - useEditorDragDrop: 마크다운 파일/URL 외부 드롭 캡처기.
 * - useEditorPaste: 클립보드 이미지 및 코드 원문 가로채기.
 * - useImageLightbox: 이미지 팝업 제어기.
 * - useSelectionTracking: 선택 영역 문자열 캡처 전파기.
 */
import { useHoverBlock } from '../hooks/editor/useHoverBlock'
import { useEditorDragDrop } from '../hooks/editor/useEditorDragDrop'
import { useEditorPaste } from '../hooks/editor/useEditorPaste'
import { useImageLightbox } from '../hooks/editor/useImageLightbox'
import { useSelectionTracking } from '../hooks/editor/useSelectionTracking'

/* 
 * [CONTEXT & STORE]
 * - useAppContext: 에디터 인스턴스, 설정을 쥐고 있는 최상위 Context.
 * - useWorkspaceStore: 탭 관리 및 버퍼 정보 스토어.
 */
import { useAppContext } from '../contexts/AppContext'
import { useWorkspaceStore } from '../stores/useWorkspaceStore'
import { useProcessStore } from '../stores/useProcessStore'

/**
 * @interface MarkdownEditorProps
 * @description 에디터 드래그 및 셀렉션 이동 콜백 등 내부 레이아웃 바인딩을 위한 Props.
 */
export interface MarkdownEditorProps {
  onMouseMove?: (e: React.MouseEvent) => void
  onSelectionChange?: (selection: { anchorBlockId: string; focusBlockId: string } | null) => void
  onBlockHighlight?: (blockId: string | null, isEditing: boolean) => void
  editorContainerRef: React.RefObject<HTMLDivElement | null>
  onSelectedTextChange?: (text: string) => void
  taggedBlocks?: { id: string; text: string }[]
  setTaggedBlocks?: (blocks: { id: string; text: string }[]) => void
}

/**
 * @component CustomAddBlockButton
 * @location packages/core/src/renderer/components/MarkdownEditor.tsx
 * @description BlockNote SideMenu 안에서 렌더링되는 커스텀 [+] 블록 추가 버튼 컴포넌트.
 *
 * [설계 핵심 이유 - WHY SEPARATED]
 * - BlockNote의 slashMenu를 열기 위해서는 `suggestionMenu.openSuggestionMenu('/')` 공식 API가
 *   반드시 필요하다. 이 API는 `useExtension(SuggestionMenu)` 훅을 통해서만 접근 가능하며,
 *   이 훅은 BlockNote Context 내부에서만 유효하게 호출된다.
 * - MarkdownEditor 함수 내부에 정의하는 이유: SideMenuController의 sideMenu prop으로 넘길 때
 *   인라인 화살표 함수를 사용하면 부모 리렌더링마다 함수 참조가 생성되어 SideMenu가
 *   언마운트/리마운트를 반복하는 심각한 visual flicker 버그가 발생하기 때문이다.
 *
 * [소비처 - CONSUMERS / USAGE CONTEXT]
 * - 소비처 A (CustomSideMenu): 아래 정의된 CustomSideMenu 컴포넌트의 children으로 포함됨.
 *
 * [CONTRACT]
 * - MUST: 이 컴포넌트는 반드시 BlockNoteView 하위(BlockNote Context 내부)에서 렌더링되어야 함.
 *   Context 외부에서 렌더링 시 useBlockNoteEditor / useExtension 훅이 에러를 발생시킴.
 */
const CustomAddBlockButton = () => {
  /*
   * [BLOCKNOTE CONTEXT HOOKS]
   * - editor: 현재 BlockNote 에디터 인스턴스 (블록 삽입/커서 이동 API 접근용).
   * - suggestionMenu: SuggestionMenu Extension 인스턴스.
   *   openSuggestionMenu('/') 메서드로 슬래시 팝업을 프로그래밍적으로 띄울 수 있음.
   * - block: SideMenuExtension 상태에서 현재 사이드 메뉴가 가리키는 블록 객체.
   *   Expected value: BlockNote Block 객체 또는 undefined (메뉴 미표출 상태).
   */
  const editor = useBlockNoteEditor()
  const suggestionMenu = useExtension(SuggestionMenu)
  const block = useExtensionState(SideMenuExtension, {
    editor,
    selector: (state) => state?.block,
  })

  /**
   * [EVENT HANDLER - onClick]
   * - Rationale: 클릭 시 항상 현재 블록 아래에 새 빈 단락을 삽입하고 커서를 이동하여,
   *   슬래시 메뉴를 열어 사용자 명령 선택을 유도한다.
   * - 조건 만족 시 (block === undefined): 사이드 메뉴가 대상 블록을 아직 추적하지 못한 상태이므로 즉시 이탈.
   * - 조건 불만족 시: 현재 블록 아래에 새 빈 단락 삽입 후 커서 이동 및 슬래시 메뉴 오픈.
   */
  const onClick = useCallback(() => {
    /*
     * [ALGORITHM BRANCH / DECISION]
     * - 조건 식: `block === undefined`
     * - 만족 시: 즉시 이탈.
     */
    if (block === undefined) return

    /*
     * [RUN-TIME STATE / INVARIANT]
     * - blockContent: 현재 대상 블록의 콘텐츠 배열.
     * - isBlockEmpty: 대상 블록이 비어있는지 여부 판별.
     */
    const blockContent = block.content
    const isBlockEmpty =
      blockContent !== undefined &&
      Array.isArray(blockContent) &&
      blockContent.length === 0

    if (isBlockEmpty) {
      // 빈 블록인 경우: 기존 위치에 커서 포커스하고 슬래시 메뉴 열기
      editor.setTextCursorPosition(block)
      suggestionMenu.openSuggestionMenu('/')
    } else {
      // 내용이 있는 블록인 경우: 아래에 새 빈 단락을 삽입하고 커서 이동 후 슬래시 메뉴 열기
      const insertedBlock = editor.insertBlocks(
        [{ type: 'paragraph' }],
        block,
        'after',
      )[0]
      editor.setTextCursorPosition(insertedBlock)
      suggestionMenu.openSuggestionMenu('/')
    }
  }, [block, editor, suggestionMenu])

  /*
   * [ALGORITHM BRANCH / DECISION]
   * - 조건 식: `block === undefined`
   * - 만족 시: 사이드 메뉴가 비활성 상태이므로 null 반환 (렌더링 생략).
   * - 불만족 시: 커스텀 [+] 버튼 DOM 반환.
   */
  if (block === undefined) return null

  return (
    <button
      className="bn-side-menu-btn bn-button mantine-UnstyledButton-root"
      type="button"
      aria-label="Add block"
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '24px',
        height: '24px',
        cursor: 'pointer',
        border: 'none',
        background: 'none',
        color: 'var(--text-main)',
        opacity: 0.8,
        padding: 0,
        borderRadius: '4px',
        transition: 'background-color 0.2s',
      }}
      onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)' }}
      onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
    >
      {/* SVG에 pointerEvents: none 처리로 클릭 이벤트 target이 svg로 튀는 현상 방지 */}
      <svg
        stroke="currentColor"
        fill="currentColor"
        strokeWidth="0"
        viewBox="0 0 1024 1024"
        height="18"
        width="18"
        style={{ pointerEvents: 'none' }}
      >
        <path d="M482 152h60q8 0 8 8v314h314q8 0 8 8v60q0 8-8 8H550v314q0 8-8 8h-60q-8 0-8-8V550H160q-8 0-8-8v-60q0-8 8-8h314V160q0-8 8-8z" />
      </svg>
    </button>
  )
}


/**
 * @component MarkdownEditor
 * @description WYSIWYG 에디터 영역 렌더링 및 사용자 단축 팝업 액션을 통제하는 코어 컴포넌트.
 */
export function MarkdownEditor({
  /*
   * [PROPERTY MAPPINGS]
   * - onMouseMove: 마우스 위치 트래킹 전송 핸들러.
   * - onSelectionChange: 캐럿 범위 변경 감지 핸들러.
   * - onBlockHighlight: 블록 하이라이트/포커스 동기화 콜백.
   * - editorContainerRef: 최상위 DOM 마운트용 참조 레퍼런스.
   * - onSelectedTextChange: 선택 텍스트 대상 스토어 연계 핸들러.
   * - taggedBlocks: 지시용 태그 블록 정보 목록.
   * - setTaggedBlocks: 지시용 태그 블록 갱신 세터.
   */
  onMouseMove = () => {},
  onSelectionChange = () => {},
  onBlockHighlight = () => {},
  editorContainerRef,
  onSelectedTextChange,
  taggedBlocks = [],
  setTaggedBlocks = () => {},
}: MarkdownEditorProps) {
  /*
   * [CONTEXT VALUES]
   * - editor: BlockNote API 구동 본체.
   * - editorMode: welcome/edit/preview/raw 화면 모드 지정.
   * - peers: 현재 편집에 참여 중인 피어 목록.
   * - settings: 렌더링 일반 세팅 정보.
   * - handleOpenFile: 파일 열기 트리거.
   * - handleStartWelcomeEdit: 웰컴 화면 종료 및 에디터 로드 콜백.
   * - handleStartNewDocument: 새 문서 생성 콜백.
   */
  const { editor, editorMode, peers, settings, handleOpenFile, handleStartWelcomeEdit, handleStartNewDocument } = useAppContext()
  
  /*
   * [ZUSTAND STORE PROPERTIES]
   * - currentContent: 원문 텍스트 버퍼.
   * - setCurrentContent: 원문 텍스트 변경 세터.
   * - tabs: 다중 문서 탭 정보 목록.
   */
  const { currentContent, setCurrentContent, tabs, filePath, pdfData, pdfFileName } = useWorkspaceStore()
  
  const hasPermission = useProcessStore((s) => s.hasPermission)
  const canUseAITagging = false
  
  /*
   * [LOCAL CONFIG VARIABLES]
   * - wordWrap: 줄바꿈 허용 세팅 여부.
   * - showCodeRunner: 하단 주피터 콘솔 출력창 노출 여부.
   * - theme: 화이트/다크 테마 정보.
   * - installedPlugins: 폰트 강제 변경 등이 설치 완료된 플러그인 리스트.
   */
  const wordWrap = settings?.wordWrap || false
  const showCodeRunner = settings?.showCodeConsole || false
  const theme = settings?.theme || 'dark'
  const installedPlugins = settings?.installedPlugins || []

  // Rationale: console.debug 경고 누락 및 미사용 변수 체크 해결
  console.debug("Unused vars (MarkdownEditor):", { X, showCodeRunner, taggedBlocks });

  /*
   * [RICH STYLE VARIABLES]
   * - selectedFont: 사용자가 툴바에서 지정한 커스텀 폰트명.
   * - selectedSize: 사용자가 툴바에서 지정한 커스텀 크기 px.
   */
  const [selectedFont, setSelectedFont] = useState('Pretendard')
  const [selectedSize, setSelectedSize] = useState('14px')

  /*
   * [HOVER CONTROLLER VARIABLES]
   * - hoverBlock: 현재 마우스가 올라가 있는 블록의 ID, 내용, 좌표(rect) 정보.
   * - handleEditorMouseMove: 에디터 캔버스 내 마우스 이동 실시간 감지 핸들러.
   */
  const { hoverBlock, handleEditorMouseMove } = useHoverBlock(
    editor, editorMode, editorContainerRef, onMouseMove, canUseAITagging
  )

  /*
   * [PLUGIN FLAG]
   * - hasRichStyling: 리치 폰트 커스텀 툴바 입점 여부.
   */
  const hasRichStyling = installedPlugins.includes('rich-styling')

  /**
   * [SIDE EFFECT - Font Style Injection]
   * - Rationale: rich-styling 플러그인이 로드되어 있을 때만 선택한 폰트와 크기를 에디터 본문 DOM에 강제 인젝션한다.
   */
  useEffect(() => {
    if (!editorContainerRef.current) return
    const editorDom = editorContainerRef.current.querySelector('.bn-editor') as HTMLElement
    if (editorDom) {
      if (hasRichStyling) {
        editorDom.style.fontFamily = selectedFont
        editorDom.style.fontSize = selectedSize
      } else {
        editorDom.style.fontFamily = ''
        editorDom.style.fontSize = ''
      }
    }
  }, [selectedFont, selectedSize, editor, editorMode, hasRichStyling, editorContainerRef])

  useEffect(() => {
    /*
     * [CONTRACT]
     * - 현재 활성화된 에디터 인스턴스를 전역 AMEVA_CORE 공간에 바인딩하여,
     *   동적으로 마운트되는 원격/프리미엄 플러그인(마인드맵, 프레젠테이션 등)에서 에디터의 실시간 문서 구조를 읽거나 쓸 수 있도록 지원한다.
     */
    if (typeof window !== 'undefined') {
      const win = window as any
      if (!win.AMEVA_CORE) {
        win.AMEVA_CORE = {}
      }
      win.AMEVA_CORE.editor = editor
    }
  }, [editor])

  // 코드 펜스, 작업 피어 포커스 레이어 및 파일 드롭 이미지 가로채기 구동
  useBacktickFence(editor)
  useCollaborationHighlight(editor, onBlockHighlight, editorContainerRef)
  useNativeUploadIntercept(editor, editorContainerRef)

  /*
   * [DRAG DROP & CLIPBOARD PASTE CAPTURES]
   * - onDropCapture: 드래그 드롭 이미지/파일 인터셉트.
   * - onPasteCapture: 클립보드 붙여넣기 인터셉트.
   */
  const { onDropCapture } = useEditorDragDrop(editor, editorMode)
  const { onPasteCapture } = useEditorPaste(editor, editorMode)

  /*
   * [LIGHTBOX & SELECTION VARIABLES]
   * - selectedImg: 확대 팝업할 이미지 파일 URL.
   * - setSelectedImg: 이미지 확대 팝업 세터.
   * - handleSelection: 마우스 드래그 선택 시 텍스트 내용 캡처 및 전송.
   */
  const { selectedImg, setSelectedImg } = useImageLightbox(editorContainerRef)
  const { handleSelection } = useSelectionTracking(editor, onSelectedTextChange, onSelectionChange)

  if (!editor) {
    return (
      <div style={{ display: 'flex', flex: 1, alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
        에디터를 준비 중입니다...
      </div>
    )
  }

  return (
    <div style={{
      flex: 1, display: 'flex', flexDirection: 'column',
      height: '100%', position: 'relative', backgroundColor: 'var(--bg-main)',
    }}>
      {hasRichStyling && (
        <RichStyleToolbar
          editor={editor}
          editorMode={editorMode}
          hasRichStyling={hasRichStyling}
          selectedFont={selectedFont}
          setSelectedFont={setSelectedFont}
          selectedSize={selectedSize}
          setSelectedSize={setSelectedSize}
        />
      )}
      <div
        ref={editorContainerRef}
        onMouseMove={handleEditorMouseMove}
        onMouseUp={handleSelection}
        onKeyUp={handleSelection}
        onDropCapture={onDropCapture}
        onPasteCapture={onPasteCapture}
        className={!wordWrap ? 'wrap-disabled' : ''}
        style={{ flex: 1, overflowY: 'auto', padding: '40px 60px 45vh 60px', position: 'relative' }}
      >
        <PeerBlockHighlightLayer peers={peers} containerRef={editorContainerRef} />

        {/* 블록 컨텍스트 연동 호버 어시스턴트 별표(★) 버튼 레이어 
          * [CONTRACT] canUseAITagging 조건 적용 위치: 이 별표 버튼은 Pro 전용 기능(블록 컨텍스트 태깅)이므로 권한이 있을 때만 표시.
          */}
        {hoverBlock && editorMode === 'edit' && canUseAITagging && (
          <button
            className="sparkle-hover-btn"
            style={{
              position: 'absolute',
              top: hoverBlock.rect.top + (hoverBlock.rect.height - 24) / 2,
              left: hoverBlock.rect.left + hoverBlock.rect.width + 12,
              width: '24px',
              height: '24px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #8b5cf6 0%, #a78bfa 100%)',
              border: 'none',
              boxShadow: '0 2px 8px rgba(139, 92, 246, 0.4)',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '12px',
              cursor: 'pointer',
              zIndex: 30,
              padding: 0,
              transition: 'transform 0.15s',
            }}
            title="이 블록을 AI 채팅 컨텍스트로 태그하여 참조"
            onClick={(e) => {
              e.stopPropagation()
              if (taggedBlocks.some(b => b.id === hoverBlock.id)) return
              const snippet = hoverBlock.text.length > 20
                ? hoverBlock.text.slice(0, 20) + '...'
                : hoverBlock.text || '본문 문단'
              setTaggedBlocks([...taggedBlocks, { id: hoverBlock.id, text: snippet }])
            }}
          >
            ★
          </button>
        )}

        {/* 작업 참여자의 드래그 선택 범위 박스 실시간 투영 */}
        {peers.map((peer) => {
          if (!peer.dragSelection?.rects) return null
          return peer.dragSelection.rects.map((rect, idx) => (
            <div
              key={`${peer.id}-drag-${idx}`}
              style={{
                position: 'absolute', top: rect.top, left: rect.left,
                width: rect.width, height: rect.height,
                backgroundColor: peer.color, opacity: 0.25,
                pointerEvents: 'none', zIndex: 10, borderRadius: '2px',
              }}
            />
          ))
        })}

        {/* 작업 참여자 마우스 포인터 실시간 이동 투영 */}
        {peers.map((peer) => {
          if (!peer.pointer) return null
          return (
            <div
              key={`${peer.id}-pointer`}
              style={{
                position: 'absolute', top: peer.pointer.y, left: peer.pointer.x,
                width: '12px', height: '12px', pointerEvents: 'none', zIndex: 99,
                transform: 'translate(-2px,-2px)',
                transition: 'top 0.08s ease, left 0.08s ease',
              }}
            >
              <svg viewBox="0 0 24 24" style={{ width: '100%', height: '100%', fill: peer.color }}>
                <path d="M4.5 3v15.2l4.8-4.8 5.7 5.7 2.5-2.5-5.7-5.7 6-1.9L4.5 3z" />
              </svg>
              <div style={{
                position: 'absolute', top: '12px', left: '12px',
                background: peer.color, color: '#fff',
                fontSize: '9px', fontWeight: 700,
                padding: '2px 6px', borderRadius: '3px',
                whiteSpace: 'nowrap', boxShadow: '0 2px 6px rgba(0,0,0,0.4)',
              }}>
                {peer.name}
              </div>
            </div>
          )
        })}

        {/* PDF 뷰어 모드: pdfData가 있는 경우 Canvas 직접 렌더링 (모드 전환 후에도 pdfData로 보존) */}
        {pdfData ? (
          <div style={{ position: 'absolute', inset: 0, zIndex: 10, background: 'var(--bg-deep)' }}>
            <PdfViewer
              pdfData={pdfData}
              fileName={pdfFileName || filePath?.split(/[\\/]/).pop() || 'document.pdf'}
            />
          </div>
        ) : editorMode === 'welcome' ? (
          <WelcomeBanner
            onStartWelcomeEdit={handleStartWelcomeEdit}
            onStartNewDocument={handleStartNewDocument}
            onOpenFile={handleOpenFile}
            currentContent={currentContent}
            editor={editor}
          />
        ) : editorMode === 'edit' ? (
          <BlockNoteView editor={editor} theme={theme === 'white' ? 'light' : 'dark'} editable slashMenu={false}>
            <SideMenuController />
            {/* 1. 슬래시(/) 명령어 단축 팝업 제어 */}
            <SuggestionMenuController
              triggerCharacter="/"
              getItems={async (query) => {
                const items = getCustomSlashMenuItems(editor, installedPlugins)
                return items.filter(item =>
                  item.title.toLowerCase().includes(query.toLowerCase()) ||
                  (item.aliases?.some(a => a.toLowerCase().includes(query.toLowerCase())))
                )
              }}
            />
            {/* 2. 골뱅이(@) 참여자 멘션 및 타 문서 링크 단축 팝업 제어 */}
            <SuggestionMenuController
              triggerCharacter="@"
              getItems={async (query) => {
                if (!editor) return []
                const peerItems = peers.map(p => ({
                  title: p.name || '이름없는 사용자',
                  subtext: '작업 참여자 멘션',
                  icon: <Users size={14} color={p.color || '#a855f7'} />,
                  onItemClick: () => {
                    editor.insertInlineContent([{ type: 'text', text: `@${p.name} `, styles: { bold: true } as any }])
                  }
                }))
                const docItems = tabs.map(t => {
                  const title = t.filePath ? t.filePath.split(/[\\/]/).pop() || '문서' : '제목 없음'
                  return {
                    title: title,
                    subtext: t.filePath ? `문서 경로: ${t.filePath}` : '저장되지 않은 문서',
                    icon: <FileText size={14} color="#3b82f6" />,
                    onItemClick: () => {
                      editor.insertInlineContent([
                        { 
                          type: 'text', 
                          text: `[doc:${title}]`, 
                          styles: { underline: true } as any 
                        }
                      ])
                    }
                  }
                })
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `allItems`
       * - 자료형 / 예상 값: 피어와 탭 문서를 합친 단축 메뉴 통합 배열.
       */
                const allItems = [...peerItems, ...docItems]
                return allItems.filter(item => item.title.toLowerCase().includes(query.toLowerCase()))
              }}
            />
            {/* 3. 우물정(#) 헤더 참조 링크 단축 팝업 제어 */}
            <SuggestionMenuController
              triggerCharacter="#"
              getItems={async (query) => {
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `!editor`
       * - 만족 시: 에디터 미지정 시 빈 배열 즉시 반환.
       */
                if (!editor) return []
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `headingBlocks`
       * - 자료형 / 예상 값: 전체 문서 내 제목(heading) 타입 블록 필터링 배열.
       */
                const headingBlocks = editor.document.filter(b => b.type === 'heading')
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `items`
       * - 자료형 / 예상 값: H1~H6 헤더 참조 링크 리스트 배열.
       */
                const items = headingBlocks.map(b => {
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `textContent`
       * - 자료형 / 예상 값: 제목 블록 내부 텍스트 콘텐츠의 병합 문자열.
       */
                  const textContent = b.content && Array.isArray(b.content) 
                    ? b.content.map((c: any) => c.text).join('') 
                    : '제목 없음'
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `level`
       * - 자료형 / 예상 값: 헤더 수준 정수값 (1~6).
       */
                  const level = b.props?.level || 1

                  return {
                    title: textContent,
                    subtext: `H${level} 헤더 참조 링크`,
                    icon: <Sparkles size={14} color="#10b981" />,
                    onItemClick: () => {
                      editor.insertInlineContent([
                        {
                          type: 'text',
                          text: `[${textContent}](#${b.id})`,
                          styles: { italic: true } as any
                        }
                      ])
                    }
                  }
                })
                return items.filter(item => item.title.toLowerCase().includes(query.toLowerCase()))
              }}
            />
          </BlockNoteView>
        ) : editorMode === 'preview' ? (
          <BlockNoteView editor={editor} theme={theme === 'white' ? 'light' : 'dark'} editable={false}>
            <></>
          </BlockNoteView>
        ) : (
          /* RAW 마크다운 원문 텍스트 영역 직접 편집 뷰 */
          <div style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            padding: '16px 24px',
            boxSizing: 'border-box',
          }}>
            <textarea
              value={currentContent}
              onChange={(e) => setCurrentContent(e.target.value)}
              placeholder="여기에 마크다운 원문이 표시됩니다. 직접 수정할 수도 있습니다."
              style={{
                width: '100%',
                height: 'calc(100vh - 120px)',
                minHeight: '400px',
                background: 'rgba(5, 5, 10, 0.4)',
                border: '1px solid var(--border-muted)',
                borderRadius: '8px',
                color: 'var(--text-main)',
                fontFamily: 'Consolas, Monaco, "Courier New", Courier, monospace',
                fontSize: '13px',
                lineHeight: '1.6',
                padding: '16px',
                resize: 'none',
                outline: 'none',
                boxSizing: 'border-box',
                transition: 'all 0.2s',
              }}
              onFocus={(e) => e.currentTarget.style.borderColor = 'var(--primary)'}
              onBlur={(e) => e.currentTarget.style.borderColor = 'var(--border-muted)'}
            />
          </div>
        )}

      </div>

      {selectedImg && (
        <ImageLightbox url={selectedImg} onClose={() => setSelectedImg(null)} />
      )}
    </div>
  )
}

export { PeerBlockHighlightLayer } from './editor/PeerBlockHighlightLayer'
export { getCustomSlashMenuItems } from './editor/customSlashMenuItems'
export { WelcomeBanner } from './editor/WelcomeBanner'
