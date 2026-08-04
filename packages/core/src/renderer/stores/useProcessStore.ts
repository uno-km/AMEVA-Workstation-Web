/**
 * @file useProcessStore.ts
 * @system AMEVA OS Desktop Workstation - Global State Store
 * @location src/renderer/stores/useProcessStore.ts
 * @role Local model download queues & Document exporter progress Zustand Store
 * 
 * [책임 범위 - RESPONSIBILITY]
 * - 로컬 LLM 구동용 GGUF 모델들의 백그라운드 다운로드 진행 상황(downloadStatus), 대기열 큐 목록(downloadQueue)을 동적 보존한다.
 * - 마크다운 문서를 PDF/Word/hwp 등으로 내보내는 인쇄 트랜잭션의 진행률(exportProgress) 및 상태바 최소화 축소 여부(exportMinimized)를 통제한다.
 * - 멤버십 프로 플랜 활성화 상태(isProPlan, 로컬스토리지 연동) 및 무료 사용 일일제한 횟수 도달 가드 락(isFreeModeLocked) 상태를 유지한다.
 * - MCP(Model Context Protocol) 서버 인스턴스 어레이(mcpServersState) 및 활성화된 부가 플러그인 리스트(activePlugins)를 보존한다.
 * - 마크다운 에디터 화면(editorZoom) 및 가상 브라우저 패널(browserZoom)의 텍스트 확대 비율(배율 0.4x ~ 2.5x 범위 제한)을 조절한다.
 * 
 * [책임이 아닌 것 - NON-RESPONSIBILITY]
 * - UI 오버레이 컴포넌트의 노출 여부 (useUIStore에서 전담).
 * 
 * [절대 깨면 안 되는 계약 - CONTRACT]
 * - MUST: 에디터 줌 및 가상 브라우저 줌 수동 조절(`adjustEditorZoom`, `adjustBrowserZoom`) 액션 구동 시,
 *   화면 렌더 텍스트 붕괴 및 아웃오브바운드 붕괴를 막기 위해 **최소 0.4배(40%) ~ 최대 2.5배(250%)**의 하드 한계 배율(Math.min, Math.max) 가드 Invariant를 보존할 것.
 
 * [소비처 - CONSUMERS / USAGE CONTEXT]
 * - 소비처 A (src/renderer/hooks/): 도메인 훅 내부에서 상태 값 바인딩 및 변경 액션 호출 시 소비.
 * - 소비처 B (src/renderer/components/): 컴포넌트 내 렌더 조건 판단을 위해 실시간 구독(Subscribe) 소비.
 */

/* 
 * [IMPORT SEGMENTATION & CONTRACTS]
 * - create: Zustand 라이브러리의 불변 상태 트리 스토어 생성 빌더 API.
 */
import { create } from 'zustand'
import { safeJsonParse } from '../utils/safeJson'

/* 
 * [SHARED SCHEMAS]
 * - ExportProgress: 문서 내보내기 진행률, 메세지 및 단계(phase) 메타 구조체.
 */
import type { ExportProgress } from '../../shared/types'

/**
 * 기본 내보내기 상태 (idle 상태 구조 객체 상수).
 */
export const IDLE_EXPORT_PROGRESS: ExportProgress = {
  phase: 'idle',
  format: '',
  percent: 0,
  message: ''
}

export type PermissionScope = 
  | 'collab:doc_edit'    // 실시간 문서 공동 편집 & 캐럿/프레젠스 공유
  | 'collab:text_chat'   // 실시간 텍스트 채팅 채널
  | 'collab:voice_chat'  // WebRTC 기반 음성 통화
  | 'collab:cloud_relay' // AMEVA 클라우드 전용 고성능 중계 서버
  | 'collab:enterprise'; // 엔터프라이즈 맞춤 계약 권한

export type UserTier = 'free' | 'pro' | 'enterprise';

/**
 * ProcessState 인터페이스 정의.
 * 다운로드 큐, 트랜잭션 진행 상태 및 렌더 배율을 관리하는 스토어 구조.
 */
export interface ProcessState {
  /*
   * [MODEL DOWNLOAD QUEUE STATES]
   * - downloadStatus: 현재 내려받고 있는 특정 파일 다운로드 현황.
   * - setDownloadStatus: 다운로드 현황 지정 액션.
   * - downloadQueue: 다운로드 대기 리스트.
   * - addDownloadToQueue: 대기열 추가 액션.
   * - removeDownloadFromQueue: 대기열 제거 액션.
   * - updateDownloadInQueue: 대기열 개체의 속성 갱신 액션.
   * - clearCompletedDownloads: 완료 또는 오류난 파일들을 대기열에서 비우는 액션.
   */
  downloadStatus: any
  setDownloadStatus: (status: any) => void
  downloadQueue: any[]
  addDownloadToQueue: (item: any) => void
  removeDownloadFromQueue: (id: string) => void
  updateDownloadInQueue: (id: string, updates: any) => void
  clearCompletedDownloads: () => void

