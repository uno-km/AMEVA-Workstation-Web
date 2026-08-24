/**
 * ============================================================================
 * @file SettingsModal.tsx
 * @description SettingsModal.tsx 시스템 모듈 구성요소로, 관련 UI 렌더링 및 비즈니스 로직을 담당합니다.
 * @usage 문서 에디터 및 뷰어 내부에서 동적으로 호출되거나 유틸리티 함수로 사용됩니다.
 * @example
 * // 예시 로직 (자동 생성됨)
 * import { something } from './SettingsModal';
 * 
 * @created 2026-08-10 20:30:36
 * @updated 2026-08-10 20:30:36
 * @author uno-km
 * @commit docs: 전체 소스코드 한글 주석 및 사내 컨벤션 일괄 적용
 * ============================================================================
 */

/**
 * @file SettingsModal.tsx
 * @system AMEVA OS Desktop Workstation
 * @location src/renderer/components/SettingsModal.tsx
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
import { useState, useEffect } from 'react'
// [외부 패키지 및 라이브러리 임포트: lucide-react]
import { Settings, Sliders, Monitor, Move, ToyBrick, User, Shield, Keyboard, ShieldAlert, Key, Cpu, Bot } from 'lucide-react'
// [내부 프로젝트 의존성 모듈 임포트: ../services/ipc/electronApiAdapter]
import * as ipc from '../services/ipc/electronApiAdapter'
// [내부 프로젝트 의존성 모듈 임포트: ./ui/modals/FreeModal]
import { FreeModal } from './ui/modals/FreeModal'
// [내부 프로젝트 의존성 모듈 임포트: ./settings/SettingsTabCredentials]
import { SettingsTabCredentials } from './settings/SettingsTabCredentials'
// [내부 프로젝트 의존성 모듈 임포트: ./settings/SettingsTabMCP]
import { SettingsTabMCP } from './settings/SettingsTabMCP'
// [내부 프로젝트 의존성 모듈 임포트: ./settings/SettingsTabHotkeys]
import { SettingsTabHotkeys } from './settings/SettingsTabHotkeys'
// [내부 프로젝트 의존성 모듈 임포트: ./settings/SettingsTabGeneral]
import { SettingsTabGeneral } from './settings/SettingsTabGeneral'
// [내부 프로젝트 의존성 모듈 임포트: ./settings/SettingsTabAccount]
import { SettingsTabAccount } from './settings/SettingsTabAccount'
// [내부 프로젝트 의존성 모듈 임포트: ./settings/SettingsTabPermissions]
import { SettingsTabPermissions } from './settings/SettingsTabPermissions'
// [내부 프로젝트 의존성 모듈 임포트: ./settings/SettingsTabAppearance]
import { SettingsTabAppearance } from './settings/SettingsTabAppearance'
// [내부 프로젝트 의존성 모듈 임포트: ./settings/SettingsTabCustomizations]
import { SettingsTabCustomizations } from './settings/SettingsTabCustomizations'
// [내부 프로젝트 의존성 모듈 임포트: ../hooks/app/useSettingsDraft]
import { useSettingsDraft } from '../hooks/app/useSettingsDraft'
// [내부 프로젝트 의존성 모듈 임포트: ./overlay/SettingsTransitionOverlay]
import { SettingsTransitionOverlay } from './overlay/SettingsTransitionOverlay'
import { useTranslation } from '../i18n/useTranslation'

/**
 * HotkeyConfig 모듈 내외부에서 사용되는 데이터 통신 규격 및 타입을 정의합니다.
 * @remarks 이 주석은 컨벤션에 따라 자동 생성된 문서화 내용입니다.
 */
export interface HotkeyConfig {
  save?: string
  open?: string
  newFile?: string
  pdfExport?: string
  toggleAI?: string
  toggleMode?: string
  zoomIn?: string
  zoomOut?: string
  zoomReset?: string
}

/**
 * AppSettings 모듈 내외부에서 사용되는 데이터 통신 규격 및 타입을 정의합니다.
 * @remarks 이 주석은 컨벤션에 따라 자동 생성된 문서화 내용입니다.
 */
