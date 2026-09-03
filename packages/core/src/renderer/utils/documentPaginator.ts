/**
 * @file documentPaginator.ts
 * @system AMEVA OS Desktop Workstation - Renderer
 * @role 마크다운 및 BlockNote 블록들을 A4 용지 높이(twips/pixels) 기준으로 정밀 분할하는 페이지네이터
 */

export interface PageChunk<T = any> {
  pageNumber: number
  blocks: T[]
  estimatedHeight: number
}

// A4 표준 규격: 794px × 1123px (상하 마진 제외 가용 높이 약 900px)
const A4_MAX_PAGE_HEIGHT = 920

/**
 * 단일 블록의 대략적인 픽셀 렌더링 높이를 추정합니다.
 */
export function estimateSingleBlockHeight(block: any): number {
  if (!block) return 0

  // 강제 페이지 나누기 블록 또는 hr 태그 감지
  if (block.type === 'pageBreak') return 99999
  
  if (block.type === 'heading') {
    const level = block.props?.level || 1
    if (level === 1) return 85
    if (level === 2) return 65
    return 50
  }

  if (block.type === 'paragraph') {
    let text = ''
    if (Array.isArray(block.content)) {
      text = block.content.map((c: any) => (typeof c === 'string' ? c : c.text || '')).join('')
    } else if (typeof block.content === 'string') {
      text = block.content
    }
    const lines = Math.max(1, Math.ceil((text.length || 1) / 48))
    return lines * 24 + 14
  }

  if (block.type === 'jupyter' || block.type === 'codeBlock') {
    const customH = parseInt(block.props?.height, 10)
    if (!isNaN(customH) && customH > 100) return Math.min(customH, 500)
    const code = block.props?.code || ''
    const lineCount = Math.max(2, code.split('\n').length)
    return Math.min(lineCount * 20 + 90, 480)
  }

  if (block.type === 'excel' || block.type === 'kanban') {
    return 420
  }

  if (block.type === 'table') {
    const rows = block.content?.rows?.length || 4
    return rows * 36 + 40
  }

  if (block.type === 'image') {
    return 360
  }

  if (block.type === 'bulletListItem' || block.type === 'numberedListItem' || block.type === 'checkListItem') {
    return 32
  }

  // 기본 기타 블록
  return 50
}

/**
 * 마크다운 원문 텍스트를 간이 블록 구조로 파싱합니다 (에디터 블록이 비어있을 때의 폴백).
 */
export function parseMarkdownToSimpleBlocks(markdown: string): any[] {
  if (!markdown || !markdown.trim()) return []
  const lines = markdown.split('\n')
  const blocks: any[] = []
  let inCodeBlock = false
  let codeBuffer: string[] = []
  let codeLang = ''

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]

    if (line.startsWith('```')) {
      if (!inCodeBlock) {
        inCodeBlock = true
        codeLang = line.replace(/```/, '').trim() || 'code'
        codeBuffer = []
      } else {
        inCodeBlock = false
        blocks.push({
          id: `raw-code-${blocks.length}`,
          type: 'codeBlock',
          props: { language: codeLang, code: codeBuffer.join('\n') },
          content: codeBuffer.join('\n'),
        })
        codeBuffer = []
      }
      continue
    }

    if (inCodeBlock) {
      codeBuffer.push(line)
      continue
    }

    if (line.startsWith('#')) {
      const match = line.match(/^(#{1,6})\s+(.*)$/)
      if (match) {
        blocks.push({
          id: `raw-heading-${blocks.length}`,
          type: 'heading',
          props: { level: match[1].length },
          content: match[2],
        })
        continue
      }
    }

    if (line.trim() === '---' || line.trim() === '***') {
      blocks.push({
        id: `raw-hr-${blocks.length}`,
        type: 'pageBreak',
      })
      continue
    }

    if (line.trim()) {
      blocks.push({
        id: `raw-p-${blocks.length}`,
        type: 'paragraph',
        content: line,
      })
    }
  }

  return blocks
}

/**
 * 블록 리스트를 A4 가용 높이(920px)에 맞추어 페이지별로 분할합니다.
 */
export function paginateBlocks<T = any>(
  blocks: T[],
  maxHeight: number = A4_MAX_PAGE_HEIGHT,
  fallbackMarkdown?: string
): PageChunk<T>[] {
  let targetBlocks = blocks
  if ((!targetBlocks || targetBlocks.length === 0) && fallbackMarkdown) {
    targetBlocks = parseMarkdownToSimpleBlocks(fallbackMarkdown) as T[]
  }

  if (!targetBlocks || targetBlocks.length === 0) {
    return [{ pageNumber: 1, blocks: [], estimatedHeight: 0 }]
  }

  const pages: PageChunk<T>[] = []
  let currentPageBlocks: T[] = []
  let currentHeight = 0
  let pageNumber = 1

  for (let i = 0; i < targetBlocks.length; i++) {
    const block = targetBlocks[i]
    const blockH = estimateSingleBlockHeight(block)

    // 강제 페이지 나눔이거나 현재 페이지 높이를 초과하는 경우
    if (blockH >= 99999 || (currentHeight + blockH > maxHeight && currentPageBlocks.length > 0)) {
      pages.push({
        pageNumber,
        blocks: currentPageBlocks,
        estimatedHeight: currentHeight,
      })
      pageNumber++
      currentPageBlocks = blockH >= 99999 ? [] : [block]
      currentHeight = blockH >= 99999 ? 0 : blockH
    } else {
      currentPageBlocks.push(block)
      currentHeight += blockH
    }
  }

  if (currentPageBlocks.length > 0 || pages.length === 0) {
    pages.push({
      pageNumber,
      blocks: currentPageBlocks,
      estimatedHeight: currentHeight,
    })
  }

  return pages
}
