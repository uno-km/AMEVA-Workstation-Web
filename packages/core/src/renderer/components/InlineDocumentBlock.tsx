/**
 * @file InlineDocumentBlock.tsx
 * @system AMEVA OS Desktop Workstation
 * @location src/renderer/components/InlineDocumentBlock.tsx
 * @role 에디터 내 인라인 문서 뷰어 블록 (PDF / PPTX / DOCX / XLSX)
 *
 * [책임 범위 - RESPONSIBILITY]
 * - 에디터 내에 PDF, PowerPoint, Word, Excel 파일을 인라인으로 임베딩한다.
 * - 슬래시 메뉴 (/pdf, /ppt, /word, /excel)를 통해 삽입된다.
 * - PDF는 pdfjs-dist Canvas 렌더링, Office 파일은 iframe 기반 Office Online으로 표시.
 * - 파일은 로컬 업로드(base64) 또는 URL로 제공할 수 있다.
 *
 * [소비처 - CONSUMERS / USAGE CONTEXT]
 * - 소비처 A (amevaBlockSchema.ts): 커스텀 블록으로 등록.
 * - 소비처 B (customSlashMenuItems.tsx): 슬래시 메뉴 항목으로 노출.
 */

import React, { useState, useRef, useCallback, useEffect } from 'react'
import { createReactBlockSpec } from '@blocknote/react'
import { Upload, FileText, FileSpreadsheet, Presentation, FileType2, X, Maximize2, Minimize2, ExternalLink, Dna } from 'lucide-react'
import * as pdfjsLib from 'pdfjs-dist'
import { saveAttachment, getAttachment } from '../utils/vfsDatabase'
import { useDocumentProfilerStore } from '../stores/useDocumentProfilerStore'
import { DocumentProfileModal } from './DocumentProfileModal'
// @ts-ignore
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.mjs?url'

// Worker CSP 대응 (Blob Module Worker)
const workerBlob = new Blob([`import '${pdfWorkerUrl}';`], { type: 'application/javascript' })
const workerBlobUrl = URL.createObjectURL(workerBlob)
pdfjsLib.GlobalWorkerOptions.workerPort = new Worker(workerBlobUrl, { type: 'module' })

export type DocType = 'pdf' | 'pptx' | 'docx' | 'xlsx' | 'unknown'

function detectDocType(fileName: string, mimeType?: string): DocType {
  const ext = fileName.split('.').pop()?.toLowerCase() || ''
  if (ext === 'pdf' || mimeType?.includes('pdf')) return 'pdf'
  if (['pptx', 'ppt'].includes(ext)) return 'pptx'
  if (['docx', 'doc'].includes(ext)) return 'docx'
  if (['xlsx', 'xls'].includes(ext)) return 'xlsx'
  return 'unknown'
}

export const DOC_TYPE_CONFIG: Record<DocType, { label: string; color: string; icon: React.ReactNode }> = {
  pdf:     { label: 'PDF',         color: '#ef4444', icon: <FileText size={16} /> },
  pptx:    { label: 'PowerPoint',  color: '#f97316', icon: <Presentation size={16} /> },
  docx:    { label: 'Word',        color: '#3b82f6', icon: <FileType2 size={16} /> },
  xlsx:    { label: 'Excel',       color: '#22c55e', icon: <FileSpreadsheet size={16} /> },
  unknown: { label: '문서',        color: '#8b5cf6', icon: <FileText size={16} /> },
}

function MiniContinuousPageCanvas({ pdf, pageNum, isActive, onVisible }: any) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const taskRef = useRef<any>(null)

  useEffect(() => {
    if (!containerRef.current) return
    const obs = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) onVisible(pageNum)
    }, { threshold: 0.2 })
    obs.observe(containerRef.current)
    return () => obs.disconnect()
  }, [pageNum, onVisible])

  useEffect(() => {
    if (!pdf || !canvasRef.current) return
    const obs = new IntersectionObserver(async (entries) => {
      if (!entries[0].isIntersecting) return
      obs.disconnect()
      if (taskRef.current) try { taskRef.current.cancel() } catch {}
      try {
        const page = await pdf.getPage(pageNum)
        const vp = page.getViewport({ scale: 1.2 })
        const c = canvasRef.current!
        const dpr = window.devicePixelRatio || 1
        c.width = Math.floor(vp.width * dpr)
        c.height = Math.floor(vp.height * dpr)
        c.style.width = `${vp.width}px`
        c.style.height = `${vp.height}px`
        const ctx = c.getContext('2d')!
        ctx.scale(dpr, dpr)
        const task = page.render({ canvasContext: ctx, viewport: vp })
        taskRef.current = task
        await task.promise
        page.cleanup()
      } catch {}
    }, { rootMargin: '300px 0px' })
    if (containerRef.current) obs.observe(containerRef.current)
    return () => obs.disconnect()
  }, [pdf, pageNum])

  return (
    <div ref={containerRef} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 16, flexShrink: 0 }}>
      <div style={{ fontSize: 9, color: isActive ? '#3b82f6' : '#64748b', marginBottom: 4, fontWeight: isActive ? 700 : 400 }}>{pageNum}</div>
      <div style={{
        boxShadow: isActive ? '0 0 0 2px #3b82f6, 0 8px 32px rgba(0,0,0,0.6)' : '0 4px 24px rgba(0,0,0,0.5)',
        borderRadius: 3, overflow: 'hidden', background: '#fff', transition: 'box-shadow 0.2s',
      }}>
        <canvas ref={canvasRef} />
      </div>
    </div>
  )
}

