/**
 * ============================================================================
 * @file InlineDocumentBlock.tsx
 * @description InlineDocumentBlock.tsx 시스템 모듈 구성요소로, 관련 UI 렌더링 및 비즈니스 로직을 담당합니다.
 * @usage 문서 에디터 및 뷰어 내부에서 동적으로 호출되거나 유틸리티 함수로 사용됩니다.
 * @example
 * // 예시 로직 (자동 생성됨)
 * import { something } from './InlineDocumentBlock';
 * 
 * @created 2026-08-10 20:30:36
 * @updated 2026-08-10 20:30:36
 * @author uno-km
 * @commit docs: 전체 소스코드 한글 주석 및 사내 컨벤션 일괄 적용
 * ============================================================================
 */

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

// [외부 패키지 및 라이브러리 임포트: react]
import React, { useState, useRef, useCallback, useEffect } from 'react'
// [외부 패키지 및 라이브러리 임포트: @blocknote/react]
import { createReactBlockSpec } from '@blocknote/react'
// [외부 패키지 및 라이브러리 임포트: lucide-react]
import { Upload, FileText, FileSpreadsheet, Presentation, FileType2, X, Maximize2, Minimize2, ExternalLink, Dna, List, Search } from 'lucide-react'
// [외부 패키지 및 라이브러리 임포트: pdfjs-dist]
import * as pdfjsLib from 'pdfjs-dist'
// [내부 프로젝트 의존성 모듈 임포트: ../utils/vfsDatabase]
import { saveAttachment, getAttachment } from '../utils/vfsDatabase'
// [내부 프로젝트 의존성 모듈 임포트: ../stores/useDocumentProfilerStore]
import { useDocumentProfilerStore } from '../stores/useDocumentProfilerStore'
// [내부 프로젝트 의존성 모듈 임포트: ./DocumentProfileModal]
import { DocumentProfileModal } from './DocumentProfileModal'
// [내부 프로젝트 의존성 모듈 임포트: ./ResizableBlockContainer]
import { ResizableBlockContainer } from './ResizableBlockContainer'
// @ts-ignore
import PdfWorker from 'pdfjs-dist/build/pdf.worker.mjs?worker'

pdfjsLib.GlobalWorkerOptions.workerPort = new PdfWorker()

/**
 * DocType 모듈 내외부에서 사용되는 데이터 통신 규격 및 타입을 정의합니다.
 * @remarks 이 주석은 컨벤션에 따라 자동 생성된 문서화 내용입니다.
 */
export type DocType = 'pdf' | 'pptx' | 'docx' | 'xlsx' | 'unknown'

/**
 * detectDocType 함수의 핵심 비즈니스 로직 및 상태 제어를 처리합니다.
 * @remarks 이 주석은 컨벤션에 따라 자동 생성된 문서화 내용입니다.
 */
function detectDocType(fileName: string, mimeType?: string): DocType {
  const ext = fileName.split('.').pop()?.toLowerCase() || ''
  if (ext === 'pdf' || mimeType?.includes('pdf')) return 'pdf'
  if (['pptx', 'ppt'].includes(ext)) return 'pptx'
  if (['docx', 'doc'].includes(ext)) return 'docx'
  if (['xlsx', 'xls'].includes(ext)) return 'xlsx'
  return 'unknown'
}

/**
 * DOC_TYPE_CONFIG 상태, 변수 또는 상수 선언부입니다.
 * @type {any} - Typescript 컴파일러에 의한 타입 추론(Inferred)
 */
export const DOC_TYPE_CONFIG: Record<DocType, { label: string; color: string; icon: React.ReactNode }> = {
  pdf:     { label: 'PDF',         color: '#ef4444', icon: <FileText size={16} /> },
  pptx:    { label: 'PowerPoint',  color: '#f97316', icon: <Presentation size={16} /> },
  docx:    { label: 'Word',        color: '#3b82f6', icon: <FileType2 size={16} /> },
  xlsx:    { label: 'Excel',       color: '#22c55e', icon: <FileSpreadsheet size={16} /> },
  unknown: { label: '문서',        color: '#8b5cf6', icon: <FileText size={16} /> },
}

