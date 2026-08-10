/**
 * @file exportExcel.ts
 * @system AMEVA Workstation
 * @location src/renderer/utils/exporters/exportExcel.ts
 * @role AMEVA 블록 → XLSX(Excel) 변환 내보내기 모듈
 *
 * [소비처 - CONSUMERS / USAGE CONTEXT]
 * - 소비처 A (exporters/index.ts): re-export 경유 ExportModal 등 외부 모듈에 공개.
 *
 * [책임 범위 - RESPONSIBILITY]
 * - NormalizedBlock[] 배열을 ExcelJS를 통해 XLSX 바이너리(Uint8Array)로 변환한다.
 * - table 블록은 그리드 형태로, 나머지 텍스트 블록은 A열에 순서대로 기록한다.
 * - ExcelJS 로드 실패 시 CSV 형식의 Uint8Array로 폴백한다.
 *
 * [절대 깨면 안 되는 계약 - CONTRACT]
 * - MUST: ExcelJS는 동적 import로 로드하여 초기 번들 크기를 최소화할 것.
 * - MUST NOT: 내보내기 실패 시 예외를 상위로 전파하지 말고 CSV 폴백을 반환할 것.
 */

import type { NormalizedBlock } from '../normalizeBlocks';
import { getPlainTextFromNormalized } from '../normalizeBlocks';

/**
 * [FUNCTION CONTRACT]
 * - 함수 명: `exportToExcel`
 * - 역할: AMEVA 에디터의 NormalizedBlock 배열을 XLSX 바이너리 버퍼로 변환한다.
 *         ExcelJS 라이브러리를 동적으로 로드하여 번들 분리(Code Splitting)를 달성한다.
 * @param rawBlocks - 변환할 블록 배열 (any[] 타입 허용, 내부에서 타입 보정)
 * @returns Promise<Uint8Array> - XLSX 바이너리 또는 CSV 인코딩 (폴백 시)
 */
export async function exportToExcel(rawBlocks: any): Promise<Uint8Array> {
  /*
   * [RUN-TIME STATE / INVARIANT]
   * - 변수 명: `blocks`
   * - 자료형: NormalizedBlock[]
   * - 시나리오: 입력이 배열이 아닌 경우 빈 배열로 초기화하여 하위 로직의 타입 안전성을 보장한다.
   */
  const blocks: NormalizedBlock[] = Array.isArray(rawBlocks) ? rawBlocks : []

  try {
    /*
     * [RUN-TIME STATE / INVARIANT]
     * - 변수 명: `ExcelJS`
     * - 자료형: typeof ExcelJS (동적 import)
     * - 시나리오: 동적 import를 통해 ExcelJS를 필요 시에만 로드한다.
     *             이를 통해 ExcelJS의 큰 번들 크기가 초기 로딩에 영향을 주지 않는다.
     */
    const { default: ExcelJS } = await import('exceljs')

    /*
     * [RUN-TIME STATE / INVARIANT]
     * - 변수 명: `workbook`, `sheet`
     * - 시나리오: 새 워크북을 생성하고 'Document'라는 이름의 워크시트를 추가한다.
     *             모든 블록의 내용은 이 시트에 순서대로 기록된다.
     */
    const workbook = new ExcelJS.Workbook()
    const sheet = workbook.addWorksheet('Document')

    /*
     * [RUN-TIME STATE / INVARIANT]
     * - 변수 명: `rowIdx`
     * - 자료형: number
     * - 시나리오: 현재 기록할 Excel 행 번호. 1부터 시작하며 블록이 추가될 때마다 증가한다.
     */
    let rowIdx = 1

    for (const block of blocks) {
      if (block.type === 'table') {
        /*
         * [ALGORITHM BRANCH / DECISION]
         * - 조건 식: `block.type === 'table'`
         * - 만족 시: 표 블록의 각 행을 Excel 행으로 1:1 매핑하여 추가한다.
         *           표와 표 사이에 빈 행을 하나 추가하여 가독성을 높인다.
         */
        const rows = block.tableRows || []
        rows.forEach((r: any) => {
          /*
           * [RUN-TIME STATE / INVARIANT]
           * - 변수 명: `rowData`
           * - 시나리오: 표의 각 셀(인라인 컨텐츠 배열)에서 plain text를 추출하여 Excel 행 데이터로 변환한다.
           */
          const rowData = Array.isArray(r)
            ? r.map((c: any) => c?.content || '')
            : (r?.cells || []).map((c: any) => c?.content || '')
          sheet.addRow(rowData)
          rowIdx++
        })
        rowIdx++ // 표 이후 빈 행 추가
      } else {
        /*
         * [ALGORITHM BRANCH / DECISION]
         * - 조건 식: 비표(non-table) 블록
         * - 만족 시: 블록에서 plain text를 추출하여 A열에 하나의 값으로 기록한다.
         *           빈 블록은 건너뛴다.
         */
        const txt = getPlainTextFromNormalized(block)
        if (txt) {
          sheet.getCell(`A${rowIdx}`).value = txt
          rowIdx++
        }
      }
    }

    /*
     * [RUN-TIME STATE / INVARIANT]
     * - 변수 명: `buffer`
     * - 자료형: Buffer | ArrayBuffer
     * - 시나리오: ExcelJS가 워크북을 XLSX 바이너리로 직렬화한다.
     *             결과를 Uint8Array로 래핑하여 브라우저 환경에서 다운로드 가능한 형태로 반환한다.
     */
    const buffer = await workbook.xlsx.writeBuffer()
    return new Uint8Array(buffer)
  } catch (err) {
    /*
     * [ALGORITHM BRANCH / DECISION]
     * - 조건 식: ExcelJS 로드 또는 변환 실패
     * - 만족 시: CSV 형식으로 폴백 변환한다. UTF-8 BOM(0xFEFF)을 추가하여 Excel에서 한국어가 깨지지 않도록 한다.
     */
    console.error('[exportExcel] ExcelJS 내보내기 실패, CSV로 폴백:', err)

    /*
     * [RUN-TIME STATE / INVARIANT]
     * - 변수 명: `csv`
     * - 자료형: string
     * - 시나리오: UTF-8 BOM 문자('\ufeff')로 시작하는 CSV 문자열을 생성한다.
     *             각 블록의 id, 타입, 텍스트를 쉼표 구분 형식으로 기록한다.
     */
    let csv = '\ufeff위치,블록타입,텍스트\n'
    blocks.forEach(b => {
      const txt = getPlainTextFromNormalized(b).replace(/"/g, '""')
      csv += `"${b.id}","${b.type}","${txt}"\n`
    })
    return new TextEncoder().encode(csv)
  }
}