/** PDF Mini Viewer (Canvas 렌더링) - 향상된 UX 버전 */
export function PdfMiniViewer({ 
  sourceUrl, height, savedBookmarks = [], onBookmarksChange 
}: { 
  sourceUrl: string; height: number;
  savedBookmarks?: { page: number, label: string }[];
  onBookmarksChange?: (b: { page: number, label: string }[]) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [numPages, setNumPages] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const pdfRef = useRef<any>(null)
  const [outlines, setOutlines] = useState<any[]>([])
  const [sidebarMode, setSidebarMode] = useState<'thumbnail' | 'outline' | 'bookmark'>('thumbnail')
  const [showSidebar, setShowSidebar] = useState(true)
  const [thumbnails, setThumbnails] = useState<Record<number, string>>({})
  const [hoveredArrow, setHoveredArrow] = useState<'left' | 'right' | null>(null)
  const [slideDir, setSlideDir] = useState<'left' | 'right' | 'none'>('none')
  const observerRefs = useRef<Map<number, IntersectionObserver>>(new Map())

  const [continuousScroll, setContinuousScroll] = useState(true)
  const dragStartRef = useRef<{ x: number, y: number } | null>(null)
  const [bookmarks, setBookmarks] = useState<{ page: number; label: string }[]>(savedBookmarks)

  useEffect(() => {
    setBookmarks(savedBookmarks)
  }, [savedBookmarks])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    setThumbnails({})
    setOutlines([])
    let objectUrlToRevoke: string | null = null

    const loadPdf = async () => {
      try {
        let getDocumentArg: any = sourceUrl
        if (sourceUrl.startsWith('ameva-vfs://')) {
          const fileId = sourceUrl.replace('ameva-vfs://', '')
          const blob = await getAttachment(fileId)
          if (!blob) throw new Error('VFS_EXPIRED')
          const objectUrl = URL.createObjectURL(blob)
          objectUrlToRevoke = objectUrl
          getDocumentArg = { url: objectUrl }
        } else if (sourceUrl.startsWith('data:')) {
          const cleanBase64 = sourceUrl.split(',')[1] || ''
          const binaryString = atob(cleanBase64.replace(/\s/g, ''))
          const len = binaryString.length
          const bytes = new Uint8Array(len)
          for (let i = 0; i < len; i++) bytes[i] = binaryString.charCodeAt(i)
          getDocumentArg = { data: bytes }
        }

        const pdf = await pdfjsLib.getDocument(getDocumentArg).promise
        if (cancelled) return
        pdfRef.current = pdf
        setNumPages(pdf.numPages)
        setLoading(false)
        try {
          const outline = await pdf.getOutline()
          if (!cancelled) setOutlines(outline || [])
        } catch {}
      } catch (e: any) {
        if (!cancelled) {
          if (sourceUrl.startsWith('blob:') || e.message === 'VFS_EXPIRED') {
            setError('임시 파일이 만료되었거나 로드에 실패했습니다. 문서를 다시 업로드해주세요.')
          } else {
            setError(e?.message || 'PDF 로드 실패')
          }
          setLoading(false)
        }
      }
    }

    if (sourceUrl) loadPdf()
    return () => {
      cancelled = true
      if (objectUrlToRevoke) URL.revokeObjectURL(objectUrlToRevoke)
      observerRefs.current.forEach(o => o.disconnect())
      observerRefs.current.clear()
    }
  }, [sourceUrl])

  // 현재 페이지 렌더링
  useEffect(() => {
    if (!pdfRef.current || loading) return
    const renderPage = async () => {
      try {
        const page = await pdfRef.current.getPage(currentPage)
        const canvas = canvasRef.current
        if (!canvas) return
        const viewport = page.getViewport({ scale: 1.2 })
        const dpr = window.devicePixelRatio || 1
        canvas.width = Math.floor(viewport.width * dpr)
        canvas.height = Math.floor(viewport.height * dpr)
        canvas.style.width = `${viewport.width}px`
        canvas.style.height = `${viewport.height}px`
        const ctx = canvas.getContext('2d')!
        ctx.scale(dpr, dpr)
        await page.render({ canvasContext: ctx, viewport }).promise
        page.cleanup()
      } catch {}
    }
    renderPage()
  }, [currentPage, loading])

  const goToPage = (page: number, dir?: 'left' | 'right') => {
    const p = Math.max(1, Math.min(numPages, page))
    if (p === currentPage) return
    const d = dir ?? (p > currentPage ? 'left' : 'right')
    setSlideDir(d)
    setTimeout(() => {
      setCurrentPage(p)
      setSlideDir('none')
    }, 10)
  }

  const toggleBookmark = () => {
    setBookmarks(prev => {
      const exists = prev.find(b => b.page === currentPage)
      const next = exists ? prev.filter(b => b.page !== currentPage) : [...prev, { page: currentPage, label: `페이지 ${currentPage}` }].sort((a,b) => a.page - b.page)
      onBookmarksChange?.(next)
      return next
    })
  }
  const isBookmarked = bookmarks.some(b => b.page === currentPage)

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (continuousScroll) return
    dragStartRef.current = { x: e.clientX, y: e.clientY }
    e.currentTarget.setPointerCapture(e.pointerId)
  }
  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragStartRef.current || continuousScroll) return
    e.currentTarget.releasePointerCapture(e.pointerId)
    const dx = e.clientX - dragStartRef.current.x
    if (Math.abs(dx) > 50) {
      if (dx > 0 && currentPage > 1) goToPage(currentPage - 1, 'right')
      else if (dx < 0 && currentPage < numPages) goToPage(currentPage + 1, 'left')
    }
    dragStartRef.current = null
  }

  // 썸네일 lazy 렌더링 (IntersectionObserver)
  const thumbRef = useCallback((node: HTMLDivElement | null, pageNum: number) => {
    if (!node || !pdfRef.current || thumbnails[pageNum]) return
    if (observerRefs.current.has(pageNum)) return
    const obs = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        obs.disconnect()
        observerRefs.current.delete(pageNum)
        pdfRef.current.getPage(pageNum).then((page: any) => {
          const vp = page.getViewport({ scale: 0.18 })
          const c = document.createElement('canvas')
          c.width = vp.width; c.height = vp.height
          const ctx = c.getContext('2d')!
          page.render({ canvasContext: ctx, viewport: vp }).promise.then(() => {
            setThumbnails(prev => ({ ...prev, [pageNum]: c.toDataURL('image/jpeg', 0.6) }))
            page.cleanup()
          }).catch(() => {})
        }).catch(() => {})
      }
    }, { rootMargin: '150px 0px' })
    obs.observe(node)
    observerRefs.current.set(pageNum, obs)
  }, [pdfRef.current, thumbnails])

  // 목차 재귀 렌더링
  const renderOutline = (items: any[], depth = 0): React.ReactNode =>
    items.map((item, idx) => (
      <div key={idx} style={{ paddingLeft: `${depth * 10}px` }}>
        <div
          style={{
            fontSize: '11px', color: '#cbd5e1', cursor: 'pointer', padding: '5px 4px',
            borderBottom: '1px solid rgba(255,255,255,0.04)',
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}
          onClick={async () => {
            if (item.dest && pdfRef.current) {
              try {
                let dest = item.dest
                if (typeof dest === 'string') dest = await pdfRef.current.getDestination(dest)
                const pageIdx = await pdfRef.current.getPageIndex(dest[0])
                goToPage(pageIdx + 1)
              } catch {}
            }
          }}
          title={item.title}
        >
          {item.title}
        </div>
        {item.items?.length > 0 && renderOutline(item.items, depth + 1)}
      </div>
    ))

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height, color: '#94a3b8', fontSize: 12 }}>
      PDF 로딩 중...
    </div>
  )
  if (error) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height, color: '#f87171', fontSize: 12 }}>
      {error}
    </div>
  )

  const SIDEBAR_W = 140

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height, userSelect: 'none' }}>
      <style>{`
        @keyframes pdfSlideLeft { from { opacity: 0; transform: translateX(40px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes pdfSlideRight { from { opacity: 0; transform: translateX(-40px); } to { opacity: 1; transform: translateX(0); } }
      `}</style>

      {/* 상단 네비 바 */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8, padding: '4px 10px',
        background: 'rgba(0,0,0,0.55)', borderBottom: '1px solid rgba(255,255,255,0.07)', flexShrink: 0,
      }}>
        {/* 사이드바 토글 */}
        <button
          style={{
            background: showSidebar ? 'rgba(59,130,246,0.25)' : 'none', border: 'none',
            cursor: 'pointer', color: showSidebar ? '#60a5fa' : '#64748b',
            padding: '2px 8px', borderRadius: 4, fontSize: 10, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4,
          }}
          onClick={() => setShowSidebar(s => !s)}
          title="사이드바"
        >
          ☰ 패널
        </button>
        <div style={{ width: 1, height: 14, background: 'rgba(255,255,255,0.1)' }} />
        <button
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: continuousScroll ? '#3b82f6' : '#94a3b8', padding: '2px 6px', fontSize: 11, fontWeight: 600 }}
          onClick={() => setContinuousScroll(!continuousScroll)}
          title="연속 스크롤 전환"
        >
          {continuousScroll ? '📜 연속' : '📄 단일'}
        </button>
        <div style={{ width: 1, height: 14, background: 'rgba(255,255,255,0.1)' }} />
        {/* 페이지 이동 */}
        <button
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: '2px 6px', fontSize: 14, lineHeight: 1 }}
          onClick={() => goToPage(currentPage - 1, 'right')}
          disabled={currentPage <= 1}
        >‹</button>
        <span style={{ fontSize: 11, color: '#cbd5e1', minWidth: 50, textAlign: 'center' }}>{currentPage} / {numPages}</span>
        <button
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: '2px 6px', fontSize: 14, lineHeight: 1 }}
          onClick={() => goToPage(currentPage + 1, 'left')}
          disabled={currentPage >= numPages}
        >›</button>
      </div>

      {/* 본체 */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', minHeight: 0 }}>
        {/* 사이드바 */}
        {showSidebar && (
          <div style={{
            width: SIDEBAR_W, flexShrink: 0, display: 'flex', flexDirection: 'column',
            background: 'rgba(8,8,14,0.97)', borderRight: '1px solid rgba(255,255,255,0.07)',
          }}>
            {/* 탭 */}
            <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.08)', flexShrink: 0 }}>
              {(['thumbnail', 'outline', 'bookmark'] as const).map(mode => (
                <button key={mode}
                  style={{
                    flex: 1, padding: '6px 0', fontSize: 10, fontWeight: 600, border: 'none', cursor: 'pointer',
                    background: sidebarMode === mode ? 'rgba(59,130,246,0.15)' : 'transparent',
                    color: sidebarMode === mode ? '#60a5fa' : '#475569',
                    borderBottom: sidebarMode === mode ? '2px solid #3b82f6' : '2px solid transparent',
                    transition: 'all 0.15s',
                  }}
                  onClick={() => setSidebarMode(mode)}
                >
                  {mode === 'thumbnail' ? '페이지' : mode === 'outline' ? '목차' : '🔖'}
                </button>
              ))}
            </div>
            {/* 콘텐츠 */}
            <div style={{ flex: 1, overflowY: 'auto', padding: 6, display: 'flex', flexDirection: 'column', gap: 4 }}>
              {sidebarMode === 'thumbnail' ? (
                Array.from({ length: numPages }).map((_, idx) => {
                  const n = idx + 1
                  const isActive = currentPage === n
                  return (
                    <div
                      key={n}
                      ref={(node) => thumbRef(node, n)}
                      onClick={() => goToPage(n)}
                      style={{
                        cursor: 'pointer', borderRadius: 5, overflow: 'hidden', flexShrink: 0,
                        border: isActive ? '2px solid #3b82f6' : '2px solid transparent',
                        boxShadow: isActive ? '0 0 8px rgba(59,130,246,0.4)' : 'none',
                        background: '#1e1e2e', transition: 'all 0.13s',
                      }}
                    >
                      {thumbnails[n] ? (
                        <img src={thumbnails[n]} alt={`페이지 ${n}`} style={{ width: '100%', display: 'block' }} />
                      ) : (
                        <div style={{
                          width: '100%', aspectRatio: '0.71', background: '#252535',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: 'rgba(255,255,255,0.15)', fontSize: 9,
                        }}>{n}</div>
                      )}
                      <div style={{
                        textAlign: 'center', fontSize: 9, padding: '2px 0', display: 'flex', justifyContent: 'center', gap: 4,
                        color: isActive ? '#60a5fa' : '#475569', fontWeight: isActive ? 700 : 400,
                      }}>
                        {bookmarks.some(b => b.page === n) && <span style={{color:'#fbbf24'}}>🔖</span>}
                        {n}
                      </div>
                    </div>
                  )
                })
              ) : sidebarMode === 'outline' ? (
                outlines.length > 0 ? renderOutline(outlines) : (
                  <div style={{ fontSize: 10, color: '#475569', textAlign: 'center', marginTop: 20 }}>
                    목차가 없습니다
                  </div>
                )
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <button
                    onClick={toggleBookmark}
                    style={{
                      padding: '5px 8px', borderRadius: 4, border: 'none', cursor: 'pointer', fontSize: 10, fontWeight: 600,
                      background: isBookmarked ? 'rgba(251,191,36,0.2)' : 'rgba(255,255,255,0.07)',
                      color: isBookmarked ? '#fbbf24' : '#94a3b8',
                      display: 'flex', alignItems: 'center', gap: 4, marginBottom: 6,
                    }}
                  >
                    🔖 {isBookmarked ? `${currentPage}p 제거` : `${currentPage}p 추가`}
                  </button>
                  {bookmarks.length === 0 ? (
                    <div style={{ fontSize: 10, color: '#475569', textAlign: 'center', marginTop: 20 }}>북마크가 없습니다</div>
                  ) : bookmarks.map(b => (
                    <div key={b.page} style={{
                      display: 'flex', alignItems: 'center', gap: 6,
                      padding: '4px 6px', borderRadius: 4, cursor: 'pointer',
                      background: currentPage === b.page ? 'rgba(59,130,246,0.15)' : 'rgba(255,255,255,0.04)',
                      border: currentPage === b.page ? '1px solid rgba(59,130,246,0.3)' : '1px solid transparent',
                    }}>
                      <span onClick={() => goToPage(b.page)} style={{ flex: 1, fontSize: 10, color: currentPage === b.page ? '#60a5fa' : '#e2e8f0' }}>
                        🔖 {b.label}
                      </span>
                      <button
                        onClick={() => setBookmarks(prev => { 
                          const n = prev.filter(x => x.page !== b.page); 
                          onBookmarksChange?.(n); 
                          return n; 
                        })}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', fontSize: 12, padding: '0 2px', lineHeight: 1 }}
                      >×</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* 캔버스 영역 - 스크롤 컴테이너 + 절대위치 화살표 */}
        <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
          {/* 좌측 화살표 */}
          {!continuousScroll && (
            <button
              onMouseEnter={() => setHoveredArrow('left')}
              onMouseLeave={() => setHoveredArrow(null)}
              onClick={() => goToPage(currentPage - 1, 'right')}
              disabled={currentPage <= 1}
              style={{
                position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)',
                zIndex: 20, width: 30, height: 30, borderRadius: '50%',
                background: hoveredArrow === 'left' && currentPage > 1 ? 'rgba(59,130,246,0.9)' : 'rgba(0,0,0,0.5)',
                border: '1px solid rgba(255,255,255,0.2)', color: '#fff',
                cursor: currentPage <= 1 ? 'default' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                opacity: currentPage <= 1 ? 0.15 : 1,
                transition: 'all 0.18s', fontSize: 16, lineHeight: 1,
                boxShadow: hoveredArrow === 'left' ? '0 0 12px rgba(59,130,246,0.6)' : '0 2px 6px rgba(0,0,0,0.4)',
              }}
            >‹</button>
          )}

          {/* 스크롤 컴테이너 */}
          <div 
            style={{ width: '100%', height: '100%', overflow: 'auto', background: '#1a1a24' }}
            onPointerDown={handlePointerDown}
            onPointerUp={handlePointerUp}
            onPointerCancel={() => { dragStartRef.current = null }}
          >
            {continuousScroll ? (
              <div style={{ padding: '20px 40px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                {Array.from({ length: numPages }).map((_, idx) => (
                  <MiniContinuousPageCanvas
                    key={idx + 1}
                    pdf={pdfRef.current}
                    pageNum={idx + 1}
                    isActive={currentPage === idx + 1}
                    onVisible={setCurrentPage}
                  />
                ))}
              </div>
            ) : (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '10px 50px', minHeight: '100%', alignItems: 'flex-start' }}>
                <canvas
                  ref={canvasRef}
                  style={{
                    boxShadow: '0 2px 20px rgba(0,0,0,0.6)',
                    borderRadius: 3,
                    animation: slideDir === 'left'
                      ? 'pdfSlideLeft 0.22s cubic-bezier(0.2,0.8,0.2,1)'
                      : slideDir === 'right'
                      ? 'pdfSlideRight 0.22s cubic-bezier(0.2,0.8,0.2,1)'
                      : 'none',
                  }}
                />
              </div>
            )}
          </div>

          {/* 우측 화살표 */}
          {!continuousScroll && (
            <button
              onMouseEnter={() => setHoveredArrow('right')}
              onMouseLeave={() => setHoveredArrow(null)}
              onClick={() => goToPage(currentPage + 1, 'left')}
              disabled={currentPage >= numPages}
              style={{
                position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
                zIndex: 20, width: 30, height: 30, borderRadius: '50%',
                background: hoveredArrow === 'right' && currentPage < numPages ? 'rgba(59,130,246,0.9)' : 'rgba(0,0,0,0.5)',
                border: '1px solid rgba(255,255,255,0.2)', color: '#fff',
                cursor: currentPage >= numPages ? 'default' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                opacity: currentPage >= numPages ? 0.15 : 1,
                transition: 'all 0.18s', fontSize: 16, lineHeight: 1,
                boxShadow: hoveredArrow === 'right' ? '0 0 12px rgba(59,130,246,0.6)' : '0 2px 6px rgba(0,0,0,0.4)',
              }}
            >›</button>
          )}
        </div>
      </div>
    </div>
  )
}


