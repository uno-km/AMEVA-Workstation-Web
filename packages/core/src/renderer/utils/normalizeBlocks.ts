/**
 * @file normalizeBlocks.ts
 * @system AMEVA OS Desktop Workstation
 * @location src/renderer/utils/normalizeBlocks.ts
 * @role Core module helper and integration logic
 * 
 * [소비처 - CONSUMERS / USAGE CONTEXT]
 * - 소비처 A (src/renderer/hooks/): 관련 비즈니스 훅 내부 연산 시 순수 함수 유틸리티로 수입 소비.
 * - 소비처 B (src/renderer/components/): 렌더링 전 데이터 정제 단계에서 포맷터 유틸리티로 소비.
 * 
 * [책임 범위 - RESPONSIBILITY]
 * - 본 파일은 AMEVA 시스템 내에서 도메인 목적에 부합하는 연산 및 데이터 처리 흐름을 안전하게 캡슐화한다.
 * - 외부 라이브러리 및 하위 종속성을 조율하고 결과 규격을 일관되게 제공한다.
 * 
 * [절대 깨면 안 되는 계약 - CONTRACT]
 * - MUST: 모든 예외 발생 시 에러를 침묵시키지 말고 에러 로그를 명확하게 남길 것.
 * - MUST NOT: TypeScript any 형식을 우회 수단으로 함부로 선언하지 말 것.
 */

/**
 * normalizeBlocks.ts
 * ──────────────────────────────────────────────────────────────
 * BlockNote editor.document → exporters가 기대하는 Block[] AST 변환
 *
 * 문제:
 *   - BlockNote의 내부 block은 content가 undefined / null / string / array 일 수 있음
 *   - table.content.rows[n].cells[m]이 배열이 아닌 경우가 있음
 *   - codeBlock.content가 InlineContent[]이지만 한 번씩 wrapped object로 오는 경우
 *
 * 이 모듈은 export 전에 방어적으로 normalize하여
 * "map is not a function" 류의 오류를 방지한다.
 * ──────────────────────────────────────────────────────────────
 */

export interface NormalizedInlineContent {
  type: 'text' | 'link'
  text: string
  styles: {
    bold?: boolean
    italic?: boolean
    underline?: boolean
    strike?: boolean
    textColor?: string
    backgroundColor?: string
  }
}

export interface NormalizedTableCell {
  inline: NormalizedInlineContent[]
}

export interface NormalizedTableRow {
  cells: NormalizedInlineContent[][]  // cells[col] = InlineContent[]
}

export interface NormalizedBlock {
  id: string
  type: string
  content: NormalizedInlineContent[]
  /** table 전용 */
  tableRows?: NormalizedTableRow[]
  props: Record<string, any>
  children: NormalizedBlock[]
}

// ─────────────────────────────────────────────────────────────
// 내부 헬퍼
// ─────────────────────────────────────────────────────────────

