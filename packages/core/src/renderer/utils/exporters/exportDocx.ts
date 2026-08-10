/**
 * @file exportDocx.ts
 * @system AMEVA Workstation
 * @location src/renderer/utils/exporters/exportDocx.ts
 * @role AMEVA 블록 → DOCX(Word) 변환 내보내기 모듈 (SmartDocs 조판 엔진 포함)
 *
 * [소비처 - CONSUMERS / USAGE CONTEXT]
 * - 소비처 A (exporters/index.ts): re-export 경유 ExportModal 등 외부 모듈에 공개.
 *
 * [책임 범위 - RESPONSIBILITY]
 * - NormalizedBlock[] 배열을 docx 라이브러리를 통해 DOCX Blob으로 변환한다.
 * - isSmartDocsMode=true 시: 대기업 기조실 공문서 포맷(한국 A4 표준, 맥킨지 스타일)으로 조판한다.
 *   - 제목 레벨별 기호 자동 부여 (□, ○, -, ㆍ)
 *   - 고아 단락 방지: Keep-with-next Lookahead 엔진으로 제목 홀로 페이지 하단에 남는 것을 방지
 *   - 표 자동 분석 → 네이티브 차트 자동 생성 (extractChartDataFromMatrix)
 *   - 목차(TOC) 자동 삽입
 *   - 단위 범례 자동 생성 (원, 천 원, 명, 건)
 * - 문서 메타데이터 자동 압인: 작성자, 회사, 생성 시각, AMEVA Tracker ID
 * - 생성된 DOCX에 네이티브 차트(injectNativeCharts)를 JSZip으로 주입한다.
 *
 * [절대 깨면 안 되는 계약 - CONTRACT]
 * - MUST: docx 라이브러리는 동적 import로 로드하여 초기 번들 크기를 최소화할 것.
 * - MUST NOT: 내보내기 실패 시 예외를 상위로 전파하지 말고 HTML Blob으로 폴백할 것.
 */

import type { NormalizedBlock } from '../normalizeBlocks';
import { getPlainTextFromNormalized, inlineToText } from '../normalizeBlocks';
import { extractChartDataFromMatrix } from '../chartHeuristics';
import { injectNativeCharts } from '../docxChartInjector';
import type { ChartData } from '../docxChartInjector';
import { parseAmevaBlockData, calculateWrappedLines, estimateBlockHeight, parseTextWithEmphasis } from './docxHelpers';
import { blocksToHTML } from './exportHtml';

/**
 * [FUNCTION CONTRACT]
 * - 함수 명: `exportToWord`
 * - 역할: AMEVA 에디터의 NormalizedBlock 배열을 DOCX Blob으로 변환한다.
 *         isSmartDocsMode가 true이면 한국 공문서 표준(A4, SmartDocs) 포맷을 적용한다.
 * @param rawBlocks - 변환할 블록 배열 (any[] 타입 허용)
 * @param isSmartDocsMode - true: SmartDocs 공문서 모드, false: 기본 Word 모드
 * @returns Promise<Blob> - DOCX Blob 또는 HTML Blob (폴백 시)
 */
