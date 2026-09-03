/**
 * ============================================================================
 * @file MenuBar.tsx
 * @description MenuBar.tsx 시스템 모듈 구성요소로, 관련 UI 렌더링 및 비즈니스 로직을 담당합니다.
 * @usage 문서 에디터 및 뷰어 내부에서 동적으로 호출되거나 유틸리티 함수로 사용됩니다.
 * @example
 * // 예시 로직 (자동 생성됨)
 * import { something } from './MenuBar';
 * 
 * @created 2026-08-10 20:30:36
 * @updated 2026-08-10 20:30:36
 * @author uno-km
 * @commit docs: 전체 소스코드 한글 주석 및 사내 컨벤션 일괄 적용
 * ============================================================================
 */

/**
 * @file MenuBar.tsx
 * @system AMEVA OS Desktop Workstation
 * @location src/renderer/components/MenuBar.tsx
 * @role Core module helper and integration logic
 * 
 * [소비처 - CONSUMERS / USAGE CONTEXT]
 * - 소비처 A (src/renderer/AppLayout.tsx): 레이아웃 그리드 내부 또는 플로팅 레이어 영역 내에서 그리기로 소비.
 * - 소비처 B (src/renderer/App.tsx): 전역 모달 매니저 및 뷰포트 상태 스위칭에 따라 동적 마운트되어 소비.
 * 
 * [책임 범위 - RESPONSIBILITY]
 * - 본 파일은 AMEVA 시스템 내에서 도메인 목적에 부합하는 연산 및 데이터 처리 흐름을 안전하게 캡슐화한다.
 * - 외부 라이브러리 및 하위 종속성을 조율하고 결과 규격을 일관되게 제공한다.
 * 
 * [절대 깨면 안 되는 계약 - CONTRACT]
 * - MUST: 모든 예외 발생 시 에러를 침묵시키지 말고 에러 로그를 명확하게 남길 것.
 * - MUST NOT: TypeScript any 형식을 우회 수단으로 함부로 선언하지 말 것.
 */

// [외부 패키지 및 라이브러리 임포트: react]
import React, { useState, useEffect, useRef } from 'react'
// [외부 패키지 및 라이브러리 임포트: lucide-react]
import { Check, LayoutGrid, PanelLeft, PanelBottom, PanelRight, Search, Settings, ChevronDown, RefreshCw, LogOut, Languages, Sun, Moon, Monitor } from 'lucide-react'
import { useTranslation } from '../i18n/useTranslation'

// [내부 프로젝트 의존성 모듈 임포트: ../hooks/app/useMenuBarShortcuts]
import { useMenuBarShortcuts } from '../hooks/app/useMenuBarShortcuts'

// [내부 프로젝트 의존성 모듈 임포트: ./SecurityModal]
import { SecurityModal } from './SecurityModal'

// [내부 프로젝트 의존성 모듈 임포트: ../contexts/AppContext]
import { useAppContext } from '../contexts/AppContext'
// [내부 프로젝트 의존성 모듈 임포트: ../stores/useWorkspaceStore]
import { useWorkspaceStore } from '../stores/useWorkspaceStore'
// [내부 프로젝트 의존성 모듈 임포트: ../stores/useProcessStore]
import { useProcessStore } from '../stores/useProcessStore'
// [내부 프로젝트 의존성 모듈 임포트: ../stores/useUIStore]
import { useUIStore } from '../stores/useUIStore'
// [내부 프로젝트 의존성 모듈 임포트: ../services/ipc/electronApiAdapter]
import * as ipc from '../services/ipc/electronApiAdapter'

/**
 * MenuBarProps 모듈 내외부에서 사용되는 데이터 통신 규격 및 타입을 정의합니다.
 * @remarks 이 주석은 컨벤션에 따라 자동 생성된 문서화 내용입니다.
 */
export interface MenuBarProps {}

  /*
   * [FUNCTION CONTRACT]
   * - 함수 명: `MenuBar`
   * - 역할: 인자 정보를 검수하고 비즈니스 계약 조건에 맞춰 최종 바인딩 결과물/바이너리 버퍼를 반환함.
   * - 예시: `MenuBar(...)` 호출 시 런타임 비동기/동기 연쇄 반응 유도.
   */
/**
 * MenuBar 함수의 핵심 비즈니스 로직 및 상태 제어를 처리합니다.
 * @remarks 이 주석은 컨벤션에 따라 자동 생성된 문서화 내용입니다.
 */