/**
 * MiniContinuousPageCanvas 함수의 핵심 비즈니스 로직 및 상태 제어를 처리합니다.
 * @remarks 이 주석은 컨벤션에 따라 자동 생성된 문서화 내용입니다.
 */
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
  sourceUrl, height, targetPage, savedBookmarks = [], onBookmarksChange 
}: { 
  sourceUrl: string; height: number;
  targetPage?: number;
  savedBookmarks?: { page: number, label: string }[];
  onBookmarksChange?: (b: { page: number, label: string }[]) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
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
    if (targetPage && targetPage >= 1 && targetPage <= numPages) {
      goToPage(targetPage)
    }
  }, [targetPage, numPages])

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
        } else if (sourceUrl.startsWith('http://') || sourceUrl.startsWith('https://') || sourceUrl.startsWith('blob:')) {
          getDocumentArg = { url: sourceUrl }
        } else {
          // data:application/pdf;base64,... 또는 raw base64
          const cleanBase64 = sourceUrl.includes(',') ? sourceUrl.split(',')[1] : sourceUrl
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


/**
 * InlineDocumentBlockComponent 함수의 핵심 비즈니스 로직 및 상태 제어를 처리합니다.
 * @remarks 이 주석은 컨벤션에 따라 자동 생성된 문서화 내용입니다.
 */
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
  const fileInputRef = useRef<HTMLInputElement>(null)

  const isExpanded = props.isExpanded === 'true'
  const [showDNA, setShowDNA] = useState(false)
  const [pdfMode, setPdfMode] = useState<'native' | 'canvas'>('native')
  const [resolvedBlobUrl, setResolvedBlobUrl] = useState<string | null>(null)

  // [PDF IN-BLOCK SEARCH] 해당 PDF 블록 전용 검색 상태
  const [showSearch, setShowSearch] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchIndex, setSearchIndex] = useState<Record<number, string>>({})
  const [searchResults, setSearchResults] = useState<{ page: number; count: number }[]>([])
  const [searchResultIdx, setSearchResultIdx] = useState(0)
  const [targetPageNum, setTargetPageNum] = useState<number>(1)
  const [isHovered, setIsHovered] = useState(false)
  const blockContainerRef = useRef<HTMLDivElement>(null)

  const { profiles, enqueue } = useDocumentProfilerStore()
  const fileId = props.sourceUrl?.startsWith('ameva-vfs://') ? props.sourceUrl.replace('ameva-vfs://', '') : null
  const profile = fileId ? profiles[fileId] : undefined
  const docType = (props.docType as DocType) || 'unknown'
  const config = DOC_TYPE_CONFIG[docType] || DOC_TYPE_CONFIG.unknown

  const isLocalMemory = props.sourceUrl?.startsWith('blob:') || props.sourceUrl?.startsWith('ameva-vfs://') || props.sourceUrl?.startsWith('data:')
  const hasFile = (!!props.sourceUrl && isLocalMemory) || !!props.fileBase64
  const hasUrl = !!props.sourceUrl && !isLocalMemory

  // PDF 텍스트 인덱싱 (해당 PDF 전용 검색용)
  useEffect(() => {
    if (docType !== 'pdf' || (!props.sourceUrl && !props.fileBase64)) return
    let cancelled = false

    const buildPdfIndex = async () => {
      try {
        let getDocumentArg: any = null
        if (props.sourceUrl?.startsWith('ameva-vfs://')) {
          const id = props.sourceUrl.replace('ameva-vfs://', '')
          const blob = await getAttachment(id)
          if (!blob) return
          getDocumentArg = { data: new Uint8Array(await blob.arrayBuffer()) }
        } else if (props.sourceUrl?.startsWith('blob:') || props.sourceUrl?.startsWith('http')) {
          getDocumentArg = { url: props.sourceUrl }
        } else if (props.fileBase64) {
          const clean = props.fileBase64.includes(',') ? props.fileBase64.split(',')[1] : props.fileBase64
          const binary = atob(clean.replace(/\s/g, ''))
          const bytes = new Uint8Array(binary.length)
          for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
          getDocumentArg = { data: bytes }
        }

        if (!getDocumentArg) return
        const pdf = await pdfjsLib.getDocument(getDocumentArg).promise
        if (cancelled) return
        const idx: Record<number, string> = {}
        for (let i = 1; i <= pdf.numPages; i++) {
          if (cancelled) break
          try {
            const p = await pdf.getPage(i)
            const tc = await p.getTextContent()
            idx[i] = tc.items.map((it: any) => it.str || '').join(' ')
          } catch {}
        }
        if (!cancelled) {
          setSearchIndex(idx)
        }
      } catch (err) {
        console.warn('[InlineDocumentBlock] PDF index build error:', err)
      }
    }

    buildPdfIndex()
    return () => { cancelled = true }
  }, [docType, props.sourceUrl, props.fileBase64])

  const [docMatchElements, setDocMatchElements] = useState<HTMLElement[]>([])

  const clearDocHighlights = useCallback(() => {
    const container = blockContainerRef.current
    if (!container) return
    const marks = Array.from(container.querySelectorAll('mark.doc-search-match'))
    marks.forEach(mark => {
      const parent = mark.parentNode
      if (parent) {
        parent.replaceChild(document.createTextNode(mark.textContent || ''), mark)
        parent.normalize()
      }
    })
  }, [])

  const highlightDocText = useCallback((query: string) => {
    clearDocHighlights()
    const container = blockContainerRef.current
    if (!container) return []

    const inner = container.querySelector('[data-viewer-inner]') || container
    const walker = document.createTreeWalker(
      inner,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode: (node) => {
          if (node.parentElement?.closest('[data-pdf-search-overlay], [data-search-ignore], button, input, style, script')) {
            return NodeFilter.FILTER_REJECT
          }
          return node.nodeValue?.toLowerCase().includes(query.toLowerCase()) 
            ? NodeFilter.FILTER_ACCEPT 
            : NodeFilter.FILTER_REJECT
        }
      }
    )

    const nodesToProcess: Text[] = []
    while (walker.nextNode()) {
      nodesToProcess.push(walker.currentNode as Text)
    }

    const matches: HTMLElement[] = []
    const qLen = query.length
    const qLower = query.toLowerCase()

    nodesToProcess.forEach(textNode => {
      const parent = textNode.parentNode
      if (!parent) return
      const text = textNode.nodeValue || ''
      let idx = text.toLowerCase().indexOf(qLower)
      if (idx === -1) return

      const frag = document.createDocumentFragment()
      let lastIdx = 0

      while (idx !== -1) {
        if (idx > lastIdx) {
          frag.appendChild(document.createTextNode(text.substring(lastIdx, idx)))
        }
        const mark = document.createElement('mark')
        mark.className = 'doc-search-match'
        mark.style.backgroundColor = '#fde047'
        mark.style.color = '#0f172a'
        mark.style.padding = '1px 3px'
        mark.style.borderRadius = '2px'
        mark.style.fontWeight = '700'
        mark.style.boxShadow = '0 0 4px rgba(250, 204, 21, 0.6)'
        mark.textContent = text.substring(idx, idx + qLen)
        frag.appendChild(mark)
        matches.push(mark)

        lastIdx = idx + qLen
        idx = text.toLowerCase().indexOf(qLower, lastIdx)
      }

      if (lastIdx < text.length) {
        frag.appendChild(document.createTextNode(text.substring(lastIdx)))
      }

      parent.replaceChild(frag, textNode)
    })

    return matches
  }, [clearDocHighlights])

  const updateActiveDocMatch = (matches: HTMLElement[], activeIdx: number) => {
    matches.forEach((m, i) => {
      if (i === activeIdx) {
        m.style.backgroundColor = '#f97316'
        m.style.color = '#ffffff'
        m.style.outline = '2px solid #ea580c'
        m.scrollIntoView({ behavior: 'smooth', block: 'center' })
      } else {
        m.style.backgroundColor = '#fde047'
        m.style.color = '#0f172a'
        m.style.outline = 'none'
      }
    })
  }

  // 검색 실행 (PDF 및 DOCX/XLSX 통합 지원)
  const handlePerformSearch = (q: string) => {
    setSearchQuery(q)
    const trimmed = q.trim()
    if (!trimmed) {
      clearDocHighlights()
      setSearchResults([])
      setSearchResultIdx(0)
      setDocMatchElements([])
      return
    }

    if (docType === 'pdf') {
      const results: { page: number; count: number }[] = []
      Object.entries(searchIndex).forEach(([pageNumStr, text]) => {
        const pageNum = parseInt(pageNumStr, 10)
        const count = (text.toLowerCase().match(new RegExp(trimmed.toLowerCase().replace(/[.*+?^$\{\}()|[\]\\]/g, '\\$&'), 'g')) || []).length
        if (count > 0) {
          results.push({ page: pageNum, count })
        }
      })
      results.sort((a, b) => a.page - b.page)
      setSearchResults(results)
      setSearchResultIdx(0)
      if (results.length > 0) {
        setTargetPageNum(results[0].page)
      }
    } else {
      const matches = highlightDocText(trimmed)
      setDocMatchElements(matches)
      const mapped = matches.map((_, i) => ({ page: i + 1, count: 1 }))
      setSearchResults(mapped)
      setSearchResultIdx(0)
      if (matches.length > 0) {
        updateActiveDocMatch(matches, 0)
      }
    }
  }

  const goToNextMatch = () => {
    if (searchResults.length === 0) return
    const nextIdx = (searchResultIdx + 1) % searchResults.length
    setSearchResultIdx(nextIdx)
    if (docType === 'pdf') {
      setTargetPageNum(searchResults[nextIdx].page)
    } else if (docMatchElements.length > 0) {
      updateActiveDocMatch(docMatchElements, nextIdx)
    }
  }

  const goToPrevMatch = () => {
    if (searchResults.length === 0) return
    const prevIdx = (searchResultIdx - 1 + searchResults.length) % searchResults.length
    setSearchResultIdx(prevIdx)
    if (docType === 'pdf') {
      setTargetPageNum(searchResults[prevIdx].page)
    } else if (docMatchElements.length > 0) {
      updateActiveDocMatch(docMatchElements, prevIdx)
    }
  }

  const closeDocSearch = () => {
    setShowSearch(false)
    setSearchQuery('')
    clearDocHighlights()
    setSearchResults([])
    setSearchResultIdx(0)
    setDocMatchElements([])
  }