export async function exportToWord(rawBlocks: any, isSmartDocsMode: boolean = false): Promise<Blob> {
  /*
   * [RUN-TIME STATE / INVARIANT]
   * - 변수 명: `blocks`
   * - 자료형: NormalizedBlock[]
   * - 시나리오: 입력이 배열이 아닌 경우 빈 배열로 초기화하여 하위 로직의 타입 안전성을 보장한다.
   */
  const blocks: NormalizedBlock[] = Array.isArray(rawBlocks) ? rawBlocks : []

  /*
   * [RUN-TIME STATE / INVARIANT]
   * - 변수 명: `chartsToInject`
   * - 자료형: ChartData[]
   * - 시나리오: 표 블록에서 heuristic 분석을 통해 추출된 차트 데이터를 누산한다.
   *             DOCX 렌더링 완료 후 injectNativeCharts로 네이티브 차트를 JSZip 방식으로 삽입한다.
   */
  const chartsToInject: ChartData[] = []

  try {
    /*
     * [RUN-TIME STATE / INVARIANT]
     * - 변수 명: `docx` (동적 import)
     * - 시나리오: docx 라이브러리를 동적으로 로드하여 번들 분리를 달성한다.
     *             구조분해로 필요한 클래스만 추출한다.
     */
    const docx = await import('docx')
    const {
      Document, Packer, Paragraph, TextRun, HeadingLevel, ImageRun,
      Table, TableRow, TableCell, WidthType, AlignmentType, BorderStyle, TableOfContents
    } = docx

    /*
     * [RUN-TIME STATE / INVARIANT]
     * - 변수 명: `children`
     * - 자료형: any[]
     * - 시나리오: DOCX 문서의 섹션 컨텐츠를 순서대로 누산하는 배열.
     *             Paragraph, Table, TableOfContents 등 docx 객체들이 순서대로 추가된다.
     */
    const children: any[] = []

    /**
     * [FUNCTION CONTRACT] (내부 헬퍼)
     * - 함수 명: `getImageDimensions`
     * - 역할: 이미지 URL의 자연 크기(naturalWidth, naturalHeight)를 비동기로 측정한다.
     *         ImageRun의 transformation 속성에 사용된다.
     * @param url - 측정할 이미지 URL
     * @returns Promise<{ width: number; height: number }>
     */
    const getImageDimensions = (url: string): Promise<{ width: number; height: number }> => {
      return new Promise((resolve) => {
        const img = new Image()
        img.onload = () => resolve({ width: img.naturalWidth || img.width, height: img.naturalHeight || img.height })
        img.onerror = () => resolve({ width: 500, height: 300 })
        img.src = url
      })
    }

    /**
     * [FUNCTION CONTRACT] (내부 래퍼)
     * - 함수 명: `emphasisHelper`
     * - 역할: docxHelpers의 parseTextWithEmphasis에 현재 컨텍스트의 TextRun 클래스와 모드 플래그를 주입하는 래퍼.
     *         의존성 주입(DI) 패턴으로 docxHelpers가 docx 라이브러리에 직접 의존하지 않도록 한다.
     * @param rawText - 처리할 텍스트
     * @param baseOptions - TextRun 기본 옵션
     */
    const emphasisHelper = (rawText: string, baseOptions: Record<string, any> = {}) =>
      parseTextWithEmphasis(rawText, baseOptions, TextRun, isSmartDocsMode)

    /**
     * [FUNCTION CONTRACT] (내부 래퍼)
     * - 함수 명: `heightHelper`
     * - 역할: docxHelpers의 estimateBlockHeight에 isSmartDocsMode를 주입하는 래퍼.
     * @param b - 높이를 추정할 블록
     */
    const heightHelper = (b: NormalizedBlock | undefined) =>
      estimateBlockHeight(b, isSmartDocsMode)

    /*
     * [RUN-TIME STATE / INVARIANT]
     * - 변수 명: `closeList` (내부 상태 관리)
     * - 시나리오: HTML 변환과 달리 DOCX는 리스트를 별도 래퍼 태그로 감싸지 않는다.
     *             리스트 관련 연속 빈 줄 카운터 등 상태만 관리한다.
     */
    let closeList = () => {}

    // ══════════════════════════════════════════════════════════════
    // 조판 엔진 상태 변수
    // ══════════════════════════════════════════════════════════════

    /*
     * [RUN-TIME STATE / INVARIANT]
     * - 변수 명: `consecutiveEmptyParagraphs`
     * - 자료형: number
     * - 시나리오: 연속된 빈 단락의 수를 추적한다. SmartDocs 모드에서 2개 이상 연속 빈 줄 삽입을 방지한다.
     */
    let consecutiveEmptyParagraphs = 0

    /*
     * [RUN-TIME STATE / INVARIANT]
     * - 변수 명: `hasSeenAttachment`
     * - 자료형: boolean
     * - 시나리오: '붙임/별첨' 키워드가 처음 등장했는지 추적한다.
     *             처음 등장 시 페이지 나누기를 삽입하고, 이후 동일 키워드에는 중복 페이지 나누기를 방지한다.
     */
    let hasSeenAttachment = false

    /*
     * [RUN-TIME STATE / INVARIANT]
     * - 변수 명: `currentTwipsY`
     * - 자료형: number (Twips 단위, 1인치 = 1440 Twips)
     * - 시나리오: 현재 페이지에서 마지막으로 기록된 Y 좌표(Twips).
     *             블록이 렌더링될 때마다 해당 블록의 예상 높이를 누산한다.
     *             MAX_AVAILABLE_Y(14288 Twips ≈ 252mm)를 초과하면 페이지 넘김을 발동한다.
     */
    let currentTwipsY = 0

    /*
     * [RUN-TIME STATE / INVARIANT]
     * - 변수 명: `MAX_AVAILABLE_Y`
     * - 자료형: number (Twips)
     * - 시나리오: A4 용지(297mm) - 상단 여백(30mm) - 하단 여백(15mm) = 252mm ≈ 14288 Twips.
     *             이 값을 초과하면 다음 블록은 새 페이지에서 시작되어야 한다.
     */
    const MAX_AVAILABLE_Y = 14288

    // ══════════════════════════════════════════════════════════════
    // 블록 렌더링 루프 (Lookahead 기반 고아 단락 방지)
    // ══════════════════════════════════════════════════════════════

    /*
     * [LOOP CONTROL ITERATION]
     * - 루프 조건: `for (let blockIndex = 0; blockIndex < blocks.length; blockIndex++)`
     * - 시나리오: for-of 대신 인덱스 기반 for를 사용하여 blocks[blockIndex + 1] Lookahead를 지원한다.
     *             Heading 블록을 렌더링하기 전에 다음 블록의 예상 높이를 미리 계산하여
     *             현재 페이지에 Heading + 다음 블록이 모두 들어갈 수 있는지 판단한다.
     */
    for (let blockIndex = 0; blockIndex < blocks.length; blockIndex++) {
      const block = blocks[blockIndex]
      const text = getPlainTextFromNormalized(block)

      if (block.type === 'heading') {
        /*
         * [RUN-TIME STATE / INVARIANT]
         * - 변수 명: `level`, `trimmedText`
         * - 시나리오: 제목 레벨과 트리밍된 텍스트를 추출하여 이후 SmartDocs 스타일 결정에 사용한다.
         */
        const level = block.props.level || 1
        const trimmedText = text.trim()

        /*
         * [RUN-TIME STATE / INVARIANT]
         * - 변수 명: `headingText`, `headingSize`, `isBold`, `align`, `indentLeft`, `headingLevel`
         * - 시나리오: SmartDocs 모드에서 제목 레벨에 따라 기호, 크기, 정렬, 들여쓰기를 결정한다.
         *   - H1: 제목 (중앙 정렬, 22pt)
         *   - H2: □ 항목 (16pt)
         *   - H3: ○ 세항 (15pt, 1레벨 들여쓰기)
         *   - H4: - 목 (14pt, 2레벨 들여쓰기)
         *   - H5+: ㆍ 호 (13pt, 3레벨 들여쓰기)
         */
        let headingText = text
        let headingSize = 30
        let isBold = true
        let align = AlignmentType.LEFT
        let indentLeft = 0
        let headingLevel = undefined

        if (isSmartDocsMode) {
          if (level === 1) {
            headingLevel = HeadingLevel.HEADING_1; headingSize = 44; align = AlignmentType.CENTER
          } else if (level === 2) {
            headingLevel = HeadingLevel.HEADING_2; headingText = `□ ${text}`; headingSize = 32; indentLeft = 0
          } else if (level === 3) {
            headingLevel = HeadingLevel.HEADING_3; headingText = `○ ${text}`; headingSize = 30; isBold = false; indentLeft = 240
          } else if (level === 4) {
            headingLevel = HeadingLevel.HEADING_4; headingText = `- ${text}`; headingSize = 28; isBold = false; indentLeft = 480
          } else {
            headingLevel = HeadingLevel.HEADING_5; headingText = `ㆍ ${text}`; headingSize = 26; isBold = false; indentLeft = 720
          }

          /*
           * [ALGORITHM BRANCH / DECISION]
           * - 조건 식: 붙임/별첨 키워드 감지
           * - 만족 시: 붙임/별첨 제목은 항상 16pt Bold, 좌측 정렬, 들여쓰기 없음으로 강제 오버라이드한다.
           */
          if (/^(\[|※\s*)?(붙임|별첨)[\s:\]\d]*/.test(trimmedText)) {
            headingText = trimmedText; headingSize = 32; isBold = true; align = AlignmentType.LEFT; indentLeft = 0; headingLevel = HeadingLevel.HEADING_1
          }
        }

        /*
         * [RUN-TIME STATE / INVARIANT]
         * - 변수 명: `pageBreakBefore`
         * - 자료형: boolean
         * - 시나리오: 붙임/별첨 첫 등장 시 또는 고아 단락 방지 로직에 의해 페이지 나누기가 강제 발동된다.
         */
        let pageBreakBefore = false
        if (isSmartDocsMode && /^(\[|※\s*)?(붙임|별첨)[\s:\]\d]*/.test(trimmedText)) {
          if (!hasSeenAttachment) { pageBreakBefore = true; hasSeenAttachment = true }
        }

        // --- 고아 단락 방지 (Phase 6 Keep-with-next Lookahead 엔진) ---
        const spacingBefore = isSmartDocsMode ? (pageBreakBefore ? 0 : 360) : 240
        const spacingAfter = 120
        const wrappedLines = calculateWrappedLines(headingText, headingSize / 2)
        const blockHeight = (wrappedLines * (headingSize / 2) * 20 * 1.6) + spacingBefore + spacingAfter

        /*
         * [RUN-TIME STATE / INVARIANT]
         * - 변수 명: `nextBlockHeight`
         * - 자료형: number (Twips)
         * - 시나리오: blocks[blockIndex + 1]의 예상 높이를 미리 계산한다.
         *             다음 블록이 없으면 estimateBlockHeight가 0을 반환하므로 Lookahead 패널티가 없다.
         */
        const nextBlockHeight = heightHelper(blocks[blockIndex + 1])

        if (pageBreakBefore) currentTwipsY = 0

        /*
         * [ALGORITHM BRANCH / DECISION]
         * - 조건 식: Keep-with-next Lookahead
         * - 만족 시: 현재 제목 + 다음 블록이 현재 페이지에 모두 들어갈 수 없다면 제목 전에 페이지 나누기를 삽입한다.
         *           이로써 제목이 홀로 페이지 하단에 고아로 남는 현상을 방지한다.
         */
        if (isSmartDocsMode && currentTwipsY > 0 && currentTwipsY + blockHeight + Math.min(nextBlockHeight, 4000) > MAX_AVAILABLE_Y) {
          pageBreakBefore = true
          currentTwipsY = 0
        }

        currentTwipsY += blockHeight
        if (currentTwipsY >= MAX_AVAILABLE_Y) currentTwipsY = currentTwipsY % MAX_AVAILABLE_Y

        children.push(new Paragraph({
          heading: headingLevel,
          pageBreakBefore: pageBreakBefore ? true : undefined,
          children: emphasisHelper(headingText, { size: headingSize, bold: isBold }),
          alignment: align,
          indent: indentLeft > 0 ? { left: indentLeft } : undefined,
          spacing: { before: isSmartDocsMode ? (pageBreakBefore ? 0 : 360) : 240, after: 120 }
        }))
        consecutiveEmptyParagraphs = 0

      } else if (block.type === 'paragraph') {
        const trimmed = text.trim()
        if (trimmed) {
          /*
           * [RUN-TIME STATE / INVARIANT]
           * - 변수 명: `isRef`, `isNounEnding`, `isDatePattern`
           * - 시나리오: 휴리스틱 컨텍스트 분류기. 텍스트 패턴으로 단락의 성격을 분류한다.
           *   - isRef: '※' 또는 '*' 로 시작하는 참고/각주 단락 → 작은 글씨(13pt), 회색
           *   - isNounEnding: '-함', '-됨', '-임' 등 명사형 종결어미 → 글머리 기호로 처리
           *   - isDatePattern: '2024. 1. 1.' 형태의 날짜 단락 → Bold 강조
           */
          const isRef = isSmartDocsMode && /^[\s]*[※\*]\s*(.*)$/.test(text)
          const isNounEnding = isSmartDocsMode && !isRef && /(함|됨|음|임)\.$/.test(trimmed)
          const isDatePattern = isSmartDocsMode && !isRef && !isNounEnding && /^[~\-\s]*\d{4}\.\s*\d{1,2}\.\s*(\d{1,2}\.)?[\s]*$/.test(trimmed)

          let textSize = isSmartDocsMode ? 30 : undefined
          let textColor = undefined
          let isBold = false
          let bulletOpt = undefined
          let pageBreakBefore = false

          if (isSmartDocsMode && /^(\[|※\s*)?(붙임|별첨)[\s:\]\d]*/.test(trimmed)) {
            if (!hasSeenAttachment) { pageBreakBefore = true; hasSeenAttachment = true }
            textSize = 32; isBold = true; textColor = undefined
          } else if (isRef) {
            textSize = 26; textColor = '64748B'
          } else if (isNounEnding) {
            bulletOpt = { level: 0 }
          } else if (isDatePattern) {
            isBold = true; textSize = 32
          }

          const finalSize = textSize ?? 20
          const lineSpacing = isSmartDocsMode ? 1.6 : 1.0
          const wrappedLines = calculateWrappedLines(trimmed, finalSize / 2)
          const blockHeight = (wrappedLines * (finalSize / 2) * 20 * lineSpacing) + 120

          if (pageBreakBefore) currentTwipsY = 0
          if (isSmartDocsMode && currentTwipsY + blockHeight > MAX_AVAILABLE_Y) {
            pageBreakBefore = true; currentTwipsY = 0
          }
          currentTwipsY += blockHeight
          if (currentTwipsY >= MAX_AVAILABLE_Y) currentTwipsY = currentTwipsY % MAX_AVAILABLE_Y

          children.push(new Paragraph({
            widowControl: isSmartDocsMode ? true : undefined,
            pageBreakBefore: pageBreakBefore ? true : undefined,
            children: emphasisHelper(trimmed, { size: textSize, color: textColor, bold: isBold }),
            spacing: { before: pageBreakBefore ? 0 : undefined, after: 120, line: isSmartDocsMode ? 384 : undefined },
            bullet: bulletOpt
          }))
          consecutiveEmptyParagraphs = 0
        } else {
          if (isSmartDocsMode) {
            consecutiveEmptyParagraphs++
            if (consecutiveEmptyParagraphs <= 1) {
              children.push(new Paragraph({ text: '', spacing: { after: 120, line: 384 } }))
            }
          }
        }

      } else if (block.type === 'bulletListItem') {
        children.push(new Paragraph({
          children: emphasisHelper(text, { size: isSmartDocsMode ? 30 : undefined }),
          bullet: { level: 0 },
          spacing: { after: 120, line: isSmartDocsMode ? 384 : undefined }
        }))
        consecutiveEmptyParagraphs = 0

      } else if (block.type === 'numberedListItem') {
        children.push(new Paragraph({
          children: emphasisHelper('1. ' + text, { size: isSmartDocsMode ? 30 : undefined }),
          spacing: { after: 120, line: isSmartDocsMode ? 384 : undefined }
        }))
        consecutiveEmptyParagraphs = 0

      } else if (block.type === 'checkListItem') {
        children.push(new Paragraph({
          children: emphasisHelper((block.props?.checked ? '[x] ' : '[ ] ') + text, { size: isSmartDocsMode ? 30 : undefined }),
          spacing: { after: 120, line: isSmartDocsMode ? 384 : undefined }
        }))
        consecutiveEmptyParagraphs = 0

      } else if (block.type === 'quote') {
        children.push(new Paragraph({
          children: emphasisHelper('" ' + text, { size: isSmartDocsMode ? 30 : undefined }),
          spacing: { after: 120, line: isSmartDocsMode ? 384 : undefined }
        }))
        consecutiveEmptyParagraphs = 0

      } else if (block.type === 'divider') {
        children.push(new Paragraph({
          text: '───────────────────────',
          spacing: { after: 120, before: 120, line: isSmartDocsMode ? 384 : undefined }
        }))
        consecutiveEmptyParagraphs = 0

      } else if (block.type === 'image') {
        consecutiveEmptyParagraphs = 0
        try {
          const url = block.props?.url
          const { width, height } = await getImageDimensions(url)
          const res = await fetch(url)
          const arrayBuffer = await res.arrayBuffer()
          const finalWidth = Math.min(width, 600)
          const finalHeight = width > 600 ? 600 * (height / width) : height
          children.push(new Paragraph({
            children: [new ImageRun({ data: arrayBuffer, transformation: { width: finalWidth, height: finalHeight } })],
            spacing: { after: 120 }
          }))
        } catch (e) {
          children.push(new Paragraph({ text: '[이미지를 불러오지 못했습니다]', spacing: { after: 120 } }))
        }
        currentTwipsY += 400
        if (currentTwipsY >= MAX_AVAILABLE_Y) currentTwipsY = currentTwipsY % MAX_AVAILABLE_Y

      } else if (block.type === 'table' || block.type === 'smartDocsTable') {
        consecutiveEmptyParagraphs = 0
        const rows = block.content?.rows || (block as any).tableRows || []

        if (Array.isArray(rows) && rows.length > 0) {
          const isSmartDocs = block.type === 'smartDocsTable' || isSmartDocsMode

          /*
           * [RUN-TIME STATE / INVARIANT]
           * - 변수 명: `rawMatrix`
           * - 자료형: string[][]
           * - 시나리오: 표의 각 행/셀을 plain text로 변환한 2D 배열.
           *             이 배열은 헤더 감지, 정렬 분석, 단위 범례 생성, 차트 데이터 추출에 모두 재사용된다.
           */
          const rawMatrix = rows.map((r: any) => {
            const cells = (Array.isArray(r) || Array.isArray(r?.cells)) ? (r.cells || r) : []
            return cells.map((c: any) => {
              if (Array.isArray(c)) return inlineToText(c)
              if (c && Array.isArray(c.content)) return inlineToText(c.content)
              if (c && typeof c.content === 'string') return c.content
              if (typeof c === 'string') return c
              return ''
            })
          })

          let hasHeaderRow = false
          let colAlignments: any[] = []

          if (isSmartDocs && rawMatrix.length > 0) {
            // 헤더 행 감지: 키워드 기반 또는 첫 행이 짧고 2번째 행에 숫자/날짜가 있는 경우
            const firstRow = rawMatrix[0]
            const headerRegex = /(구분|항목|내용|비고|일자|일시|금액|연번|담당|부서|이름|성명|사유)/i
            if (firstRow.some((c: string) => headerRegex.test(c))) {
              hasHeaderRow = true
            } else if (rawMatrix.length > 1) {
              const avgLen = firstRow.reduce((sum: number, c: string) => sum + c.length, 0) / (firstRow.length || 1)
              if (avgLen < 15) {
                const numDateRegex = /([0-9,.\s원%]+|^\d{2,4}[./-]\d{1,2}[./-]\d{1,2}$)/
                if (rawMatrix[1].some((c: string) => numDateRegex.test(c))) hasHeaderRow = true
              }
            }

            // 열 정렬 분석: 숫자 비율 ≥ 70% → 우측, 긴 텍스트 존재 → 좌측, 나머지 → 가운데
            const numCols = Math.max(...rawMatrix.map((r: string[]) => r.length))
            for (let c = 0; c < numCols; c++) {
              let numCount = 0, longTextCount = 0, validRows = 0
              for (let r = hasHeaderRow ? 1 : 0; r < rawMatrix.length; r++) {
                if (c >= rawMatrix[r].length) continue
                const cellText = rawMatrix[r][c].trim()
                if (!cellText) continue
                validRows++
                if (/^[0-9,.\s원%]+$/.test(cellText)) numCount++
                else if (cellText.length >= 20 || cellText.split(' ').length >= 3) longTextCount++
              }
              if (validRows > 0) {
                if (numCount / validRows >= 0.7) colAlignments[c] = AlignmentType.RIGHT
                else if (longTextCount > 0) colAlignments[c] = AlignmentType.LEFT
                else colAlignments[c] = AlignmentType.CENTER
              } else {
                colAlignments[c] = AlignmentType.CENTER
              }
              // 헤더 키워드 오버라이드: 컬럼 헤더명으로 정렬 방식 재결정
              if (hasHeaderRow && c < rawMatrix[0].length) {
                const header = rawMatrix[0][c]
                if (/(구분|비고|연번|일자|담당자)/i.test(header)) colAlignments[c] = AlignmentType.CENTER
                else if (/(내용|상세|사유|추진계획|현황)/i.test(header)) colAlignments[c] = AlignmentType.LEFT
                else if (/(금액|예산|비율|건수)/i.test(header)) colAlignments[c] = AlignmentType.RIGHT
              }
            }

            // 단위 범례 자동 생성: 표 내 단위 출현 빈도 집계 → 최다 빈도 단위를 "(단위: ...)" 형태로 삽입
            let unitWonCount = 0, unitThousandCount = 0, unitMyungCount = 0, unitGunCount = 0
            for (const r of rawMatrix) for (const cellText of r) {
              if (/(천원|천 원)/.test(cellText)) unitThousandCount++
              else if (/(원)/.test(cellText)) unitWonCount++
              else if (/(명)$/.test(cellText.trim())) unitMyungCount++
              else if (/(건)$/.test(cellText.trim())) unitGunCount++
            }
            const maxUnit = Math.max(unitWonCount, unitThousandCount, unitMyungCount, unitGunCount)
            if (maxUnit > 0) {
              let unitStr = '원'
              if (maxUnit === unitThousandCount) unitStr = '천 원'
              else if (maxUnit === unitMyungCount) unitStr = '명'
              else if (maxUnit === unitGunCount) unitStr = '건'
              children.push(new Paragraph({
                children: [new TextRun({ text: `(단위: ${unitStr})`, size: 26 })],
                alignment: AlignmentType.RIGHT,
                spacing: { after: 120 }
              }))
            }
          }

          // 표(Table) 렌더링: SmartDocs 모드에서는 맥킨지 스타일 굵은 상하 테두리 적용
          children.push(new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: isSmartDocs ? {
              top: { style: BorderStyle.THICK, size: 12, color: '000000' },
              bottom: { style: BorderStyle.THICK, size: 12, color: '000000' },
              left: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
              right: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
              insideHorizontal: { style: BorderStyle.SINGLE, size: 4, color: '000000' },
              insideVertical: { style: BorderStyle.SINGLE, size: 4, color: '000000' },
            } : undefined,
            rows: rawMatrix.map((r: string[], rIdx: number) => new TableRow({
              children: r.map((cText: string, cIdx: number) => {
                const isHeader = isSmartDocs && hasHeaderRow && rIdx === 0
                let cellBorders = undefined
                if (isSmartDocs && rIdx === 0 && cIdx === 0 && (cText.trim() === '' || cText.includes('/'))) {
                  cellBorders = { diagonalDown: { style: BorderStyle.SINGLE, size: 4, color: '000000' } }
                }
                return new TableCell({
                  shading: isHeader ? { fill: 'F2F2F2' } : undefined,
                  borders: cellBorders,
                  margins: isSmartDocs ? { top: 60, bottom: 60, left: 150, right: 150 } : undefined,
                  children: [new Paragraph({
                    children: emphasisHelper(cText, { bold: isHeader, size: isSmartDocs ? 28 : undefined }),
                    alignment: isHeader ? AlignmentType.CENTER : (isSmartDocs ? (colAlignments[cIdx] ?? AlignmentType.CENTER) : AlignmentType.LEFT),
                    spacing: { before: 80, after: 80, line: isSmartDocs ? 384 : undefined }
                  })]
                })
              })
            }))
          }))

          // SmartDocs 모드: 표 데이터에서 차트 자동 생성 (Heuristic Chart Engine)
          if (isSmartDocsMode) {
            const chartData = extractChartDataFromMatrix(rawMatrix, hasHeaderRow)
            if (chartData) {
              chartsToInject.push(chartData)
              children.push(new Paragraph({
                children: [new TextRun(`[[CHART_INJECT_${chartData.id}]]`)],
                spacing: { before: 120, after: 240 }
              }))
              currentTwipsY += 4000 // 차트 높이 예약 (약 7cm)
            }
          }

          children.push(new Paragraph({ text: '', spacing: { after: 120 } }))
          currentTwipsY += heightHelper(block)
          if (currentTwipsY >= MAX_AVAILABLE_Y) currentTwipsY = currentTwipsY % MAX_AVAILABLE_Y
        }

      } else if (block.type === 'excel') {
        // Excel 블록: 간단한 표 형태로 DOCX에 삽입
        const excelDataRaw = block.props?.data || '[]'
        try {
          const sheets = typeof excelDataRaw === 'string' ? parseAmevaBlockData(excelDataRaw) : excelDataRaw
          const sheetArr = Array.isArray(sheets) ? sheets : [sheets]
          for (const sheet of sheetArr) {
            if (sheet.data && Array.isArray(sheet.data)) {
              const matrix = sheet.data.filter((r: any[]) => Array.isArray(r))
              if (matrix.length === 0) continue
              children.push(new Paragraph({ text: `[Excel] ${sheet.name || 'Sheet'}`, heading: HeadingLevel.HEADING_4, spacing: { before: 240, after: 120 } }))
              children.push(new Table({
                width: { size: 100, type: WidthType.PERCENTAGE },
                rows: matrix.map((r: any[]) => new TableRow({
                  children: r.map((c: any) => new TableCell({
                    children: [new Paragraph({ text: c?.m || c?.v || '' })]
                  }))
                }))
              }))
              children.push(new Paragraph({ text: '', spacing: { after: 120 } }))
            }
          }
        } catch (e) {
          console.error('[exportDocx] Excel 블록 파싱 실패:', e)
        }

      } else {
        // 지원되지 않는 블록: 폴백 텍스트로 표시
        children.push(new Paragraph({ text: `[지원되지 않는 블록: ${block.type}]`, spacing: { after: 120 } }))
      }
    }

    closeList()

    // SmartDocs 모드: Heading이 하나라도 있으면 목차(TOC) 자동 삽입
    if (isSmartDocsMode && children.some((c: any) => c.options?.heading !== undefined)) {
      children.unshift(new Paragraph({ pageBreakBefore: true, children: [] }))
      children.unshift(new TableOfContents('목 차', { hyperlink: true, headingStyleRange: '1-5' }))
      children.unshift(new Paragraph({
        children: [new TextRun({ text: '- 목 차 -', size: 32, bold: true })],
        alignment: AlignmentType.CENTER,
        spacing: { after: 360 }
      }))
    }

    // ══════════════════════════════════════════════════════════════
    // Document 생성: 메타데이터 압인 + 스타일 + 섹션
    // ══════════════════════════════════════════════════════════════

    const doc = new Document({
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: Document 메타데이터 필드
       * - 시나리오: Phase 10 구현 - 워드 파일 속성(우클릭 → 속성 → 자세히)에 AMEVA 정보를 압인한다.
       *             customProperties에는 숨겨진 추적 코드가 삽입되어 문서 출처를 증명한다.
       */
      creator: 'AMEVA Workstation',
      lastModifiedBy: 'AMEVA Document Engine',
      title: 'AMEVA 공식 문서',
      subject: 'AMEVA 워크스테이션 자동 생성',
      company: 'AMEVA 기조실',
      customProperties: [
        { name: 'AMEVA-Tracker-ID', value: `DOC-${new Date().getTime()}-${Math.floor(Math.random() * 10000)}` },
        { name: 'Generated-At', value: new Date().toISOString() },
        { name: 'Security-Level', value: 'Confidential' }
      ],
      features: isSmartDocsMode ? { updateFields: true } : undefined,
      styles: isSmartDocsMode ? {
        paragraphStyles: [
          { id: 'TOC1', name: 'toc 1', basedOn: 'Normal', next: 'Normal', run: { size: 30, bold: true }, paragraph: { spacing: { before: 120, after: 120 } } },
          { id: 'TOC2', name: 'toc 2', basedOn: 'Normal', next: 'Normal', run: { size: 28 }, paragraph: { indent: { left: 240 }, spacing: { before: 80, after: 80 } } },
          { id: 'TOC3', name: 'toc 3', basedOn: 'Normal', next: 'Normal', run: { size: 26 }, paragraph: { indent: { left: 480 }, spacing: { before: 60, after: 60 } } },
          { id: 'TOC4', name: 'toc 4', basedOn: 'Normal', next: 'Normal', run: { size: 24 }, paragraph: { indent: { left: 720 }, spacing: { before: 40, after: 40 } } },
          { id: 'TOC5', name: 'toc 5', basedOn: 'Normal', next: 'Normal', run: { size: 22 }, paragraph: { indent: { left: 960 }, spacing: { before: 40, after: 40 } } }
        ]
      } : undefined,
      sections: [{
        properties: {
          page: isSmartDocsMode ? {
            margin: { top: 1700, bottom: 850, left: 1134, right: 850 } // 30mm / 15mm / 20mm / 15mm
          } : undefined
        },
        children
      }]
    })

    /*
     * [RUN-TIME STATE / INVARIANT]
     * - 변수 명: `docBlob`
     * - 자료형: Blob
     * - 시나리오: docx의 Packer.toBlob으로 Document 객체를 DOCX Blob으로 직렬화한다.
     *             SmartDocs 모드이고 차트가 있으면 injectNativeCharts로 네이티브 차트를 주입한다.
     */
    const docBlob = await Packer.toBlob(doc)
    if (isSmartDocsMode && chartsToInject.length > 0) {
      return await injectNativeCharts(docBlob, chartsToInject)
    }
    return docBlob

  } catch (err) {
    console.error('[exportDocx] Word 내보내기 실패, HTML로 폴백:', err)
    const html = await blocksToHTML(rawBlocks)
    return new Blob([html], { type: 'application/msword' })
  }
}
