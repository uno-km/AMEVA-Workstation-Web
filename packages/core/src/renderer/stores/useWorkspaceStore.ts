/**
 * @file useWorkspaceStore.ts
 * @system AMEVA OS Desktop Workstation - Global State Store
 * @location src/renderer/stores/useWorkspaceStore.ts
 * @role Active workspace documents & Editor text buffer Zustand Store
 * 
 * [책임 범위 - RESPONSIBILITY]
 * - 현재 편집 창에 로드된 마크다운 원시 텍스트 버퍼(currentContent), 물리 파일 경로(filePath), 그리고 저장 여부 판단용 원본 텍스트(originalContent) 상태를 보존한다.
 * - 다중 문서 브라우징을 위한 탭 데이터 어레이(tabs), 활성 탭 키(activeTabId), 파일 로딩 결합 모드(fileOpenMode: replace/append/tab)를 제어한다.
 * - 에디터 내에서 드래그 포커스된 문자열(selectedText), 현재 커서가 놓인 단락 키(activeBlockId)를 실시간 바인딩한다.
 * - 사용자가 AI에게 컨텍스트 참조로 전송 지정한 블록 목록(taggedBlocks) 및 히스토리 스냅샷 비교용 복원 버퍼(selectedSnapshot)를 유지한다.
 * 
 * [책임이 아닌 것 - NON-RESPONSIBILITY]
 * - UI 다이얼로그 개폐 가시성 상태 관리 (useUIStore에서 전담).
 * - 웹환경 밖의 실제 주 프로세스 저장/로드 호출 (useAppFileOperations 훅에 위임).
 * 
 * [절대 깨면 안 되는 계약 - CONTRACT]
 * - MUST NOT duplicate tagged block: 동일한 에디터 블록 단락이 AI 태그 리스트에 두 번 이상 들어가지 않도록,
 *   반드시 `addTaggedBlock` 액션 실행 단계에서 `state.taggedBlocks.some`을 통한 ID 중복 검사 Invariant를 보존할 것.
 
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
 * WorkspaceTab 인터페이스 정의.
 * 다중 탭 기능 활성화 시 개별 탭 윈도우에 매핑되는 문서 메타데이터 정보.
 */
export interface WorkspaceTab {
  id: string
  filePath: string | null
  content: string
  blocks: any[]
  originalContent?: string
  lastSavedTime?: Date | null
  pdfData?: string | null
  pdfFileName?: string
  documentPassword?: string | null
}

/**
 * TaggedBlock 인터페이스 정의.
 * AI 채팅창에 프롬프트로 전송하기 위해 지정한 개별 에디터 블록 사본 정보.
 */
export interface TaggedBlock {
  id: string
  text: string
}

/**
 * WorkspaceState 인터페이스 정의.
 * 에디터 문서 제어와 탭 변경에 직접 연동되는 핵심 상태 및 액션 맵.
 */
export interface WorkspaceState {
  /*
   * [FILE PERSISTENCE STATES]
   * - filePath: 현재 활성화된 문서의 물리 파일 절대 경로.
   * - setFilePath: 파일 경로 갱신 액션.
   */
  filePath: string | null
  setFilePath: (path: string | null) => void

  /*
   * [EDITOR TEXT BUFFER STATES]
   * - currentContent: 에디터와 1:1 동기화되는 실시간 마크다운 문자열 본문.
   * - setCurrentContent: 텍스트 본문 갱신 액션.
   * - appendContent: 본문 끝에 신규 텍스트를 줄바꿈하여 덧붙이는 갱신 액션.
   * - originalContent: 변경 전 순정 마크다운 본문 (isDirty 저장 가이딩 비교용).
   * - setOriginalContent: 원본 내용 지정 액션.
   * - lastSavedTime: 마지막 디스크 자동/수동 저장 시점 타임스탬프.
   * - setLastSavedTime: 타임스탬프 지정 액션.
   */
  currentContent: string
  setCurrentContent: (content: string) => void
  appendContent: (text: string) => void
  originalContent: string
  setOriginalContent: (content: string) => void
  lastSavedTime: Date | null
  setLastSavedTime: (time: Date | null) => void

