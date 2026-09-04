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
import React, { useState, useEffect, useCallback, useRef, useMemo, createContext, useContext } from 'react'
import { createPortal } from 'react-dom'
import { autoUpdate } from '@floating-ui/react'
import type { ReferenceElement } from '@floating-ui/react'

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
 * - BlockPopover: 플로팅 사이드 메뉴 앵커 팝업 렌더러.
 */
import {
  SuggestionMenuController,
  SideMenuController,
  SideMenu,
  AddBlockButton,
  DragHandleButton,
  DragHandleMenu,
  RemoveBlockItem,
  useBlockNoteEditor,
  useExtension,
  useExtensionState,
  BlockPopover,
} from '@blocknote/react'
import type { FloatingUIOptions, SideMenuProps } from '@blocknote/react'

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
import { X, Users, FileText, Sparkles, ChevronLeft, ChevronRight } from 'lucide-react'

/* 
 * [MERMAID GRAPH ENGINE]
 * - mermaid (Lazily loaded in InlineMermaidRenderer)
 */

/* 
 * [SUB-HOOKS FOR SEPARATE LOGICS]
 * - useBacktickFence: 세번 백틱(```) 입력 시 Jupyter 코드 블록으로 자동 파싱 변환하는 도우미.
 * - useCollaborationHighlight: Yjs 피어 편집 시 블록 포커스 테두리 깜빡임 연출기.
 * - useNativeUploadIntercept: 이미지 드래그 드롭 업로드 시 로컬 VFS 복사 인터셉터.
 */
import { useBacktickFence } from './useBacktickFence'
import { useCollaborationHighlight } from './useCollaborationHighlight'
import { useNativeUploadIntercept } from './useNativeUploadIntercept'

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
import { AIContextMenu } from './editor/AIContextMenu'
import { RichStyleToolbar } from './editor/RichStyleToolbar'
import { ImageLightbox } from './ImageLightbox'

const PdfViewer = React.lazy(() => import('./PdfViewer').then(m => ({ default: m.PdfViewer })))
const HwpxViewerModal = React.lazy(() => import('./editor/HwpxViewerModal').then(m => ({ default: m.HwpxViewerModal })))
// [내부 프로젝트 의존성 모듈 임포트: ../config/features]
import { FEATURE_FLAGS } from '../config/features'
// [내부 프로젝트 의존성 모듈 임포트: ../plugins/smartdocs/components/SmartDocsRibbon]
import { SmartDocsRibbon } from '../plugins/smartdocs/components/SmartDocsRibbon'
import { useWebLLM } from './useWebLLM'
import { useLLMAction } from '../hooks/editor/useLLMAction'
import { useGhostText } from '../hooks/editor/useGhostText'
import { useDocumentSummaryStore } from '../stores/useDocumentSummaryStore'
import '../styles/editorBookModes.css'

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
import { useUIStore } from '../stores/useUIStore'

/**
 * @interface MarkdownEditorProps
 * @description 에디터 드래그 및 셀렉션 이동 콜백 등 내부 레이아웃 바인딩을 위한 Props.
 */
export interface MarkdownEditorProps {
  isSplitViewInstance?: boolean
  onMouseMove?: (e: React.MouseEvent) => void
  onSelectionChange?: (selection: { anchorBlockId: string; focusBlockId: string } | null) => void
  onBlockHighlight?: (blockId: string | null, isEditing: boolean) => void
  editorContainerRef: React.RefObject<HTMLDivElement | null>
  onSelectedTextChange?: (text: string) => void
  taggedBlocks?: { id: string; text: string }[]
  setTaggedBlocks?: (blocks: { id: string; text: string }[]) => void
}

/**
 * @context SideMenuTargetBlockContext
 * @description 사이드 메뉴가 표시되어야 할 현재 활성 블록(포인터/커서 위치 또는 마우스 호버 대상)을
 * 하위 커스텀 버튼(+ 및 ::)에 안전하게 전달하기 위한 컨텍스트.
 */
const SideMenuTargetBlockContext = createContext<{
  block: any | undefined
  isPersistent: boolean
}>({
  block: undefined,
  isPersistent: false,
})

