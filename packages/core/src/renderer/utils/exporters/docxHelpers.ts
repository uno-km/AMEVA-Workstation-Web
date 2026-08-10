/**
 * @file docxHelpers.ts
 * @system AMEVA Workstation
 * @location src/renderer/utils/exporters/docxHelpers.ts
 * @role DOCX 내보내기 전용 순수 함수 헬퍼 모듈
 *
 * [소비처 - CONSUMERS / USAGE CONTEXT]
 * - 소비처 A (exporters/exportDocx.ts): exportToWord 함수가 SmartDocs 조판 연산에서 이 모듈의 모든 헬퍼를 사용한다.
 *
 * [책임 범위 - RESPONSIBILITY]
 * - 텍스트의 Twips 단위 줄바꿈 예측 (calculateWrappedLines)
 * - 블록별 물리 높이 추정 (estimateBlockHeight) - 고아 단락 방지를 위한 Lookahead 엔진 핵심
 * - 텍스트 강조 구문 파싱 및 TextRun 배열 생성 (parseTextWithEmphasis)
 * - 날짜/공백 등 텍스트 전처리 (cleanUpText)
 * - AMEVA 블록 데이터(JSON with header comment) 파싱 (parseAmevaBlockData)
 *
 * [절대 깨면 안 되는 계약 - CONTRACT]
 * - MUST: 이 파일의 모든 함수는 외부 상태(DOM, 전역 변수)에 의존하지 않는 순수 함수여야 한다.
 * - MUST: estimateBlockHeight는 isSmartDocsMode 플래그와 extractChartDataFromMatrix를 참조하므로 인자로 주입받는다.
 * - MUST NOT: docx 라이브러리를 이 파일에서 직접 import하지 않는다. TextRun은 인자로 받은 생성자 함수를 사용한다.
 */

import type { NormalizedBlock } from '../normalizeBlocks';
import { inlineToText, getPlainTextFromNormalized } from '../normalizeBlocks';
import { extractChartDataFromMatrix } from '../chartHeuristics';

/**
 * [FUNCTION CONTRACT]
 * - 함수 명: `parseAmevaBlockData`
 * - 역할: AMEVA 커스텀 블록의 raw 데이터 필드를 파싱한다.
 *         커스텀 블록의 data prop에는 `// [BlockType]\n{JSON}` 형태의 헤더 주석이 붙을 수 있으므로 제거 후 JSON.parse를 시도한다.
 * - 폴백: 파싱 실패 시 빈 객체 `{}`를 반환하여 하위 로직이 graceful하게 처리할 수 있도록 한다.
 * @param raw - 파싱할 raw 데이터 (string | any)
 * @returns 파싱된 객체 또는 빈 객체
 */
export function parseAmevaBlockData(raw: any): any {
  /*
   * [ALGORITHM BRANCH / DECISION]
   * - 조건 식: `typeof raw !== 'string'`
   * - 만족 시: 이미 파싱된 객체이므로 그대로 반환한다.
   * - 불만족 시: 문자열이므로 헤더 제거 후 JSON.parse를 시도한다.
   */
  if (typeof raw !== 'string') return raw;

  /*
   * [RUN-TIME STATE / INVARIANT]
   * - 변수 명: `cleaned`
   * - 자료형: string
   * - 시나리오: `// [BlockType]` 형태의 헤더 주석을 제거하고 순수 JSON 문자열만 추출한다.
   */
  const cleaned = raw.replace(/^\/\/\s*\[.*?\]\s*/, '').trim();
  if (!cleaned) return {};
  try {
    return JSON.parse(cleaned);
  } catch (e) {
    return {};
  }
}

/**
 * [FUNCTION CONTRACT]
 * - 함수 명: `cleanUpText`
 * - 역할: 텍스트 전처리 함수. 불필요한 다중 공백을 정리하고, 날짜 형식(2024.1.1 → 2024. 1. 1.)을 한국 관공서 표준 포맷으로 통일한다.
 * @param raw - 전처리할 원본 문자열
 * @returns 정제된 문자열
 */
