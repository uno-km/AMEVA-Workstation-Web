/**
 * @file mcpAdapter.ts
 * @system AMEVA OS Desktop Workstation
 * @location src/renderer/services/ipc/adapters/mcpAdapter.ts
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

export interface MCPSpawnResult {
  success: boolean
  error?: string
  pid?: number
  [key: string]: unknown
}

export interface MCPCallResponse {
  result?: {
    tools?: Record<string, unknown>[]
    content?: unknown[]
    [key: string]: unknown
  }
  error?: {
    code?: number
    message?: string
    [key: string]: unknown
  }
  [key: string]: unknown
}

export interface MCPKillResult {
  success: boolean
  error?: string
  [key: string]: unknown
}

export async function mcpSpawn(serverId: string, command: string, args: string[]): Promise<MCPSpawnResult | null> {
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `!window.electronAPI?.mcpSpawn`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (!window.electronAPI?.mcpSpawn)` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
  if (!window.electronAPI?.mcpSpawn) return null
  return window.electronAPI.mcpSpawn(serverId, command, args)
}

export async function mcpCall(serverId: string, request: Record<string, unknown>): Promise<MCPCallResponse | null> {
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `!window.electronAPI?.mcpCall`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (!window.electronAPI?.mcpCall)` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
  if (!window.electronAPI?.mcpCall) return null
  return window.electronAPI.mcpCall(serverId, request)
}

export async function mcpKill(serverId: string): Promise<MCPKillResult | null> {
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `!window.electronAPI?.mcpKill`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (!window.electronAPI?.mcpKill)` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
  if (!window.electronAPI?.mcpKill) return null
  return window.electronAPI.mcpKill(serverId)
}

export async function mcpGetToken(): Promise<string | null> {
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `!window.electronAPI?.mcpGetToken`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (!window.electronAPI?.mcpGetToken)` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
  if (!window.electronAPI?.mcpGetToken) return null
  return window.electronAPI.mcpGetToken()
}

