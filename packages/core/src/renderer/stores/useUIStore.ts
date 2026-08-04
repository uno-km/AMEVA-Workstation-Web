/**
 * @file useUIStore.ts
 * @system AMEVA OS Desktop Workstation - Global State Store
 * @location src/renderer/stores/useUIStore.ts
 * @role UI Panel visibility & Modal popups Zustand Store
 * 
 * [책임 범위 - RESPONSIBILITY]
 * - 환경설정, 모델 설치창, 마켓플레이스, 스냅샷 비교(Diff), 웰컴 모달 등 화면 내 10여 개 레이아웃 다이얼로그의 노출 여부를 전역 통제한다.
 * - 좌측 문서 탐색 트리(showSidebar), 하단 정보창(showStatusBar), 우측 AI 패널(showAIPanel) 등의 레이아웃 개폐 상태를 동기 제어한다.
 * - 전역 알림(toastMessage), 찾기/바꾸기(showFindReplace) 및 협업 실시간 메신저(isChatFloating)의 활성화 및 안 읽은 메시지 뱃지(`hasChatUnread`) 트리거를 처리한다.
 * - 여러 레이아웃 팝업이 겹쳐서 기동될 때의 중첩 순서( baseZIndex )를 조정하여 윈도우 레이아웃 순서를 정리한다.
 * 
 * [책임이 아닌 것 - NON-RESPONSIBILITY]
 * - 비즈니스 문서 텍스트 데이터의 버퍼링 및 디스크 로드/저장 관리 (useWorkspaceStore에서 전담).
 * - 백그라운드 LLM 모델 다운로드 진도율 관리 (useProcessStore에서 전담).
 * 
 * [절대 깨면 안 되는 계약 - CONTRACT]
 * - MUST: 우측 패널 탭 토글 액션(`toggleRightTab`) 기동 시,
 *   이미 열려있는 탭을 한 번 더 선택한 경우에는 반드시 패널을 닫아버리는(`showAIPanel: false`) 직관적인 토글 Invariant 계약을 보존할 것.
 
 * [소비처 - CONSUMERS / USAGE CONTEXT]
 * - 소비처 A (src/renderer/hooks/): 도메인 훅 내부에서 상태 값 바인딩 및 변경 액션 호출 시 소비.
 * - 소비처 B (src/renderer/components/): 컴포넌트 내 렌더 조건 판단을 위해 실시간 구독(Subscribe) 소비.
 */

/* 
 * [IMPORT SEGMENTATION & CONTRACTS]
 * - create: Zustand 라이브러리의 불변 상태 트리 스토어 생성 빌더 API.
 */
import { create } from 'zustand'

/**
 * UIState 인터페이스 정의.
 * 화면 내 존재하는 모든 오버레이, 모달, 패널 요소의 상태 데이터 및 액션 맵.
 */
export interface UIState {
  /*
   * [SETTINGS MODAL STATES]
   * - isSettingsOpen: 설정 화면 노출 여부.
   * - settingsInitialTab: 설정 오픈 시 포커싱될 디폴트 탭 명칭.
   * - setIsSettingsOpen: 설정 오픈 상태 지정 액션.
   * - toggleSettings: 설정 화면 개폐 토글 액션.
   */
  isSettingsOpen: boolean
  settingsInitialTab?: string
  setIsSettingsOpen: (val: boolean, tab?: string) => void
  toggleSettings: () => void

  /*
   * [ABOUT SYSTEM MODAL STATES]
   * - isAboutOpen: AMEVA OS 버전 정보창 노출 여부.
   * - setIsAboutOpen: 버전 창 지정 액션.
   * - toggleAbout: 버전 창 토글 액션.
   */
  isAboutOpen: boolean
  setIsAboutOpen: (val: boolean) => void
  toggleAbout: () => void

  /*
   * [USER GUIDE MODAL STATES]
   * - isGuideOpen: 웰컴 튜토리얼 안내창 노출 여부.
   * - setIsGuideOpen: 안내창 지정 액션.
   * - toggleGuide: 안내창 토글 액션.
   */
  isGuideOpen: boolean
  setIsGuideOpen: (val: boolean) => void
  toggleGuide: () => void

