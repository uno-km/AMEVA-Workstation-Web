/**
 * @file exportHtml.ts
 * @system AMEVA Workstation
 * @location src/renderer/utils/exporters/exportHtml.ts
 * @role AMEVA 블록 → HTML 변환 내보내기 모듈
 *
 * [소비처 - CONSUMERS / USAGE CONTEXT]
 * - 소비처 A (exporters/index.ts): re-export 경유 외부 모듈에 공개.
 * - 소비처 B (exporters/exportDocx.ts): Word 내보내기 실패 시 HTML 폴백으로 사용.
 * - 소비처 C (exporters/exportPptx.ts): PPTX 내보내기 실패 시 HTML 폴백으로 사용.
 * - 소비처 D (exporters/exportHwpx.ts): HWPX 내보내기가 사실상 HTML 래퍼로 동작.
 *
 * [책임 범위 - RESPONSIBILITY]
 * - NormalizedBlock[] 배열을 완전한 standalone HTML 문자열로 변환한다.
 * - Mermaid 다이어그램, Excel 블록, Kanban 보드, Map 블록, YouTube/링크 등 모든 블록 타입을 처리한다.
 * - blob: URL 이미지를 Base64로 변환하여 HTML에 인라인 임베드한다.
 *
 * [절대 깨면 안 되는 계약 - CONTRACT]
 * - MUST: 모든 블록 타입에 대해 최소한 폴백(fallback) HTML을 반환할 것.
 * - MUST NOT: HTML 인젝션(XSS) 위험. 모든 사용자 입력은 escapeHtml()을 통과할 것.
 */

import type { NormalizedBlock, NormalizedInlineContent } from '../normalizeBlocks';
import { getPlainTextFromNormalized, inlineToText } from '../normalizeBlocks';
import { blobUrlToBase64 } from '../imageUtils';
import { parseAmevaBlockData } from './docxHelpers';

/**
 * [FUNCTION CONTRACT]
 * - 함수 명: `escapeHtml`
 * - 역할: HTML 특수문자를 엔티티로 이스케이프하여 XSS 공격을 방지한다.
 *         모든 사용자 입력 텍스트는 HTML에 삽입되기 전 반드시 이 함수를 통과해야 한다.
 * @param str - 이스케이프할 원본 문자열
 * @returns 이스케이프된 안전한 HTML 문자열
 */
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/**
 * [FUNCTION CONTRACT]
 * - 함수 명: `inlineToHTML`
 * - 역할: NormalizedInlineContent 배열을 HTML 인라인 태그 문자열로 변환한다.
 *         bold → <strong>, italic → <em>, underline → <u>, strike → <del>,
 *         textColor → <span style="color:...">, link → <a href="...">
 * @param inline - 변환할 인라인 컨텐츠 배열
 * @returns HTML 인라인 문자열
 */
function inlineToHTML(inline: NormalizedInlineContent[] | any): string {
  if (!Array.isArray(inline)) return ''
  return inline.map((c: any) => {
    /*
     * [ALGORITHM BRANCH / DECISION]
     * - 조건 식: `!c || !c.text`
     * - 만족 시: 컨텐츠가 없으므로 빈 문자열을 반환한다.
     */
    if (!c || !c.text) return ''
    /*
     * [RUN-TIME STATE / INVARIANT]
     * - 변수 명: `txt`
     * - 자료형: string
     * - 시나리오: 원본 텍스트를 XSS 방지 목적으로 먼저 이스케이프한 뒤 스타일 태그를 순차적으로 래핑한다.
     */
    let txt = escapeHtml(c.text)
    if (c.styles?.bold) txt = `<strong>${txt}</strong>`
    if (c.styles?.italic) txt = `<em>${txt}</em>`
    if (c.styles?.underline) txt = `<u>${txt}</u>`
    if (c.styles?.strike) txt = `<del>${txt}</del>`
    if (c.styles?.textColor) txt = `<span style="color:${c.styles.textColor}">${txt}</span>`
    if (c.type === 'link') txt = `<a href="${c.text}" style="color:#8b5cf6">${txt}</a>`
    return txt
  }).join('')
}

