/**
 * ============================================================================
 * @file ExcelPlugin.ts
 * @description ExcelPlugin.ts 시스템 모듈 구성요소로, 관련 UI 렌더링 및 비즈니스 로직을 담당합니다.
 * @usage 문서 에디터 및 뷰어 내부에서 동적으로 호출되거나 유틸리티 함수로 사용됩니다.
 * @example
 * // 예시 로직 (자동 생성됨)
 * import { something } from './ExcelPlugin';
 * 
 * @created 2026-08-10 20:30:36
 * @updated 2026-08-10 20:30:36
 * @author uno-km
 * @commit docs: 전체 소스코드 한글 주석 및 사내 컨벤션 일괄 적용
 * ============================================================================
 */

/**
 * @file ExcelPlugin.ts
 * @system AMEVA OS Desktop Workstation
 * @location packages/core/src/renderer/plugins/ExcelPlugin.ts
 * @role Excel Viewer & Editor Plugin Lifecycle Manager
 */

// [내부 프로젝트 의존성 모듈 임포트: ../stores/useUIStore]
import { useUIStore } from '../stores/useUIStore'

/**
 * ExcelPlugin 상태, 변수 또는 상수 선언부입니다.
 * @type {any} - Typescript 컴파일러에 의한 타입 추론(Inferred)
 */
export const ExcelPlugin = {
  id: 'excel-viewer',
  name: 'Excel Viewer & Editor',
  onActivate: () => {
    // 엑셀 블록은 BlockNote 스키마에 자동 등록되므로 상단바 글로벌 모달 메뉴는 제거함.
  },
  onDeactivate: () => {
    // Cleanup if needed
  }
}