export function cleanUpText(raw: string): string {
  /*
   * [RUN-TIME STATE / INVARIANT]
   * - 변수 명: `t`
   * - 자료형: string
   * - 시나리오: 연속된 공백(2개 이상)을 단일 공백으로 치환하여 조판 시 여백 오류를 방지한다.
   */
  let t = raw.replace(/\s{2,}/g, ' ');

  /*
   * [RUN-TIME STATE / INVARIANT]
   * - 변수 명: `t` (재할당)
   * - 시나리오: 날짜 구분자(`.`, `-`, `/`)를 한국 표준(`. `)으로 통일한다.
   *             예: 2024.1.1 → 2024. 1. 1. | 2024/01/01 → 2024. 01. 01.
   */
  t = t.replace(/(\d{2,4})[\.\-\/]\s*(\d{1,2})[\.\-\/]\s*(\d{1,2})[\.\-\/]?/g, '$1. $2. $3.');
  return t;
}

/**
 * [FUNCTION CONTRACT]
 * - 함수 명: `calculateWrappedLines`
 * - 역할: 주어진 텍스트가 DOCX 지면(기본 9921 Twips 폭)에서 몇 줄로 줄바꿈되는지 예측한다.
 *         한글/한자/전각문자는 full-width(0.95배), 영문 대문자/숫자/특수기호는 thick half-width(0.6배),
 *         얇은 문자/공백/구두점은 thin half-width(0.35배)로 가중치를 달리하여 실제 줄바꿈 지점을 추정한다.
 *         이 예측 결과는 estimateBlockHeight → Keep-with-next(고아 단락 방지) 로직에 사용된다.
 * @param text - 줄 수를 예측할 텍스트
 * @param fontSize - 폰트 크기 (half-points 단위, 예: 15pt = 30)
 * @param availableWidth - 사용 가능한 행 너비 (Twips 단위, 기본: 9921 Twips ≈ 175mm)
 * @returns 예측 줄 수 (최소 1)
 */