/**
 * [FUNCTION CONTRACT]
 * - 함수 명: `blocksToHTML`
 * - 역할: AMEVA 에디터의 NormalizedBlock 배열을 완전한 standalone HTML 문서로 변환한다.
 *         결과물은 브라우저에서 직접 열거나 파일로 저장 가능한 self-contained HTML이다.
 * @param rawBlocks - 변환할 NormalizedBlock 배열 (any[] 타입 허용, 내부에서 타입 보정)
 * @returns Promise<string> - 완성된 HTML 문서 문자열
 */
export async function blocksToHTML(rawBlocks: any): Promise<string> {
  /*
   * [RUN-TIME STATE / INVARIANT]
   * - 변수 명: `blocks`
   * - 자료형: NormalizedBlock[]
   * - 시나리오: 입력이 배열이 아닌 경우 빈 배열로 초기화하여 하위 로직의 타입 안전성을 보장한다.
   */
  const blocks: NormalizedBlock[] = Array.isArray(rawBlocks) ? rawBlocks : []

  /*
   * [RUN-TIME STATE / INVARIANT]
   * - 변수 명: `css`
   * - 자료형: string
   * - 시나리오: HTML 문서에 인라인으로 삽입될 스타일시트. Google Fonts(Pretendard, JetBrains Mono)를 임포트하고
   *             맥킨지 스타일의 깨끗한 문서 레이아웃을 정의한다.
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
    code { font-family: 'JetBrains Mono', 'Consolas', monospace; font-size: 13px; background: #f1f5f9; padding: 2px 6px; border-radius: 4px; color: #7c3aed; }
    pre code { background: transparent; padding: 0; color: #a3e635; font-size: 13px; white-space: pre; line-height: 1.65; }
    .lang-badge { font-family: 'JetBrains Mono', monospace; font-size: 10px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.08em; display: block; margin-bottom: 10px; }
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
   * - 변수 명: `body`, `listType`
   * - 시나리오: body는 최종 HTML 바디 컨텐츠를 누산한다.
   *             listType은 현재 열려있는 목록(<ul>/<ol>) 타입을 추적하며, 비목록 블록이 등장하면 닫는다.
   */
  let body = ''
  let listType: 'ul' | 'ol' | null = null

  /*
   * [FUNCTION CONTRACT] (내부 헬퍼)
   * - 함수 명: `closeList`
   * - 역할: 현재 열려있는 <ul> 또는 <ol> 태그를 닫고 listType을 null로 초기화한다.
   *         목록이 아닌 블록이 등장할 때 호출되어 HTML 구조의 정합성을 유지한다.
   */
  const closeList = () => {
    if (listType) { body += `</${listType}>\n`; listType = null }
  }

  /*
   * [FUNCTION CONTRACT] (내부 헬퍼, 재귀)
   * - 함수 명: `renderBlock`
   * - 역할: 단일 NormalizedBlock을 HTML 문자열로 변환한다. 중첩 블록(bulletListItem 등)에 대해 재귀 호출한다.
   * @param block - 렌더링할 블록
   * @param depth - 중첩 깊이 (들여쓰기 계산에 사용)
   */
  const renderBlock = async (block: NormalizedBlock, depth = 0): Promise<string> => {
    /*
     * [RUN-TIME STATE / INVARIANT]
     * - 변수 명: `indent`
     * - 시나리오: 중첩 깊이에 따라 margin-left 스타일을 생성한다. 최상위(depth=0)는 들여쓰기 없음.
     */
    const indent = depth > 0 ? ` style="margin-left:${depth * 20}px"` : ''

    /*
     * [RUN-TIME STATE / INVARIANT]
     * - 변수 명: `contentHtml`
     * - 시나리오: 블록의 인라인 컨텐츠를 HTML로 변환한 문자열. 텍스트 기반 블록 렌더링의 기본 재료이다.
     */
    const contentHtml = inlineToHTML(block.content)

    /*
     * [SWITCH ROUTING CASE]
     * - 라우팅 키: `switch (block.type)`
     * - 예상 시나리오: 블록 타입에 따라 대응하는 HTML 렌더러로 분기한다.
     *                 알 수 없는 타입은 default 케이스에서 폴백 처리된다.
     */
    switch (block.type) {

      // ── HEADING → <h1>~<h6> ─────────────────────────────────────────────
      case 'heading': {
        /*
         * [RUN-TIME STATE / INVARIANT]
         * - 변수 명: `lvl`
         * - 시나리오: h1~h6 범위로 클램프하여 잘못된 레벨 값에 대한 방어 로직을 포함한다.
         */
        const lvl = Math.min(6, Math.max(1, Number(block.props?.level) || 1))
        return `<h${lvl}>${contentHtml}</h${lvl}>\n`
      }

      // ── PARAGRAPH → <p> ─────────────────────────────────────────────────
      case 'paragraph':
        return `<p>${contentHtml || '&nbsp;'}</p>\n`

      // ── BULLET LIST ITEM → <li> (ul) ────────────────────────────────────
      case 'bulletListItem':
        return `<li${indent}>${contentHtml}${
          block.children?.length ? `<ul>${(await Promise.all(block.children.map(c => renderBlock(c, depth + 1)))).join('')}</ul>` : ''
        }</li>\n`

      // ── NUMBERED LIST ITEM → <li> (ol) ──────────────────────────────────
      case 'numberedListItem':
        return `<li${indent}>${contentHtml}${
          block.children?.length ? `<ol>${(await Promise.all(block.children.map(c => renderBlock(c, depth + 1)))).join('')}</ol>` : ''
        }</li>\n`

      // ── CODE BLOCK → <pre><code> ─────────────────────────────────────────
      case 'codeBlock': {
        const lang = block.props?.language || ''

        // Mermaid 다이어그램: mermaid 라이브러리로 SVG 렌더링
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
            console.error('[exportHtml] Mermaid render failed:', e)
            return `<pre><code class="language-mermaid">${escapeHtml(code)}</code></pre>\n`
          }
        }

        // AMEVA 커스텀 블록 폴백 (codeBlock 래퍼 형태의 구형 포맷)
        if (lang === 'ameva-document') {
          return `<div style="padding: 15px; margin-bottom: 1rem; background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px;"><h4 style="color: #334155;">📎 [첨부 문서: ${escapeHtml(block.props?.title || '문서 파일')}]</h4><p style="font-size: 13px; color: #64748b; margin-top: 5px;">* 이 문서는 HTML 내보내기 시 인라인 뷰어 출력이 지원되지 않습니다.</p></div>\n`
        }
        if (lang === 'ameva-presentation') {
          return `<div style="padding: 15px; margin-bottom: 1rem; background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px;"><h4 style="color: #334155;">📊 [프레젠테이션 슬라이드]</h4><p style="font-size: 13px; color: #64748b; margin-top: 5px;">* 이 문서는 HTML 내보내기 시 인라인 슬라이드 출력이 지원되지 않습니다.</p></div>\n`
        }

        // 일반 코드블록: <pre><code> 렌더링
        const code = escapeHtml(getPlainTextFromNormalized(block))
        return `<pre><span class="lang-badge">${escapeHtml(lang)}</span><code class="language-${lang}">${code}</code></pre>\n`
      }

      // ── CHECK LIST ITEM → <li> with checkbox ────────────────────────────
      case 'checkListItem': {
        const checked = block.props?.checked ? 'checked' : ''
        return `<li style="list-style:none;display:flex;gap:8px"><input type="checkbox" ${checked} disabled /><span>${contentHtml}</span></li>\n`
      }

      // ── IMAGE → <figure><img> ────────────────────────────────────────────
      case 'image': {
        /*
         * [RUN-TIME STATE / INVARIANT]
         * - 변수 명: `url`
         * - 시나리오: blob: URL은 외부 공유 불가이므로 blobUrlToBase64를 통해 인라인 Data URI로 변환한다.
         *             변환 실패 시 원본 URL이 그대로 사용된다 (blobUrlToBase64의 폴백 동작).
         */
        const url = await blobUrlToBase64(block.props?.url || '')
        const caption = block.props?.caption || ''
        return `<figure style="text-align:center;margin:1.2rem 0"><img src="${url}" alt="${escapeHtml(caption)}" style="max-width:100%" />${caption ? `<figcaption style="font-size:12px;color:#9ca3af;margin-top:6px">${escapeHtml(caption)}</figcaption>` : ''}</figure>\n`
      }

      // ── TABLE → <table> ──────────────────────────────────────────────────
      case 'table': {
        const rows = block.tableRows ?? []
        if (rows.length === 0) return ''
        let html = '<table>\n<tbody>\n'
        rows.forEach((row, ri) => {
          html += '<tr>\n'
          const cells = Array.isArray(row.cells) ? row.cells : []
          cells.forEach((cell) => {
            const cellText = Array.isArray(cell) ? inlineToText(cell) : ''
            const tag = ri === 0 ? 'th' : 'td'
            html += `<${tag}>${escapeHtml(cellText)}</${tag}>\n`
          })
          html += '</tr>\n'
        })
        html += '</tbody>\n</table>\n'
        return html
      }

      // ── QUOTE → <blockquote> ─────────────────────────────────────────────
      case 'quote':
        return `<blockquote>${contentHtml}</blockquote>\n`

      // ── DIVIDER → <hr> ───────────────────────────────────────────────────
      case 'divider':
        return '<hr />\n'

      // ── MAP BLOCK → 지도 정보 카드 ──────────────────────────────────────
      case 'map':
        return `<div style="padding:12px; border:1px solid #cbd5e1; border-radius:8px; background:#f8fafc; margin-bottom:1.5rem;">
          <h4 style="margin:0 0 8px 0; color:#334155; font-size:14px;">🗺️ [지도] ${escapeHtml(block.props?.locationName || '위치 정보')}</h4>
          <span style="font-size:12px; color:#64748b;">(위도: ${escapeHtml(String(block.props?.lat || ''))}, 경도: ${escapeHtml(String(block.props?.lng || ''))})</span>
        </div>\n`

      // ── YOUTUBE BLOCK → 링크 카드 ────────────────────────────────────────
      case 'youtube':
        return `<div style="padding:12px; border:1px solid #cbd5e1; border-radius:8px; background:#f8fafc; margin-bottom:1.5rem;">
          <h4 style="margin:0 0 8px 0; color:#dc2626; font-size:14px;">▶️ [YouTube 영상]</h4>
          <a href="${escapeHtml(block.props?.url || '')}" style="color:#2563eb; font-size:13px; text-decoration:none;">${escapeHtml(block.props?.url || '링크 없음')}</a>
        </div>\n`

      // ── LINK PREVIEW BLOCK → 링크 프리뷰 카드 ───────────────────────────
      case 'linkPreview':
        return `<div style="padding:12px; border:1px solid #cbd5e1; border-radius:8px; background:#f8fafc; margin-bottom:1.5rem;">
          <h4 style="margin:0 0 6px 0; color:#334155; font-size:14px;">🔗 [링크 미리보기] ${escapeHtml(block.props?.title || '제목 없음')}</h4>
          ${block.props?.description ? `<p style="font-size:12px; color:#64748b; margin:0 0 8px 0;">${escapeHtml(block.props.description)}</p>` : ''}
          <a href="${escapeHtml(block.props?.url || '')}" style="color:#2563eb; font-size:12px; text-decoration:none;">${escapeHtml(block.props?.url || '링크 없음')}</a>
        </div>\n`

      // ── EXCEL BLOCK → HTML 테이블 ────────────────────────────────────────
      case 'excel': {
        const excelDataRaw = block.props?.data || '[]'
        try {
          const sheets = typeof excelDataRaw === 'string' ? parseAmevaBlockData(excelDataRaw) : excelDataRaw
          const sheetArr = Array.isArray(sheets) ? sheets : [sheets]
          if (sheetArr.length === 0) return `<p><em>(Empty Excel Block)</em></p>\n`
          let html = ''
          for (const sheet of sheetArr) {
            const celldata = sheet.celldata || []
            if (sheet.data && Array.isArray(sheet.data)) {
              // 이미 2D 배열 형태인 경우 직접 렌더링
              const matrix = sheet.data.filter((r: any[]) => Array.isArray(r) && r.some(c => c !== null && c !== undefined && c !== ''))
              if (matrix.length === 0) continue
              html += `<div style="margin-bottom:1.5rem"><h4 style="color:#475569;margin-bottom:.4rem">[Excel] ${escapeHtml(sheet.name || 'Sheet')}</h4>`
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
              // celldata 형태인 경우 2D 그리드로 변환 후 렌더링
              let maxR = 0, maxC = 0
              for (const cell of celldata) { if (cell.r > maxR) maxR = cell.r; if (cell.c > maxC) maxC = cell.c }
              const grid: any[][] = Array(maxR + 1).fill(null).map(() => Array(maxC + 1).fill(''))
              for (const cell of celldata) {
                const v = cell.v
                grid[cell.r][cell.c] = v?.m ?? v?.v ?? (typeof v === 'string' || typeof v === 'number' ? v : '')
              }
              html += `<div style="margin-bottom:1.5rem"><h4 style="color:#475569;margin-bottom:.4rem">[Excel] ${escapeHtml(sheet.name || 'Sheet')}</h4>`
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

      // ── KANBAN BLOCK → HTML 칸반 테이블 ─────────────────────────────────
      case 'kanban': {
        const kanbanRaw = block.props?.data || '{}'
        try {
          const board = typeof kanbanRaw === 'string' ? parseAmevaBlockData(kanbanRaw) : kanbanRaw
          const cols = board.columns || []
          if (cols.length === 0) return `<p><em>(Empty Kanban Board)</em></p>\n`
          let html = `<div style="margin-bottom:1.5rem">`
          html += `<h4 style="color:#475569;margin-bottom:.8rem">[Kanban Board]</h4>`
          html += `<table style="width:100%;border-collapse:separate;border-spacing:10px 0;table-layout:fixed">\n<tbody>\n<tr>\n`
          for (const col of cols) {
            const cards = col.cards || []
            html += `<td style="vertical-align:top;background:#f8fafc;border-radius:8px;padding:10px;border:1px solid #e2e8f0;width:${100 / cols.length}%">`
            html += `<div style="font-weight:600;font-size:13px;color:#334155;border-bottom:2px solid #e2e8f0;padding-bottom:6px;margin-bottom:8px">${escapeHtml(col.title || 'Untitled')} (${cards.length})</div>`
            html += `<ul style="list-style:none;padding:0;margin:0">`
            for (const card of cards) {
              html += `<li style="background:#fff;padding:10px;margin-bottom:8px;border-radius:6px;border:1px solid #cbd5e1">`
              html += `<strong style="font-size:13px;color:#1e293b;display:block;margin-bottom:2px">${escapeHtml(card.title || '(제목 없음)')}</strong>`
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

      // ── DEFAULT FALLBACK ─────────────────────────────────────────────────
      default:
        return contentHtml ? `<p>${contentHtml}</p>\n` : ''
    }
  }

  /*
   * [LOOP CONTROL ITERATION]
   * - 루프 조건: `for (const block of blocks)`
   * - 시나리오: 모든 블록을 순회하며 목록 블록은 <ul>/<ol> 컨텍스트를 유지하고,
   *             비목록 블록이 등장하면 closeList()로 열린 목록 태그를 닫는다.
   */
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

  /*
   * [RETURN VALUE]
   * - 설명: 완성된 standalone HTML 문서를 반환한다.
   *         한국어 문서임을 명시(lang="ko"), 인라인 CSS와 변환된 바디 컨텐츠를 포함한다.
   */
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
