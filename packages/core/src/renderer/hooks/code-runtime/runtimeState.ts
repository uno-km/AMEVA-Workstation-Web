/**
 * @file runtimeState.ts
 * @system AMEVA OS Desktop Workstation
 * @location src/renderer/hooks/code-runtime/runtimeState.ts
 * @role Core module helper and integration logic
 * 
 * [소비처 - CONSUMERS / USAGE CONTEXT]
 * - 소비처 A (src/renderer/App.tsx): 최상위 Facade 구조에 통합 마운트.
 * - 소비처 B (src/renderer/contexts/AppContext.tsx): 리액트 Context 훅 목록에 바인딩되어 하위 뷰에 전파.
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
   * - 함수 명: `RuntimeState`
   * - 역할: 유입 인자를 가공하고 비즈니스 계약 조건에 맞춰 최종 객체/바이너리를 생산함.
   * - 예시: `RuntimeState(...)` 호출 시 런타임 비동기/동기 연쇄 반응 유도.
   */
export const RuntimeState = {
  pyodideInstance: null as any,
  persistentWorker: null as Worker | null,
  sqliteDatabaseInstance: null as any,
}

// [SEC-W-014] 외부에서 런타임 리소스를 정리할 수 있는 함수
export function cleanupCodeRuntime() {
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `RuntimeState.persistentWorker`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (RuntimeState.persistentWorker)` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
  if (RuntimeState.persistentWorker) {
    RuntimeState.persistentWorker.terminate()
    RuntimeState.persistentWorker = null
  }
  RuntimeState.pyodideInstance = null
  RuntimeState.sqliteDatabaseInstance = null
}

