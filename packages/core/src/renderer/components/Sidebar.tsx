/**
 * ============================================================================
 * @file Sidebar.tsx
 * @description Sidebar.tsx 시스템 모듈 구성요소로, 관련 UI 렌더링 및 비즈니스 로직을 담당합니다.
 * @usage 문서 에디터 및 뷰어 내부에서 동적으로 호출되거나 유틸리티 함수로 사용됩니다.
 * @example
 * // 예시 로직 (자동 생성됨)
 * import { something } from './Sidebar';
 * 
 * @created 2026-08-10 20:30:36
 * @updated 2026-08-10 20:30:36
 * @author uno-km
 * @commit docs: 전체 소스코드 한글 주석 및 사내 컨벤션 일괄 적용
 * ============================================================================
 */

/**
 * @file Sidebar.tsx
 * @system AMEVA OS Desktop Workstation
 * @location src/renderer/components/Sidebar.tsx
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
import React, { useState } from 'react'
import {
  FileText, History, Users, MessageCircle, PanelLeftClose,
} from 'lucide-react'
// [내부 프로젝트 의존성 모듈 임포트: ./sidebar/SidebarTabFiles]
import { SidebarTabFiles } from './sidebar/SidebarTabFiles'
// [내부 프로젝트 의존성 모듈 임포트: ./sidebar/SidebarTabHistory]
import { SidebarTabHistory } from './sidebar/SidebarTabHistory'
// [내부 프로젝트 의존성 모듈 임포트: ./sidebar/SidebarTabChat]
import { SidebarTabChat } from './sidebar/SidebarTabChat'
// [내부 프로젝트 의존성 모듈 임포트: ../contexts/AppContext]
import { useAppContext } from '../contexts/AppContext'
// [내부 프로젝트 의존성 모듈 임포트: ../stores/useWorkspaceStore]
import { useWorkspaceStore } from '../stores/useWorkspaceStore'
// [내부 프로젝트 의존성 모듈 임포트: ../stores/useUIStore]
import { useUIStore } from '../stores/useUIStore'
import { useTranslation } from '../i18n/useTranslation'

type TabId = 'files' | 'history' | 'chat'

export function Sidebar() {
  const { t } = useTranslation()
  const {
    editorMode, setEditorMode, handleOpenFile, handleSaveFile, handleExport,
    snapshots, createSnapshot, deleteSnapshot, handleSelectSnapshotForDiff,
    chatMessages, sendChatMessage, clearChatMessages, username, userColor, settings
  } = useAppContext()

  const {
    filePath, fileOpenMode, setFileOpenMode, appendedFiles,
    tabs, activeTabId, setActiveTabId, removeTab
  } = useWorkspaceStore()

  const { isChatFloating, setIsChatFloating, setShowSidebar } = useUIStore()

  const tabsConfig: { id: TabId; icon: React.FC<any>; label: string }[] = [
    { id: 'files',   icon: FileText,      label: t.sidebar.tabFiles },
    { id: 'history', icon: History,       label: t.sidebar.tabHistory },
    { id: 'chat',    icon: MessageCircle, label: t.sidebar.tabChat },
  ]

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
      .join(' + ')
  }

      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `hkeys`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const hkeys = ...` 형태로 안전 캐싱 후 가공 기동.
       */
  const hkeys = settings?.hotkeys || {
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
  const [activeTab, setActiveTab] = useState<TabId>('files')

      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `sectionLabel`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const sectionLabel = ...` 형태로 안전 캐싱 후 가공 기동.
       */
  const sectionLabel = (text: string) => (
    <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '8px' }}>
      {text}
    </div>
  )

  return (
    <aside
      className="glass-panel"
      data-focus-region="sidebar"
      style={{
        width: '100%',       /* 부모 wrapper div(usePanelResize 제어)를 채움 */
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        backdropFilter: 'blur(20px)',
        borderRight: '1px solid var(--border-muted)',
        zIndex: 100,
        overflow: 'hidden',
        position: 'relative',   /* focus-region outline 표시 영역 */
        color: 'var(--text-main)',
      }}
    >
      {/* 로고 */}
      <div style={{ padding: '16px 16px 12px', display: 'flex', alignItems: 'center', gap: '10px', borderBottom: '1px solid var(--border-muted)', flexShrink: 0 }}>
        <div style={{
          width: '30px', height: '30px', borderRadius: '8px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 0 12px var(--primary-glow)',
          flexShrink: 0,
          overflow: 'hidden',
          background: 'transparent',
        }}>
          <img src={`${import.meta.env.BASE_URL}favicon.png`} alt="AMEVA Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
        </div>
        <div>
          <div style={{ fontSize: '14px', fontWeight: 800, letterSpacing: '0.3px' }}>
            AMEVA <span style={{ color: 'var(--primary)' }}>Workstation</span>
          </div>
          <div style={{ fontSize: '9px', color: 'var(--text-muted)' }}>AI-Powered Workspace</div>
        </div>

        {/* 사이드바 접기 버튼 (Inline Embedding) */}
        <button
          onClick={() => setShowSidebar(false)}
          title="사이드바 접기"
          style={{
            marginLeft: 'auto',
            width: '28px', height: '28px', borderRadius: '7px',
            background: 'var(--bg-glass)',
            border: '1px solid var(--border-muted)',
            color: 'var(--text-main)',
            cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all 0.15s',
            flexShrink: 0,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'var(--primary)'
            e.currentTarget.style.color = 'var(--primary)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'var(--border-muted)'
            e.currentTarget.style.color = 'var(--text-main)'
          }}
        >
          <PanelLeftClose size={13} />
        </button>
      </div>

      {/* 탭 네비게이션 */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border-muted)', flexShrink: 0 }}>
        {tabsConfig.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              flex: 1, padding: '9px 0',
              background: 'transparent', border: 'none',
              borderBottom: activeTab === tab.id ? '2px solid var(--primary)' : '2px solid transparent',
              color: activeTab === tab.id ? 'var(--text-main)' : 'var(--text-muted)',
              fontSize: '10px', fontWeight: 600,
              cursor: 'pointer',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px',
              transition: 'all 0.15s',
              position: 'relative',
            }}
          >
            <tab.icon size={14} />
            {tab.label}
            {/* 채팅 뱃지 */}
            {tab.id === 'chat' && chatMessages.filter(m => m.type === 'text').length > 0 && (
              <div style={{
                position: 'absolute', top: '6px', right: '6px',
                width: '6px', height: '6px', borderRadius: '50%',
                background: 'var(--secondary)',
                boxShadow: '0 0 6px var(--secondary-glow)',
              }} />
            )}
          </button>
        ))}
      </div>

      {/* 탭 콘텐츠 */}
      <div style={{ flex: 1, overflowY: activeTab === 'chat' ? 'hidden' : 'auto', display: 'flex', flexDirection: 'column' }}>

        {/* ── 파일 탭 ── */}
        {activeTab === 'files' && (
          <SidebarTabFiles sectionLabel={sectionLabel} />
        )}

        {/* ── 히스토리 탭 ── */}
        {activeTab === 'history' && (
          <SidebarTabHistory sectionLabel={sectionLabel} />
        )}

        {/* ── 채팅 탭 ── */}
        {activeTab === 'chat' && (
          <SidebarTabChat />
        )}
      </div>
    </aside>
  )
}

export { SidebarTabFiles } from './sidebar/SidebarTabFiles'
export { SidebarTabHistory } from './sidebar/SidebarTabHistory'
export { SidebarTabChat } from './sidebar/SidebarTabChat'

