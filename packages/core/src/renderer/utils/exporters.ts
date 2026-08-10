/**
 * @file exporters.ts
 * @system AMEVA Workstation
 * @location src/renderer/utils/exporters.ts
 * @role [REFACTORED] 이제 이 파일은 exporters/ 폴더 모듈의 하위 호환성 리다이렉터(Redirect Shim)이다.
 *
 * [리팩토링 이력]
 * - Phase Audit: 1645줄의 God File을 기능별로 7개 모듈로 완전히 해체하였다.
 *   - exporters/exportHtml.ts    ← blocksToHTML
 *   - exporters/exportDocx.ts    ← exportToWord (SmartDocs 조판 엔진 포함)
 *   - exporters/exportExcel.ts   ← exportToExcel
 *   - exporters/exportPptx.ts    ← exportToPPTX
 *   - exporters/exportHwpx.ts    ← exportToHWPX
 *   - exporters/exportXml.ts     ← exportToXML
 *   - exporters/docxHelpers.ts   ← 공유 순수 함수 (calculateWrappedLines, estimateBlockHeight 등)
 *   - imageUtils.ts              ← blobUrlToBase64, getImageDimensions (공유 이미지 유틸)
 *
 * [소비처 - CONSUMERS / USAGE CONTEXT]
 * - 소비처 A (fileConverters.ts): `from './exporters'` 경로로 import하는 파일.
 * - 소비처 B (handleBrowserExport.ts): `from '../../../utils/exporters'` 경로로 import하는 파일.
 * - 소비처 C (handleElectronExport.ts): `from '../../../utils/exporters'` 경로로 import하는 파일.
 * - 소비처 D (SmartDocsRibbon.tsx): `from '../../utils/exporters'` 경로로 import하는 파일.
 *
 * [책임 범위 - RESPONSIBILITY]
 * - 이 파일은 더 이상 비즈니스 로직을 보유하지 않는다.
 * - 기존 소비처의 import 경로를 변경하지 않아도 되도록 모든 함수를 re-export한다.
 * - 새 코드는 반드시 exporters/index.ts를 직접 import할 것.
 *
 * [절대 깨면 안 되는 계약 - CONTRACT]
 * - MUST: 이 파일에 비즈니스 로직을 추가하지 말 것. 오직 re-export만 허용.
 * - MUST: 외부에서 import하는 심볼의 이름을 변경하지 말 것.
 */

/*
 * [RE-EXPORT SECTION]
 * - 설명: exporters/index.ts의 모든 공개 API를 이 파일에서 그대로 re-export한다.
 *         이를 통해 기존 `from './exporters'` import 구문이 수정 없이 동작한다.
 */
export * from './exporters/index';
