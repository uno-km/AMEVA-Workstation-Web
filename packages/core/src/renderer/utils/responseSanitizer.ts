/**
 * @file responseSanitizer.ts
 * @system AMEVA OS Desktop Workstation
 * @location src/renderer/utils/responseSanitizer.ts
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
 * responseSanitizer.ts
 *
 * Strips internal LLM reasoning tags from model output.
 *
 * Tags handled (case-insensitive, including typo variant):
 *   <thought>  <though>  <think>  <thinking>  <reasoning>
 *   and their respective closing variants.
 *
 * Rules:
 * 1. Content INSIDE tags  → thinkingContent  (reasoning trace)
 * 2. Content OUTSIDE tags → finalContent     (shown to user)
 * 3. Streaming: buffer partial/incomplete tags so they never leak to output
 * 4. Code blocks (``` … ```) are treated as opaque — tags inside are NOT stripped
 * 5. Unclosed tag: content after opening tag counts as thinkingContent
 * 6. Normal markdown, HTML entities, and user HTML are left completely intact
 */

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/**
 * All recognised tag names (order matters — longer names before shorter
 * prefixes so that the prefix-detection regex stays unambiguous).
 */
const TAG_NAMES = ['thinking', 'reasoning', 'thought', 'though', 'think'] as const
type TagName = (typeof TAG_NAMES)[number]

/**
 * Regex that matches a complete opening or closing tag for any of the
 * recognised names (case-insensitive).
 *
 * Capture groups:
 *   [1] full match
 *   [2] tag name
 */
const COMPLETE_TAG_RE = /(<\/?(thinking|reasoning|thought|though|think)\s*>)/gi

/**
 * Maximum length of a partial tag that we need to buffer during streaming.
 * e.g. '</thinking>' is 11 chars; add a few for whitespace safety.
 */
const MAX_PARTIAL_TAG_LEN = 14

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Returns true when `name` is one of the recognised tag names */
function isKnownTag(name: string): name is TagName {
  return (TAG_NAMES as readonly string[]).includes(name.toLowerCase())
}

// ---------------------------------------------------------------------------
// Code-block span extraction
// ---------------------------------------------------------------------------

/**
 * Returns an array of [start, end) index pairs for every fenced code block
 * (``` ... ```) present in `text`.  Content inside these spans is considered
 * opaque and must not be altered.
 */
