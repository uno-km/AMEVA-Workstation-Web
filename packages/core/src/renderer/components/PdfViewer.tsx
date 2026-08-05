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
        border: isActive ? '2px solid #a855f7' : '2px solid transparent',
        boxShadow: isActive ? '0 0 10px rgba(168,85,247,0.4)' : 'none',
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
        textAlign: 'center', fontSize: '9px', color: isActive ? '#c084fc' : '#64748b',
        padding: '2px 0', fontWeight: isActive ? 700 : 400,
      }}>
        {pageNum}
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
  const [showThumbnails, setShowThumbnails] = useState(true)
  const [sidebarMode, setSidebarMode] = useState<'thumbnail' | 'outline'>('thumbnail')
  const [outlines, setOutlines] = useState<any[]>([])
  const [swipeOffset, setSwipeOffset] = useState(0)
  const dragStartRef = useRef<{ x: number, y: number, scrollLeft: number, isSwipe: boolean } | null>(null)
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
    return () => { isMounted = false }
  }, [pdfData])




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

  // 마우스/터치 스와이프 로직
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (activeTool !== 'none' || showAnnotationTools) return
    dragStartRef.current = { x: e.clientX, y: e.clientY, scrollLeft: e.currentTarget.scrollLeft, isSwipe: false }
    e.currentTarget.setPointerCapture(e.pointerId)
  }
  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragStartRef.current) return
    if (activeTool !== 'none' || showAnnotationTools) return

    const dx = e.clientX - dragStartRef.current.x
    const el = e.currentTarget
    
    // 만약 화면을 확대하지 않아 캔버스가 전부 보인다면 엣지로 간주
    const isAtLeftEdge = el.scrollLeft <= 0
    const isAtRightEdge = Math.ceil(el.scrollLeft + el.clientWidth) >= el.scrollWidth

    if (dx > 0 && isAtLeftEdge) {
      setSwipeOffset(dx)
      dragStartRef.current.isSwipe = true
    } else if (dx < 0 && isAtRightEdge) {
      setSwipeOffset(dx)
      dragStartRef.current.isSwipe = true
    } else {
      setSwipeOffset(0)
      el.scrollLeft = dragStartRef.current.scrollLeft - dx
    }
  }
  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragStartRef.current) return
    e.currentTarget.releasePointerCapture(e.pointerId)
    
    if (dragStartRef.current.isSwipe) {
      if (swipeOffset > 80 && currentPage > 1) {
        goToPage(currentPage - 1)
      } else if (swipeOffset < -80 && currentPage < numPages) {
        goToPage(currentPage + 1)
      }
    }
    dragStartRef.current = null
    setSwipeOffset(0)
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
      const page = await pdf.getPage(pageNum)
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
      page.cleanup()
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

  const goToPage = (page: number) => {
    const p = Math.max(1, Math.min(numPages, page))
    setCurrentPage(p)
    setPageInput(String(p))
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
      setIsFullscreen(true)
    } else {
      document.exitFullscreen()
      setIsFullscreen(false)
    }
  }

  // 키보드 단축키
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') goToPage(currentPage + 1)
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') goToPage(currentPage - 1)
      if (e.key === '+' || e.key === '=') handleZoomIn()
      if (e.key === '-') handleZoomOut()
      if (e.key === 'f' || e.key === 'F') setShowSearch(s => !s)
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
          borderTop: '3px solid #a855f7',
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
              background: 'rgba(168,85,247,0.2)', border: '1px solid rgba(168,85,247,0.4)',
              color: '#c084fc', cursor: 'pointer', fontSize: '12px', fontWeight: 600
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
          <FileText size={14} style={{ color: '#a855f7', flexShrink: 0 }} />
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
              background: Math.abs(scale - s) < 0.01 ? 'rgba(139,92,246,0.25)' : 'rgba(255,255,255,0.04)',
              border: Math.abs(scale - s) < 0.01 ? '1px solid rgba(139,92,246,0.5)' : '1px solid rgba(255,255,255,0.08)',
              color: Math.abs(scale - s) < 0.01 ? '#c084fc' : '#94a3b8',
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

        {/* 사이드바 토글 (썸네일/목차) */}
        <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,0.04)', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.1)', overflow: 'hidden' }}>
          <button
            style={{
              ...btnStyle, width: 'auto', padding: '0 8px', fontSize: '10px', fontWeight: 600, border: 'none', borderRadius: 0,
              background: showThumbnails && sidebarMode === 'thumbnail' ? 'rgba(139,92,246,0.2)' : 'transparent',
              color: showThumbnails && sidebarMode === 'thumbnail' ? '#c084fc' : '#94a3b8',
            }}
            onClick={() => {
              if (showThumbnails && sidebarMode === 'thumbnail') setShowThumbnails(false)
              else { setShowThumbnails(true); setSidebarMode('thumbnail') }
            }}
            title="썸네일"
          >
            <List size={12} style={{ marginRight: '4px' }} /> 썸네일
          </button>
          <button
            style={{
              ...btnStyle, width: 'auto', padding: '0 8px', fontSize: '10px', fontWeight: 600, border: 'none', borderRadius: 0,
              background: showThumbnails && sidebarMode === 'outline' ? 'rgba(139,92,246,0.2)' : 'transparent',
              color: showThumbnails && sidebarMode === 'outline' ? '#c084fc' : '#94a3b8',
            }}
            onClick={() => {
              if (showThumbnails && sidebarMode === 'outline') setShowThumbnails(false)
              else { setShowThumbnails(true); setSidebarMode('outline') }
            }}
            title="목차(북마크)"
          >
            <Bookmark size={12} style={{ marginRight: '4px' }} /> 목차
          </button>
        </div>

        <div style={{ flex: 1 }} />

        {/* 검색 */}
        <button
          style={{ ...btnStyle, background: showSearch ? 'rgba(139,92,246,0.2)' : btnStyle.background, color: showSearch ? '#c084fc' : '#e2e8f0' }}
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
          alignItems: 'center',
          gap: '8px'
        }}>
          <Search size={12} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
          <input
            autoFocus
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="PDF 내 텍스트 검색... (개발 중)"
            style={{
              flex: 1, height: '26px', borderRadius: '5px',
              background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
              color: '#fff', fontSize: '11px', padding: '0 10px', outline: 'none'
            }}
          />
          <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Ctrl+F로 열기/닫기</span>
        </div>
      )}

      {/* ── 본체: 썸네일 + 캔버스 ── */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

        {/* 사이드바 (썸네일 or 목차) */}
        {showThumbnails && (
          <div style={{
            width: '160px',
            flexShrink: 0,
            overflowY: 'auto',
            background: 'rgba(10,10,15,0.8)',
            borderRight: '1px solid rgba(255,255,255,0.06)',
            padding: '8px',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
          }}>
            {sidebarMode === 'thumbnail' ? (
              Array.from({ length: numPages }).map((_, idx) => (
                <PdfThumbnail
                  key={idx + 1}
                  pdf={pdf}
                  pageNum={idx + 1}
                  isActive={currentPage === idx + 1}
                  onClick={() => goToPage(idx + 1)}
                />
              ))
            ) : (
              // 목차 렌더링
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {outlines.length > 0 ? renderOutline(outlines) : (
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', textAlign: 'center', marginTop: '20px' }}>
                    목차가 없습니다
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* 캔버스 스크롤 영역 */}
        <div
          style={{
            flex: 1,
            overflow: 'auto',
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'center',
            background: '#1a1a24',
            padding: '20px',
            touchAction: activeTool !== 'none' ? 'auto' : 'none',
          }}
          onWheel={(e) => {
            if (e.ctrlKey) {
              e.preventDefault()
              if (e.deltaY < 0) handleZoomIn()
              else handleZoomOut()
            }
          }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          onPointerLeave={handlePointerUp}
        >
          <div
            style={{
              boxShadow: '0 8px 48px rgba(0,0,0,0.6)',
              borderRadius: '4px',
              overflow: 'hidden',
              background: '#fff',
              position: 'relative',
              transform: `translateX(${swipeOffset}px)`,
              transition: dragStartRef.current?.isSwipe ? 'none' : 'transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)',
            }}
          >
            <canvas ref={canvasRef} />
            {/* 주석 SVG 오버레이 - Canvas 위에 절대 위치 */}
            {canvasSize.width > 0 && (
              <PdfAnnotationLayer
                pageNum={currentPage}
                canvasWidth={canvasSize.width}
                canvasHeight={canvasSize.height}
                annotations={annotations}
                activeTool={activeTool}
                activeColor={activeColor}
                opacity={annotationOpacity}
                onAddAnnotation={addAnnotation}
                onDeleteAnnotation={deleteAnnotation}
              />
            )}
          </div>
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
          {Math.round(scale * 100)}% • {fileName}
        </span>
        <span>
          ← → 페이지 이동 | + - 줌 | Ctrl+스크롤 줌
        </span>
      </div>
    </div>
  )
}
