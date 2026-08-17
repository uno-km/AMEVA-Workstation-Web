/**
 * ============================================================================
 * @file ResizableBlockContainer.tsx
 * @description 에디터 블록 및 문서 뷰어(PDF, Word, PPT, Excel 등)를 위한 8방향 리사이즈 공통 래퍼 컴포넌트
 * @usage <ResizableBlockContainer initialHeight={450} onResizeEnd={...}> ... </ResizableBlockContainer>
 * ============================================================================
 */

import React, { useState, useRef, useCallback, useEffect } from 'react'

export type ResizeDirection = 'n' | 's' | 'e' | 'w' | 'nw' | 'ne' | 'sw' | 'se'

export interface ResizableBlockContainerProps {
  initialWidth?: string | number
  initialHeight?: string | number
  minWidth?: number
  maxWidth?: number
  minHeight?: number
  maxHeight?: number
  accentColor?: string
  header?: React.ReactNode
  children: React.ReactNode | ((props: { height: number; width: string | number; isResizing: boolean }) => React.ReactNode)
  onResizeEnd?: (dimensions: { width: string; height: number }) => void
  style?: React.CSSProperties
  className?: string
  enableResize?: boolean
}

const CURSOR_MAP: Record<ResizeDirection, string> = {
  n: 'ns-resize',
  s: 'ns-resize',
  e: 'ew-resize',
  w: 'ew-resize',
  nw: 'nwse-resize',
  se: 'nwse-resize',
  ne: 'nesw-resize',
  sw: 'nesw-resize',
}

