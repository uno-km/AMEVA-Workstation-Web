/**
 * @file ipc.ts
 * @system AMEVA OS Desktop Workstation
 * @location src/shared/constants/ipc.ts
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
 * [Tier 2] 앱 전체 관통 전역 상수
 * Main 프로세스와 Renderer 프로세스 간의 IPC 통신 채널 이름들
 */
export const IPC_CHANNELS = {
  // 앱 기본 설정
  GET_APP_SETTINGS: 'get-app-settings',
  SET_APP_SETTINGS: 'set-app-settings',
  
  // Llama (로컬 AI) 관련 채널
  LLAMA_CHECK_MODELS: 'llama-check-models',
  LLAMA_START: 'llama-start',
  LLAMA_STOP: 'llama-stop',
  LLAMA_STATUS: 'llama-status',
  LLAMA_DOWNLOAD_MODEL: 'llama-download-model',
  
  // Yjs 협업 서버 관련 채널
  SERVER_START: 'server-start',
  SERVER_STOP: 'server-stop',
  SERVER_STATUS: 'server-status',
  
  // 디버깅 및 터미널
  OPEN_DEV_TOOLS: 'open-dev-tools',
} as const;

  /*
   * [FUNCTION CONTRACT]
   * - 함수 명: `TIME_FORMATS`
   * - 역할: 유입 인자를 가공하고 비즈니스 계약 조건에 맞춰 최종 객체/바이너리를 생산함.
   * - 예시: `TIME_FORMATS(...)` 호출 시 런타임 비동기/동기 연쇄 반응 유도.
   */
export const TIME_FORMATS = {
  DEFAULT_LOG: 'YYYY-MM-DD HH:mm:ss',
  SHORT_TIME: 'HH:mm:ss',
} as const;

