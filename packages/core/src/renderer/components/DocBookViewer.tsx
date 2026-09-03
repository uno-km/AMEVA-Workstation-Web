/**
 * @file DocBookViewer.tsx
 * @system AMEVA OS Desktop Workstation
 * @role PDF / MS Word 스타일 2장 펼침(Dual-Page), 1장, 3장 문서 뷰어 컴포넌트
 * @mechanism A4 표준 용지 슬롯 기반 정밀 페이지네이션 및 테마 100% 동기화
 */

import React, { useMemo } from 'react'
import { ChevronLeft, ChevronRight, Edit3 } from 'lucide-react'
import { paginateBlocks, type PageChunk } from '../utils/documentPaginator'

interface DocBookViewerProps {
  blocks: any[]
  currentContent?: string
  viewMode: 'single' | 'dual' | 'triple' | 'page-break'
  theme: string
  currentPage: number
  onPageChange: (page: number) => void
  onSwitchToContinuous: () => void
}

export function DocBookViewer({
  blocks,
  currentContent,
  viewMode,
  theme,
  currentPage,
  onPageChange,
  onSwitchToContinuous,
}: DocBookViewerProps) {
  // 1. 블록들을 A4 표준 높이(780px 가용 높이) 기준으로 정확히 분할
  const pages = useMemo(() => {
    return paginateBlocks(blocks, 780, currentContent)
  }, [blocks, currentContent])

  const totalPages = Math.max(1, pages.length)

  // 2. 현재 화면에 표시할 페이지들 계산 (PDF / 워드 2장 펼침 표준 방식)
  const visiblePages = useMemo(() => {
    if (viewMode === 'page-break') {
      return pages
    }
    if (viewMode === 'single') {
      const idx = Math.min(Math.max(1, currentPage), totalPages) - 1
      return [pages[idx] || { pageNumber: 1, blocks: [], estimatedHeight: 0 }]
    }
    if (viewMode === 'dual') {
      // 2장 펼침: 1-2, 3-4, 5-6 ...
      const p1 = currentPage % 2 === 0 ? currentPage - 1 : currentPage
      const p2 = p1 + 1
      const res: PageChunk[] = []
      if (p1 >= 1 && p1 <= totalPages) res.push(pages[p1 - 1])
      if (p2 <= totalPages) {
        res.push(pages[p2 - 1])
      } else {
        // 마지막 홀수 페이지일 때 빈 우측 페이지 채움
        res.push({ pageNumber: p2, blocks: [], estimatedHeight: 0 })
      }
      return res
    }
    if (viewMode === 'triple') {
      // 3장 펼침: 1-3, 4-6 ...
      const p1 = currentPage
      const res: PageChunk[] = []
      for (let i = 0; i < 3; i++) {
        const p = p1 + i
        if (p <= totalPages) {
          res.push(pages[p - 1])
        } else {
          res.push({ pageNumber: p, blocks: [], estimatedHeight: 0 })
        }
      }
      return res
    }
    return pages
  }, [viewMode, currentPage, totalPages, pages])

  // 단일 블록 렌더링 (에디터 본연의 텍스트 색상 및 스타일 100% 보존)
  const renderBlockItem = (block: any) => {
    if (!block) return null

    if (block.type === 'heading') {
      const level = block.props?.level || 1
      const text = getBlockPlainText(block)
      const Tag = (`h${Math.min(level, 6)}` as keyof JSX.IntrinsicElements)
      const fontSizes = ['22px', '18px', '16px', '14px', '13px', '12px']
      return (
        <Tag
          key={block.id}
          style={{
            fontSize: fontSizes[level - 1] || '15px',
            fontWeight: 800,
            color: 'var(--text-main)',
            marginTop: level === 1 ? '14px' : '10px',
            marginBottom: '6px',
            lineHeight: 1.35,
          }}
        >
          {text}
        </Tag>
      )
    }

    if (block.type === 'paragraph') {
      const text = getBlockPlainText(block)
      if (!text.trim()) {
        return <div key={block.id} style={{ height: '8px' }} />
      }
      return (
        <p
          key={block.id}
          style={{
            fontSize: '13.5px',
            lineHeight: 1.68,
            color: 'var(--text-main)',
            margin: '5px 0',
            wordBreak: 'break-word',
          }}
        >
          {text}
        </p>
      )
    }

    if (block.type === 'jupyter' || block.type === 'codeBlock') {
      const code = block.props?.code || block.content || ''
      const lang = block.props?.language || 'code'
      return (
        <div
          key={block.id}
          style={{
            background: 'var(--bg-glass-subtle)',
            border: '1px solid var(--border-muted)',
            borderRadius: '6px',
            margin: '10px 0',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '4px 10px',
              background: 'var(--bg-card)',
              borderBottom: '1px solid var(--border-muted)',
              fontSize: '10.5px',
              fontWeight: 700,
              color: 'var(--text-muted)',
            }}
          >
            <span>💻 {lang.toUpperCase()}</span>
            <span style={{ fontSize: '9px', opacity: 0.7 }}>INTERACTIVE CODE</span>
          </div>
          <pre
            style={{
              padding: '10px 12px',
              margin: 0,
              fontFamily: 'Consolas, Monaco, "Courier New", monospace',
              fontSize: '11.5px',
              lineHeight: 1.5,
              color: 'var(--text-main)',
              whiteSpace: 'pre',
              overflowX: 'auto',
            }}
          >
            {code}
          </pre>
        </div>
      )
    }

    if (block.type === 'bulletListItem' || block.type === 'numberedListItem' || block.type === 'checkListItem') {
      const text = getBlockPlainText(block)
      return (
        <div
          key={block.id}
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '8px',
            fontSize: '13px',
            lineHeight: 1.6,
            color: 'var(--text-main)',
            margin: '3px 0',
            paddingLeft: '4px',
          }}
        >
          <span style={{ color: 'var(--primary)', fontWeight: 800 }}>•</span>
          <span>{text}</span>
        </div>
      )
    }

    const fallbackText = getBlockPlainText(block)
    return fallbackText ? (
      <div key={block.id} style={{ margin: '5px 0', fontSize: '13px', color: 'var(--text-main)' }}>
        {fallbackText}
      </div>
    ) : null
  }

  // 독립된 단일 A4 용지 카드 렌더러 (PDF / 워드 용지와 100% 동일한 격리 카드)
  const renderA4PageCard = (page: PageChunk, slotIndex: number, totalSlots: number) => {
    const isLeft = totalSlots === 2 && slotIndex === 0
    const isRight = totalSlots === 2 && slotIndex === 1

    return (
      <div
        key={`page-${page.pageNumber}-${slotIndex}`}
        className="doc-a4-page-card"
        style={{
          flex: viewMode === 'dual' || viewMode === 'triple' ? 1 : undefined,
          width: viewMode === 'single' ? '760px' : viewMode === 'page-break' ? '760px' : undefined,
          maxWidth: viewMode === 'single' ? '92%' : viewMode === 'page-break' ? '92%' : undefined,
          height: viewMode === 'page-break' ? 'auto' : 'calc(100vh - 160px)',
          minHeight: '680px',
          maxHeight: viewMode === 'page-break' ? undefined : '920px',
          background: 'var(--bg-card)',
          color: 'var(--text-main)',
          border: '1px solid var(--border-muted)',
          boxShadow: '0 8px 25px -4px rgba(0, 0, 0, 0.1)',
          borderRadius: isLeft ? '8px 0 0 8px' : isRight ? '0 8px 8px 0' : '8px',
          padding: '36px 44px',
          boxSizing: 'border-box',
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          overflow: 'hidden', // 절대 용지 밖으로 삐져나가지 않음!
          transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        {/* 제본선 중앙 음영 (Dual 모드) */}
        {isLeft && (
          <div
            style={{
              position: 'absolute',
              top: 0,
              right: 0,
              bottom: 0,
              width: '24px',
              background: 'linear-gradient(to left, rgba(0,0,0,0.06), transparent)',
              pointerEvents: 'none',
            }}
          />
        )}
        {isRight && (
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              bottom: 0,
              width: '24px',
              background: 'linear-gradient(to right, rgba(0,0,0,0.06), transparent)',
              pointerEvents: 'none',
            }}
          />
        )}

        {/* 상단 헤더: 문서 및 페이지 라벨 */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingBottom: '8px',
            marginBottom: '12px',
            borderBottom: '1px solid var(--border-muted)',
            fontSize: '10px',
            fontWeight: 700,
            color: 'var(--text-muted)',
            letterSpacing: '0.5px',
          }}
        >
          <span>AMEVA WORKSTATION</span>
          <span>PAGE {page.pageNumber} / {totalPages}</span>
        </div>

        {/* 페이지 본문 영역 */}
        <div style={{ flex: 1, overflowY: 'hidden' }}>
          {page.blocks.length > 0 ? (
            page.blocks.map((b) => renderBlockItem(b))
          ) : (
            <div
              style={{
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--text-muted)',
                fontSize: '11px',
                fontStyle: 'italic',
              }}
            >
              (페이지 내용 없음)
            </div>
          )}
        </div>

        {/* 하단 푸터: 페이지 번호 */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            paddingTop: '8px',
            marginTop: '12px',
            borderTop: '1px solid var(--border-muted)',
            fontSize: '11px',
            fontWeight: 700,
            color: 'var(--text-muted)',
          }}
        >
          <span>— {page.pageNumber} —</span>
        </div>
      </div>
    )
  }

  const p1 = currentPage % 2 === 0 ? currentPage - 1 : currentPage
  const p2 = Math.min(p1 + 1, totalPages)

  return (
    <div
      className="doc-book-viewer-viewport"
      style={{
        width: '100%',
        height: '100%',
        background: 'var(--bg-main)',
        color: 'var(--text-main)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '10px 20px 70px 20px',
        boxSizing: 'border-box',
        position: 'relative',
        overflowY: viewMode === 'page-break' ? 'auto' : 'hidden',
        transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
      }}
    >
      {/* 상단 뷰 모드 정보 바 */}
      <div
        style={{
          width: '100%',
          maxWidth: viewMode === 'dual' ? '98%' : viewMode === 'triple' ? '99%' : '760px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '10px',
          padding: '0 4px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '12px', fontWeight: 800, color: 'var(--text-main)' }}>
            {viewMode === 'page-break' && '📑 A4 페이지 나누기 모드'}
            {viewMode === 'single' && '📄 1장 책보기 모드 (Single Page)'}
            {viewMode === 'dual' && '📖 2장 책 펼침 모드 (Dual Page Spread)'}
            {viewMode === 'triple' && '📚 3장 와이드 스프레드 모드'}
          </span>
          <span
            style={{
              fontSize: '10.5px',
              fontWeight: 700,
              padding: '2px 8px',
              borderRadius: '4px',
              background: 'var(--bg-glass-subtle)',
              border: '1px solid var(--border-muted)',
              color: 'var(--primary)',
            }}
          >
            총 {totalPages} 페이지
          </span>
        </div>

        <button
          onClick={onSwitchToContinuous}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            background: 'var(--primary)',
            color: '#ffffff',
            border: 'none',
            borderRadius: '4px',
            padding: '4px 10px',
            fontSize: '11px',
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          <Edit3 size={11} />
          <span>편집 모드로 복귀 (연속)</span>
        </button>
      </div>

      {/* ─── 페이지 슬롯 배치 영역 (PDF 뷰어와 동일한 배치) ─── */}
      {viewMode === 'page-break' ? (
        /* (1) 페이지 나누기: 세로로 나열되는 여러 장의 A4 카드 */
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px', width: '100%' }}>
          {visiblePages.map((page, idx) => renderA4PageCard(page, idx, 1))}
        </div>
      ) : viewMode === 'dual' ? (
        /* (2) 2장 책 펼침: 화면 98% 꽉 채우는 좌/우 2장의 독립된 A4 종이 + 중앙 제본선 */
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'stretch',
            gap: '0',
            width: '100%',
            maxWidth: '98%',
            flex: 1,
          }}
        >
          {visiblePages.map((page, idx) => (
            <React.Fragment key={page.pageNumber}>
              {renderA4PageCard(page, idx, 2)}
              {idx === 0 && (
                <div
                  style={{
                    width: '6px',
                    background: 'var(--border-muted)',
                    boxShadow: 'inset 0 0 4px rgba(0,0,0,0.15)',
                    zIndex: 2,
                  }}
                />
              )}
            </React.Fragment>
          ))}
        </div>
      ) : viewMode === 'triple' ? (
        /* (3) 3장 와이드: 가로 3장의 독립된 A4 종이 */
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'stretch',
            gap: '12px',
            width: '100%',
            maxWidth: '99%',
            flex: 1,
          }}
        >
          {visiblePages.map((page, idx) => renderA4PageCard(page, idx, 3))}
        </div>
      ) : (
        /* (4) 1장 모드: 화면 중앙에 단 1장의 독립된 A4 종이 */
        <div style={{ display: 'flex', justifyContent: 'center', width: '100%', flex: 1 }}>
          {visiblePages.map((page, idx) => renderA4PageCard(page, idx, 1))}
        </div>
      )}

      {/* ─── 하단 플로팅 페이지 넘김 컨트롤러 (< > 버튼) ─── */}
      {viewMode !== 'page-break' && (
        <div
          style={{
            position: 'fixed',
            bottom: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 100,
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            background: 'var(--bg-card)',
            color: 'var(--text-main)',
            border: '1px solid var(--border-muted)',
            borderRadius: '30px',
            padding: '6px 22px',
            boxShadow: '0 8px 30px rgba(0,0,0,0.18)',
          }}
        >
          <button
            onClick={() => {
              const step = viewMode === 'dual' ? 2 : viewMode === 'triple' ? 3 : 1
              onPageChange(Math.max(1, currentPage - step))
            }}
            disabled={currentPage <= 1}
            style={{
              background: 'transparent',
              border: 'none',
              color: currentPage <= 1 ? 'var(--text-muted)' : 'var(--text-main)',
              cursor: currentPage <= 1 ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '3px',
              fontSize: '12px',
              fontWeight: 800,
              padding: '4px 6px',
            }}
          >
            <ChevronLeft size={16} />
            <span>이전</span>
          </button>

          <span style={{ fontSize: '12px', fontWeight: 800, color: 'var(--primary)' }}>
            {viewMode === 'dual'
              ? `Page ${p1}-${p2} / ${totalPages}`
              : viewMode === 'triple'
              ? `Page ${currentPage}-${Math.min(currentPage + 2, totalPages)} / ${totalPages}`
              : `Page ${currentPage} / ${totalPages}`}
          </span>

          <button
            onClick={() => {
              const step = viewMode === 'dual' ? 2 : viewMode === 'triple' ? 3 : 1
              onPageChange(Math.min(totalPages, currentPage + step))
            }}
            disabled={viewMode === 'dual' ? p2 >= totalPages : currentPage >= totalPages}
            style={{
              background: 'transparent',
              border: 'none',
              color: (viewMode === 'dual' ? p2 >= totalPages : currentPage >= totalPages) ? 'var(--text-muted)' : 'var(--text-main)',
              cursor: (viewMode === 'dual' ? p2 >= totalPages : currentPage >= totalPages) ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '3px',
              fontSize: '12px',
              fontWeight: 800,
              padding: '4px 6px',
            }}
          >
            <span>다음</span>
            <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  )
}

function getBlockPlainText(block: any): string {
  if (!block) return ''
  if (Array.isArray(block.content)) {
    return block.content
      .map((c: any) => (typeof c === 'string' ? c : c.text || ''))
      .join('')
  }
  if (typeof block.content === 'string') return block.content
  return ''
}
