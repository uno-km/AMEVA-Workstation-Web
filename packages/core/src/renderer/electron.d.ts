/**
 * @file electron.d.ts
 * @system AMEVA OS Desktop Workstation
 * @location src/renderer/electron.d.ts
 * @role Core module helper and integration logic
 * 
 * [소비처 - CONSUMERS / USAGE CONTEXT]
 * - 소비처 A (src/renderer/App.tsx): AMEVA OS 최상위 마운트 레이어에서 의존성 로더로 연동 소비.
 * - 소비처 B (src/renderer/main.tsx): 렌더러 엔트리 라이프사이클의 기본 기능으로 수입 소비.
 * 
 * [책임 범위 - RESPONSIBILITY]
 * - 본 파일은 AMEVA 시스템 내에서 도메인 목적에 부합하는 연산 및 데이터 처리 흐름을 안전하게 캡슐화한다.
 * - 외부 라이브러리 및 하위 종속성을 조율하고 결과 규격을 일관되게 제공한다.
 * 
 * [절대 깨면 안 되는 계약 - CONTRACT]
 * - MUST: 모든 예외 발생 시 에러를 침묵시키지 말고 에러 로그를 명확하게 남길 것.
 * - MUST NOT: TypeScript any 형식을 우회 수단으로 함부로 선언하지 말 것.
 */

export interface LLMModel {
  name: string
  filename: string
  path: string
  size: number
}

export interface IElectronAPI {
  // 파일 시스템
  openFile: () => Promise<{ content: string; filePath: string } | null>
  saveFile: (content: string, filePath?: string) => Promise<{ filePath?: string; success: boolean } | null>
  saveFileAs?: (content: string, filePath?: string) => Promise<{ filePath?: string; success: boolean } | null>
  saveExportedFile: (data: string, isBase64: boolean, defaultName: string, filters: { name: string; extensions: string[] }[]) => Promise<string | null>
  printToPDF: (htmlContent: string) => Promise<string | null>
  fetchUrlMetadata?: (url: string) => Promise<any>
  runPythonCode?: (code: string) => Promise<{ success: boolean; result?: string; error?: string }>
  // [HIGH-001] showMessageBox Electron 네이티브 다이얼로그
  showMessageBox: (options: {
    type?: 'none' | 'info' | 'error' | 'question' | 'warning'
    buttons?: string[]
    defaultId?: number
    title?: string
    message: string
    detail?: string
  }) => Promise<{ response: number; checkboxChecked?: boolean }>

  // 협업 서버
  startCollaborationServer: (port: number) => Promise<{ running: boolean; port: number; error?: string }>
  stopCollaborationServer: () => Promise<{ running: boolean }>
  onServerStatus: (callback: (status: { running: boolean; port?: number; ip?: string; token?: string; error?: string }) => void) => () => void

  // 상 제어
  setZoomLevel: (level: number) => void
  getZoomLevel: () => Promise<number>

  // 브라우저 원생 줄 (webFrame) — 에디터 외 영역 Ctrl+Wheel 전용
  setZoomFactor: (factor: number) => void
  getZoomFactor: () => Promise<number>

  // 파일 연결
  onFileOpenArgv: (callback: (event: any, file: { content: string; filePath: string }) => void) => () => void

  // 기타
  openExternalLink: (url: string) => void
  closeApp: () => void
  newWindow: () => void
  processPptx?: (pptxPath: string) => Promise<{ success: boolean; slides: string[]; fallback: boolean; slides_text?: any[]; error?: string }>
  readBinary?: (targetPath: string) => Promise<{ success: boolean; content?: string; error?: string }>
  writeBinary?: (targetPath: string, base64Content: string) => Promise<{ success: boolean; path?: string; error?: string }>

  // 홍 로컈 LLM
  llmGenerate: (payload: {
    sessionId: string
    modelPath: string
    prompt: string
    context?: string
    systemPrompt?: string
    maxTokens?: number
    temperature?: number
    contextSize?: number
    apiType?: 'local' | 'api' | 'ollama' | 'wasm'
    apiKey?: string
    apiEndpoint?: string
    apiModel?: string
    gpuOnly?: boolean
    history?: { role: string; content: string }[]
  }) => Promise<{ success: boolean; error?: string; content?: string; response?: string }>

  llmStart: (modelPath: string) => Promise<{ success: boolean; error?: string }>
  llmStop: () => Promise<void>
  llmAbort: (sessionId: string) => void

  onLLMToken: (sessionId: string, callback: (token: string) => void) => () => void
  onLLMDone: (sessionId: string, callback: (data: { success: boolean; fullText?: string; error?: string }) => void) => () => void
  onLLMLog: (callback: (data: { text: string }) => void) => () => void
  llmAddLog: (payload: { text: string; prefix?: string }) => void
  llmGetLogs: () => Promise<string>
  llmCheckHealth: () => Promise<{ status: 'ok' | 'offline' | 'loading model'; running: boolean; error?: string }>
  llmRestart: (modelPath?: string) => Promise<{ success: boolean; error?: string }>
  httpRequest: (payload: { url: string; method: string; headers?: Record<string, string>; body?: string }) => Promise<{
    success: boolean
    status?: number
    statusText?: string
    headers?: Record<string, string>
    body?: string
    error?: string
  }>

  llmListModels: (type?: 'llm' | 'code' | 'ollama') => Promise<LLMModel[]>
  selectLocalFile: (filters?: { name: string; extensions: string[] }[]) => Promise<{ filePath: string; base64: string } | null>
  llmGetGpuName: () => Promise<string>
  clipboardWriteImage: (dataUrl: string) => Promise<boolean>

  // 홍 Whisper STT
  sttTranscribe: (payload: { audioPath: string; language?: string }) => Promise<{ success: boolean; text?: string; error?: string }>
  sttGetTempPath: () => Promise<string>

  llmDownloadModel: (payload: { url: string; filename: string; type?: 'llm' | 'code' | 'stt' }) => Promise<{ success: boolean; error?: string }>
  onLLMDownloadProgress: (callback: (data: { filename: string; progress: number; speed: number; downloadedBytes: number; totalBytes: number; timeRemaining: number }) => void) => () => void
  llmImportModel: (sourcePath: string, type?: 'llm' | 'code') => Promise<{ success: boolean; path?: string; error?: string }>

  // 분산 문서 변환 브리지
  exportConvert: (payload: { blocks: any[]; format: string; defaultName: string }) => Promise<{ success: boolean; savedPath?: string; error?: string }>
  appReady: () => Promise<{ success: boolean }>
  webSearch: (query: string) => Promise<{ success: boolean; result?: string; error?: string }>
  mcpSpawn: (serverId: string, command: string, args: string[]) => Promise<{ success: boolean; error?: string }>
  mcpCall: (serverId: string, request: any) => Promise<any>
  mcpKill: (serverId: string) => Promise<{ success: boolean }>
  isFreeMode: () => Promise<boolean>
  planGetStatus: () => Promise<boolean>
  planSetStatus: (isPro: boolean) => Promise<{ success: boolean; isPro?: boolean; error?: string }>

  // 🔐 OS Keychain (safeStorage) 자격 증명 연동
  keychainSet: (key: string, value: string) => Promise<{ success: boolean; error?: string }>
  keychainGet: (key: string) => Promise<string | null>
  keychainDelete: (key: string) => Promise<{ success: boolean; error?: string }>
}

declare global {
  interface Window {
    electronAPI?: IElectronAPI
  }
}

