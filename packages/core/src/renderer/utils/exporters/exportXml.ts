/**
 * @file exportXml.ts
 * @system AMEVA Workstation
 * @location src/renderer/utils/exporters/exportXml.ts
 * @role AMEVA 블록 → XML 직렬화 내보내기 모듈
 *
 * [소비처 - CONSUMERS / USAGE CONTEXT]
 * - 소비처 A (exporters/index.ts): re-export 경유 외부 모듈에 공개.
 * - 소비처 B (디버깅 / 문서 구조 분석): 에디터 블록 트리를 사람이 읽을 수 있는 XML로 직렬화하여 검사할 때 사용.
 *
 * [책임 범위 - RESPONSIBILITY]
 * - NormalizedBlock[] 배열을 재귀적으로 XML 문자열로 변환한다.
 * - 블록의 props는 <props> → <prop name="..." > 형태로, 텍스트는 CDATA로 이스케이프한다.
 * - 중첩 블록(children)은 <children> 태그 내부에 재귀적으로 직렬화된다.
 *
 * [절대 깨면 안 되는 계약 - CONTRACT]
 * - MUST: 동기 함수이므로 async/await를 사용하지 말 것.
 * - MUST: CDATA 섹션을 사용하여 사용자 입력 텍스트의 XML 특수문자를 안전하게 처리할 것.
 */

import { getPlainTextFromNormalized, inlineToText } from '../normalizeBlocks';

/**
 * [FUNCTION CONTRACT]
 * - 함수 명: `exportToXML`
 * - 역할: AMEVA 에디터의 블록 배열을 완전한 XML 문자열로 직렬화한다.
 *         디버깅, 문서 구조 분석, 외부 시스템 연동에 활용 가능하다.
 * @param blocks - 직렬화할 블록 배열 (any[])
 * @returns 완성된 XML 문자열 (UTF-8 선언 및 AMEVA 주석 포함)
 */
export function exportToXML(blocks: any[]): string {
  /**
   * [FUNCTION CONTRACT] (내부 헬퍼, 재귀)
   * - 함수 명: `renderXML`
   * - 역할: 단일 블록을 XML 문자열로 변환한다. children이 있는 경우 재귀적으로 처리한다.
   *         들여쓰기(indent)를 누산하여 가독성 높은 계층 구조 XML을 생성한다.
   * @param block - 직렬화할 단일 블록 객체
   * @param indent - 현재 들여쓰기 문자열 (재귀 시 4칸 추가)
   * @returns 들여쓰기가 적용된 XML 블록 문자열
   */
  const renderXML = (block: any, indent = '  '): string => {
    /*
     * [RUN-TIME STATE / INVARIANT]
     * - 변수 명: `xml`
     * - 자료형: string
     * - 시나리오: 블록의 id와 type을 속성으로 가진 <block> 태그로 시작한다.
     */
    let xml = `${indent}<block id="${block.id}" type="${block.type}">\n`

    /*
     * [ALGORITHM BRANCH / DECISION]
     * - 조건 식: `Object.keys(block.props || {}).length > 0`
     * - 만족 시: 블록에 props가 있는 경우 <props> 섹션을 생성하고 각 prop을 CDATA로 기록한다.
     * - 불만족 시: 바이패스하여 컨텐츠 직렬화로 진행한다.
     */
    if (Object.keys(block.props || {}).length > 0) {
      xml += `${indent}  <props>\n`
      /*
       * [LOOP CONTROL ITERATION]
       * - 루프 조건: `for (const [k, v] of Object.entries(block.props))`
       * - 시나리오: 블록 props의 모든 키-값 쌍을 <prop name="key"><![CDATA[value]]></prop> 형태로 직렬화한다.
       */
      for (const [k, v] of Object.entries(block.props)) {
        xml += `${indent}    <prop name="${k}"><![CDATA[${v}]]></prop>\n`
      }
      xml += `${indent}  </props>\n`
    }

    /*
     * [ALGORITHM BRANCH / DECISION]
     * - 조건 식: `block.type === 'table'`
     * - 만족 시: 표 블록의 행/셀 구조를 <table> → <row> → <cell> 계층으로 직렬화한다.
     * - 불만족 시: 블록의 plain text를 <content> CDATA로 직렬화한다.
     */
    if (block.type === 'table') {
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `rows`
       * - 자료형: any[]
       * - 시나리오: tableRows 속성에서 표의 행 배열을 가져온다.
       */
      const rows = block.tableRows ?? []
      xml += `${indent}  <table>\n`
      rows.forEach((row: any) => {
        xml += `${indent}    <row>\n`
        /*
         * [RUN-TIME STATE / INVARIANT]
         * - 변수 명: `cells`
         * - 자료형: any[]
         * - 시나리오: 행에서 셀 배열을 추출한다. row.cells 또는 row 자체가 배열인 경우를 모두 처리한다.
         */
        const cells = Array.isArray(row.cells) ? row.cells : []
        cells.forEach((cell: any) => {
          xml += `${indent}      <cell><![CDATA[${Array.isArray(cell) ? inlineToText(cell) : ''}]]></cell>\n`
        })
        xml += `${indent}    </row>\n`
      })
      xml += `${indent}  </table>\n`
    } else {
      xml += `${indent}  <content><![CDATA[${getPlainTextFromNormalized(block)}]]></content>\n`
    }

    /*
     * [ALGORITHM BRANCH / DECISION]
     * - 조건 식: `Array.isArray(block.children) && block.children.length > 0`
     * - 만족 시: 중첩 블록이 있는 경우 <children> 섹션에 재귀적으로 renderXML을 호출한다.
     *           들여쓰기를 4칸 증가시켜 계층 구조를 시각적으로 표현한다.
     */
    if (Array.isArray(block.children) && block.children.length > 0) {
      xml += `${indent}  <children>\n`
      block.children.forEach((c: unknown) => { xml += renderXML(c, indent + '    ') })
      xml += `${indent}  </children>\n`
    }

    xml += `${indent}</block>\n`
    return xml
  }

  /*
   * [RUN-TIME STATE / INVARIANT]
   * - 변수 명: `xml`
   * - 자료형: string
   * - 시나리오: XML 선언부(<?xml ...?>)와 AMEVA 생성 주석으로 시작하는 루트 문서를 구성한다.
   *             모든 블록을 순서대로 <document> 루트 태그 안에 직렬화한다.
   */
  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`
  xml += `<!-- AMEVA Document Export: ${new Date().toISOString()} -->\n`
  xml += `<document>\n`
  blocks.forEach(b => { xml += renderXML(b) })
  xml += `</document>`
  return xml
}