export function ResizableBlockContainer({
  initialWidth = '100%',
  initialHeight = 450,
  minWidth = 280,
  maxWidth = 3200,
  minHeight = 150,
  maxHeight = 4000,
  accentColor = 'var(--primary, #3b82f6)',
  header,
  children,
  onResizeEnd,
  style,
  className = '',
  enableResize = true,
}: ResizableBlockContainerProps) {
  // 숫자 높이 파싱
  const parseH = (h: string | number) => {
    if (typeof h === 'number') return h
    const num = parseInt(h, 10)
    return isNaN(num) ? 450 : num
  }

  const [currentHeight, setCurrentHeight] = useState<number>(() => parseH(initialHeight))
  const [currentWidth, setCurrentWidth] = useState<string | number>(initialWidth)
  const [isResizing, setIsResizing] = useState(false)
  const [activeDirection, setActiveDirection] = useState<ResizeDirection | null>(null)
  const [dragDims, setDragDims] = useState<{ width: number; height: number } | null>(null)
  const [hoveredHandle, setHoveredHandle] = useState<ResizeDirection | null>(null)

  const containerRef = useRef<HTMLDivElement>(null)
  const bodyRef = useRef<HTMLDivElement>(null)

  // 부모 props가 변경되었을 때 상태 동기화 (드래그 중이 아닐 때만)
  useEffect(() => {
    if (!isResizing) {
      setCurrentHeight(parseH(initialHeight))
      setCurrentWidth(initialWidth)
    }
  }, [initialHeight, initialWidth, isResizing])

  // ── 8방향 리사이즈 핸들러 ──
  const handleMouseDown = useCallback((e: React.MouseEvent, dir: ResizeDirection) => {
    if (!enableResize) return
    e.preventDefault()
    e.stopPropagation()

    const container = containerRef.current
    if (!container) return

    const startX = e.clientX
    const startY = e.clientY
    const startRect = container.getBoundingClientRect()
    const startW = startRect.width
    const startH = bodyRef.current ? bodyRef.current.getBoundingClientRect().height : currentHeight

    setIsResizing(true)
    setActiveDirection(dir)
    setDragDims({ width: Math.round(startW), height: Math.round(startH) })

    // 마우스 이벤트 가로채기 방지 오버레이
    const overlay = document.createElement('div')
    overlay.style.cssText = `position:fixed;top:0;left:0;width:100vw;height:100vh;z-index:9999999;cursor:${CURSOR_MAP[dir]};user-select:none;`
    document.body.appendChild(overlay)

    let finalW = startW
    let finalH = startH
    let isFullWidth = typeof currentWidth === 'string' && currentWidth === '100%'

    const onMouseMove = (mv: MouseEvent) => {
      mv.preventDefault()
      mv.stopPropagation()

      const deltaX = mv.clientX - startX
      const deltaY = mv.clientY - startY

      // 높이 계산
      if (dir.includes('s')) {
        finalH = Math.min(maxHeight, Math.max(minHeight, startH + deltaY))
      } else if (dir.includes('n')) {
        finalH = Math.min(maxHeight, Math.max(minHeight, startH - deltaY))
      }

      // 너비 계산
      if (dir.includes('e')) {
        finalW = Math.min(maxWidth, Math.max(minWidth, startW + deltaX))
        isFullWidth = false
      } else if (dir.includes('w')) {
        finalW = Math.min(maxWidth, Math.max(minWidth, startW - deltaX))
        isFullWidth = false
      }

      // DOM 직접 실시간 반영 (프레임 드랍 방지)
      if (dir.includes('n') || dir.includes('s')) {
        if (bodyRef.current) bodyRef.current.style.height = `${finalH}px`
        setCurrentHeight(finalH)
      }

      if (dir.includes('e') || dir.includes('w')) {
        container.style.width = `${finalW}px`
        setCurrentWidth(finalW)
      }

      setDragDims({ width: Math.round(finalW), height: Math.round(finalH) })
    }

    const onMouseUp = (up: MouseEvent) => {
      up.preventDefault()
      up.stopPropagation()

      if (document.body.contains(overlay)) {
        document.body.removeChild(overlay)
      }

      window.removeEventListener('mousemove', onMouseMove, true)
      window.removeEventListener('mouseup', onMouseUp, true)

      setIsResizing(false)
      setActiveDirection(null)
      setDragDims(null)

      const finalWidthStr = isFullWidth ? '100%' : `${Math.round(finalW)}px`
      onResizeEnd?.({
        width: finalWidthStr,
        height: Math.round(finalH),
      })
    }

    window.addEventListener('mousemove', onMouseMove, true)
    window.addEventListener('mouseup', onMouseUp, true)
  }, [enableResize, currentHeight, currentWidth, minHeight, maxHeight, minWidth, maxWidth, onResizeEnd])

  const widthStyle = typeof currentWidth === 'number' ? `${currentWidth}px` : currentWidth

  // 코너 도트 스타일 헬퍼
  const getCornerDotStyle = (dir: ResizeDirection, top?: number | string, bottom?: number | string, left?: number | string, right?: number | string): React.CSSProperties => {
    return {
      position: 'absolute',
      top,
      bottom,
      left,
      right,
      width: 14,
      height: 14,
      cursor: CURSOR_MAP[dir],
      zIndex: 45,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      touchAction: 'none',
    }
  }

  const renderCornerVisual = (dir: ResizeDirection) => {
    const isHovered = hoveredHandle === dir || (isResizing && activeDirection === dir)
    return (
      <div
        style={{
          width: isHovered ? 8 : 6,
          height: isHovered ? 8 : 6,
          borderRadius: '50%',
          background: isHovered ? accentColor : 'rgba(255, 255, 255, 0.4)',
          border: `1px solid ${isHovered ? '#ffffff' : 'rgba(0, 0, 0, 0.6)'}`,
          boxShadow: isHovered ? `0 0 8px ${accentColor}, 0 0 12px ${accentColor}` : '0 1px 3px rgba(0,0,0,0.5)',
          transition: 'all 0.15s ease',
          pointerEvents: 'none',
        }}
      />
    )
  }

  return (
    <div
      ref={containerRef}
      className={`resizable-block-wrapper ${className}`}
      style={{
        position: 'relative',
        width: widthStyle,
        maxWidth: '100%',
        margin: '10px 0',
        borderRadius: 8,
        border: `1px solid ${isResizing ? accentColor : hoveredHandle ? 'rgba(255, 255, 255, 0.25)' : 'rgba(255, 255, 255, 0.12)'}`,
        background: 'var(--bg-panel, #0f0f1a)',
        boxShadow: isResizing ? `0 0 20px ${accentColor}44` : hoveredHandle ? '0 4px 16px rgba(0,0,0,0.4)' : '0 2px 8px rgba(0,0,0,0.25)',
        transition: isResizing ? 'none' : 'border-color 0.2s, box-shadow 0.2s',
        userSelect: isResizing ? 'none' : 'auto',
        ...style,
      }}
    >
      {/* 헤더 영역 */}
      {header}

      {/* 본체 컨테이너 */}
      <div
        ref={bodyRef}
        data-resizable-body
        style={{
          position: 'relative',
          height: `${currentHeight}px`,
          minHeight: `${minHeight}px`,
          maxHeight: `${maxHeight}px`,
          overflow: 'hidden',
          width: '100%',
        }}
      >
        {/* iframe/임베드 위 마우스 캡처 쉴드 (드래그 중 이벤트 유실 차단) */}
        {isResizing && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              zIndex: 9999,
              background: 'rgba(0, 0, 0, 0.01)',
              cursor: activeDirection ? CURSOR_MAP[activeDirection] : 'default',
            }}
          />
        )}

        {/* 자식 렌더링 (함수 또는 ReactNode) */}
        {typeof children === 'function'
          ? children({ height: currentHeight, width: currentWidth, isResizing })
          : children}
      </div>

      {/* 리사이즈 치수 인디케이터 툴팁 (드래그 중에만 표시) */}
      {isResizing && dragDims && (
        <div
          style={{
            position: 'absolute',
            bottom: 12,
            right: 16,
            zIndex: 10000,
            background: 'rgba(15, 23, 42, 0.95)',
            color: '#38bdf8',
            border: '1px solid rgba(56, 189, 248, 0.5)',
            padding: '4px 10px',
            borderRadius: 6,
            fontSize: 11,
            fontWeight: 700,
            pointerEvents: 'none',
            boxShadow: '0 4px 16px rgba(0,0,0,0.6)',
            letterSpacing: '0.4px',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <span style={{ fontSize: 13 }}>📐</span>
          <span>{dragDims.width} × {dragDims.height} px</span>
        </div>
      )}

      {/* ── 8방향 리사이즈 핸들 (상하좌우 + 4개 모서리) ── */}
      {enableResize && (
        <>
          {/* 상단 (Top) — 히트박스 12px */}
          <div
            onMouseDown={(e) => handleMouseDown(e, 'n')}
            onMouseEnter={() => setHoveredHandle('n')}
            onMouseLeave={() => setHoveredHandle(null)}
            contentEditable={false}
            style={{
              position: 'absolute',
              top: -6,
              left: 12,
              right: 12,
              height: 12,
              cursor: 'ns-resize',
              zIndex: 40,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            title="상단 크기 조절 (위아래 드래그)"
          >
            <div
              style={{
                width: 48,
                height: 3,
                background: hoveredHandle === 'n' || (isResizing && activeDirection?.includes('n')) ? accentColor : 'transparent',
                borderRadius: 2,
                transition: 'background 0.15s',
                boxShadow: hoveredHandle === 'n' || (isResizing && activeDirection?.includes('n')) ? `0 0 8px ${accentColor}` : 'none',
              }}
            />
          </div>

          {/* 하단 (Bottom) — 대형 필 핸들 제공 (히트박스 14px) */}
          <div
            onMouseDown={(e) => handleMouseDown(e, 's')}
            onMouseEnter={() => setHoveredHandle('s')}
            onMouseLeave={() => setHoveredHandle(null)}
            contentEditable={false}
            style={{
              position: 'absolute',
              bottom: -7,
              left: 12,
              right: 12,
              height: 14,
              cursor: 'ns-resize',
              zIndex: 40,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            title="하단 높이 조절 (위아래 드래그)"
          >
            <div
              style={{
                width: hoveredHandle === 's' || (isResizing && activeDirection?.includes('s')) ? 80 : 60,
                height: 4,
                background: hoveredHandle === 's' || (isResizing && activeDirection?.includes('s')) ? accentColor : 'rgba(255,255,255,0.3)',
                borderRadius: 2,
                transition: 'all 0.15s ease',
                boxShadow: hoveredHandle === 's' || (isResizing && activeDirection?.includes('s')) ? `0 0 10px ${accentColor}` : 'none',
              }}
            />
          </div>

          {/* 좌측 (Left) — 히트박스 12px */}
          <div
            onMouseDown={(e) => handleMouseDown(e, 'w')}
            onMouseEnter={() => setHoveredHandle('w')}
            onMouseLeave={() => setHoveredHandle(null)}
            contentEditable={false}
            style={{
              position: 'absolute',
              top: 12,
              bottom: 12,
              left: -6,
              width: 12,
              cursor: 'ew-resize',
              zIndex: 40,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            title="좌측 너비 조절"
          >
            <div
              style={{
                width: 3,
                height: 48,
                background: hoveredHandle === 'w' || (isResizing && activeDirection?.includes('w')) ? accentColor : 'transparent',
                borderRadius: 2,
                transition: 'background 0.15s',
                boxShadow: hoveredHandle === 'w' || (isResizing && activeDirection?.includes('w')) ? `0 0 8px ${accentColor}` : 'none',
              }}
            />
          </div>

          {/* 우측 (Right) — 대형 필 핸들 제공 (더블클릭시 100% 리셋, 히트박스 14px) */}
          <div
            onMouseDown={(e) => handleMouseDown(e, 'e')}
            onMouseEnter={() => setHoveredHandle('e')}
            onMouseLeave={() => setHoveredHandle(null)}
            onDoubleClick={(e) => {
              e.stopPropagation()
              setCurrentWidth('100%')
              if (containerRef.current) containerRef.current.style.width = '100%'
              onResizeEnd?.({ width: '100%', height: currentHeight })
            }}
            contentEditable={false}
            style={{
              position: 'absolute',
              top: 12,
              bottom: 12,
              right: -7,
              width: 14,
              cursor: 'ew-resize',
              zIndex: 40,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            title="우측 너비 조절 (더블클릭시 100% 리셋)"
          >
            <div
              style={{
                width: 4,
                height: hoveredHandle === 'e' || (isResizing && activeDirection?.includes('e')) ? 64 : 48,
                background: hoveredHandle === 'e' || (isResizing && activeDirection?.includes('e')) ? accentColor : 'rgba(255,255,255,0.3)',
                borderRadius: 2,
                transition: 'all 0.15s ease',
                boxShadow: hoveredHandle === 'e' || (isResizing && activeDirection?.includes('e')) ? `0 0 10px ${accentColor}` : 'none',
              }}
            />
          </div>

          {/* 4개 모서리 (Corner Grips) — 14px x 14px 히트박스 + 시각적 코너 도트 */}
          <div
            onMouseDown={(e) => handleMouseDown(e, 'nw')}
            onMouseEnter={() => setHoveredHandle('nw')}
            onMouseLeave={() => setHoveredHandle(null)}
            contentEditable={false}
            style={getCornerDotStyle('nw', -6, undefined, -6, undefined)}
            title="좌상단 대각선 크기 조절"
          >
            {renderCornerVisual('nw')}
          </div>

          <div
            onMouseDown={(e) => handleMouseDown(e, 'ne')}
            onMouseEnter={() => setHoveredHandle('ne')}
            onMouseLeave={() => setHoveredHandle(null)}
            contentEditable={false}
            style={getCornerDotStyle('ne', -6, undefined, undefined, -6)}
            title="우상단 대각선 크기 조절"
          >
            {renderCornerVisual('ne')}
          </div>

          <div
            onMouseDown={(e) => handleMouseDown(e, 'sw')}
            onMouseEnter={() => setHoveredHandle('sw')}
            onMouseLeave={() => setHoveredHandle(null)}
            contentEditable={false}
            style={getCornerDotStyle('sw', undefined, -6, -6, undefined)}
            title="좌하단 대각선 크기 조절"
          >
            {renderCornerVisual('sw')}
          </div>

          <div
            onMouseDown={(e) => handleMouseDown(e, 'se')}
            onMouseEnter={() => setHoveredHandle('se')}
            onMouseLeave={() => setHoveredHandle(null)}
            contentEditable={false}
            style={getCornerDotStyle('se', undefined, -6, undefined, -6)}
            title="우하단 대각선 크기 조절"
          >
            {renderCornerVisual('se')}
          </div>
        </>
      )}
    </div>
  )
}
