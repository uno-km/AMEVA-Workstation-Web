/**
 * @file types.ts
 * @system AMEVA OS Desktop Workstation
 * @location src/renderer/utils/agent/types.ts
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

  /*
   * [FUNCTION CONTRACT]
   * - 함수 명: `AgentState`
   * - 역할: 유입 인자를 가공하고 비즈니스 계약 조건에 맞춰 최종 객체/바이너리를 생산함.
   * - 예시: `AgentState(...)` 호출 시 런타임 비동기/동기 연쇄 반응 유도.
   */
export const AgentState = {
  Idle: "idle",
  Thinking: "thinking",
  Working: "working",
  Done: "done",
  Error: "error"
} as const;
export type AgentState = typeof AgentState[keyof typeof AgentState];

export interface ToolDefinition {
  name: string
  description: string
  parameters: {
    type: 'object'
    properties: Record<string, { type: string; description: string }>
    required: string[]
  }
  /** 소형 모델(3B)에서도 안전하게 실행 가능한지 여부 (복잡도가 높은 도구는 7B 이상에서만 활성화) */
  minModelParameterSize?: number 
  execute: (args: any) => Promise<{ success: boolean; result: string; error?: string }>
}

export interface AgentConfig {
  providerType: 'llama.cpp' | 'ollama' | 'openai'
  endpointUrl: string
  modelName: string  // ggem-2-9b, qwen2.5-7b 등 파일명 또는 모델 식별자
  temperature?: number
  maxTurns?: number
  apiKey?: string
}

export interface AgentSessionStep {
  turn: number
  thought: string
  action?: string
  actionInput?: string
  observation?: string
  error?: string
}

export interface AgentSessionResult {
  success: boolean
  finalAnswer?: string
  steps: AgentSessionStep[]
  error?: string
}

export interface ILLMAdapter {
  generate: (prompt: string, systemPrompt: string, temperature: number, sessionId?: string) => Promise<string>
}