export function MenuBar({}: MenuBarProps = {}) {
  const {
    handleOpenFile: onOpenFile,
    handleSaveFile: onSaveFile,
    handleSaveAsFile: onSaveAs,
    handleExport,
    handleCloseApp: onCloseApp,
    editorMode,
    handleSwitchMode: setEditorMode,
    handleZoomIn: onZoomIn,
    handleZoomOut: onZoomOut,
    handleZoomReset: onZoomReset,
    handleToggleFullscreen: onToggleFullscreen,
    handleOpenGithub: onOpenGithub,
    settings,
    handleUpdateSettings,
    setUsername,
  } = useAppContext()
  
  const {
    showStatusBar, setShowStatusBar,
    showSidebar, setShowSidebar,
    showAIPanel, toggleAIPanel,
    showFindReplace, toggleFindReplace,
    setIsSettingsOpen, setIsAboutOpen, setIsDocHubOpen, setIsGuideOpen,
    setShowMarketplaceModal, setShowPricingModal,
    dynamicMenus
  } = useUIStore()

  const { t, language, toggleLanguage, isKorean } = useTranslation()
  const filePath = useWorkspaceStore((state) => state.filePath)
  const isSplitView = useWorkspaceStore((state) => state.isSplitView)
  const toggleSplitView = useWorkspaceStore((state) => state.toggleSplitView)
  const canAccessMarketplace = true
  const [googlePopoverOpen, setGooglePopoverOpen] = useState(false)
  const [googleProfile, setGoogleProfile] = useState<any | null>(null)
  const [isSecurityModalOpen, setIsSecurityModalOpen] = useState(false)

  // 🦾 [AUTO AUTH RETRIEVAL] 마운트 시 구글 로그인 영속 세션 자동 수신
  useEffect(() => {
    const checkGoogleSession = async () => {
      if (window.electronAPI?.googleAuthGetStatus) {
        try {
          const res = await window.electronAPI.googleAuthGetStatus()
          if (res.success && res.user) {
            setGoogleProfile(res.user)
            setUsername(res.user.name)
          }
        } catch (err) {
          console.error('[MenuBar] 자동 구글 세션 체크 오류:', err)
        }
      }
    }
    checkGoogleSession()
  }, [])

      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `hotkeys`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const hotkeys = ...` 형태로 안전 캐싱 후 가공 기동.
       */
  const hotkeys = settings?.hotkeys
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `showConsole`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const showConsole = ...` 형태로 안전 캐싱 후 가공 기동.
       */
  const showConsole = settings?.showCodeConsole || false
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `setShowConsole`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const setShowConsole = ...` 형태로 안전 캐싱 후 가공 기동.
       */
  const setShowConsole = (val: boolean) => handleUpdateSettings({ showCodeConsole: val })
  
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `onPrint`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const onPrint = ...` 형태로 안전 캐싱 후 가공 기동.
       */
  const onPrint = () => handleExport('pdf')
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `onNewWindow`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const onNewWindow = ...` 형태로 안전 캐싱 후 가공 기동.
       */
  const onNewWindow = ipc.newWindow
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `onOpenSettings`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const onOpenSettings = ...` 형태로 안전 캐싱 후 가공 기동.
       */
  const onOpenSettings = () => setIsSettingsOpen(true)
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `onOpenAbout`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const onOpenAbout = ...` 형태로 안전 캐싱 후 가공 기동.
       */
  const onOpenAbout = () => setIsAboutOpen(true)
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `onOpenGuide`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const onOpenGuide = ...` 형태로 안전 캐싱 후 가공 기동.
       */
  const onOpenGuide = () => setIsGuideOpen(true)
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `onOpenMarketplace`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const onOpenMarketplace = ...` 형태로 안전 캐싱 후 가공 기동.
       */
  const onOpenMarketplace = () => setShowMarketplaceModal(true)
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `onOpenPricing`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const onOpenPricing = ...` 형태로 안전 캐싱 후 가공 기동.
       */
  const onOpenPricing = () => setShowPricingModal(true)
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `formatHotkey`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const formatHotkey = ...` 형태로 안전 캐싱 후 가공 기동.
       */
  const formatHotkey = (raw: string | undefined): string => {
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `!raw`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (!raw)` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
    if (!raw) return ''
    return raw
      .replace('Control', 'Ctrl')
      .replace('Shift', 'Shift')
      .replace('Alt', 'Alt')
      .replace('Meta', 'Cmd')
      .split('+')
      .map(p => p.charAt(0).toUpperCase() + p.slice(1))
      .join('+')
  }

      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `hkeys`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const hkeys = ...` 형태로 안전 캐싱 후 가공 기동.
       */
  const hkeys = hotkeys || {
    save: 'Control+s',
    open: 'Control+o',
    newFile: 'Control+n',
    pdfExport: 'Control+p',
    toggleAI: 'Control+\\',
    toggleMode: 'Control+h',
    zoomIn: 'Control+=',
    zoomOut: 'Control+-',
    zoomReset: 'Control+0'
  }
  const [activeMenu, setActiveMenu] = useState<string | null>(null)
  const [isAltMode, setIsAltMode] = useState(false)
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `containerRef`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const containerRef = ...` 형태로 안전 캐싱 후 가공 기동.
       */
  const containerRef = useRef<HTMLDivElement | null>(null)

  // 외부 클릭 시 드롭다운 메뉴 및 Alt 모드 해제
  useEffect(() => {
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `handleClickOutside`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const handleClickOutside = ...` 형태로 안전 캐싱 후 가공 기동.
       */
    const handleClickOutside = (e: MouseEvent) => {
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `containerRef.current && !containerRef.current.contains(e.target as Node)`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (containerRef.current && !containerRef.current.contains(e.target as Node))` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setActiveMenu(null)
        setIsAltMode(false)
        setGooglePopoverOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `triggerAction`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const triggerAction = ...` 형태로 안전 캐싱 후 가공 기동.
       */
  const triggerAction = (action?: () => void) => {
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `action) action(`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (action) action()` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
    if (action) action()
    setActiveMenu(null)
    setIsAltMode(false)
  }

  // Alt 메뉴 핫키 라우팅 커스텀 훅으로 위임 (관심사 분리)
  useMenuBarShortcuts({
    isAltMode, activeMenu, editorMode, showStatusBar, showSidebar, showConsole, canAccessMarketplace,
    setIsAltMode, setActiveMenu, triggerAction,
    onNewWindow, onOpenFile, onSaveFile, onSaveAs, onPrint, onCloseApp,
    setEditorMode, setShowStatusBar, setShowSidebar, setShowConsole,
    onZoomIn, onZoomOut, onZoomReset, onToggleFullscreen,
    onOpenSettings, onOpenMarketplace, onOpenAbout, onOpenGuide, onOpenPricing, onOpenGithub
  })

      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `handleMenuClick`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const handleMenuClick = ...` 형태로 안전 캐싱 후 가공 기동.
       */
  const handleMenuClick = (menu: string) => {
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `activeMenu === menu`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (activeMenu === menu)` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
    if (activeMenu === menu) {
      setActiveMenu(null)
      setIsAltMode(false)
    } else {
      setActiveMenu(menu)
      setIsAltMode(true)
    }
  }

      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `renderLabel`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const renderLabel = ...` 형태로 안전 캐싱 후 가공 기동.
       */
  const renderLabel = (text: string, shortcut: string) => {
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `!isAltMode`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (!isAltMode)` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
    if (!isAltMode) return <span>{text}</span>
    
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `index`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const index = ...` 형태로 안전 캐싱 후 가공 기동.
       */
    const index = text.toLowerCase().indexOf(shortcut.toLowerCase())
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `index === -1`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (index === -1)` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
    if (index === -1) return <span>{text}</span>
    
    return (
      <span>
        {text.slice(0, index)}
        <u style={{ textUnderlineOffset: '3px' }}>{text[index]}</u>
        {text.slice(index + 1)}
      </span>
    )
  }

  const menuStyle: React.CSSProperties = {
    background: 'transparent',
    border: 'none',
    color: 'var(--text-main)',
    fontSize: '12px',
    padding: '4px 10px',
    borderRadius: '4px',
    cursor: 'pointer',
    fontFamily: 'var(--font-sans)',
    fontWeight: 500,
    outline: 'none',
    transition: 'var(--transition-fast)',
  }

  const dropdownStyle: React.CSSProperties = {
    position: 'absolute',
    top: '26px',
    left: '0',
    backgroundColor: 'var(--bg-main)',
    backdropFilter: 'blur(15px)',
    border: '1px solid var(--border-glow)',
    boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
    borderRadius: '6px',
    padding: '4px 0',
    minWidth: '280px',
    width: 'max-content',
    display: 'flex',
    flexDirection: 'column',
    zIndex: 1000,
  }

  const itemStyle: React.CSSProperties = {
    background: 'transparent',
    border: 'none',
    color: 'var(--text-main)',
    fontSize: '12px',
    padding: '6px 16px',
    textAlign: 'left',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    fontFamily: 'var(--font-sans)',
    outline: 'none',
    whiteSpace: 'nowrap',
  }

  const shortcutStyle: React.CSSProperties = {
    fontSize: '10px',
    color: 'var(--text-dark)',
    marginLeft: '12px',
  }

  return (
    <div
      ref={containerRef}
      className="menu-bar-container"
    >
      {/* 1. 좌측 영역: 앱 로고 + 풀다운 메뉴바 */}
      <div className="menu-bar-left">
        {/* AMEVA OS 로고 (삼각형 폴리곤) */}
        <div className="menu-bar-logo">
          <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="12 2 2 22 22 22" />
          </svg>
        </div>

        <div className="menu-items-row">
          {/* 1.1 File 메뉴 */}
          <div style={{ position: 'relative' }}>
            <button
              style={{
                ...menuStyle,
                backgroundColor: activeMenu === 'file' ? 'var(--bg-glass-active)' : 'transparent',
              }}
              onClick={() => handleMenuClick('file')}
            >
              {renderLabel(t.menu.file, 'f')}
            </button>
            {activeMenu === 'file' && (
              <div style={dropdownStyle}>
                <button style={itemStyle} onClick={() => triggerAction(onNewWindow)}>
                  {renderLabel(t.menu.fileNewWindow, 'n')}
                  <span style={shortcutStyle}>{formatHotkey(hkeys.newFile)}</span>
                </button>
                <div style={{ height: '1px', backgroundColor: 'var(--border-muted)', margin: '4px 0' }} />
                <button style={itemStyle} onClick={() => triggerAction(onOpenFile)}>
                  {renderLabel(t.menu.fileOpen, 'o')}
                  <span style={shortcutStyle}>{formatHotkey(hkeys.open)}</span>
                </button>
                <button style={itemStyle} onClick={() => triggerAction(onSaveFile)}>
                  {renderLabel(t.menu.fileSave, 's')}
                  <span style={shortcutStyle}>{formatHotkey(hkeys.save)}</span>
                </button>
                <button style={itemStyle} onClick={() => triggerAction(onSaveAs)}>
                  {renderLabel(t.menu.fileSaveAs, 'a')}
                </button>
                <div style={{ height: '1px', backgroundColor: 'var(--border-muted)', margin: '4px 0' }} />
                <button style={itemStyle} onClick={() => triggerAction(onPrint)}>
                  {renderLabel(t.menu.filePrintPdf, 'p')}
                  <span style={shortcutStyle}>{formatHotkey(hkeys.pdfExport)}</span>
                </button>
                <div style={{ height: '1px', backgroundColor: 'var(--border-muted)', margin: '4px 0' }} />
                <button style={itemStyle} onClick={() => { triggerAction(); setIsSecurityModalOpen(true); }}>
                  {renderLabel(t.menu.fileSecurity, 'c')}
                </button>
                <div style={{ height: '1px', backgroundColor: 'var(--border-muted)', margin: '4px 0' }} />
                <button style={{ ...itemStyle, color: 'var(--danger)' }} onClick={() => triggerAction(onCloseApp)}>
                  {renderLabel(t.menu.fileQuit, 'x')}
                  <span style={shortcutStyle}>Alt+F4</span>
                </button>
              </div>
            )}
          </div>

          {/* 1.2 View 메뉴 */}
          <div style={{ position: 'relative' }}>
            <button
              style={{
                ...menuStyle,
                backgroundColor: activeMenu === 'view' ? 'var(--bg-glass-active)' : 'transparent',
              }}
              onClick={() => handleMenuClick('view')}
            >
              {renderLabel(t.menu.view, 'v')}
            </button>
            {activeMenu === 'view' && (
              <div style={dropdownStyle}>
                <button
                  style={itemStyle}
                  onClick={() => triggerAction(() => setEditorMode(editorMode === 'preview' ? 'edit' : 'preview'))}
                >
                  {renderLabel(t.menu.viewToggleMode, 'e')}
                </button>
                <div style={{ height: '1px', backgroundColor: 'var(--border-muted)', margin: '4px 0' }} />
                <button style={itemStyle} onClick={() => triggerAction(toggleSplitView)}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {isSplitView ? <Check size={12} style={{ color: 'var(--primary)' }} /> : <span style={{ width: '12px' }} />}
                    {renderLabel(t.menu.viewSplitView, 's')}
                  </span>
                </button>
                <div style={{ height: '1px', backgroundColor: 'var(--border-muted)', margin: '4px 0' }} />
                <button style={itemStyle} onClick={() => triggerAction(() => setShowStatusBar(!showStatusBar))}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {showStatusBar ? <Check size={12} style={{ color: 'var(--primary)' }} /> : <span style={{ width: '12px' }} />}
                    {renderLabel(t.menu.viewShowStatusBar, 't')}
                  </span>
                </button>
                <button style={itemStyle} onClick={() => triggerAction(() => setShowSidebar(!showSidebar))}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {showSidebar ? <Check size={12} style={{ color: 'var(--primary)' }} /> : <span style={{ width: '12px' }} />}
                    {renderLabel(t.menu.viewShowSidebar, 'b')}
                  </span>
                </button>
                <button style={itemStyle} onClick={() => triggerAction(() => setShowConsole(!showConsole))}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {showConsole ? <Check size={12} style={{ color: 'var(--primary)' }} /> : <span style={{ width: '12px' }} />}
                    {renderLabel(t.menu.viewShowConsole, 'c')}
                  </span>
                </button>
              </div>
            )}
          </div>

          {/* 1.3 Window 메뉴 */}
          <div style={{ position: 'relative' }}>
            <button
              style={{
                ...menuStyle,
                backgroundColor: activeMenu === 'window' ? 'var(--bg-glass-active)' : 'transparent',
              }}
              onClick={() => handleMenuClick('window')}
            >
              {renderLabel(t.menu.window, 'w')}
            </button>
            {activeMenu === 'window' && (
              <div style={dropdownStyle}>
                <button style={itemStyle} onClick={() => triggerAction(onZoomIn)}>
                  {renderLabel(t.menu.windowZoomIn, 'i')}
                  <span style={shortcutStyle}>{formatHotkey(hkeys.zoomIn)}</span>
                </button>
                <button style={itemStyle} onClick={() => triggerAction(onZoomOut)}>
                  {renderLabel(t.menu.windowZoomOut, 'o')}
                  <span style={shortcutStyle}>{formatHotkey(hkeys.zoomOut)}</span>
                </button>
                <button style={itemStyle} onClick={() => triggerAction(onZoomReset)}>
                  {renderLabel(t.menu.windowZoomReset, 'r')}
                  <span style={shortcutStyle}>{formatHotkey(hkeys.zoomReset)}</span>
                </button>
                <div style={{ height: '1px', backgroundColor: 'var(--border-muted)', margin: '4px 0' }} />
                <button style={itemStyle} onClick={() => triggerAction(onToggleFullscreen)}>
                  {renderLabel(t.menu.windowFullscreen, 'f')}
                  <span style={shortcutStyle}>F11</span>
                </button>
              </div>
            )}
          </div>

          {/* 1.4 Settings 메뉴 */}
          <div style={{ position: 'relative' }}>
            <button
              style={menuStyle}
              onClick={() => triggerAction(onOpenSettings)}
            >
              {renderLabel(t.menu.settings, 's')}
            </button>
          </div>

          {/* 1.5 Marketplace 메뉴 */}
          {canAccessMarketplace && (
            <div style={{ position: 'relative' }}>
              <button
                style={menuStyle}
                onClick={() => triggerAction(onOpenMarketplace)}
              >
                {renderLabel(t.menu.marketplace, 'm')}
              </button>
            </div>
          )}

          {/* 1.6 Help 메뉴 */}
          <div style={{ position: 'relative' }}>
            <button
              style={{
                ...menuStyle,
                backgroundColor: activeMenu === 'help' ? 'var(--bg-glass-active)' : 'transparent',
              }}
              onClick={() => handleMenuClick('help')}
            >
              {renderLabel(t.menu.help, 'h')}
            </button>
            {activeMenu === 'help' && (
              <div style={dropdownStyle}>
                <button 
                  style={itemStyle} 
                  onClick={() => triggerAction(() => setIsDocHubOpen(true, 'readme'))}
                >
                  <span style={{ color: '#38bdf8', fontWeight: 700 }}>
                    {renderLabel(t.menu.helpDocHub, 'd')}
                  </span>
                </button>
                <button 
                  style={itemStyle} 
                  onClick={() => triggerAction(() => window.open('/promo/index.html', '_blank'))}
                >
                  <span style={{ color: '#60a5fa', fontWeight: 600 }}>
                    {renderLabel(t.menu.helpShowcase, 'w')}
                  </span>
                </button>
                <button 
                  style={itemStyle} 
                  onClick={() => triggerAction(onOpenGithub)}
                >
                  <span style={{ color: '#f59e0b', fontWeight: 600 }}>
                    {renderLabel(t.menu.helpGithub, 'h')}
                  </span>
                </button>
                <div style={{ height: '1px', backgroundColor: 'var(--border-muted)', margin: '4px 0' }} />
                <button 
                  style={itemStyle} 
                  onClick={() => triggerAction(() => setIsDocHubOpen(true, 'ir'))}
                >
                  <span style={{ color: '#34d399', fontWeight: 600 }}>
                    {renderLabel(t.menu.helpPitchDeck, 'i')}
                  </span>
                </button>
                <button 
                  style={itemStyle} 
                  onClick={() => triggerAction(() => setIsDocHubOpen(true, 'psst'))}
                >
                  {renderLabel(t.menu.helpPsst, 'b')}
                </button>
                <button 
                  style={itemStyle} 
                  onClick={() => triggerAction(() => setIsDocHubOpen(true, 'arch'))}
                >
                  {renderLabel(t.menu.helpArch, 's')}
                </button>
                <div style={{ height: '1px', backgroundColor: 'var(--border-muted)', margin: '4px 0' }} />
                <button style={itemStyle} onClick={() => triggerAction(onOpenAbout)}>
                  {renderLabel(t.menu.helpAbout, 'a')}
                </button>
                <button style={itemStyle} onClick={() => triggerAction(onOpenGuide)}>
                  {renderLabel(t.menu.helpGuide, 'g')}
                </button>
                <button style={itemStyle} onClick={() => triggerAction(onOpenPricing)}>
                  <span style={{ color: 'var(--primary)', fontWeight: 700 }}>
                    {renderLabel(t.menu.helpPricing, 'p')}
                  </span>
                </button>
                <button style={itemStyle} onClick={() => triggerAction(onOpenGithub)}>
                  {renderLabel(t.menu.helpContact, 'c')}
                </button>
              </div>
            )}
          </div>

          {/* 1.7 Dynamic Plugin Menus */}
          {dynamicMenus.map((menu) => (
            <div key={menu.id} style={{ position: 'relative' }}>
              <button
                style={{ ...menuStyle, color: 'var(--primary)' }}
                onClick={() => triggerAction(menu.action)}
              >
                {menu.label}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* 2. 중앙 영역: 현재 열린 파일 경로 표기 (Antigravity 스타일 대시 구분선 적용) */}
      <div className="menu-bar-center">
        <span className="file-name">
          {filePath ? filePath.split(/[/\\]/).pop() : t.common.untitledDoc}
        </span>
        <span style={{ color: 'var(--text-dark)', opacity: 0.5, fontSize: '11px', margin: '0 4px' }}>-</span>
        <span style={{ color: 'var(--text-dark)' }}>AMEVA Workstation</span>
      </div>

      {/* 3. 우측 영역: Antigravity 레이아웃 구성 + 검색 + 언어전환 + 브라우저열기 + 설정 + 구글계정관리 */}
      <div className="menu-bar-right">
        {/* (1) 레이아웃 전환 버튼 그룹 (4개) */}
        <div className="layout-btn-group">
          {/* 전체 패널 복원 / 리셋 */}
          <button 
            className={`layout-btn ${(showSidebar && showAIPanel) ? 'active' : ''}`}
            onClick={() => {
              const target = !(showSidebar && showAIPanel)
              setShowSidebar(target)
              if (showAIPanel !== target) toggleAIPanel()
            }}
            title={t.toolbar.toggleLayout}
          >
            <LayoutGrid size={13} />
          </button>

          {/* 사이드바 토글 */}
          <button 
            className={`layout-btn ${showSidebar ? 'active' : ''}`}
            onClick={() => setShowSidebar(!showSidebar)}
            title={t.toolbar.toggleSidebar}
          >
            <PanelLeft size={13} />
          </button>
          
          {/* 하단 코드 콘솔 토글 */}
          <button 
            className={`layout-btn ${showConsole ? 'active' : ''}`}
            onClick={() => setShowConsole(!showConsole)}
            title={t.toolbar.toggleConsole}
          >
            <PanelBottom size={13} />
          </button>

          {/* AI 패널 토글 */}
          <button 
            className={`layout-btn ${showAIPanel ? 'active' : ''}`}
            onClick={toggleAIPanel}
            title={t.toolbar.toggleAIPanel}
          >
            <PanelRight size={13} />
          </button>
        </div>

        {/* (2) 검색 돋보기 단추 */}
        <button 
          className={`layout-btn ${showFindReplace ? 'active' : ''}`}
          onClick={toggleFindReplace}
          title={t.toolbar.findReplace}
        >
          <Search size={13} />
        </button>

        {/* (3) 언어 빠른 전환 버튼 (KOR / ENG) */}
        <button
          className="layout-btn"
          onClick={toggleLanguage}
          title={t.toolbar.switchLangTooltip}
          style={{
            fontSize: '10.5px',
            fontWeight: 700,
            padding: '2px 6px',
            gap: '3px',
            color: 'var(--primary)',
            border: '1px solid var(--border-muted)',
            borderRadius: '4px',
            width: 'auto',
            height: '24px',
          }}
        >
          <Languages size={12} />
          <span>{t.toolbar.switchLang}</span>
        </button>

        {/* (3.5) 테마 빠른 전환 버튼 (Dark / White / Retro) */}
        <button
          className="layout-btn"
          onClick={() => {
            const currentTheme = settings?.theme || 'dark'
            const themeCycle: ('dark' | 'white' | 'win98')[] = ['dark', 'white', 'win98']
            const currentIndex = themeCycle.indexOf(currentTheme as any)
            const nextTheme = themeCycle[(currentIndex + 1) % themeCycle.length]
            handleUpdateSettings({ theme: nextTheme })
            document.documentElement.setAttribute('data-theme', nextTheme)
            document.body.setAttribute('data-theme', nextTheme)
            try {
              localStorage.setItem('theme', nextTheme)
            } catch {}
          }}
          title={t.googlePopover.themeToggleTooltip}
          style={{
            fontSize: '10.5px',
            fontWeight: 700,
            padding: '2px 6px',
            gap: '4px',
            color: 'var(--text-main)',
            border: '1px solid var(--border-muted)',
            borderRadius: '4px',
            width: 'auto',
            height: '24px',
          }}
        >
          {(settings?.theme === 'white') ? (
            <Sun size={12} style={{ color: '#f59e0b' }} />
          ) : (settings?.theme === 'win98') ? (
            <Monitor size={12} style={{ color: '#10b981' }} />
          ) : (
            <Moon size={12} style={{ color: '#60a5fa' }} />
          )}
          <span>
            {settings?.theme === 'white' ? 'White' : settings?.theme === 'win98' ? 'Retro' : 'Dark'}
          </span>
        </button>

        {/* 유틸리티 액션 그룹 (크롬 브라우저, 설정, 구글 계정 아바타) */}
        <div className="toolbar-utility-group" style={{ display: 'flex', alignItems: 'center', gap: '6px', marginLeft: '2px' }}>
          {/* (4) AMEVA Browser 앱 기동 단추 */}
          <button 
            className="layout-btn"
            onClick={async () => {
              try {
                await ipc.executeTerminal(
                  'Start-Process cmd.exe -ArgumentList "/c npm start" -WorkingDirectory "c:/Users/GAME/Desktop/uno-km/dev/AMEVA-Egde-Brower" -WindowStyle Hidden'
                )
              } catch (err) {
                console.error('[MenuBar] AMEVA-Egde-Brower 앱 기동 실패:', err)
              }
            }}
            title={t.toolbar.launchBrowser}
            style={{ width: '26px', height: '26px' }}
          >
            <svg viewBox="0 0 24 24" style={{ width: '13px', height: '13px', fill: 'none', stroke: '#38bdf8', strokeWidth: 2.5, strokeLinecap: 'round', strokeLinejoin: 'round' }}>
              <polygon points="12 2 2 22 22 22" />
              <line x1="12" y1="11" x2="12" y2="21" />
            </svg>
          </button>

          {/* (5) 설정 톱니바퀴 단추 */}
          <button 
            className="layout-btn"
            onClick={() => setIsSettingsOpen(true)}
            title={t.toolbar.openSettings}
            style={{ width: '26px', height: '26px' }}
          >
            <Settings size={13} style={{ color: 'var(--text-muted)' }} />
          </button>

          {/* (6) 구글 계정 로그인 관리 아바타 */}
          <div 
            className="google-profile-btn"
            onClick={() => setGooglePopoverOpen(!googlePopoverOpen)}
            title={t.toolbar.googleAccount}
            style={{ padding: '2px', gap: '3px' }}
          >
            {googleProfile?.picture ? (
              <img 
                src={googleProfile.picture} 
                alt="Avatar" 
                style={{ width: '20px', height: '20px', borderRadius: '50%' }}
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="google-profile-avatar" style={{ width: '20px', height: '20px', fontSize: '9.5px' }}>
                {googleProfile ? googleProfile.name.slice(0, 1).toUpperCase() : 'G'}
              </div>
            )}
            <ChevronDown size={10} style={{ color: 'var(--text-muted)' }} />
          </div>
        </div>

        {/* 구글 계정 팝오버 드롭다운 카드 */}
        {googlePopoverOpen && (
          <div className="google-popover">
            <div className="google-popover-header">
              {googleProfile?.picture ? (
                <img 
                  src={googleProfile.picture} 
                  alt="Avatar" 
                  style={{ width: '40px', height: '40px', borderRadius: '50%', border: '1px solid var(--border-glow)' }}
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div 
                  className="google-popover-avatar-big"
                  style={{
                    backgroundColor: '#f97316',
                    color: '#fff',
                  }}
                >
                  {googleProfile ? googleProfile.name.slice(0, 1).toUpperCase() : 'G'}
                </div>
              )}
              <div className="google-popover-info">
                <div className="google-popover-name">{googleProfile?.name || t.googlePopover.disconnected}</div>
                <div className="google-popover-email">{googleProfile?.email || t.googlePopover.loginPrompt}</div>
                <div className="google-popover-badge">
                  {googleProfile?.isDriveConnected ? t.googlePopover.driveConnected : t.googlePopover.driveDisconnected}
                </div>
              </div>
            </div>
            <div className="google-popover-body">
              {googleProfile ? (
                <>
                  <button 
                    className="google-popover-btn google-popover-btn-primary"
                    onClick={async () => {
                      if (window.electronAPI?.googleAuthGetStatus) {
                        const res = await window.electronAPI.googleAuthGetStatus()
                        if (res.success && res.user) {
                          setGoogleProfile(res.user)
                          setUsername(res.user.name)
                          alert('Google account synced successfully!')
                        } else {
                          setGoogleProfile(null)
                          setUsername('')
                          alert('Session expired. Please sign in again.')
                        }
                      }
                      setGooglePopoverOpen(false)
                    }}
                  >
                    <RefreshCw size={12} />
                    {t.googlePopover.syncBtn}
                  </button>
                  <button 
                    className="google-popover-btn google-popover-btn-secondary"
                    onClick={async () => {
                      if (window.electronAPI?.googleAuthLogout) {
                        if (confirm('Are you sure you want to sign out and disconnect Google account?')) {
                          await window.electronAPI.googleAuthLogout()
                          setGoogleProfile(null)
                          setUsername('')
                          alert('Signed out successfully.')
                        }
                      }
                      setGooglePopoverOpen(false)
                    }}
                  >
                    <LogOut size={12} />
                    {t.googlePopover.signOutBtn}
                  </button>
                </>
              ) : (
                <button
                  className="google-popover-btn google-popover-btn-primary"
                  style={{ justifyContent: 'center' }}
                  onClick={() => {
                    setIsSettingsOpen(true)
                    setGooglePopoverOpen(false)
                  }}
                >
                  {t.googlePopover.loginBtn}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
      
      {isSecurityModalOpen && <SecurityModal onClose={() => setIsSecurityModalOpen(false)} />}
    </div>
  )
}
