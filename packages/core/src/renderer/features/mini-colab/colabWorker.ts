/**
 * ============================================================================
 * @file colabWorker.ts
 * @description colabWorker.ts 시스템 모듈 구성요소로, 관련 UI 렌더링 및 비즈니스 로직을 담당합니다.
 * @usage 문서 에디터 및 뷰어 내부에서 동적으로 호출되거나 유틸리티 함수로 사용됩니다.
 * @example
 * // 예시 로직 (자동 생성됨)
 * import { something } from './colabWorker';
 * 
 * @created 2026-08-11 08:57:45
 * @updated 2026-08-11 08:57:45
 * @author uno-km
 * @commit docs: 전체 소스코드 한글 주석 및 사내 컨벤션 일괄 적용
 * ============================================================================
 */

self.onmessage = (e: MessageEvent) => {
  const { type, code, sql, id } = e.data
  
  if (type === 'EXEC_PYTHON') {
    // Simulate execution delay
    setTimeout(() => {
      self.postMessage({ type: 'EXEC_RESULT', id, output: '[파이일로드 보류 예정: Pyodide 연동 진행 중]', status: 'success' })
    }, 500)
  } else if (type === 'EXEC_SQL') {
    setTimeout(() => {
      self.postMessage({ type: 'EXEC_RESULT', id, output: '[SQL 실행 보류: wasm-sqlite 연동 진행 중]', status: 'success' })
    }, 500)
  }
}
