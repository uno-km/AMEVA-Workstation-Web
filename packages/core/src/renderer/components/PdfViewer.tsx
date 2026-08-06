/**
 * @file PdfViewer.tsx
 * @system AMEVA OS Desktop Workstation
 * @location src/renderer/components/PdfViewer.tsx
 * @role PDF Canvas 직접 렌더링 뷰어 컴포넌트
 *
 * [책임 범위 - RESPONSIBILITY]
 * - pdfjs-dist를 사용하여 PDF 파일의 각 페이지를 Canvas에 직접 렌더링한다.
 * - 원본 PDF와 동일한 레이아웃(표, 이미지, 서식)을 보존하여 표시한다.
 * - 페이지 이동, 줌인/아웃, 썸네일 사이드바 등 고급 뷰어 UI를 제공한다.
 *
 * [소비처 - CONSUMERS / USAGE CONTEXT]
 * - 소비처 A (MarkdownEditor.tsx): PDF 파일 열기 시 에디터 대신 조건부 렌더링.
 * - 소비처 B (useAppFileOperations.ts): .pdf 확장자 감지 시 이 뷰어로 라우팅.
 */

import React, { useEffect, useRef, useState, useCallback } from 'react'
import * as pdfjsLib from 'pdfjs-dist'
import PdfWorker from 'pdfjs-dist/build/pdf.worker.mjs?worker'
import {
  ChevronLeft, ChevronRight, ZoomIn, ZoomOut, RotateCw,
  Download, Maximize2, Minimize2, FileText, Search,
  Highlighter, Type, PenLine, Square, ArrowRight, Eraser, Save, Minus, List, Bookmark
} from 'lucide-react'
import { PdfAnnotationLayer } from './PdfAnnotationLayer'
import { usePdfAnnotations } from '../hooks/usePdfAnnotations'
import type { AnnotationTool } from '../hooks/usePdfAnnotations'
import { uint8ArrayToBase64 } from '../utils/pdfAnnotationWriter'


// [NEW] 50페이지 제한을 없애고 레이지 로딩을 지원하는 썸네일 컴포넌트
function PdfThumbnail({ pdf, pageNum, isActive, onClick }: { pdf: any, pageNum: number, isActive: boolean, onClick: () => void }) {
  const [imgData, setImgData] = React.useState<string>('')
  const containerRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    if (!pdf || !containerRef.current) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          observer.disconnect()
          pdf.getPage(pageNum).then((page: any) => {
            const viewport = page.getViewport({ scale: 0.2, rotation: 0 })
            const canvas = document.createElement('canvas')
            canvas.width = viewport.width
            canvas.height = viewport.height
            const ctx = canvas.getContext('2d')
            if (ctx) {
              page.render({ canvasContext: ctx, viewport }).promise.then(() => {
                setImgData(canvas.toDataURL('image/jpeg', 0.7))
                page.cleanup()
              }).catch(() => {})
            }
          }).catch(() => {})
        }
      },
      { rootMargin: '200px 0px' }
    )
    observer.observe(containerRef.current)
    return () => observer.disconnect()
  }, [pdf, pageNum])

  return (
    <div
      ref={containerRef}
      onClick={onClick}
      style={{
        cursor: 'pointer', borderRadius: '6px', overflow: 'hidden',
        border: isActive ? '2px solid #3b82f6' : '2px solid transparent',
        boxShadow: isActive ? '0 0 10px rgba(59,130,246,0.4)' : 'none',
        background: '#1e1e2e', transition: 'all 0.15s ease', flexShrink: 0,
      }}
      title={`페이지 ${pageNum}`}
    >
      {imgData ? (
        <img src={imgData} alt={`페이지 ${pageNum}`} style={{ width: '100%', display: 'block' }} />
      ) : (
        <div style={{
          width: '100%', aspectRatio: '0.71', background: '#252535',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'rgba(255,255,255,0.2)', fontSize: '10px',
        }}>
          {pageNum}
        </div>
      )}
      <div style={{
        textAlign: 'center', fontSize: '9px', color: isActive ? '#60a5fa' : '#64748b',
        padding: '2px 0', fontWeight: isActive ? 700 : 400,
      }}>
        {pageNum}
      </div>
    </div>
  )
}

