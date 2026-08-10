/**
 * ============================================================================
 * @file aiTypes.ts
 * @description aiTypes.ts 시스템 모듈 구성요소로, 관련 UI 렌더링 및 비즈니스 로직을 담당합니다.
 * @usage 문서 에디터 및 뷰어 내부에서 동적으로 호출되거나 유틸리티 함수로 사용됩니다.
 * @example
 * // 예시 로직 (자동 생성됨)
 * import { something } from './aiTypes';
 * 
 * @created 2026-08-10 20:30:36
 * @updated 2026-08-10 20:30:36
 * @author uno-km
 * @commit docs: 전체 소스코드 한글 주석 및 사내 컨벤션 일괄 적용
 * ============================================================================
 */

/**
 * @file aiTypes.ts
 * @system AMEVA OS Desktop Workstation
 * @location src/renderer/types/aiTypes.ts
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

// [내부 프로젝트 의존성 모듈 임포트: ../../shared/reasoningTypes]
import type { ReasoningTraceEvent } from '../../shared/reasoningTypes'

/**
 * InsertSuggestion 모듈 내외부에서 사용되는 데이터 통신 규격 및 타입을 정의합니다.
 * @remarks 이 주석은 컨벤션에 따라 자동 생성된 문서화 내용입니다.
 */
export interface InsertSuggestion {
  afterBlockId: string
  blockType: 'heading' | 'paragraph' | 'bulletListItem' | 'numberedListItem' | 'table'
  level?: 1 | 2 | 3
  content: string
  finalAnswer?: string
  reasonText?: string
  status: 'pending' | 'accepted' | 'rejected'
  siblingBlockIds?: string[]
  siblingIndex?: number
}

/**
 * AIMessage 모듈 내외부에서 사용되는 데이터 통신 규격 및 타입을 정의합니다.
 * @remarks 이 주석은 컨벤션에 따라 자동 생성된 문서화 내용입니다.
 */
export interface AIMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: number
  isStreaming?: boolean
  error?: boolean
  aborted?: boolean
  taggedBlocks?: { id: string; text: string }[]
  originalText?: string
  proposedText?: string
  diffState?: 'pending' | 'accepted' | 'rejected'
  blockId?: string
  insertSuggestion?: InsertSuggestion
  insertSuggestions?: InsertSuggestion[]
  reasoningTraces?: ReasoningTraceEvent[]
  reasoningTrace?: ReasoningTraceEvent[]
  reasoningStatus?: 'ok' | 'loading' | 'error' | 'offline' | 'unavailable'
  finalAnswer?: string
  isReasoningCollapsed?: boolean
  isThinking?: boolean
  instructionId?: string
  sessionId?: string
  modelName?: string
}

/**
 * AISettings 모듈 내외부에서 사용되는 데이터 통신 규격 및 타입을 정의합니다.
 * @remarks 이 주석은 컨벤션에 따라 자동 생성된 문서화 내용입니다.
 */
export interface AISettings {
  modelPath: string
  codeModelPath?: string
  temperature: number
  maxTokens: number
  systemPrompt: string
  apiType?: 'local' | 'api' | 'wasm' | 'ollama'
  apiKey?: string
  apiEndpoint?: string
  apiModel?: string
  apiProvider?: 'gemini' | 'openai' | 'anthropic' | 'custom'
  gpuOnly?: boolean

  /**
   * [Agent Orchestration Settings]
   * - deepReasoning: 딥 리즈닝 모드 활성화 여부. true이면 AgentOrchestrator 사용.
   * - maxAgentTurns: 에이전트 최대 ReAct 반복 턴 수. Settings에서 조절 가능.
   *   범위: 1 ~ 10000. 기본값: 10000 (사실상 무제한, 콘텍스트 풀이 우선 적용됨).
   * - agentContextPoolSize: 콘텍스트 풀 최대 토큰 수. 7B 모델(Qwen2.5-7B) 기준 32768.
   *   Settings에서 조절 가능. 범위: 4096 ~ 131072.
   */
  deepReasoning?: boolean
  maxAgentTurns?: number
  agentContextPoolSize?: number
  debugMode?: boolean
}

  /*
   * [FUNCTION CONTRACT]
   * - 함수 명: `DEFAULT_SETTINGS`
   * - 역할: 유입 인자를 가공하고 비즈니스 계약 조건에 맞춰 최종 객체/바이너리를 생산함.
   * - 예시: `DEFAULT_SETTINGS(...)` 호출 시 런타임 비동기/동기 연쇄 반응 유도.
   */
/**
 * DEFAULT_SETTINGS 상태, 변수 또는 상수 선언부입니다.
 * @type {any} - Typescript 컴파일러에 의한 타입 추론(Inferred)
 */
export const DEFAULT_SETTINGS: AISettings = {
  modelPath: 'C:\\ameva\\models\\llm\\qwen2.5-3b-instruct-q4_k_m.gguf',
  codeModelPath: '',
  temperature: 0.7,
  maxTokens: 1024,
  systemPrompt: `당신은 AMEVA 문서 에디터에 내장된 AI 문서 편집 에이전트입니다.`,
  apiType: 'local',
  gpuOnly: true,
  deepReasoning: false,
  maxAgentTurns: 10000,
  agentContextPoolSize: 32768,
  debugMode: false
}