  /*
   * [MULTI TAB BROWSER STATES]
   * - fileOpenMode: 파일을 열었을 때의 기본 처리 규칙.
   *   - replace: 현재 활성 버퍼를 통째로 교체.
   *   - append: 현재 활성 버퍼 하단 뒤에 덧붙임.
   *   - tab: 신규 탭 윈도우를 개설하여 띄움.
   * - setFileOpenMode: 파일 열기 모드 변경 액션.
   * - tabs: 마운트되어 있는 전체 탭 목록.
   * - setTabs: 탭 목록 교체 액션.
   * - addTab: 신규 탭 추가 액션.
   * - removeTab: 특정 ID의 탭 소멸 액션.
   * - updateActiveTab: 현재 활성화된 탭의 필드정보 부분 갱신 액션.
   * - updateTab: 특정 ID 탭의 필드정보 부분 갱신 액션.
   * - activeTabId: 현재 포커싱되어 작업 중인 탭의 고유 키.
   * - setActiveTabId: 활성 탭 키 지정 액션.
   */
  fileOpenMode: 'replace' | 'append' | 'tab'
  setFileOpenMode: (mode: 'replace' | 'append' | 'tab') => void
  tabs: WorkspaceTab[]
  setTabs: (tabs: WorkspaceTab[]) => void
  addTab: (tab: WorkspaceTab) => void
  removeTab: (tabId: string) => void
  updateActiveTab: (fields: Partial<WorkspaceTab>) => void
  updateTab: (tabId: string, fields: Partial<WorkspaceTab>) => void
  activeTabId: string | null
  setActiveTabId: (id: string | null) => void

  /*
   * [SPLIT VIEW STATE]
   * - isSplitView: 병렬 보기 모드 활성화 여부
   * - toggleSplitView: 병렬 보기 토글 액션
   */
  isSplitView: boolean
  toggleSplitView: () => void

  /*
   * [APPENDED DOCUMENT ANCHORS]
   * - appendedFiles: 한 화면에 여러 문서를 덧붙여 노출할 때 시작 위치 북마크를 보존하는 정보 리스트.
   * - setAppendedFiles: 북마크 정보 교체 액션.
   * - addAppendedFile: 단일 파일 북마크 추가 액션.
   */
  appendedFiles: { id: string; filePath: string; startBlockId: string }[]
  setAppendedFiles: (files: { id: string; filePath: string; startBlockId: string }[]) => void
  addAppendedFile: (file: { id: string; filePath: string; startBlockId: string }) => void

  /*
   * [SELECTION TRACKING STATES]
   * - selectedText: 사용자가 드래그 지정하여 임시 캡처한 평문 문자열.
   * - setSelectedText: 드래그 텍스트 갱신 액션.
   * - activeBlockId: 현재 포커스 캐럿이 속해있는 단락 블록 키.
   * - setActiveBlockId: 포커스 블록 키 지정 액션.
   * - taggedBlocks: 사용자가 AI 참조용 별표(✨) 버튼을 누른 블록의 모음.
   * - setTaggedBlocks: 태그 블록 모음 덮어쓰기 액션.
   * - addTaggedBlock: 단일 블록 태깅 액션 (중복 가드 포함).
   * - removeTaggedBlock: 특정 블록 태깅 소멸 액션.
   */
  selectedText: string
  setSelectedText: (text: string) => void
  activeBlockId: string | null
  setActiveBlockId: (id: string | null) => void
  taggedBlocks: TaggedBlock[]
  setTaggedBlocks: (blocks: TaggedBlock[]) => void
  addTaggedBlock: (block: TaggedBlock) => void
  removeTaggedBlock: (id: string) => void

  /*
   * [SNAPSHOT COMPARE SPEC]
   * - selectedSnapshot: DB 복원 히스토리 모달에서 비교 타깃으로 임시 클릭한 문서 스냅샷.
   * - setSelectedSnapshot: 스냅샷 비교 타깃 지정 액션.
   */
  selectedSnapshot: string | null
  setSelectedSnapshot: (snapshot: string | null) => void

  /*
   * [SMARTDOCS MODE STATE]
   * - isSmartDocsMode: SmartDocs(공문서) 조판 및 뷰 모드 활성화 여부
   * - setIsSmartDocsMode: 상태 토글 액션
   */
  isSmartDocsMode: boolean
  setIsSmartDocsMode: (val: boolean) => void