// [CONTINUOUS] 연속 스크롤 모드용 단일 페이지 캔버스 (lazy 렌더링)
function ContinuousPageCanvas({
  pdf, pageNum, scale, rotation, isActive, onVisible, pageCache,
}: {
  pdf: any, pageNum: number, scale: number, rotation: number,
  isActive: boolean, onVisible: (n: number) => void, pageCache: React.MutableRefObject<Map<number, any>>,
}) {
  const canvasRef = React.useRef<HTMLCanvasElement>(null)
  const containerRef = React.useRef<HTMLDivElement>(null)
  const renderTaskRef = React.useRef<any>(null)
  const [rendered, setRendered] = React.useState(false)

  React.useEffect(() => {
    if (!containerRef.current) return
    const obs = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        onVisible(pageNum)
      }
    }, { threshold: 0.2 })
    obs.observe(containerRef.current)
    return () => obs.disconnect()
  }, [pageNum, onVisible])

  React.useEffect(() => {
    if (!pdf || !canvasRef.current) return
    // 뷰포트 안에 들어올 때만 렌더링
    const obs = new IntersectionObserver(async (entries) => {
      if (!entries[0].isIntersecting) return
      obs.disconnect()
      if (renderTaskRef.current) {
        try { renderTaskRef.current.cancel() } catch {}
        renderTaskRef.current = null
      }
      try {
        let page = pageCache.current.get(pageNum)
        if (!page) {
          page = await pdf.getPage(pageNum)
          pageCache.current.set(pageNum, page)
        }
        const viewport = page.getViewport({ scale, rotation })
        const canvas = canvasRef.current
        if (!canvas) return
        const dpr = window.devicePixelRatio || 1
        canvas.width = Math.floor(viewport.width * dpr)
        canvas.height = Math.floor(viewport.height * dpr)
        canvas.style.width = `${viewport.width}px`
        canvas.style.height = `${viewport.height}px`
        const ctx = canvas.getContext('2d')!
        ctx.scale(dpr, dpr)
        const task = page.render({ canvasContext: ctx, viewport })
        renderTaskRef.current = task
        await task.promise
        setRendered(true)
      } catch {}
    }, { rootMargin: '300px 0px' })
    if (containerRef.current) obs.observe(containerRef.current)
    return () => obs.disconnect()
  }, [pdf, pageNum, scale, rotation])

  return (
    <div
      ref={containerRef}
      style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        marginBottom: '16px', flexShrink: 0,
      }}
    >
      <div style={{
        fontSize: '10px', color: isActive ? '#3b82f6' : '#475569',
        marginBottom: '4px', fontWeight: isActive ? 700 : 400,
      }}>{pageNum}</div>
      <div style={{
        boxShadow: isActive
          ? '0 0 0 2px #3b82f6, 0 8px 32px rgba(0,0,0,0.6)'
          : '0 4px 24px rgba(0,0,0,0.5)',
        borderRadius: '3px', overflow: 'hidden', background: '#fff',
        transition: 'box-shadow 0.2s',
      }}>
        <canvas ref={canvasRef} />
      </div>
    </div>
  )
}

// [FIX-CSP-001] PDF Worker CSP 대응 (Vite 기본 worker 활용)
pdfjsLib.GlobalWorkerOptions.workerPort = new PdfWorker()

interface PdfViewerProps {
  /** base64 인코딩된 PDF 데이터 또는 URL */
  pdfData: string
  /** 파일명 표시용 */
  fileName?: string
  /** 닫기/뒤로가기 콜백 (선택) */
  onClose?: () => void
  /** AMEVA 문서로 변환 콜백 (선택) */
  onConvertToAmeva?: () => void
}

/**
 * PDF 뷰어 - Canvas 직접 렌더링 방식
 * Adobe/알씨 수준의 레이아웃 보존 뷰어
 */