  /*
   * [HISTORY DIFF COMPARISON MODAL STATES]
   * - isDiffOpen: 마크다운 줄단위 변경 비교창 노출 여부.
   * - setIsDiffOpen: 비교창 지정 액션.
   * - toggleDiff: 비교창 토글 액션.
   */
  isDiffOpen: boolean
  setIsDiffOpen: (val: boolean) => void
  toggleDiff: () => void

  /*
   * [MARKETPLACE SPEC MODAL STATES]
   * - showMarketplaceModal: 외부 확장 플러그인 상점 노출 여부.
   * - setShowMarketplaceModal: 상점창 지정 액션.
   * - toggleMarketplaceModal: 상점창 토글 액션.
   */
  showMarketplaceModal: boolean
  setShowMarketplaceModal: (val: boolean) => void
  toggleMarketplaceModal: () => void

  /*
   * [PRO UPGRADE MODAL STATES]
   * - showPricingModal: 멤버십 결제 유도 모달 노출 여부.
   * - setShowPricingModal: 결제창 지정 액션.
   * - togglePricingModal: 결제창 토글 액션.
   */
  showPricingModal: boolean
  setShowPricingModal: (open: boolean) => void
  togglePricingModal: () => void



  isInstallPromptOpen: boolean
  setIsInstallPromptOpen: (val: boolean) => void

  /*
   * [LOCAL LLM HUB MODAL STATES]
   * - showModelHub: 로컬 모델 설치 및 기동 매니저 노출 여부.
   * - setShowModelHub: 모델 매니저 지정 액션.
   * - toggleModelHub: 모델 매니저 토글 액션.
   */
  showModelHub: boolean
  setShowModelHub: (val: boolean) => void
  toggleModelHub: () => void

  /*
   * [RIGHT SIDE AI/PLUGIN PANEL STATES]
   * - showAIPanel: 우측 사이드 패널 노출 여부.
   * - setShowAIPanel: 우측 패널 지정 액션.
   * - toggleAIPanel: 우측 패널 토글 액션.
   * - activeRightTab: 우측 패널 내 활성 탭 (ai / outline / plugins).
   * - setActiveRightTab: 우측 활성 탭 지정 액션.
   */
  showAIPanel: boolean
  setShowAIPanel: (val: boolean) => void
  toggleAIPanel: () => void
  activeRightTab: string
  setActiveRightTab: (tab: string) => void

  /*
   * [LEFT WORKSPACE SIDEBAR STATES]
   * - showSidebar: 좌측 네비게이션 트리 노출 여부.
   * - setShowSidebar: 좌측 사이드바 지정 액션.
   * - toggleSidebar: 좌측 사이드바 토글 액션.
   */
  showSidebar: boolean
  setShowSidebar: (val: boolean) => void
  toggleSidebar: () => void

  /*
   * [BOTTOM STATUS BAR STATES]
   * - showStatusBar: 하단 환경 지표창 노출 여부.
   * - setShowStatusBar: 지표창 지정 액션.
   * - toggleStatusBar: 지표창 토글 액션.
   */
  showStatusBar: boolean
  setShowStatusBar: (val: boolean) => void
  toggleStatusBar: () => void

  /*
   * [TOAST NOTIFICATION SPECS]
   * - toastMessage: 화면 중앙 상단에 잠깐 떴다 사라질 토스트 알림 메세지.
   * - setToastMessage: 토스트 메세지 지정 액션.
   */
  toastMessage: string | null
  setToastMessage: (msg: string | null) => void