  /*
   * [PDF VIEWER STATE]
   * - pdfData: PDF 파일 열기 시 원본 base64 데이터 보존. 모드 전환 시에도 파괴되지 않아야 함.
   * - setPdfData: PDF 데이터 갱신 액션.
   * - pdfFileName: 현재 열린 PDF 파일명.
   */
  pdfData: string | null
  setPdfData: (data: string | null) => void
  pdfFileName: string
  setPdfFileName: (name: string) => void
}

/**
 * useWorkspaceStore Zustand 스토어 본체 정의.
 */
export const useWorkspaceStore = create<WorkspaceState>((set) => ({
  // 파일 상태 초기값
  filePath: null,
  setFilePath: (path) => set({ filePath: path }),

  currentContent: '',
  setCurrentContent: (content) => set({ currentContent: content }),
  
  // 본문 하단 덧붙이기 액션 (기존 문장이 있을 때 줄바꿈 기호 삽입 Invariant)
  appendContent: (text) =>
    set((state) => ({
      currentContent: state.currentContent ? state.currentContent + '\n' + text : text
    })),

  originalContent: '',
  setOriginalContent: (content) => set({ originalContent: content }),

  lastSavedTime: null,
  setLastSavedTime: (time) => set({ lastSavedTime: time }),

  // 탭 상태 초기값
  fileOpenMode: 'replace',
  setFileOpenMode: (mode) => set({ fileOpenMode: mode }),

  tabs: [{ id: 'default', filePath: null, content: '', blocks: [] }],
  setTabs: (tabs) => set({ tabs }),
  addTab: (tab) =>
    set((state) => ({
      tabs: [...state.tabs, tab]
    })),
  removeTab: (tabId) =>
    set((state) => ({
      tabs: state.tabs.filter((t) => t.id !== tabId)
    })),
  updateActiveTab: (fields) =>
    set((state) => ({
      tabs: state.tabs.map((t) => (t.id === state.activeTabId ? { ...t, ...fields } : t))
    })),
  updateTab: (tabId, fields) =>
    set((state) => ({
      tabs: state.tabs.map((t) => (t.id === tabId ? { ...t, ...fields } : t))
    })),

  activeTabId: 'default',
  setActiveTabId: (id) => set({ activeTabId: id }),

  isSplitView: false,
  toggleSplitView: () => set((state) => ({ isSplitView: !state.isSplitView })),

  appendedFiles: [],
  setAppendedFiles: (files) => set({ appendedFiles: files }),
  addAppendedFile: (file) =>
    set((state) => ({
      appendedFiles: [...state.appendedFiles, file]
    })),

  // 에디터 마우스 선택 상태 초기값
  selectedText: '',
  setSelectedText: (text) => set({ selectedText: text }),

  activeBlockId: null,
  setActiveBlockId: (id) => set({ activeBlockId: id }),

  taggedBlocks: [],
  setTaggedBlocks: (taggedBlocks) => set({ taggedBlocks }),
  
  /**
   * [CONTRACT - Add Tagged Block Action]
   * - Rationale: 동일 블록의 중복 삽입을 방지하기 위해, state.taggedBlocks에 동일한 id가 존재하면 빈 개체({})를 반환해 조기 리턴한다.
   */
  addTaggedBlock: (block) =>
    set((state) => {
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `state.taggedBlocks.some((b) => b.id === block.id)`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (state.taggedBlocks.some((b) => b.id === block.id))` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
      if (state.taggedBlocks.some((b) => b.id === block.id)) return {}
      return { taggedBlocks: [...state.taggedBlocks, block] }
    }),
  removeTaggedBlock: (id) =>
    set((state) => ({
      taggedBlocks: state.taggedBlocks.filter((b) => b.id !== id)
    })),

  selectedSnapshot: null,
  setSelectedSnapshot: (snapshot) => set({ selectedSnapshot: snapshot }),

  isSmartDocsMode: false,
  setIsSmartDocsMode: (val) => set({ isSmartDocsMode: val }),

  // PDF 븷얰어 전용 데이터 (pdfData는 모드 전환시에도 보존됨)
  pdfData: null,
  setPdfData: (data) => set({ pdfData: data }),
  pdfFileName: '',
  setPdfFileName: (name) => set({ pdfFileName: name }),
}))
