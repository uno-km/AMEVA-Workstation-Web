/**
 * ============================================================================
 * @file exportAdapter.ts
 * @description exportAdapter.ts 시스템 모듈 구성요소로, 관련 UI 렌더링 및 비즈니스 로직을 담당합니다.
 * @usage 문서 에디터 및 뷰어 내부에서 동적으로 호출되거나 유틸리티 함수로 사용됩니다.
 * @example
 * // 예시 로직 (자동 생성됨)
 * import { something } from './exportAdapter';
 * 
 * @created 2026-08-10 20:30:36
 * @updated 2026-08-10 20:30:36
 * @author uno-km
 * @commit docs: 전체 소스코드 한글 주석 및 사내 컨벤션 일괄 적용
 * ============================================================================
 */

/**
 * @file exportAdapter.ts
 * @system AMEVA OS Desktop Workstation
 * @location src/renderer/services/ipc/adapters/exportAdapter.ts
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

// [내부 프로젝트 의존성 모듈 임포트: ../ipcTypes]
import type { ExportProgressEvent } from '../ipcTypes'

  /*
   * [FUNCTION CONTRACT]
   * - 함수 명: `onExportProgress`
   * - 역할: 인자 정보를 검수하고 비즈니스 계약 조건에 맞춰 최종 바인딩 결과물/바이너리 버퍼를 반환함.
   * - 예시: `onExportProgress(...)` 호출 시 런타임 비동기/동기 연쇄 반응 유도.
   */
/**
 * onExportProgress 함수의 핵심 비즈니스 로직 및 상태 제어를 처리합니다.
 * @remarks 이 주석은 컨벤션에 따라 자동 생성된 문서화 내용입니다.
 */
export function onExportProgress(callback: (data: ExportProgressEvent) => void): () => void {
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `!window.electronAPI?.onExportProgress) return (`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (!window.electronAPI?.onExportProgress) return ()` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
  if (!window.electronAPI?.onExportProgress) return () => {}
  return window.electronAPI.onExportProgress(callback)
}

/**
 * printToPDF 함수의 핵심 비즈니스 로직 및 상태 제어를 처리합니다.
 * @remarks 이 주석은 컨벤션에 따라 자동 생성된 문서화 내용입니다.
 */
export async function printToPDF(htmlContent: string): Promise<string | null> {
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `!window.electronAPI?.printToPDF`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (!window.electronAPI?.printToPDF)` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
  if (!window.electronAPI?.printToPDF) return null
  return window.electronAPI.printToPDF(htmlContent)
}

/**
 * saveExportedFile 함수의 핵심 비즈니스 로직 및 상태 제어를 처리합니다.
 * @remarks 이 주석은 컨벤션에 따라 자동 생성된 문서화 내용입니다.
 */
export async function saveExportedFile(data: string, isBase64: boolean, defaultName: string, filters: { name: string; extensions: string[] }[]): Promise<string | null> {
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `!window.electronAPI?.saveExportedFile`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (!window.electronAPI?.saveExportedFile)` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
  if (!window.electronAPI?.saveExportedFile) return null
  return window.electronAPI.saveExportedFile(data, isBase64, defaultName, filters)
}

/**
 * exportConvert 함수의 핵심 비즈니스 로직 및 상태 제어를 처리합니다.
 * @remarks 이 주석은 컨벤션에 따라 자동 생성된 문서화 내용입니다.
 */
export async function exportConvert(payload: { blocks: Record<string, unknown>[]; format: string; defaultName: string }): Promise<{ success: boolean; savedPath?: string; error?: string }> {
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `!window.electronAPI?.exportConvert`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (!window.electronAPI?.exportConvert)` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
  if (!window.electronAPI?.exportConvert) return { success: false, error: 'API not available' }
  return window.electronAPI.exportConvert(payload)
}

