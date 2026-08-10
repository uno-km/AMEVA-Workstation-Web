/**
 * ============================================================================
 * @file types.ts
 * @description types.ts 시스템 모듈 구성요소로, 관련 UI 렌더링 및 비즈니스 로직을 담당합니다.
 * @usage 문서 에디터 및 뷰어 내부에서 동적으로 호출되거나 유틸리티 함수로 사용됩니다.
 * @example
 * // 예시 로직 (자동 생성됨)
 * import { something } from './types';
 * 
 * @created 2026-08-10 20:30:36
 * @updated 2026-08-10 20:30:36
 * @author uno-km
 * @commit docs: 전체 소스코드 한글 주석 및 사내 컨벤션 일괄 적용
 * ============================================================================
 */

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
/**
 * AgentState 모듈 내외부에서 사용되는 데이터 통신 규격 및 타입을 정의합니다.
 * @remarks 이 주석은 컨벤션에 따라 자동 생성된 문서화 내용입니다.
 */
export type AgentState = typeof AgentState[keyof typeof AgentState];

/**
 * ToolDefinition 모듈 내외부에서 사용되는 데이터 통신 규격 및 타입을 정의합니다.
 * @remarks 이 주석은 컨벤션에 따라 자동 생성된 문서화 내용입니다.
 */
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

/**
 * AgentConfig 모듈 내외부에서 사용되는 데이터 통신 규격 및 타입을 정의합니다.
 * @remarks 이 주석은 컨벤션에 따라 자동 생성된 문서화 내용입니다.
 */
export interface AgentConfig {
  providerType: 'llama.cpp' | 'ollama' | 'openai'
  endpointUrl: string
  modelName: string  // ggem-2-9b, qwen2.5-7b 등 파일명 또는 모델 식별자
  temperature?: number
  maxTurns?: number
  apiKey?: string
}

/**
 * AgentSessionStep 모듈 내외부에서 사용되는 데이터 통신 규격 및 타입을 정의합니다.
 * @remarks 이 주석은 컨벤션에 따라 자동 생성된 문서화 내용입니다.
 */
export interface AgentSessionStep {
  turn: number
  thought: string
  action?: string
  actionInput?: string
  observation?: string
  error?: string
}

/**
 * AgentSessionResult 모듈 내외부에서 사용되는 데이터 통신 규격 및 타입을 정의합니다.
 * @remarks 이 주석은 컨벤션에 따라 자동 생성된 문서화 내용입니다.
 */
export interface AgentSessionResult {
  success: boolean
  finalAnswer?: string
  steps: AgentSessionStep[]
  error?: string
}

/**
 * ILLMAdapter 모듈 내외부에서 사용되는 데이터 통신 규격 및 타입을 정의합니다.
 * @remarks 이 주석은 컨벤션에 따라 자동 생성된 문서화 내용입니다.
 */
export interface ILLMAdapter {
  generate: (prompt: string, systemPrompt: string, temperature: number, sessionId?: string) => Promise<string>
}

