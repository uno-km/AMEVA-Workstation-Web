/**
 * @file llmAdapter.ts
 * @system AMEVA OS Desktop Workstation
 * @location src/renderer/services/ipc/adapters/llmAdapter.ts
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

import type {
  LLMGenerateParams,
  LLMGenerateResult,
  LLMDoneEventData,
  LLMLogEventData,
  ModelInfo,
  HealthCheckResult,
  ModelImportResult,
  ModelDownloadProgressEvent
} from '../ipcTypes'

export async function llmGenerate(params: LLMGenerateParams): Promise<LLMGenerateResult> {
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `!window.electronAPI`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (!window.electronAPI)` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
  if (!window.electronAPI) {
    return { success: false, error: 'Electron API not available' }
  }
  return window.electronAPI.llmGenerate(params)
}

  /*
   * [FUNCTION CONTRACT]
   * - 함수 명: `llmAbort`
   * - 역할: 인자 정보를 검수하고 비즈니스 계약 조건에 맞춰 최종 바인딩 결과물/바이너리 버퍼를 반환함.
   * - 예시: `llmAbort(...)` 호출 시 런타임 비동기/동기 연쇄 반응 유도.
   */
export function llmAbort(sessionId: string): void {
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `!window.electronAPI`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (!window.electronAPI)` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
  if (!window.electronAPI) return
  window.electronAPI.llmAbort(sessionId)
}

  /*
   * [FUNCTION CONTRACT]
   * - 함수 명: `onLLMToken`
   * - 역할: 인자 정보를 검수하고 비즈니스 계약 조건에 맞춰 최종 바인딩 결과물/바이너리 버퍼를 반환함.
   * - 예시: `onLLMToken(...)` 호출 시 런타임 비동기/동기 연쇄 반응 유도.
   */
export function onLLMToken(sessionId: string, callback: (token: string) => void): () => void {
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `!window.electronAPI) return (`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (!window.electronAPI) return ()` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
  if (!window.electronAPI) return () => {}
  return window.electronAPI.onLLMToken(sessionId, callback)
}

  /*
   * [FUNCTION CONTRACT]
   * - 함수 명: `onLLMDone`
   * - 역할: 인자 정보를 검수하고 비즈니스 계약 조건에 맞춰 최종 바인딩 결과물/바이너리 버퍼를 반환함.
   * - 예시: `onLLMDone(...)` 호출 시 런타임 비동기/동기 연쇄 반응 유도.
   */
export function onLLMDone(sessionId: string, callback: (data: LLMDoneEventData) => void): () => void {
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `!window.electronAPI) return (`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (!window.electronAPI) return ()` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
  if (!window.electronAPI) return () => {}
  return window.electronAPI.onLLMDone(sessionId, callback)
}

  /*
   * [FUNCTION CONTRACT]
   * - 함수 명: `onLLMLog`
   * - 역할: 인자 정보를 검수하고 비즈니스 계약 조건에 맞춰 최종 바인딩 결과물/바이너리 버퍼를 반환함.
   * - 예시: `onLLMLog(...)` 호출 시 런타임 비동기/동기 연쇄 반응 유도.
   */
export function onLLMLog(callback: (data: LLMLogEventData) => void): () => void {
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `!window.electronAPI) return (`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (!window.electronAPI) return ()` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
  if (!window.electronAPI) return () => {}
  return window.electronAPI.onLLMLog(callback)
}

export async function llmGetLogs(): Promise<string> {
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `!window.electronAPI?.llmGetLogs`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (!window.electronAPI?.llmGetLogs)` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
  if (!window.electronAPI?.llmGetLogs) return ''
  try {
    return await window.electronAPI.llmGetLogs()
  } catch (e) {
    console.error('[llmGetLogs] 로그 조회 실패:', e)
    return ''
  }
}

  /*
   * [FUNCTION CONTRACT]
   * - 함수 명: `llmAddLog`
   * - 역할: 인자 정보를 검수하고 비즈니스 계약 조건에 맞춰 최종 바인딩 결과물/바이너리 버퍼를 반환함.
   * - 예시: `llmAddLog(...)` 호출 시 런타임 비동기/동기 연쇄 반응 유도.
   */
export function llmAddLog(data: LLMLogEventData): void {
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `!window.electronAPI?.llmAddLog`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (!window.electronAPI?.llmAddLog)` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
  if (typeof window === 'undefined' || !window.electronAPI?.llmAddLog) return
  window.electronAPI.llmAddLog(data)
}