function getCodeBlockSpans(text: string): Array<[number, number]> {
  const spans: Array<[number, number]> = []
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `fence`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const fence = ...` 형태로 안전 캐싱 후 가공 기동.
       */
  const fence = /```[^\n]*\n[\s\S]*?```/g
  let m: RegExpExecArray | null
      /*
       * [LOOP CONTROL ITERATION]
       * - 루프 조건: `while ((m = fence.exec(text)) !== null) {`
       * - 예상 시나리오: 지정된 조건 한계 도달 시점까지 콜렉션 항목의 순차 매핑, 변환 및 동기 적재 처리를 수행함.
       * - 예시: `for (const item of list)` 루프 실행 시 모든 개별 블록의 html 포맷 정제 완료 후 스택 종결.
       */
  while ((m = fence.exec(text)) !== null) {
    spans.push([m.index, m.index + m[0].length])
  }
  return spans
}

/** Returns true when position `idx` falls inside any of the code-block spans */
function inCodeBlock(idx: number, spans: Array<[number, number]>): boolean {
      /*
       * [LOOP CONTROL ITERATION]
       * - 루프 조건: `for (const [s, e] of spans) {`
       * - 예상 시나리오: 지정된 조건 한계 도달 시점까지 콜렉션 항목의 순차 매핑, 변환 및 동기 적재 처리를 수행함.
       * - 예시: `for (const item of list)` 루프 실행 시 모든 개별 블록의 html 포맷 정제 완료 후 스택 종결.
       */
  for (const [s, e] of spans) {
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `idx >= s && idx < e`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (idx >= s && idx < e)` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
    if (idx >= s && idx < e) return true
  }
  return false
}

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export interface SanitizeResult {
  /** Clean text with all internal reasoning tags and their content removed */
  finalContent: string
  /** Text that was inside the reasoning tags (may be empty) */
  thinkingContent: string
  /** True if any reasoning tags were found and stripped */
  hadInternalTags: boolean
}

// ---------------------------------------------------------------------------
// sanitizeResponse — complete-string version
// ---------------------------------------------------------------------------

/**
 * Processes a complete (non-streaming) response string.
 *
 * - Extracts content inside `<thought>...</thought>` (and variants) into
 *   `thinkingContent`.
 * - Returns `finalContent` with no internal tags or their contents.
 * - Content inside fenced code blocks is left untouched.
 */
export function sanitizeResponse(raw: string): SanitizeResult {
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `codeSpans`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const codeSpans = ...` 형태로 안전 캐싱 후 가공 기동.
       */
  const codeSpans = getCodeBlockSpans(raw)

      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `finalContent`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const finalContent = ...` 형태로 안전 캐싱 후 가공 기동.
       */
  let finalContent = ''
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `thinkingContent`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const thinkingContent = ...` 형태로 안전 캐싱 후 가공 기동.
       */
  let thinkingContent = ''
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `hadInternalTags`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const hadInternalTags = ...` 형태로 안전 캐싱 후 가공 기동.
       */
  let hadInternalTags = false

      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `pos`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const pos = ...` 형태로 안전 캐싱 후 가공 기동.
       */
  let pos = 0
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `depth`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const depth = ...` 형태로 안전 캐싱 후 가공 기동.
       */
  let depth = 0
  let openTagName: string | null = null

  COMPLETE_TAG_RE.lastIndex = 0

  let match: RegExpExecArray | null
      /*
       * [LOOP CONTROL ITERATION]
       * - 루프 조건: `while ((match = COMPLETE_TAG_RE.exec(raw)) !== null) {`
       * - 예상 시나리오: 지정된 조건 한계 도달 시점까지 콜렉션 항목의 순차 매핑, 변환 및 동기 적재 처리를 수행함.
       * - 예시: `for (const item of list)` 루프 실행 시 모든 개별 블록의 html 포맷 정제 완료 후 스택 종결.
       */
  while ((match = COMPLETE_TAG_RE.exec(raw)) !== null) {
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `matchStart`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const matchStart = ...` 형태로 안전 캐싱 후 가공 기동.
       */
    const matchStart = match.index
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `matchEnd`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const matchEnd = ...` 형태로 안전 캐싱 후 가공 기동.
       */
    const matchEnd = matchStart + match[0].length
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `isClosing`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const isClosing = ...` 형태로 안전 캐싱 후 가공 기동.
       */
    const isClosing = match[0][1] === '/'
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `tagName`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const tagName = ...` 형태로 안전 캐싱 후 가공 기동.
       */
    const tagName = match[2].toLowerCase()

    // Skip tags inside code blocks
    if (inCodeBlock(matchStart, codeSpans)) {
      continue
    }

      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `!isClosing`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (!isClosing)` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
    if (!isClosing) {
      // Opening tag
      if (depth === 0) {
        finalContent += raw.slice(pos, matchStart)
        hadInternalTags = true
        openTagName = tagName
        depth = 1
        pos = matchEnd
      } else {
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `tagName === openTagName`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (tagName === openTagName)` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
        if (tagName === openTagName) depth++
        thinkingContent += raw.slice(pos, matchStart)
        pos = matchEnd
      }
    } else {
      // Closing tag
      if (depth > 0 && isKnownTag(tagName)) {
        thinkingContent += raw.slice(pos, matchStart)
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `tagName === openTagName`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (tagName === openTagName)` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
        if (tagName === openTagName) {
          depth = Math.max(0, depth - 1)
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `depth === 0`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (depth === 0)` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
          if (depth === 0) {
            openTagName = null
          }
        }
        pos = matchEnd
      }
      // Stray closing tag outside any open — leave as-is (handled by pos not advancing)
    }
  }

  // Remainder after last match
  if (depth > 0) {
    // Unclosed tag: rest goes to thinkingContent
    thinkingContent += raw.slice(pos)
  } else {
    finalContent += raw.slice(pos)
  }

  return {
    finalContent: finalContent.trimStart(),
    thinkingContent: thinkingContent.trim(),
    hadInternalTags,
  }
}

// ---------------------------------------------------------------------------
// StreamingSanitizer — chunk-by-chunk version
// ---------------------------------------------------------------------------

/**
 * Maintains state across streaming chunks so that:
 * - Partial tags that arrive split across multiple chunks are buffered and
 *   never leak to the safe output.
 * - Complete tags (and their contents) are properly classified.
 *
 * Usage:
 * ```ts
 * const sanitizer = new StreamingSanitizer()
 * for (const token of streamTokens) {
 *   sanitizer.appendChunk(token)
 *   ui.setContent(sanitizer.getSafeOutput())
 *   ui.setThinking(sanitizer.getThinkingBuffer())
 * }
 * const result = sanitizer.finalize()
 * ```
 */
