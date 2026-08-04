/**
 * @file mammoth.d.ts
 * @system AMEVA OS Desktop Workstation
 * @location src/types/mammoth.d.ts
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


declare module 'mammoth' {
  /*
   * [FUNCTION CONTRACT]
   * - 함수 명: `convertToMarkdown`
   * - 역할: 인자 정보를 검수하고 비즈니스 계약 조건에 맞춰 최종 바인딩 결과물/바이너리 버퍼를 반환함.
   * - 예시: `convertToMarkdown(...)` 호출 시 런타임 비동기/동기 연쇄 반응 유도.
   */
  export function convertToMarkdown(input: any): Promise<{ value: string; messages: any[] }>;
  /*
   * [FUNCTION CONTRACT]
   * - 함수 명: `extractRawText`
   * - 역할: 인자 정보를 검수하고 비즈니스 계약 조건에 맞춰 최종 바인딩 결과물/바이너리 버퍼를 반환함.
   * - 예시: `extractRawText(...)` 호출 시 런타임 비동기/동기 연쇄 반응 유도.
   */
  export function extractRawText(input: any): Promise<{ value: string; messages: any[] }>;
  /*
   * [FUNCTION CONTRACT]
   * - 함수 명: `convertToHtml`
   * - 역할: 인자 정보를 검수하고 비즈니스 계약 조건에 맞춰 최종 바인딩 결과물/바이너리 버퍼를 반환함.
   * - 예시: `convertToHtml(...)` 호출 시 런타임 비동기/동기 연쇄 반응 유도.
   */
  export function convertToHtml(input: any): Promise<{ value: string; messages: any[] }>;
}

