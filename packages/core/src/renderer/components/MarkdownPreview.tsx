/**
 * @file MarkdownPreview.tsx
 * @system AMEVA OS Desktop Workstation
 * @location src/renderer/components/MarkdownPreview.tsx
 * @role Core module helper and integration logic
 * 
 * [소비처 - CONSUMERS / USAGE CONTEXT]
 * - 소비처 A (src/renderer/AppLayout.tsx): 레이아웃 그리드 내부 또는 플로팅 레이어 영역 내에서 그리기로 소비.
 * - 소비처 B (src/renderer/App.tsx): 전역 모달 매니저 및 뷰포트 상태 스위칭에 따라 동적 마운트되어 소비.
 * 
 * [책임 범위 - RESPONSIBILITY]
 * - 본 파일은 AMEVA 시스템 내에서 도메인 목적에 부합하는 연산 및 데이터 처리 흐름을 안전하게 캡슐화한다.
 * - 외부 라이브러리 및 하위 종속성을 조율하고 결과 규격을 일관되게 제공한다.
 * 
 * [절대 깨면 안 되는 계약 - CONTRACT]
 * - MUST: 모든 예외 발생 시 에러를 침묵시키지 말고 에러 로그를 명확하게 남길 것.
 * - MUST NOT: TypeScript any 형식을 우회 수단으로 함부로 선언하지 말 것.
 */

import { useMemo } from 'react'
import { marked } from 'marked'
import { JupyterCodeViewer } from './JupyterCodeViewer'
import { type AmevaEditor } from '../editor/amevaBlockSchema'
import { resolveLocalMediaUrl } from '../utils/markdownUtils'

