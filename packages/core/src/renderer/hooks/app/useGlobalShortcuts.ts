/**
 * @file useGlobalShortcuts.ts
 * @system AMEVA OS Desktop Workstation
 * @location src/renderer/hooks/app/useGlobalShortcuts.ts
 * @role Core module helper and integration logic
 * 
 * [소비처 - CONSUMERS / USAGE CONTEXT]
 * - 소비처 A (src/renderer/App.tsx): 최상위 Facade 구조에 통합 마운트.
 * - 소비처 B (src/renderer/contexts/AppContext.tsx): 리액트 Context 훅 목록에 바인딩되어 하위 뷰에 전파.
 * 
 * [책임 범위 - RESPONSIBILITY]
 * - 본 파일은 AMEVA 시스템 내에서 도메인 목적에 부합하는 연산 및 데이터 처리 흐름을 안전하게 캡슐화한다.
 * - 외부 라이브러리 및 하위 종속성을 조율하고 결과 규격을 일관되게 제공한다.
 * 
 * [절대 깨면 안 되는 계약 - CONTRACT]
 * - MUST: 모든 예외 발생 시 에러를 침묵시키지 말고 에러 로그를 명확하게 남길 것.
 * - MUST NOT: TypeScript any 형식을 우회 수단으로 함부로 선언하지 말 것.
 */

/**
 * useGlobalShortcuts.ts
 *
 * 전역 키보드 단축키(Hotkey) 처리 전담 훅.
 * App.tsx에 인라인으로 정의되어 있던 keydown/wheel 이벤트 핸들러를 격리한다.
 *
 * [포함 로직]
 * - Ctrl+S: 파일 저장
 * - Ctrl+O: 파일 열기
 * - Ctrl+N: 새 탭
 * - Ctrl+P: PDF 내보내기
 * - Ctrl+E: 에디터/미리보기 전환
 * - Ctrl+\: AI 패널 토글
 * - Ctrl+=/-/0: 에디터 줌 인/아웃/리셋
 * - Ctrl+Wheel: 에디터/사이드바 영역에 따라 다른 줌 동작
 * - F11: 전체화면
 * - 커스텀 핫키: settings.hotkeys 바인딩
 */

import { useEffect, useCallback } from 'react'
import { useProcessStore } from '../../stores/useProcessStore'
import { useUIStore } from '../../stores/useUIStore'
import type { AppSettings, HotkeyConfig } from '../../components/SettingsModal'
import type { EditorMode } from '../../../shared/types'

/** useGlobalShortcuts 파라미터 타입 */
export interface GlobalShortcutsParams {
  /** 현재 앱 설정 */
  settings: AppSettings
  /** 현재 에디터 인스턴스 */
  editor: any
  /** 현재 파일 경로 */
  filePath: string | null
  /** 현재 콘텐츠 */
  currentContent: string
  /** 현재 에디터 모드 */
  editorMode: EditorMode
  /** 저장 핸들러 */
  onSave: () => Promise<void>
  /** 열기 핸들러 */
  onOpen: () => Promise<void>
  /** 새 탭 핸들러 */
  onNewTab: () => void
  /** AI 패널 토글 핸들러 */
  onToggleAI: () => void
  /** 에디터 모드 전환 핸들러 */
  onToggleMode: () => void
  /** 줌 인 핸들러 */
  onZoomIn: () => void
  /** 줌 아웃 핸들러 */
  onZoomOut: () => void
  /** 줌 리셋 핸들러 */
  onZoomReset: () => void
}

