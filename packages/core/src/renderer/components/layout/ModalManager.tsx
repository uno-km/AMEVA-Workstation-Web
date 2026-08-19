/**
 * ============================================================================
 * @file ModalManager.tsx
 * @description ModalManager.tsx 시스템 모듈 구성요소로, 관련 UI 렌더링 및 비즈니스 로직을 담당합니다.
 * @usage 문서 에디터 및 뷰어 내부에서 동적으로 호출되거나 유틸리티 함수로 사용됩니다.
 * @example
 * // 예시 로직 (자동 생성됨)
 * import { something } from './ModalManager';
 * 
 * @created 2026-08-10 20:30:36
 * @updated 2026-08-10 20:30:36
 * @author uno-km
 * @commit docs: 전체 소스코드 한글 주석 및 사내 컨벤션 일괄 적용
 * ============================================================================
 */

/**
 * @file ModalManager.tsx
 * @system AMEVA OS Desktop Workstation
 * @location src/renderer/components/layout/ModalManager.tsx
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

// [내부 프로젝트 의존성 모듈 임포트: ../../services/ipc/electronApiAdapter]
import * as ipc from '../../services/ipc/electronApiAdapter'
// [내부 프로젝트 의존성 모듈 임포트: ../DiffModal]
import { DiffModal } from '../DiffModal'
// [내부 프로젝트 의존성 모듈 임포트: ../SettingsModal]
import { SettingsModal } from '../SettingsModal'
// [내부 프로젝트 의존성 모듈 임포트: ../AboutModal]
import { AboutModal } from '../AboutModal'
// [내부 프로젝트 의존성 모듈 임포트: ../DocHubModal]
import { DocHubModal } from '../DocHubModal'
// [내부 프로젝트 의존성 모듈 임포트: ../MarkdownGuideModal]
import { MarkdownGuideModal } from '../MarkdownGuideModal'
// [내부 프로젝트 의존성 모듈 임포트: ../MarketplaceModal]
import { MarketplaceModal } from '../MarketplaceModal'

// [내부 프로젝트 의존성 모듈 임포트: ../ExportModal]
import { ExportModal, IDLE_PROGRESS } from '../ExportModal'
// [내부 프로젝트 의존성 모듈 임포트: ../QuitConfirmModal]
import { QuitConfirmModal } from '../QuitConfirmModal'
// [내부 프로젝트 의존성 모듈 임포트: ../InstallDesktopModal]
import { InstallDesktopModal } from '../InstallDesktopModal'


// [내부 프로젝트 의존성 모듈 임포트: ../RefreshConfirmModal]
import { RefreshConfirmModal } from '../RefreshConfirmModal'
// [내부 프로젝트 의존성 모듈 임포트: ../ui/modals/NewDocumentConfirmModal]
import { NewDocumentConfirmModal } from '../ui/modals/NewDocumentConfirmModal'
import { DocumentSummariesDeck } from '../pdf/DocumentSummariesDeck'
import { PdfMapReduceModal } from '../pdf/PdfMapReduceModal'
import { useDocumentSummaryStore } from '../../stores/useDocumentSummaryStore'
import { ConfirmModal } from '../ui/modals/ConfirmModal'
import { Trash2 } from 'lucide-react'

// [내부 프로젝트 의존성 모듈 임포트: ../../contexts/AppContext]
import { useAppContext } from '../../contexts/AppContext'
// [내부 프로젝트 의존성 모듈 임포트: ../../stores/useUIStore]
import { useUIStore } from '../../stores/useUIStore'
// [외부 패키지 및 라이브러리 임포트: zustand/react/shallow]
import { useShallow } from 'zustand/react/shallow'
// [내부 프로젝트 의존성 모듈 임포트: ../../stores/useWorkspaceStore]
import { useWorkspaceStore } from '../../stores/useWorkspaceStore'
// [내부 프로젝트 의존성 모듈 임포트: ../../stores/useProcessStore]
import { useProcessStore } from '../../stores/useProcessStore'


/**
 * ModalManagerProps 모듈 내외부에서 사용되는 데이터 통신 규격 및 타입을 정의합니다.
 * @remarks 이 주석은 컨벤션에 따라 자동 생성된 문서화 내용입니다.
 */