export class StreamingSanitizer {
  private _rawAccum: string = ''
  private _processedUpTo: number = 0
  private _safeOutput: string = ''
  private _thinkingBuffer: string = ''
  private _inThinking: boolean = false
  private _openTagName: string | null = null
  private _depth: number = 0
  private _hadTags: boolean = false
  private _inCodeBlock: boolean = false
  private _pendingBackticks: number = 0

  constructor() {}

  /** Append a new streaming chunk and update internal state. */
  appendChunk(chunk: string): void {
    this._rawAccum += chunk
    this._process()
  }

  /**
   * Returns the text that is safe to display to the user at this point.
   * Trimmed of leading whitespace.
   */
  getSafeOutput(): string {
    return this._safeOutput.trimStart()
  }

  /** Returns the accumulated reasoning/thinking text so far. */
  getThinkingBuffer(): string {
    return this._thinkingBuffer
  }

  /**
   * Call when the stream is complete. Processes any remaining buffered
   * content and returns the final SanitizeResult.
   */
  finalize(): SanitizeResult {
    this._flush()
    return {
      finalContent: this._safeOutput.trimStart(),
      thinkingContent: this._thinkingBuffer.trim(),
      hadInternalTags: this._hadTags,
    }
  }

  // -------------------------------------------------------------------------
  // Internal processing
  // -------------------------------------------------------------------------

  private _emit(text: string): void {
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `this._inThinking`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (this._inThinking)` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
    if (this._inThinking) {
      this._thinkingBuffer += text
    } else {
      this._safeOutput += text
    }
  }

  private _flushPendingBackticks(): void {
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `this._pendingBackticks > 0`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (this._pendingBackticks > 0)` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
    if (this._pendingBackticks > 0) {
      this._emit('`'.repeat(this._pendingBackticks))
      this._pendingBackticks = 0
    }
  }

  private _process(): void {
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `raw`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const raw = ...` 형태로 안전 캐싱 후 가공 기동.
       */
    const raw = this._rawAccum
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `i`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const i = ...` 형태로 안전 캐싱 후 가공 기동.
       */
    let i = this._processedUpTo

      /*
       * [LOOP CONTROL ITERATION]
       * - 루프 조건: `while (i < raw.length) {`
       * - 예상 시나리오: 지정된 조건 한계 도달 시점까지 콜렉션 항목의 순차 매핑, 변환 및 동기 적재 처리를 수행함.
       * - 예시: `for (const item of list)` 루프 실행 시 모든 개별 블록의 html 포맷 정제 완료 후 스택 종결.
       */
    while (i < raw.length) {
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `ch`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const ch = ...` 형태로 안전 캐싱 후 가공 기동.
       */
      const ch = raw[i]

      // ------------------------------------------------------------------
      // Backtick / code-fence detection
      // ------------------------------------------------------------------
      if (ch === '`') {
        this._pendingBackticks++
        i++

      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `this._pendingBackticks === 3`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (this._pendingBackticks === 3)` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
        if (this._pendingBackticks === 3) {
          this._emit('```')
          this._pendingBackticks = 0
          this._inCodeBlock = !this._inCodeBlock
          this._processedUpTo = i
        }
        continue
      }

      // Flush pending backticks if no longer accumulating
      if (this._pendingBackticks > 0) {
        this._flushPendingBackticks()
        this._processedUpTo = i
      }

      // ------------------------------------------------------------------
      // Inside a code block: pass everything through verbatim as safe text
      // ------------------------------------------------------------------
      if (this._inCodeBlock) {
        this._safeOutput += ch
        i++
        this._processedUpTo = i
        continue
      }

