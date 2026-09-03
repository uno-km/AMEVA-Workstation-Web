/**
 * @file PagedBookViewer.tsx
 * @system AMEVA OS Desktop Workstation
 * @role 정밀 페이지 분할 책보기(1장/2장/3장/페이지나누기) 및 3대 스킨 전용 분할 뷰어
 * @responsive 좌우 화면을 가득 채우는 Full-Width 2장 펼침 레이아웃 및 페이지 넘김(<, >)
 */

import React, { useMemo } from 'react'
import { ChevronLeft, ChevronRight, Edit3 } from 'lucide-react'
import { paginateBlocks, type PageChunk } from '../utils/documentPaginator'
import type { PageViewMode, ViewerSkin } from '../hooks/useBookViewerState'

interface PagedBookViewerProps {
  blocks: any[]
  currentContent?: string
  viewMode: PageViewMode
  skin: ViewerSkin
  currentPage: number
  onPageChange: (page: number) => void
  onSwitchToEdit?: () => void
}

export function PagedBookViewer({
  blocks,
  currentContent,
  viewMode,
  skin,
  currentPage,
  onPageChange,
  onSwitchToEdit,
}: PagedBookViewerProps) {
  // 1. 블록들을 A4 높이 기준으로 페이지별 분할
  const pages = useMemo(() => {
    return paginateBlocks(blocks, 920, currentContent)
  }, [blocks, currentContent])

  const totalPages = Math.max(1, pages.length)

  // 2. 현재 화면에 렌더링할 페이지들 계산
  const visiblePages = useMemo(() => {
    if (viewMode === 'page-break') {
      return pages
    }
    if (viewMode === 'single') {
      const idx = Math.min(Math.max(1, currentPage), totalPages) - 1
      return [pages[idx] || { pageNumber: 1, blocks: [], estimatedHeight: 0 }]
    }
    if (viewMode === 'dual') {
      // 2장 책 펼침: 1-2, 3-4, 5-6 ...
      const p1 = currentPage % 2 === 0 ? currentPage - 1 : currentPage
      const p2 = p1 + 1
      const res: PageChunk[] = []
      if (p1 >= 1 && p1 <= totalPages) res.push(pages[p1 - 1])
      if (p2 <= totalPages) {
        res.push(pages[p2 - 1])
      } else {
        // 짝이 안 맞을 경우 빈 페이지 슬롯 채움
        res.push({ pageNumber: p2, blocks: [], estimatedHeight: 0 })
      }
      return res
    }
    if (viewMode === 'triple') {
      // 3장 스프레드: 1-3, 4-6 ...
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

  // 3대 스킨 테마 색상 (선명한 텍스트 대비 보장)
  const skinTheme = useMemo(() => {
    switch (skin) {
      case 'white':
        return {
          bg: '#e2e8f0',
          pageBg: '#ffffff',
          text: '#0f172a',
          textMuted: '#64748b',
          border: '1px solid #cbd5e1',
          shadow: '0 12px 36px rgba(0,0,0,0.12), 0 2px 6px rgba(0,0,0,0.06)',
          gutterLeft: 'linear-gradient(to right, rgba(0,0,0,0.06), transparent 24px)',
          gutterRight: 'linear-gradient(to left, rgba(0,0,0,0.06), transparent 24px)',
          spineBg: '#cbd5e1',
          codeBg: '#f8fafc',
          codeBorder: '#e2e8f0',
          codeText: '#0f172a',
        }
      case 'retro':
        return {
          bg: '#d8cebc',
          pageBg: '#fbf8ee',
          text: '#2d241e',
          textMuted: '#786858',
          border: '1px solid #d4c5b0',
          shadow: '0 12px 32px rgba(80,50,20,0.18), inset 0 0 40px rgba(210,180,140,0.1)',
          gutterLeft: 'linear-gradient(to right, rgba(120,80,40,0.15), transparent 28px)',
          gutterRight: 'linear-gradient(to left, rgba(120,80,40,0.15), transparent 28px)',
          spineBg: '#8c765c',
          codeBg: '#f2ece0',
          codeBorder: '#d8cebc',
          codeText: '#2d241e',
        }
      case 'dark':
      default:
        return {
          bg: '#07090e',
          pageBg: '#111625',
          text: '#f8fafc',
          textMuted: '#94a3b8',
          border: '1px solid rgba(255,255,255,0.1)',
          shadow: '0 20px 50px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.06)',
          gutterLeft: 'linear-gradient(to right, rgba(0,0,0,0.7), transparent 28px)',
          gutterRight: 'linear-gradient(to left, rgba(0,0,0,0.7), transparent 28px)',
          spineBg: '#1e293b',
          codeBg: '#090d16',
          codeBorder: 'rgba(255,255,255,0.1)',
          codeText: '#38bdf8',
        }
    }
  }, [skin])

  // 단일 블록 렌더링
  const renderBlockContent = (block: any) => {
    if (!block) return null

    if (block.type === 'heading') {
      const level = block.props?.level || 1
      const text = getBlockPlainText(block)
      const Tag = (`h${Math.min(level, 6)}` as keyof JSX.IntrinsicElements)
      const sizes = ['24px', '20px', '17px', '15px', '13px', '12px']
      return (
        <Tag
          key={block.id}
          style={{
            fontSize: sizes[level - 1] || '16px',
            fontWeight: 700,
            color: skinTheme.text,
            marginTop: level === 1 ? '16px' : '12px',
            marginBottom: '8px',
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
        return <div key={block.id} style={{ height: '12px' }} />
      }
      return (
        <p
          key={block.id}
          style={{
            fontSize: '14px',
            lineHeight: 1.68,
            color: skinTheme.text,
            margin: '6px 0',
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
            background: skinTheme.codeBg,
            border: `1px solid ${skinTheme.codeBorder}`,
            borderRadius: '6px',
            margin: '12px 0',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '5px 12px',
              background: skin === 'white' ? '#edf2f7' : skin === 'retro' ? '#e7decb' : '#141a29',
              borderBottom: `1px solid ${skinTheme.codeBorder}`,
              fontSize: '11px',
              fontWeight: 700,
              color: skinTheme.textMuted,
            }}
          >
            <span>💻 {lang.toUpperCase()}</span>
            <span style={{ fontSize: '9.5px', opacity: 0.8 }}>AMEVA Interactive Sandbox</span>
          </div>
          <pre
            style={{
              padding: '12px 14px',
              margin: 0,
              fontFamily: 'Consolas, "JetBrains Mono", monospace',
              fontSize: '12px',
              lineHeight: 1.55,
              color: skinTheme.codeText,
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
            fontSize: '13.5px',
            lineHeight: 1.6,
            color: skinTheme.text,
            margin: '4px 0',
            paddingLeft: '6px',
          }}
        >
          <span style={{ color: '#38bdf8', fontWeight: 700 }}>•</span>
          <span>{text}</span>
        </div>
      )
    }

    const fallbackText = getBlockPlainText(block)
    return fallbackText ? (
      <div key={block.id} style={{ margin: '6px 0', fontSize: '13.5px', color: skinTheme.text }}>
        {fallbackText}
      </div>
    ) : null
  }

  // 단일 A4 종이 카드 렌더러
  const renderA4PageSheet = (page: PageChunk, slotIndex: number, totalSlots: number) => {
    const isLeftPage = totalSlots === 2 && slotIndex === 0
    const isRightPage = totalSlots === 2 && slotIndex === 1

    return (
      <div
        key={`page-${page.pageNumber}-${slotIndex}`}
        className={`a4-page-sheet skin-${skin}`}
        style={{
          flex: viewMode === 'dual' || viewMode === 'triple' ? 1 : undefined,
          width: viewMode === 'single' ? '840px' : viewMode === 'page-break' ? '840px' : undefined,
          maxWidth: viewMode === 'single' ? '92%' : viewMode === 'page-break' ? '92%' : undefined,
          minHeight: viewMode === 'triple' ? '680px' : '840px',
          background: skinTheme.pageBg,
          color: skinTheme.text,
          border: skinTheme.border,
          boxShadow: skinTheme.shadow,
          borderRadius: isLeftPage ? '8px 0 0 8px' : isRightPage ? '0 8px 8px 0' : '8px',
          padding: viewMode === 'triple' ? '32px 32px' : '44px 48px',
          boxSizing: 'border-box',
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          overflow: 'hidden',
          transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        {/* 제본 안쪽 그림자 (Dual 모드) */}
        {isLeftPage && (
          <div
            style={{
              position: 'absolute',
              top: 0,
              right: 0,
              bottom: 0,
              width: '28px',
              background: skinTheme.gutterRight,
              pointerEvents: 'none',
            }}
          />
        )}
        {isRightPage && (
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              bottom: 0,
              width: '28px',
              background: skinTheme.gutterLeft,
              pointerEvents: 'none',
            }}
          />
        )}

        {/* 상단 헤더: 문서명 및 페이지 라벨 */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingBottom: '8px',
            marginBottom: '14px',
            borderBottom: skin === 'white' ? '1px solid #f1f5f9' : '1px solid rgba(255,255,255,0.06)',
            fontSize: '10.5px',
            fontWeight: 700,
            color: skinTheme.textMuted,
            letterSpacing: '0.5px',
          }}
        >
          <span>AMEVA WORKSTATION</span>
          <span>PAGE {page.pageNumber} / {totalPages}</span>
        </div>

        {/* 본문 콘텐츠 영역 */}
        <div style={{ flex: 1 }}>
          {page.blocks.length > 0 ? (
            page.blocks.map((b) => renderBlockContent(b))
          ) : (
            <div
              style={{
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: skinTheme.textMuted,
                fontSize: '11px',
                fontStyle: 'italic',
              }}
            >
              (페이지 내용 없음)
            </div>
          )}
        </div>

        {/* 하단 푸터: 페이지 번호 배지 */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            paddingTop: '10px',
            marginTop: '16px',
            borderTop: skin === 'white' ? '1px solid #f1f5f9' : '1px solid rgba(255,255,255,0.06)',
            fontSize: '11.5px',
            fontWeight: 700,
            color: skinTheme.textMuted,
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
      className={`paged-book-viewer-canvas skin-${skin}`}
      style={{
        width: '100%',
        minHeight: '100%',
        background: skinTheme.bg,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '16px 20px 80px 20px',
        boxSizing: 'border-box',
        position: 'relative',
        transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
      }}
    >
      {/* 상단 뷰 모드 알림 바 */}
      <div
        style={{
          width: '100%',
          maxWidth: viewMode === 'dual' ? '98%' : viewMode === 'triple' ? '99%' : '840px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '12px',
          padding: '0 4px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span
            style={{
              fontSize: '12px',
              fontWeight: 800,
              color: skinTheme.text,
            }}
          >
            {viewMode === 'page-break' && '📑 페이지 나누기 모드 (A4 규격 분할)'}
            {viewMode === 'single' && '📄 1장 책보기 모드 (Single A4 Page)'}
            {viewMode === 'dual' && '📖 2장 책 펼침 모드 (Dual-Page Spread)'}
            {viewMode === 'triple' && '📚 3장 와이드 스프레드 모드 (Triple-Page Spread)'}
          </span>
          <span
            style={{
              fontSize: '10.5px',
              fontWeight: 700,
              padding: '2px 8px',
              borderRadius: '4px',
              background: 'rgba(56, 189, 248, 0.15)',
              color: '#38bdf8',
            }}
          >
            총 {totalPages} 페이지
          </span>
        </div>

        {onSwitchToEdit && (
          <button
            onClick={onSwitchToEdit}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              background: '#2563eb',
              color: '#ffffff',
              border: 'none',
              borderRadius: '4px',
              padding: '4px 10px',
              fontSize: '11px',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 2px 6px rgba(37, 99, 235, 0.3)',
            }}
          >
            <Edit3 size={11} />
            <span>편집 모드로 복귀 (연속)</span>
          </button>
        )}
      </div>

      {/* ─── 페이지 슬롯 렌더링 ─── */}
      {viewMode === 'page-break' ? (
        /* (1) 페이지 나누기: 세로로 나열되는 여러 장의 A4 카드 */
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '24px',
            width: '100%',
          }}
        >
          {visiblePages.map((page, idx) => renderA4PageSheet(page, idx, 1))}
        </div>
      ) : viewMode === 'dual' ? (
        /* (2) 2장 책 펼침: 화면 98% 꽉 채우는 좌/우 2장 카드 + 중앙 제본선 */
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'stretch',
            gap: '0',
            width: '100%',
            maxWidth: '98%',
          }}
        >
          {visiblePages.map((page, idx) => (
            <React.Fragment key={page.pageNumber}>
              {renderA4PageSheet(page, idx, 2)}
              {idx === 0 && (
                <div
                  style={{
                    width: '8px',
                    background: skinTheme.spineBg,
                    boxShadow: 'inset 0 0 6px rgba(0,0,0,0.3)',
                    zIndex: 2,
                  }}
                />
              )}
            </React.Fragment>
          ))}
        </div>
      ) : viewMode === 'triple' ? (
        /* (3) 3장 와이드: 가로 3장 카드 */
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'stretch',
            gap: '14px',
            width: '100%',
            maxWidth: '99%',
          }}
        >
          {visiblePages.map((page, idx) => renderA4PageSheet(page, idx, 3))}
        </div>
      ) : (
        /* (4) 1장 모드: 중앙 단 1장의 A4 카드 */
        <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
          {visiblePages.map((page, idx) => renderA4PageSheet(page, idx, 1))}
        </div>
      )}

      {/* ─── 하단 플로팅 페이지 네비게이터 바 (< > 넘김 버튼) ─── */}
      {viewMode !== 'page-break' && (
        <div
          style={{
            position: 'fixed',
            bottom: '24px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 100,
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            background: skin === 'white' ? 'rgba(255,255,255,0.95)' : 'rgba(15,23,42,0.95)',
            color: skinTheme.text,
            backdropFilter: 'blur(16px)',
            border: skin === 'white' ? '1px solid rgba(0,0,0,0.12)' : '1px solid rgba(255,255,255,0.15)',
            borderRadius: '30px',
            padding: '6px 22px',
            boxShadow: '0 12px 36px rgba(0,0,0,0.45)',
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
              color: currentPage <= 1 ? '#64748b' : skinTheme.text,
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

          <span style={{ fontSize: '12px', fontWeight: 800, color: '#38bdf8' }}>
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
              color: (viewMode === 'dual' ? p2 >= totalPages : currentPage >= totalPages) ? '#64748b' : skinTheme.text,
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