export function PdfViewer({ pdfData, fileName = 'document.pdf', onClose, onConvertToAmeva }: PdfViewerProps) {
  const [pdf, setPdf] = useState<any>(null)
  const [numPages, setNumPages] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [scale, setScale] = useState(1.3)
  const [rotation, setRotation] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showSidebar, setShowSidebar] = useState(true)
  const [sidebarMode, setSidebarMode] = useState<'thumbnail' | 'outline' | 'bookmark'>('thumbnail')
  const [outlines, setOutlines] = useState<any[]>([])
  const [bookmarks, setBookmarks] = useState<{ page: number; label: string }[]>(() => {
    try { return JSON.parse(localStorage.getItem(`pdf_bookmarks_${fileName}`) || '[]') } catch { return [] }
  })
  const [pageTransition, setPageTransition] = useState<'slide-left' | 'slide-right' | 'none'>('none')
  const [hoveredArrow, setHoveredArrow] = useState<'left' | 'right' | null>(null)
  const dragStartRef = useRef<{ x: number; y: number } | null>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [pageInput, setPageInput] = useState('1')
  const [searchQuery, setSearchQuery] = useState('')
  const [showSearch, setShowSearch] = useState(false)
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 })
  const [showAnnotationTools, setShowAnnotationTools] = useState(false)
  const [annotationOpacity, setAnnotationOpacity] = useState(0.85)
  const [isSavingAnnotated, setIsSavingAnnotated] = useState(false)

  // 주석 관리 훅 (파일명 기반 localStorage 키)
  const storageKey = fileName.replace(/[^a-zA-Z0-9가-힣_-]/g, '_')
  const {
    annotations,
    activeTool,
    activeColor,
    setActiveTool,
    setActiveColor,
    addAnnotation,
    deleteAnnotation,
    clearAllAnnotations,
    saveAnnotatedPdf,
    annotationColors,
  } = usePdfAnnotations(storageKey)

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const renderTaskRef = useRef<any>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  // [CACHE-1] 페이지 객체 캐시 (반복 goToPage 시 재 getPage 호출 생략)
  const pageCacheRef = useRef<Map<number, any>>(new Map())
  // [SCROLL-1] 연속 스크롤 모드 - 기본값 true
  const [continuousScroll, setContinuousScroll] = useState(true)
  const pageRefs = useRef<(HTMLDivElement | null)[]>([])
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  // [SEARCH-1] 텍스트 검색 인덱스 {pageNum → TextItem[]}
  const [searchIndex, setSearchIndex] = useState<Record<number, string>>({})
  const [searchResults, setSearchResults] = useState<{ page: number; count: number }[]>([])
  const [searchResultIdx, setSearchResultIdx] = useState(0)
  const [isIndexing, setIsIndexing] = useState(false)

  // PDF 로드
  useEffect(() => {
    let isMounted = true
    setLoading(true)
    setError(null)
    setPdf(null)
    setOutlines([])

    const loadPdf = async () => {
      try {
        let pdfSource: any

        if (pdfData.startsWith('data:') || pdfData.startsWith('http')) {
          pdfSource = { url: pdfData }
        } else {
          // base64 → Uint8Array
          const binaryStr = window.atob(pdfData.replace(/\s/g, ''))
          const bytes = new Uint8Array(binaryStr.length)
          for (let i = 0; i < binaryStr.length; i++) {
            bytes[i] = binaryStr.charCodeAt(i)
          }
          pdfSource = {
            data: bytes,
            standardFontDataUrl: `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/standard_fonts/`,
            cMapUrl: `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/cmaps/`,
            cMapPacked: true
          }
        }

        const loadedPdf = await pdfjsLib.getDocument(pdfSource).promise
        if (!isMounted) return

        setPdf(loadedPdf)
        setNumPages(loadedPdf.numPages)
        setCurrentPage(1)
        setPageInput('1')
        setLoading(false)

        try {
          const outline = await loadedPdf.getOutline()
          setOutlines(outline || [])
        } catch (e) {
          setOutlines([])
        }
      } catch (err: any) {
        if (isMounted) {
          setError(`PDF 로드 실패: ${err.message}`)
          setLoading(false)
        }
      }
    }

    loadPdf()
    // PDF 변경 시 캐시 초기화
    return () => {
      isMounted = false
      pageCacheRef.current.clear()
    }
  }, [pdfData])

  // [SEARCH-2] PDF 텍스트 인덱싱 (비동기, 백그라운드)
  useEffect(() => {
    if (!pdf || numPages === 0) return
    let cancelled = false
    setIsIndexing(true)
    setSearchIndex({})
    const buildIndex = async () => {
      const idx: Record<number, string> = {}
      for (let i = 1; i <= numPages; i++) {
        if (cancelled) break
        try {
          const page = await pdf.getPage(i)
          const tc = await page.getTextContent()
          idx[i] = tc.items.map((it: any) => it.str || '').join(' ')
        } catch {}
      }
      if (!cancelled) {
        setSearchIndex(idx)
        setIsIndexing(false)
      }
    }
    buildIndex()
    return () => { cancelled = true }
  }, [pdf, numPages])

  // [SEARCH-3] 검색 쿼리 변경 시 결과 갱신
  useEffect(() => {
    if (!searchQuery.trim()) { setSearchResults([]); return }
    const q = searchQuery.toLowerCase()
    const results = Object.entries(searchIndex)
      .filter(([, text]) => text.toLowerCase().includes(q))
      .map(([page, text]) => {
        const count = (text.toLowerCase().match(new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length
        return { page: Number(page), count }
      })
      .sort((a, b) => a.page - b.page)
    setSearchResults(results)
    setSearchResultIdx(0)
    if (results.length > 0) goToPage(results[0].page)
  }, [searchQuery, searchIndex])





  // 목차(Outline) 렌더링
  const renderOutline = (items: any[], depth = 0) => {
    return items.map((item, idx) => (
      <div key={idx} style={{ paddingLeft: `${depth * 10}px` }}>
        <div 
          style={{ 
            fontSize: '11px', color: '#e2e8f0', cursor: 'pointer', padding: '6px 0',
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            borderBottom: '1px solid rgba(255,255,255,0.05)'
          }}
          onClick={async () => {
            if (item.dest) {
              try {
                let dest = item.dest
                if (typeof dest === 'string') {
                  dest = await pdf.getDestination(dest)
                }
                const pageIdx = await pdf.getPageIndex(dest[0])
                goToPage(pageIdx + 1)
              } catch (e) { console.error(e) }
            }
          }}
        >
          {item.title}
        </div>
        {item.items && item.items.length > 0 && renderOutline(item.items, depth + 1)}
      </div>
    ))
  }

  // 복입마크 (localStorage 저장)
  const toggleBookmark = () => {
    setBookmarks(prev => {
      const exists = prev.find(b => b.page === currentPage)
      const next = exists
        ? prev.filter(b => b.page !== currentPage)
        : [...prev, { page: currentPage, label: `페이지 ${currentPage}` }].sort((a, b) => a.page - b.page)
      localStorage.setItem(`pdf_bookmarks_${fileName}`, JSON.stringify(next))
      return next
    })
  }
  const isBookmarked = bookmarks.some(b => b.page === currentPage)

  // 연속 스크롤 모드 - 페이지 노출 콜백 (커포넌트 레벨에서 선언)
  const handlePageVisible = useCallback((n: number) => {
    setCurrentPage(n)
    setPageInput(String(n))
  }, [])

  // 마우스/터치 스와이프 (single page mode)
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (activeTool !== 'none' || showAnnotationTools || continuousScroll) return
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

  // 현재 페이지 렌더링
  const renderPage = useCallback(async (pageNum: number, scaleVal: number, rot: number) => {
    if (!pdf || !canvasRef.current) return

    // 이전 렌더 태스크 취소
    if (renderTaskRef.current) {
      try { renderTaskRef.current.cancel() } catch {}
      renderTaskRef.current = null
    }

    try {
      // [CACHE-2] 캐시에서 꺼내거나 새로 가져와 캐시에 저장
      let page = pageCacheRef.current.get(pageNum)
      if (!page) {
        page = await pdf.getPage(pageNum)
        pageCacheRef.current.set(pageNum, page)
      }
      const viewport = page.getViewport({ scale: scaleVal, rotation: rot })

      const canvas = canvasRef.current
      const ctx = canvas.getContext('2d')!

      // HiDPI 대응
      const dpr = window.devicePixelRatio || 1
      canvas.width = Math.floor(viewport.width * dpr)
      canvas.height = Math.floor(viewport.height * dpr)
      canvas.style.width = `${viewport.width}px`
      canvas.style.height = `${viewport.height}px`
      ctx.scale(dpr, dpr)

      setCanvasSize({ width: viewport.width, height: viewport.height })

      const renderContext = { canvasContext: ctx, viewport }
      const task = page.render(renderContext)
      renderTaskRef.current = task

      await task.promise
      // 캐시된 페이지는 cleanup하지 않음 (재사용 목적)
    } catch (err: any) {
      if (err?.name !== 'RenderingCancelledException') {
        console.error('[PdfViewer] 페이지 렌더링 실패:', err)
      }
    }
  }, [pdf])

  useEffect(() => {
    if (pdf) {
      renderPage(currentPage, scale, rotation)
    }
  }, [pdf, currentPage, scale, rotation, renderPage])

  const goToPage = (page: number, direction?: 'left' | 'right') => {
    const p = Math.max(1, Math.min(numPages, page))
    if (p === currentPage) return
    const dir = direction ?? (p > currentPage ? 'left' : 'right')
    setPageTransition(dir === 'left' ? 'slide-left' : 'slide-right')
    setTimeout(() => {
      setCurrentPage(p)
      setPageInput(String(p))
      setPageTransition('none')
    }, 10)
  }

  const handlePageInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const n = parseInt(pageInput, 10)
      if (!isNaN(n)) goToPage(n)
    }
  }

  const handleZoomIn = () => setScale(s => Math.min(s + 0.25, 5.0))
  const handleZoomOut = () => setScale(s => Math.max(s - 0.25, 0.25))
  const handleRotate = () => setRotation(r => (r + 90) % 360)

  // 주석 임베딩 PDF 저장 다운로드
  const handleSaveAnnotated = async () => {
    if (isSavingAnnotated) return
    setIsSavingAnnotated(true)
    try {
      const annotatedBase64 = await saveAnnotatedPdf(pdfData)
      const link = document.createElement('a')
      link.href = `data:application/pdf;base64,${annotatedBase64}`
      const baseName = fileName.replace(/\.pdf$/i, '')
      link.download = `${baseName}_annotated.pdf`
      link.click()
    } catch (e) {
      console.error('[PdfViewer] 주석 PDF 저장 실패:', e)
    } finally {
      setIsSavingAnnotated(false)
    }
  }

  const handleDownload = () => {
    try {
      const link = document.createElement('a')
      link.href = `data:application/pdf;base64,${pdfData}`
      link.download = fileName
      link.click()
    } catch {}
  }

  const handleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen()
    } else {
      document.exitFullscreen()
    }
  }

  // [FULLSCREEN-1] ESC 키 등으로 빠져나왔을 때도 상태 동기화
  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', handler)
    return () => document.removeEventListener('fullscreenchange', handler)
  }, [])

  // 키보드 단축키
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') goToPage(currentPage + 1)
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') goToPage(currentPage - 1)
      if (e.key === '+' || e.key === '=') handleZoomIn()
      if (e.key === '-') handleZoomOut()
      if (e.key === 'f' || e.key === 'F') setShowSearch(s => !s)
      if (e.key === 'c' || e.key === 'C') setContinuousScroll(s => !s)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [currentPage, numPages])

  const toolbarStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '8px 16px',
    background: 'rgba(15, 15, 20, 0.95)',
    borderBottom: '1px solid rgba(255,255,255,0.08)',
    flexShrink: 0,
    flexWrap: 'wrap',
    backdropFilter: 'blur(12px)',
    userSelect: 'none',
  }

  const btnStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '28px',
    height: '28px',
    borderRadius: '6px',
    border: '1px solid rgba(255,255,255,0.1)',
    background: 'rgba(255,255,255,0.05)',
    color: '#e2e8f0',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    flexShrink: 0,
  }

  const divider: React.CSSProperties = {
    width: '1px',
    height: '20px',
    background: 'rgba(255,255,255,0.12)',
    margin: '0 4px',
  }

  if (loading) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        width: '100%', height: '100%',
        background: 'var(--bg-deep)', color: 'var(--text-muted)',
        flexDirection: 'column', gap: '12px'
      }}>
        <div style={{
          width: '36px', height: '36px', borderRadius: '50%',
          border: '3px solid rgba(139, 92, 246, 0.2)',
          borderTop: '3px solid #3b82f6',
          animation: 'spin 0.8s linear infinite'
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <span style={{ fontSize: '12px' }}>PDF 로딩 중...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        width: '100%', height: '100%',
        background: 'var(--bg-deep)', color: '#f87171',
        flexDirection: 'column', gap: '8px', padding: '32px', textAlign: 'center'
      }}>
        <FileText size={40} style={{ opacity: 0.4 }} />
        <div style={{ fontSize: '13px', fontWeight: 600 }}>PDF 로드 실패</div>
        <div style={{ fontSize: '11px', color: 'var(--text-muted)', maxWidth: '400px' }}>{error}</div>
        {onClose && (
          <button
            onClick={onClose}
            style={{
              marginTop: '12px', padding: '6px 16px', borderRadius: '8px',
              background: 'rgba(59,130,246,0.2)', border: '1px solid rgba(59,130,246,0.4)',
              color: '#60a5fa', cursor: 'pointer', fontSize: '12px', fontWeight: 600
            }}
          >
            뒤로가기
          </button>
        )}
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        height: '100%',
        background: 'var(--bg-deep)',
        overflow: 'hidden',
      }}
    >
      {/* ── 툴바 ── */}
      <div style={toolbarStyle}>
        {/* 파일 정보 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginRight: '4px' }}>
          <FileText size={14} style={{ color: '#3b82f6', flexShrink: 0 }} />
          <span style={{
            fontSize: '11px', fontWeight: 600, color: '#e2e8f0',
            maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
          }}>
            {fileName}
          </span>
        </div>

        <div style={divider} />

        {/* 페이지 이동 */}
        <button style={btnStyle} onClick={() => goToPage(currentPage - 1)} title="이전 페이지 (←)" disabled={currentPage <= 1}>
          <ChevronLeft size={14} />
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <input
            type="text"
            value={pageInput}
            onChange={e => setPageInput(e.target.value)}
            onKeyDown={handlePageInputKeyDown}
            onBlur={() => { const n = parseInt(pageInput, 10); if (!isNaN(n)) goToPage(n) }}
            style={{
              width: '38px', height: '26px', borderRadius: '5px',
              background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
              color: '#fff', fontSize: '11px', textAlign: 'center', outline: 'none',
              fontFamily: 'inherit'
            }}
          />
          <span style={{ fontSize: '11px', color: 'var(--text-muted)', flexShrink: 0 }}>/ {numPages}</span>
        </div>
        <button style={btnStyle} onClick={() => goToPage(currentPage + 1)} title="다음 페이지 (→)" disabled={currentPage >= numPages}>
          <ChevronRight size={14} />
        </button>

        <div style={divider} />

        {/* 줌 */}
        <button style={btnStyle} onClick={handleZoomOut} title="줌 아웃 (-)">
          <ZoomOut size={13} />
        </button>
        <span style={{
          fontSize: '11px', color: '#e2e8f0', minWidth: '40px', textAlign: 'center',
          background: 'rgba(255,255,255,0.06)', borderRadius: '4px', padding: '3px 6px',
          border: '1px solid rgba(255,255,255,0.1)'
        }}>
          {Math.round(scale * 100)}%
        </span>
        <button style={btnStyle} onClick={handleZoomIn} title="줌 인 (+)">
          <ZoomIn size={13} />
        </button>

        {/* 빠른 줌 프리셋 */}
        {[0.75, 1.0, 1.3, 2.0].map(s => (
          <button
            key={s}
            style={{
              ...btnStyle,
              width: 'auto',
              padding: '0 6px',
              fontSize: '10px',
              background: Math.abs(scale - s) < 0.01 ? 'rgba(59,130,246,0.25)' : 'rgba(255,255,255,0.04)',
              border: Math.abs(scale - s) < 0.01 ? '1px solid rgba(59,130,246,0.5)' : '1px solid rgba(255,255,255,0.08)',
              color: Math.abs(scale - s) < 0.01 ? '#60a5fa' : '#94a3b8',
            }}
            onClick={() => setScale(s)}
          >
            {Math.round(s * 100)}%
          </button>
        ))}

        <div style={divider} />

        {/* 주석 도구 토글 */}
        <button
          style={{
            ...btnStyle, width: 'auto', padding: '0 8px', fontSize: '10px', fontWeight: 600,
            background: showAnnotationTools ? 'rgba(251,191,36,0.25)' : 'rgba(255,255,255,0.04)',
            color: showAnnotationTools ? '#fbbf24' : '#94a3b8',
            border: showAnnotationTools ? '1px solid rgba(251,191,36,0.4)' : '1px solid rgba(255,255,255,0.1)',
          }}
          onClick={() => setShowAnnotationTools(s => !s)}
          title="주석 도구"
        >
          ✏️ 주석
        </button>

        {/* 주석 도구 - 활성화 시 표시 */}
        {showAnnotationTools && (
          <>
            <div style={divider} />
            {([
              { tool: 'highlight' as AnnotationTool, icon: <Highlighter size={12} />, title: '하이라이트' },
              { tool: 'underline' as AnnotationTool, icon: <Minus size={12} />, title: '밑줄' },
              { tool: 'text' as AnnotationTool, icon: <Type size={12} />, title: '텍스트 메모' },
              { tool: 'draw' as AnnotationTool, icon: <PenLine size={12} />, title: '자유 드로잉' },
              { tool: 'arrow' as AnnotationTool, icon: <ArrowRight size={12} />, title: '화살표' },
              { tool: 'rect' as AnnotationTool, icon: <Square size={12} />, title: '사각형' },
              { tool: 'eraser' as AnnotationTool, icon: <Eraser size={12} />, title: '지우개' },
            ]).map(({ tool, icon, title }) => (
              <button
                key={tool}
                style={{
                  ...btnStyle,
                  background: activeTool === tool ? 'rgba(251,191,36,0.3)' : 'rgba(255,255,255,0.04)',
                  color: activeTool === tool ? '#fbbf24' : '#94a3b8',
                  border: activeTool === tool ? '1px solid rgba(251,191,36,0.5)' : '1px solid rgba(255,255,255,0.1)',
                }}
                onClick={() => setActiveTool(activeTool === tool ? 'none' : tool)}
                title={title}
              >
                {icon}
              </button>
            ))}
            <div style={divider} />
            {/* 색상 팔레트 */}
            {annotationColors.map(color => (
              <button
                key={color}
                style={{
                  width: '18px', height: '18px', borderRadius: '50%',
                  background: color, border: activeColor === color ? '2px solid #fff' : '2px solid transparent',
                  cursor: 'pointer', flexShrink: 0,
                  boxShadow: activeColor === color ? '0 0 0 1px rgba(255,255,255,0.5)' : 'none',
                }}
                onClick={() => setActiveColor(color)}
                title={color}
              />
            ))}
            <div style={divider} />
            <button
              style={{ ...btnStyle, fontSize: '9px', width: 'auto', padding: '0 6px', color: '#f87171' }}
              onClick={clearAllAnnotations}
              title="모든 주석 삭제"
            >
              전체삭제
            </button>
          </>
        )}

        {/* 사이드바 토글 */}
        <button
          style={{
            ...btnStyle, width: 'auto', padding: '0 8px', fontSize: '10px', fontWeight: 600,
            background: showSidebar ? 'rgba(59,130,246,0.2)' : 'rgba(255,255,255,0.04)',
            color: showSidebar ? '#60a5fa' : '#94a3b8',
          }}
          onClick={() => setShowSidebar(s => !s)}
          title="사이드바 토글"
        >
          <List size={12} style={{ marginRight: '4px' }} /> 패널
        </button>

        <div style={{ flex: 1 }} />

        {/* 연속 스크롤 토글 */}
        <button
          style={{
            ...btnStyle, width: 'auto', padding: '0 8px', fontSize: '10px', fontWeight: 600,
            background: continuousScroll ? 'rgba(59,130,246,0.2)' : 'rgba(255,255,255,0.04)',
            color: continuousScroll ? '#60a5fa' : '#94a3b8',
            border: continuousScroll ? '1px solid rgba(59,130,246,0.4)' : '1px solid rgba(255,255,255,0.1)',
          }}
          onClick={() => setContinuousScroll(s => !s)}
          title="연속 스크롤 모드 (C)"
        >
          {continuousScroll ? '📜 연속' : '📄 단일'}
        </button>

        {/* 검색 */}
        <button
          style={{ ...btnStyle, background: showSearch ? 'rgba(59,130,246,0.2)' : btnStyle.background, color: showSearch ? '#60a5fa' : '#e2e8f0' }}
          onClick={() => setShowSearch(s => !s)}
          title="텍스트 검색 (F)"
        >
          <Search size={13} />
        </button>

        {/* 회전 */}
        <button style={btnStyle} onClick={handleRotate} title="90도 회전">
          <RotateCw size={13} />
        </button>

        {/* 주석 임베딩 PDF 저장 */}
        {annotations.length > 0 && (
          <button
            style={{
              ...btnStyle,
              background: isSavingAnnotated ? 'rgba(34,197,94,0.15)' : 'rgba(34,197,94,0.1)',
              color: '#4ade80',
              border: '1px solid rgba(34,197,94,0.3)',
              width: 'auto', padding: '0 8px', fontSize: '10px', fontWeight: 600,
            }}
            onClick={handleSaveAnnotated}
            title="주석 임베딩 PDF 다운로드"
          >
            {isSavingAnnotated ? '저장 중...' : '주석 PDF 저장'}
          </button>
        )}

        {/* 다운로드 */}
        <button style={btnStyle} onClick={handleDownload} title="PDF 다운로드">
          <Download size={14} />
        </button>

        {onConvertToAmeva && (
          <>
            <div style={divider} />
            <button
              style={{
                ...btnStyle,
                width: 'auto',
                padding: '0 10px',
                background: 'rgba(168, 85, 247, 0.15)',
                color: '#d8b4fe',
                borderColor: 'rgba(168, 85, 247, 0.3)',
                fontWeight: 600,
                fontSize: '11px',
                gap: '6px'
              }}
              onClick={onConvertToAmeva}
              title="이 PDF 파일의 텍스트를 파싱하여 아메바 문서로 변환합니다"
            >
              <FileText size={12} />
              아메바 문서로 작업하기
            </button>
          </>
        )}

        {/* 전체화면 */}
        <button style={btnStyle} onClick={handleFullscreen} title="전체화면">
          {isFullscreen ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
        </button>

        {/* 닫기 */}
        {onClose && (
          <button
            style={{ ...btnStyle, color: '#f87171', borderColor: 'rgba(248,113,113,0.25)' }}
            onClick={onClose}
            title="PDF 뷰어 닫기"
          >
            ✕
          </button>
        )}
      </div>

      {/* 검색바 */}
      {showSearch && (
        <div style={{
          padding: '6px 16px',
          background: 'rgba(10,10,15,0.9)',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Search size={12} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
            <input
              autoFocus
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder={isIndexing ? `인덱싱 중... (${Object.keys(searchIndex).length}/${numPages}p)` : 'PDF 내 텍스트 검색...'}
              style={{
                flex: 1, height: '26px', borderRadius: '5px',
                background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
                color: '#fff', fontSize: '11px', padding: '0 10px', outline: 'none'
              }}
            />
            {/* 이전/다음 결과 */}
            {searchResults.length > 0 && (
              <>
                <span style={{ fontSize: '10px', color: '#3b82f6', whiteSpace: 'nowrap' }}>
                  {searchResultIdx + 1} / {searchResults.length}건
                </span>
                <button
                  onClick={() => {
                    const prev = (searchResultIdx - 1 + searchResults.length) % searchResults.length
                    setSearchResultIdx(prev)
                    goToPage(searchResults[prev].page)
                  }}
                  style={{ ...btnStyle, width: 22, height: 22, fontSize: 12 }}
                >↑</button>
                <button
                  onClick={() => {
                    const next = (searchResultIdx + 1) % searchResults.length
                    setSearchResultIdx(next)
                    goToPage(searchResults[next].page)
                  }}
                  style={{ ...btnStyle, width: 22, height: 22, fontSize: 12 }}
                >↓</button>
              </>
            )}
            {searchQuery.trim() && !isIndexing && searchResults.length === 0 && (
              <span style={{ fontSize: '10px', color: '#f87171', whiteSpace: 'nowrap' }}>결과 없음</span>
            )}
            <span style={{ fontSize: '10px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>F로 닫기</span>
          </div>
          {/* 검색 결과 페이지 목록 */}
          {searchResults.length > 0 && (
            <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', maxHeight: '40px', overflow: 'hidden' }}>
              {searchResults.slice(0, 20).map((r, idx) => (
                <button
                  key={r.page}
                  onClick={() => { setSearchResultIdx(idx); goToPage(r.page) }}
                  style={{
                    padding: '1px 6px', borderRadius: 3, fontSize: 9, cursor: 'pointer', border: 'none',
                    background: idx === searchResultIdx ? 'rgba(59,130,246,0.6)' : 'rgba(255,255,255,0.08)',
                    color: idx === searchResultIdx ? '#fff' : '#94a3b8',
                  }}
                >
                  {r.page}p ({r.count})
                </button>
              ))}
              {searchResults.length > 20 && <span style={{ fontSize: 9, color: '#64748b', alignSelf: 'center' }}>+{searchResults.length - 20}건 더...</span>}
            </div>
          )}
        </div>
      )}

      {/* ── 본체: 사이드바 + 캔버스 ── */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

        {/* 사이드바 */}
        {showSidebar && (
          <div style={{
            width: '180px', flexShrink: 0, display: 'flex', flexDirection: 'column',
            background: 'rgba(8, 8, 14, 0.95)', borderRight: '1px solid rgba(255,255,255,0.08)',
          }}>
            {/* 탭 */}
            <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.08)', flexShrink: 0 }}>
              {(['thumbnail', 'outline', 'bookmark'] as const).map(mode => (
                <button key={mode}
                  style={{
                    flex: 1, padding: '7px 0', fontSize: '10px', fontWeight: 600, border: 'none', cursor: 'pointer',
                    background: sidebarMode === mode ? 'rgba(59,130,246,0.15)' : 'transparent',
                    color: sidebarMode === mode ? '#60a5fa' : '#64748b',
                    borderBottom: sidebarMode === mode ? '2px solid #3b82f6' : '2px solid transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '3px',
                    transition: 'all 0.15s ease',
                  }}
                  onClick={() => setSidebarMode(mode)}
                >
                  {mode === 'thumbnail' && <><List size={10} /> 페이지</>}
                  {mode === 'outline' && <><Bookmark size={10} /> 목차</>}
                  {mode === 'bookmark' && <span style={{ fontSize: 12 }}>🔖</span>}
                </button>
              ))}
            </div>
            {/* 콘텐츠 */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
              {sidebarMode === 'thumbnail' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {Array.from({ length: numPages }).map((_, idx) => (
                    <PdfThumbnail key={idx + 1} pdf={pdf} pageNum={idx + 1}
                      isActive={currentPage === idx + 1} onClick={() => goToPage(idx + 1)} />
                  ))}
                </div>
              )}
              {sidebarMode === 'outline' && (
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  {outlines.length > 0 ? renderOutline(outlines) : (
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', textAlign: 'center', marginTop: '32px', padding: '0 12px', lineHeight: 1.6 }}>
                      <Bookmark size={24} style={{ opacity: 0.2, display: 'block', margin: '0 auto 8px' }} />
                      이 PDF에는 목차가 없습니다
                    </div>
                  )}
                </div>
              )}
              {sidebarMode === 'bookmark' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <button
                    onClick={toggleBookmark}
                    style={{
                      padding: '7px 10px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 600,
                      background: isBookmarked ? 'rgba(251,191,36,0.2)' : 'rgba(255,255,255,0.07)',
                      color: isBookmarked ? '#fbbf24' : '#94a3b8',
                      display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8,
                    }}
                  >
                    🔖 {isBookmarked ? `${currentPage}p 북마크 제거` : `${currentPage}p 북마크 추가`}
                  </button>
                  {bookmarks.length === 0 ? (
                    <div style={{ fontSize: 11, color: '#475569', textAlign: 'center', marginTop: 20 }}>
                      북마크가 없습니다.<br />
                      <span style={{ fontSize: 10 }}>[🔖 추가] 버튼으로 추가하세요</span>
                    </div>
                  ) : bookmarks.map(b => (
                    <div key={b.page} style={{
                      display: 'flex', alignItems: 'center', gap: 6,
                      padding: '6px 8px', borderRadius: 6, cursor: 'pointer',
                      background: currentPage === b.page ? 'rgba(59,130,246,0.15)' : 'rgba(255,255,255,0.04)',
                      border: currentPage === b.page ? '1px solid rgba(59,130,246,0.3)' : '1px solid transparent',
                      transition: 'all 0.13s',
                    }}>
                      <span onClick={() => goToPage(b.page)} style={{ flex: 1, fontSize: 11, color: currentPage === b.page ? '#60a5fa' : '#e2e8f0' }}>
                        🔖 {b.label}
                      </span>
                      <button
                        onClick={() => setBookmarks(prev => { const n = prev.filter(x => x.page !== b.page); localStorage.setItem(`pdf_bookmarks_${fileName}`, JSON.stringify(n)); return n })}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', fontSize: 12, padding: '0 2px', lineHeight: 1 }}
                      >×</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* 캔버스 영역 - 스크롤 컴테이너 + 절대위치 화살표 오버레이 */}
        <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
          {/* 좌측 화살표 - 항상 중앙 또 는 호버 시만 강조 */}
          {!continuousScroll && (
            <button
              onMouseEnter={() => setHoveredArrow('left')}
              onMouseLeave={() => setHoveredArrow(null)}
              onClick={() => goToPage(currentPage - 1, 'right')}
              disabled={currentPage <= 1}
              style={{
                position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)',
                zIndex: 20, width: 40, height: 40, borderRadius: '50%',
                background: hoveredArrow === 'left' && currentPage > 1 ? 'rgba(59,130,246,0.9)' : 'rgba(0,0,0,0.5)',
                border: '1px solid rgba(255,255,255,0.2)', color: '#fff',
                cursor: currentPage <= 1 ? 'default' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                opacity: currentPage <= 1 ? 0.15 : 1,
                transition: 'all 0.18s ease',
                boxShadow: hoveredArrow === 'left' ? '0 0 20px rgba(59,130,246,0.6)' : '0 2px 8px rgba(0,0,0,0.5)',
              }}
            >
              <ChevronLeft size={20} />
            </button>
          )}

          {/* 스크롤 컴테이너 */}
          <div
            ref={scrollAreaRef}
            style={{ width: '100%', height: '100%', overflow: 'auto', background: '#1a1a24', willChange: 'transform', transform: 'translateZ(0)' }}
            onWheel={(e) => {
              if (e.ctrlKey) {
                e.preventDefault()
                if (e.deltaY < 0) handleZoomIn()
                else handleZoomOut()
              }
            }}
            onPointerDown={handlePointerDown}
            onPointerUp={handlePointerUp}
            onPointerCancel={(e) => { dragStartRef.current = null }}
          >
            {continuousScroll ? (
              <div style={{ padding: '20px 40px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                {Array.from({ length: numPages }).map((_, idx) => (
                  <ContinuousPageCanvas
                    key={idx + 1}
                    pdf={pdf}
                    pageNum={idx + 1}
                    scale={scale}
                    rotation={rotation}
                    isActive={currentPage === idx + 1}
                    onVisible={handlePageVisible}
                    pageCache={pageCacheRef}
                  />
                ))}
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '20px 60px', minHeight: '100%' }}>
                <style>{`
                  @keyframes slideInFromRight { from { opacity: 0; transform: translateX(60px); } to { opacity: 1; transform: translateX(0); } }
                  @keyframes slideInFromLeft { from { opacity: 0; transform: translateX(-60px); } to { opacity: 1; transform: translateX(0); } }
                `}</style>
                <div style={{
                  boxShadow: '0 8px 48px rgba(0,0,0,0.6)', borderRadius: '4px', overflow: 'hidden',
                  background: '#fff', position: 'relative',
                  animation: pageTransition === 'slide-left'
                    ? 'slideInFromRight 0.25s cubic-bezier(0.2,0.8,0.2,1)'
                    : pageTransition === 'slide-right'
                    ? 'slideInFromLeft 0.25s cubic-bezier(0.2,0.8,0.2,1)'
                    : 'none',
                }}>
                  <canvas ref={canvasRef} />
                  {canvasSize.width > 0 && (
                    <PdfAnnotationLayer
                      pageNum={currentPage} canvasWidth={canvasSize.width} canvasHeight={canvasSize.height}
                      annotations={annotations} activeTool={activeTool} activeColor={activeColor}
                      opacity={annotationOpacity} onAddAnnotation={addAnnotation} onDeleteAnnotation={deleteAnnotation}
                    />
                  )}
                </div>
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
                position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                zIndex: 20, width: 40, height: 40, borderRadius: '50%',
                background: hoveredArrow === 'right' && currentPage < numPages ? 'rgba(59,130,246,0.9)' : 'rgba(0,0,0,0.5)',
                border: '1px solid rgba(255,255,255,0.2)', color: '#fff',
                cursor: currentPage >= numPages ? 'default' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                opacity: currentPage >= numPages ? 0.15 : 1,
                transition: 'all 0.18s ease',
                boxShadow: hoveredArrow === 'right' ? '0 0 20px rgba(59,130,246,0.6)' : '0 2px 8px rgba(0,0,0,0.5)',
              }}
            >
              <ChevronRight size={20} />
            </button>
          )}
        </div>
      </div>

      {/* 하단 상태바 */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '4px 16px',
        background: 'rgba(10,10,15,0.95)',
        borderTop: '1px solid rgba(255,255,255,0.06)',
        fontSize: '10px',
        color: 'var(--text-muted)',
        flexShrink: 0,
      }}>
        <span>
          페이지 {currentPage} / {numPages}
        </span>
        <span>
          {Math.round(scale * 100)}% • {fileName} {continuousScroll ? '• 연속 스크롤' : ''}
        </span>
        <span>
          ← → 이동 | + - 줌 | F 검색 | C 연속/단일
        </span>
      </div>
    </div>
  )
}