export interface AppSettings {
  showPeersPointer: boolean
  showPeersDrag: boolean
  showCodeConsole: boolean
  autoSnapshot: boolean
  theme: 'dark' | 'white' | 'win98'
  wordWrap: boolean
  showMinimap: boolean
  autoLoadAI?: boolean
  installedPlugins?: string[]
  securityPreset?: 'paranoiac' | 'turbo' | 'restricted'
  artifactReviewPolicy?: 'always' | 'never' | 'ask'
  hotkeys?: HotkeyConfig
  modelPath?: string
  codeModelPath?: string
}

export const DEFAULT_SETTINGS: AppSettings = {
  showPeersPointer: true,
  showPeersDrag: false,
  showCodeConsole: false,
  autoSnapshot: true,
  theme: 'dark',
  wordWrap: true,
  showMinimap: false,
  autoLoadAI: false,
  hotkeys: {
    save: 'Control+s',
    open: 'Control+o',
    newFile: 'Control+n',
    pdfExport: 'Control+p',
    toggleMode: 'Control+e',
    zoomIn: 'Control+=',
    zoomOut: 'Control+-',
    zoomReset: 'Control+0'
  }
}

/**
 * SettingsModalProps 모듈 내외부에서 사용되는 데이터 통신 규격 및 타입을 정의합니다.
 * @remarks 이 주석은 컨벤션에 따라 자동 생성된 문서화 내용입니다.
 */
interface SettingsModalProps {
  isOpen: boolean
  onClose: () => void
  settings: AppSettings
  onUpdateSettings: (newSettings: Partial<AppSettings>) => void
  initialTab?: TabType
  username?: string
  userColor?: string
  onUpdateUser?: (name: string, color: string) => void
}

/**
 * TabType 모듈 내외부에서 사용되는 데이터 통신 규격 및 타입을 정의합니다.
 * @remarks 이 주석은 컨벤션에 따라 자동 생성된 문서화 내용입니다.
 */
type TabType = 'General' | 'Account' | 'Permissions' | 'Appearance' | 'Customizations' | 'Hotkeys' | 'MCP' | 'Credentials'

  /*
   * [FUNCTION CONTRACT]
   * - 함수 명: `SettingsModal`
   * - 역할: 인자 정보를 검수하고 비즈니스 계약 조건에 맞춰 최종 바인딩 결과물/바이너리 버퍼를 반환함.
   * - 예시: `SettingsModal(...)` 호출 시 런타임 비동기/동기 연쇄 반응 유도.
   */
/**
 * SettingsModal 함수의 핵심 비즈니스 로직 및 상태 제어를 처리합니다.
 * @remarks 이 주석은 컨벤션에 따라 자동 생성된 문서화 내용입니다.
 */