  /*
   * [EDITOR SEARCH COMPONENT STATES]
   * - showFindReplace: 에디터 찾기/바꾸기 서치 패널 노출 여부.
   * - setShowFindReplace: 서치 패널 지정 액션.
   * - toggleFindReplace: 서치 패널 토글 액션.
   * - findReplaceMode: 찾기(find) 또는 바꾸기(replace) 모드 설정.
   * - setFindReplaceMode: 모드 지정 액션.
   */
  showFindReplace: boolean
  setShowFindReplace: (val: boolean) => void
  toggleFindReplace: () => void
  findReplaceMode: 'find' | 'replace'
  setFindReplaceMode: (mode: 'find' | 'replace') => void

  /*
   * [COLLABORATIVE MESSENGER SPECS]
   * - isChatFloating: 실시간 챗 창이 플로팅 레이어로 떠 있는지 여부.
   * - setIsChatFloating: 플로팅 여부 지정 액션.
   * - toggleChatFloating: 플로팅 토글 액션.
   * - hasChatUnread: 다른 피어가 메시지를 보냈으나 보지 않은 unread 뱃지 노출 상태.
   * - setHasChatUnread: unread 뱃지 지정 액션.
   */
  isChatFloating: boolean
  setIsChatFloating: (val: boolean) => void
  toggleChatFloating: () => void
  hasChatUnread: boolean
  setHasChatUnread: (val: boolean) => void

  /*
   * [APP LIFE LIFE ACTIONS]
   * - isQuitConfirmOpen: Electron 윈도우 우상단 닫기 시 데이터 유실 경고 모달 여부.
   * - setIsQuitConfirmOpen: 경고창 지정 액션.
   * - isRefreshConfirmOpen: F5 새로고침 시 데이터 저장 확인 모달 여부.
   * - setIsRefreshConfirmOpen: 확인 모달 지정 액션.
   */
  isQuitConfirmOpen: boolean
  setIsQuitConfirmOpen: (val: boolean) => void
  isRefreshConfirmOpen: boolean
  setIsRefreshConfirmOpen: (val: boolean) => void

  /*
   * [COMPOSITE ACTIONS]
   * - toggleRightTab: 우측 활성 탭 전환 및 동일 선택 시 자동 패널 숨김 조율 액션.
   */
  toggleRightTab: (tab: string) => void

  /*
   * [Z-INDEX ORDER SYSTEM]
   * - baseZIndex: 모달 레이아웃 기준 깊이 절댓값.
   * - bringToFront: 신규 다이얼로그 마운트 시 z-index를 10씩 격상해 주는 제어 액션.
   */
  baseZIndex: number
  bringToFront: () => number

  /*
   * [DYNAMIC PLUGIN MENUS]
   * - dynamicMenus: 플러그인이 동적으로 상단 메뉴바에 꽂는 메뉴 리스트.
   */
  dynamicMenus: { id: string; label: string; action: () => void }[]
  addDynamicMenu: (menu: { id: string; label: string; action: () => void }) => void
  removeDynamicMenu: (id: string) => void
}

/**
 * useUIStore Zustand 스토어 본체 정의.
 */
