/**
 * @file collabAdapter.ts
 * @system AMEVA OS Desktop Workstation
 * @location src/renderer/services/ipc/adapters/collabAdapter.ts
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

export interface CollabServerStatus {
  running: boolean
  port?: number
  ip?: string
  token?: string
  error?: string
  [key: string]: unknown
}

export interface CollabServerStartResult {
  running?: boolean
  port?: number
  error?: string
  [key: string]: unknown
}

export interface CollabServerStopResult {
  running?: boolean
  error?: string
  [key: string]: unknown
}

  /*
   * [FUNCTION CONTRACT]
   * - 함수 명: `onServerStatus`
   * - 역할: 인자 정보를 검수하고 비즈니스 계약 조건에 맞춰 최종 바인딩 결과물/바이너리 버퍼를 반환함.
   * - 예시: `onServerStatus(...)` 호출 시 런타임 비동기/동기 연쇄 반응 유도.
   */
export function onServerStatus(callback: (status: CollabServerStatus) => void): () => void {
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `!window.electronAPI?.onServerStatus) return (`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (!window.electronAPI?.onServerStatus) return ()` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
  if (!window.electronAPI?.onServerStatus) return () => {}
  return window.electronAPI.onServerStatus(callback)
}

export async function startCollaborationServer(port: number): Promise<CollabServerStartResult | null> {
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `!window.electronAPI?.startCollaborationServer`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (!window.electronAPI?.startCollaborationServer)` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
  if (!window.electronAPI?.startCollaborationServer) return null
  return window.electronAPI.startCollaborationServer(port)
}

export async function stopCollaborationServer(): Promise<CollabServerStopResult | null> {
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `!window.electronAPI?.stopCollaborationServer`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (!window.electronAPI?.stopCollaborationServer)` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
  if (!window.electronAPI?.stopCollaborationServer) return null
  return window.electronAPI.stopCollaborationServer()
}

