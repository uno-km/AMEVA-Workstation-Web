/**
 * @file mcpClient.ts
 * @system AMEVA OS Desktop Workstation
 * @location src/renderer/utils/mcpClient.ts
 * @role Core module helper and integration logic
 * 
 * [소비처 - CONSUMERS / USAGE CONTEXT]
 * - 소비처 A (src/renderer/hooks/): 관련 비즈니스 훅 내부 연산 시 순수 함수 유틸리티로 수입 소비.
 * - 소비처 B (src/renderer/components/): 렌더링 전 데이터 정제 단계에서 포맷터 유틸리티로 소비.
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
 * mcpClient.ts
 * 
 * AMEVA Workstation 동적 MCP 클라이언트 (Loose Coupling & Pluggable Architecture)
 * 
 * 하드코딩을 원천 차단하고, LocalStorage 기반의 MCP 서버 설정 정보(Stdio / HTTP Gateway)를
 * 동적으로 로드하여 통합 도구(Tool) 카탈로그를 관리하고 실행을 중계합니다.
 */

import * as ipc from '../services/ipc/electronApiAdapter'

export interface MCPServerConfig {
  id: string
  name: string
  type: 'stdio' | 'http'
  command?: string
  args?: string[]
  url?: string
  enabled: boolean
}

export interface MCPTool {
  name: string
  description: string
  inputSchema: {
    type: 'object'
    properties: Record<string, any>
    required: string[]
  }
  serverId: string
}

export class MCPClientManager {
  private static servers: MCPServerConfig[] = []
  private static cachedTools: Map<string, MCPTool[]> = new Map()

  // Circuit Breaker State
  private static circuitState: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED'
  private static failureCount: number = 0
  private static lastFailureTime: number = 0
  private static readonly MAX_FAILURES = 3
  private static currentBackoffMs: number = 1000
  private static inFlightRequests: Map<string, Promise<Response>> = new Map()
  private static abortController: AbortController | null = null;