export const useUIStore = create<UIState>((set, get) => ({
  // 모달 기본 비활성 기동
  isSettingsOpen: false,
  settingsInitialTab: undefined,
  setIsSettingsOpen: (val, tab) => set({ isSettingsOpen: val, settingsInitialTab: tab }),
  toggleSettings: () => set((state) => ({ isSettingsOpen: !state.isSettingsOpen, settingsInitialTab: undefined })),

  isAboutOpen: false,
  setIsAboutOpen: (val) => set({ isAboutOpen: val }),
  toggleAbout: () => set((state) => ({ isAboutOpen: !state.isAboutOpen })),

  isGuideOpen: false,
  setIsGuideOpen: (val) => set({ isGuideOpen: val }),
  toggleGuide: () => set((state) => ({ isGuideOpen: !state.isGuideOpen })),

  isDiffOpen: false,
  setIsDiffOpen: (val) => set({ isDiffOpen: val }),
  toggleDiff: () => set((state) => ({ isDiffOpen: !state.isDiffOpen })),

  showMarketplaceModal: false,
  setShowMarketplaceModal: (open) => set({ showMarketplaceModal: open }),
  toggleMarketplaceModal: () => set((state) => ({ showMarketplaceModal: !state.showMarketplaceModal })),

  showPricingModal: false,
  setShowPricingModal: (open) => set({ showPricingModal: open }),
  togglePricingModal: () => set((state) => ({ showPricingModal: !state.showPricingModal })),



  isInstallPromptOpen: false,
  setIsInstallPromptOpen: (val) => set({ isInstallPromptOpen: val }),

  showModelHub: false,
  setShowModelHub: (val) => set({ showModelHub: val }),
  toggleModelHub: () => set((state) => ({ showModelHub: !state.showModelHub })),

  showAIPanel: false,
  setShowAIPanel: (val) => set({ showAIPanel: val }),
  toggleAIPanel: () => set((state) => ({ showAIPanel: !state.showAIPanel })),

  activeRightTab: 'ai',
  setActiveRightTab: (tab) => set({ activeRightTab: tab }),

  showSidebar: true,
  setShowSidebar: (val) => set({ showSidebar: val }),
  toggleSidebar: () => set((state) => ({ showSidebar: !state.showSidebar })),

  showStatusBar: true,
  setShowStatusBar: (val) => set({ showStatusBar: val }),
  toggleStatusBar: () => set((state) => ({ showStatusBar: !state.showStatusBar })),

  toastMessage: null,
  setToastMessage: (msg) => set({ toastMessage: msg }),

  showFindReplace: false,
  setShowFindReplace: (val) => set({ showFindReplace: val }),
  toggleFindReplace: () => set((state) => ({ showFindReplace: !state.showFindReplace })),

  findReplaceMode: 'find',
  setFindReplaceMode: (mode) => set({ findReplaceMode: mode }),

  isChatFloating: false,
  setIsChatFloating: (val) => set({ isChatFloating: val }),
  toggleChatFloating: () => set((state) => ({ isChatFloating: !state.isChatFloating })),

  hasChatUnread: false,
  setHasChatUnread: (val) => set({ hasChatUnread: val }),

  isQuitConfirmOpen: false,
  setIsQuitConfirmOpen: (val) => set({ isQuitConfirmOpen: val }),

  isRefreshConfirmOpen: false,
  setIsRefreshConfirmOpen: (open) => set({ isRefreshConfirmOpen: open }),

  /**
   * [CONTRACT - Right Panel Tab Toggle Action]
   * - Rationale: 이미 활성화되어 있는 동일한 탭 클릭 시 패널을 닫고, 다른 탭 클릭 시 패널을 강제 노출한다.
   */
  toggleRightTab: (tab) => {
    const { showAIPanel, activeRightTab } = get()
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `showAIPanel && activeRightTab === tab`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (showAIPanel && activeRightTab === tab)` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
    if (showAIPanel && activeRightTab === tab) {
      set({ showAIPanel: false })
    } else {
      set({ activeRightTab: tab, showAIPanel: true })
    }
  },

  /**
   * [CONTRACT - Window Depth bringToFront Action]
   * - Rationale: 다중 오버레이가 중첩 팝업될 시, 뒤엉켜 가려지는 Z-index 무질서를 차단하기 위해 
   *   기준 Z-Index를 10 단위로 자동 승격시킨 최신 절댓값을 반환해 준다.
   */
  baseZIndex: 10000,
  bringToFront: () => {
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `newZ`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const newZ = ...` 형태로 안전 캐싱 후 가공 기동.
       */
    let newZ = 10000;
    set(state => {
      newZ = state.baseZIndex + 10;
      return { baseZIndex: newZ };
    })
    return newZ
  },

  dynamicMenus: [],
  addDynamicMenu: (menu) => set((state) => {
    if (state.dynamicMenus.some(m => m.id === menu.id)) return state;
    return { dynamicMenus: [...state.dynamicMenus, menu] };
  }),
  removeDynamicMenu: (id) => set((state) => ({
    dynamicMenus: state.dynamicMenus.filter(m => m.id !== id)
  }))
}))