export function calculateWrappedLines(text: string, fontSize: number, availableWidth: number = 9921): number {
  /*
   * [RUN-TIME STATE / INVARIANT]
   * - 변수 명: `totalTwips`
   * - 자료형: number
   * - 시나리오: 텍스트의 모든 문자를 순회하며 각 문자의 예상 너비(Twips)를 누산한다.
   *             최종적으로 availableWidth로 나누면 예상 줄 수가 된다.
   */
  let totalTwips = 0;

  for (const char of text) {
    /*
     * [ALGORITHM BRANCH / DECISION]
     * - 분기 1: 한글/한자/전각문자/전각기호 → Full-width (0.95배)
     * - 분기 2: 영문 대문자/숫자/굵은 특수기호(#, *, +, -, =, @, ~, _) → Thick Half-width (0.6배)
     * - 분기 3: 얇은 영문자(i, l, I)/구두점/공백 → Thin Half-width (0.35배)
     * - 분기 4 (기본): 나머지 영문 소문자 등 → 일반 Half-width (0.5배)
     */
    if (/[가-힣\u4E00-\u9FFF\u3040-\u30FF\uFF00-\uFFEF■□○ㆍ※]/.test(char)) {
      totalTwips += fontSize * 20 * 0.95; // Full-width
    } else if (/[A-Z0-9\+\-\=\#\*\@\~\_]/.test(char)) {
      totalTwips += fontSize * 20 * 0.6;  // Thick half-width
    } else if (/[ilI\(\)\[\]\{\}!'`\s\,\.\;\:\/]/.test(char)) {
      totalTwips += fontSize * 20 * 0.35; // Thin half-width
    } else {
      totalTwips += fontSize * 20 * 0.5;  // Standard half-width
    }
  }

  /*
   * [RUN-TIME STATE / INVARIANT]
   * - 변수 명: `newLines`
   * - 자료형: number
   * - 시나리오: 텍스트 내에 명시적인 개행 문자(\n)가 있는 경우 해당 줄 수를 추가로 더한다.
   */
  const newLines = (text.match(/\n/g) || []).length;
  return Math.ceil(totalTwips / availableWidth) + newLines;
}

/**
 * [FUNCTION CONTRACT]
 * - 함수 명: `estimateBlockHeight`
 * - 역할: 주어진 블록이 DOCX 페이지에서 차지할 예상 높이(Twips)를 추정한다.
 *         이 함수는 Keep-with-next(고아 단락 방지) Lookahead 엔진의 핵심이다.
 *         현재 블록(주로 Heading)을 렌더링하기 전에 다음 블록의 예상 높이를 미리 계산하여,
 *         현재 페이지에 heading + 다음 블록이 함께 들어갈 수 있는지를 판단하는 데 사용된다.
 * @param b - 높이를 추정할 NormalizedBlock 객체
 * @param isSmartDocsMode - SmartDocs 모드 여부 (true일 때 행간 1.6배, 들여쓰기 등 추가 고려)
 * @returns 예상 높이 (Twips 단위)
 */
export function estimateBlockHeight(b: NormalizedBlock | undefined, isSmartDocsMode: boolean): number {
  /*
   * [ALGORITHM BRANCH / DECISION]
   * - 조건 식: `!b`
   * - 만족 시: 다음 블록이 없음(마지막 블록이거나 undefined). 0을 반환하여 Lookahead 패널티 없음.
   */
  if (!b) return 0;

  /*
   * [RUN-TIME STATE / INVARIANT]
   * - 변수 명: `text`
   * - 자료형: string
   * - 시나리오: 블록의 모든 인라인 콘텐츠를 평문(plain text)으로 추출한다.
   *             이는 calculateWrappedLines에 전달되어 줄 수 예측에 사용된다.
   */
  const text = getPlainTextFromNormalized(b);
  const trimmed = text.trim();

  if (b.type === 'heading') {
    /*
     * [RUN-TIME STATE / INVARIANT]
     * - 변수 명: `level`, `hSize`
     * - 시나리오: 헤딩 레벨(1~5)에 따라 SmartDocs 모드의 폰트 크기(half-points)를 결정한다.
     *             붙임/별첨 키워드가 있으면 항상 32 (16pt) 크기로 오버라이드된다.
     */
    const level = b.props?.level || 1;
    let hSize = 30;
    if (isSmartDocsMode) {
      if (level === 1) hSize = 44;
      else if (level === 2) hSize = 32;
      else if (level === 3) hSize = 30;
      else if (level === 4) hSize = 28;
      else hSize = 26;
      if (/^(\[|※\s*)?(붙임|별첨)[\s:\]\d]*/.test(trimmed)) hSize = 32;
    }
    const lines = calculateWrappedLines(trimmed, hSize / 2);
    return (lines * (hSize / 2) * 20 * 1.6) + (isSmartDocsMode ? 360 : 240) + 120;

  } else if (b.type === 'paragraph') {
    /*
     * [ALGORITHM BRANCH / DECISION]
     * - 조건 식: `!trimmed`
     * - 만족 시: 빈 단락. SmartDocs 모드에서는 공백 단락도 행간(384 Twips)을 차지한다.
     */
    if (!trimmed) return isSmartDocsMode ? 384 + 120 : 120;

    /*
     * [RUN-TIME STATE / INVARIANT]
     * - 변수 명: `textSize`
     * - 시나리오: 단락의 유형(붙임/별첨, 참조, 날짜, 일반)에 따라 폰트 크기를 결정한다.
     */
    let textSize = 20;
    if (isSmartDocsMode) {
      if (/^(\[|※\s*)?(붙임|별첨)[\s:\]\d]*/.test(trimmed)) textSize = 32;
      else if (/^[\s]*[※\*]\s*(.*)$/.test(text)) textSize = 26;
      else if (/^[~\-\s]*\d{4}\.\s*\d{1,2}\.\s*(\d{1,2}\.)?[\s]*$/.test(trimmed)) textSize = 32;
      else textSize = 30;
    }
    const lines = calculateWrappedLines(trimmed, textSize / 2);
    return (lines * (textSize / 2) * 20 * (isSmartDocsMode ? 1.6 : 1.0)) + 120;

  } else if (b.type === 'table' || b.type === 'smartDocsTable') {
    /*
     * [RUN-TIME STATE / INVARIANT]
     * - 변수 명: `rows`, `totalHeight`
     * - 시나리오: 표의 각 행에서 가장 긴 셀 내용의 줄 수를 기준으로 행 높이를 합산한다.
     *             SmartDocs 모드에서 차트가 자동 생성되는 경우 차트 공간(4000 Twips ≈ 7cm)도 추가 누산한다.
     */
    const rows = b.content?.rows || (b as any).tableRows || [];
    let totalHeight = 0;
    rows.forEach((r: any) => {
      const cells = (Array.isArray(r) || Array.isArray(r?.cells)) ? (r.cells || r) : [];
      let maxLines = 1;
      cells.forEach((c: any) => {
        let cellText = '';
        if (Array.isArray(c)) cellText = inlineToText(c);
        else if (c && Array.isArray(c.content)) cellText = inlineToText(c.content);
        else if (c && typeof c.content === 'string') cellText = c.content;
        else if (typeof c === 'string') cellText = c;
        
        const lines = calculateWrappedLines(cellText, 14);
        if (lines > maxLines) maxLines = lines;
      });
      totalHeight += (maxLines * 14 * 20 * 1.6) + 120;
    });
    if (isSmartDocsMode) {
      const rawMatrix = rows.map((r: any) => {
        const cells = (Array.isArray(r) || Array.isArray(r?.cells)) ? (r.cells || r) : [];
        return cells.map((c: any) => {
          if (Array.isArray(c)) return inlineToText(c);
          if (c && Array.isArray(c.content)) return inlineToText(c.content);
          if (c && typeof c.content === 'string') return c.content;
          if (typeof c === 'string') return c;
          return '';
        });
      });
      const cData = extractChartDataFromMatrix(rawMatrix, true);
      if (cData) totalHeight += 4000; // 차트 삽입 예상 높이 (약 7cm)
    }
    return totalHeight + 240;
  }

  /*
   * [RETURN VALUE]
   * - 설명: 위 케이스에 해당하지 않는 블록 타입(image, bulletListItem 등)에 대한 안전 폴백값.
   *         실제 높이보다 약간 작게 잡혀 있으므로 고아 단락이 발생하기보다는 여백이 생기는 방향으로 동작한다.
   */
  return 400;
}

/**
 * [FUNCTION CONTRACT]
 * - 함수 명: `parseTextWithEmphasis`
 * - 역할: 원문 텍스트에서 인용부호('', ""), 대괄호([]) 내용을 강조(Bold) TextRun으로 분리하여 docx TextRun 배열을 생성한다.
 *         SmartDocs 모드에서만 강조 파싱이 활성화되며, 일반 모드에서는 단순 TextRun 하나를 반환한다.
 * @param rawText - 파싱할 원본 텍스트
 * @param baseOptions - TextRun에 적용할 기본 옵션 (size, bold, color 등)
 * @param TextRunClass - docx 라이브러리의 TextRun 클래스 (의존성 주입)
 * @param isSmartDocsMode - SmartDocs 모드 여부
 * @returns TextRun 인스턴스 배열
 */
export function parseTextWithEmphasis(
  rawText: string,
  baseOptions: Record<string, any> = {},
  TextRunClass: any,
  isSmartDocsMode: boolean
): any[] {
  /*
   * [ALGORITHM BRANCH / DECISION]
   * - 조건 식: `!isSmartDocsMode`
   * - 만족 시: 일반 모드. 강조 파싱 없이 단순 TextRun 배열(1개)을 반환한다.
   */
  if (!isSmartDocsMode) return [new TextRunClass({ text: rawText, ...baseOptions })];

  /*
   * [RUN-TIME STATE / INVARIANT]
   * - 변수 명: `text`
   * - 자료형: string
   * - 시나리오: cleanUpText를 적용하여 날짜 포맷 통일 및 다중 공백 제거 후 파싱을 시작한다.
   */
  const text = cleanUpText(rawText);

  /*
   * [RUN-TIME STATE / INVARIANT]
   * - 변수 명: `runs`
   * - 자료형: any[]
   * - 시나리오: 강조 구간과 일반 구간을 분리한 TextRun 배열을 누산한다.
   */
  const runs: any[] = [];

  /*
   * [RUN-TIME STATE / INVARIANT]
   * - 변수 명: `regex`
   * - 시나리오: 단일 인용부호, 이중 인용부호, 대괄호로 감싸인 텍스트를 찾는 패턴.
   *             예: '기안머신', "보고서", [붙임1]
   */
  const regex = /(['"]\[)(.*?)(\1|\])/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    /*
     * [ALGORITHM BRANCH / DECISION]
     * - 조건 식: `match.index > lastIndex`
     * - 만족 시: 강조 구간 이전의 일반 텍스트가 있으면 먼저 일반 TextRun으로 추가한다.
     */
    if (match.index > lastIndex) {
      runs.push(new TextRunClass({ text: text.substring(lastIndex, match.index), ...baseOptions }));
    }
    // 강조 구간: bold: true 오버라이드
    runs.push(new TextRunClass({ text: match[0], ...baseOptions, bold: true }));
    lastIndex = regex.lastIndex;
  }

  /*
   * [ALGORITHM BRANCH / DECISION]
   * - 조건 식: `lastIndex < text.length`
   * - 만족 시: 마지막 강조 구간 이후 남은 일반 텍스트를 마지막 TextRun으로 추가한다.
   */
  if (lastIndex < text.length) {
    runs.push(new TextRunClass({ text: text.substring(lastIndex), ...baseOptions }));
  }

  return runs.length > 0 ? runs : [new TextRunClass({ text: rawText, ...baseOptions })];
}