  /** 백엔드 플랜 상태와 동기화 (우회 시도 방지 및 교차 검증) */
  static async syncPlanStatus(): Promise<boolean> {
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `ipc.isElectronEnv()`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (ipc.isElectronEnv())` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
    if (ipc.isElectronEnv()) {
      try {
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `backendPro`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const backendPro = ...` 형태로 안전 캐싱 후 가공 기동.
       */
        const backendPro = await ipc.planGetStatus()
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem('is-pro-plan', String(backendPro))
        }
        return backendPro
      } catch (e) {
        return false
      }
    }
    return typeof localStorage !== 'undefined' && localStorage.getItem('is-pro-plan') === 'true'
  }

  /** 로컬 설정 로드 */
  static loadConfigs(): MCPServerConfig[] {
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `isPro`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const isPro = ...` 형태로 안전 캐싱 후 가공 기동.
       */
    const isPro = typeof localStorage !== 'undefined' && localStorage.getItem('is-pro-plan') === 'true'
    
    // 기본 로컬 WASM 게이트웨이는 플랜과 무관하게 상시 존재
    const defaultGateway: MCPServerConfig = {
      id: 'mcp-wasm-gateway',
      name: 'AMEVA OS WASM Gateway',
      type: 'http',
      url: 'http://127.0.0.1:11553/mcp',
      enabled: true
    }

      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `!isPro`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (!isPro)` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
    if (!isPro) {
      // 무료 플랜일 경우 외부 추가 Stdio 서버들은 로드하지 않고 기본 로컬 게이트웨이만 허용
      this.servers = [defaultGateway]
      return this.servers
    }

    try {
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `stored`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const stored = ...` 형태로 안전 캐싱 후 가공 기동.
       */
      const stored = typeof localStorage !== 'undefined' ? localStorage.getItem('mcp-servers-config') : null
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `stored`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (stored)` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
      if (stored) {
        this.servers = JSON.parse(stored)
        // 로드된 설정에 mcp-wasm-gateway가 누락되어 있다면 병합 보정
        if (!this.servers.find(s => s.id === 'mcp-wasm-gateway')) {
          this.servers.unshift(defaultGateway)
        }
      } else {
        this.servers = [defaultGateway]
        this.saveConfigs()
      }
    } catch (e) {
      console.error('[MCPClientManager] 설정 로드 오류:', e)
      this.servers = [defaultGateway]
    }
    return this.servers
  }

  /** 설정 저장 */
  static saveConfigs() {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('mcp-servers-config', JSON.stringify(this.servers))
      }
    } catch (e) {
      console.error('[MCPClientManager] 설정 저장 오류:', e)
    }
  }

  /** 서버 목록 갱신 */
  static setConfigs(newConfigs: MCPServerConfig[]) {
    this.servers = newConfigs
    this.saveConfigs()
  }

  /** 모든 활성화된 MCP 서버들로부터 도구 목록 동적 페치 */
  static async fetchAllTools(): Promise<MCPTool[]> {
    // 무료 회원이라도 loadConfigs()를 통해 기본 mcp-wasm-gateway 도구는 긁어오도록 허용
    this.loadConfigs()
    const allTools: MCPTool[] = []
    this.cachedTools.clear()

      /*
       * [LOOP CONTROL ITERATION]
       * - 루프 조건: `for (const server of this.servers) {`
       * - 예상 시나리오: 지정된 조건 한계 도달 시점까지 콜렉션 항목의 순차 매핑, 변환 및 동기 적재 처리를 수행함.
       * - 예시: `for (const item of list)` 루프 실행 시 모든 개별 블록의 html 포맷 정제 완료 후 스택 종결.
       */
    for (const server of this.servers) {
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `!server.enabled`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (!server.enabled)` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
      if (!server.enabled) continue

      try {
        let toolsList: any[] = []

      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `server.type === 'http'`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (server.type === 'http')` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
        if (server.type === 'http') {
          // HTTP Gateway 방식 (WASM Toolkit 등)
          if (!server.url) continue
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `response`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const response = ...` 형태로 안전 캐싱 후 가공 기동.
       */
          const response = await this.safeMcpFetch(server.url, {
            jsonrpc: '2.0',
            method: 'tools/list',
            id: `list-${Date.now()}`
          })
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `response.ok`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (response.ok)` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
          if (response.ok) {
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `data`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const data = ...` 형태로 안전 캐싱 후 가공 기동.
       */
            const data = await response.json()
            toolsList = data.result?.tools || []
          }
        } else if (server.type === 'stdio') {
          // Stdio 방식 (Electron 메인 프로세스 spawn 중계)
          if (!ipc.isElectronEnv()) continue
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `!server.command`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (!server.command)` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
          if (!server.command) continue

          // 1. 메인 프로세스에 해당 서버 기동(spawn)
          const spawnResult = await ipc.mcpSpawn(server.id, server.command, server.args || [])
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `spawnResult.success`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (spawnResult.success)` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
          if (spawnResult.success) {
            // 2. tools/list JSON-RPC 전송
            const response = await ipc.mcpCall(server.id, {
              jsonrpc: '2.0',
              method: 'tools/list',
              id: `list-${Date.now()}`
            })
            toolsList = response.result?.tools || []
          } else {
            console.error(`[MCPClientManager] MCP Stdio Spawn 실패 (${server.name}):`, spawnResult.error)
          }
        }

  /*
   * [FUNCTION CONTRACT]
   * - 함수 명: `mappedTools`
   * - 역할: 인자 정보를 검수하고 비즈니스 계약 조건에 맞춰 최종 바인딩 결과물/바이너리 버퍼를 반환함.
   * - 예시: `mappedTools(...)` 호출 시 런타임 비동기/동기 연쇄 반응 유도.
   */
        const mappedTools: MCPTool[] = toolsList.map(t => ({
          name: t.name,
          description: t.description || '',
          inputSchema: t.inputSchema || { type: 'object', properties: {}, required: [] },
          serverId: server.id
        }))

        this.cachedTools.set(server.id, mappedTools)
        allTools.push(...mappedTools)

      } catch (err: any) {
        console.warn(`[MCPClientManager] MCP 서버 [${server.name}] 도구 로드 실패:`, err.message)
      }
    }

    return allTools
  }

  /** 특정 MCP 도구 동적 실행 */
  static async callTool(serverId: string, toolName: string, args: any): Promise<{ success: boolean; result: string; error?: string }> {
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `isPro`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const isPro = ...` 형태로 안전 캐싱 후 가공 기동.
       */
    const isPro = await this.syncPlanStatus()
    // 기본 로컬 WASM 게이트웨이가 아닌 다른 stdio 서버 도구일 때만 pro 제한을 적용
    if (!isPro && serverId !== 'mcp-wasm-gateway') {
      return { success: false, result: '', error: '무료 버전에서는 외부 MCP 도구를 호출할 수 없습니다.' }
    }
    this.loadConfigs()
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `server`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const server = ...` 형태로 안전 캐싱 후 가공 기동.
       */
    const server = this.servers.find(s => s.id === serverId)
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `!server || !server.enabled`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (!server || !server.enabled)` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
    if (!server || !server.enabled) {
      return { success: false, result: '', error: `서버가 비활성화되었거나 존재하지 않습니다. ID: ${serverId}` }
    }

    try {
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `callPayload`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const callPayload = ...` 형태로 안전 캐싱 후 가공 기동.
       */
      const callPayload = {
        jsonrpc: '2.0',
        method: 'tools/call',
        params: {
          name: toolName,
          arguments: args
        },
        id: `call-${Date.now()}`
      }

      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `server.type === 'http'`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (server.type === 'http')` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
      if (server.type === 'http') {
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `!server.url) throw new Error('엔드포인트 URL이 없습니다.'`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (!server.url) throw new Error('엔드포인트 URL이 없습니다.')` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
        if (!server.url) throw new Error('엔드포인트 URL이 없습니다.')
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `response`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const response = ...` 형태로 안전 캐싱 후 가공 기동.
       */
        const response = await this.safeMcpFetch(server.url, callPayload)
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `!response.ok`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (!response.ok)` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
        if (!response.ok) {
          throw new Error(`HTTP 에러 발생: ${response.status}`)
        }
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `data`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const data = ...` 형태로 안전 캐싱 후 가공 기동.
       */
        const data = await response.json()
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `data?.error`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (data?.error)` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
        if (data?.error) {
          return { success: false, result: '', error: data?.error.message }
        }
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `textContent`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const textContent = ...` 형태로 안전 캐싱 후 가공 기동.
       */
        const textContent = data.result?.content?.[0]?.text || JSON.stringify(data.result) || '성공 (응답 데이터 없음)'
        return { success: true, result: textContent }

      } else if (server.type === 'stdio') {
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `!ipc.isElectronEnv()) throw new Error('Electron API 환경이 아닙니다.'`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (!ipc.isElectronEnv()) throw new Error('Electron API 환경이 아닙니다.')` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
        if (!ipc.isElectronEnv()) throw new Error('Electron API 환경이 아닙니다.')
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `data`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const data = ...` 형태로 안전 캐싱 후 가공 기동.
       */
        const data = await ipc.mcpCall(server.id, callPayload)
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `data?.error`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (data?.error)` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
        if (data?.error) {
          return { success: false, result: '', error: data?.error.message }
        }
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `textContent`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const textContent = ...` 형태로 안전 캐싱 후 가공 기동.
       */
        const textContent = data.result?.content?.[0]?.text || JSON.stringify(data.result) || '성공'
        return { success: true, result: textContent }
      }

    } catch (e: any) {
      return { success: false, result: '', error: e.message }
    }

    return { success: false, result: '', error: '알 수 없는 MCP 통신 채널 유형' }
  }

  /** Stdio 서버 프로세스 자원 일괄 정리 */
  static async cleanupAll() {
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `!ipc.isElectronEnv()`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (!ipc.isElectronEnv())` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
    if (!ipc.isElectronEnv()) return
    this.loadConfigs()
      /*
       * [LOOP CONTROL ITERATION]
       * - 루프 조건: `for (const server of this.servers) {`
       * - 예상 시나리오: 지정된 조건 한계 도달 시점까지 콜렉션 항목의 순차 매핑, 변환 및 동기 적재 처리를 수행함.
       * - 예시: `for (const item of list)` 루프 실행 시 모든 개별 블록의 html 포맷 정제 완료 후 스택 종결.
       */
    for (const server of this.servers) {
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `server.type === 'stdio'`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (server.type === 'stdio')` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
      if (server.type === 'stdio') {
        await ipc.mcpKill(server.id)
      }
    }
  }

  private static mcpToken: string | null = null

  private static async getOrFetchToken(): Promise<string | null> {
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `this.mcpToken`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (this.mcpToken)` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
    if (this.mcpToken) return this.mcpToken
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `ipc.isElectronEnv()`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (ipc.isElectronEnv())` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
    if (ipc.isElectronEnv()) {
      try {
        this.mcpToken = await ipc.mcpGetToken()
      } catch (err) {
        console.error('[MCPClientManager] mcpGetToken 실패:', err)
      }
    }
    return this.mcpToken
  }

  private static handleFetchFailure() {
    this.failureCount++;
    this.lastFailureTime = Date.now();
    if (this.circuitState === 'HALF_OPEN' || this.failureCount >= this.MAX_FAILURES) {
      this.circuitState = 'OPEN';
      this.currentBackoffMs = Math.min(this.currentBackoffMs * 2, 30000);
      console.error(`[MCPClientManager] Circuit Breaker OPEN. Backoff: ${this.currentBackoffMs}ms`);
      
      // TODO: Runtime CapabilityCatalog와 UI Store 모두에 UNAVAILABLE 반영 (외부 호출 통해 위임)
      if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function' && typeof CustomEvent !== 'undefined') {
        const event = new CustomEvent('mcp_circuit_breaker_open');
        window.dispatchEvent(event);
      }
    }
  }

  public static unmountAbort() {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
    this.inFlightRequests.clear();
  }

  /** localhost / 127.0.0.1 네트워크 바인딩 실패 시 상호 폴백 재시도 헬퍼 */
  private static async safeMcpFetch(url: string, body: any): Promise<Response> {
    if (this.circuitState === 'OPEN') {
      if (Date.now() - this.lastFailureTime > this.currentBackoffMs) {
        this.circuitState = 'HALF_OPEN';
      } else {
        throw new Error('MCP Circuit is OPEN. Connection is UNAVAILABLE.');
      }
    }

    const requestKey = `${url}-${JSON.stringify(body)}`;
    if (this.inFlightRequests.has(requestKey)) {
      return this.inFlightRequests.get(requestKey)!;
    }

    if (!this.abortController) {
      this.abortController = new AbortController();
    }

    const fetchPromise = (async () => {
      const token = await this.getOrFetchToken()
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      }
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }

      const doFetch = async (targetUrl: string) => {
        const res = await fetch(targetUrl, {
          method: 'POST',
          headers,
          body: JSON.stringify(body),
          signal: this.abortController!.signal
        });
        if (!res.ok && res.status >= 500) {
          throw new Error(`HTTP Error ${res.status}`);
        }
        return res;
      };

      try {
        let res: Response;
        try {
          res = await doFetch(url);
        } catch (e: any) {
          if (e.name === 'AbortError') throw e;
          if (url.includes('127.0.0.1')) {
            const fallbackUrl = url.replace('127.0.0.1', 'localhost');
            console.warn(`[MCPClientManager] 127.0.0.1 fetch 실패. localhost 폴백 재시도... URL: ${fallbackUrl}`);
            res = await doFetch(fallbackUrl);
          } else if (url.includes('localhost')) {
            const fallbackUrl = url.replace('localhost', '127.0.0.1');
            console.warn(`[MCPClientManager] localhost fetch 실패. 127.0.0.1 폴백 재시도... URL: ${fallbackUrl}`);
            res = await doFetch(fallbackUrl);
          } else {
            throw e;
          }
        }

        // 성공
        this.circuitState = 'CLOSED';
        this.failureCount = 0;
        this.currentBackoffMs = 1000;
        return res;
      } catch (e: any) {
        if (e.name !== 'AbortError') {
          this.handleFetchFailure();
        }
        throw e;
      } finally {
        this.inFlightRequests.delete(requestKey);
      }
    })();

    this.inFlightRequests.set(requestKey, fetchPromise);
    return fetchPromise;
  }
}

