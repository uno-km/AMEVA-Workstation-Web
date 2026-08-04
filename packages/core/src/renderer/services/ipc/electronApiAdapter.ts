/**
 * @file electronApiAdapter.ts
 * @system AMEVA OS Desktop Workstation - IPC Integration Layer
 * @location src/renderer/services/ipc/electronApiAdapter.ts
 * @role IPC Bridge API single point of access & global Window type adapter
 * 
 * [설계 의도 - DESIGN INTENT / ADR]
 * - Electron 보안 가이드라인(Context Isolation)에 따라 브라우저 렌더러는 Node.js API에 직접 접근할 수 없으며,
 *   오직 `preload.js` 가 window.electronAPI 에 주입해 둔 컨텍스트 브릿지 채널만 사용할 수 있다.
 * - 본 파일은 이 IPC 채널 함수들의 TypeScript `Window` 전역 인터페이스 타이핑 계약을 명세하고,
 *   하위 서브 어댑터 모듈들(llm, file, mcp, keychain 등)의 실제 구현체 훅/함수를 렌더러에 단일 게이트웨이로 통합 재배포(re-export)한다.
 * 
 * [책임 범위 - RESPONSIBILITY]
 * - window.electronAPI 규격의 타입 선언.
 * - 서브 어댑터 파일들의 1:1 re-export 대리.
 * 
 * [절대 깨면 안 되는 계약 - CONTRACT]
 * - MUST: 기존 export/import 호환성을 보장하기 위해 어댑터 하위 경로 파일들의 export문을 그대로 보존할 것.
 * - MUST NOT: 본 어댑터를 통하지 않는 ad-hoc window 캐스팅(`(window as any).electronAPI`) 사용을 지양하고 본 어댑터 인터페이스를 타깃할 것.
 
 * [소비처 - CONSUMERS / USAGE CONTEXT]
 * - 소비처 A (src/renderer/App.tsx): AMEVA OS 최상위 마운트 레이어에서 의존성 로더로 연동 소비.
 * - 소비처 B (src/renderer/main.tsx): 렌더러 엔트리 라이프사이클의 기본 기능으로 수입 소비.
 */

/* 
 * [IMPORT SEGMENTATION & CONTRACTS - IPC TYPINGS]
 * - LLMGenerateParams ~ ModelDownloadProgressEvent: 로컬 추론 기동 매개변수 및 다운로드 백업용 이벤트 시그니처.
 * - MessageBoxOptions: OS 네이티브 확인 상자 옵션.
 * - MCPSpawnResult ~ MCPKillResult: Model Context Protocol 프로세스 구동 반환 규격.
 * - WebSearchResult: 구글/네이버 웹 샌드박스 API 검색 결과 구조.
 * - CollabServerStatus ~ CollabServerStopResult: Yjs WebRTC 룸 포트 바인딩 관리 구조.
 */
import type {
  LLMGenerateParams,
  LLMGenerateResult,
  LLMDoneEventData,
  LLMLogEventData,
  ModelInfo,
  UrlMetadata,
  FileOpenEventData,
  HealthCheckResult,
  ModelImportResult,
  ModelDownloadProgressEvent
} from './ipcTypes'

import type { MessageBoxOptions } from './adapters/appAdapter'
import type { MCPSpawnResult, MCPCallResponse, MCPKillResult } from './adapters/mcpAdapter'
import type { WebSearchResult } from './adapters/sandboxAdapter'
import type { CollabServerStatus, CollabServerStartResult, CollabServerStopResult } from './adapters/collabAdapter'

