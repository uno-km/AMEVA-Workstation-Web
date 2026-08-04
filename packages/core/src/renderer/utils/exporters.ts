/**
 * @file exporters.ts
 * @system AMEVA OS Desktop Workstation
 * @location src/renderer/utils/exporters.ts
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
 * exporters.ts
 * ──────────────────────────────────────────────────────────────
 * [SEC-W-019] 분산 문서 변환 아키텍처 (렌더러 초경량화 버전)
 * 
 * 렌더러 단에서는 무거운 오피스 변환 엔진(docx, exceljs, pptxgenjs, jszip 등)을
 * 일체 임포트하지 않고 메인 프로세스(exportersMain)로 연산을 전담 위임합니다.
 * 웹 브라우저 환경에서는 가벼운 텍스트/HTML 형태의 폴백 변환을 제공합니다.
 * ──────────────────────────────────────────────────────────────
 */
import type { NormalizedBlock, NormalizedInlineContent } from './normalizeBlocks'
import { getPlainTextFromNormalized, inlineToText } from './normalizeBlocks'

export type { NormalizedBlock as Block }

  /*
   * [FUNCTION CONTRACT]
   * - 함수 명: `escapeHtml`
   * - 역할: 인자 정보를 검수하고 비즈니스 계약 조건에 맞춰 최종 바인딩 결과물/바이너리 버퍼를 반환함.
   * - 예시: `escapeHtml(...)` 호출 시 런타임 비동기/동기 연쇄 반응 유도.
   */
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

  /*
   * [FUNCTION CONTRACT]
   * - 함수 명: `inlineToHTML`
   * - 역할: 인자 정보를 검수하고 비즈니스 계약 조건에 맞춰 최종 바인딩 결과물/바이너리 버퍼를 반환함.
   * - 예시: `inlineToHTML(...)` 호출 시 런타임 비동기/동기 연쇄 반응 유도.
   */
function inlineToHTML(inline: NormalizedInlineContent[]): string {
  return inline.map(c => {
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `!c || !c.text`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (!c || !c.text)` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
    if (!c || !c.text) return ''
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `txt`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const txt = ...` 형태로 안전 캐싱 후 가공 기동.
       */
    let txt = escapeHtml(c.text)
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `c.styles?.bold`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (c.styles?.bold)` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
    if (c.styles?.bold) txt = `<strong>${txt}</strong>`
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `c.styles?.italic`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (c.styles?.italic)` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
    if (c.styles?.italic) txt = `<em>${txt}</em>`
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `c.styles?.underline`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (c.styles?.underline)` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
    if (c.styles?.underline) txt = `<u>${txt}</u>`
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `c.styles?.strike`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (c.styles?.strike)` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
    if (c.styles?.strike) txt = `<del>${txt}</del>`
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `c.styles?.textColor`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (c.styles?.textColor)` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
    if (c.styles?.textColor) txt = `<span style="color:${c.styles.textColor}">${txt}</span>`
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `c.type === 'link'`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (c.type === 'link')` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
    if (c.type === 'link') txt = `<a href="${c.text}" style="color:#8b5cf6">${txt}</a>`
    return txt
  }).join('')
}