// [SEARCH TRIGGER] 버튼 클릭을 통해서만 검색창 활성화

  // PDF용 Blob URL 사전 해석 (Chromium/Edge 내장 PDF 뷰어 연동)
  useEffect(() => {
    let active = true
    let createdUrl: string | null = null

    if (docType === 'pdf' && props.sourceUrl) {
      if (props.sourceUrl.startsWith('ameva-vfs://')) {
        const id = props.sourceUrl.replace('ameva-vfs://', '')
        getAttachment(id).then(blob => {
          if (!active) return
          if (blob) {
            createdUrl = URL.createObjectURL(blob)
            setResolvedBlobUrl(createdUrl)
          }
        }).catch(console.error)
      } else if (props.sourceUrl.startsWith('blob:') || props.sourceUrl.startsWith('http')) {
        setResolvedBlobUrl(props.sourceUrl)
      } else if (props.sourceUrl.startsWith('data:') || props.fileBase64) {
        try {
          const raw = props.sourceUrl.startsWith('data:') ? props.sourceUrl : props.fileBase64
          const cleanBase64 = raw.includes(',') ? raw.split(',')[1] : raw
          const binary = atob(cleanBase64.replace(/\s/g, ''))
          const bytes = new Uint8Array(binary.length)
          for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
          const blob = new Blob([bytes], { type: 'application/pdf' })
          createdUrl = URL.createObjectURL(blob)
          setResolvedBlobUrl(createdUrl)
        } catch (e) {
          console.error(e)
        }
      }
    } else {
      setResolvedBlobUrl(null)
    }

    return () => {
      active = false
      if (createdUrl) URL.revokeObjectURL(createdUrl)
    }
  }, [docType, props.sourceUrl, props.fileBase64])

  useEffect(() => {
    if (docType === 'pdf' && hasFile && fileId && !profile) {
      getAttachment(fileId).then(blob => {
        if (blob) {
          const file = new File([blob], props.fileName || 'document.pdf', { type: 'application/pdf' })
          enqueue(fileId, file)
        }
      }).catch(console.error)
    }
  }, [docType, hasFile, fileId, profile, props.fileName, enqueue])

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
      {docType === 'pdf' && (hasFile || hasUrl) && (
        <>
          <button
            onClick={() => {
              setShowSearch(s => !s)
              if (!showSearch) {
                setTimeout(() => {
                  const inp = blockContainerRef.current?.querySelector('input[data-pdf-search-input]') as HTMLInputElement
                  if (inp) { inp.focus(); inp.select() }
                }, 50)
              }
            }}
            style={{
              marginLeft: '8px', padding: '3px 8px',
              background: showSearch ? 'rgba(59, 130, 246, 0.35)' : 'rgba(59, 130, 246, 0.15)',
              border: '1px solid ' + (showSearch ? '#60a5fa' : 'rgba(59, 130, 246, 0.4)'),
              borderRadius: '4px', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: '4px',
              color: showSearch ? '#93c5fd' : '#60a5fa', fontSize: '11px', fontWeight: 600,
            }}
            title="이 PDF 전용 검색기 열기 (Ctrl+Shift+F)"
          >
            <Search size={12} />
            PDF 검색
          </button>
          <button
            onClick={() => setPdfMode(prev => prev === 'native' ? 'canvas' : 'native')}
            style={{
              marginLeft: '4px', padding: '3px 8px', background: 'rgba(239, 68, 68, 0.18)',
              border: '1px solid rgba(239, 68, 68, 0.4)', borderRadius: '4px', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: '4px', color: '#fca5a5', fontSize: '11px', fontWeight: 600,
            }}
            title={pdfMode === 'native' ? '커스텀 캔버스 뷰어로 전환' : 'Edge/Chrome 브라우저 기본 PDF 리더로 전환'}
          >
            {pdfMode === 'native' ? '🖥️ 브라우저 뷰어' : '📑 캔버스 뷰어'}
          </button>
        </>
      )}
      {docType === 'pdf' && profile && (
        <button
          onClick={() => setShowDNA(true)}
          style={{
            marginLeft: '4px', padding: '3px 8px', background: 'rgba(168, 85, 247, 0.2)', border: '1px solid rgba(168, 85, 247, 0.4)', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', color: '#d8b4fe', fontSize: '11px', fontWeight: 600,
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
            onClick={() => {
              const nextExpanded = !isExpanded
              const currentH = parseInt(props.height || '450', 10)
              const nextH = nextExpanded ? Math.max(850, Math.round(currentH * 1.5)) : 450
              editor.updateBlock(block.id, {
                props: {
                  ...props,
                  isExpanded: nextExpanded ? 'true' : 'false',
                  height: nextH.toString()
                }
              })
            }}
            title={isExpanded ? '축소 (기본 높이로)' : '확대 (850px+ 로)'}
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
          position: 'relative',
          borderRadius: 8,
          border: `2px dashed ${isDragging ? config.color : 'rgba(255,255,255,0.15)'}`,
          padding: 24,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12,
          cursor: 'pointer', minHeight: 120,
          background: 'var(--bg-panel, #0f0f1a)',
          margin: '8px 0',
          width: props.width || '100%',
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

  return (
    <ResizableBlockContainer
      initialWidth={props.width || '100%'}
      initialHeight={parseInt(props.height || '450', 10)}
      minHeight={150}
      maxHeight={4000}
      minWidth={280}
      maxWidth={3200}
      accentColor={config.color}
      header={headerBar}
      onResizeEnd={({ width, height }) => {
        editor.updateBlock(block.id, {
          props: {
            ...props,
            width,
            height: height.toString(),
          }
        })
      }}
    >
      {({ height: blockHeight }) => {
        const viewHeight = blockHeight

        return (
          <div 
            ref={blockContainerRef}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            data-viewer-inner 
            style={{ width: '100%', height: '100%', overflow: 'hidden', position: 'relative' }}
          >
            {/* [PDF IN-BLOCK SEARCH OVERLAY] */}
            {docType === 'pdf' && showSearch && (
              <div 
                style={{
                  position: 'absolute', top: 10, right: 14, zIndex: 60,
                  background: 'rgba(15, 23, 42, 0.96)', backdropFilter: 'blur(16px)',
                  border: '1px solid rgba(59, 130, 246, 0.5)', borderRadius: '8px',
                  padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '8px',
                  boxShadow: '0 8px 30px rgba(0,0,0,0.7)',
                  animation: 'fadeIn 0.15s ease'
                }}
              >
                <Search size={13} color="#60a5fa" />
                <input
                  data-pdf-search-input
                  autoFocus
                  type="text"
                  value={searchQuery}
                  onChange={e => handlePerformSearch(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Escape') {
                      e.preventDefault()
                      setShowSearch(false)
                    } else if (e.key === 'Enter') {
                      e.preventDefault()
                      if (e.shiftKey) goToPrevMatch()
                      else goToNextMatch()
                    }
                  }}
                  placeholder={docType === 'pdf' ? "PDF 내 텍스트 검색..." : "문서 내 텍스트 검색..."}
                  style={{
                    background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.2)',
                    borderRadius: '4px', color: '#fff', fontSize: '11px', padding: '4px 8px', outline: 'none', width: '150px'
                  }}
                />
                <span style={{ fontSize: '10px', color: searchResults.length > 0 ? '#60a5fa' : '#f87171', whiteSpace: 'nowrap', minWidth: '70px', textAlign: 'center' }}>
                  {searchResults.length > 0 
                    ? `${searchResultIdx + 1}/${searchResults.length}건${docType === 'pdf' ? ` (P.${searchResults[searchResultIdx]?.page})` : ''}` 
                    : searchQuery ? '일치 없음' : '0건'}
                </span>
                {searchResults.length > 0 && (
                  <div style={{ display: 'flex', gap: '2px' }}>
                    <button 
                      onClick={goToPrevMatch} 
                      title="이전 결과 (Shift+Enter)"
                      style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', borderRadius: '3px', padding: '2px 6px', cursor: 'pointer', fontSize: '10px' }}
                    >↑</button>
                    <button 
                      onClick={goToNextMatch} 
                      title="다음 결과 (Enter)"
                      style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', borderRadius: '3px', padding: '2px 6px', cursor: 'pointer', fontSize: '10px' }}
                    >↓</button>
                  </div>
                )}
                <button 
                  onClick={() => setShowSearch(false)} 
                  title="닫기 (ESC)"
                  style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '2px 4px', fontSize: '11px' }}
                >✕</button>
              </div>
            )}

            {showDNA && profile && (
              <DocumentProfileModal 
                fileId={fileId || ''}
                profile={profile} 
                onClose={() => setShowDNA(false)} 
              />
            )}
            {docType === 'pdf' && pdfMode === 'native' && (resolvedBlobUrl || props.sourceUrl.startsWith('http')) ? (
              <iframe
                key={`${resolvedBlobUrl || props.sourceUrl}-${targetPageNum}`}
                src={`${resolvedBlobUrl || props.sourceUrl}${targetPageNum > 1 ? `#page=${targetPageNum}` : ''}`}
                style={{ width: '100%', height: '100%', border: 'none', display: 'block', background: '#525659' }}
                title={props.fileName || 'PDF'}
                allowFullScreen
              />
            ) : docType === 'pdf' && pdfMode === 'native' ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#94a3b8', fontSize: 12 }}>
                PDF 문서 로딩 중...
              </div>
            ) : null}
            {docType === 'pdf' && pdfMode === 'canvas' && hasFile && (
              <PdfMiniViewer 
                sourceUrl={props.sourceUrl} 
                height={viewHeight} 
                targetPage={targetPageNum}
                savedBookmarks={(() => { try { return JSON.parse(props.bookmarks || '[]') } catch { return [] } })()}
                onBookmarksChange={(b) => editor.updateBlock(block.id, { props: { ...props, bookmarks: JSON.stringify(b) } })}
              />
            )}
            {docType === 'pdf' && pdfMode === 'canvas' && hasUrl && (
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
        )
      }}
    </ResizableBlockContainer>
  )
}

/** PPTX Viewer (pptx-preview 기반 렌더링 + 슬라이드 쪽수 및 목차/TOC) */
export function PptxMiniViewer({ sourceUrl, fileBase64, height }: { sourceUrl: string; fileBase64?: string; height: number }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [slides, setSlides] = useState<{ index: number; title: string; element: HTMLElement }[]>([])
  const [currentSlide, setCurrentSlide] = useState(1)
  const [showToc, setShowToc] = useState(false)

  // 렌더링 후 최상위 슬라이드 및 대표 텍스트 파싱 (하위 요소 중복 카운트 방지)
  const parseSlides = useCallback(() => {
    if (!containerRef.current) return
    const container = containerRef.current

    // pptx-preview가 생성한 슬라이드 래퍼 또는 직계 자식 요소 탐색
    const wrapper = container.querySelector('.slides, .pptx-wrapper') || container.firstElementChild || container
    const directChildren = Array.from(wrapper.children) as HTMLElement[]

    // 실제 최상위 슬라이드 요소만 필터링 (크기 및 최상위 구조 검증)
    let slideEls = directChildren.filter(el => {
      const rect = el.getBoundingClientRect()
      return (rect.width > 80 && rect.height > 80) || el.classList.contains('slide') || el.id?.startsWith('slide')
    })

    // 직계 자식으로 안 묶여있을 경우: 중첩되지 않은 최상위 .slide 요소만 추출
    if (slideEls.length === 0) {
      const allSlides = Array.from(container.querySelectorAll('.slide, section.slide')) as HTMLElement[]
      slideEls = allSlides.filter(el => !el.parentElement?.closest('.slide, section.slide'))
    }

    if (slideEls.length > 0) {
      const items = slideEls.map((el, i) => {
        const titleEl = el.querySelector('h1, h2, h3, h4, .title, p, span')
        const textContent = (titleEl?.textContent || el.textContent || '').replace(/\s+/g, ' ').trim()
        const titleSnippet = textContent.slice(0, 35) || `슬라이드 ${i + 1}`
        return { index: i + 1, title: titleSnippet, element: el }
      })
      setSlides(items)
    }
  }, [])

  const scrollToSlide = useCallback((el: HTMLElement, idx: number) => {
    const container = containerRef.current
    if (!container || !el) return
    const containerRect = container.getBoundingClientRect()
    const elemRect = el.getBoundingClientRect()
    const offset = elemRect.top - containerRect.top + container.scrollTop
    container.scrollTo({ top: offset, behavior: 'smooth' })
    setCurrentSlide(idx)
  }, [])

  // 스크롤 시 현재 슬라이드 추적 (중심점 거리 기반 + capture 옵션)
  useEffect(() => {
    const container = containerRef.current
    if (!container || slides.length === 0) return

    const handleScroll = () => {
      const containerRect = container.getBoundingClientRect()
      const containerCenter = containerRect.top + containerRect.height / 2

      let closestIdx = 1
      let minDistance = Infinity

      for (let i = 0; i < slides.length; i++) {
        const rect = slides[i].element.getBoundingClientRect()
        const slideCenter = rect.top + rect.height / 2
        const dist = Math.abs(slideCenter - containerCenter)
        if (dist < minDistance) {
          minDistance = dist
          closestIdx = slides[i].index
        }
      }
      setCurrentSlide(closestIdx)
    }

    container.addEventListener('scroll', handleScroll, { passive: true, capture: true })
    window.addEventListener('resize', handleScroll, { passive: true })
    return () => {
      container.removeEventListener('scroll', handleScroll, true)
      window.removeEventListener('resize', handleScroll)
    }
  }, [slides])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    setSlides([])

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
        if (!cancelled) {
          setLoading(false)
          setTimeout(parseSlides, 350)
        }
      } catch (e: any) {
        if (!cancelled) {
          setError(e.message === 'VFS_EXPIRED' ? '임시 파일이 만료되었거나 로드에 실패했습니다.' : 'PPTX 로드 실패')
          setLoading(false)
        }
      }
    }

    if (sourceUrl) loadPptx()
    return () => { cancelled = true }
  }, [sourceUrl, parseSlides])

  return (
    <div style={{ position: 'relative', width: '100%', height, background: '#f8fafc', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      {/* PPT 상단 툴바: 현재 슬라이드 번호 및 목차 버튼 */}
      {!loading && !error && (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '4px 12px', background: 'rgba(15, 23, 42, 0.95)', borderBottom: '1px solid rgba(255,255,255,0.1)',
          color: '#e2e8f0', fontSize: 11, fontWeight: 600, zIndex: 15, flexShrink: 0
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ padding: '2px 6px', background: '#f9731633', color: '#f97316', borderRadius: 4, fontSize: 10 }}>
              📊 Slide {currentSlide} / {slides.length || 1}
            </span>
          </div>
          {slides.length > 0 && (
            <button
              onClick={() => setShowToc(!showToc)}
              style={{
                background: showToc ? '#f9731622' : 'transparent',
                border: '1px solid ' + (showToc ? '#f9731666' : 'rgba(255,255,255,0.2)'),
                color: showToc ? '#f97316' : '#94a3b8',
                borderRadius: 4, padding: '2px 8px', fontSize: 11, cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 4
              }}
            >
              <List size={12} />
              {showToc ? '목차 닫기' : '슬라이드 목차'}
            </button>
          )}
        </div>
      )}

      <div style={{ position: 'relative', flex: 1, overflow: 'hidden', display: 'flex' }}>
        {loading && <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', color: '#94a3b8', fontSize: 13 }}>PowerPoint 로드 중...</div>}
        {error && <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', color: '#ef4444', fontSize: 13 }}>{error}</div>}
        
        <div 
          ref={containerRef} 
          style={{ flex: 1, height: '100%', overflow: 'auto', display: (loading || error) ? 'none' : 'block' }}
          onMouseMove={e => e.stopPropagation()}
          onMouseDown={e => e.stopPropagation()}
          onMouseUp={e => e.stopPropagation()}
        />

        {/* PPT 목차 사이드 드로어 */}
        {showToc && slides.length > 0 && (
          <div style={{
            width: 220, height: '100%', background: '#0f172a', borderLeft: '1px solid rgba(255,255,255,0.1)',
            overflowY: 'auto', padding: 8, zIndex: 20, flexShrink: 0
          }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#f97316', marginBottom: 8, paddingBottom: 4, borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
              📋 슬라이드 목차 ({slides.length})
            </div>
            {slides.map(item => (
              <div
                key={item.index}
                onClick={() => scrollToSlide(item.element, item.index)}
                style={{
                  padding: '6px 8px', borderRadius: 4, marginBottom: 4, cursor: 'pointer', fontSize: 11,
                  background: currentSlide === item.index ? 'rgba(249, 115, 22, 0.2)' : 'transparent',
                  color: currentSlide === item.index ? '#fb923c' : '#cbd5e1',
                  borderLeft: currentSlide === item.index ? '3px solid #f97316' : '3px solid transparent',
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
                }}
                title={item.title}
              >
                <span style={{ fontWeight: 700, marginRight: 6, opacity: 0.7 }}>#{item.index}</span>
                {item.title}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

/** Office 문서 뷰어 (DOCX → docx-preview / mammoth.js HTML + 페이지 및 목차/TOC, XLSX → exceljs HTML) */
export function OfficeDocViewer({ sourceUrl, fileBase64, docType, fileName, height }: {
  sourceUrl: string; fileBase64?: string; docType: DocType; fileName: string; height: number
}) {
  const [htmlContent, setHtmlContent] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [docViewMode, setDocViewMode] = useState<'native' | 'rich'>('native')
  const [cachedBuffer, setCachedBuffer] = useState<ArrayBuffer | null>(null)
  const docxContainerRef = useRef<HTMLDivElement>(null)
  const [tocHeadings, setTocHeadings] = useState<{ id: string; text: string; level: number; element: HTMLElement }[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [showToc, setShowToc] = useState(false)

  const [activeHeadingId, setActiveHeadingId] = useState<string | null>(null)

  // Word 렌더링 완료 후 구조(섹션/페이지, Heading 목차) 파싱
  const parseWordStructure = useCallback(() => {
    const container = docxContainerRef.current
    if (!container) return

    // 1) docx-preview 섹션/페이지 수 파싱
    const sections = Array.from(container.querySelectorAll('section.docx, .docx-wrapper > section, .docx, section, article')) as HTMLElement[]
    if (sections.length > 0) {
      setTotalPages(sections.length)
    } else {
      const approx = Math.max(1, Math.round(container.scrollHeight / 1000))
      setTotalPages(approx)
    }

    // 2) Headings (h1, h2, h3, docx heading classes) 목차 파싱
    const headingElements = Array.from(container.querySelectorAll(
      'h1, h2, h3, h4, h5, h6, .heading, [class*="heading"], [class*="Heading"], [class*="title"], [class*="Title"], p[class*="heading"]'
    )) as HTMLElement[]

    const validHeadings = headingElements.filter(el => {
      const text = el.textContent?.trim() || ''
      return text.length > 0 && text.length < 150
    })

    if (validHeadings.length > 0) {
      const headings = validHeadings.map((el, i) => {
        let level = 1
        const tagName = el.tagName.toLowerCase()
        if (tagName.startsWith('h') && tagName.length === 2) {
          level = parseInt(tagName[1], 10) || 1
        } else {
          const className = el.className || ''
          const match = className.match(/[1-6]/)
          if (match) level = parseInt(match[0], 10)
        }
        return {
          id: `word-heading-${i}`,
          text: el.textContent?.trim() || `제목 ${i + 1}`,
          level: isNaN(level) ? 1 : level,
          element: el
        }
      })
      setTocHeadings(headings)
    } else if (sections.length > 1) {
      // 헤딩 태그가 없는 다중 페이지 문서인 경우: 페이지별 바로가기 목차 생성
      const pageHeadings = sections.map((sec, i) => ({
        id: `word-page-${i}`,
        text: `📄 ${i + 1}페이지 바로가기`,
        level: 1,
        element: sec
      }))
      setTocHeadings(pageHeadings)
    }
  }, [])

  const scrollToHeading = useCallback((el: HTMLElement, id?: string) => {
    if (!el) return
    if (id) setActiveHeadingId(id)
    const container = docxContainerRef.current
    if (container) {
      const containerRect = container.getBoundingClientRect()
      const elRect = el.getBoundingClientRect()
      const scrollOffset = elRect.top - containerRect.top
      container.scrollBy({ top: scrollOffset - 20, behavior: 'smooth' })
    } else {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
    const origBg = el.style.backgroundColor
    const origTransition = el.style.transition
    el.style.transition = 'background-color 0.3s ease'
    el.style.backgroundColor = 'rgba(59, 130, 246, 0.4)'
    setTimeout(() => {
      el.style.backgroundColor = origBg
      el.style.transition = origTransition
    }, 1500)
  }, [])

  // 스크롤 시 현재 페이지 추적
  useEffect(() => {
    const container = docxContainerRef.current
    if (!container) return

    const handleScroll = () => {
      const sections = Array.from(container.querySelectorAll('section.docx, .docx-wrapper > section, .docx, section, article')) as HTMLElement[]
      if (sections.length > 0) {
        const containerRect = container.getBoundingClientRect()
        const containerCenter = containerRect.top + containerRect.height / 2

        let closestPage = 1
        let minDistance = Infinity

        sections.forEach((sec, idx) => {
          const rect = sec.getBoundingClientRect()
          const secCenter = rect.top + rect.height / 2
          const dist = Math.abs(secCenter - containerCenter)
          if (dist < minDistance) {
            minDistance = dist
            closestPage = idx + 1
          }
        })
        setCurrentPage(closestPage)
      } else {
        const p = Math.min(totalPages, Math.max(1, Math.floor(container.scrollTop / 1000) + 1))
        setCurrentPage(p)
      }
    }

    container.addEventListener('scroll', handleScroll, { passive: true, capture: true })
    window.addEventListener('resize', handleScroll, { passive: true })
    return () => {
      container.removeEventListener('scroll', handleScroll, true)
      window.removeEventListener('resize', handleScroll)
    }
  }, [totalPages])

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

        setCachedBuffer(arrayBuffer)

        // 1) mammoth HTML 항상 생성 (브라우저 뷰어용)
        try {
          const mammoth = await import('mammoth')
          const result = await mammoth.convertToHtml({ arrayBuffer })
          setHtmlContent(result.value)
        } catch (mErr) {
          console.warn('[OfficeDocViewer] mammoth convert error:', mErr)
        }

        if (docType === 'docx') {
          if (docViewMode === 'native') {
            try {
              const docxPreview = await import('docx-preview')
              if (docxContainerRef.current) {
                docxContainerRef.current.innerHTML = ''
                await docxPreview.renderAsync(arrayBuffer, docxContainerRef.current, undefined, {
                  className: 'docx-preview-container',
                  inBreak: true,
                  ignoreWidth: false,
                  ignoreHeight: false,
                  ignoreFonts: false,
                  breakPages: true,
                  useBase64URL: true,
                })
                setLoading(false)
                setTimeout(parseWordStructure, 400)
                return
              }
            } catch (previewErr) {
              console.warn('[OfficeDocViewer] docx-preview 렌더링 실패, mammoth 폴백 사용:', previewErr)
            }
          }
          setLoading(false)
          setTimeout(parseWordStructure, 400)
        } else if (docType === 'xlsx') {
          const ExcelJS = await import('exceljs')
          const wb = new ExcelJS.Workbook()
          await wb.xlsx.load(arrayBuffer)
          const escapeHtml = (str: string) => str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;')
          let html = ''
          wb.eachSheet((worksheet) => {
            html += `<h3 style="margin-top: 1em; border-bottom: 1px solid #cbd5e1; padding-bottom: 8px; color: #1e293b;">${escapeHtml(worksheet.name)}</h3>`
            html += `<table style="width: 100%; border-collapse: collapse; margin-bottom: 1.5em; font-size: 13px;">`
            worksheet.eachRow((row) => {
              html += '<tr>'
              const cells = (row.values as any[]).slice(1)
              cells.forEach((v) => {
                const cellText = v != null ? (typeof v === 'object' && 'result' in v ? String(v.result ?? '') : String(v)) : ''
                html += `<td style="border: 1px solid #cbd5e1; padding: 6px 12px; font-family: sans-serif;">${escapeHtml(cellText)}</td>`
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
  }, [sourceUrl, docType, fileBase64, docViewMode, parseWordStructure])

  // 모드 전환 시 렌더링 재실행
  useEffect(() => {
    if (!cachedBuffer || docType !== 'docx') return
    if (docViewMode === 'native' && docxContainerRef.current) {
      import('docx-preview').then(docxPreview => {
        if (docxContainerRef.current) {
          docxContainerRef.current.innerHTML = ''
          docxPreview.renderAsync(cachedBuffer, docxContainerRef.current, undefined, {
            className: 'docx-preview-container',
            inBreak: true,
            ignoreWidth: false,
            ignoreHeight: false,
            ignoreFonts: false,
            breakPages: true,
            useBase64URL: true,
          }).then(() => {
            setTimeout(parseWordStructure, 300)
          })
        }
      })
    } else {
      setTimeout(parseWordStructure, 300)
    }
  }, [docViewMode, cachedBuffer, docType, parseWordStructure])

  if (docType === 'docx' || docType === 'xlsx') {
    if (loading) return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height, color: '#94a3b8', fontSize: 12 }}>
        문서 변환 및 렌더링 중...
      </div>
    )

    const goToDocxPage = (targetP: number) => {
      const p = Math.max(1, Math.min(totalPages, targetP))
      const container = docxContainerRef.current
      if (!container) return
      const sections = Array.from(container.querySelectorAll('section.docx, .docx-wrapper > section, .docx, section, article')) as HTMLElement[]
      if (sections.length >= p) {
        sections[p - 1].scrollIntoView({ behavior: 'smooth', block: 'start' })
        setCurrentPage(p)
      } else {
        container.scrollTo({ top: (p - 1) * 1000, behavior: 'smooth' })
        setCurrentPage(p)
      }
    }

    return (
      <div style={{ position: 'relative', width: '100%', height, background: '#0b0f19', display: 'flex', flexDirection: 'column' }}>
        {/* Word/Docs 상단 툴바: PDF 뷰어와 동일한 페이지 이동 및 목차 버튼 */}
        {docType === 'docx' && (
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '4px 12px', background: 'rgba(15, 23, 42, 0.95)', borderBottom: '1px solid rgba(255,255,255,0.1)',
            color: '#e2e8f0', fontSize: 11, fontWeight: 600, zIndex: 15, flexShrink: 0
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <button
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: '2px 6px', fontSize: 14, lineHeight: 1 }}
                onClick={() => goToDocxPage(currentPage - 1)}
                disabled={currentPage <= 1}
                title="이전 페이지"
              >‹</button>
              <span style={{ padding: '2px 8px', background: '#3b82f633', color: '#60a5fa', borderRadius: 4, fontSize: 11, fontWeight: 700 }}>
                📄 {currentPage} / {totalPages} 페이지
              </span>
              <button
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: '2px 6px', fontSize: 14, lineHeight: 1 }}
                onClick={() => goToDocxPage(currentPage + 1)}
                disabled={currentPage >= totalPages}
                title="다음 페이지"
              >›</button>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <button
                onClick={() => setDocViewMode(prev => prev === 'native' ? 'rich' : 'native')}
                style={{
                  background: docViewMode === 'rich' ? 'rgba(168, 85, 247, 0.25)' : 'rgba(59, 130, 246, 0.2)',
                  border: '1px solid ' + (docViewMode === 'rich' ? 'rgba(168, 85, 247, 0.5)' : 'rgba(59, 130, 246, 0.4)'),
                  color: docViewMode === 'rich' ? '#d8b4fe' : '#93c5fd',
                  borderRadius: 4, padding: '3px 8px', fontSize: 11, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 4, fontWeight: 600
                }}
                title={docViewMode === 'native' ? '웹 리더 브라우저 뷰어로 전환' : 'A4 원본 조판 내장 뷰어로 전환'}
              >
                {docViewMode === 'native' ? '🖥️ 브라우저 뷰어' : '📑 A4 내장 뷰어'}
              </button>
              <button
                onClick={() => {
                  const root = docxContainerRef.current?.closest('[data-viewer-inner]');
                  const searchBtn = root?.parentElement?.querySelector('button[title*="문서 검색"]') as HTMLButtonElement;
                  if (searchBtn) searchBtn.click();
                  else {
                    const searchInp = root?.querySelector('input[data-pdf-search-input]') as HTMLInputElement;
                    if (searchInp) { searchInp.focus(); searchInp.select(); }
                  }
                }}
                style={{
                  background: 'rgba(59, 130, 246, 0.2)',
                  border: '1px solid rgba(59, 130, 246, 0.4)',
                  color: '#93c5fd',
                  borderRadius: 4, padding: '3px 8px', fontSize: 11, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 4, fontWeight: 600
                }}
                title="문서 검색 열기"
              >
                <Search size={12} />
                검색
              </button>
              {tocHeadings.length > 0 && (
                <button
                  onClick={() => setShowToc(!showToc)}
                  style={{
                    background: showToc ? '#3b82f633' : 'transparent',
                    border: '1px solid ' + (showToc ? '#3b82f6' : 'rgba(255,255,255,0.2)'),
                    color: showToc ? '#60a5fa' : '#94a3b8',
                    borderRadius: 4, padding: '3px 10px', fontSize: 11, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: 4, fontWeight: 600
                  }}
                >
                  <List size={12} />
                  {showToc ? '목차 닫기' : `문서 목차 (${tocHeadings.length})`}
                </button>
              )}
            </div>
          </div>
        )}

        <div style={{ position: 'relative', flex: 1, overflow: 'hidden', display: 'flex' }}>
          <div
            ref={docxContainerRef}
            contentEditable={false}
            onMouseMove={e => e.stopPropagation()}
            onMouseDown={e => e.stopPropagation()}
            onMouseUp={e => e.stopPropagation()}
            style={{
              flex: 1,
              height: '100%',
              overflow: 'auto',
              background: '#0b0f19',
              color: '#0f172a',
              fontSize: 13,
              lineHeight: 1.6,
              position: 'relative',
            }}
          >
            <style>{`
              .docx-preview-container {
                background: #0b0f19 !important;
                padding: 24px 16px !important;
                display: flex !important;
                flex-direction: column !important;
                align-items: center !important;
              }
              .docx-preview-container .docx-wrapper {
                background: transparent !important;
                padding: 0 !important;
                display: flex !important;
                flex-direction: column !important;
                align-items: center !important;
                gap: 20px !important;
                width: 100% !important;
              }
              .docx-preview-container section.docx {
                background: #ffffff !important;
                box-shadow: 0 8px 32px rgba(0,0,0,0.45) !important;
                border-radius: 4px !important;
                margin: 0 auto !important;
                padding: 48px 56px !important;
                max-width: 820px !important;
                width: 100% !important;
                box-sizing: border-box !important;
                color: #1e293b !important;
                min-height: 1050px !important;
              }
              .docx-styled-html {
                max-width: 820px;
                margin: 24px auto;
                padding: 48px 56px;
                background: #ffffff;
                border-radius: 4px;
                box-shadow: 0 8px 32px rgba(0,0,0,0.45);
                min-height: 100%;
                font-family: 'Pretendard', -apple-system, BlinkMacSystemFont, Roboto, sans-serif;
                color: #1e293b;
              }
              .docx-styled-html table {
                border-collapse: collapse !important;
                width: 100% !important;
                margin: 1.2em 0 !important;
                border: 1px solid #cbd5e1 !important;
                font-size: 13px !important;
              }
              .docx-styled-html th, .docx-styled-html td {
                border: 1px solid #cbd5e1 !important;
                padding: 8px 12px !important;
                text-align: left !important;
                vertical-align: top !important;
                color: #1e293b !important;
              }
              .docx-styled-html th {
                background-color: #f1f5f9 !important;
                font-weight: 600 !important;
              }
              .docx-styled-html tr:nth-child(even) td {
                background-color: #f8fafc !important;
              }
              .docx-styled-html p {
                margin: 0.6em 0 !important;
                line-height: 1.65 !important;
              }
              .docx-styled-html h1, .docx-styled-html h2, .docx-styled-html h3 {
                color: #0f172a !important;
                margin-top: 1.2em !important;
                margin-bottom: 0.5em !important;
                font-weight: 700 !important;
              }
            `}</style>
            
            {docType === 'docx' && docViewMode === 'rich' ? (
              <div style={{ width: '100%', minHeight: '100%', padding: '24px 16px', display: 'flex', justifyContent: 'center' }}>
                <div
                  className="docx-styled-html"
                  style={{ maxWidth: '880px', width: '100%', margin: '0 auto', background: '#ffffff', padding: '48px 56px', borderRadius: '6px', boxShadow: '0 8px 32px rgba(0,0,0,0.45)' }}
                  dangerouslySetInnerHTML={{ __html: htmlContent || '' }}
                />
              </div>
            ) : docType === 'xlsx' ? (
              <div
                className="docx-styled-html"
                dangerouslySetInnerHTML={{ __html: htmlContent || '' }}
              />
            ) : null}
          </div>

          {/* Word 목차 사이드 드로어 */}
          {showToc && tocHeadings.length > 0 && (
            <div style={{
              width: 220, height: '100%', background: '#0f172a', borderLeft: '1px solid rgba(255,255,255,0.1)',
              overflowY: 'auto', padding: 8, zIndex: 20, flexShrink: 0
            }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#60a5fa', marginBottom: 8, paddingBottom: 4, borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                📋 문서 목차 ({tocHeadings.length})
              </div>
              {tocHeadings.map(item => (
                <div
                  key={item.id}
                  onClick={() => scrollToHeading(item.element, item.id)}
                  style={{
                    padding: '6px 8px', borderRadius: 4, marginBottom: 3, cursor: 'pointer', fontSize: 11,
                    paddingLeft: `${Math.min(24, (item.level - 1) * 10 + 8)}px`,
                    background: activeHeadingId === item.id ? 'rgba(59, 130, 246, 0.25)' : 'transparent',
                    color: activeHeadingId === item.id ? '#60a5fa' : '#cbd5e1',
                    borderLeft: activeHeadingId === item.id ? '3px solid #3b82f6' : '3px solid transparent',
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                    transition: 'all 0.15s',
                  }}
                  onMouseEnter={e => {
                    if (activeHeadingId !== item.id) {
                      e.currentTarget.style.background = 'rgba(59, 130, 246, 0.15)'
                      e.currentTarget.style.color = '#93c5fd'
                    }
                  }}
                  onMouseLeave={e => {
                    if (activeHeadingId !== item.id) {
                      e.currentTarget.style.background = 'transparent'
                      e.currentTarget.style.color = '#cbd5e1'
                    }
                  }}
                  title={item.text}
                >
                  {item.text}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
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

/**
 * InlineDocumentBlock 상태, 변수 또는 상수 선언부입니다.
 * @type {any} - Typescript 컴파일러에 의한 타입 추론(Inferred)
 */
export const InlineDocumentBlock = InlineDocumentBlockSpec()
