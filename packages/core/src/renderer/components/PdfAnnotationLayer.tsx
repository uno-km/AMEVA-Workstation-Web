/**
 * @file PdfAnnotationLayer.tsx
 * @system AMEVA OS Desktop Workstation
 * @location src/renderer/components/PdfAnnotationLayer.tsx
 * @role PDF Canvas 위에 올라가는 SVG 인터랙티브 주석 오버레이
 *
 * [책임 범위 - RESPONSIBILITY]
 * - PDF Canvas와 동일한 크기의 투명 SVG 레이어를 렌더링한다.
 * - 마우스 드래그로 하이라이트/사각형/화살표 주석을 실시간으로 그린다.
 * - 클릭으로 텍스트 스티커 메모를 추가한다.
 * - 저장된 주석 목록을 SVG 도형으로 렌더링한다.
 * - 지우개 도구로 주석을 선택 삭제한다.
 */

import React, { useRef, useState, useCallback, useEffect } from 'react'
import type { PdfAnnotation } from '../utils/pdfAnnotationWriter'
import type { AnnotationTool } from '../hooks/usePdfAnnotations'

interface PdfAnnotationLayerProps {
  pageNum: number
  canvasWidth: number
  canvasHeight: number
  annotations: PdfAnnotation[]
  activeTool: AnnotationTool
  activeColor: string
  opacity: number
  onAddAnnotation: (ann: Omit<PdfAnnotation, 'id' | 'createdAt'>) => void
  onDeleteAnnotation: (id: string) => void
}

interface DrawState {
  isDrawing: boolean
  startX: number
  startY: number
  currentX: number
  currentY: number
  points: [number, number][]
}

const TOOL_CURSORS: Record<AnnotationTool, string> = {
  none: 'default',
  highlight: 'crosshair',
  underline: 'text',
  text: 'text',
  draw: 'crosshair',
  arrow: 'crosshair',
  rect: 'crosshair',
  eraser: 'cell',
}

