/**
 * @file aiSettings.ts
 * @system AMEVA OS Desktop Workstation
 * @location src/shared/constants/aiSettings.ts
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

  /*
   * [FUNCTION CONTRACT]
   * - 함수 명: `PROVIDER_MODELS`
   * - 역할: 유입 인자를 가공하고 비즈니스 계약 조건에 맞춰 최종 객체/바이너리를 생산함.
   * - 예시: `PROVIDER_MODELS(...)` 호출 시 런타임 비동기/동기 연쇄 반응 유도.
   */
export const PROVIDER_MODELS = {
  gemini: [
    { value: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash' },
    { value: 'gemini-2.5-pro', label: 'Gemini 2.5 Pro' },
    { value: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash' },
    { value: 'gemini-2.0-flash-thinking-exp', label: 'Gemini 2.0 Flash Thinking' },
    { value: 'gemini-1.5-flash', label: 'Gemini 1.5 Flash' },
    { value: 'gemini-1.5-pro', label: 'Gemini 1.5 Pro' },
  ],
  openai: [
    { value: 'gpt-4o-mini', label: 'GPT-4o Mini' },
    { value: 'gpt-4o', label: 'GPT-4o' },
    { value: 'gpt-4-turbo', label: 'GPT-4 Turbo' },
    { value: 'o1-mini', label: 'o1 Mini' },
    { value: 'o1-preview', label: 'o1 Preview' },
  ],
  anthropic: [
    { value: 'claude-3-5-sonnet-latest', label: 'Claude 3.5 Sonnet' },
    { value: 'claude-3-5-haiku-latest', label: 'Claude 3.5 Haiku' },
    { value: 'claude-3-opus-latest', label: 'Claude 3 Opus' },
  ]
}

  /*
   * [FUNCTION CONTRACT]
   * - 함수 명: `API_ENDPOINTS`
   * - 역할: 유입 인자를 가공하고 비즈니스 계약 조건에 맞춰 최종 객체/바이너리를 생산함.
   * - 예시: `API_ENDPOINTS(...)` 호출 시 런타임 비동기/동기 연쇄 반응 유도.
   */
export const API_ENDPOINTS = {
  gemini: 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions',
  openai: 'https://api.openai.com/v1/chat/completions',
  anthropic: 'https://api.anthropic.com/v1/messages',
}

  /*
   * [FUNCTION CONTRACT]
   * - 함수 명: `API_KEY_PATTERNS`
   * - 역할: 유입 인자를 가공하고 비즈니스 계약 조건에 맞춰 최종 객체/바이너리를 생산함.
   * - 예시: `API_KEY_PATTERNS(...)` 호출 시 런타임 비동기/동기 연쇄 반응 유도.
   */
export const API_KEY_PATTERNS = [
  {
    provider: 'gemini' as const,
    prefixes: ['AIzaSy', 'AQ.'],
    endpoint: API_ENDPOINTS.gemini,
    defaultModel: 'gemini-2.5-flash',
    keychainKey: 'gemini-api-key'
  },
  {
    provider: 'anthropic' as const,
    prefixes: ['sk-ant'],
    endpoint: API_ENDPOINTS.anthropic,
    defaultModel: 'claude-3-5-sonnet-latest',
    keychainKey: 'claude-api-key'
  },
  {
    provider: 'openai' as const,
    prefixes: ['sk-'],
    endpoint: API_ENDPOINTS.openai,
    defaultModel: 'gpt-4o-mini',
    keychainKey: 'openai-api-key'
  }
]