// ══════════════════════════════════════════════════════════════
// 1. HTML 내보내기
// ══════════════════════════════════════════════════════════════
export async function blocksToHTML(rawBlocks: any): Promise<string> {
  const blocks: NormalizedBlock[] = Array.isArray(rawBlocks) ? rawBlocks : []

      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `css`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const css = ...` 형태로 안전 캐싱 후 가공 기동.
       */
  const css = `
    @import url('https://fonts.googleapis.com/css2?family=Pretendard:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap');
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Pretendard', -apple-system, sans-serif; background: #f8fafc; color: #1e293b; line-height: 1.7; font-size: 15px; }
    .doc-container { max-width: 820px; margin: 40px auto; padding: 56px 64px; background: #fff; border-radius: 16px; box-shadow: 0 10px 40px rgba(0,0,0,0.06); }
    h1 { font-size: 2.2rem; font-weight: 800; color: #111827; margin: 2rem 0 1rem; border-bottom: 2px solid #e5e7eb; padding-bottom: 0.5rem; }
    h2 { font-size: 1.6rem; font-weight: 700; color: #1f2937; margin: 1.8rem 0 0.8rem; }
    h3 { font-size: 1.2rem; font-weight: 600; color: #374151; margin: 1.4rem 0 0.6rem; }
    p { margin-bottom: 1rem; color: #374151; }
    ul, ol { padding-left: 1.6rem; margin-bottom: 1rem; }
    li { margin-bottom: 0.4rem; }
    pre { background: #0f172a; border-radius: 10px; padding: 20px 24px; overflow-x: auto; margin: 1.2rem 0; border: 1px solid #1e293b; }
    code { font-family: 'Fira Code', 'Consolas', monospace; font-size: 13px; background: #f1f5f9; padding: 2px 6px; border-radius: 4px; color: #7c3aed; }
    pre code { background: transparent; padding: 0; color: #a3e635; font-size: 13px; white-space: pre; line-height: 1.65; }
    .lang-badge { font-family: 'Fira Code', monospace; font-size: 10px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.08em; display: block; margin-bottom: 10px; }
    table { border-collapse: collapse; width: 100%; margin: 1.2rem 0; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden; }
    th { background: #f8fafc; font-weight: 700; padding: 11px 16px; text-align: left; font-size: 13px; border-bottom: 2px solid #e5e7eb; }
    td { padding: 10px 16px; font-size: 14px; border-bottom: 1px solid #f1f5f9; }
    tr:last-child td { border-bottom: none; }
    blockquote { border-left: 4px solid #8b5cf6; padding: 12px 20px; background: #faf5ff; border-radius: 0 8px 8px 0; margin: 1rem 0; }
    img { max-width: 100%; border-radius: 8px; margin: 1rem 0; }
    hr { border: none; border-top: 1px solid #e5e7eb; margin: 2rem 0; }
    @media print { body { font-size: 12pt; } .doc-container { padding: 0; } }
  `

      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `body`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const body = ...` 형태로 안전 캐싱 후 가공 기동.
       */
  let body = ''
  let listType: 'ul' | 'ol' | null = null

      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `closeList`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const closeList = ...` 형태로 안전 캐싱 후 가공 기동.
       */
  const closeList = () => {
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `listType`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (listType)` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
    if (listType) { body += `</${listType}>\n`; listType = null }
  }

      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `renderBlock`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const renderBlock = ...` 형태로 안전 캐싱 후 가공 기동.
       */
  const renderBlock = async (block: NormalizedBlock, depth = 0): Promise<string> => {
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `indent`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const indent = ...` 형태로 안전 캐싱 후 가공 기동.
       */
    const indent = depth > 0 ? ` style="margin-left:${depth * 20}px"` : ''
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `contentHtml`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const contentHtml = ...` 형태로 안전 캐싱 후 가공 기동.
       */
    const contentHtml = inlineToHTML(block.content)

      /*
       * [SWITCH ROUTING CASE]
       * - 라우팅 키: `switch (block.type) {`
       * - 예상 시나리오: 유입된 상태 변수 분기값과 일치하는 케이스 블록으로 런타임 제어를 즉시 라우팅함.
       * - 예시: `switch (format)` 분기 시 매치되는 변환 포맷 서브 모듈이 가동됨.
       */
    switch (block.type) {
    /*
     * [CASE ROUTING DECISION BINDING]
     * - 분기 타겟: `case 'heading': {`
     * - 만족 시: 본 케이스 전용 연산을 이행하고 break/return을 거쳐 스위치 게이트를 마감함.
     * - 예시: `case 'heading': {` 만족 시 해당 포맷 바이너리 빌더 호출.
     */
      case 'heading': {
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `lvl`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const lvl = ...` 형태로 안전 캐싱 후 가공 기동.
       */
        const lvl = Math.min(6, Math.max(1, Number(block.props?.level) || 1))
        return `<h${lvl}>${contentHtml}</h${lvl}>\n`
      }
    /*
     * [CASE ROUTING DECISION BINDING]
     * - 분기 타겟: `case 'paragraph':`
     * - 만족 시: 본 케이스 전용 연산을 이행하고 break/return을 거쳐 스위치 게이트를 마감함.
     * - 예시: `case 'paragraph':` 만족 시 해당 포맷 바이너리 빌더 호출.
     */
      case 'paragraph':
        return `<p>${contentHtml || '&nbsp;'}</p>\n`
    /*
     * [CASE ROUTING DECISION BINDING]
     * - 분기 타겟: `case 'bulletListItem':`
     * - 만족 시: 본 케이스 전용 연산을 이행하고 break/return을 거쳐 스위치 게이트를 마감함.
     * - 예시: `case 'bulletListItem':` 만족 시 해당 포맷 바이너리 빌더 호출.
     */
      case 'bulletListItem':
        return `<li${indent}>${contentHtml}${
          block.children?.length ? `<ul>${(await Promise.all(block.children.map(c => renderBlock(c, depth + 1)))).join('')}</ul>` : ''
        }</li>\n`
    /*
     * [CASE ROUTING DECISION BINDING]
     * - 분기 타겟: `case 'numberedListItem':`
     * - 만족 시: 본 케이스 전용 연산을 이행하고 break/return을 거쳐 스위치 게이트를 마감함.
     * - 예시: `case 'numberedListItem':` 만족 시 해당 포맷 바이너리 빌더 호출.
     */
      case 'numberedListItem':
        return `<li${indent}>${contentHtml}${
          block.children?.length ? `<ol>${(await Promise.all(block.children.map(c => renderBlock(c, depth + 1)))).join('')}</ol>` : ''
        }</li>\n`
    /*
     * [CASE ROUTING DECISION BINDING]
     * - 분기 타겟: `case 'codeBlock': {`
     * - 만족 시: 본 케이스 전용 연산을 이행하고 break/return을 거쳐 스위치 게이트를 마감함.
     * - 예시: `case 'codeBlock': {` 만족 시 해당 포맷 바이너리 빌더 호출.
     */
      case 'codeBlock': {
        const lang = block.props?.language || ''
        
        // INTERCEPT MERMAID
        if (lang === 'mermaid') {
          const code = getPlainTextFromNormalized(block) || ''
          try {
            const mermaidModule = await import('mermaid')
            const mermaid = mermaidModule.default || mermaidModule
            mermaid.initialize({ startOnLoad: false })
            const id = `mermaid-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`
            const { svg } = await mermaid.render(id, code)
            return `<div style="text-align: center; margin: 1.5rem 0;">${svg}</div>\n`
          } catch (e) {
            console.error('Failed to render mermaid for export', e)
            return `<pre><code class="language-mermaid">${escapeHtml(code)}</code></pre>\n`
          }
        }

        // INTERCEPT AMEVA-EXCEL
        if (lang === 'ameva-excel') {
          const excelDataRaw = getPlainTextFromNormalized(block) || '[]'
          try {
            const sheets = JSON.parse(excelDataRaw)
            if (Array.isArray(sheets) && sheets.length > 0) {
              let html = ''
              for (const sheet of sheets) {
                const celldata = sheet.celldata || []
                if (celldata.length === 0) continue
                
                let maxRow = 0
                let maxCol = 0
                for (const cell of celldata) {
                  if (cell.r > maxRow) maxRow = cell.r
                  if (cell.c > maxCol) maxCol = cell.c
                }
                
                const grid: any[][] = Array(maxRow + 1).fill(null).map(() => Array(maxCol + 1).fill(null))
                for (const cell of celldata) {
                  grid[cell.r][cell.c] = cell.v
                }

                html += `<div style="margin-bottom: 2rem;">`
                html += `<h4 style="margin-bottom: 0.5rem; color: #475569;">[Excel] ${escapeHtml(sheet.name || 'Sheet')}</h4>`
                html += `<table border="1" style="width: 100%; border-collapse: collapse; border: 1px solid #cbd5e1; font-size: 13px;">\n<tbody>\n`
                
                for (let r = 0; r <= maxRow; r++) {
                  html += '<tr>\n'
                  for (let c = 0; c <= maxCol; c++) {
                    const v = grid[r][c]
                    let val = ''
                    if (v) {
                      if (typeof v === 'string' || typeof v === 'number') val = String(v)
                      else if (v.m !== undefined) val = String(v.m)
                      else if (v.v !== undefined) val = String(v.v)
                    }
                    html += `<td style="border: 1px solid #cbd5e1; padding: 4px 8px; min-width: 50px;">${escapeHtml(val)}</td>\n`
                  }
                  html += '</tr>\n'
                }
                html += '</tbody>\n</table>\n</div>\n'
              }
              return html || `<p><em>(Empty Excel Block)</em></p>\n`
            }
          } catch (e) {
            console.error('Failed to render excel for export', e)
          }
          return `<p><em>(Invalid Excel Data)</em></p>\n`
        }

        // INTERCEPT AMEVA-KANBAN
        if (lang === 'ameva-kanban') {
          const kanbanDataRaw = getPlainTextFromNormalized(block) || '{}'
          try {
            const board = JSON.parse(kanbanDataRaw)
            const cols = board.columns || []
            if (cols.length === 0) return `<p><em>(Empty Kanban Board)</em></p>\n`
            
            let html = `<div style="margin-bottom: 2rem;">`
            html += `<h4 style="margin-bottom: 1rem; color: #475569;">[Kanban Board]</h4>`
            html += `<table style="width: 100%; border-collapse: separate; border-spacing: 16px 0; table-layout: fixed;">\n<tbody>\n<tr>\n`
            
            for (const col of cols) {
              html += `<td style="vertical-align: top; background: #f8fafc; border-radius: 8px; padding: 12px; border: 1px solid #e2e8f0; width: ${100/cols.length}%;">`
              html += `<h5 style="margin-bottom: 12px; font-size: 14px; font-weight: 600; color: #334155; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px;">${escapeHtml(col.title || 'Untitled')} (${col.cards?.length || 0})</h5>`
              html += `<ul style="list-style: none; padding: 0; margin: 0;">`
              
              const cards = col.cards || []
              for (const card of cards) {
                html += `<li style="background: #ffffff; padding: 12px; margin-bottom: 10px; border-radius: 6px; border: 1px solid #cbd5e1; box-shadow: 0 1px 2px rgba(0,0,0,0.05);">`
                html += `<strong style="font-size: 14px; color: #1e293b; display: block; margin-bottom: 4px;">${escapeHtml(card.title || '')}</strong>`
                
                if (card.labels && card.labels.length > 0) {
                  html += `<div style="display: flex; flex-wrap: wrap; gap: 4px; margin-bottom: 6px;">`
                  for (const label of card.labels) {
                    html += `<span style="background: ${label.color}; color: #fff; font-size: 10px; padding: 2px 6px; border-radius: 10px;">${escapeHtml(label.text)}</span>`
                  }
                  html += `</div>`
                }
                
                if (card.description) {
                  html += `<span style="font-size: 12px; color: #64748b; display: block; white-space: pre-wrap;">${escapeHtml(card.description)}</span>`
                }
                html += `</li>`
              }
              html += `</ul></td>\n`
            }
            
            html += `</tr>\n</tbody>\n</table>\n</div>\n`
            return html
          } catch (e) {
            console.error('Failed to render kanban for export', e)
          }
          return `<p><em>(Invalid Kanban Data)</em></p>\n`
        }

        // Default codeblock rendering
        const code = escapeHtml(getPlainTextFromNormalized(block))
        return `<pre><span class="lang-badge">${escapeHtml(lang)}</span><code class="language-${lang}">${code}</code></pre>\n`
      }
    /*
     * [CASE ROUTING DECISION BINDING]
     * - 분기 타겟: `case 'checkListItem': {`
     * - 만족 시: 본 케이스 전용 연산을 이행하고 break/return을 거쳐 스위치 게이트를 마감함.
     * - 예시: `case 'checkListItem': {` 만족 시 해당 포맷 바이너리 빌더 호출.
     */
      case 'checkListItem': {
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `checked`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const checked = ...` 형태로 안전 캐싱 후 가공 기동.
       */
        const checked = block.props?.checked ? 'checked' : ''
        return `<li style="list-style:none;display:flex;gap:8px"><input type="checkbox" ${checked} disabled /><span>${contentHtml}</span></li>\n`
      }
    /*
     * [CASE ROUTING DECISION BINDING]
     * - 분기 타겟: `case 'image': {`
     * - 만족 시: 본 케이스 전용 연산을 이행하고 break/return을 거쳐 스위치 게이트를 마감함.
     * - 예시: `case 'image': {` 만족 시 해당 포맷 바이너리 빌더 호출.
     */
      case 'image': {
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `url`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const url = ...` 형태로 안전 캐싱 후 가공 기동.
       */
        const url = block.props?.url || ''
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `caption`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const caption = ...` 형태로 안전 캐싱 후 가공 기동.
       */
        const caption = block.props?.caption || ''
        return `<figure style="text-align:center;margin:1.2rem 0"><img src="${url}" alt="${escapeHtml(caption)}" />${caption ? `<figcaption style="font-size:12px;color:#9ca3af;margin-top:6px">${escapeHtml(caption)}</figcaption>` : ''}</figure>\n`
      }
    /*
     * [CASE ROUTING DECISION BINDING]
     * - 분기 타겟: `case 'table': {`
     * - 만족 시: 본 케이스 전용 연산을 이행하고 break/return을 거쳐 스위치 게이트를 마감함.
     * - 예시: `case 'table': {` 만족 시 해당 포맷 바이너리 빌더 호출.
     */
      case 'table': {
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `rows`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const rows = ...` 형태로 안전 캐싱 후 가공 기동.
       */
        const rows = block.tableRows ?? []
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `rows.length === 0`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (rows.length === 0)` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
        if (rows.length === 0) return ''
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `html`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const html = ...` 형태로 안전 캐싱 후 가공 기동.
       */
        let html = '<table>\n<tbody>\n'
        rows.forEach((row, ri) => {
          html += '<tr>\n'
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `cells`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const cells = ...` 형태로 안전 캐싱 후 가공 기동.
       */
          const cells = Array.isArray(row.cells) ? row.cells : []
          cells.forEach((cell) => {
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `cellText`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const cellText = ...` 형태로 안전 캐싱 후 가공 기동.
       */
            const cellText = Array.isArray(cell) ? inlineToText(cell) : ''
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `tag`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const tag = ...` 형태로 안전 캐싱 후 가공 기동.
       */
            const tag = ri === 0 ? 'th' : 'td'
            html += `<${tag}>${escapeHtml(cellText)}</${tag}>\n`
          })
          html += '</tr>\n'
        })
        html += '</tbody>\n</table>\n'
        return html
      }
    /*
     * [CASE ROUTING DECISION BINDING]
     * - 분기 타겟: `case 'quote':`
     * - 만족 시: 본 케이스 전용 연산을 이행하고 break/return을 거쳐 스위치 게이트를 마감함.
     * - 예시: `case 'quote':` 만족 시 해당 포맷 바이너리 빌더 호출.
     */
      case 'quote':
        return `<blockquote>${contentHtml}</blockquote>\n`
    /*
     * [CASE ROUTING DECISION BINDING]
     * - 분기 타겟: `case 'divider':`
     * - 만족 시: 본 케이스 전용 연산을 이행하고 break/return을 거쳐 스위치 게이트를 마감함.
     * - 예시: `case 'divider':` 만족 시 해당 포맷 바이너리 빌더 호출.
     */
      case 'divider':
        return '<hr />\n'

      // ── AMEVA EXCEL BLOCK → HTML TABLE ─────────────────────────────────────
      case 'excel': {
        const excelDataRaw = block.props?.data || '[]'
        try {
          const sheets = typeof excelDataRaw === 'string' ? JSON.parse(excelDataRaw) : excelDataRaw
          const sheetArr = Array.isArray(sheets) ? sheets : [sheets]
          if (sheetArr.length === 0) return `<p><em>(Empty Excel Block)</em></p>\n`
          let html = ''
          for (const sheet of sheetArr) {
            const celldata = sheet.celldata || []
            if (sheet.data && Array.isArray(sheet.data)) {
              // Already a 2D matrix
              const matrix = sheet.data.filter((r: any[]) => Array.isArray(r) && r.some(c => c !== null && c !== undefined && c !== ''))
              if (matrix.length === 0) continue
              html += `<div style="margin-bottom:1.5rem"><h4 style="color:#475569;margin-bottom:.4rem">[Excel] ${escapeHtml(sheet.name||'Sheet')}</h4>`
              html += `<table border="1" style="width:100%;border-collapse:collapse;font-size:13px;border:1px solid #cbd5e1">\n<tbody>\n`
              for (let r = 0; r < matrix.length; r++) {
                html += '<tr>\n'
                for (let c = 0; c < matrix[r].length; c++) {
                  const val = matrix[r][c]
                  const display = val !== null && val !== undefined ? escapeHtml(String(val)) : ''
                  const tag = r === 0 ? 'th' : 'td'
                  html += `<${tag} style="border:1px solid #cbd5e1;padding:4px 8px;min-width:50px">${display}</${tag}>\n`
                }
                html += '</tr>\n'
              }
              html += `</tbody>\n</table>\n</div>\n`
            } else if (celldata.length > 0) {
              let maxR = 0, maxC = 0
              for (const cell of celldata) { if (cell.r > maxR) maxR = cell.r; if (cell.c > maxC) maxC = cell.c }
              const grid: any[][] = Array(maxR+1).fill(null).map(() => Array(maxC+1).fill(''))
              for (const cell of celldata) {
                const v = cell.v
                grid[cell.r][cell.c] = v?.m ?? v?.v ?? (typeof v === 'string' || typeof v === 'number' ? v : '')
              }
              html += `<div style="margin-bottom:1.5rem"><h4 style="color:#475569;margin-bottom:.4rem">[Excel] ${escapeHtml(sheet.name||'Sheet')}</h4>`
              html += `<table border="1" style="width:100%;border-collapse:collapse;font-size:13px;border:1px solid #cbd5e1">\n<tbody>\n`
              for (let r = 0; r <= maxR; r++) {
                html += '<tr>\n'
                for (let c = 0; c <= maxC; c++) {
                  const display = grid[r][c] !== '' ? escapeHtml(String(grid[r][c])) : ''
                  const tag = r === 0 ? 'th' : 'td'
                  html += `<${tag} style="border:1px solid #cbd5e1;padding:4px 8px;min-width:50px">${display}</${tag}>\n`
                }
                html += '</tr>\n'
              }
              html += `</tbody>\n</table>\n</div>\n`
            }
          }
          return html || `<p><em>(Empty Excel Block)</em></p>\n`
        } catch (e) {
          return `<p><em>(Invalid Excel Data)</em></p>\n`
        }
      }

      // ── AMEVA KANBAN BLOCK → HTML TABLE ────────────────────────────────────
      case 'kanban': {
        const kanbanRaw = block.props?.data || '{}'
        try {
          const board = typeof kanbanRaw === 'string' ? JSON.parse(kanbanRaw) : kanbanRaw
          const cols = board.columns || []
          if (cols.length === 0) return `<p><em>(Empty Kanban Board)</em></p>\n`
          let html = `<div style="margin-bottom:1.5rem">`
          html += `<h4 style="color:#475569;margin-bottom:.8rem">[Kanban Board]</h4>`
          html += `<table style="width:100%;border-collapse:separate;border-spacing:10px 0;table-layout:fixed">\n<tbody>\n<tr>\n`
          for (const col of cols) {
            const cards = col.cards || []
            html += `<td style="vertical-align:top;background:#f8fafc;border-radius:8px;padding:10px;border:1px solid #e2e8f0;width:${100/cols.length}%">`
            html += `<div style="font-weight:600;font-size:13px;color:#334155;border-bottom:2px solid #e2e8f0;padding-bottom:6px;margin-bottom:8px">${escapeHtml(col.title||'Untitled')} (${cards.length})</div>`
            html += `<ul style="list-style:none;padding:0;margin:0">`
            for (const card of cards) {
              html += `<li style="background:#fff;padding:10px;margin-bottom:8px;border-radius:6px;border:1px solid #cbd5e1">`
              html += `<strong style="font-size:13px;color:#1e293b;display:block;margin-bottom:2px">${escapeHtml(card.title||'(제목 없음)')}</strong>`
              if (card.description) html += `<span style="font-size:11px;color:#64748b">${escapeHtml(card.description)}</span>`
              if (card.priority) html += `<span style="font-size:10px;color:#94a3b8;margin-top:4px;display:block">우선순위: ${escapeHtml(card.priority)}</span>`
              html += `</li>`
            }
            if (cards.length === 0) html += `<li style="font-size:11px;color:#94a3b8;text-align:center;padding:8px">(비어있음)</li>`
            html += `</ul></td>\n`
          }
          html += `</tr>\n</tbody>\n</table>\n</div>\n`
          return html
        } catch (e) {
          return `<p><em>(Invalid Kanban Data)</em></p>\n`
        }
      }


    /*
     * [CASE ROUTING DECISION BINDING]
     * - 분기 타겟: `default:`
     * - 만족 시: 본 케이스 전용 연산을 이행하고 break/return을 거쳐 스위치 게이트를 마감함.
     * - 예시: `default:` 만족 시 해당 포맷 바이너리 빌더 호출.
     */
      default:
        return contentHtml ? `<p>${contentHtml}</p>\n` : ''
    }
  }

  for (const block of blocks) {
    if (block.type === 'bulletListItem') {
      if (listType !== 'ul') { closeList(); body += '<ul>\n'; listType = 'ul' }
      body += await renderBlock(block)
    } else if (block.type === 'numberedListItem') {
      if (listType !== 'ol') { closeList(); body += '<ol>\n'; listType = 'ol' }
      body += await renderBlock(block)
    } else {
      closeList()
      body += await renderBlock(block)
    }
  }
  closeList()

  return `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>AMEVA Document</title>
  <style>${css}</style>
</head>
<body>
<div class="doc-container">
${body}
</div>
</body>
</html>`
}

// ══════════════════════════════════════════════════════════════
// 2. Word (DOCX) 브라우저 폴백 내보내기
// ══════════════════════════════════════════════════════════════
export async function exportToWord(rawBlocks: any): Promise<Blob> {
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `html`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const html = ...` 형태로 안전 캐싱 후 가공 기동.
       */
  const html = await blocksToHTML(rawBlocks)
  return new Blob([html], { type: 'application/msword' })
}

// ══════════════════════════════════════════════════════════════
// 3. Excel (XLSX) 브라우저 폴백 내보내기
// ══════════════════════════════════════════════════════════════
export function exportToExcel(rawBlocks: any): Uint8Array {
  const blocks: NormalizedBlock[] = Array.isArray(rawBlocks) ? rawBlocks : []
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `csv`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const csv = ...` 형태로 안전 캐싱 후 가공 기동.
       */
  let csv = '\ufeff위치,블록타입,텍스트\n'
  
  blocks.forEach(b => {
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `txt`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const txt = ...` 형태로 안전 캐싱 후 가공 기동.
       */
    const txt = getPlainTextFromNormalized(b).replace(/"/g, '""')
    csv += `"${b.id}","${b.type}","${txt}"\n`
  })

  return new TextEncoder().encode(csv)
}

// ══════════════════════════════════════════════════════════════
// 4. PPTX 브라우저 폴백 내보내기
// ══════════════════════════════════════════════════════════════
export async function exportToPPTX(rawBlocks: any): Promise<Uint8Array> {
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `html`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const html = ...` 형태로 안전 캐싱 후 가공 기동.
       */
  const html = await blocksToHTML(rawBlocks)
  return new TextEncoder().encode(html)
}

// ══════════════════════════════════════════════════════════════
// 5. HWPX 브라우저 폴백 내보내기
// ══════════════════════════════════════════════════════════════
export async function exportToHWPX(rawBlocks: any): Promise<Blob> {
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `html`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const html = ...` 형태로 안전 캐싱 후 가공 기동.
       */
  const html = await blocksToHTML(rawBlocks)
  return new Blob([html], { type: 'application/xhtml+xml' })
}

// ══════════════════════════════════════════════════════════════
// 6. XML 내보내기
// ══════════════════════════════════════════════════════════════
export function exportToXML(blocks: any[]): string {
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `renderXML`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const renderXML = ...` 형태로 안전 캐싱 후 가공 기동.
       */
  const renderXML = (block: any, indent = '  '): string => {
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `xml`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const xml = ...` 형태로 안전 캐싱 후 가공 기동.
       */
    let xml = `${indent}<block id="${block.id}" type="${block.type}">\n`

      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `Object.keys(block.props || {}).length > 0`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (Object.keys(block.props || {}).length > 0)` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
    if (Object.keys(block.props || {}).length > 0) {
      xml += `${indent}  <props>\n`
      /*
       * [LOOP CONTROL ITERATION]
       * - 루프 조건: `for (const [k, v] of Object.entries(block.props)) {`
       * - 예상 시나리오: 지정된 조건 한계 도달 시점까지 콜렉션 항목의 순차 매핑, 변환 및 동기 적재 처리를 수행함.
       * - 예시: `for (const item of list)` 루프 실행 시 모든 개별 블록의 html 포맷 정제 완료 후 스택 종결.
       */
      for (const [k, v] of Object.entries(block.props)) {
        xml += `${indent}    <prop name="${k}"><![CDATA[${v}]]></prop>\n`
      }
      xml += `${indent}  </props>\n`
    }

      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `block.type === 'table'`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (block.type === 'table')` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
    if (block.type === 'table') {
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `rows`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const rows = ...` 형태로 안전 캐싱 후 가공 기동.
       */
      const rows = block.tableRows ?? []
      xml += `${indent}  <table>\n`
      rows.forEach((row: any) => {
        xml += `${indent}    <row>\n`
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `cells`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const cells = ...` 형태로 안전 캐싱 후 가공 기동.
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
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (Array.isArray(block.children) && block.children.length > 0)` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
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
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const xml = ...` 형태로 안전 캐싱 후 가공 기동.
       */
  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`
  xml += `<!-- AMEVA Document Export: ${new Date().toISOString()} -->\n`
  xml += `<document>\n`
  blocks.forEach(b => { xml += renderXML(b) })
  xml += `</document>`
  return xml
}