export function PdfAnnotationLayer({
  pageNum,
  canvasWidth,
  canvasHeight,
  annotations,
  activeTool,
  activeColor,
  opacity,
  onAddAnnotation,
  onDeleteAnnotation,
}: PdfAnnotationLayerProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const [drawState, setDrawState] = useState<DrawState>({
    isDrawing: false,
    startX: 0, startY: 0,
    currentX: 0, currentY: 0,
    points: [],
  })
  const [textInput, setTextInput] = useState<{ x: number; y: number; visible: boolean; value: string }>({
    x: 0, y: 0, visible: false, value: ''
  })

  const getRelativeCoords = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = svgRef.current!.getBoundingClientRect()
    return {
      x: (e.clientX - rect.left) / rect.width,
      y: (e.clientY - rect.top) / rect.height,
    }
  }

  const handleMouseDown = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    if (activeTool === 'none' || activeTool === 'eraser') return
    if (activeTool === 'text') {
      const { x, y } = getRelativeCoords(e)
      setTextInput({ x, y, visible: true, value: '' })
      return
    }
    e.preventDefault()
    const { x, y } = getRelativeCoords(e)
    setDrawState({
      isDrawing: true,
      startX: x, startY: y,
      currentX: x, currentY: y,
      points: [[x, y]],
    })
  }, [activeTool])

  const handleMouseMove = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    if (!drawState.isDrawing) return
    const { x, y } = getRelativeCoords(e)
    setDrawState(prev => ({
      ...prev,
      currentX: x,
      currentY: y,
      points: activeTool === 'draw' ? [...prev.points, [x, y]] : prev.points,
    }))
  }, [drawState.isDrawing, activeTool])

  const handleMouseUp = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    if (!drawState.isDrawing) return
    const { x, y } = getRelativeCoords(e)

    const minW = 0.005
    const dx = Math.abs(x - drawState.startX)
    const dy = Math.abs(y - drawState.startY)

    if (activeTool === 'draw') {
      if (drawState.points.length > 1) {
        onAddAnnotation({
          pageNum,
          type: 'draw',
          color: activeColor,
          opacity,
          x: 0, y: 0, width: 1, height: 1,
          points: [...drawState.points, [x, y]],
        })
      }
    } else if (dx > minW || dy > minW) {
      const annotationType = activeTool as PdfAnnotation['type']
      onAddAnnotation({
        pageNum,
        type: annotationType,
        color: activeColor,
        opacity,
        x: Math.min(drawState.startX, x),
        y: Math.min(drawState.startY, y),
        width: Math.abs(x - drawState.startX),
        height: Math.abs(y - drawState.startY),
      })
    }

    setDrawState(prev => ({ ...prev, isDrawing: false, points: [] }))
  }, [drawState, activeTool, activeColor, opacity, pageNum, onAddAnnotation])

  const handleTextConfirm = useCallback(() => {
    if (textInput.value.trim()) {
      onAddAnnotation({
        pageNum,
        type: 'text',
        color: activeColor,
        opacity,
        x: textInput.x,
        y: textInput.y,
        width: 0.2,
        height: 0.08,
        text: textInput.value.trim(),
      })
    }
    setTextInput(prev => ({ ...prev, visible: false, value: '' }))
  }, [textInput, activeColor, opacity, pageNum, onAddAnnotation])

  // 현재 페이지 주석만 필터
  const pageAnnotations = annotations.filter(a => a.pageNum === pageNum)

  const renderAnnotation = (ann: PdfAnnotation) => {
    const x = ann.x * 100
    const y = ann.y * 100
    const w = ann.width * 100
    const h = ann.height * 100

    const handleClick = (e: React.MouseEvent) => {
      if (activeTool === 'eraser') {
        e.stopPropagation()
        onDeleteAnnotation(ann.id)
      }
    }

    switch (ann.type) {
      case 'highlight':
        return (
          <rect
            key={ann.id}
            x={`${x}%`} y={`${y}%`}
            width={`${w}%`} height={`${h}%`}
            fill={ann.color}
            fillOpacity={ann.opacity * 0.35}
            style={{ cursor: activeTool === 'eraser' ? 'not-allowed' : 'default' }}
            onClick={handleClick}
          />
        )

      case 'underline':
        return (
          <line
            key={ann.id}
            x1={`${x}%`} y1={`${y + h}%`}
            x2={`${x + w}%`} y2={`${y + h}%`}
            stroke={ann.color}
            strokeWidth="1.5"
            strokeOpacity={ann.opacity}
            style={{ cursor: activeTool === 'eraser' ? 'not-allowed' : 'default' }}
            onClick={handleClick}
          />
        )

      case 'rect':
        return (
          <rect
            key={ann.id}
            x={`${x}%`} y={`${y}%`}
            width={`${w}%`} height={`${h}%`}
            fill="none"
            stroke={ann.color}
            strokeWidth="2"
            strokeOpacity={ann.opacity}
            style={{ cursor: activeTool === 'eraser' ? 'not-allowed' : 'default' }}
            onClick={handleClick}
          />
        )

      case 'text':
        return (
          <g key={ann.id} onClick={handleClick} style={{ cursor: activeTool === 'eraser' ? 'not-allowed' : 'default' }}>
            <rect
              x={`${x - 0.5}%`} y={`${y - 0.3}%`}
              width={`${w + 1}%`} height={`${h + 0.6}%`}
              fill="#FFFDE7"
              fillOpacity="0.92"
              stroke="#F9A825"
              strokeWidth="1"
              rx="3"
            />
            <foreignObject
              x={`${x}%`} y={`${y}%`}
              width={`${w}%`} height={`${h}%`}
            >
              <div
                style={{
                  fontSize: '11px',
                  lineHeight: 1.3,
                  color: '#1a1a1a',
                  padding: '2px',
                  wordBreak: 'break-word',
                  overflow: 'hidden',
                  height: '100%',
                }}
              >
                {ann.text}
              </div>
            </foreignObject>
          </g>
        )

      case 'draw':
        if (!ann.points || ann.points.length < 2) return null
        const pathD = ann.points.map((p, i) =>
          `${i === 0 ? 'M' : 'L'}${p[0] * 100},${p[1] * 100}`
        ).join(' ')
        return (
          <path
            key={ann.id}
            d={pathD}
            fill="none"
            stroke={ann.color}
            strokeWidth="2"
            strokeOpacity={ann.opacity}
            strokeLinecap="round"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
            style={{ cursor: activeTool === 'eraser' ? 'not-allowed' : 'default' }}
            onClick={handleClick}
          />
        )

      case 'arrow': {
        const midY = y + h / 2
        return (
          <g key={ann.id} onClick={handleClick} style={{ cursor: activeTool === 'eraser' ? 'not-allowed' : 'default' }}>
            <defs>
              <marker
                id={`arrow-${ann.id}`}
                markerWidth="6" markerHeight="6"
                refX="3" refY="3"
                orient="auto"
              >
                <path d="M0,0 L0,6 L6,3 z" fill={ann.color} fillOpacity={ann.opacity} />
              </marker>
            </defs>
            <line
              x1={`${x}%`} y1={`${midY}%`}
              x2={`${x + w}%`} y2={`${midY}%`}
              stroke={ann.color}
              strokeWidth="2"
              strokeOpacity={ann.opacity}
              markerEnd={`url(#arrow-${ann.id})`}
            />
          </g>
        )
      }

      default:
        return null
    }
  }

  // 드래그 중 실시간 미리보기
  const renderPreview = () => {
    if (!drawState.isDrawing || activeTool === 'text') return null
    const x = Math.min(drawState.startX, drawState.currentX) * 100
    const y = Math.min(drawState.startY, drawState.currentY) * 100
    const w = Math.abs(drawState.currentX - drawState.startX) * 100
    const h = Math.abs(drawState.currentY - drawState.startY) * 100

    if (activeTool === 'draw') {
      if (drawState.points.length < 2) return null
      const pathD = drawState.points.map((p, i) =>
        `${i === 0 ? 'M' : 'L'}${p[0] * 100},${p[1] * 100}`
      ).join(' ')
      return (
        <path
          d={pathD}
          fill="none"
          stroke={activeColor}
          strokeWidth="2"
          strokeOpacity="0.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
      )
    }

    if (activeTool === 'highlight') {
      return <rect x={`${x}%`} y={`${y}%`} width={`${w}%`} height={`${h}%`} fill={activeColor} fillOpacity="0.3" />
    }
    if (activeTool === 'rect') {
      return <rect x={`${x}%`} y={`${y}%`} width={`${w}%`} height={`${h}%`} fill="none" stroke={activeColor} strokeWidth="2" strokeDasharray="4" />
    }
    if (activeTool === 'arrow') {
      const midY = drawState.startY * 100
      return (
        <line
          x1={`${drawState.startX * 100}%`} y1={`${midY}%`}
          x2={`${drawState.currentX * 100}%`} y2={`${midY}%`}
          stroke={activeColor} strokeWidth="2" strokeDasharray="4"
        />
      )
    }
    return null
  }

  return (
    <div
      style={{
        position: 'absolute',
        top: 0, left: 0,
        width: '100%', height: '100%',
        pointerEvents: activeTool === 'none' ? 'none' : 'all',
        zIndex: 5,
      }}
    >
      <svg
        ref={svgRef}
        width="100%"
        height="100%"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        style={{
          position: 'absolute',
          top: 0, left: 0,
          cursor: TOOL_CURSORS[activeTool],
          userSelect: 'none',
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={() => setDrawState(prev => ({ ...prev, isDrawing: false, points: [] }))}
      >
        {pageAnnotations.map(renderAnnotation)}
        {renderPreview()}
      </svg>

      {/* 텍스트 스티커 입력창 */}
      {textInput.visible && (
        <div
          style={{
            position: 'absolute',
            left: `${textInput.x * 100}%`,
            top: `${textInput.y * 100}%`,
            zIndex: 20,
            transform: 'translate(0, -100%)',
          }}
        >
          <textarea
            autoFocus
            value={textInput.value}
            onChange={e => setTextInput(prev => ({ ...prev, value: e.target.value }))}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleTextConfirm() } if (e.key === 'Escape') setTextInput(prev => ({ ...prev, visible: false })) }}
            placeholder="메모 입력 (Enter 확인, Esc 취소)"
            rows={3}
            style={{
              width: '180px',
              background: '#FFFDE7',
              border: '2px solid #F9A825',
              borderRadius: '6px',
              padding: '6px',
              fontSize: '12px',
              color: '#1a1a1a',
              resize: 'none',
              outline: 'none',
              boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
              fontFamily: 'inherit',
            }}
          />
          <div style={{ display: 'flex', gap: '4px', marginTop: '4px' }}>
            <button
              onClick={handleTextConfirm}
              style={{
                flex: 1, padding: '3px', borderRadius: '4px',
                background: '#F9A825', border: 'none',
                fontSize: '11px', fontWeight: 700, cursor: 'pointer',
                color: '#1a1a1a',
              }}
            >
              확인
            </button>
            <button
              onClick={() => setTextInput(prev => ({ ...prev, visible: false }))}
              style={{
                flex: 1, padding: '3px', borderRadius: '4px',
                background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)',
                fontSize: '11px', cursor: 'pointer',
                color: '#fff',
              }}
            >
              취소
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
