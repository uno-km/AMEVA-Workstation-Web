/**
 * @file index.ts
 * @system AMEVA Workstation
 * @location src/renderer/utils/exporters/index.ts
 * @role AMEVA 내보내기 모듈 공개 API 게이트웨이 (Barrel File)
 *
 * [소비처 - CONSUMERS / USAGE CONTEXT]
 * - 소비처 A (components/ExportModal.tsx): 사용자가 내보내기 형식 선택 시 각 내보내기 함수를 호출.
 * - 소비처 B (components/MenuBar.tsx): 메뉴에서 직접 내보내기 액션 실행.
 * - 소비처 C (기존 코드 하위 호환): 이전에 `../utils/exporters`를 import하던 모든 파일.
 *
 * [책임 범위 - RESPONSIBILITY]
 * - exporters/ 폴더 내 모든 내보내기 함수를 단일 진입점으로 re-export한다.
 * - 이를 통해 외부 소비처의 import 경로를 변경하지 않고도 내부 모듈 구조를 자유롭게 변경 가능하다.
 * - 느슨한 결합(Loose Coupling) 아키텍처의 핵심: 소비처는 이 파일만 알면 된다.
 *
 * [절대 깨면 안 되는 계약 - CONTRACT]
 * - MUST: 새 내보내기 모듈이 추가될 때마다 반드시 이 파일에도 re-export를 추가할 것.
 * - MUST: 외부에서 import하는 함수/타입의 이름을 절대 변경하지 말 것 (하위 호환성 보장).
 * - MUST NOT: 이 파일에 비즈니스 로직을 추가하지 말 것. 순수 re-export만 허용.
 */

/*
 * [RE-EXPORT SECTION]
 * - 설명: 각 내보내기 모듈에서 공개 API를 re-export한다.
 *         소비처는 `import { exportToWord } from '../../utils/exporters'` 형태로 사용한다.
 */

// HTML 내보내기
export { blocksToHTML } from './exportHtml';

// DOCX(Word) 내보내기 (SmartDocs 조판 엔진 포함)
export { exportToWord } from './exportDocx';

// XLSX(Excel) 내보내기
export { exportToExcel } from './exportExcel';

// PPTX(PowerPoint) 내보내기
export { exportToPPTX } from './exportPptx';

// HWPX(한글 워드프로세서) 내보내기 (HTML 폴백 방식)
export { exportToHWPX } from './exportHwpx';

// XML 내보내기 (블록 구조 직렬화)
export { exportToXML } from './exportXml';

/*
 * [TYPE RE-EXPORT SECTION]
 * - 설명: 소비처에서 타입 애노테이션에 사용할 수 있도록 관련 타입을 re-export한다.
 *         `import type`을 사용하여 런타임 번들에는 포함되지 않도록 한다.
 */

// NormalizedBlock 타입 (에디터 블록 정규화 포맷)
export type { NormalizedBlock as Block } from '../normalizeBlocks';
