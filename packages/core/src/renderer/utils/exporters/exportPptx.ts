/**
 * @file exportPptx.ts
 * @system AMEVA Workstation
 * @location src/renderer/utils/exporters/exportPptx.ts
 * @role AMEVA 블록 → PPTX(PowerPoint) 변환 내보내기 모듈
 *
 * [소비처 - CONSUMERS / USAGE CONTEXT]
 * - 소비처 A (exporters/index.ts): re-export 경유 ExportModal 등 외부 모듈에 공개.
 *
 * [책임 범위 - RESPONSIBILITY]
 * - NormalizedBlock[] 배열을 PptxGenJS를 통해 PPTX 바이너리(Uint8Array)로 변환한다.
 * - Heading 레벨에 따라 커버 슬라이드, 챕터 슬라이드, 컨텐츠 슬라이드를 자동 생성한다.
 * - blob: URL 이미지를 blobUrlToBase64를 통해 변환하여 슬라이드에 삽입한다.
 * - 슬라이드 컨텐츠가 7.0인치를 초과하면 자동으로 다음 슬라이드를 생성한다.
 *
 * [절대 깨면 안 되는 계약 - CONTRACT]
 * - MUST: PptxGenJS는 동적 import로 로드하여 초기 번들 크기를 최소화할 것.
 * - MUST NOT: 내보내기 실패 시 예외를 상위로 전파하지 말고 HTML 폴백을 반환할 것.
 */

import type { NormalizedBlock } from '../normalizeBlocks';
import { getPlainTextFromNormalized } from '../normalizeBlocks';
import { blobUrlToBase64 } from '../imageUtils';
import { blocksToHTML } from './exportHtml';

/**
 * [FUNCTION CONTRACT]
 * - 함수 명: `exportToPPTX`
 * - 역할: AMEVA 에디터의 NormalizedBlock 배열을 PPTX 바이너리 버퍼로 변환한다.
 *         PptxGenJS 라이브러리를 동적으로 로드하여 번들 분리(Code Splitting)를 달성한다.
 * @param rawBlocks - 변환할 블록 배열 (any[] 타입 허용, 내부에서 타입 보정)
 * @returns Promise<Uint8Array> - PPTX 바이너리 또는 HTML 인코딩 (폴백 시)
 */