/** matchHotkey 유틸: 키 이벤트와 단축키 문자열 비교 */
function matchHotkey(e: KeyboardEvent, hotkey: string): boolean {
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `parts`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const parts = ...` 형태로 안전 캐싱 후 가공 기동.
       */
  const parts = hotkey.toLowerCase().split('+')
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `key`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const key = ...` 형태로 안전 캐싱 후 가공 기동.
       */
  const key = parts[parts.length - 1]
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `needsCtrl`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const needsCtrl = ...` 형태로 안전 캐싱 후 가공 기동.
       */
  const needsCtrl = parts.includes('control') || parts.includes('ctrl')
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `needsShift`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const needsShift = ...` 형태로 안전 캐싱 후 가공 기동.
       */
  const needsShift = parts.includes('shift')
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `needsAlt`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const needsAlt = ...` 형태로 안전 캐싱 후 가공 기동.
       */
  const needsAlt = parts.includes('alt')

      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `needsCtrl && !e.ctrlKey`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (needsCtrl && !e.ctrlKey)` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
  if (needsCtrl && !e.ctrlKey) return false
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `needsShift && !e.shiftKey`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (needsShift && !e.shiftKey)` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
  if (needsShift && !e.shiftKey) return false
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `needsAlt && !e.altKey`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (needsAlt && !e.altKey)` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
  if (needsAlt && !e.altKey) return false

      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `eKey`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const eKey = ...` 형태로 안전 캐싱 후 가공 기동.
       */
  const eKey = e.key.toLowerCase()
  return eKey === key || (key === '\\' && eKey === '\\')
}

/**
 * useGlobalShortcuts
 * window keydown 이벤트 리스너와 wheel 줌 이벤트 리스너를 등록한다.
 */
export function useGlobalShortcuts(params: GlobalShortcutsParams) {
  const {
    settings,
    onSave, onOpen, onNewTab, onToggleAI, onToggleMode,
    onZoomIn, onZoomOut, onZoomReset
  } = params

  const { adjustEditorZoom, setBrowserZoom } = useProcessStore()

      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `handleKeyDown`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const handleKeyDown = ...` 형태로 안전 캐싱 후 가공 기동.
       */
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    const hotkeys: HotkeyConfig = settings.hotkeys || {
      save: 'Control+s', open: 'Control+o', newFile: 'Control+n',
      pdfExport: 'Control+p', toggleAI: 'Control+\\', toggleMode: 'Control+e',
      zoomIn: 'Control+=', zoomOut: 'Control+-', zoomReset: 'Control+0'
    }

    // F11 — 전체화면 토글
    if (e.key === 'F11') {
      e.preventDefault()
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `document.fullscreenElement) document.exitFullscreen(`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (document.fullscreenElement) document.exitFullscreen()` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
      if (document.fullscreenElement) document.exitFullscreen()
      else document.documentElement.requestFullscreen()
      return
    }

      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `matchHotkey(e, hotkeys.save || 'Control+s')`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (matchHotkey(e, hotkeys.save || 'Control+s'))` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
    if (matchHotkey(e, hotkeys.save || 'Control+s')) {
      e.preventDefault()
      onSave()
    } else if (matchHotkey(e, hotkeys.open || 'Control+o')) {
      e.preventDefault()
      onOpen()
    } else if (matchHotkey(e, hotkeys.newFile || 'Control+n')) {
      e.preventDefault()
      onNewTab()
    } else if (matchHotkey(e, hotkeys.toggleAI || 'Control+\\')) {
      e.preventDefault()
      onToggleAI()
    } else if (matchHotkey(e, hotkeys.toggleMode || 'Control+e')) {
      e.preventDefault()
      onToggleMode()
    } else if (matchHotkey(e, hotkeys.zoomIn || 'Control+=')) {
      e.preventDefault()
      onZoomIn()
    } else if (matchHotkey(e, hotkeys.zoomOut || 'Control+-')) {
      e.preventDefault()
      onZoomOut()
    } else if (matchHotkey(e, hotkeys.zoomReset || 'Control+0')) {
      e.preventDefault()
      onZoomReset()
    } else if (e.ctrlKey && e.key === ',') {
      e.preventDefault()
      useUIStore.getState().toggleSettings()
    } else if (e.ctrlKey && e.key.toLowerCase() === 'b') {
      e.preventDefault()
      useUIStore.getState().toggleSidebar()
    } else if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'a') {
      e.preventDefault()
      useUIStore.getState().toggleAbout()
    }

    // ── 새로고침 방어 로직 (사용자 요청 사항 반영) ──
    if (e.key === 'F5' || (e.ctrlKey && e.key.toLowerCase() === 'r' && !e.shiftKey)) {
      e.preventDefault() // 일반 F5, Ctrl+R 완전 차단
      return
    }

    // 강력 새로고침 (Ctrl+Shift+R)은 통과시킴 (브라우저 기본 동작 유지) -> 수정: 새로고침 확인 모달 띄우기
    if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'r') {
      e.preventDefault()
      useUIStore.getState().setIsRefreshConfirmOpen(true)
      return
    }

    // ── 창 닫기 방어 모달 ──
    if ((e.ctrlKey && e.key.toLowerCase() === 'w') || (e.altKey && e.key === 'F4')) {
      e.preventDefault()
      useUIStore.getState().setIsQuitConfirmOpen(true)
      return
    }

  }, [settings.hotkeys, onSave, onOpen, onNewTab, onToggleAI, onToggleMode, onZoomIn, onZoomOut, onZoomReset])

      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `handleWheelZoom`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const handleWheelZoom = ...` 형태로 안전 캐싱 후 가공 기동.
       */
  const handleWheelZoom = useCallback((e: WheelEvent) => {
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `!e.ctrlKey`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (!e.ctrlKey)` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
    if (!e.ctrlKey) return

      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `editorWrapper`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const editorWrapper = ...` 형태로 안전 캐싱 후 가공 기동.
       */
    const editorWrapper = document.querySelector('.editor-zoom-wrapper')
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `isInsideEditor`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const isInsideEditor = ...` 형태로 안전 캐싱 후 가공 기동.
       */
    const isInsideEditor = editorWrapper?.contains(e.target as Node) ?? false

      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `isInsideEditor`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (isInsideEditor)` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
    if (isInsideEditor) {
      // 에디터 내부: CSS zoom으로 처리
      e.preventDefault()
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `delta`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const delta = ...` 형태로 안전 캐싱 후 가공 기동.
       */
      const delta = e.deltaY < 0 ? 0.1 : -0.1
      adjustEditorZoom(delta)
    } else {
      // 에디터 외부: Electron webFrame zoom
      if ((window as any).electronAPI?.setZoomFactor) {
        e.preventDefault()
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `step`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const step = ...` 형태로 안전 캐싱 후 가공 기동.
       */
        const step = e.deltaY < 0 ? 0.1 : -0.1
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `prev`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const prev = ...` 형태로 안전 캐싱 후 가공 기동.
       */
        const prev = useProcessStore.getState().browserZoom
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `next`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const next = ...` 형태로 안전 캐싱 후 가공 기동.
       */
        const next = Math.min(3.0, Math.max(0.3, Math.round((prev + step) * 10) / 10))
        setBrowserZoom(next)
        ;(window as any).electronAPI.setZoomFactor(next)
      }
      // 일반 브라우저 환경: 브라우저 기본 줌 동작에 위임
    }
  }, [adjustEditorZoom, setBrowserZoom])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('wheel', handleWheelZoom, { passive: false })
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('wheel', handleWheelZoom)
    }
  }, [handleKeyDown, handleWheelZoom])
}

