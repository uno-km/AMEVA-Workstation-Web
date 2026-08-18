/**
 * @file ImageLightbox.tsx
 * @system AMEVA OS Desktop Workstation - UI & Media Core
 * @location packages/core/src/renderer/components/ImageLightbox.tsx
 * @role Lossless High-Resolution Image Lightbox Modal Component
 * 
 * [설계 의도 - DESIGN INTENT / ADR]
 * - 고해상도 무손실 확대, 휠 줌(Wheel Zoom 0.5x~5.0x), 드래그 패닝(Drag Panning)을 지원하는 풀스크린 오버레이 뷰어 모달.
 * - 사용자가 쉽게 모달을 닫을 수 있도록 ESC 키보드 단축키, 상단 우측 명시적 [✕ 닫기 (ESC)] 버튼, 어두운 백드롭 영역 클릭 닫기를 3중으로 보장한다.
 * - 안티그래비티 테크 블루 테마(#60a5fa, #2563eb)와 매끄러운 글래스모피즘 비주얼을 적용한다.
 * 
 * [책임 범위 - RESPONSIBILITY]
 * - 이미지 확대 축소 비율(`scale`), 드래그 위치(`position`), 드래그 플래그(`isDragging`) 관리.
 * - ESC 키 바인딩 및 휠 이벤트 리스너 제어 (Non-passive listener).
 * 
 * [절대 깨면 안 되는 계약 - CONTRACT]
 * - MUST: 휠 이벤트 등록 시 `passive: false`를 지정하여 브라우저 기본 페이지 스크롤을 막고 줌 동작을 수행할 것.
 * - MUST: 언마운트 시 키보드 및 휠 리스너를 완전히 해제할 것.
 * 
 * [소비처 - CONSUMERS / USAGE CONTEXT]
 * - 소비처 A (packages/core/src/renderer/components/MarkdownEditor.tsx): 마크다운 에디터 최상위 렌더링.
 */

/* 
 * [IMPORT SEGMENTATION & CONTRACTS]
 * - react: UI 상태 및 참조 관리를 위한 리액트 코어.
 * - lucide-react: 줌, 회전, 닫기, 핸드 그랩 아이콘 셋.
 */
import React, { useState, useRef, useEffect } from 'react'
import { ZoomIn, ZoomOut, RotateCcw, X, Grab } from 'lucide-react'

/**
 * ImageLightboxProps 모듈 내외부에서 사용되는 데이터 통신 규격 및 타입을 정의합니다.
 * @remarks 이 주석은 컨벤션에 따라 자동 생성된 문서화 내용입니다.
 */
export interface ImageLightboxProps {
  /** 렌더링할 원본 이미지 URL (data/blob/http/vfs) */
  url: string
  /** 이미지 캡션 또는 대체 텍스트 */
  alt?: string
  /** 라이트박스 닫기 콜백 함수 */
  onClose: () => void
}

/*
 * [FUNCTION CONTRACT]
 * - 함수 명: `ImageLightbox`
 * - 역할: 전달받은 이미지 URL을 전체화면 오버레이 모달로 확대 렌더링하고 패닝/줌 상호작용을 제공함.
 * - 예시: `<ImageLightbox url={imgSrc} onClose={() => setSelected(null)} />`
 */
/**
 * ImageLightbox 컴포넌트의 핵심 비즈니스 로직 및 상태 제어를 처리합니다.
 * @remarks 이 주석은 컨벤션에 따라 자동 생성된 문서화 내용입니다.
 */