  /*
   * [DOCUMENT EXPORTER STATUS STATES]
   * - exportProgress: 다양한 포맷 내보내기 파이프라인의 실시간 연산 진척 상태.
   * - setExportProgress: 내보내기 진행 지정 액션.
   * - updateExportProgress: 진행 정보 부분 갱신 액션.
   * - resetExportProgress: 내보내기 완료 후 상태 초기화 액션.
   * - exportMinimized: 내보내기 진척 모달을 우하단 간소화 바로 숨겨 띄우는지 여부.
   * - setExportMinimized: 최소화 여부 지정 액션.
   * - toggleExportMinimized: 최소화 토글 액션.
   */
  exportProgress: ExportProgress
  setExportProgress: (progress: ExportProgress) => void
  updateExportProgress: (progress: Partial<ExportProgress>) => void
  resetExportProgress: () => void
  exportMinimized: boolean
  setExportMinimized: (val: boolean) => void
  toggleExportMinimized: () => void

  /*
   * [MEMBERSHIP BILLING & FREE LOCK STATES]
   * - userTier: 현재 요금제 등급
   * - setUserTier: 요금제 변경 액션
   * - grantedPermissions: 유저에게 부여된 권한 배열
   * - setGrantedPermissions: 권한 배열 갱신 액션
   * - hasPermission: 특정 권한 유무 확인 유틸
   * - isFreeModeLocked: 일일 AI 제한 한도 도달에 따른 잠금 상태 플래그.
   * - setIsFreeModeLocked: 잠금 지정 액션.
   */
  userTier: UserTier
  setUserTier: (tier: UserTier) => void
  grantedPermissions: PermissionScope[]
  setGrantedPermissions: (perms: PermissionScope[]) => void
  hasPermission: (scope: PermissionScope) => boolean
  isFreeModeLocked: boolean
  setIsFreeModeLocked: (val: boolean) => void

  /*
   * [MCP SYSTEM CONFIG STATES]
   * - mcpServersState: 런타임에 주입 마운트된 Model Context Protocol 서버 정보 리스트.
   * - setMcpServersState: 서버 리스트 동기화 지정 액션.
   */
  mcpServersState: any[]
  setMcpServersState: (servers: any[]) => void

  /*
   * [PLUGINS LOGIC STATES]
   * - activePlugins: 현재 로드 활성화되어 있는 부가 플러그인 리스트.
   * - setActivePlugins: 플러그인 목록 지정 액션.
   */
  activePlugins: string[]
  setActivePlugins: (plugins: string[]) => void

  /*
   * [ZOOM SCALE RATIO STATES]
   * - editorZoom: 마크다운 에디터 화면 스케일 배율.
   * - setEditorZoom: 에디터 스케일 지정 액션.
   * - adjustEditorZoom: 델타폭만큼 줌을 증감 조절하는 액션 (최저0.4x~최고2.5x 한계).
   * - browserZoom: 사이드 브라우저 패널 화면 스케일 배율.
   * - setBrowserZoom: 브라우저 스케일 지정 액션.
   * - adjustBrowserZoom: 델타폭만큼 브라우저 줌을 증감 조절하는 액션 (최저0.4x~최고2.5x 한계).
   */
  editorZoom: number
  setEditorZoom: (val: number) => void
  adjustEditorZoom: (delta: number) => void
  browserZoom: number
  setBrowserZoom: (val: number) => void
  adjustBrowserZoom: (delta: number) => void
}

/**
 * 권한 및 요금제 초기값: LocalStorage에서 동기 복원
 */
function loadUserTier(): UserTier {
  try {
    const tier = localStorage.getItem('user-tier');
    if (tier === 'pro' || tier === 'enterprise') return tier as UserTier;
    return 'free';
  } catch {
    return 'free';
  }
}

function loadGrantedPermissions(): PermissionScope[] {
  try {
    const perms = localStorage.getItem('granted-permissions');
    if (perms) return safeJsonParse(perms, null);
    const tier = loadUserTier();
    if (tier === 'pro') return ['collab:doc_edit', 'collab:text_chat', 'collab:voice_chat', 'collab:cloud_relay'];
    if (tier === 'enterprise') return ['collab:doc_edit', 'collab:text_chat', 'collab:voice_chat', 'collab:cloud_relay', 'collab:enterprise'];
    return [];
  } catch {
    return [];
  }
}