declare global {
  interface Window {
    /**
     * Electron ContextBridge 주입 개체.
     * Rationale: preload.js 와의 IPC 통신 시그널 매핑 계약.
     */
    electronAPI?: {
      // 1. LLM 로컬/원격 가동 제어
      llmGenerate: (params: LLMGenerateParams) => Promise<LLMGenerateResult>
      llmAbort: (sessionId: string) => void
      llmStart: (modelPath: string) => Promise<{ success: boolean; error?: string }>
      llmStop: () => Promise<void>
      llmCheckHealth: () => Promise<HealthCheckResult>
      llmListModels: (type?: string) => Promise<ModelInfo[]>
      llmImportModel: (sourcePath: string) => Promise<ModelImportResult>
      llmGetLogs: () => Promise<string>
      llmAddLog: (data: LLMLogEventData) => void
      
      // 2. LLM 비동기 이벤트 리스너 (구독 후 클린업을 위한 해제 함수 반환 계약)
      onLLMToken: (sessionId: string, callback: (token: string) => void) => () => void
      onLLMDone: (sessionId: string, callback: (data: LLMDoneEventData) => void) => () => void
      onLLMLog: (callback: (data: LLMLogEventData) => void) => () => void
      onModelDownloadProgress: (callback: (data: ModelDownloadProgressEvent) => void) => () => void
      
      // 3. 네이티브 파일 I/O 및 브라우저 탐색
      openFile: () => Promise<FileOpenEventData | null>
      readFromPath: (path: string) => Promise<{ content?: string; success: boolean; isBinary?: boolean; error?: string } | null>
      saveFile: (content: string, filePath?: string | null) => Promise<{ filePath?: string; success: boolean }>
      saveFileAs: (content: string, filePath?: string | null) => Promise<{ filePath?: string; success: boolean }>
      selectLocalFile: (filters?: Array<{ name: string; extensions: string[] }>) => Promise<{ filePath: string; base64: string } | null>
      onFileOpenArgv: (callback: (event: unknown, file: FileOpenEventData) => void) => () => void
      fetchUrlMetadata: (url: string) => Promise<UrlMetadata>
      openExternalLink: (url: string) => void
      processPptx: (pptxPath: string) => Promise<{ success: boolean; slides: string[]; fallback: boolean; slides_text?: any[]; error?: string }>
      readBinary: (targetPath: string) => Promise<{ success: boolean; content?: string; error?: string }>
      writeBinary: (targetPath: string, base64Content: string) => Promise<{ success: boolean; path?: string; error?: string }>
      
      // 4. 앱 생명주기 및 레이아웃 제어
      appReady: () => void
      getZoomFactor?: () => Promise<number>
      setZoomFactor?: (factor: number) => void
      setZoomLevel?: (level: number) => void
      getZoomLevel?: () => Promise<number>
      showMessageBox?: (options: MessageBoxOptions) => Promise<{ response: number }>
      /**
       * 클립보드에 이미지 데이터를 기록하는 함수
       * - Expected Value Flow: dataUrl (base64 PNG string) -> IPC 통신 -> Electron Native Clipboard API -> boolean 성공 여부 반환
       * - 시나리오: 사용자가 웹뷰 화면 혹은 유틸리티 탭의 일부 영역을 캡처한 이미지 데이터를 에디터 붙여넣기용 클립보드에 저장할 때 소비됨.
       */
      clipboardWriteImage?: (dataUrl: string) => Promise<boolean>
      
      // 5. OS 키체인 자격증명 보관소
      keychainGet?: (key: string) => Promise<string | null>
      keychainSet?: (key: string, value: string) => Promise<{ success: boolean; error?: string }>
      keychainDelete?: (key: string) => Promise<{ success: boolean; error?: string }>
      
      // 6. GPU 메타 조회 및 리스타트
      llmGetGpuName?: () => Promise<string>
      llmRestart?: (modelPath?: string) => Promise<{ success: boolean; error?: string }>
      
      // 7. GGUF 모델 원격 백그라운드 다운로드
      llmDownloadModel?: (payload: { url: string; filename: string; type?: 'llm' | 'code' | 'stt' }) => Promise<{ success: boolean; error?: string }>
      onLLMDownloadProgress?: (callback: (data: ModelDownloadProgressEvent) => void) => () => void
      
      // 8. 프로 플랜 및 제한 상태 조회
      planGetStatus?: () => Promise<boolean>
      planSetStatus?: (isPro: boolean) => Promise<{ success: boolean; isPro?: boolean; error?: string }>
      isFreeMode?: () => Promise<boolean>
      
      // 9. MCP (Model Context Protocol) 통신 인터페이스
      mcpSpawn?: (serverId: string, command: string, args: string[]) => Promise<MCPSpawnResult | null>
      mcpCall?: (serverId: string, request: Record<string, unknown>) => Promise<MCPCallResponse | null>
      mcpKill?: (serverId: string) => Promise<MCPKillResult | null>
      mcpGetToken?: () => Promise<string | null>
      
      // 10. PDF/Word 문서 내보내기 익스포터
      onExportProgress?: (callback: (data: any) => void) => () => void
      printToPDF?: (htmlContent: string) => Promise<string | null>
      newWindow?: () => void
      closeApp?: () => void
      forceCloseApp?: () => void
      saveExportedFile?: (data: string, isBase64: boolean, defaultName: string, filters: { name: string; extensions: string[] }[]) => Promise<string | null>
      exportConvert?: (payload: { blocks: Record<string, unknown>[]; format: string; defaultName: string }) => Promise<{ success: boolean; savedPath?: string; error?: string }>
      
      // 11. 주피터 실행 및 샌드박스 웹 검색
      runPythonCode?: (code: string) => Promise<{ success: boolean; result?: string; error?: string }>
      webSearch?: (query: string) => Promise<WebSearchResult | null>
      
      // 12. Yjs 동시 편집 로컬 중계 서버 초기화
      onServerStatus?: (callback: (status: CollabServerStatus) => void) => () => void
      startCollaborationServer?: (port: number) => Promise<CollabServerStartResult | null>
      stopCollaborationServer?: (port: number) => Promise<CollabServerStopResult | null>
      
      // 13. STT (Speech-to-Text) 휘스퍼 가상 브릿지
      sttTranscribe?: (payload: { audioPath: string; language?: string }) => Promise<{ success: boolean; text?: string; error?: string }>
      sttGetTempPath?: () => Promise<string | null>

      // 14. Google OAuth 2.0 & Google Drive
      googleAuthLogin?: (connectDrive: boolean) => Promise<{ success: boolean; user?: any; error?: string }>
      googleAuthLogout?: () => Promise<{ success: boolean }>
      googleAuthGetStatus?: () => Promise<{ success: boolean; user?: any; error?: string; message?: string }>
      setBypassNativeContextMenu?: (bypass: boolean) => void
      executeTerminal?: (cmd: string, cwd?: string) => Promise<{ stdout: string; stderr: string; newCwd: string }>
    }
  }
}

export function setBypassNativeContextMenu(bypass: boolean): void {
  if (window.electronAPI?.setBypassNativeContextMenu) {
    window.electronAPI.setBypassNativeContextMenu(bypass);
  }
}

export function executeTerminal(cmd: string, cwd?: string): Promise<{ stdout: string; stderr: string; newCwd: string }> {
  if (window.electronAPI?.executeTerminal) {
    return window.electronAPI.executeTerminal(cmd, cwd);
  }
  return Promise.resolve({ stdout: '', stderr: 'Not in electron environment', newCwd: '' });
}

/*
 * [SUB-ADAPTER IMPLEMENTATIONS RE-EXPORTS CONTRACT]
 * - Rationale: 기존 임포트 경로가 깨지지 않도록 모든 구현 어댑터를 전수 배포 대행한다.
 */
export * from './adapters/llmAdapter'
export * from './adapters/fileAdapter'
export * from './adapters/appAdapter'
export * from './adapters/keychainAdapter'
export * from './adapters/mcpAdapter'
export * from './adapters/exportAdapter'
export * from './adapters/sandboxAdapter'
export * from './adapters/collabAdapter'
export * from './adapters/sttAdapter'

