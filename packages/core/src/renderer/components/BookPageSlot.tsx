/**
 * @file BookPageSlot.tsx
 * @system AMEVA OS Desktop Workstation
 * @location src/renderer/components/BookPageSlot.tsx
 * @role 단일 페이지 슬롯 렌더러 (다중 페이지 책보기, 스킨별 스타일 및 주석 레이어 통합)
 */

import React, { useEffect, useRef, useState } from 'react'
import { PdfAnnotationLayer } from './PdfAnnotationLayer'
import type { Annotation, AnnotationTool } from '../hooks/usePdfAnnotations'
import type { ViewerSkin } from '../hooks/useBookViewerState'

interface BookPageSlotProps {
  pdf: any
  pageNum: number
  scale: number
  rotation: number
  skin: ViewerSkin
  slotCount?: number
  isLeft?: boolean
  isRight?: boolean
  pageCache: React.MutableRefObject<Map<number, any>>
  annotations?: Annotation[]
  activeTool?: AnnotationTool
  activeColor?: string
  annotationOpacity?: number
  onAddAnnotation?: (ann: Omit<Annotation, 'id' | 'createdAt'>) => void
  onDeleteAnnotation?: (id: string) => void
  onClick?: () => void
}

export function BookPageSlot({
  pdf,
  pageNum,
  scale,
  rotation,
  skin,
  slotCount = 1,
  isLeft = false,
  isRight = false,
  pageCache,
  annotations = [],
  activeTool = 'none',
  activeColor = '#fbbf24',
  annotationOpacity = 0.85,
  onAddAnnotation,
  onDeleteAnnotation,
  onClick,
}: BookPageSlotProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const renderTaskRef = useRef<any>(null)
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 })
  const [rendered, setRendered] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!pdf || !canvasRef.current || pageNum <= 0) return
    let isMounted = true

    const renderPage = async () => {
      // 이전 렌더 작업 취소
      if (renderTaskRef.current) {
        try {
          renderTaskRef.current.cancel()
        } catch {}
        renderTaskRef.current = null
      }

      try {
        setLoading(true)
        let page = pageCache.current.get(pageNum)
        if (!page) {
          page = await pdf.getPage(pageNum)
          pageCache.current.set(pageNum, page)
        }

        if (!isMounted) return

        const viewport = page.getViewport({ scale, rotation })
        const canvas = canvasRef.current
        if (!canvas) return

        const dpr = window.devicePixelRatio || 1
        canvas.width = Math.floor(viewport.width * dpr)
        canvas.height = Math.floor(viewport.height * dpr)
        canvas.style.width = `${viewport.width}px`
        canvas.style.height = `${viewport.height}px`

        const ctx = canvas.getContext('2d')
        if (!ctx) return
        ctx.scale(dpr, dpr)

        setCanvasSize({ width: viewport.width, height: viewport.height })

        const renderContext = { canvasContext: ctx, viewport }
        const task = page.render(renderContext)
        renderTaskRef.current = task

        await task.promise
        if (isMounted) {
          setRendered(true)
          setLoading(false)
        }
      } catch (err: any) {
        if (err?.name !== 'RenderingCancelledException' && isMounted) {
          setLoading(false)
        }
      }
    }

    renderPage()

    return () => {
      isMounted = false
      if (renderTaskRef.current) {
        try {
          renderTaskRef.current.cancel()
        } catch {}
      }
    }
  }, [pdf, pageNum, scale, rotation, pageCache])

  // 스킨별 테마 스타일 산출
  const getSkinStyles = () => {
    switch (skin) {
      case 'white':
        return {
          wrapperShadow: '0 4px 20px rgba(0, 0, 0, 0.08), 0 1px 3px rgba(0, 0, 0, 0.05)',
          borderColor: 'rgba(0, 0, 0, 0.12)',
          bg: '#ffffff',
          pageNumColor: '#64748b',
          badgeBg: 'rgba(0, 0, 0, 0.05)',
          filter: 'none',
          gutterShadowLeft: 'linear-gradient(to left, rgba(0,0,0,0.06) 0%, transparent 100%)',
          gutterShadowRight: 'linear-gradient(to right, rgba(0,0,0,0.06) 0%, transparent 100%)',
        }
      case 'retro':
        return {
          wrapperShadow: '0 8px 30px rgba(60, 40, 20, 0.3), 0 2px 6px rgba(60, 40, 20, 0.15)',
          borderColor: 'rgba(160, 110, 60, 0.25)',
          bg: '#fbf7ee',
          pageNumColor: '#854d0e',
          badgeBg: 'rgba(180, 130, 70, 0.15)',
          filter: 'sepia(0.08) contrast(0.98)',
          gutterShadowLeft: 'linear-gradient(to left, rgba(80,45,15,0.18) 0%, transparent 100%)',
          gutterShadowRight: 'linear-gradient(to right, rgba(80,45,15,0.18) 0%, transparent 100%)',
        }
      case 'dark':
      default:
        return {
          wrapperShadow: '0 8px 36px rgba(0, 0, 0, 0.65)',
          borderColor: 'rgba(255, 255, 255, 0.08)',
          bg: '#ffffff',
          pageNumColor: '#94a3b8',
          badgeBg: 'rgba(255, 255, 255, 0.08)',
          filter: 'none',
          gutterShadowLeft: 'linear-gradient(to left, rgba(0,0,0,0.3) 0%, transparent 100%)',
          gutterShadowRight: 'linear-gradient(to right, rgba(0,0,0,0.3) 0%, transparent 100%)',
        }
    }
  }

  const skinStyle = getSkinStyles()

  return (
    <div
      onClick={onClick}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        position: 'relative',
        userSelect: 'none',
        transition: 'transform 0.15s ease',
      }}
    >
      {/* 상단 페이지 번호 뱃지 */}
      <div
        style={{
          fontSize: '11px',
          fontWeight: 600,
          color: skinStyle.pageNumColor,
          marginBottom: '6px',
          background: skinStyle.badgeBg,
          padding: '2px 8px',
          borderRadius: '10px',
          letterSpacing: '0.02em',
        }}
      >
        {pageNum}
      </div>

      {/* 페이지 본체 (Canvas + 주석 오버레이 + 제본 음영) */}
      <div
        style={{
          position: 'relative',
          background: skinStyle.bg,
          borderRadius: slotCount > 1 ? (isLeft ? '4px 0 0 4px' : isRight ? '0 4px 4px 0' : '2px') : '4px',
          overflow: 'hidden',
          boxShadow: skinStyle.wrapperShadow,
          border: `1px solid ${skinStyle.borderColor}`,
          filter: skinStyle.filter,
        }}
      >
        <canvas ref={canvasRef} style={{ display: 'block' }} />

        {/* 제본 접힘선 음영 (Book Spine/Gutter Shadow) - 2장/3장 모드 */}
        {slotCount > 1 && isLeft && (
          <div
            style={{
              position: 'absolute',
              top: 0,
              right: 0,
              bottom: 0,
              width: '28px',
              background: skinStyle.gutterShadowLeft,
              pointerEvents: 'none',
              zIndex: 5,
            }}
          />
        )}
        {slotCount > 1 && isRight && (
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              bottom: 0,
              width: '28px',
              background: skinStyle.gutterShadowRight,
              pointerEvents: 'none',
              zIndex: 5,
            }}
          />
        )}

        {/* 주석 레이어 */}
        {rendered && canvasSize.width > 0 && onAddAnnotation && onDeleteAnnotation && (
          <PdfAnnotationLayer
            pageNum={pageNum}
            canvasWidth={canvasSize.width}
            canvasHeight={canvasSize.height}
            annotations={annotations}
            activeTool={activeTool}
            activeColor={activeColor}
            opacity={annotationOpacity}
            onAddAnnotation={onAddAnnotation}
            onDeleteAnnotation={onDeleteAnnotation}
          />
        )}

        {/* 로딩 스켈레톤 인디케이터 */}
        {loading && !rendered && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: skin === 'dark' ? 'rgba(30,30,45,0.7)' : 'rgba(240,240,245,0.7)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 10,
            }}
          >
            <div
              style={{
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                border: '2px solid rgba(59,130,246,0.2)',
                borderTop: '2px solid #3b82f6',
                animation: 'spin 0.8s linear infinite',
              }}
            />
          </div>
        )}
      </div>
    </div>
  )
}
