/**
 * @file exportHwpx.ts
 * @system AMEVA Workstation
 * @location src/renderer/utils/exporters/exportHwpx.ts
 * @role AMEVA 블록 → HWPX 변환 내보내기 모듈 (HTML 래퍼 방식)
 *
 * [소비처 - CONSUMERS / USAGE CONTEXT]
 * - 소비처 A (exporters/index.ts): re-export 경유 외부 모듈에 공개.
 *
 * [책임 범위 - RESPONSIBILITY]
 * - 진짜 HWPX 포맷 변환은 현재 브라우저 환경에서 구현 불가(한글과컴퓨터 포맷 사양 미공개).
 * - 대신 XHTML 파일(실질적으로 HTML)을 HWPX MIME 타입으로 감싸서 반환하는 폴백 방식을 사용한다.
 * - 실질적인 변환은 blocksToHTML에 위임한다.
 *
 * [절대 깨면 안 되는 계약 - CONTRACT]
 * - MUST: 추후 실제 HWPX 변환 엔진이 개발되면 이 파일의 함수 시그니처를 유지한 채 내부 구현만 교체할 것.
 * - MUST NOT: blocksToHTML 이외의 무거운 의존성을 이 파일에 추가하지 말 것.
 */

import { blocksToHTML } from './exportHtml';

/**
 * [FUNCTION CONTRACT]
 * - 함수 명: `exportToHWPX`
 * - 역할: AMEVA 에디터의 NormalizedBlock 배열을 HWPX 형식으로 내보낸다.
 *         현재 구현은 HTML을 XHTML MIME 타입의 Blob으로 감싸는 폴백 방식이다.
 *         실제 한컴 HWPX 포맷 지원이 추가되면 이 함수를 교체한다.
 * @param rawBlocks - 변환할 블록 배열 (any[] 타입 허용)
 * @returns Promise<Blob> - XHTML 컨텐츠를 담은 Blob (MIME: application/xhtml+xml)
 */
export async function exportToHWPX(rawBlocks: any): Promise<Blob> {
  /*
   * [RUN-TIME STATE / INVARIANT]
   * - 변수 명: `html`
   * - 자료형: string
   * - 시나리오: blocksToHTML을 통해 완전한 HTML 문서 문자열을 생성한다.
   *             이 HTML이 HWPX 폴백의 실제 컨텐츠가 된다.
   */
  const html = await blocksToHTML(rawBlocks)

  /*
   * [RETURN VALUE]
   * - 설명: HTML 문자열을 XHTML MIME 타입 Blob으로 래핑하여 반환한다.
   *         MIME 타입 'application/xhtml+xml'은 한글 워드프로세서가 인식 가능한 형태이다.
   */
  return new Blob([html], { type: 'application/xhtml+xml' })
}
