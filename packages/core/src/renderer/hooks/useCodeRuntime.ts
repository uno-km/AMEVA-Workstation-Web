/**
 * ============================================================================
 * @file useCodeRuntime.ts
 * @description useCodeRuntime.ts 시스템 모듈 구성요소로, 관련 UI 렌더링 및 비즈니스 로직을 담당합니다.
 * @usage 문서 에디터 및 뷰어 내부에서 동적으로 호출되거나 유틸리티 함수로 사용됩니다.
 * @example
 * // 예시 로직 (자동 생성됨)
 * import { something } from './useCodeRuntime';
 * 
 * @created 2026-08-10 20:30:36
 * @updated 2026-08-10 20:30:36
 * @author uno-km
 * @commit docs: 전체 소스코드 한글 주석 및 사내 컨벤션 일괄 적용
 * ============================================================================
 */

/**
 * @file useCodeRuntime.ts
 * @system AMEVA OS Desktop Workstation
 * @location src/renderer/hooks/useCodeRuntime.ts
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

// [내부 프로젝트 의존성 모듈 임포트: ./code-runtime/runtimeState]
import { cleanupCodeRuntime } from './code-runtime/runtimeState'
// [내부 프로젝트 의존성 모듈 임포트: ./code-runtime/useJSRuntime]
import { useJSRuntime } from './code-runtime/useJSRuntime'
// [내부 프로젝트 의존성 모듈 임포트: ./code-runtime/usePythonRuntime]
import { usePythonRuntime } from './code-runtime/usePythonRuntime'
// [내부 프로젝트 의존성 모듈 임포트: ./code-runtime/useSQLRuntime]
import { useSQLRuntime } from './code-runtime/useSQLRuntime'
// [내부 프로젝트 의존성 모듈 임포트: ./code-runtime/useJavaRuntime]
import { useJavaRuntime } from './code-runtime/useJavaRuntime'

export { cleanupCodeRuntime }

  /*
   * [FUNCTION CONTRACT]
   * - 함수 명: `useCodeRuntime`
   * - 역할: 인자 정보를 검수하고 비즈니스 계약 조건에 맞춰 최종 바인딩 결과물/바이너리 버퍼를 반환함.
   * - 예시: `useCodeRuntime(...)` 호출 시 런타임 비동기/동기 연쇄 반응 유도.
   */
/**
 * useCodeRuntime 함수의 핵심 비즈니스 로직 및 상태 제어를 처리합니다.
 * @remarks 이 주석은 컨벤션에 따라 자동 생성된 문서화 내용입니다.
 */
export function useCodeRuntime() {
  const { isJSRunning, runJSCode } = useJSRuntime()
  const { isPythonRunning, runPythonCode } = usePythonRuntime()
  const { isSQLRunning, runSQLCode } = useSQLRuntime()
  const { isJavaRunning, runJavaCode } = useJavaRuntime()

  return {
    isRunning: isJSRunning || isPythonRunning || isSQLRunning || isJavaRunning,
    runJSCode,
    runPythonCode,
    runSQLCode,
    runJavaCode,
  }
}

