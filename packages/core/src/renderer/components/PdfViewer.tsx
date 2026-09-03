/**
 * @file PdfViewer.tsx
 * @system AMEVA OS Desktop Workstation
 * @location src/renderer/components/PdfViewer.tsx
 * @role PDF 다중 페이지 책보기(1장/2장/3장/연속/페이지나누기) 및 멀티 스킨 Canvas 뷰어 컴포넌트
 *
 * [책임 범위 - RESPONSIBILITY]
 * - pdfjs-dist를 사용하여 PDF 파일의 각 페이지를 Canvas에 고해상도로 렌더링한다.
 * - 5가지 뷰 모드(연속 스크롤, 1장, 2장 양면 펼침, 3장 3면 펼침, 페이지나누기)를 완벽하게 지원한다.
 * - 3가지 스킨(다크, 화이트, 레트로 빈티지 서적)에 최적화된 테마 스타일을 동적으로 제공한다.
 * - 페이지 이동, 줌인/아웃, 회전, 주석(Annotation), 검색, 북마크, 목차 사이드바를 제공한다.
 */

import React, { useEffect, useRef, useState, useCallback } from 'react'
import * as pdfjsLib from 'pdfjs-dist'
import PdfWorker from 'pdfjs-dist/build/pdf.worker.mjs?worker'
import {
  ChevronLeft, ChevronRight, ZoomIn, ZoomOut, RotateCw,
  Download, Maximize2, Minimize2, FileText, Search,
  Highlighter, Type, PenLine, Square, ArrowRight, Eraser, Minus, List, Bookmark,
  BookOpen, Columns, SplitSquareVertical, Layers, Palette, Check
} from 'lucide-react'
import { BookPageSlot } from './BookPageSlot'
import { useBookViewerState } from '../hooks/useBookViewerState'
import type { BookViewMode, ViewerSkin } from '../hooks/useBookViewerState'
import { usePdfAnnotations } from '../hooks/usePdfAnnotations'
import type { AnnotationTool } from '../hooks/usePdfAnnotations'

// [FIX-CSP-001] PDF Worker CSP 대응
pdfjsLib.GlobalWorkerOptions.workerPort = new PdfWorker()

// 썸네일 컴포넌트 (레이지 로딩 지원)
function PdfThumbnail({
  pdf,
  pageNum,
  isActive,
  skin,
  onClick,
}: {
  pdf: any
  pageNum: number
  isActive: boolean
  skin: ViewerSkin
  onClick: () => void
}) {
  const [imgData, setImgData] = useState<string>('')
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
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

  const getBorderColor = () => {
    if (isActive) return '#3b82f6'
    if (skin === 'white') return 'rgba(0,0,0,0.1)'
    if (skin === 'retro') return 'rgba(160,110,60,0.2)'
    return 'rgba(255,255,255,0.08)'
  }

  const getThumbBg = () => {
    if (skin === 'white') return '#ffffff'
    if (skin === 'retro') return '#fbf7ee'
    return '#1e1e2e'
  }

  return (
    <div
      ref={containerRef}
      onClick={onClick}
      style={{
        cursor: 'pointer',
        borderRadius: '6px',
        overflow: 'hidden',
        border: `2px solid ${getBorderColor()}`,
        boxShadow: isActive ? '0 0 10px rgba(59,130,246,0.4)' : 'none',
        background: getThumbBg(),
        transition: 'all 0.15s ease',
        flexShrink: 0,
      }}
      title={`페이지 ${pageNum}`}
    >
      {imgData ? (
        <img src={imgData} alt={`페이지 ${pageNum}`} style={{ width: '100%', display: 'block' }} />
      ) : (
        <div style={{
          width: '100%', aspectRatio: '0.71', background: skin === 'white' ? '#e2e8f0' : skin === 'retro' ? '#e7dec8' : '#252535',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: skin === 'white' ? '#94a3b8' : skin === 'retro' ? '#a88d65' : 'rgba(255,255,255,0.2)',
          fontSize: '10px',
        }}>
          {pageNum}
        </div>
      )}
      <div style={{
        textAlign: 'center', fontSize: '9px',
        color: isActive ? '#3b82f6' : (skin === 'white' ? '#64748b' : skin === 'retro' ? '#854d0e' : '#94a3b8'),
        padding: '2px 0', fontWeight: isActive ? 700 : 400,
      }}>
        {pageNum}
      </div>
    </div>
  )
}