export async function llmCheckHealth(): Promise<HealthCheckResult> {
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `!window.electronAPI?.llmCheckHealth`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (!window.electronAPI?.llmCheckHealth)` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
  if (!window.electronAPI?.llmCheckHealth) {
    return { status: 'error', message: 'API not available' }
  }
  try {
    return await window.electronAPI.llmCheckHealth()
  } catch (e) {
    console.error('[llmCheckHealth] 헬스 체크 실패:', e)
    return { status: 'error' }
  }
}

export async function llmListModels(type?: string): Promise<ModelInfo[]> {
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `!window.electronAPI`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (!window.electronAPI)` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
  if (!window.electronAPI) return []
  try {
    return await window.electronAPI.llmListModels(type)
  } catch (e) {
    console.error('[llmListModels] 모델 목록 조회 실패:', e)
    return []
  }
}

export async function llmImportModel(sourcePath: string): Promise<ModelImportResult> {
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `!window.electronAPI`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (!window.electronAPI)` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
  if (!window.electronAPI) return { success: false, error: 'API not available' }
  return window.electronAPI.llmImportModel(sourcePath)
}

  /*
   * [FUNCTION CONTRACT]
   * - 함수 명: `onModelDownloadProgress`
   * - 역할: 인자 정보를 검수하고 비즈니스 계약 조건에 맞춰 최종 바인딩 결과물/바이너리 버퍼를 반환함.
   * - 예시: `onModelDownloadProgress(...)` 호출 시 런타임 비동기/동기 연쇄 반응 유도.
   */
export function onModelDownloadProgress(callback: (data: ModelDownloadProgressEvent) => void): () => void {
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `!window.electronAPI?.onModelDownloadProgress) return (`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (!window.electronAPI?.onModelDownloadProgress) return ()` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
  if (!window.electronAPI?.onModelDownloadProgress) return () => {}
  return window.electronAPI.onModelDownloadProgress(callback)
}

export async function llmDownloadModel(payload: { url: string; filename: string; type?: 'llm' | 'code' | 'stt' }): Promise<{ success: boolean; error?: string }> {
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `!window.electronAPI?.llmDownloadModel`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (!window.electronAPI?.llmDownloadModel)` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
  if (!window.electronAPI?.llmDownloadModel) {
    return { success: false, error: 'API not available' }
  }
  return window.electronAPI.llmDownloadModel(payload)
}

  /*
   * [FUNCTION CONTRACT]
   * - 함수 명: `onLLMDownloadProgress`
   * - 역할: 인자 정보를 검수하고 비즈니스 계약 조건에 맞춰 최종 바인딩 결과물/바이너리 버퍼를 반환함.
   * - 예시: `onLLMDownloadProgress(...)` 호출 시 런타임 비동기/동기 연쇄 반응 유도.
   */
export function onLLMDownloadProgress(callback: (data: ModelDownloadProgressEvent) => void): () => void {
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `!window.electronAPI?.onLLMDownloadProgress) return (`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (!window.electronAPI?.onLLMDownloadProgress) return ()` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
  if (!window.electronAPI?.onLLMDownloadProgress) return () => {}
  return window.electronAPI.onLLMDownloadProgress(callback)
}

export async function llmRestart(modelPath?: string): Promise<{ success: boolean; error?: string }> {
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `!window.electronAPI?.llmRestart`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (!window.electronAPI?.llmRestart)` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
  if (!window.electronAPI?.llmRestart) {
    return { success: false, error: 'API not available' }
  }
  return window.electronAPI.llmRestart(modelPath)
}

export async function llmStart(modelPath: string): Promise<{ success: boolean; error?: string }> {
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `!window.electronAPI?.llmStart`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (!window.electronAPI?.llmStart)` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
  if (!window.electronAPI?.llmStart) {
    return { success: false, error: 'API not available' }
  }
  return window.electronAPI.llmStart(modelPath)
}

export async function llmStop(): Promise<void> {
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `!window.electronAPI?.llmStop`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (!window.electronAPI?.llmStop)` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
  if (!window.electronAPI?.llmStop) return
  return window.electronAPI.llmStop()
}

export async function llmGetGpuName(): Promise<string> {
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `!window.electronAPI?.llmGetGpuName`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (!window.electronAPI?.llmGetGpuName)` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
  if (!window.electronAPI?.llmGetGpuName) return ''
  return window.electronAPI.llmGetGpuName()
}