export interface ModalManagerProps {}

  /*
   * [FUNCTION CONTRACT]
   * - 함수 명: `ModalManager`
   * - 역할: 인자 정보를 검수하고 비즈니스 계약 조건에 맞춰 최종 바인딩 결과물/바이너리 버퍼를 반환함.
   * - 예시: `ModalManager(...)` 호출 시 런타임 비동기/동기 연쇄 반응 유도.
   */
/**
 * ModalManager 함수의 핵심 비즈니스 로직 및 상태 제어를 처리합니다.
 * @remarks 이 주석은 컨벤션에 따라 자동 생성된 문서화 내용입니다.
 */
export function ModalManager({}: ModalManagerProps = {}) {
  const {
    settings, handleUpdateSettings, handleInstallPlugin, handleUninstallPlugin,
    username, setUsername, userColor, setUserColor, getLineDiff, handleRollback,
    handleOpenGithub, refreshMcpServers, handleCloseApp, handleStartNewDocument,
    editor
  } = useAppContext()
  
  const {
    isDiffOpen, setIsDiffOpen, isSettingsOpen, settingsInitialTab, setIsSettingsOpen,
    setShowModelHub, isAboutOpen, setIsAboutOpen, isDocHubOpen, setIsDocHubOpen, isGuideOpen, setIsGuideOpen,
    showMarketplaceModal, setShowMarketplaceModal, showPricingModal, setShowPricingModal,
    isQuitConfirmOpen, setIsQuitConfirmOpen, isRefreshConfirmOpen, setIsRefreshConfirmOpen,
    isInstallPromptOpen, setIsInstallPromptOpen, isNewDocumentConfirmOpen, setIsNewDocumentConfirmOpen,
    blockDeleteConfirmState, closeBlockDeleteConfirm
  } = useUIStore(useShallow((s) => ({
    isDiffOpen: s.isDiffOpen,
    setIsDiffOpen: s.setIsDiffOpen,
    isSettingsOpen: s.isSettingsOpen,
    settingsInitialTab: s.settingsInitialTab,
    setIsSettingsOpen: s.setIsSettingsOpen,
    setShowModelHub: s.setShowModelHub,
    isAboutOpen: s.isAboutOpen,
    setIsAboutOpen: s.setIsAboutOpen,
    isDocHubOpen: s.isDocHubOpen,
    setIsDocHubOpen: s.setIsDocHubOpen,
    isGuideOpen: s.isGuideOpen,
    setIsGuideOpen: s.setIsGuideOpen,
    showMarketplaceModal: s.showMarketplaceModal,
    setShowMarketplaceModal: s.setShowMarketplaceModal,
    showPricingModal: s.showPricingModal,
    setShowPricingModal: s.setShowPricingModal,
    isQuitConfirmOpen: s.isQuitConfirmOpen,
    setIsQuitConfirmOpen: s.setIsQuitConfirmOpen,
    isRefreshConfirmOpen: s.isRefreshConfirmOpen,
    setIsRefreshConfirmOpen: s.setIsRefreshConfirmOpen,
    isInstallPromptOpen: s.isInstallPromptOpen,
    setIsInstallPromptOpen: s.setIsInstallPromptOpen,
    isNewDocumentConfirmOpen: s.isNewDocumentConfirmOpen,
    setIsNewDocumentConfirmOpen: s.setIsNewDocumentConfirmOpen,
    blockDeleteConfirmState: s.blockDeleteConfirmState,
    closeBlockDeleteConfirm: s.closeBlockDeleteConfirm
  })))

  const { selectedSnapshot, currentContent } = useWorkspaceStore()
  
  const { exportProgress, setExportProgress, exportMinimized, setExportMinimized, toggleExportMinimized } = useProcessStore()

  const { tasks, activeModalTaskId, closeModal } = useDocumentSummaryStore()
  const activeTask = activeModalTaskId ? tasks[activeModalTaskId] : null

  const aiSettings = {} as any
  const updateAISettings = () => {}

      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `handleQuitConfirm`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const handleQuitConfirm = ...` 형태로 안전 캐싱 후 가공 기동.
       */
  const handleQuitConfirm = () => {
    setIsQuitConfirmOpen(false)
    handleCloseApp()
  }

      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `handleRefreshConfirm`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const handleRefreshConfirm = ...` 형태로 안전 캐싱 후 가공 기동.
       */
  const handleRefreshConfirm = () => {
    window.location.reload()
  }

  return (
    <>
      <DiffModal
        isOpen={isDiffOpen}
        onClose={() => setIsDiffOpen(false)}
        snapshot={selectedSnapshot as any}
        currentContent={currentContent}
        getLineDiff={getLineDiff}
        onRollback={handleRollback}
      />
      <SettingsModal
        isOpen={isSettingsOpen}
        initialTab={settingsInitialTab as any}
        onClose={() => {
          setIsSettingsOpen(false)
          refreshMcpServers()
        }}
        settings={settings}
        onUpdateSettings={handleUpdateSettings}
        username={username}
        userColor={userColor}
        onUpdateUser={(name, color) => {
          setUsername(name)
          setUserColor(color)
        }}
      />
      <AboutModal
        isOpen={isAboutOpen}
        onClose={() => setIsAboutOpen(false)}
        onOpenGithub={handleOpenGithub}
      />
      <DocHubModal
        isOpen={isDocHubOpen}
        onClose={() => setIsDocHubOpen(false)}
      />
      <MarkdownGuideModal
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
      />
      <MarketplaceModal
        isOpen={showMarketplaceModal}
        onClose={() => setShowMarketplaceModal(false)}
        installedPlugins={settings.installedPlugins || []}
        onInstallPlugin={handleInstallPlugin}
        onUninstallPlugin={handleUninstallPlugin}
      />
      
      <ExportModal
        progress={exportProgress}
        minimized={exportMinimized}
        onMinimize={toggleExportMinimized}
        onClose={() => { setExportProgress(IDLE_PROGRESS); setExportMinimized(false) }}
        onOpenFile={(path) => {
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `fileUrl`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const fileUrl = ...` 형태로 안전 캐싱 후 가공 기동.
       */
          const fileUrl = path.startsWith('http') ? path : `file:///${path.replace(/\\/g, '/')}`
          ipc.openExternalLink(fileUrl)
        }}
      />

      <QuitConfirmModal
        isOpen={isQuitConfirmOpen}
        onClose={() => setIsQuitConfirmOpen(false)}
        onConfirm={handleQuitConfirm}
      />
      <InstallDesktopModal
        isOpen={isInstallPromptOpen}
        onClose={() => setIsInstallPromptOpen(false)}
      />
      {isRefreshConfirmOpen && setIsRefreshConfirmOpen && handleRefreshConfirm && (
        <RefreshConfirmModal
          isOpen={isRefreshConfirmOpen}
          onClose={() => setIsRefreshConfirmOpen(false)}
          onConfirm={handleRefreshConfirm}
        />
      )}
      {isNewDocumentConfirmOpen && setIsNewDocumentConfirmOpen && handleStartNewDocument && (
        <NewDocumentConfirmModal
          isOpen={isNewDocumentConfirmOpen}
          onClose={() => setIsNewDocumentConfirmOpen(false)}
          onConfirm={() => {
            handleStartNewDocument()
            setIsNewDocumentConfirmOpen(false)
          }}
        />
      )}

      {blockDeleteConfirmState && blockDeleteConfirmState.isOpen && (
        <ConfirmModal
          isOpen={blockDeleteConfirmState.isOpen}
          onClose={closeBlockDeleteConfirm}
          onConfirm={() => {
            const cb = blockDeleteConfirmState.onConfirm
            closeBlockDeleteConfirm()
            if (cb) cb()
          }}
          title={`해당 마크업(${blockDeleteConfirmState.blockName})을(를) 삭제하시겠습니까?`}
          description={`작성된 ${blockDeleteConfirmState.blockName} 데이터와 블록 내용이 문서에서 완전히 제거됩니다.`}
          confirmText="삭제"
          confirmButtonColor="#ef4444"
          icon={<Trash2 size={20} color="#ef4444" />}
        />
      )}

      {/* ─── AI 문서 요약 보관함 플립 덱 (SCRUM-173) ─── */}
      <DocumentSummariesDeck />

      {/* 활성화된 PDF 3단계 맵리듀스 모달 */}
      {activeTask && (
        <PdfMapReduceModal
          fileId={activeTask.fileId}
          blockId={activeTask.blockId}
          fileName={activeTask.fileName}
          numPages={activeTask.numPages}
          onClose={closeModal}
          onInsertToEditor={(reportText) => {
            window.dispatchEvent(new CustomEvent('app:insert-markdown', {
              detail: { content: reportText, fileName: `[AI 요약] ${activeTask.fileName}` }
            }));
            closeModal();
          }}
        />
      )}
    </>
  )
}