// [CONTINUOUS] 연속 스크롤 / 페이지 나누기 모드용 단일 페이지 캔버스
function ContinuousPageCanvas({
  pdf, pageNum, scale, rotation, isActive, isPageBreakMode, skin, onVisible, pageCache,
}: {
  pdf: any
  pageNum: number
  scale: number
  rotation: number
  isActive: boolean
  isPageBreakMode?: boolean
  skin: ViewerSkin
  onVisible: (n: number) => void
  pageCache: React.MutableRefObject<Map<number, any>>
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const renderTaskRef = useRef<any>(null)
  const [rendered, setRendered] = useState(false)

  useEffect(() => {
    if (!containerRef.current) return
    const obs = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        onVisible(pageNum)
      }
    }, { threshold: 0.2 })
    obs.observe(containerRef.current)
    return () => obs.disconnect()
  }, [pageNum, onVisible])

  useEffect(() => {
    if (!pdf || !canvasRef.current) return
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
  }, [pdf, pageNum, scale, rotation, pageCache])

  const getPageShadow = () => {
    if (skin === 'white') return '0 4px 20px rgba(0,0,0,0.08)'
    if (skin === 'retro') return '0 6px 24px rgba(60,40,20,0.25)'
    return '0 4px 24px rgba(0,0,0,0.5)'
  }

  const getPageBg = () => {
    if (skin === 'retro') return '#fbf7ee'
    return '#ffffff'
  }

  const getPageFilter = () => {
    if (skin === 'retro') return 'sepia(0.08) contrast(0.98)'
    return 'none'
  }

  return (
    <div
      ref={containerRef}
      style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        marginBottom: isPageBreakMode ? '36px' : '16px', flexShrink: 0,
        position: 'relative', width: '100%',
      }}
    >
      {/* 페이지 나누기(Page Break) 모드일 때 표시되는 상단 구분선 및 메타 헤더 */}
      {isPageBreakMode && (
        <div style={{
          display: 'flex', alignItems: 'center', width: '100%', maxWidth: '840px',
          gap: '12px', marginBottom: '14px',
        }}>
          <div style={{
            flex: 1, height: '1px',
            background: skin === 'white' ? 'linear-gradient(to right, transparent, rgba(0,0,0,0.15))' : skin === 'retro' ? 'linear-gradient(to right, transparent, rgba(160,110,60,0.3))' : 'linear-gradient(to right, transparent, rgba(255,255,255,0.15))',
            borderTop: '1px dashed transparent',
          }} />
          <div style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            padding: '3px 12px', borderRadius: '12px',
            background: skin === 'white' ? '#e2e8f0' : skin === 'retro' ? '#e5dcc7' : 'rgba(255,255,255,0.08)',
            color: skin === 'white' ? '#475569' : skin === 'retro' ? '#78350f' : '#94a3b8',
            fontSize: '11px', fontWeight: 600, letterSpacing: '0.04em',
            border: `1px solid ${skin === 'white' ? 'rgba(0,0,0,0.08)' : skin === 'retro' ? 'rgba(160,110,60,0.2)' : 'rgba(255,255,255,0.1)'}`
          }}>
            <span>✂️ PAGE {pageNum}</span>
          </div>
          <div style={{
            flex: 1, height: '1px',
            background: skin === 'white' ? 'linear-gradient(to left, transparent, rgba(0,0,0,0.15))' : skin === 'retro' ? 'linear-gradient(to left, transparent, rgba(160,110,60,0.3))' : 'linear-gradient(to left, transparent, rgba(255,255,255,0.15))',
          }} />
        </div>
      )}

      {!isPageBreakMode && (
        <div style={{
          fontSize: '10px',
          color: isActive ? '#3b82f6' : (skin === 'white' ? '#64748b' : skin === 'retro' ? '#854d0e' : '#475569'),
          marginBottom: '4px', fontWeight: isActive ? 700 : 400,
        }}>{pageNum}</div>
      )}

      <div style={{
        boxShadow: isActive
          ? '0 0 0 2px #3b82f6, 0 8px 32px rgba(0,0,0,0.6)'
          : getPageShadow(),
        borderRadius: '3px', overflow: 'hidden', background: getPageBg(),
        filter: getPageFilter(),
        transition: 'box-shadow 0.2s',
        border: skin === 'white' ? '1px solid rgba(0,0,0,0.08)' : skin === 'retro' ? '1px solid rgba(160,110,60,0.2)' : 'none',
      }}>
        <canvas ref={canvasRef} />
      </div>
    </div>
  )
}

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
 * PDF 뷰어 - Canvas 직접 렌더링 방식 (다중 페이지 책보기 & 멀티 스킨)
 */