function InlineDocumentBlockComponent({ block, editor }: any) {
  const props = block.props as {
    fileName: string
    fileBase64: string
    docType: DocType
    height: string
    width: string
    sourceUrl: string
    isExpanded: string
    bookmarks: string
  }

  const [isDragging, setIsDragging] = useState(false)
  const [localHeight, setLocalHeight] = useState<number | null>(null)
  const [localWidth, setLocalWidth] = useState<number | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const bottomResizerRef = useRef<HTMLDivElement>(null)
  const rightResizerRef = useRef<HTMLDivElement>(null)
  const height = localHeight ?? parseInt(props.height || '420', 10)
  // width: '100%'이면 null(full), 숫자면 px
  const widthStr = props.width || '100%'
  const localWidthNum = localWidth ?? (widthStr === '100%' ? null : parseInt(widthStr, 10))
  const [isExpanded, setIsExpanded] = useState(props.isExpanded === 'true')
  const [showDNA, setShowDNA] = useState(false)

  const { profiles } = useDocumentProfilerStore()
  const fileId = props.sourceUrl?.replace('ameva-vfs://', '')
  const profile = profiles[fileId || '']
  const docType = (props.docType as DocType) || 'unknown'
  const config = DOC_TYPE_CONFIG[docType]

  const isLocalMemory = props.sourceUrl?.startsWith('blob:') || props.sourceUrl?.startsWith('ameva-vfs://') || props.sourceUrl?.startsWith('data:')
  const hasFile = !!props.sourceUrl && isLocalMemory
  const hasUrl = !!props.sourceUrl && !isLocalMemory

  // ── 리사이저: native capture 이벤트 + DOM 직접 조작 (리액트 재렌더 없이 실시간 스무스 리사이즈)
  useEffect(() => {
    const bottomEl = bottomResizerRef.current
    const rightEl = rightResizerRef.current
    const container = containerRef.current
    if (!bottomEl || !container) return

    const stopAll = (e: Event) => {
      e.stopPropagation()
      e.stopImmediatePropagation()
    }

    // ── 상하 리사이저 ──
    const onBottomMouseDown = (e: MouseEvent) => {
      e.preventDefault()
      stopAll(e)
      const startY = e.clientY
      const startH = container.getBoundingClientRect().height

      // iframe 이벤트 스덕 방지 오버레이
      const overlay = document.createElement('div')
      overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;z-index:99999;cursor:ns-resize;'
      document.body.appendChild(overlay)

      const onMove = (mv: MouseEvent) => {
        const newH = Math.min(1000, Math.max(150, startH + mv.clientY - startY))
        container.style.height = newH + 'px'
        // 내부 빷어 내는 뷰어 높이도 동기화
        const viewer = container.querySelector('[data-viewer-inner]') as HTMLElement | null
        if (viewer) viewer.style.height = newH + 'px'
      }
      const onUp = (up: MouseEvent) => {
        document.body.removeChild(overlay)
        window.removeEventListener('mousemove', onMove)
        window.removeEventListener('mouseup', onUp)
        const finalH = Math.min(1000, Math.max(150, startH + up.clientY - startY))
        // React state 전혀 안 쓰고 props만 업데이트 (재렌더가 하이를 돌려준다)
        editor.updateBlock(block.id, { props: { ...props, height: finalH.toString() } })
      }
      window.addEventListener('mousemove', onMove)
      window.addEventListener('mouseup', onUp)
    }

    // ── 좌우 리사이저 ──
    const onRightMouseDown = (e: MouseEvent) => {
      if (!rightEl) return
      e.preventDefault()
      stopAll(e)
      const startX = e.clientX
      const startW = container.getBoundingClientRect().width

      const overlay = document.createElement('div')
      overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;z-index:99999;cursor:ew-resize;'
      document.body.appendChild(overlay)

      const onMove = (mv: MouseEvent) => {
        const newW = Math.min(window.innerWidth - 80, Math.max(300, startW + mv.clientX - startX))
        container.style.width = newW + 'px'
      }
      const onUp = (up: MouseEvent) => {
        document.body.removeChild(overlay)
        window.removeEventListener('mousemove', onMove)
        window.removeEventListener('mouseup', onUp)
        const finalW = Math.min(window.innerWidth - 80, Math.max(300, startW + up.clientX - startX))
        editor.updateBlock(block.id, { props: { ...props, width: finalW.toString() } })
      }
      window.addEventListener('mousemove', onMove)
      window.addEventListener('mouseup', onUp)
    }

    bottomEl.addEventListener('mousedown', onBottomMouseDown, { capture: true })
    rightEl?.addEventListener('mousedown', onRightMouseDown, { capture: true })
    return () => {
      bottomEl.removeEventListener('mousedown', onBottomMouseDown, { capture: true })
      rightEl?.removeEventListener('mousedown', onRightMouseDown, { capture: true })
    }
  // props 객체는 매렌더마다 업데이트되므로 block.id와 editor만 deps로 추적
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [block.id, editor])

  const handleFileUpload = useCallback(async (file: File) => {
    const docT = detectDocType(file.name, file.type)
    const fileId = crypto.randomUUID()
    await saveAttachment(fileId, file)
    const url = `ameva-vfs://${fileId}`
    editor.updateBlock(block.id, {
      type: 'inlineDocument',
      props: { ...props, fileName: file.name, fileBase64: '', sourceUrl: url, docType: docT }
    })
  }, [block.id, editor, props])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFileUpload(file)
  }, [handleFileUpload])

  useEffect(() => {
    if (!hasFile && !hasUrl && props.sourceUrl === '') {
      const timer = setTimeout(() => { fileInputRef.current?.click() }, 100)
      return () => clearTimeout(timer)
    }
  }, [hasFile, hasUrl, props.sourceUrl])

  const handleUrlInput = useCallback(() => {
    const url = window.prompt('문서 URL을 입력하세요:')
    if (!url) return
    const docT = detectDocType(url)
    editor.updateBlock(block.id, {
      props: { ...props, sourceUrl: url, docType: docT, fileName: url.split('/').pop() || '문서' }
    })
  }, [block.id, editor, props])

  const containerStyle: React.CSSProperties = {
    position: 'relative',
    border: `1px solid ${isDragging ? config.color : 'rgba(255,255,255,0.1)'}`,
    borderRadius: 8,
    overflow: 'hidden',
    background: 'var(--bg-panel, #0f0f1a)',
    margin: '4px 0',
    transition: 'border-color 0.2s, width 0.05s',
    userSelect: 'none',
    width: localWidthNum ? `${localWidthNum}px` : '100%',
    maxWidth: '100%',
  }

  // 헤더 바
  const headerBar = (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8, padding: '6px 12px',
      background: `${config.color}18`,
      borderBottom: `1px solid ${config.color}33`,
      flexShrink: 0,
    }}>
      <span style={{ color: config.color }}>{config.icon}</span>
      <span style={{ fontSize: 12, fontWeight: 600, color: '#e2e8f0', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {props.fileName || `${config.label} 문서`}
      </span>
          {docType === 'pdf' && profile && (
            <button
              onClick={() => setShowDNA(true)}
              style={{
                marginLeft: '8px', padding: '4px 10px', background: 'rgba(168, 85, 247, 0.2)', border: '1px solid rgba(168, 85, 247, 0.4)', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', color: '#d8b4fe', fontSize: '11px', fontWeight: 600,
              }}
            >
              <Dna size={12} />
              분석 결과
            </button>
          )}

          <div style={{ marginLeft: 'auto', display: 'flex', gap: 4 }}>
        {(hasFile || hasUrl) && (
          <button
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: 2 }}
            onClick={() => editor.updateBlock(block.id, { props: { ...props, isExpanded: isExpanded ? 'false' : 'true' } })}
            title={isExpanded ? '축소' : '확대'}
          >
            {isExpanded ? <Minimize2 size={12} /> : <Maximize2 size={12} />}
          </button>
        )}
        {hasUrl && (
          <button
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: 2 }}
            onClick={() => window.open(props.sourceUrl, '_blank')}
            title="새 탭에서 열기"
          >
            <ExternalLink size={12} />
          </button>
        )}
        <button
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: 2 }}
          onClick={() => editor.updateBlock(block.id, { props: { ...props, fileBase64: '', sourceUrl: '', fileName: '' } })}
          title="지우기"
        >
          <X size={12} />
        </button>
      </div>
    </div>
  )

  // 파일 없음: 업로드 영역
  if (!hasFile && !hasUrl) {
    return (
      <div
        style={{
          ...containerStyle,
          border: `2px dashed ${isDragging ? config.color : 'rgba(255,255,255,0.15)'}`,
          padding: 24,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12,
          cursor: 'pointer', minHeight: 120,
        }}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click() }}
      >
        <span style={{ color: config.color, opacity: 0.8 }}>
          {React.cloneElement(config.icon as React.ReactElement, { size: 32 })}
        </span>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#e2e8f0' }}>{config.label} 파일을 드래그하거나 클릭하여 업로드</div>
          <div style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>
            {docType === 'pdf' && 'PDF 파일 (.pdf)'}
            {docType === 'pptx' && 'PowerPoint (.pptx, .ppt)'}
            {docType === 'docx' && 'Word (.docx, .doc)'}
            {docType === 'xlsx' && 'Excel (.xlsx, .xls)'}
            {docType === 'unknown' && '모든 문서 형식'}
          </div>
        </div>
        <button
          style={{
            background: 'none', border: `1px solid rgba(255,255,255,0.15)`,
            color: '#94a3b8', fontSize: 11, cursor: 'pointer',
            borderRadius: 4, padding: '3px 10px',
          }}
          onClick={(e) => { e.stopPropagation(); handleUrlInput() }}
        >
          또는 URL 입력
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept={
            docType === 'pdf' ? '.pdf' :
            docType === 'pptx' ? '.pptx,.ppt' :
            docType === 'docx' ? '.docx,.doc' :
            docType === 'xlsx' ? '.xlsx,.xls' :
            '.pdf,.pptx,.ppt,.docx,.doc,.xlsx,.xls'
          }
          style={{ display: 'none' }}
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileUpload(f) }}
        />
      </div>
    )
  }

  const viewHeight = isExpanded ? Math.min(height * 1.6, 800) : height

  return (
    <div ref={containerRef} style={containerStyle}>
      {headerBar}
      <div data-viewer-inner style={{ height: viewHeight, overflow: 'hidden', position: 'relative' }}>
        {showDNA && profile && (
          <DocumentProfileModal 
            fileId={fileId || ''}
            profile={profile} 
            onClose={() => setShowDNA(false)} 
          />
        )}
        {docType === 'pdf' && hasFile && (
          <PdfMiniViewer 
            sourceUrl={props.sourceUrl} 
            height={viewHeight} 
            savedBookmarks={(() => { try { return JSON.parse(props.bookmarks || '[]') } catch { return [] } })()}
            onBookmarksChange={(b) => editor.updateBlock(block.id, { props: { ...props, bookmarks: JSON.stringify(b) } })}
          />
        )}
        {docType === 'pdf' && hasUrl && (
          <iframe
            src={props.sourceUrl}
            style={{ width: '100%', height: '100%', border: 'none', display: 'block' }}
            title={props.fileName || 'PDF'}
            allowFullScreen
          />
        )}
        {docType !== 'pdf' && docType !== 'pptx' && hasFile && (
          <OfficeDocViewer
            sourceUrl={props.sourceUrl}
            fileBase64={props.fileBase64}
            docType={docType}
            fileName={props.fileName}
            height={viewHeight}
          />
        )}
        {docType === 'pptx' && hasFile && (
          <PptxMiniViewer
            sourceUrl={props.sourceUrl}
            fileBase64={props.fileBase64}
            height={viewHeight}
          />
        )}
        {docType !== 'pdf' && hasUrl && (
          <iframe
            src={`https://docs.google.com/viewer?url=${encodeURIComponent(props.sourceUrl)}&embedded=true`}
            style={{ width: '100%', height: '100%', border: 'none' }}
            title={props.fileName || '문서'}
          />
        )}
      </div>

      {/* 하단 리사이저 (상하 높이 조절) — native capture 이벤트로 stopImmediatePropagation 적용 */}
      <div
        ref={bottomResizerRef}
        contentEditable={false}
        style={{
          width: '100%',
          height: '12px',
          background: 'transparent',
          cursor: 'ns-resize',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
        }}
        title="위아래로 드래그하여 높이 조절"
      >
        <div style={{ width: '48px', height: '4px', background: 'rgba(255,255,255,0.2)', borderRadius: '2px' }} />
      </div>

      {/* 우측 리사이저 (좌우 폭 조절) */}
      <div
        ref={rightResizerRef}
        contentEditable={false}
        style={{
          position: 'absolute',
          top: 0,
          right: 0,
          width: '8px',
          height: '100%',
          cursor: 'ew-resize',
          zIndex: 20,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
        title="좌우로 드래그하여 폭 조절 (더블클릭 → 100% 리셋)"
        onDoubleClick={() => {
          editor.updateBlock(block.id, { props: { ...props, width: '100%' } })
        }}
      >
        <div style={{ width: '3px', height: '32px', background: 'rgba(255,255,255,0.15)', borderRadius: '2px' }} />
      </div>
    </div>
  )
}

/** PPTX Viewer (pptx-preview 기반 렌더링) */
export function PptxMiniViewer({ sourceUrl, fileBase64, height }: { sourceUrl: string; fileBase64?: string; height: number }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)

    const loadPptx = async () => {
      try {
        let arrayBuffer: ArrayBuffer
        if (sourceUrl.startsWith('ameva-vfs://')) {
          const fileId = sourceUrl.replace('ameva-vfs://', '')
          const blob = await getAttachment(fileId)
          if (!blob) throw new Error('VFS_EXPIRED')
          arrayBuffer = await blob.arrayBuffer()
        } else if (sourceUrl.startsWith('blob:') || sourceUrl.startsWith('http')) {
          const res = await fetch(sourceUrl)
          arrayBuffer = await res.arrayBuffer()
        } else if (sourceUrl.startsWith('data:')) {
          const cleanBase64 = sourceUrl.split(',')[1] || ''
          const binaryString = atob(cleanBase64.replace(/\s/g, ''))
          const len = binaryString.length
          const bytes = new Uint8Array(len)
          for (let i = 0; i < len; i++) bytes[i] = binaryString.charCodeAt(i)
          arrayBuffer = bytes.buffer
        } else if (fileBase64) {
          const cleanBase64 = fileBase64.includes(',') ? fileBase64.split(',')[1] : fileBase64
          const binaryString = atob(cleanBase64.replace(/\s/g, ''))
          const len = binaryString.length
          const bytes = new Uint8Array(len)
          for (let i = 0; i < len; i++) bytes[i] = binaryString.charCodeAt(i)
          arrayBuffer = bytes.buffer
        } else {
          throw new Error('Local file only')
        }

        if (cancelled || !containerRef.current) return

        const pptxjs = await import('pptx-preview')
        const previewer = pptxjs.init(containerRef.current, {
          width: 800,
          height: 600,
          autoScale: true
        })
        
        await previewer.preview(arrayBuffer)
        setLoading(false)
      } catch (e: any) {
        if (!cancelled) {
          setError(e.message === 'VFS_EXPIRED' ? '임시 파일이 만료되었거나 로드에 실패했습니다.' : 'PPTX 로드 실패')
          setLoading(false)
        }
      }
    }

    if (sourceUrl) loadPptx()
    return () => { cancelled = true }
  }, [sourceUrl])

  return (
    <div style={{ position: 'relative', width: '100%', height, background: '#f8fafc', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {loading && <div style={{ color: '#94a3b8', fontSize: 13 }}>PowerPoint 로드 중...</div>}
      {error && <div style={{ color: '#ef4444', fontSize: 13 }}>{error}</div>}
      <div 
        ref={containerRef} 
        style={{ width: '100%', height: '100%', display: (loading || error) ? 'none' : 'block' }}
        onMouseMove={e => e.stopPropagation()}
        onMouseDown={e => e.stopPropagation()}
        onMouseUp={e => e.stopPropagation()}
      />
    </div>
  )
}

/** Office 문서 뷰어 (DOCX → mammoth.js HTML, XLSX → exceljs HTML) */
export function OfficeDocViewer({ sourceUrl, fileBase64, docType, fileName, height }: {
  sourceUrl: string; fileBase64?: string; docType: DocType; fileName: string; height: number
}) {
  const [htmlContent, setHtmlContent] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (docType !== 'docx' && docType !== 'xlsx') {
      setLoading(false)
      return
    }
    const loadDoc = async () => {
      try {
        let arrayBuffer: ArrayBuffer
        
        if (sourceUrl.startsWith('ameva-vfs://')) {
          const fileId = sourceUrl.replace('ameva-vfs://', '')
          const blob = await getAttachment(fileId)
          if (!blob) throw new Error('VFS_EXPIRED')
          arrayBuffer = await blob.arrayBuffer()
        } else if (sourceUrl.startsWith('blob:') || sourceUrl.startsWith('data:') || sourceUrl.startsWith('http')) {
          const res = await fetch(sourceUrl)
          arrayBuffer = await res.arrayBuffer()
        } else if (fileBase64) {
          const cleanBase64 = fileBase64.includes(',') ? fileBase64.split(',')[1] : fileBase64
          const binaryString = atob(cleanBase64.replace(/\s/g, ''))
          const len = binaryString.length
          const bytes = new Uint8Array(len)
          for (let i = 0; i < len; i++) bytes[i] = binaryString.charCodeAt(i)
          arrayBuffer = bytes.buffer
        } else {
          throw new Error('Local file only')
        }

        if (docType === 'docx') {
          const mammoth = await import('mammoth')
          const result = await mammoth.convertToHtml({ arrayBuffer })
          setHtmlContent(result.value)
        } else if (docType === 'xlsx') {
          const ExcelJS = await import('exceljs')
          const wb = new ExcelJS.Workbook()
          await wb.xlsx.load(arrayBuffer)
          let html = ''
          wb.eachSheet((worksheet) => {
            html += `<h3 style="margin-top: 1em; border-bottom: 1px solid #eee; padding-bottom: 8px;">${worksheet.name}</h3>`
            html += `<table style="width: 100%; border-collapse: collapse; margin-bottom: 1em;">`
            worksheet.eachRow((row) => {
              html += '<tr>'
              const cells = (row.values as any[]).slice(1)
              cells.forEach((v) => {
                html += `<td style="border: 1px solid #e2e8f0; padding: 6px 12px;">${v != null ? String(v) : ''}</td>`
              })
              html += '</tr>'
            })
            html += `</table>`
          })
          setHtmlContent(html || '<p style="color:#94a3b8">표 데이터가 없습니다.</p>')
        }
      } catch (e: any) {
        if (e.message === 'VFS_EXPIRED' || sourceUrl.startsWith('blob:')) {
          setHtmlContent('<p style="color:#f87171">임시 파일이 만료되었거나 문서 변환에 실패했습니다.<br/><br/>원격/가상 환경 데이터가 손실되었습니다. 문서를 다시 드래그하여 업로드해주세요.</p>')
        } else {
          setHtmlContent('<p style="color:#f87171">문서 변환 실패. 외부 URL 삽입 방식이 필요합니다.</p>')
        }
      } finally {
        setLoading(false)
      }
    }
    loadDoc()
  }, [sourceUrl, docType])

  if (docType === 'docx' || docType === 'xlsx') {
    if (loading) return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height, color: '#94a3b8', fontSize: 12 }}>
        문서 변환 중...
      </div>
    )
    return (
      <div
        contentEditable={false}
        ref={(el) => {
          if (el) {
            el.addEventListener('mousemove', e => e.stopPropagation())
            el.addEventListener('mousedown', e => e.stopPropagation())
            el.addEventListener('mouseup', e => e.stopPropagation())
          }
        }}
        style={{
          height, overflow: 'auto', padding: '16px 24px',
          background: '#fff', color: '#1a1a1a', fontSize: 13, lineHeight: 1.6,
        }}
        dangerouslySetInnerHTML={{ __html: htmlContent || '' }}
      />
    )
  }

  return <></>
}