/**
 * useProcessStore Zustand 스토어 본체 정의.
 */
export const useProcessStore = create<ProcessState>((set, get) => ({
  downloadStatus: null,
  setDownloadStatus: (status) => set((state) => ({ downloadStatus: typeof status === 'function' ? status(state.downloadStatus) : status })),

  downloadQueue: [],
  addDownloadToQueue: (item) =>
    set((state) => ({ downloadQueue: [...state.downloadQueue, item] })),
  removeDownloadFromQueue: (id) =>
    set((state) => ({
      downloadQueue: state.downloadQueue.filter((q: any) => q.id !== id)
    })),
  updateDownloadInQueue: (id, updates) =>
    set((state) => ({
      downloadQueue: state.downloadQueue.map((q: any) =>
        q.id === id ? { ...q, ...updates } : q
      )
    })),
  clearCompletedDownloads: () =>
    set((state) => ({
      downloadQueue: state.downloadQueue.filter((q: any) => q.status !== 'completed' && q.status !== 'error')
    })),

  exportProgress: IDLE_EXPORT_PROGRESS,
  setExportProgress: (progress) => set({ exportProgress: progress }),
  updateExportProgress: (fields) =>
    set((state) => ({
      exportProgress: { ...state.exportProgress, ...fields }
    })),
  resetExportProgress: () => set({ exportProgress: IDLE_EXPORT_PROGRESS }),

  exportMinimized: false,
  setExportMinimized: (val) => set({ exportMinimized: val }),
  toggleExportMinimized: () => set((state) => ({ exportMinimized: !state.exportMinimized })),

  userTier: loadUserTier(),
  setUserTier: (tier) => {
    localStorage.setItem('user-tier', tier);
    const defaultPerms: PermissionScope[] = 
      tier === 'pro' ? ['collab:doc_edit', 'collab:text_chat', 'collab:voice_chat', 'collab:cloud_relay'] :
      tier === 'enterprise' ? ['collab:doc_edit', 'collab:text_chat', 'collab:voice_chat', 'collab:cloud_relay', 'collab:enterprise'] : [];
    
    localStorage.setItem('granted-permissions', JSON.stringify(defaultPerms));
    set({ userTier: tier, grantedPermissions: defaultPerms });
  },
  grantedPermissions: loadGrantedPermissions(),
  setGrantedPermissions: (perms) => {
    localStorage.setItem('granted-permissions', JSON.stringify(perms));
    set({ grantedPermissions: perms });
  },
  hasPermission: (scope) => {
    return get().grantedPermissions.includes(scope);
  },

  isFreeModeLocked: false,
  setIsFreeModeLocked: (val) => set({ isFreeModeLocked: val }),

  mcpServersState: [],
  setMcpServersState: (servers) => set({ mcpServersState: servers }),

  activePlugins: [],
  setActivePlugins: (plugins) => set({ activePlugins: plugins }),

  editorZoom: 1.0,
  setEditorZoom: (val) => set({ editorZoom: val }),
  
  /**
   * [CONTRACT - Editor Zoom Adjust Action]
   * - Rationale: 배율 범위를 40% ~ 250%로 가드하고, 부동 소수점 오차 방지를 위해 소수점 첫째 자리에서 반올림 동기화한다.
   */
  adjustEditorZoom: (delta) =>
    set((state) => {
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `next`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const next = ...` 형태로 안전 캐싱 후 가공 기동.
       */
      const next = Math.min(2.5, Math.max(0.4, Math.round((state.editorZoom + delta) * 10) / 10))
      return { editorZoom: next }
    }),

  browserZoom: 1.0,
  setBrowserZoom: (val) => set({ browserZoom: val }),
  
  /**
   * [CONTRACT - Browser Zoom Adjust Action]
   * - Rationale: 배율 범위를 40% ~ 250%로 가드하고, 부동 소수점 오차 방지를 위해 소수점 첫째 자리에서 반올림 동기화한다.
   */
  adjustBrowserZoom: (delta) =>
    set((state) => {
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `next`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const next = ...` 형태로 안전 캐싱 후 가공 기동.
       */
      const next = Math.min(2.5, Math.max(0.4, Math.round((state.browserZoom + delta) * 10) / 10))
      return { browserZoom: next }
    })
}))

// MCP Circuit Breaker 연동
if (typeof window !== 'undefined') {
  window.addEventListener('mcp_circuit_breaker_open', () => {
    useProcessStore.setState((state) => {
      const updatedServers = state.mcpServersState.map((server: any) => ({
        ...server,
        status: 'UNAVAILABLE'
      }));
      return { mcpServersState: updatedServers };
    });
  });
}

