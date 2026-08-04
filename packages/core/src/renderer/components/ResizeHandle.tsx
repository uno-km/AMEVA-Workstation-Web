/**
 * @file ResizeHandle.tsx
 * @system AMEVA OS Desktop Workstation
 * @location src/renderer/components/ResizeHandle.tsx
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

/**
 * ResizeHandle.tsx
 * ─────────────────────────────────────────────────────────────
 * 패널 경계에 배치하는 드래그 가능한 리사이즈 핸들 컴포넌트
 *
 * Props:
 *   onMouseDown   — usePanelResize에서 반환한 handleMouseDown
 *   isDragging    — 드래그 중 여부 (강조 표시)
 *   placement     — 'right' | 'left' (핸들 위치)
 *
 * UX:
 *   - 평소: 2px 투명 영역 + col-resize 커서
 *   - hover: 보라/청록 그라디언트 라인 노출 (0.3s fade)
 *   - drag 중: 항상 활성 상태 유지
 * ─────────────────────────────────────────────────────────────
 */
import React, { useState } from 'react'

interface ResizeHandleProps {
  onMouseDown: (e: React.MouseEvent) => void
  isDragging: boolean
  placement?: 'right' | 'left'
  /** 높이 기본값은 100% */
  height?: string
  onDoubleClick?: (e: React.MouseEvent) => void
}

  /*
   * [FUNCTION CONTRACT]
   * - 함수 명: `ResizeHandle`
   * - 역할: 인자 정보를 검수하고 비즈니스 계약 조건에 맞춰 최종 바인딩 결과물/바이너리 버퍼를 반환함.
   * - 예시: `ResizeHandle(...)` 호출 시 런타임 비동기/동기 연쇄 반응 유도.
   */
export function ResizeHandle({
  onMouseDown,
  isDragging,
  placement = 'right',
  height = '100%',
  onDoubleClick,
}: ResizeHandleProps) {
  const [isHovered, setIsHovered] = useState(false)
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `isActive`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const isActive = ...` 형태로 안전 캐싱 후 가공 기동.
       */
  const isActive = isDragging || isHovered

  return (
    <div
      onMouseDown={(e) => {
        e.stopPropagation()
        onMouseDown(e)
      }}
      onDoubleClick={(e) => {
        e.stopPropagation()
        if (onDoubleClick) onDoubleClick(e)
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        // 패널 경계에 절대 위치로 붙임
        position: 'absolute',
        top: 0,
        [placement === 'right' ? 'right' : 'left']: 0,
        width: '8px',       // 클릭 가능 영역 8px
        height,
        zIndex: 200,
        cursor: 'col-resize',
        // 드래그 핸들 본체 — 투명 배경 + hover/drag 시 라인 노출
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        // 드래그 중에는 위치가 고정이어야 하므로 pointer-events: all
        userSelect: 'none',
        flexShrink: 0,
      }}
    >
      {/* 시각적 인디케이터 라인 (3px) */}
      <div
        style={{
          width: '3px',
          height: isActive ? '100%' : '40%',
          borderRadius: '2px',
          background: isActive
            ? 'linear-gradient(180deg, var(--primary) 0%, var(--secondary) 100%)'
            : 'transparent',
          boxShadow: isActive ? `0 0 8px var(--primary-glow)` : 'none',
          transition: 'height 0.25s ease, background 0.2s ease, box-shadow 0.2s ease',
          pointerEvents: 'none',
        }}
      />
      {/* hover 시 dot 인디케이터 */}
      {isActive && (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '6px',
            height: '24px',
            borderRadius: '3px',
            background: 'var(--primary)',
            opacity: 0.9,
            pointerEvents: 'none',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '3px',
          }}
        >
          {/* grip dots */}
          {[0, 1, 2].map(i => (
            <div
              key={i}
              style={{
                width: '2px',
                height: '2px',
                borderRadius: '50%',
                background: '#fff',
                opacity: 0.8,
              }}
            />
          ))}
        </div>
      )}
    </div>
  )
}