export function PdfViewer({ pdfData, fileName = 'document.pdf', onClose, onConvertToAmeva }: PdfViewerProps) {
  const [pdf, setPdf] = useState<any>(null)
  const [numPages, setNumPages] = useState(0)
  const [scale, setScale] = useState(1.2)
  const [rotation, setRotation] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showSidebar, setShowSidebar] = useState(true)
  const [sidebarMode, setSidebarMode] = useState<'thumbnail' | 'outline' | 'bookmark'>('thumbnail')
  const [outlines, setOutlines] = useState<any[]>([])
  const [bookmarks, setBookmarks] = useState<{ page: number; label: string }[]>(() => {
    try { return JSON.parse(localStorage.getItem(`pdf_bookmarks_${fileName}`) || '[]') } catch { return [] }
  })
  const [hoveredArrow, setHoveredArrow] = useState<'left' | 'right' | null>(null)
  const dragStartRef = useRef<{ x: number; y: number } | null>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [pageInput, setPageInput] = useState('1')
  const [searchQuery, setSearchQuery] = useState('')
  const [showSearch, setShowSearch] = useState(false)
  const [showAnnotationTools, setShowAnnotationTools] = useState(false)
  const [annotationOpacity, setAnnotationOpacity] = useState(0.85)
  const [isSavingAnnotated, setIsSavingAnnotated] = useState(false)
  const [showSkinMenu, setShowSkinMenu] = useState(false)

  // 책보기 모드 및 스킨 관리 훅 연동
  const {
    mode: viewMode,
    setMode: setViewMode,
    skin,
    setSkin,
    hasCoverPage,
    setHasCoverPage,
    currentPage,
    setCurrentPage,
    visiblePages,
    pageTransition,
    goToPage,
    goNext,
    goPrev,
    canGoPrev,
    canGoNext,
  } = useBookViewerState(numPages, {
    initialMode: 'continuous',
    initialSkin: 'dark',
    initialHasCover: true,
    storageKey: `pdf_viewer_${fileName.replace(/[^a-zA-Z0-9]/g, '_')}`,
  })

  // 주석 관리 훅
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

  const containerRef = useRef<HTMLDivElement>(null)
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const pageCacheRef = useRef<Map<number, any>>(new Map())

  // 검색 인덱스
  const [searchIndex, setSearchIndex] = useState<Record<number, string>>({})
  const [searchResults, setSearchResults] = useState<{ page: number; count: number }[]>([])
  const [searchResultIdx, setSearchResultIdx] = useState(0)
  const [isIndexing, setIsIndexing] = useState(false)

  // PDF 문서 로드
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
        } catch {
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
    return () => {
      isMounted = false
      pageCacheRef.current.clear()
    }
  }, [pdfData, setCurrentPage])

  // PDF 텍스트 인덱싱
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

  // 검색 쿼리 변경
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
  }, [searchQuery, searchIndex, goToPage])

  // 페이지 입력 동기화
  useEffect(() => {
    setPageInput(String(currentPage))
  }, [currentPage])

  // 목차 클릭
  const renderOutline = (items: any[], depth = 0) => {
    return items.map((item, idx) => (
      <div key={idx} style={{ paddingLeft: `${depth * 10}px` }}>
        <div
          style={{
            fontSize: '11px',
            color: skin === 'white' ? '#334155' : skin === 'retro' ? '#78350f' : '#e2e8f0',
            cursor: 'pointer', padding: '6px 0',
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            borderBottom: skin === 'white' ? '1px solid rgba(0,0,0,0.06)' : skin === 'retro' ? '1px solid rgba(160,110,60,0.15)' : '1px solid rgba(255,255,255,0.05)'
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

  // 북마크
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

  const handlePageVisible = useCallback((n: number) => {
    setCurrentPage(n)
  }, [setCurrentPage])

  // 스와이프 제스처
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (activeTool !== 'none' || showAnnotationTools || viewMode === 'continuous' || viewMode === 'page-break') return
    dragStartRef.current = { x: e.clientX, y: e.clientY }
    e.currentTarget.setPointerCapture(e.pointerId)
  }
  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragStartRef.current || viewMode === 'continuous' || viewMode === 'page-break') return
    e.currentTarget.releasePointerCapture(e.pointerId)
    const dx = e.clientX - dragStartRef.current.x
    if (Math.abs(dx) > 50) {
      if (dx > 0) goPrev()
      else if (dx < 0) goNext()
    }
    dragStartRef.current = null
  }

  const handlePageInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const n = parseInt(pageInput, 10)
      if (!isNaN(n)) goToPage(n)
    }
  }

  const handleZoomIn = () => setScale(s => Math.min(s + 0.2, 4.0))
  const handleZoomOut = () => setScale(s => Math.max(s - 0.2, 0.3))
  const handleRotate = () => setRotation(r => (r + 90) % 360)

  // 주석 저장 다운로드
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

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', handler)
    return () => document.removeEventListener('fullscreenchange', handler)
  }, [])

  // 키보드 단축키
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return
      if (e.key === 'ArrowRight' || e.key === 'PageDown') goNext()
      if (e.key === 'ArrowLeft' || e.key === 'PageUp') goPrev()
      if (e.key === '+' || e.key === '=') handleZoomIn()
      if (e.key === '-') handleZoomOut()
      if (e.key === 'f' || e.key === 'F') setShowSearch(s => !s)
      if (e.key === 'v' || e.key === 'V') {
        const modes: BookViewMode[] = ['continuous', 'single', 'dual', 'triple', 'page-break']
        const nextIdx = (modes.indexOf(viewMode) + 1) % modes.length
        setViewMode(modes[nextIdx])
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [viewMode, goNext, goPrev, setViewMode])

  // 스킨별 테마 스타일
  const themeStyles = {
    dark: {
      bgMain: '#14141e',
      bgToolbar: 'rgba(15, 15, 22, 0.95)',
      bgSidebar: 'rgba(10, 10, 16, 0.96)',
      border: 'rgba(255, 255, 255, 0.08)',
      textMain: '#e2e8f0',
      textMuted: '#94a3b8',
      btnBg: 'rgba(255, 255, 255, 0.05)',
      btnBorder: 'rgba(255, 255, 255, 0.1)',
      activeBg: 'rgba(59, 130, 246, 0.25)',
      activeBorder: 'rgba(59, 130, 246, 0.5)',
      activeText: '#60a5fa',
    },
    white: {
      bgMain: '#f1f5f9',
      bgToolbar: 'rgba(255, 255, 255, 0.95)',
      bgSidebar: 'rgba(248, 250, 252, 0.96)',
      border: 'rgba(0, 0, 0, 0.08)',
      textMain: '#1e293b',
      textMuted: '#64748b',
      btnBg: 'rgba(0, 0, 0, 0.04)',
      btnBorder: 'rgba(0, 0, 0, 0.1)',
      activeBg: 'rgba(59, 130, 246, 0.15)',
      activeBorder: 'rgba(59, 130, 246, 0.4)',
      activeText: '#2563eb',
    },
    retro: {
      bgMain: '#ede6d6',
      bgToolbar: 'rgba(245, 238, 224, 0.96)',
      bgSidebar: 'rgba(238, 230, 212, 0.96)',
      border: 'rgba(160, 110, 60, 0.2)',
      textMain: '#451a03',
      textMuted: '#854d0e',
      btnBg: 'rgba(180, 130, 70, 0.12)',
      btnBorder: 'rgba(160, 110, 60, 0.25)',
      activeBg: 'rgba(180, 83, 9, 0.2)',
      activeBorder: 'rgba(180, 83, 9, 0.4)',
      activeText: '#9a3412',
    },
  }[skin]

  const toolbarStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
    padding: '7px 14px',
    background: themeStyles.bgToolbar,
    borderBottom: `1px solid ${themeStyles.border}`,
    flexShrink: 0,
    flexWrap: 'wrap',
    backdropFilter: 'blur(12px)',
    userSelect: 'none',
  }

  const btnStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '28px',
    padding: '0 8px',
    borderRadius: '6px',
    border: `1px solid ${themeStyles.btnBorder}`,
    background: themeStyles.btnBg,
    color: themeStyles.textMain,
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    flexShrink: 0,
    fontSize: '11px',
    fontWeight: 500,
  }

  const iconBtnStyle: React.CSSProperties = {
    ...btnStyle,
    width: '28px',
    padding: 0,
  }

  const divider: React.CSSProperties = {
    width: '1px',
    height: '18px',
    background: themeStyles.border,
    margin: '0 3px',
  }

  if (loading) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        width: '100%', height: '100%',
        background: themeStyles.bgMain, color: themeStyles.textMuted,
        flexDirection: 'column', gap: '12px'
      }}>
        <div style={{
          width: '36px', height: '36px', borderRadius: '50%',
          border: '3px solid rgba(59, 130, 246, 0.2)',
          borderTop: '3px solid #3b82f6',
          animation: 'spin 0.8s linear infinite'
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <span style={{ fontSize: '12px', fontWeight: 600 }}>PDF 및 레이아웃 모드 로딩 중...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        width: '100%', height: '100%',
        background: themeStyles.bgMain, color: '#ef4444',
        flexDirection: 'column', gap: '8px', padding: '32px', textAlign: 'center'
      }}>
        <FileText size={40} style={{ opacity: 0.4 }} />
        <div style={{ fontSize: '13px', fontWeight: 600 }}>PDF 로드 실패</div>
        <div style={{ fontSize: '11px', color: themeStyles.textMuted, maxWidth: '400px' }}>{error}</div>
        {onClose && (
          <button
            onClick={onClose}
            style={{
              marginTop: '12px', padding: '6px 16px', borderRadius: '8px',
              background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
              color: '#ef4444', cursor: 'pointer', fontSize: '12px', fontWeight: 600
            }}
          >
            뒤로가기
          </button>
        )}
      </div>
    )
  }

  const isSpreadBookMode = viewMode === 'single' || viewMode === 'dual' || viewMode === 'triple'

  return (
    <div
      ref={containerRef}
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        height: '100%',
        background: themeStyles.bgMain,
        color: themeStyles.textMain,
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      {/* ── 상단 툴바 ── */}
      <div style={toolbarStyle}>
        {/* 파일 정보 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginRight: '4px' }}>
          <FileText size={14} style={{ color: themeStyles.activeText, flexShrink: 0 }} />
          <span style={{
            fontSize: '11px', fontWeight: 600, color: themeStyles.textMain,
            maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
          }}>
            {fileName}
          </span>
        </div>

        <div style={divider} />

        {/* ── 뷰 모드 5종 셀렉터 (연속, 1장, 2장, 3장, 페이지나누기) ── */}
        <div style={{ display: 'flex', alignItems: 'center', background: themeStyles.btnBg, borderRadius: '6px', padding: '2px', border: `1px solid ${themeStyles.btnBorder}` }}>
          {[
            { id: 'continuous' as BookViewMode, label: '📜 연속', title: '연속 스크롤 (기본)' },
            { id: 'single' as BookViewMode, label: '📄 1장', title: '1장 보기' },
            { id: 'dual' as BookViewMode, label: '📖 2장', title: '2장 펼침 책보기' },
            { id: 'triple' as BookViewMode, label: '📑 3장', title: '3장 와이드 펼침' },
            { id: 'page-break' as BookViewMode, label: '✂️ 페이지나누기', title: '페이지 나누기 구분 모드' },
          ].map((m) => {
            const isActive = viewMode === m.id
            return (
              <button
                key={m.id}
                onClick={() => setViewMode(m.id)}
                title={m.title}
                style={{
                  border: 'none',
                  background: isActive ? themeStyles.activeBg : 'transparent',
                  color: isActive ? themeStyles.activeText : themeStyles.textMuted,
                  fontWeight: isActive ? 700 : 500,
                  fontSize: '10px',
                  padding: '4px 7px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  transition: 'all 0.12s ease',
                  whiteSpace: 'nowrap',
                }}
              >
                {m.label}
              </button>
            )
          })}
        </div>

        {/* 2장 보기 모드 전용: 표지 단독 토글 */}
        {viewMode === 'dual' && (
          <button
            style={{
              ...btnStyle,
              fontSize: '10px',
              padding: '0 6px',
              background: hasCoverPage ? themeStyles.activeBg : themeStyles.btnBg,
              color: hasCoverPage ? themeStyles.activeText : themeStyles.textMuted,
              borderColor: hasCoverPage ? themeStyles.activeBorder : themeStyles.btnBorder,
            }}
            onClick={() => setHasCoverPage(c => !c)}
            title="1페이지를 표지로 취급하여 단독으로 표시합니다"
          >
            📕 {hasCoverPage ? '표지 단독 On' : '표지 포함 Off'}
          </button>
        )}

        <div style={divider} />

        {/* ── 스킨/테마 셀렉터 (다크, 화이트, 레트로) ── */}
        <div style={{ position: 'relative' }}>
          <button
            style={{
              ...btnStyle,
              gap: '4px',
              fontSize: '10px',
            }}
            onClick={() => setShowSkinMenu(s => !s)}
            title="뷰어 스킨 테마 변경"
          >
            <Palette size={12} />
            <span>
              {skin === 'dark' && '🌙 다크'}
              {skin === 'white' && '☀️ 화이트'}
              {skin === 'retro' && '📜 레트로'}
            </span>
          </button>

          {showSkinMenu && (
            <div style={{
              position: 'absolute', top: '100%', left: 0, marginTop: '4px',
              background: themeStyles.bgToolbar, border: `1px solid ${themeStyles.border}`,
              borderRadius: '8px', padding: '4px', zIndex: 100,
              boxShadow: '0 8px 24px rgba(0,0,0,0.3)', minWidth: '110px',
              display: 'flex', flexDirection: 'column', gap: '2px',
            }}>
              {[
                { id: 'dark' as ViewerSkin, label: '🌙 다크 스킨' },
                { id: 'white' as ViewerSkin, label: '☀️ 화이트 스킨' },
                { id: 'retro' as ViewerSkin, label: '📜 레트로 서적' },
              ].map(s => (
                <button
                  key={s.id}
                  onClick={() => { setSkin(s.id); setShowSkinMenu(false) }}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '6px 10px', fontSize: '11px', border: 'none', borderRadius: '5px',
                    background: skin === s.id ? themeStyles.activeBg : 'transparent',
                    color: skin === s.id ? themeStyles.activeText : themeStyles.textMain,
                    cursor: 'pointer', textAlign: 'left', fontWeight: skin === s.id ? 700 : 400,
                  }}
                >
                  <span>{s.label}</span>
                  {skin === s.id && <Check size={12} />}
                </button>
              ))}
            </div>
          )}
        </div>

        <div style={divider} />

        {/* 페이지 이동 컨트롤 */}
        <button style={iconBtnStyle} onClick={goPrev} title="이전 (← / PageUp)" disabled={!canGoPrev}>
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
              width: '36px', height: '24px', borderRadius: '4px',
              background: themeStyles.btnBg, border: `1px solid ${themeStyles.btnBorder}`,
              color: themeStyles.textMain, fontSize: '11px', textAlign: 'center', outline: 'none',
              fontFamily: 'inherit'
            }}
          />
          <span style={{ fontSize: '11px', color: themeStyles.textMuted, flexShrink: 0 }}>/ {numPages}</span>
        </div>
        <button style={iconBtnStyle} onClick={goNext} title="다음 (→ / PageDown)" disabled={!canGoNext}>
          <ChevronRight size={14} />
        </button>

        <div style={divider} />

        {/* 줌 컨트롤 */}
        <button style={iconBtnStyle} onClick={handleZoomOut} title="줌 아웃 (-)">
          <ZoomOut size={13} />
        </button>
        <span style={{
          fontSize: '10px', color: themeStyles.textMain, minWidth: '38px', textAlign: 'center',
          background: themeStyles.btnBg, borderRadius: '4px', padding: '2px 4px',
          border: `1px solid ${themeStyles.btnBorder}`
        }}>
          {Math.round(scale * 100)}%
        </span>
        <button style={iconBtnStyle} onClick={handleZoomIn} title="줌 인 (+)">
          <ZoomIn size={13} />
        </button>

        <div style={divider} />

        {/* 주석 도구 토글 */}
        <button
          style={{
            ...btnStyle,
            background: showAnnotationTools ? 'rgba(251,191,36,0.25)' : themeStyles.btnBg,
            color: showAnnotationTools ? '#fbbf24' : themeStyles.textMain,
            borderColor: showAnnotationTools ? 'rgba(251,191,36,0.4)' : themeStyles.btnBorder,
          }}
          onClick={() => setShowAnnotationTools(s => !s)}
          title="주석 도구"
        >
          ✏️ 주석
        </button>

        {/* 주석 툴바 노출 */}
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
                  ...iconBtnStyle,
                  background: activeTool === tool ? 'rgba(251,191,36,0.3)' : themeStyles.btnBg,
                  color: activeTool === tool ? '#fbbf24' : themeStyles.textMuted,
                  borderColor: activeTool === tool ? 'rgba(251,191,36,0.5)' : themeStyles.btnBorder,
                }}
                onClick={() => setActiveTool(activeTool === tool ? 'none' : tool)}
                title={title}
              >
                {icon}
              </button>
            ))}
            <div style={divider} />
            {annotationColors.map(color => (
              <button
                key={color}
                style={{
                  width: '16px', height: '16px', borderRadius: '50%',
                  background: color, border: activeColor === color ? '2px solid #fff' : '2px solid transparent',
                  cursor: 'pointer', flexShrink: 0,
                  boxShadow: activeColor === color ? '0 0 0 1px rgba(0,0,0,0.4)' : 'none',
                }}
                onClick={() => setActiveColor(color)}
                title={color}
              />
            ))}
            <div style={divider} />
            <button
              style={{ ...btnStyle, fontSize: '9px', color: '#ef4444' }}
              onClick={clearAllAnnotations}
              title="모든 주석 삭제"
            >
              전체삭제
            </button>
          </>
        )}

        <div style={{ flex: 1 }} />

        {/* 사이드바 토글 */}
        <button
          style={{
            ...btnStyle,
            background: showSidebar ? themeStyles.activeBg : themeStyles.btnBg,
            color: showSidebar ? themeStyles.activeText : themeStyles.textMuted,
          }}
          onClick={() => setShowSidebar(s => !s)}
          title="사이드바 패널 토글"
        >
          <List size={12} style={{ marginRight: '4px' }} /> 패널
        </button>

        {/* 검색 */}
        <button
          style={{
            ...iconBtnStyle,
            background: showSearch ? themeStyles.activeBg : themeStyles.btnBg,
            color: showSearch ? themeStyles.activeText : themeStyles.textMain,
          }}
          onClick={() => setShowSearch(s => !s)}
          title="텍스트 검색 (F)"
        >
          <Search size={13} />
        </button>

        {/* 회전 */}
        <button style={iconBtnStyle} onClick={handleRotate} title="90도 회전">
          <RotateCw size={13} />
        </button>

        {/* 주석 임베딩 PDF 저장 */}
        {annotations.length > 0 && (
          <button
            style={{
              ...btnStyle,
              background: 'rgba(34,197,94,0.15)',
              color: '#22c55e',
              border: '1px solid rgba(34,197,94,0.3)',
              fontWeight: 600,
            }}
            onClick={handleSaveAnnotated}
            title="주석 포함 PDF 다운로드"
          >
            {isSavingAnnotated ? '저장 중...' : '주석 PDF 저장'}
          </button>
        )}

        {/* 다운로드 */}
        <button style={iconBtnStyle} onClick={handleDownload} title="PDF 다운로드">
          <Download size={14} />
        </button>

        {onConvertToAmeva && (
          <button
            style={{
              ...btnStyle,
              background: 'rgba(168, 85, 247, 0.15)',
              color: '#c084fc',
              borderColor: 'rgba(168, 85, 247, 0.3)',
              fontWeight: 600,
              gap: '4px',
            }}
            onClick={onConvertToAmeva}
            title="아메바 문서로 변환"
          >
            <FileText size={12} />
            아메바 문서
          </button>
        )}

        {/* 전체화면 */}
        <button style={iconBtnStyle} onClick={handleFullscreen} title="전체화면">
          {isFullscreen ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
        </button>

        {/* 닫기 */}
        {onClose && (
          <button
            style={{ ...iconBtnStyle, color: '#ef4444', borderColor: 'rgba(239,68,68,0.25)' }}
            onClick={onClose}
            title="닫기"
          >
            ✕
          </button>
        )}
      </div>

      {/* ── 검색 바 ── */}
      {showSearch && (
        <div style={{
          padding: '6px 16px',
          background: themeStyles.bgToolbar,
          borderBottom: `1px solid ${themeStyles.border}`,
          display: 'flex', flexDirection: 'column', gap: '4px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Search size={12} style={{ color: themeStyles.textMuted, flexShrink: 0 }} />
            <input
              autoFocus
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder={isIndexing ? `인덱싱 중... (${Object.keys(searchIndex).length}/${numPages}p)` : 'PDF 내 텍스트 검색...'}
              style={{
                flex: 1, height: '26px', borderRadius: '5px',
                background: themeStyles.btnBg, border: `1px solid ${themeStyles.btnBorder}`,
                color: themeStyles.textMain, fontSize: '11px', padding: '0 10px', outline: 'none'
              }}
            />
            {searchResults.length > 0 && (
              <>
                <span style={{ fontSize: '10px', color: themeStyles.activeText, whiteSpace: 'nowrap' }}>
                  {searchResultIdx + 1} / {searchResults.length}건
                </span>
                <button
                  onClick={() => {
                    const prev = (searchResultIdx - 1 + searchResults.length) % searchResults.length
                    setSearchResultIdx(prev)
                    goToPage(searchResults[prev].page)
                  }}
                  style={{ ...iconBtnStyle, width: 22, height: 22, fontSize: 11 }}
                >↑</button>
                <button
                  onClick={() => {
                    const next = (searchResultIdx + 1) % searchResults.length
                    setSearchResultIdx(next)
                    goToPage(searchResults[next].page)
                  }}
                  style={{ ...iconBtnStyle, width: 22, height: 22, fontSize: 11 }}
                >↓</button>
              </>
            )}
            {searchQuery.trim() && !isIndexing && searchResults.length === 0 && (
              <span style={{ fontSize: '10px', color: '#ef4444', whiteSpace: 'nowrap' }}>결과 없음</span>
            )}
            <span style={{ fontSize: '10px', color: themeStyles.textMuted, whiteSpace: 'nowrap' }}>F로 닫기</span>
          </div>
          {searchResults.length > 0 && (
            <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', maxHeight: '40px', overflow: 'hidden' }}>
              {searchResults.slice(0, 20).map((r, idx) => (
                <button
                  key={r.page}
                  onClick={() => { setSearchResultIdx(idx); goToPage(r.page) }}
                  style={{
                    padding: '1px 6px', borderRadius: 3, fontSize: 9, cursor: 'pointer', border: 'none',
                    background: idx === searchResultIdx ? themeStyles.activeBg : themeStyles.btnBg,
                    color: idx === searchResultIdx ? themeStyles.activeText : themeStyles.textMuted,
                  }}
                >
                  {r.page}p ({r.count})
                </button>
              ))}
              {searchResults.length > 20 && <span style={{ fontSize: 9, color: themeStyles.textMuted, alignSelf: 'center' }}>+{searchResults.length - 20}건 더...</span>}
            </div>
          )}
        </div>
      )}

      {/* ── 본체: 사이드바 + 렌더링 뷰포트 ── */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

        {/* 사이드바 */}
        {showSidebar && (
          <div style={{
            width: '180px', flexShrink: 0, display: 'flex', flexDirection: 'column',
            background: themeStyles.bgSidebar, borderRight: `1px solid ${themeStyles.border}`,
          }}>
            {/* 탭 */}
            <div style={{ display: 'flex', borderBottom: `1px solid ${themeStyles.border}`, flexShrink: 0 }}>
              {(['thumbnail', 'outline', 'bookmark'] as const).map(m => (
                <button key={m}
                  style={{
                    flex: 1, padding: '7px 0', fontSize: '10px', fontWeight: 600, border: 'none', cursor: 'pointer',
                    background: sidebarMode === m ? themeStyles.activeBg : 'transparent',
                    color: sidebarMode === m ? themeStyles.activeText : themeStyles.textMuted,
                    borderBottom: sidebarMode === m ? `2px solid ${themeStyles.activeText}` : '2px solid transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '3px',
                    transition: 'all 0.15s ease',
                  }}
                  onClick={() => setSidebarMode(m)}
                >
                  {m === 'thumbnail' && <><List size={10} /> 페이지</>}
                  {m === 'outline' && <><Bookmark size={10} /> 목차</>}
                  {m === 'bookmark' && <span>🔖</span>}
                </button>
              ))}
            </div>
            {/* 콘텐츠 */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
              {sidebarMode === 'thumbnail' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {Array.from({ length: numPages }).map((_, idx) => (
                    <PdfThumbnail
                      key={idx + 1}
                      pdf={pdf}
                      pageNum={idx + 1}
                      skin={skin}
                      isActive={visiblePages.includes(idx + 1) || currentPage === idx + 1}
                      onClick={() => goToPage(idx + 1)}
                    />
                  ))}
                </div>
              )}
              {sidebarMode === 'outline' && (
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  {outlines.length > 0 ? renderOutline(outlines) : (
                    <div style={{ fontSize: '11px', color: themeStyles.textMuted, textAlign: 'center', marginTop: '32px', padding: '0 12px', lineHeight: 1.6 }}>
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
                      padding: '7px 10px', borderRadius: 6, border: `1px solid ${themeStyles.border}`, cursor: 'pointer', fontSize: 11, fontWeight: 600,
                      background: isBookmarked ? 'rgba(251,191,36,0.2)' : themeStyles.btnBg,
                      color: isBookmarked ? '#fbbf24' : themeStyles.textMuted,
                      display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8,
                    }}
                  >
                    🔖 {isBookmarked ? `${currentPage}p 북마크 제거` : `${currentPage}p 북마크 추가`}
                  </button>
                  {bookmarks.length === 0 ? (
                    <div style={{ fontSize: 11, color: themeStyles.textMuted, textAlign: 'center', marginTop: 20 }}>
                      북마크가 없습니다.<br />
                      <span style={{ fontSize: 10 }}>[🔖 추가] 버튼으로 등록하세요</span>
                    </div>
                  ) : bookmarks.map(b => (
                    <div key={b.page} style={{
                      display: 'flex', alignItems: 'center', gap: 6,
                      padding: '6px 8px', borderRadius: 6, cursor: 'pointer',
                      background: currentPage === b.page ? themeStyles.activeBg : themeStyles.btnBg,
                      border: currentPage === b.page ? `1px solid ${themeStyles.activeBorder}` : '1px solid transparent',
                      transition: 'all 0.13s',
                    }}>
                      <span onClick={() => goToPage(b.page)} style={{ flex: 1, fontSize: 11, color: currentPage === b.page ? themeStyles.activeText : themeStyles.textMain }}>
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

        {/* ── 캔버스 뷰포트 컨테이너 ── */}
        <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>

          {/* 이전 페이지 화살표 오버레이 (책보기 모드) */}
          {isSpreadBookMode && (
            <button
              onMouseEnter={() => setHoveredArrow('left')}
              onMouseLeave={() => setHoveredArrow(null)}
              onClick={goPrev}
              disabled={!canGoPrev}
              style={{
                position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
                zIndex: 25, width: 44, height: 44, borderRadius: '50%',
                background: hoveredArrow === 'left' && canGoPrev ? themeStyles.activeText : 'rgba(0,0,0,0.4)',
                border: '1px solid rgba(255,255,255,0.2)', color: '#fff',
                cursor: canGoPrev ? 'pointer' : 'default',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                opacity: canGoPrev ? 1 : 0.15,
                transition: 'all 0.18s ease',
                boxShadow: hoveredArrow === 'left' ? '0 0 20px rgba(59,130,246,0.6)' : '0 2px 8px rgba(0,0,0,0.5)',
              }}
            >
              <ChevronLeft size={24} />
            </button>
          )}

          {/* 스크롤 영역 */}
          <div
            ref={scrollAreaRef}
            style={{ width: '100%', height: '100%', overflow: 'auto', background: themeStyles.bgMain }}
            onWheel={(e) => {
              if (e.ctrlKey) {
                e.preventDefault()
                if (e.deltaY < 0) handleZoomIn()
                else handleZoomOut()
              }
            }}
            onPointerDown={handlePointerDown}
            onPointerUp={handlePointerUp}
            onPointerCancel={() => { dragStartRef.current = null }}
          >
            {/* 1. 연속 스크롤 모드 (기본값) 및 5. 페이지나누기 모드 */}
            {(viewMode === 'continuous' || viewMode === 'page-break') && (
              <div style={{ padding: '24px 40px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                {Array.from({ length: numPages }).map((_, idx) => (
                  <ContinuousPageCanvas
                    key={idx + 1}
                    pdf={pdf}
                    pageNum={idx + 1}
                    scale={scale}
                    rotation={rotation}
                    isActive={currentPage === idx + 1}
                    isPageBreakMode={viewMode === 'page-break'}
                    skin={skin}
                    onVisible={handlePageVisible}
                    pageCache={pageCacheRef}
                  />
                ))}
              </div>
            )}

            {/* 2. 1장 보기, 3. 2장 펼침 책보기, 4. 3장 와이드 펼침 모드 */}
            {isSpreadBookMode && (
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: '24px 60px', minHeight: '100%', boxSizing: 'border-box',
              }}>
                <style>{`
                  @keyframes slideInFromRight { from { opacity: 0; transform: translateX(50px); } to { opacity: 1; transform: translateX(0); } }
                  @keyframes slideInFromLeft { from { opacity: 0; transform: translateX(-50px); } to { opacity: 1; transform: translateX(0); } }
                `}</style>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: viewMode === 'single' ? '0px' : '2px',
                    animation: pageTransition === 'slide-left'
                      ? 'slideInFromRight 0.22s cubic-bezier(0.2,0.8,0.2,1)'
                      : pageTransition === 'slide-right'
                      ? 'slideInFromLeft 0.22s cubic-bezier(0.2,0.8,0.2,1)'
                      : 'none',
                  }}
                >
                  {visiblePages.map((pg, idx) => {
                    const isLeft = viewMode === 'dual' ? idx === 0 : (viewMode === 'triple' ? idx === 0 : false)
                    const isRight = viewMode === 'dual' ? idx === 1 : (viewMode === 'triple' ? idx === visiblePages.length - 1 : false)

                    return (
                      <BookPageSlot
                        key={pg}
                        pdf={pdf}
                        pageNum={pg}
                        scale={scale}
                        rotation={rotation}
                        skin={skin}
                        slotCount={visiblePages.length}
                        isLeft={isLeft}
                        isRight={isRight}
                        pageCache={pageCacheRef}
                        annotations={annotations}
                        activeTool={activeTool}
                        activeColor={activeColor}
                        annotationOpacity={annotationOpacity}
                        onAddAnnotation={addAnnotation}
                        onDeleteAnnotation={deleteAnnotation}
                      />
                    )
                  })}
                </div>
              </div>
            )}
          </div>

          {/* 다음 페이지 화살표 오버레이 (책보기 모드) */}
          {isSpreadBookMode && (
            <button
              onMouseEnter={() => setHoveredArrow('right')}
              onMouseLeave={() => setHoveredArrow(null)}
              onClick={goNext}
              disabled={!canGoNext}
              style={{
                position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                zIndex: 25, width: 44, height: 44, borderRadius: '50%',
                background: hoveredArrow === 'right' && canGoNext ? themeStyles.activeText : 'rgba(0,0,0,0.4)',
                border: '1px solid rgba(255,255,255,0.2)', color: '#fff',
                cursor: canGoNext ? 'pointer' : 'default',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                opacity: canGoNext ? 1 : 0.15,
                transition: 'all 0.18s ease',
                boxShadow: hoveredArrow === 'right' ? '0 0 20px rgba(59,130,246,0.6)' : '0 2px 8px rgba(0,0,0,0.5)',
              }}
            >
              <ChevronRight size={24} />
            </button>
          )}
        </div>
      </div>

      {/* ── 하단 상태바 ── */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '5px 16px',
        background: themeStyles.bgToolbar,
        borderTop: `1px solid ${themeStyles.border}`,
        fontSize: '10px',
        color: themeStyles.textMuted,
        flexShrink: 0,
        userSelect: 'none',
      }}>
        <span>
          {isSpreadBookMode && visiblePages.length > 1
            ? `페이지 ${visiblePages[0]}-${visiblePages[visiblePages.length - 1]} / ${numPages}`
            : `페이지 ${currentPage} / ${numPages}`}
        </span>
        <span>
          {Math.round(scale * 100)}% • {fileName} • {
            viewMode === 'continuous' ? '📜 연속 스크롤' :
            viewMode === 'single' ? '📄 1장 보기' :
            viewMode === 'dual' ? '📖 2장 책 펼침' :
            viewMode === 'triple' ? '📑 3장 와이드' : '✂️ 페이지 나누기'
          } • {skin.toUpperCase()} SKIN
        </span>
        <span>
          ← → 이동 | + - 줌 | V 모드전환 | F 검색
        </span>
      </div>
    </div>
  )
}
