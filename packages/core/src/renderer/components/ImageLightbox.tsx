/**
 * @file ImageLightbox.tsx
 * @system AMEVA OS Desktop Workstation
 * @location src/renderer/components/ImageLightbox.tsx
 * @role Core module helper and integration logic
 * 
 * [소비처 - CONSUMERS / USAGE CONTEXT]
 * - 소비처 A (src/renderer/AppLayout.tsx): 레이아웃 그리드 내부 또는 플로팅 레이어 영역 내에서 그리기로 소비.
 * - 소비처 B (src/renderer/App.tsx): 전역 모달 매니저 및 뷰포트 상태 스위칭에 따라 동적 마운트되어 소비.
 * 
 * [책임 범위 - RESPONSIBILITY]
 * - 본 파일은 AMEVA 시스템 내에서 도메인 목적에 부합하는 연산 및 데이터 처리 흐름을 안전하게 캡슐화한다.
 * - 외부 라이브러리 및 하위 종속성을 조율하고 결과 규격을 일관되게 제공한다.
 * 
 * [절대 깨면 안 되는 계약 - CONTRACT]
 * - MUST: 모든 예외 발생 시 에러를 침묵시키지 말고 에러 로그를 명확하게 남길 것.
 * - MUST NOT: TypeScript any 형식을 우회 수단으로 함부로 선언하지 말 것.
 */

import React, { useState, useRef, useEffect } from 'react'
import { ZoomIn, ZoomOut, RotateCcw, X, Grab } from 'lucide-react'

interface ImageLightboxProps {
  url: string
  alt?: string
  onClose: () => void
}

  /*
   * [FUNCTION CONTRACT]
   * - 함수 명: `ImageLightbox`
   * - 역할: 인자 정보를 검수하고 비즈니스 계약 조건에 맞춰 최종 바인딩 결과물/바이너리 버퍼를 반환함.
   * - 예시: `ImageLightbox(...)` 호출 시 런타임 비동기/동기 연쇄 반응 유도.
   */
export function ImageLightbox({ url, alt, onClose }: ImageLightboxProps) {
  const [scale, setScale] = useState(1)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `dragStart`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const dragStart = ...` 형태로 안전 캐싱 후 가공 기동.
       */
  const dragStart = useRef({ x: 0, y: 0 })
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `imgRef`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const imgRef = ...` 형태로 안전 캐싱 후 가공 기동.
       */
  const imgRef = useRef<HTMLImageElement | null>(null)

  // ESC 키로 닫기
  useEffect(() => {
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `handleKeyDown`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const handleKeyDown = ...` 형태로 안전 캐싱 후 가공 기동.
       */
    const handleKeyDown = (e: KeyboardEvent) => {
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `e.key === 'Escape') onClose(`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (e.key === 'Escape') onClose()` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  // 휠 스크롤로 무손실 줌 인/아웃
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault()
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `zoomFactor`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const zoomFactor = ...` 형태로 안전 캐싱 후 가공 기동.
       */
    const zoomFactor = 0.1
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `newScale`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const newScale = ...` 형태로 안전 캐싱 후 가공 기동.
       */
    let newScale = scale + (e.deltaY < 0 ? zoomFactor : -zoomFactor)
    // 최소 0.5배, 최대 5배 제한
    newScale = Math.max(0.5, Math.min(5, newScale))
    setScale(newScale)
  }

  // 드래그 이동 시작
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    setIsDragging(true)
    dragStart.current = { x: e.clientX - position.x, y: e.clientY - position.y }
  }

  // 드래그 이동 중
  const handleMouseMove = (e: React.MouseEvent) => {
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `!isDragging`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (!isDragging)` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
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

      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `resetZoom`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const resetZoom = ...` 형태로 안전 캐싱 후 가공 기동.
       */
  const resetZoom = () => {
    setScale(1)
    setPosition({ x: 0, y: 0 })
  }

  return (
    <div
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
      onWheel={handleWheel}
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
            pointerEvents: 'none', // 브라우저 기본 이미지 드래그 차단
            boxShadow: '0 20px 50px rgba(0, 0, 0, 0.5)',
          }}
        />
      </div>
    </div>
  )
}