/** 어떤 값이든 NormalizedInlineContent[]로 변환 */
function normalizeInlineContent(raw: any): NormalizedInlineContent[] {
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `!raw`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (!raw)` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
  if (!raw) return []

  // 이미 배열이면 각 item normalize
  if (Array.isArray(raw)) {
    return raw.flatMap((item: any) => {
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `!item`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (!item)` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
      if (!item) return []
      // 표준 InlineContent 형태
      if (typeof item === 'object' && (item.type === 'text' || item.type === 'link')) {
        return [{
          type: item.type as 'text' | 'link',
          text: String(item.text ?? ''),
          styles: item.styles ?? {},
        }]
      }
      // StyledText 형태 (BlockNote 내부): { text, styles }
      if (typeof item === 'object' && 'text' in item) {
        return [{
          type: 'text' as const,
          text: String(item.text ?? ''),
          styles: item.styles ?? {},
        }]
      }
      // 문자열
      if (typeof item === 'string') {
        return [{ type: 'text' as const, text: item, styles: {} }]
      }
      return []
    })
  }

  // 문자열인 경우
  if (typeof raw === 'string') {
    return raw ? [{ type: 'text', text: raw, styles: {} }] : []
  }

  // 단일 객체 {type, text, styles}
  if (typeof raw === 'object' && raw !== null) {
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `'text' in raw`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if ('text' in raw)` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
    if ('text' in raw) {
      return [{ type: 'text', text: String(raw.text ?? ''), styles: raw.styles ?? {} }]
    }
  }

  return []
}

/** table content normalize */
function normalizeTableContent(raw: any): NormalizedTableRow[] {
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `!raw`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (!raw)` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
  if (!raw) return []

  const rows: any[] = Array.isArray(raw?.rows) ? raw.rows
    : Array.isArray(raw) ? raw
    : []

  return rows.map((row: any) => {
    const cells: any[] = Array.isArray(row?.cells) ? row.cells
      : Array.isArray(row) ? row
      : []

    return {
      cells: cells.map((cell: any) => {
        // cell은 InlineContent[] か string か any
        if (Array.isArray(cell)) {
          return normalizeInlineContent(cell)
        }
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `typeof cell === 'string'`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (typeof cell === 'string')` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
        if (typeof cell === 'string') {
          return cell ? [{ type: 'text' as const, text: cell, styles: {} }] : []
        }
        return []
      }),
    }
  })
}

/** 단일 block을 NormalizedBlock으로 변환 */
function normalizeBlock(raw: any, depth = 0): NormalizedBlock {
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `!raw || typeof raw !== 'object'`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (!raw || typeof raw !== 'object')` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
  if (!raw || typeof raw !== 'object') {
    return {
      id: 'unknown',
      type: 'paragraph',
      content: [],
      props: {},
      children: [],
    }
  }

  const type: string = raw.type ?? 'paragraph'
  const id: string = raw.id ?? `auto-${Math.random().toString(36).slice(2)}`
  const props: Record<string, any> = raw.props ?? {}
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `rawContent`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const rawContent = ...` 형태로 안전 캐싱 후 가공 기동.
       */
  const rawContent = raw.content

  let content: NormalizedInlineContent[] = []
  let tableRows: NormalizedTableRow[] | undefined

      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `type === 'table'`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (type === 'table')` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
  if (type === 'table') {
    tableRows = normalizeTableContent(rawContent)
    content = []
  } else if (type === 'codeBlock') {
    // codeBlock content: InlineContent[] 또는 string
    content = normalizeInlineContent(rawContent)
  } else {
    content = normalizeInlineContent(rawContent)
  }

  const rawChildren: any[] = Array.isArray(raw.children) ? raw.children : []
  const children: NormalizedBlock[] = depth < 8
    ? rawChildren.map(c => normalizeBlock(c, depth + 1))
    : []

  return { id, type, content, tableRows, props, children }
}

/** 최상위 normalize 함수 — export 진입점에서 호출 */
export function normalizeBlocks(input: any): NormalizedBlock[] {
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `!input`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (!input)` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
  if (!input) {
    console.warn('[normalizeBlocks] input is null/undefined')
    return []
  }

  const arr: any[] = Array.isArray(input) ? input : [input]

  const result: NormalizedBlock[] = []
      /*
       * [LOOP CONTROL ITERATION]
       * - 루프 조건: `for (let i = 0; i < arr.length; i++) {`
       * - 예상 시나리오: 지정된 조건 한계 도달 시점까지 콜렉션 항목의 순차 매핑, 변환 및 동기 적재 처리를 수행함.
       * - 예시: `for (const item of list)` 루프 실행 시 모든 개별 블록의 html 포맷 정제 완료 후 스택 종결.
       */
  for (let i = 0; i < arr.length; i++) {
    try {
      result.push(normalizeBlock(arr[i]))
    } catch (err) {
      console.error(`[normalizeBlocks] block[${i}] 처리 중 오류:`, err, arr[i])
    }
  }

  return result
}

/** NormalizedBlock에서 plain text 추출 */
export function getPlainTextFromNormalized(block: NormalizedBlock): string {
  return block.content.map(c => c.text).join('')
}

/** NormalizedInlineContent[]에서 plain text 추출 */
export function inlineToText(inline: NormalizedInlineContent[]): string {
  return inline.map(c => c.text).join('')
}