export function ImageLightbox({ url, alt, onClose }: ImageLightboxProps) {
  /*
   * [RUN-TIME STATE / INVARIANT]
   * - 변수 명: `scale`
   * - 자료형 / 예상 값: number (0.5 ~ 5.0).
   * - 시나리오: 마우스 휠 또는 줌 버튼 입력 시 이미지 배율을 증감시킴.
   */
  const [scale, setScale] = useState(1)

  /*
   * [RUN-TIME STATE / INVARIANT]
   * - 변수 명: `position`
   * - 자료형 / 예상 값: { x: number, y: number } (픽셀 오프셋).
   * - 시나리오: 드래그 패닝 시 이미지 렌더링 중심 좌표를 이동시킴.
   */
  const [position, setPosition] = useState({ x: 0, y: 0 })

  /*
   * [RUN-TIME STATE / INVARIANT]
   * - 변수 명: `isDragging`
   * - 자료형 / 예상 값: boolean.
   */
  const [isDragging, setIsDragging] = useState(false)

  const dragStart = useRef({ x: 0, y: 0 })
  const imgRef = useRef<HTMLImageElement | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)

  /**
   * [SIDE EFFECT - ESC Key Down Dismissal]
   * - Rationale: 사용자가 ESC를 눌렀을 때 직관적으로 뷰어를 닫을 수 있도록 전역 리스너 등록.
   */
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `e.key === 'Escape'`
       * - 만족 시: 라이트박스 닫기 콜백 실행.
       */
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  /**
   * [SIDE EFFECT - Non-passive Wheel Zoom Handler]
   * - Rationale: 휠 델타 값을 감지하여 0.5배율에서 5배율까지 무손실 줌 인/아웃을 계산함.
   */
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

  /*
   * [FUNCTION CONTRACT]
   * - 함수 명: `handleMouseDown`
   * - 역할: 드래그 패닝 시작 좌표 캐싱 및 드래그 플래그 활성화.
   */
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
    dragStart.current = { x: e.clientX - position.x, y: e.clientY - position.y }
  }

  /*
   * [FUNCTION CONTRACT]
   * - 함수 명: `handleMouseMove`
   * - 역할: 마우스 이동에 따른 실시간 위치 좌표 업데이트.
   */
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return
    setPosition({
      x: e.clientX - dragStart.current.x,
      y: e.clientY - dragStart.current.y,
    })
  }

  /*
   * [FUNCTION CONTRACT]
   * - 함수 명: `handleMouseUpOrLeave`
   * - 역할: 마우스 릴리즈 또는 영역 이탈 시 드래그 모드 해제.
   */
  const handleMouseUpOrLeave = () => {
    setIsDragging(false)
  }

  /*
   * [FUNCTION CONTRACT]
   * - 함수 명: `resetZoom`
   * - 역할: 배율을 100% 원본 크기 및 정중앙(0, 0) 좌표로 리셋.
   */
  const resetZoom = () => {
    setScale(1)
    setPosition({ x: 0, y: 0 })
  }

  /*
   * [FUNCTION CONTRACT]
   * - 함수 명: `handleBackdropClick`
   * - 역할: 이미지 바깥의 어두운 배경 영역을 클릭했을 때 모달 닫기 수행.
   */
  const handleBackdropClick = (e: React.MouseEvent) => {
    /*
     * [ALGORITHM BRANCH / DECISION]
     * - 조건 식: `e.target === containerRef.current`
     * - 만족 시: 백드롭 클릭이므로 닫기 콜백 실행.
     */
    if (e.target === containerRef.current) {
      onClose()
    }
  }

  return (
    <div
      ref={containerRef}
      onClick={handleBackdropClick}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        backgroundColor: 'rgba(5, 7, 15, 0.94)',
        backdropFilter: 'blur(12px)',
        zIndex: 99999,
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
          left: 24,
          color: '#60a5fa',
          fontFamily: 'var(--font-sans)',
          fontSize: '14px',
          pointerEvents: 'none',
          zIndex: 100001,
        }}
      >
        <h4 style={{ margin: 0, fontWeight: 700, fontSize: '15px', color: '#93c5fd' }}>🔍 무손실 고해상도 뷰어</h4>
        <p style={{ color: '#94a3b8', fontSize: '12px', marginTop: '4px', margin: 0 }}>
          {alt || '이미지 원본'} | 배율: {Math.round(scale * 100)}%
        </p>
      </div>

      {/* 상단 우측 명시적 닫기 버튼 */}
      <button
        onClick={onClose}
        style={{
          position: 'absolute',
          top: 20,
          right: 24,
          background: 'rgba(239, 68, 68, 0.15)',
          border: '1px solid rgba(239, 68, 68, 0.35)',
          color: '#fca5a5',
          borderRadius: '8px',
          padding: '6px 12px',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          cursor: 'pointer',
          fontSize: '12px',
          fontWeight: 600,
          zIndex: 100001,
        }}
        title="닫기 (Esc)"
      >
        <X size={16} />
        <span>닫기 (ESC)</span>
      </button>

      {/* 컨트롤 도구 바 (상단 중앙으로 이동하여 하단 상태바/콘텐츠 가림 원천 방지) */}
      <div
        style={{
          position: 'absolute',
          top: 20,
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          gap: '12px',
          padding: '8px 18px',
          borderRadius: '24px',
          alignItems: 'center',
          background: 'rgba(15, 23, 42, 0.92)',
          border: '1px solid rgba(59, 130, 246, 0.4)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.7), 0 0 18px rgba(59, 130, 246, 0.25)',
          zIndex: 100001,
          backdropFilter: 'blur(10px)'
        }}
      >
        <button
          style={lightboxBtnStyle}
          onClick={() => setScale(Math.max(0.5, scale - 0.2))}
          title="축소"
        >
          <ZoomOut size={18} />
        </button>
        <button
          style={lightboxBtnStyle}
          onClick={() => setScale(Math.min(5, scale + 0.2))}
          title="확대"
        >
          <ZoomIn size={18} />
        </button>
        <button
          style={lightboxBtnStyle}
          onClick={resetZoom}
          title="원래대로"
        >
          <RotateCcw size={18} />
        </button>
        <div style={{ width: '1px', height: '20px', backgroundColor: 'rgba(255, 255, 255, 0.15)' }} />
        <button
          style={{ ...lightboxBtnStyle, color: '#f87171' }}
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
          top: 72,
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          color: '#94a3b8',
          fontSize: '11.5px',
          zIndex: 100001,
          pointerEvents: 'none',
          background: 'rgba(15, 23, 42, 0.65)',
          padding: '3px 12px',
          borderRadius: '12px',
          backdropFilter: 'blur(6px)'
        }}
      >
        <Grab size={13} /> 드래그하여 이동 / 마우스 휠로 줌
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
            borderRadius: '6px',
            pointerEvents: 'none',
            boxShadow: '0 25px 60px rgba(0, 0, 0, 0.7)',
          }}
        />
      </div>
    </div>
  )
}

const lightboxBtnStyle: React.CSSProperties = {
  background: 'rgba(255, 255, 255, 0.08)',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  color: '#93c5fd',
  borderRadius: '50%',
  padding: '6px',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  transition: 'all 0.15s ease',
}