const useSideMenuTargetBlock = () => useContext(SideMenuTargetBlockContext)

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
  const { block: ctxBlock } = useSideMenuTargetBlock()
  const extBlock = useExtensionState(SideMenuExtension, {
    editor,
    selector: (state) => state?.block,
  })
  const block = ctxBlock || extBlock

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
      try {
        suggestionMenu?.openSuggestionMenu('/')
      } catch (err) {
        console.warn('[CustomAddBlockButton] SuggestionMenu not ready:', err)
      }
    } else {
      // 내용이 있는 블록인 경우: 아래에 새 빈 단락을 삽입하고 커서 이동 후 슬래시 메뉴 열기
      const insertedBlock = editor.insertBlocks(
        [{ type: 'paragraph' }],
        block,
        'after',
      )[0]
      if (insertedBlock) {
        editor.setTextCursorPosition(insertedBlock)
        try {
          suggestionMenu?.openSuggestionMenu('/')
        } catch (err) {
          console.warn('[CustomAddBlockButton] SuggestionMenu not ready:', err)
        }
      }
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
 * @component SafeDragHandleMenu
 * @description 기본 DragHandleMenu에서 BlockColorsItem을 제거한 안전한 버전.
 * [WHY] @blocknote/mantine 0.51.x의 BlockColorsItem은 Mantine 8.x의 Menu.Sub API를
 * 사용하지만, 현재 프로젝트에는 Mantine 7.x가 설치되어 있어 Menu.Sub가 undefined임.
 * 빈 블록에서 :: 클릭 시 해당 컴포넌트가 서브메뉴를 렌더링하려다 undefined 에러로 자폭.
 * 따라서 BlockColorsItem만 제거하고 RemoveBlockItem(삭제)만 남긴 안전한 메뉴를 사용.
 * [CONTRACT] Mantine을 8.x로 업그레이드하면 이 컴포넌트를 제거하고
 * 기본 <SideMenuController />로 복원 가능.
 */
const SafeDragHandleMenu = () => {
  const editor = useBlockNoteEditor()
  const { block: ctxBlock } = useSideMenuTargetBlock()
  const extBlock = useExtensionState(SideMenuExtension, {
    editor,
    selector: (state) => state?.block,
  })
  const block = ctxBlock || extBlock

  const handleRemove = useCallback(() => {
    if (!block) return
    const customTypeNames: Record<string, string> = {
      inlineDocument: '문서 (PDF/Word/Excel)',
      map: '인터랙티브 지도',
      kanban: '칸반 보드',
      drawing: '드로잉 캔버스',
      chart: '데이터 차트',
      youtube: 'YouTube 동영상',
      sqlite: 'SQLite 데이터베이스',
      excel: '엑셀 스프레드시트',
      presentation: '프레젠테이션',
      jupyter: 'Jupyter 노트북',
      aiDiff: 'AI 변경사항 비교',
      linkPreview: '웹 링크 미리보기',
      amevaImage: '이미지 미디어',
      amevaVideo: '비디오 미디어',
      amevaAudio: '오디오 미디어',
    }

    const typeName = customTypeNames[block.type]
    if (typeName) {
      useUIStore.getState().openBlockDeleteConfirm(typeName, () => {
        editor.removeBlocks([block])
      })
    } else {
      editor.removeBlocks([block])
    }
  }, [editor, block])

  return (
    <DragHandleMenu>
      <div
        onClick={handleRemove}
        style={{
          padding: '6px 12px',
          fontSize: '13px',
          cursor: 'pointer',
          color: '#ef4444',
          display: 'flex',
          alignItems: 'center',
          gap: '6px'
        }}
      >
        블록 삭제
      </div>
    </DragHandleMenu>
  )
}

/**
 * @component SafeCustomSideMenu
 * @description + 버튼은 기본 AddBlockButton을 그대로 사용하고,
 * :: 버튼만 SafeDragHandleMenu로 교체한 SideMenu 컴포넌트.
 * [CONTRACT] 이 컴포넌트는 BlockNoteView 내부(BlockNote Context) 안에서만 렌더링되어야 함.
 * [CONTRACT] 인라인 함수로 sideMenu prop에 전달하면 리렌더링마다 언마운트/리마운트 flickering 발생.
 * 반드시 이렇게 파일 스코프 수준에서 별도 컴포넌트로 분리해야 함.
 */
const SafeCustomSideMenu = () => (
  <SideMenu>
    <CustomAddBlockButton />
    <DragHandleButton dragHandleMenu={SafeDragHandleMenu} />
  </SideMenu>
)

/**
 * @component PersistentSideMenuController
 * @description 에디터 내 텍스트 포인터(커서/캐럿/선택)가 찍혀 있는 동안 좌측 [+ ::] 사이드 액션 메뉴가
 * 소멸되지 않고 지속적으로 유지(Persistent Visible)되도록 제어하는 스마트 사이드 메뉴 컨트롤러.
 *
 * [핵심 해결 원리 - DESIGN INTENT / ADR]
 * 1. BlockNote 기본 SideMenuController는 오직 마우스 이동(`mousemove`) 시에만 블록을 추적하므로,
 *    본문에 커서를 두고 `+` 단추를 누르려고 마우스를 옮기는 찰나의 간격(Gap)에서 메뉴가 즉각 닫혀버리는 문제가 발생함.
 * 2. 이를 해결하기 위해 에디터 내 포인터가 찍혀 있는 블록(`focusedBlock`)을 실시간 추적하여,
 *    마우스가 다른 블록을 명시적으로 호버하고 있지 않다면 커서 위치의 블록 좌측에 [+ ::]를 상시 표출함.
 * 3. 마우스가 [+ ::] 버튼 영역에 진입했을 때(`isHoveringMenu`) 대상 블록을 고정 락(Lock)하여
 *    마우스 이동 및 조작 중 메뉴가 소멸되는 현상을 원천 방어함.
 */
const PersistentSideMenuController = (props: {
  sideMenu?: React.FC<SideMenuProps>
  floatingUIOptions?: Partial<FloatingUIOptions>
  portalElement?: HTMLElement | null
}) => {
  const editor = useBlockNoteEditor()
  const sideMenuExt = useExtension(SideMenuExtension)

  // BlockNote 기본 호버 확장 상태
  const extState = useExtensionState(SideMenuExtension, {
    selector: (state) =>
      state !== undefined
        ? {
            show: state.show,
            block: state.block,
          }
        : undefined,
  })

  // 에디터 내 현재 커서가 찍혀 있는 블록 추적
  const [focusedBlock, setFocusedBlock] = useState<any>(() => {
    try {
      return editor.getTextCursorPosition()?.block
    } catch {
      return undefined
    }
  })

  // 에디터 포커스 상태 추적
  const [isEditorFocused, setIsEditorFocused] = useState<boolean>(() => {
    try {
      return editor.isFocused()
    } catch {
      return false
    }
  })

  // 마우스가 사이드 메뉴 영역(+ :: 버튼)에 머무르고 있는지 여부
  const [isHoveringMenu, setIsHoveringMenu] = useState(false)

  // 마지막 유효 블록 캐시 (메뉴 이동 중 일시적 null 방어)
  const lastActiveBlockRef = useRef<any>(focusedBlock)

  // 커서 변경 및 포커스 상태 동기화
  useEffect(() => {
    const updateCursorPosition = () => {
      try {
        const focused = editor.isFocused()
        setIsEditorFocused(focused)
        const cur = editor.getTextCursorPosition()?.block
        if (cur) {
          setFocusedBlock(cur)
          lastActiveBlockRef.current = cur
        }
      } catch {}
    }

    const unsub = editor.onSelectionChange?.(updateCursorPosition)
    const pmDom = editor.prosemirrorView?.dom

    const handleFocus = () => {
      setIsEditorFocused(true)
      updateCursorPosition()
    }

    const handleBlur = (e: FocusEvent) => {
      // 관련 타깃이 사이드 메뉴 내부이면 포커스 해제 처리 지연/무시
      const related = e.relatedTarget as HTMLElement | null
      if (
        related?.closest?.('.bn-side-menu') ||
        related?.closest?.('[data-blocknote-side-menu]') ||
        related?.closest?.('.mantine-Menu-dropdown')
      ) {
        return
      }
      setTimeout(() => {
        if (!editor.isFocused() && !isHoveringMenu) {
          setIsEditorFocused(false)
        }
      }, 200)
    }

    if (pmDom) {
      pmDom.addEventListener('click', updateCursorPosition, { passive: true })
      pmDom.addEventListener('keyup', updateCursorPosition, { passive: true })
      pmDom.addEventListener('focus', handleFocus, { passive: true })
      pmDom.addEventListener('blur', handleBlur, { passive: true })
    }

    return () => {
      unsub?.()
      if (pmDom) {
        pmDom.removeEventListener('click', updateCursorPosition)
        pmDom.removeEventListener('keyup', updateCursorPosition)
        pmDom.removeEventListener('focus', handleFocus)
        pmDom.removeEventListener('blur', handleBlur)
      }
    }
  }, [editor, isHoveringMenu])

  // 타깃 블록 판정
  let effectiveBlock: any = undefined
  let effectiveShow = false

  if (isHoveringMenu && lastActiveBlockRef.current) {
    // 1순위: 마우스가 사이드 메뉴 버튼(+ ::) 위에 올라가 있으면 직전 대상 블록 고정
    effectiveBlock = lastActiveBlockRef.current
    effectiveShow = true
  } else if (extState?.show && extState?.block) {
    // 2순위: 마우스가 다른 블록을 명시적으로 호버하고 있는 경우
    effectiveBlock = extState.block
    effectiveShow = true
    lastActiveBlockRef.current = extState.block
  } else if (isEditorFocused && focusedBlock) {
    // 3순위 (핵심): 에디터에 포인터(커서)가 찍혀 있는 경우 항상 상시 표출!
    effectiveBlock = focusedBlock
    effectiveShow = true
    lastActiveBlockRef.current = focusedBlock
  } else if (lastActiveBlockRef.current && isEditorFocused) {
    // 4순위: 에디터가 포커스 중이면 캐시된 직전 블록 표출
    effectiveBlock = lastActiveBlockRef.current
    effectiveShow = true
  }

  // SideMenuExtension의 store도 함께 동기화하여 DragHandleButton 등의 내부 상태 일관성 보장
  useEffect(() => {
    if (effectiveShow && effectiveBlock && sideMenuExt?.store) {
      try {
        sideMenuExt.store.setState((prev: any) => ({
          ...prev,
          show: true,
          block: effectiveBlock,
        }))
      } catch {}
    }
  }, [effectiveShow, effectiveBlock, sideMenuExt])

  const whileElementsMounted = useCallback(
    (
      reference: ReferenceElement,
      floating: HTMLElement,
      _update: () => void,
    ) => {
      let initialized = false
      return autoUpdate(
        reference,
        floating,
        () => {
          if (!initialized) {
            initialized = true
            return
          }
          if (!isEditorFocused && !isHoveringMenu) {
            editor.getExtension(SideMenuExtension)?.hideMenuIfNotFrozen()
          }
        },
        {
          ancestorScroll: true,
          ancestorResize: false,
          elementResize: false,
          layoutShift: false,
        },
      )
    },
    [editor, isEditorFocused, isHoveringMenu],
  )

  const floatingUIOptions = useMemo<FloatingUIOptions>(
    () => ({
      ...props.floatingUIOptions,
      useFloatingOptions: {
        open: effectiveShow,
        placement: 'left-start',
        whileElementsMounted,
        ...props.floatingUIOptions?.useFloatingOptions,
      },
      useDismissProps: {
        enabled: false,
        ...props.floatingUIOptions?.useDismissProps,
      },
      focusManagerProps: {
        disabled: true,
        ...props.floatingUIOptions?.focusManagerProps,
      },
      elementProps: {
        onMouseEnter: (e: any) => {
          setIsHoveringMenu(true)
          props.floatingUIOptions?.elementProps?.onMouseEnter?.(e)
        },
        onMouseLeave: (e: any) => {
          setIsHoveringMenu(false)
          props.floatingUIOptions?.elementProps?.onMouseLeave?.(e)
        },
        style: {
          zIndex: 10000,
          ...props.floatingUIOptions?.elementProps?.style,
        },
        ...props.floatingUIOptions?.elementProps,
      },
    }),
    [props.floatingUIOptions, effectiveShow, whileElementsMounted],
  )

  const Component = props.sideMenu || SafeCustomSideMenu

  return (
    <SideMenuTargetBlockContext.Provider
      value={{ block: effectiveBlock, isPersistent: Boolean(focusedBlock) }}
    >
      <BlockPopover
        blockId={effectiveShow ? effectiveBlock?.id : undefined}
        portalElement={props.portalElement}
        {...floatingUIOptions}
      >
        {effectiveBlock?.id && <Component />}
      </BlockPopover>
    </SideMenuTargetBlockContext.Provider>
  )
}


// ==========================================
// AMEVA AI Context Action Handlers
// ==========================================

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
  onMouseMove = () => { },
  onSelectionChange = () => { },
  onBlockHighlight = () => { },
  editorContainerRef,
  onSelectedTextChange,
  taggedBlocks = [],
  setTaggedBlocks = () => { },
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
  const { editor, editorMode, peers, settings, handleOpenFile, handleStartWelcomeEdit, handleStartNewDocument, loadMarkdownIntoEditor } = useAppContext()

  const setActiveEditorInstance = useWorkspaceStore(s => s.setActiveEditorInstance)
  const currentContent = useWorkspaceStore(s => s.currentContent)
  const setCurrentContent = useWorkspaceStore(s => s.setCurrentContent)
  const tabs = useWorkspaceStore(s => s.tabs)
  const filePath = useWorkspaceStore(s => s.filePath)
  const pdfData = useWorkspaceStore(s => s.pdfData)
  const setPdfData = useWorkspaceStore(s => s.setPdfData)
  const pdfFileName = useWorkspaceStore(s => s.pdfFileName)
  const setPdfFileName = useWorkspaceStore(s => s.setPdfFileName)
  const isSmartDocsMode = useWorkspaceStore(s => s.isSmartDocsMode)
  const setIsSmartDocsMode = useWorkspaceStore(s => s.setIsSmartDocsMode)
  const pageViewMode = useWorkspaceStore(s => s.pageViewMode)
  const setPageViewMode = useWorkspaceStore(s => s.setPageViewMode)
  const viewerSkin = useWorkspaceStore(s => s.viewerSkin)
  const currentBookPage = useWorkspaceStore(s => s.currentBookPage)
  const setCurrentBookPage = useWorkspaceStore(s => s.setCurrentBookPage)
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
  const bookViewportRef = useRef<HTMLDivElement>(null)
  const currentSpreadIdxRef = useRef(0)
  const [currentSpreadIdx, setCurrentSpreadIdx] = useState(0)

  // 2장/3장 보기: 에디터 가용 폭 및 CSS 컬럼 반복 주기(editorEl.clientWidth + gap) 실측 계산
  const getSpreadPitch = useCallback((vp: HTMLElement): number => {
    const editorEl = vp.querySelector('.bn-editor') as HTMLElement | null
    if (editorEl && editorEl.clientWidth > 0) {
      const cs = window.getComputedStyle(editorEl)
      const gap = parseFloat(cs.columnGap) || (pageViewMode === 'dual' ? 64 : 48)
      return editorEl.clientWidth + gap
    }
    return vp.clientWidth
  }, [pageViewMode])

  // 2장/3장 보기: 사이드바/탭 개폐 시 실시간 가용 폭(100%)에 맞춰 정확한 페이지 인덱스 자동 유지
  useEffect(() => {
    if (!bookViewportRef.current) return
    const vp = bookViewportRef.current

    const handleResize = () => {
      const pitch = getSpreadPitch(vp)
      if (pitch > 0) {
        vp.scrollTo({ left: currentSpreadIdxRef.current * pitch, behavior: 'instant' })
      }
    }

    const handleScroll = () => {
      const pitch = getSpreadPitch(vp)
      if (pitch > 0) {
        const idx = Math.max(0, Math.round(vp.scrollLeft / pitch))
        if (idx !== currentSpreadIdxRef.current) {
          currentSpreadIdxRef.current = idx
          setCurrentSpreadIdx(idx)
        }
      }
    }

    const ro = new ResizeObserver(handleResize)
    ro.observe(vp)
    vp.addEventListener('scroll', handleScroll, { passive: true })

    return () => {
      ro.disconnect()
      vp.removeEventListener('scroll', handleScroll)
    }
  }, [pageViewMode, getSpreadPitch])

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

  /*
   * [RESTORED STATES: HWPX Modal, Context Menu, and WebLLM]
   */
  const [hwpxModalData, setHwpxModalData] = useState<any>(null)
  const [contextMenuState, setContextMenuState] = useState<{ isOpen: boolean; x: number; y: number; blockId: string | null; selectedText: string }>({
    isOpen: false,
    x: 0,
    y: 0,
    blockId: null,
    selectedText: ''
  })
  const { initModel, generateStream, generateGhostStream, isMainReady, isGhostReady, isMainLoading, isGhostLoading, activeModelId, mainProgressText, ghostProgressText, mainProgress, ghostProgress } = useWebLLM()
  const pMain = Math.round((mainProgress || 0) * 100);
  const pGhost = Math.round((ghostProgress || 0) * 100);
  const [pendingModelId, setPendingModelId] = useState('Qwen2.5-3B-Instruct-q4f32_1-MLC')
  const [ghostTextEnabled, setGhostTextEnabled] = useState(true)
  const { executeAction } = useLLMAction({ editor, activeModelId, generateStream, taggedBlocks })

  // Ghost Text 자동완성 훅 연결 (Phase 3)
  // enabled 토글로 ON/OFF 가능. 1.5B 모델을 별도 로드하지 않고 현재 활성 모델을 재사용한다.
  useGhostText({ editor, generateStream: generateGhostStream, isLLMReady: isGhostReady, enabled: ghostTextEnabled })

  useEffect(() => {
    const handleHwpxParsed = (e: Event) => {
      const customEvent = e as CustomEvent
      if (customEvent.detail?.parsedData) {
        setHwpxModalData(customEvent.detail.parsedData)
      }
    }
    const handleInsertMarkdown = async (e: Event) => {
      const customEvent = e as CustomEvent
      const content = customEvent.detail?.content || customEvent.detail?.markdownText
      if (content && editor) {
        const blocks = await editor.tryParseMarkdownToBlocks(content)
        const doc = editor.document || []
        const lastBlock = doc[doc.length - 1]
        if (lastBlock) {
          editor.insertBlocks(blocks, lastBlock, 'after')
        } else {
          editor.replaceBlocks(editor.document, blocks)
        }
      }
    }
    window.addEventListener('app:hwpx-parsed', handleHwpxParsed)
    window.addEventListener('app:insert-markdown', handleInsertMarkdown)
    return () => {
      window.removeEventListener('app:hwpx-parsed', handleHwpxParsed)
      window.removeEventListener('app:insert-markdown', handleInsertMarkdown)
    }
  }, [editor])

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    if (editorMode !== 'edit') return
    e.preventDefault()
    const selection = window.getSelection()
    const text = selection ? selection.toString() : ''
    setContextMenuState({
      isOpen: true,
      x: e.clientX,
      y: e.clientY,
      blockId: hoverBlock?.id || null,
      selectedText: text
    })
  }, [editorMode, hoverBlock])

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
    if (typeof window !== 'undefined') {
      const win = window as any
      if (!win.AMEVA_CORE) {
        win.AMEVA_CORE = {}
      }
      win.AMEVA_CORE.editor = editor
    }
    if (editor) {
      setActiveEditorInstance(editor);
      import('../features/ai-agent/adapters/EditorToolAdapter').then(({ editorToolAdapter }) => {
        editorToolAdapter.setEditor(editor);
      });
    }
  }, [editor, setActiveEditorInstance])

  // 에디터 내 블록 변경 감지 및 고아 문서 요약 태스크 자동 GC 회수 (SCRUM-173)
  useEffect(() => {
    if (!editor) return
    const syncBlocks = () => {
      try {
        const doc = editor.document
        if (Array.isArray(doc)) {
          const activeIds = doc.map((b: any) => b.id).filter(Boolean)
          useDocumentSummaryStore.getState().syncWithEditorBlocks(activeIds)
        }
      } catch {}
    }

    syncBlocks()
    const unsubscribe = editor.onChange(syncBlocks)
    return () => {
      if (typeof unsubscribe === 'function') unsubscribe()
    }
  }, [editor])

  // 코드 펜스, 작업 피어 포커스 레이어 및 파일 드롭 이미지 가로채기 구동
  useBacktickFence(editor)
  useCollaborationHighlight(editor, onBlockHighlight, editorContainerRef)
  useNativeUploadIntercept(editor, editorContainerRef)

  // 리치 커스텀 마크다운 블록 Backspace/Delete 즉각 삭제 방어 가드
  useEffect(() => {
    const container = editorContainerRef?.current
    if (!container || !editor) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Backspace' || e.key === 'Delete') {
        const selection = window.getSelection()
        const selectedEl = selection?.anchorNode instanceof HTMLElement ? selection.anchorNode : selection?.anchorNode?.parentElement
        const customBlockEl = selectedEl?.closest('[data-content-type="inlineDocument"], [data-content-type="map"], [data-content-type="kanban"], [data-content-type="drawing"], [data-content-type="chart"], [data-content-type="youtube"], [data-content-type="sqlite"], [data-content-type="excel"], [data-content-type="presentation"], [data-content-type="jupyter"], [data-content-type="aiDiff"]')
        
        const selectedBlocks = editor.getSelection()?.blocks || [editor.getTextCursorPosition()?.block].filter(Boolean)
        const customBlock = selectedBlocks.find((b: any) => [
          'inlineDocument', 'map', 'kanban', 'drawing', 'chart', 'youtube', 'sqlite', 'excel', 'presentation', 'jupyter', 'aiDiff'
        ].includes(b?.type))

        if (customBlock && !customBlockEl?.querySelector('input:focus, textarea:focus, [contenteditable="true"]:focus')) {
          const customTypeNames: Record<string, string> = {
            inlineDocument: '문서 (PDF/Word/Excel)',
            map: '인터랙티브 지도',
            kanban: '칸반 보드',
            drawing: '드로잉 캔버스',
            chart: '데이터 차트',
            youtube: 'YouTube 동영상',
            sqlite: 'SQLite 데이터베이스',
            excel: '엑셀 스프레드시트',
            presentation: '프레젠테이션',
            jupyter: 'Jupyter 노트북',
            aiDiff: 'AI 변경사항 비교',
          }
          const name = customTypeNames[customBlock.type] || customBlock.type
          e.preventDefault()
          e.stopPropagation()
          useUIStore.getState().openBlockDeleteConfirm(name, () => {
            editor.removeBlocks([customBlock])
          })
        }
      }
    }

    container.addEventListener('keydown', handleKeyDown, { capture: true })
    return () => container.removeEventListener('keydown', handleKeyDown, { capture: true })
  }, [editor, editorContainerRef])

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
      {FEATURE_FLAGS.ENABLE_SMARTDOCS && (
        <SmartDocsRibbon 
          editor={editor} 
          isSmartDocsMode={isSmartDocsMode} 
          onToggleMode={setIsSmartDocsMode} 
        />
      )}
      <div
        ref={editorContainerRef}
        onMouseMove={editorMode === 'welcome' ? undefined : handleEditorMouseMove}
        onMouseUp={editorMode === 'welcome' ? undefined : handleSelection}
        onKeyUp={editorMode === 'welcome' ? undefined : handleSelection}
        onDropCapture={onDropCapture}
        onPasteCapture={onPasteCapture}
        onContextMenu={handleContextMenu}
        className={`${!wordWrap ? 'wrap-disabled' : ''} ${pageViewMode !== 'continuous' ? `view-mode-${pageViewMode}` : ''}`}
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'stretch',
          overflow: pageViewMode !== 'continuous' ? 'hidden' : 'auto',
          padding: pageViewMode !== 'continuous'
            ? '0'
            : `40px 60px ${editorMode === 'raw' ? '40px' : '45vh'} 60px`,
          position: 'relative',
          userSelect: 'text',
          WebkitUserSelect: 'text',
          background: 'var(--bg-main)',
        }}
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
              background: 'linear-gradient(135deg, #2563eb 0%, #06b6d4 100%)',
              border: 'none',
              boxShadow: '0 2px 8px rgba(37, 99, 235, 0.4)',
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
            <React.Suspense fallback={<div style={{ padding: '20px', color: '#fff' }}>PDF 뷰어 로딩 중...</div>}>
              <PdfViewer
                pdfData={pdfData}
                fileName={pdfFileName || filePath?.split(/[\\/]/).pop() || 'document.pdf'}
                onConvertToAmeva={async () => {
                  if (!editor) return
                  // loadMarkdownIntoEditor 내부에서 pdfData(rawContent)를 파싱하여 에디터에 주입하고 모드를 전환함
                  await loadMarkdownIntoEditor(editor, pdfData, true, pdfFileName || filePath || 'document.pdf')
                  setPdfData(null)
                  setPdfFileName(null)
                }}
                onInsertReport={async (reportText) => {
                  if (!editor) return
                  await loadMarkdownIntoEditor(editor, reportText, false, `[AI 요약] ${pdfFileName || 'document.pdf'}`)
                  setPdfData(null)
                  setPdfFileName(null)
                }}
              />
            </React.Suspense>
          </div>
        ) : editorMode === 'welcome' ? (
          <WelcomeBanner
            onStartWelcomeEdit={handleStartWelcomeEdit}
            onStartNewDocument={handleStartNewDocument}
            onOpenFile={handleOpenFile}
            currentContent={currentContent}
            editor={editor}
          />
        ) : (pageViewMode !== 'continuous') ? (
          /* 1장/2장/3장/페이지나누기: 진짜 BlockNoteView 기반 가로 페이징 (< > 넘김, 지도/유튜브/칸반/엑셀 100% 온전 구동) */
          <div className={`editor-book-canvas mode-${pageViewMode}`}>
            <div
              ref={bookViewportRef}
              className="editor-book-viewport"
              onWheel={(e) => {
                if (pageViewMode !== 'dual' && pageViewMode !== 'triple') return
                if (Math.abs(e.deltaY) > 25 && bookViewportRef.current) {
                  const vp = bookViewportRef.current
                  const pitch = getSpreadPitch(vp)
                  if (pitch <= 0) return
                  const maxScroll = Math.max(0, vp.scrollWidth - vp.clientWidth)
                  const maxSpread = Math.max(0, Math.ceil(maxScroll / pitch))
                  const currentIdx = Math.round(vp.scrollLeft / pitch)
                  const targetIdx = e.deltaY > 0 ? Math.min(maxSpread, currentIdx + 1) : Math.max(0, currentIdx - 1)
                  currentSpreadIdxRef.current = targetIdx
                  setCurrentSpreadIdx(targetIdx)
                  vp.scrollTo({ left: targetIdx * pitch, behavior: 'smooth' })
                }
              }}
            >
              <div className="editor-paper-sheet">
                <BlockNoteView
                  editor={editor}
                  theme={theme === 'white' ? 'light' : 'dark'}
                  editable={editorMode === 'edit'}
                  slashMenu={false}
                  sideMenu={false}
                >
                  {editorMode === 'edit' && (
                    <>
                      <PersistentSideMenuController
                        sideMenu={SafeCustomSideMenu}
                        portalElement={editorContainerRef.current || (typeof document !== 'undefined' ? document.body : undefined)}
                        floatingUIOptions={{
                          useFloatingOptions: {
                            placement: 'left',
                            strategy: 'fixed',
                          },
                          useHoverProps: {
                            delay: { open: 50, close: 400 },
                          }
                        }}
                      />
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
                    </>
                  )}
                </BlockNoteView>
              </div>
            </div>

            {/* 하단 플로팅 < 이전 / 다음 > 가로 페이징 컨트롤러 (2장 / 3장 전용) */}
            {(pageViewMode === 'dual' || pageViewMode === 'triple') && (
              <div
                style={{
                  position: 'fixed',
                  bottom: '24px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  zIndex: 100,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  background: 'var(--bg-card)',
                  color: 'var(--text-main)',
                  border: '1px solid var(--border-muted)',
                  borderRadius: '30px',
                  padding: '6px 24px',
                  boxShadow: '0 8px 30px rgba(0,0,0,0.18)',
                }}
              >
                <button
                  onClick={() => {
                    if (bookViewportRef.current) {
                      const vp = bookViewportRef.current
                      const pitch = getSpreadPitch(vp)
                      if (pitch <= 0) return
                      const currentIdx = Math.round(vp.scrollLeft / pitch)
                      const targetIdx = Math.max(0, currentIdx - 1)
                      currentSpreadIdxRef.current = targetIdx
                      setCurrentSpreadIdx(targetIdx)
                      vp.scrollTo({ left: targetIdx * pitch, behavior: 'smooth' })
                    }
                  }}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--text-main)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '12px',
                    fontWeight: 800,
                    padding: '4px 8px',
                  }}
                >
                  <ChevronLeft size={16} />
                  <span>이전</span>
                </button>

                <span style={{ fontSize: '12px', fontWeight: 800, color: 'var(--primary)', letterSpacing: '0.5px' }}>
                  {pageViewMode === 'dual' ? `📖 2장 펼침 (${currentSpreadIdx * 2 + 1} - ${currentSpreadIdx * 2 + 2}쪽)` : `📚 3장 와이드 (${currentSpreadIdx * 3 + 1} - ${currentSpreadIdx * 3 + 3}쪽)`}
                </span>

                <button
                  onClick={() => {
                    if (bookViewportRef.current) {
                      const vp = bookViewportRef.current
                      const pitch = getSpreadPitch(vp)
                      if (pitch <= 0) return
                      const maxScroll = Math.max(0, vp.scrollWidth - vp.clientWidth)
                      const maxSpread = Math.max(0, Math.ceil(maxScroll / pitch))
                      const currentIdx = Math.round(vp.scrollLeft / pitch)
                      const targetIdx = Math.min(maxSpread, currentIdx + 1)
                      currentSpreadIdxRef.current = targetIdx
                      setCurrentSpreadIdx(targetIdx)
                      vp.scrollTo({ left: targetIdx * pitch, behavior: 'smooth' })
                    }
                  }}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--text-main)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '12px',
                    fontWeight: 800,
                    padding: '4px 8px',
                  }}
                >
                  <span>다음</span>
                  <ChevronRight size={16} />
                </button>
              </div>
            )}
          </div>
        ) : (editorMode === 'edit' || editorMode === 'preview') ? (
          /* 연속 모드: 예전 그대로 순수 오리지널 BlockNoteView 렌더링 (래퍼 없음) */
          <BlockNoteView
            editor={editor}
            theme={theme === 'dark' ? 'dark' : 'light'}
            editable={editorMode === 'edit'}
            slashMenu={false}
            sideMenu={false}
          >
            {editorMode === 'edit' && (
              <>
                <PersistentSideMenuController
                  sideMenu={SafeCustomSideMenu}
                  portalElement={editorContainerRef.current || (typeof document !== 'undefined' ? document.body : undefined)}
                  floatingUIOptions={{
                    useFloatingOptions: {
                      placement: 'left',
                      strategy: 'fixed',
                    },
                    useHoverProps: {
                      delay: { open: 50, close: 400 },
                    }
                  }}
                />
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
                    const allItems = [...peerItems, ...docItems]
                    return allItems.filter(item => item.title.toLowerCase().includes(query.toLowerCase()))
                  }}
                />
                <SuggestionMenuController
                  triggerCharacter="#"
                  getItems={async (query) => {
                    if (!editor) return []
                    const headingBlocks = editor.document.filter(b => b.type === 'heading')
                    const items = headingBlocks.map(b => {
                      const textContent = b.content && Array.isArray(b.content)
                        ? b.content.map((c: any) => c.text).join('')
                        : '제목 없음'
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
              </>
            )}
          </BlockNoteView>
        ) : (
          /* RAW 마크다운 원문 텍스트 영역 직접 편집 뷰 */
          <div style={{
            width: '100%',
            flex: 1,
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
                flex: 1,
                background: 'var(--bg-card)',
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

      {hwpxModalData && (
        <React.Suspense fallback={null}>
          <HwpxViewerModal
            opened={!!hwpxModalData}
            onClose={() => setHwpxModalData(null)}
            parsedData={hwpxModalData}
            onInsertToEditor={(paragraphs) => {
              if (!editor) return
              const blocks = paragraphs.map((p: string) => ({ type: 'paragraph', content: p }))
              editor.insertBlocks(blocks as any, editor.getTextCursorPosition().block, 'after')
            }}
          />
        </React.Suspense>
      )}
      {contextMenuState.isOpen && (
        <AIContextMenu
          contextMenuState={contextMenuState}
          setContextMenuState={setContextMenuState}
          hoverBlock={hoverBlock}
          editor={editor}
          isMainReady={isMainReady}
          isGhostReady={isGhostReady}
          isMainLoading={isMainLoading}
          isGhostLoading={isGhostLoading}
          mainProgressText={mainProgressText}
          ghostProgressText={ghostProgressText}
          pMain={pMain}
          pGhost={pGhost}
          pendingModelId={pendingModelId}
          setPendingModelId={setPendingModelId}
          initModel={initModel}
          ghostTextEnabled={ghostTextEnabled}
          setGhostTextEnabled={setGhostTextEnabled}
          executeAction={executeAction}
        />
      )}
    </div>
  )
}
export { PeerBlockHighlightLayer } from './editor/PeerBlockHighlightLayer'
export { getCustomSlashMenuItems } from './editor/customSlashMenuItems'
export { WelcomeBanner } from './editor/WelcomeBanner'

