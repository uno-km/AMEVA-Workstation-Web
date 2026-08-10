/**
 * ============================================================================
 * @file ipc.ts
 * @description ipc.ts 시스템 모듈 구성요소로, 관련 UI 렌더링 및 비즈니스 로직을 담당합니다.
 * @usage 문서 에디터 및 뷰어 내부에서 동적으로 호출되거나 유틸리티 함수로 사용됩니다.
 * @example
 * // 예시 로직 (자동 생성됨)
 * import { something } from './ipc';
 * 
 * @created 2026-08-10 20:30:36
 * @updated 2026-08-10 20:30:36
 * @author uno-km
 * @commit docs: 전체 소스코드 한글 주석 및 사내 컨벤션 일괄 적용
 * ============================================================================
 */

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
/**
 * TIME_FORMATS 상태, 변수 또는 상수 선언부입니다.
 * @type {any} - Typescript 컴파일러에 의한 타입 추론(Inferred)
 */
export const TIME_FORMATS = {
  DEFAULT_LOG: 'YYYY-MM-DD HH:mm:ss',
  SHORT_TIME: 'HH:mm:ss',
} as const;