export async function exportToPPTX(rawBlocks: any): Promise<Uint8Array> {
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
     * - 변수 명: `PptxGenJS`
     * - 자료형: typeof PptxGenJS (동적 import)
     * - 시나리오: 동적 import를 통해 PptxGenJS를 필요 시에만 로드한다.
     *             이를 통해 PptxGenJS의 큰 번들 크기가 초기 로딩에 영향을 주지 않는다.
     */
    const { default: PptxGenJS } = await import('pptxgenjs')

    /*
     * [RUN-TIME STATE / INVARIANT]
     * - 변수 명: `pres`
     * - 자료형: PptxGenJS 인스턴스
     * - 시나리오: 새 프레젠테이션을 생성한다. 기본 슬라이드를 먼저 추가하여 빈 프레젠테이션 방지.
     */
    const pres = new PptxGenJS()

    /*
     * [RUN-TIME STATE / INVARIANT]
     * - 변수 명: `currentSlide`, `hasSlides`, `currentY`
     * - 시나리오:
     *   - currentSlide: 현재 활성 슬라이드 객체. Heading 블록이 등장하면 새 슬라이드로 교체된다.
     *   - hasSlides: 실제로 컨텐츠가 추가된 슬라이드가 있는지 여부. false이면 최종적으로 "내용 없음" 텍스트 추가.
     *   - currentY: 현재 슬라이드에서 다음 요소를 배치할 Y 좌표(인치). 7.0인치를 초과하면 새 슬라이드 생성.
     */
    let currentSlide = pres.addSlide()
    let hasSlides = false
    let currentY = 1.0

    /**
     * [FUNCTION CONTRACT] (내부 헬퍼)
     * - 함수 명: `addText`
     * - 역할: 현재 슬라이드에 텍스트를 추가하는 래퍼 함수.
     *         빈 텍스트는 무시하고, 유효한 텍스트가 추가될 때 hasSlides를 true로 설정한다.
     * @param text - 추가할 텍스트
     * @param options - PptxGenJS addText 옵션 (위치, 크기, 폰트 등)
     */
    const addText = (text: string, options: any) => {
      if (text) {
        currentSlide.addText(text, options)
        hasSlides = true
      }
    }

    for (const block of blocks) {
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `type`, `text`
       * - 시나리오: 블록 타입과 plain text를 먼저 추출하여 이후 분기 처리에 사용한다.
       */
      const type = block.type
      const text = getPlainTextFromNormalized(block) || ''

      if (type === 'heading') {
        /*
         * [ALGORITHM BRANCH / DECISION]
         * - 조건 식: `type === 'heading'`
         * - 만족 시: 헤딩 레벨에 따라 슬라이드 레이아웃이 달라진다.
         *   - level 1 (#): 커버 슬라이드 (중앙 정렬, 44pt)
         *   - level 2 (##): 챕터 슬라이드 (좌측 상단, 32pt)
         *   - level 3+ (###~): 컨텐츠 슬라이드 헤더 (좌측, 24pt)
         */
        const level = block.props?.level || 1
        if (level === 1) {
          currentSlide = pres.addSlide()
          addText(text, { x: 0.5, y: '40%', w: '90%', h: 1.5, fontSize: 44, bold: true, align: 'center', color: '111111' })
          currentY = 5.0
        } else if (level === 2) {
          currentSlide = pres.addSlide()
          addText(text, { x: 0.5, y: 0.5, w: '90%', h: 1, fontSize: 32, bold: true, color: '202020' })
          currentY = 1.5
        } else {
          currentSlide = pres.addSlide()
          addText(text, { x: 0.5, y: 0.3, w: '90%', h: 0.8, fontSize: 24, bold: true, color: '303030' })
          currentY = 1.2
        }
      } else if (type === 'image') {
        /*
         * [ALGORITHM BRANCH / DECISION]
         * - 조건 식: `type === 'image'`
         * - 만족 시: blob: URL은 blobUrlToBase64(imageUtils)를 통해 Data URI로 변환 후 슬라이드에 삽입한다.
         *           변환 실패 시 해당 이미지는 건너뛴다.
         */
        let url = block.props?.url
        if (url) {
          /*
           * [RUN-TIME STATE / INVARIANT]
           * - 변수 명: `url` (재할당)
           * - 시나리오: blobUrlToBase64 (imageUtils 모듈) 를 사용하여 blob: URL을 Data URI로 변환한다.
           *             [BUG-3 수정] 기존 중복 변환 로직을 imageUtils.ts 공유 함수로 대체하여 코드 중복 제거.
           */
          url = await blobUrlToBase64(url)
          try {
            currentSlide.addImage({
              data: url.startsWith('data:') ? url : undefined,
              path: !url.startsWith('data:') ? url : undefined,
              x: 0.5, y: currentY, w: 6, h: 3,
              sizing: { type: 'contain' }
            })
            hasSlides = true
            currentY += 3.2
          } catch (e) {
            console.error('[exportPptx] 이미지 삽입 실패:', e)
          }
        }
      } else if (type === 'table') {
        /*
         * [ALGORITHM BRANCH / DECISION]
         * - 조건 식: `type === 'table'`
         * - 만족 시: 표의 각 행/셀 데이터를 PptxGenJS의 addTable 형식으로 변환하여 슬라이드에 삽입한다.
         */
        const rows = block.content?.rows || []
        if (Array.isArray(rows) && rows.length > 0) {
          const tableData = rows.map((r: any) =>
            Array.isArray(r) ? r.map((c: any) => ({ text: c.content || '' })) : []
          )
          currentSlide.addTable(tableData, { x: 0.5, y: currentY, w: 9 })
          hasSlides = true
          currentY += (rows.length * 0.4) + 0.2
        }
      } else if (type === 'codeBlock') {
        /*
         * [ALGORITHM BRANCH / DECISION]
         * - 조건 식: `type === 'codeBlock'`
         * - 만족 시: 코드 블록 언어명과 내용을 등폭 폰트(Courier New)로 슬라이드에 추가한다.
         */
        addText(`[코드 블록: ${block.props?.language || 'text'}]\n${text}`, {
          x: 0.5, y: currentY, w: '90%', fontSize: 12, fontFace: 'Courier New', color: '404040'
        })
        currentY += 1.0
      } else if (type === 'kanban' || type === 'excel' || type === 'inlineDocument' || type === 'presentation' || type === 'jupyter') {
        /*
         * [ALGORITHM BRANCH / DECISION]
         * - 조건 식: 복잡한 AMEVA 커스텀 블록 타입
         * - 만족 시: PPTX 변환이 지원되지 않는 커스텀 블록은 타입명과 함께 폴백 텍스트로 대체한다.
         */
        addText(`[AMEVA 커스텀 블록: ${type}] 변환 폴백`, {
          x: 0.5, y: currentY, w: '90%', fontSize: 14, color: '888888', italic: true
        })
        currentY += 0.5
      } else {
        /*
         * [ALGORITHM BRANCH / DECISION]
         * - 조건 식: 일반 텍스트 블록 (paragraph, bulletListItem, quote 등)
         * - 만족 시: plain text를 16pt 크기로 현재 Y 위치에 추가한다.
         */
        if (text) {
          addText(text, { x: 0.5, y: currentY, w: '90%', fontSize: 16, color: '333333' })
          currentY += 0.4
        }
      }

      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `currentY > 7.0`
       * - 만족 시: 슬라이드 높이(7인치) 초과. 새 슬라이드를 생성하고 currentY를 0.5로 리셋한다.
       *           무한 스크롤이 아닌 페이지 기반 PPT 포맷에서 오버플로우를 방지한다.
       */
      if (currentY > 7.0) {
        currentSlide = pres.addSlide()
        currentY = 0.5
      }
    }

    /*
     * [ALGORITHM BRANCH / DECISION]
     * - 조건 식: `!hasSlides`
     * - 만족 시: 내용이 하나도 추가되지 않은 경우 기본 메시지를 삽입하여 빈 PPT를 방지한다.
     */
    if (!hasSlides) currentSlide.addText('내용이 없습니다.', { x: 1, y: 2, fontSize: 24 })

    /*
     * [RUN-TIME STATE / INVARIANT]
     * - 변수 명: `arrayBuffer`
     * - 자료형: ArrayBuffer
     * - 시나리오: PptxGenJS가 프레젠테이션을 PPTX 바이너리로 직렬화한다.
     *             결과를 Uint8Array로 래핑하여 브라우저 환경에서 다운로드 가능한 형태로 반환한다.
     */
    const arrayBuffer = await pres.write({ outputType: 'arraybuffer' })
    return new Uint8Array(arrayBuffer as ArrayBuffer)
  } catch (e) {
    /*
     * [ALGORITHM BRANCH / DECISION]
     * - 조건 식: PptxGenJS 로드 또는 변환 실패
     * - 만족 시: blocksToHTML을 폴백으로 사용하여 HTML 내용을 UTF-8 바이너리로 반환한다.
     */
    console.error('[exportPptx] PPTX 내보내기 실패, HTML로 폴백:', e)
    const html = await blocksToHTML(rawBlocks)
    return new TextEncoder().encode(html)
  }
}