/**
 * BlockNote 커스텀 블록 스펙 생성
 * 타입: 'inlineDocument'
 */
export const InlineDocumentBlockSpec = createReactBlockSpec(
  {
    type: 'inlineDocument' as const,
    propSchema: {
      fileName:    { default: '' },
      fileBase64:  { default: '' },
      docType:     { default: 'unknown' },
      height:      { default: '420' },
      width:       { default: '100%' },
      sourceUrl:   { default: '' },
      isExpanded:  { default: 'false' },
      bookmarks:   { default: '[]' },
    },
    content: 'none',
  },
  {
    render: InlineDocumentBlockComponent,
    toExternalHTML: ({ block }) => {
      return (
        <a href={block.props.sourceUrl || '#'} data-content-type="inlineDocument">
          [AMEVA Document: {block.props.fileName || block.props.docType}]
        </a>
      )
    },
    parseHTML: [
      {
        tag: 'a',
        getAttrs: (element) => {
          if (typeof element === 'string') return false
          const text = element.textContent || ''
          if (!text.startsWith('[AMEVA Document:')) return false
          
          const href = element.getAttribute('href') || ''
          const fileName = text.replace('[AMEVA Document: ', '').replace(']', '').trim()
          
          let docType = 'unknown'
          if (fileName.toLowerCase().endsWith('.pdf')) docType = 'pdf'
          else if (fileName.toLowerCase().endsWith('.docx')) docType = 'docx'
          else if (fileName.toLowerCase().endsWith('.pptx')) docType = 'pptx'
          else if (fileName.toLowerCase().endsWith('.xlsx')) docType = 'xlsx'

          return {
            sourceUrl: href === '#' ? '' : href,
            fileName: fileName,
            docType: docType,
            isExpanded: 'false',
            height: '420',
            fileBase64: ''
          }
        }
      }
    ]
  }
)

export const InlineDocumentBlock = InlineDocumentBlockSpec()
