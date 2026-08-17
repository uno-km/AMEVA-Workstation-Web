/**
 * ============================================================================
 * @file ImageLightbox.tsx
 * @description ImageLightbox.tsx 시스템 모듈 구성요소로, 관련 UI 렌더링 및 비즈니스 로직을 담당합니다.
 * @usage 문서 에디터 및 뷰어 내부에서 동적으로 호출되거나 유틸리티 함수로 사용됩니다.
 * ============================================================================
 */

import React, { useState, useRef, useEffect } from 'react'
import { ZoomIn, ZoomOut, RotateCcw, X, Grab } from 'lucide-react'

interface ImageLightboxProps {
  url: string
  alt?: string
  onClose: () => void
}

export function ImageLightbox({ url, alt, onClose }: ImageLightboxProps) {
  const [scale, setScale] = useState(1)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const dragStart = useRef({ x: 0, y: 0 })
  const imgRef = useRef<HTMLImageElement | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)

  // ESC 키로 닫기
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  // 휠 스크롤로 무손실 줌 인/아웃 (native non-passive listener)
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const handleNativeWheel = (e: WheelEvent) => {
      e.preventDefault()
      const zoomFactor = 0.1
      setScale((prevScale) => {
        let newScale = prevScale + (e.deltaY < 0 ? zoomFactor : -zoomFactor)
        return Math.max(0.5, Math.min(5, newScale))
      })
    }

    container.addEventListener('wheel', handleNativeWheel, { passive: false })
    return () => container.removeEventListener('wheel', handleNativeWheel)
  }, [])

  // 드래그 이동 시작
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    setIsDragging(true)
    dragStart.current = { x: e.clientX - position.x, y: e.clientY - position.y }
  }

  // 드래그 이동 중
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return
    setPosition({
      x: e.clientX - dragStart.current.x,
      y: e.clientY - dragStart.current.y,
    })
  }

  // 드래그 이동 종료
  const handleMouseUpOrLeave = () => {
    setIsDragging(false)
  }

  const resetZoom = () => {
    setScale(1)
    setPosition({ x: 0, y: 0 })
  }

  return (
    <div
      ref={containerRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        backgroundColor: 'rgba(5, 5, 10, 0.95)',
        backdropFilter: 'blur(10px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
      }}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUpOrLeave}
      onMouseLeave={handleMouseUpOrLeave}
    >
      {/* 타이틀 및 메타 정보 */}
      <div
        style={{
          position: 'absolute',
          top: 20,
          left: 20,
          color: '#a78bfa',
          fontFamily: 'var(--font-sans)',
          fontSize: '14px',
          pointerEvents: 'none',
        }}
      >
        <h4>무손실 고해상도 뷰어</h4>
        <p style={{ color: 'var(--text-muted)', fontSize: '12px', marginTop: '4px' }}>
          {alt || '이미지 파일'} | 배율: {Math.round(scale * 100)}%
        </p>
      </div>

      {/* 컨트롤 도구 바 */}
      <div
        className="glass-panel"
        style={{
          position: 'absolute',
          bottom: 30,
          display: 'flex',
          gap: '12px',
          padding: '8px 16px',
          borderRadius: '20px',
          alignItems: 'center',
          boxShadow: '0 8px 32px rgba(139, 92, 246, 0.2)',
          zIndex: 10000,
        }}
      >
        <button
          className="btn btn-glass"
          style={{ padding: '6px', borderRadius: '50%' }}
          onClick={() => setScale(Math.max(0.5, scale - 0.2))}
          title="축소"
        >
          <ZoomOut size={18} />
        </button>
        <button
          className="btn btn-glass"
          style={{ padding: '6px', borderRadius: '50%' }}
          onClick={() => setScale(Math.min(5, scale + 0.2))}
          title="확대"
        >
          <ZoomIn size={18} />
        </button>
        <button
          className="btn btn-glass"
          style={{ padding: '6px', borderRadius: '50%' }}
          onClick={resetZoom}
          title="원래대로"
        >
          <RotateCcw size={18} />
        </button>
        <div style={{ width: '1px', height: '20px', backgroundColor: 'var(--border-muted)' }} />
        <button
          className="btn btn-glass"
          style={{ padding: '6px', borderRadius: '50%', color: 'var(--danger)', borderColor: 'rgba(239, 68, 68, 0.2)' }}
          onClick={onClose}
          title="닫기 (Esc)"
        >
          <X size={18} />
        </button>
      </div>

      {/* 드래그 힌트 */}
      <div
        style={{
          position: 'absolute',
          top: 20,
          right: 20,
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          color: 'var(--text-muted)',
          fontSize: '12px',
        }}
      >
        <Grab size={14} /> 드래그하여 이동 / 마우스 휠로 줌인
      </div>

      {/* 이미지 홀더 */}
      <div
        onMouseDown={handleMouseDown}
        style={{
          cursor: isDragging ? 'grabbing' : 'grab',
          transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
          transition: isDragging ? 'none' : 'transform 0.15s ease-out',
          display: 'inline-block',
        }}
      >
        <img
          ref={imgRef}
          src={url}
          alt={alt}
          style={{
            maxWidth: '90vw',
            maxHeight: '85vh',
            objectFit: 'contain',
            borderRadius: '4px',
            pointerEvents: 'none',
            boxShadow: '0 20px 50px rgba(0, 0, 0, 0.5)',
          }}
        />
      </div>
    </div>
  )
}