// 찢어낸 마크다운 세그먼트 전용 인라인 렌더러 컴포넌트들 수입
import { InlineMermaidRenderer } from './markdown/InlineMermaidRenderer'
import { InlineLinkPreviewRenderer } from './markdown/InlineLinkPreviewRenderer'
import { InlineMapRenderer } from './markdown/InlineMapRenderer'
import { InlineKanbanRenderer } from './markdown/InlineKanbanRenderer'
import { InlineExcelRenderer } from './markdown/InlineExcelRenderer'
import { InlineYoutubeRenderer } from './markdown/InlineYoutubeRenderer'
import { InlineDrawingRenderer } from './markdown/InlineDrawingRenderer'

      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `MERMAID_PLACEHOLDER_PREFIX`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const MERMAID_PLACEHOLDER_PREFIX = ...` 형태로 안전 캐싱 후 가공 기동.
       */


const MERMAID_PLACEHOLDER_PREFIX = 'MERMAIDPLACEHOLDERINDEX'

  /*
   * [FUNCTION CONTRACT]
   * - 함수 명: `decodeHtmlEntities`
   * - 역할: 인자 정보를 검수하고 비즈니스 계약 조건에 맞춰 최종 바인딩 결과물/바이너리 버퍼를 반환함.
   * - 예시: `decodeHtmlEntities(...)` 호출 시 런타임 비동기/동기 연쇄 반응 유도.
   */
function decodeHtmlEntities(str: string): string {
  return str
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
}

  /*
   * [FUNCTION CONTRACT]
   * - 함수 명: `buildPreviewSegments`
   * - 역할: 인자 정보를 검수하고 비즈니스 계약 조건에 맞춰 최종 바인딩 결과물/바이너리 버퍼를 반환함.
   * - 예시: `buildPreviewSegments(...)` 호출 시 런타임 비동기/동기 연쇄 반응 유도.
   */
function buildPreviewSegments(markdown: string) {
  const customBlocks: { lang: string; code: string }[] = []

      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `renderer`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const renderer = ...` 형태로 안전 캐싱 후 가공 기동.
       */
  const renderer = new marked.Renderer()
  renderer.heading = function({ depth, text }) {
    // Generate an ID for the outline scroll logic
    // We strip tags and lowercase it for a simple ID, then format the anchor
    const escapedText = text.toLowerCase().replace(/[^\wㄱ-ㅎㅏ-ㅣ가-힣]+/g, '-')
    return `<h${depth} id="${escapedText}">${text}</h${depth}>`
  }
  renderer.image = function({ href, title, text }) {
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `isVideo`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const isVideo = ...` 형태로 안전 캐싱 후 가공 기동.
       */
    const isVideo = href.toLowerCase().endsWith('.mp4') || 
                    href.toLowerCase().endsWith('.webm') || 
                    href.toLowerCase().endsWith('.mov') || 
                    href.toLowerCase().endsWith('.ogg') ||
                    href.startsWith('data:video/')
    const resolvedHref = resolveLocalMediaUrl(href)
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `isVideo`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (isVideo)` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
    if (isVideo) {
      return `<video src="${resolvedHref}" controls style="max-width: 100%; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.3); margin: 8px 0;"></video>`
    }
    return `<img src="${resolvedHref}" alt="${text}" title="${title || ''}" style="max-width: 100%;" />`
  }

      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `html`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const html = ...` 형태로 안전 캐싱 후 가공 기동.
       */
  const html = marked.parse(markdown, {
    renderer,
    walkTokens(token) {
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `token.type === 'code'`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (token.type === 'code')` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
      if (token.type === 'code') {
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `lang`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const lang = ...` 형태로 안전 캐싱 후 가공 기동.
       */
        const lang = (token.lang || '').toLowerCase()
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `rawCode`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const rawCode = ...` 형태로 안전 캐싱 후 가공 기동.
       */
        const rawCode = decodeHtmlEntities(token.text)
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `idx`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const idx = ...` 형태로 안전 캐싱 후 가공 기동.
       */
        const idx = customBlocks.length
        customBlocks.push({ lang, code: rawCode })

        token.type = 'html'
        token.text = `${MERMAID_PLACEHOLDER_PREFIX}${idx}`
      }
    }
  }) as string

      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `fullHtml`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const fullHtml = ...` 형태로 안전 캐싱 후 가공 기동.
       */
  const fullHtml = html
  const segments: ({ type: 'html'; html: string } | { type: 'mermaid'; code: string } | { type: 'html-preview'; code: string } | { type: 'code-runner'; code: string; language: string })[] = []

      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `SPLIT_RE`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const SPLIT_RE = ...` 형태로 안전 캐싱 후 가공 기동.
       */
  const SPLIT_RE = new RegExp(
    `<p>\\s*${MERMAID_PLACEHOLDER_PREFIX}(\\d+)\\s*<\\/p>` +
    `|${MERMAID_PLACEHOLDER_PREFIX}(\\d+)`,
    'g'
  )

      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `lastIndex`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const lastIndex = ...` 형태로 안전 캐싱 후 가공 기동.
       */
  let lastIndex = 0
  let match: RegExpExecArray | null
  SPLIT_RE.lastIndex = 0

      /*
       * [LOOP CONTROL ITERATION]
       * - 루프 조건: `while ((match = SPLIT_RE.exec(fullHtml)) !== null) {`
       * - 예상 시나리오: 지정된 조건 한계 도달 시점까지 콜렉션 항목의 순차 매핑, 변환 및 동기 적재 처리를 수행함.
       * - 예시: `for (const item of list)` 루프 실행 시 모든 개별 블록의 html 포맷 정제 완료 후 스택 종결.
       */
  while ((match = SPLIT_RE.exec(fullHtml)) !== null) {
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `before`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const before = ...` 형태로 안전 캐싱 후 가공 기동.
       */
    const before = fullHtml.slice(lastIndex, match.index)
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `before.trim()) segments.push({ type: 'html', html: before }`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (before.trim()) segments.push({ type: 'html', html: before })` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
    if (before.trim()) segments.push({ type: 'html', html: before })

      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `idxStr`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const idxStr = ...` 형태로 안전 캐싱 후 가공 기동.
       */
    const idxStr = match[1] ?? match[2]
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `idx`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const idx = ...` 형태로 안전 캐싱 후 가공 기동.
       */
    const idx = Number(idxStr)
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `!isNaN(idx) && customBlocks[idx] !== undefined`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (!isNaN(idx) && customBlocks[idx] !== undefined)` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
    if (!isNaN(idx) && customBlocks[idx] !== undefined) {
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `block`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const block = ...` 형태로 안전 캐싱 후 가공 기동.
       */
      const block = customBlocks[idx]
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `block.lang === 'mermaid'`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (block.lang === 'mermaid')` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
      if (block.lang === 'mermaid') {
        segments.push({ type: 'mermaid', code: block.code })
      } else if (block.lang === 'html') {
        segments.push({ type: 'html-preview', code: block.code })
      } else {
        segments.push({ type: 'code-runner', code: block.code, language: block.lang })
      }
    }
    lastIndex = SPLIT_RE.lastIndex
  }

      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `remaining`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const remaining = ...` 형태로 안전 캐싱 후 가공 기동.
       */
  const remaining = fullHtml.slice(lastIndex)
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `remaining.trim()) segments.push({ type: 'html', html: remaining }`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (remaining.trim()) segments.push({ type: 'html', html: remaining })` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
  if (remaining.trim()) segments.push({ type: 'html', html: remaining })

  return segments
}

/*
 * [FUNCTION CONTRACT]
 * - 함수 명: `MarkdownPreview`
 * - 역할: 마크다운 텍스트를 파싱하여 생성된 프리뷰 세그먼트들(HTML, Mermaid, 지도, 유튜브, 링크 프리뷰)을 순차적으로 렌더링함.
 * - 예시: `MarkdownPreview({ markdown: "### Title" })` 형태로 마운트되어 React UI에 최종 문서 트리를 드로잉.
 */
export function MarkdownPreview({ markdown, editor }: { markdown: string; editor?: AmevaEditor | null }) {
  /*
   * [RUN-TIME STATE / INVARIANT]
   * - 변수 명: `segments`
   * - 자료형 / 예상 값: Array<{type: string, html?: string, code?: string, language?: string}>
   * - 시나리오: 입력받은 markdown 문자열이 변경될 때마다 buildPreviewSegments를 호출하여 내부 커스텀 블록과 일반 HTML 영역으로 파싱해 배열 캐시를 동적으로 할당함.
   * - 예시 코드: `const segments = useMemo(() => buildPreviewSegments(markdown), [markdown])`
   */
  const segments = useMemo(() => {
    try {
      const parsed = buildPreviewSegments(markdown)
      console.log(`[MarkdownPreview] Successfully parsed markdown into ${parsed.length} segments.`)
      return parsed
    } catch (err) {
      console.error('[MarkdownPreview] Failed to parse markdown segments:', err)
      return []
    }
  }, [markdown])

  return (
    <div className="markdown-preview-body" style={{ padding: '10px 0', color: 'var(--text-main)', lineHeight: '1.7' }}>
      {/* 
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `segments.length === 0`
       * - 만족 시: 렌더링할 마크다운 파싱 결과가 없는 상태이므로 콘텐츠 없음 기본 안내 안내판을 띄움.
       * - 불만족 시: 각 세그먼트 요소를 순회하며 렌더러로 인계함.
       * - 예시: `if (segments.length === 0)` 만족 시 빈 결과 표시.
       */
      segments.length === 0 && (
        <div style={{ color: 'var(--text-muted)', padding: '20px', textAlign: 'center', fontSize: '13px' }}>
          내용이 없습니다.
        </div>
      )}
      {segments.map((seg, idx) => {
        /* 
         * [ALGORITHM BRANCH / DECISION]
         * - 조건 식: `seg.type === 'mermaid'`
         * - 만족 시: 마크다운 코드블록 중 mermaid 다이어그램에 해당하므로 전용 분리 컴포넌트인 InlineMermaidRenderer를 호출하여 주입함.
         * - 불만족 시: 다음 세그먼트 타입 체크 분기로 폴백.
         * - 예시: `if (seg.type === 'mermaid')` 만족 시 Mermaid 렌더링 진행.
         */
        if (seg.type === 'mermaid') {
          return (
            <div key={idx} style={{ margin: '16px 0' }}>
              <InlineMermaidRenderer code={seg.code} />
            </div>
          )
        }

        /* 
         * [ALGORITHM BRANCH / DECISION]
         * - 조건 식: `seg.type === 'html-preview'`
         * - 만족 시: 사용자 작성 HTML 코드를 안전한 sandboxed iframe 환경 내부 리소스 프레임(srcDoc)으로 격리 로드함.
         * - 불만족 시: 다음 세그먼트 타입 체크 분기로 폴백.
         * - 예시: `if (seg.type === 'html-preview')` 만족 시 iframe 로드.
         */
        if (seg.type === 'html-preview') {
          return (
            <div key={idx} style={{ margin: '16px 0' }}>
              <iframe
                sandbox="allow-scripts"
                title="HTML Preview Frame"
                srcDoc={seg.code}
                style={{ width: '100%', height: '380px', border: '1px solid rgba(249,115,22,0.3)', borderRadius: '10px', background: '#fff' }}
              />
            </div>
          )
        }

        /* 
         * [ALGORITHM BRANCH / DECISION]
         * - 조건 식: `seg.type === 'code-runner'`
         * - 만족 시: 코드 블록 형태의 실행 도메인을 감지한 경우이며, 하위의 세부 컴포넌트 식별 언어 스펙에 따라 맵, 유튜브, 링크, 혹은 기본 JupyterCodeViewer로 라우팅.
         * - 불만족 시: 바이패스하여 기본 HTML 태그 삽입 렌더링으로 폴백함.
         * - 예시: `if (seg.type === 'code-runner')` 만족 시 하위 실행기 라우팅 작동.
         */
        if (seg.type === 'code-runner') {
          /* 
           * [ALGORITHM BRANCH / DECISION]
           * - 조건 식: `seg.language === 'ameva-map'`
           * - 만족 시: 지도 좌표 및 노선을 처리하는 ameva-map 컴포넌트로 전달함.
           * - 불만족 시: 다음 특수 목적 코드블록 언어 검사로 이동.
           * - 예시: `if (seg.language === 'ameva-map')` 만족 시 OSM 지도 뷰어로 이식.
           */
          if (seg.language === 'ameva-map') {
            return (
              <div key={idx} style={{ margin: '16px 0', width: '100%' }}>
                <InlineMapRenderer code={seg.code} />
              </div>
            )
          }

          /* 
           * [ALGORITHM BRANCH / DECISION]
           * - 조건 식: `seg.language === 'ameva-youtube'`
           * - 만족 시: 동영상 재생을 위한 ameva-youtube 컴포넌트로 전달하여 재생 차단 우회 및 User-Agent 스푸핑 referer 필터 하에서 재생 프레임을 출력함.
           * - 예시: `if (seg.language === 'ameva-youtube')` 만족 시 유튜브 우회 플레이어 UI 호출.
           */
          if (seg.language === 'ameva-youtube') {
            return (
              <div key={idx} style={{ margin: '16px 0', width: '100%' }}>
                <InlineYoutubeRenderer code={seg.code} />
              </div>
            )
          }

          /* 
           * [ALGORITHM BRANCH / DECISION]
           * - 조건 식: `seg.language === 'ameva-link'`
           * - 만족 시: 링크 카드를 렌더링하고 내부 프리뷰 프레임을 유동 확장할 수 있는 ameva-link 컴포넌트로 전달함.
           * - 예시: `if (seg.language === 'ameva-link')` 만족 시 카드 확장 샌드박스 컴포넌트 렌더링.
           */
          if (seg.language === 'ameva-link') {
            return (
              <div key={idx} style={{ margin: '16px 0', width: '100%' }}>
                <InlineLinkPreviewRenderer code={seg.code} />
              </div>
            )
          }

          if (seg.language === 'ameva-kanban') {
            return (
              <div key={idx} style={{ margin: '16px 0', width: '100%' }}>
                <InlineKanbanRenderer code={seg.code} />
              </div>
            )
          }

          if (seg.language === 'ameva-excel') {
            return (
              <div key={idx} style={{ margin: '16px 0', width: '100%' }}>
                <InlineExcelRenderer code={seg.code} />
              </div>
            )
          }

          /* 
           * [ALGORITHM BRANCH / DECISION]
           * - 조건 식: `seg.language === 'ameva-drawing'`
           * - 만족 시: 그림판 캔버스를 렌더링하는 ameva-drawing 컴포넌트로 전달함.
           */
          if (seg.language === 'ameva-drawing') {
            return (
              <div key={idx} style={{ margin: '16px 0', width: '100%' }}>
                <InlineDrawingRenderer code={seg.code} />
              </div>
            )
          }

          if (editor) {
            /*
             * [RUN-TIME STATE / INVARIANT]
             * - 변수 명: `runnerLang`
             * - 자료형 / 예상 값: string
             * - 시나리오: 주피터 코드 실행기(JupyterCodeViewer)에서 정상 구동 가능한 매핑 식별값(javascript, python 등)을 생성함.
             */
            const runnerLang = seg.language === 'js' ? 'javascript' : seg.language === 'py' ? 'python' : (seg.language || 'javascript')
            return (
              <div key={idx} style={{ margin: '16px 0' }}>
                <JupyterCodeViewer
                  code={seg.code || ''}
                  language={runnerLang}
                />
              </div>
            )
          }
        }

        return <div key={idx} dangerouslySetInnerHTML={{ __html: 'html' in seg ? seg.html : '' }} />
      })}
    </div>
  )
}