export function SettingsModal({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  initialTab,
  username = 'User',
  userColor = '#a855f7',
  onUpdateUser,
}: SettingsModalProps) {
  void { Move, ShieldAlert };
  const { t } = useTranslation();

  // 0. 설정 Draft 및 전환 상태
  const { draftSettings, updateDraft, resetDraft, isDirty: isAppDirty } = useSettingsDraft(settings, isOpen)
  const [isApplying, setIsApplying] = useState(false)

  // 2. 활성 탭 상태 (기본 General 또는 initialTab)
  const [activeTab, setActiveTab] = useState<TabType>(initialTab || 'General')

  useEffect(() => {
    if (isOpen) {
      if (initialTab) {
        setActiveTab(initialTab)
      }
    }
  }, [isOpen, initialTab])

  // 3. 사용자 정보 폼 로컬 상태
  const [tempName, setTempName] = useState(username)
  const [tempColor, setTempColor] = useState(userColor)

  useEffect(() => {
    if (isOpen) {
      setTempName(username)
      setTempColor(userColor)
    }
  }, [isOpen, username, userColor])

  const canUseMCP = true
  const [isFreeModeLocked, setIsFreeModeLocked] = useState(false)

  const isUserDirty = tempName !== username || tempColor !== userColor
  const isAnyDirty = isAppDirty || isUserDirty

  const handleSaveAndApply = () => {
    if (!isAnyDirty) {
      onClose()
      return
    }
    setIsApplying(true)
    setTimeout(() => {
      if (isAppDirty) onUpdateSettings(draftSettings)
      if (isUserDirty && onUpdateUser) onUpdateUser(tempName, tempColor)
      setIsApplying(false)
      onClose()
    }, 1800)
  }

  const handleCancel = () => {
    resetDraft()
    setTempName(username)
    setTempColor(userColor)
    onClose()
  }

  useEffect(() => {
    if (isOpen) {
      // 시작 시 무료 플래그 상태 체크
      if (ipc.isElectronEnv()) {
        ipc.isFreeMode().then(isFree => {
          if (isFree) {
            setIsFreeModeLocked(true)
          }
        })
      }
    }
  }, [isOpen])

  // 라이브 테마 프리뷰: Appearance 설정 탭에서 고르면 닫기 전까지 임시 적용
  useEffect(() => {
    if (isOpen) {
      document.documentElement.setAttribute('data-theme', draftSettings.theme)
    } else {
      document.documentElement.setAttribute('data-theme', settings.theme)
    }
  }, [isOpen, draftSettings.theme, settings.theme])

  const themes: { id: AppSettings['theme']; label: string; previewColor: string }[] = [
    { id: 'dark', label: t.settingsModal.appearance.darkTheme, previewColor: '#0a0a0f' },
    { id: 'white', label: t.settingsModal.appearance.whiteTheme, previewColor: '#f3f4f6' },
    { id: 'win98', label: t.settingsModal.appearance.retroTheme, previewColor: '#c0c0c0' },
  ]

      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `handleSaveUser`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const handleSaveUser = ...` 형태로 안전 캐싱 후 가공 기동.
       */
  const handleSaveUser = () => {
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `onUpdateUser`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (onUpdateUser)` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
    if (onUpdateUser) {
      onUpdateUser(tempName.trim(), tempColor)
    }
  }

  /*
   * [FUNCTION CONTRACT]
   * - 함수 명: `formatBytes`
   * - 역할: 인자 정보를 검수하고 비즈니스 계약 조건에 맞춰 최종 바인딩 결과물/바이너리 버퍼를 반환함.
   * - 예시: `formatBytes(...)` 호출 시 런타임 비동기/동기 연쇄 반응 유도.
   */
  function formatBytes(bytes: number): string {
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `bytes === 0`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (bytes === 0)` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
    if (bytes === 0) return 'N/A'
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(0`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(0)` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(0)}MB`
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)}GB`
  }

      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `!isOpen`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (!isOpen)` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
  if (!isOpen) return null

  return (
    <FreeModal
      isOpen={isOpen}
      onClose={handleCancel}
      title={t.settingsModal.title}
      icon={<Settings size={18} />}
      initialWidth={970}
      initialHeight={680}
      hasBackdrop={true}
      closeOnBackdropClick={false}
    >
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        
        {/* 좌측 사이드바 탭 */}
        <div style={{
          width: '150px',
          borderRight: '1px solid var(--border-muted)',
          background: 'rgba(255,255,255,0.01)',
          display: 'flex',
          flexDirection: 'column',
          padding: '12px 8px',
          gap: '4px',
          flexShrink: 0,
        }}>
          {[
            { id: 'General', label: t.settingsModal.tabs.general, icon: Sliders },
            { id: 'Appearance', label: t.settingsModal.tabs.appearance, icon: Monitor },
            { id: 'Account', label: t.settingsModal.tabs.account, icon: User },
            { id: 'Permissions', label: t.settingsModal.tabs.permissions, icon: Shield },
            { id: 'Credentials', label: t.settingsModal.tabs.credentials, icon: Key },
            { id: 'Customizations', label: t.settingsModal.tabs.customizations, icon: ToyBrick },
            { id: 'Hotkeys', label: t.settingsModal.tabs.hotkeys, icon: Keyboard },
            { id: 'MCP', label: t.settingsModal.tabs.mcp, icon: ToyBrick }
          ].map(tabItem => {
            const Icon = tabItem.icon
            const isSelected = activeTab === tabItem.id
            return (
              <button
                key={tabItem.id}
                onClick={() => setActiveTab(tabItem.id as TabType)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '8px',
                  padding: '8px 12px', borderRadius: '6px', border: 'none',
                  background: isSelected ? 'var(--bg-glass-active)' : 'transparent',
                  color: isSelected ? 'var(--text-on-active)' : 'var(--text-muted)',
                  fontSize: '13px', fontWeight: isSelected ? 700 : 500,
                  cursor: 'pointer', textAlign: 'left',
                  transition: 'background 0.15s, color 0.15s',
                }}
              >
                <Icon size={14} />
                <span>{tabItem.label}</span>
              </button>
            )
          })}
        </div>

        {/* 우측 설정 내용 컨테이너 */}
        <div style={{ flex: 1, padding: '24px', overflowY: 'auto' }}>
          {/* General Tab */}
          <SettingsTabGeneral
            activeTab={activeTab}
            settings={draftSettings}
            onUpdateSettings={updateDraft}
          />

          {/* Appearance Tab */}
          <SettingsTabAppearance
            activeTab={activeTab}
            settings={draftSettings}
            handleThemeChange={(theme) => updateDraft({ theme })}
            themes={themes}
          />

          {/* Account Tab */}
          <SettingsTabAccount
            activeTab={activeTab}
            tempName={tempName}
            setTempName={setTempName}
            tempColor={tempColor}
            setTempColor={setTempColor}
            handleSaveUser={handleSaveUser}
          />

          {/* Permissions Tab */}
          <SettingsTabPermissions
            activeTab={activeTab}
            settings={draftSettings}
            onUpdateSettings={updateDraft}
          />

          {/* Credentials Tab */}
          <SettingsTabCredentials isOpen={isOpen} activeTab={activeTab} />

          {/* Customizations Tab */}
          <SettingsTabCustomizations
            activeTab={activeTab}
            settings={draftSettings}
          />

          {/* Hotkeys Tab */}
          <SettingsTabHotkeys activeTab={activeTab} settings={draftSettings} onUpdateSettings={updateDraft} />

          {/* MCP Manager Tab (Requires Permission) */}
          {activeTab === 'MCP' && (
            <SettingsTabMCP isOpen={isOpen} />
          )}

        </div>
      </div>

      {/* 3. 최하단 푸터 */}
      <div
        style={{
          padding: '10px 18px',
          borderTop: '1px solid var(--border-muted)',
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '8px',
          backgroundColor: 'rgba(255, 255, 255, 0.01)',
          flexShrink: 0,
        }}
      >
        <button
          className="btn btn-secondary"
          style={{ padding: '5px 16px', fontSize: '13px', borderRadius: '6px', fontWeight: 600, border: '1px solid var(--border-muted)', background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer' }}
          onClick={handleCancel}
          disabled={isApplying}
        >
          {t.settingsModal.cancel}
        </button>
        <button
          className="btn btn-primary"
          style={{ padding: '5px 16px', fontSize: '13px', borderRadius: '6px', fontWeight: 700, opacity: isApplying ? 0.7 : 1, cursor: isApplying ? 'wait' : 'pointer' }}
          onClick={handleSaveAndApply}
          disabled={isApplying}
        >
          {isAnyDirty ? t.settingsModal.applyAndSave : t.common.close}
        </button>
      </div>
      {/* 🚀 Transition Overlay */}
      <SettingsTransitionOverlay isVisible={isApplying} />
    </FreeModal>
  )
}

export { SettingsTabGeneral } from './settings/SettingsTabGeneral'
export { SettingsTabAccount } from './settings/SettingsTabAccount'
export { SettingsTabPermissions } from './settings/SettingsTabPermissions'
export { SettingsTabAppearance } from './settings/SettingsTabAppearance'
export { SettingsTabCustomizations } from './settings/SettingsTabCustomizations'

