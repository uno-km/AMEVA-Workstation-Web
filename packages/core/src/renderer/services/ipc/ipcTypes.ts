/**
 * @file ipcTypes.ts
 * @system AMEVA OS Desktop Workstation
 * @location src/renderer/services/ipc/ipcTypes.ts
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

/**
 * ipcTypes.ts
 *
 * Electron IPC 통신에서 사용되는 공통 타입 정의 모음.
 * window.electronAPI의 메서드 시그니처와 IPC 이벤트 페이로드를 명시적으로 정의한다.
 * 이 파일은 electron API와 관련된 모든 타입의 단일 진실 원천(Single Source of Truth)이다.
 */

/** LLM 생성 요청 파라미터 */
export interface LLMGenerateParams {
  sessionId: string
  modelPath: string
  prompt: string
  systemPrompt?: string
  maxTokens?: number
  temperature?: number
  apiType?: 'local' | 'api' | 'wasm' | 'ollama'
  apiKey?: string
  apiEndpoint?: string
  apiModel?: string
  gpuOnly?: boolean
  context?: string
  history?: Array<{ role: 'user' | 'assistant'; content: string }>
}

/** LLM 생성 응답 */
export interface LLMGenerateResult {
  success: boolean
  content?: string
  response?: string
  error?: string
}

/** LLM 완료 이벤트 데이터 */
export interface LLMDoneEventData {
  success: boolean
  error?: string
  content?: string
}

/** LLM 로그 이벤트 데이터 */
export interface LLMLogEventData {
  text: string
  prefix?: string
  chatId?: string
  missionId?: string
}

/** 모델 정보 */
export interface ModelInfo {
  path: string
  filename: string
  name?: string
  size?: number
}

/** URL 메타데이터 (링크 프리뷰) */
export interface UrlMetadata {
  title?: string
  description?: string
  image?: string
}

/** 파일 내용 이벤트 데이터 */
export interface FileOpenEventData {
  filePath: string
  content: string
  isBinary?: boolean
}

/** 헬스 체크 응답 */
export interface HealthCheckResult {
  status: 'ok' | 'loading model' | 'ready' | 'error' | 'offline'
  message?: string
}

/** 모델 임포트 결과 */
export interface ModelImportResult {
  success: boolean
  error?: string
}

/** 모델 다운로드 진행 이벤트 */
export interface ModelDownloadProgressEvent {
  modelId: string
  progress: number
  total?: number
  speed?: string
  remaining?: string
  status?: string
}

/** 내보내기 진행 이벤트 */
export interface ExportProgressEvent {
  phase: string
  format: string
  percent: number
  message: string
}