      // ------------------------------------------------------------------
      // Potential tag start '<'
      // ------------------------------------------------------------------
      if (ch === '<') {
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `remaining`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const remaining = ...` 형태로 안전 캐싱 후 가공 기동.
       */
        const remaining = raw.slice(i)

        // Check for a complete known tag
        const tagMatch = /^(<\/?(thinking|reasoning|thought|though|think)\s*>)/i.exec(remaining)
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `tagMatch`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (tagMatch)` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
        if (tagMatch) {
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `fullTag`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const fullTag = ...` 형태로 안전 캐싱 후 가공 기동.
       */
          const fullTag = tagMatch[0]
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `isClosing`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const isClosing = ...` 형태로 안전 캐싱 후 가공 기동.
       */
          const isClosing = fullTag[1] === '/'
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `tagName`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const tagName = ...` 형태로 안전 캐싱 후 가공 기동.
       */
          const tagName = (tagMatch[2] ?? '').toLowerCase()
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `tagEnd`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const tagEnd = ...` 형태로 안전 캐싱 후 가공 기동.
       */
          const tagEnd = i + fullTag.length

          this._hadTags = true

      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `!isClosing`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (!isClosing)` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
          if (!isClosing) {
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `this._depth === 0`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (this._depth === 0)` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
            if (this._depth === 0) {
              this._inThinking = true
              this._openTagName = tagName
              this._depth = 1
            } else {
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `tagName === this._openTagName`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (tagName === this._openTagName)` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
              if (tagName === this._openTagName) this._depth++
              // Tag markup consumed; content between chunks already went to _emit
            }
          } else {
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `this._depth > 0 && isKnownTag(tagName)`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (this._depth > 0 && isKnownTag(tagName))` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
            if (this._depth > 0 && isKnownTag(tagName)) {
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `tagName === this._openTagName`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (tagName === this._openTagName)` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
              if (tagName === this._openTagName) {
                this._depth = Math.max(0, this._depth - 1)
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `this._depth === 0`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (this._depth === 0)` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
                if (this._depth === 0) {
                  this._inThinking = false
                  this._openTagName = null
                }
              }
            } else {
              // Stray closing tag — emit as-is
              this._emit(fullTag)
            }
          }

          i = tagEnd
          this._processedUpTo = i
          continue
        }

        // Not a complete known tag — check if it could be a partial one
        if (this._couldBePartialTag(remaining)) {
          // Stop here and wait for more data
          break
        }

        // Some other '<' — emit immediately
        this._emit(ch)
        i++
        this._processedUpTo = i
        continue
      }

      // ------------------------------------------------------------------
      // Regular character
      // ------------------------------------------------------------------
      this._emit(ch)
      i++
      this._processedUpTo = i
    }
  }

  private _flush(): void {
    this._flushPendingBackticks()

      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `raw`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const raw = ...` 형태로 안전 캐싱 후 가공 기동.
       */
    const raw = this._rawAccum
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `remaining`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const remaining = ...` 형태로 안전 캐싱 후 가공 기동.
       */
    const remaining = raw.slice(this._processedUpTo)

      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `remaining.length === 0`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (remaining.length === 0)` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
    if (remaining.length === 0) return

      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `this._inThinking`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (this._inThinking)` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
    if (this._inThinking) {
      // Inside an unclosed tag — all remaining text is thinking content
      this._thinkingBuffer += remaining
    } else {
      // Outside any tag — run the full sanitizer on the tail
      const tailResult = sanitizeResponse(remaining)
      this._safeOutput += tailResult.finalContent.trimStart()
      this._thinkingBuffer += tailResult.thinkingContent
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `tailResult.hadInternalTags`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (tailResult.hadInternalTags)` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
      if (tailResult.hadInternalTags) this._hadTags = true
    }

    this._processedUpTo = raw.length
  }

  private _couldBePartialTag(text: string): boolean {
    const prefixes: string[] = []
      /*
       * [LOOP CONTROL ITERATION]
       * - 루프 조건: `for (const name of TAG_NAMES) {`
       * - 예상 시나리오: 지정된 조건 한계 도달 시점까지 콜렉션 항목의 순차 매핑, 변환 및 동기 적재 처리를 수행함.
       * - 예시: `for (const item of list)` 루프 실행 시 모든 개별 블록의 html 포맷 정제 완료 후 스택 종결.
       */
    for (const name of TAG_NAMES) {
      /*
       * [LOOP CONTROL ITERATION]
       * - 루프 조건: `for (let len = 1; len <= name.length; len++) {`
       * - 예상 시나리오: 지정된 조건 한계 도달 시점까지 콜렉션 항목의 순차 매핑, 변환 및 동기 적재 처리를 수행함.
       * - 예시: `for (const item of list)` 루프 실행 시 모든 개별 블록의 html 포맷 정제 완료 후 스택 종결.
       */
      for (let len = 1; len <= name.length; len++) {
        prefixes.push(name.slice(0, len))
      }
    }
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `uniquePrefixes`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const uniquePrefixes = ...` 형태로 안전 캐싱 후 가공 기동.
       */
    const uniquePrefixes = Array.from(new Set(prefixes))
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `prefixPattern`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const prefixPattern = ...` 형태로 안전 캐싱 후 가공 기동.
       */
    const prefixPattern = new RegExp(
      `^<\\/?(?:${uniquePrefixes.join('|')})?$`,
      'i'
    )

      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `clean`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const clean = ...` 형태로 안전 캐싱 후 가공 기동.
       */
    const clean = text.split('>')[0]
    return prefixPattern.test(clean)
  }
}

console.debug(MAX_PARTIAL_TAG_LEN);
