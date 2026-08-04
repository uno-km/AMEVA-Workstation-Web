/**
 * @file FreeModal.tsx
 * @system AMEVA OS Desktop Workstation
 * @location src/renderer/components/ui/modals/FreeModal.tsx
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

import { BaseModal } from './BaseModal'
import type { BaseModalProps } from './BaseModal'
import { useDraggable } from '../../../hooks/app/useDraggable'
import { useModalResize } from '../../../hooks/app/useModalResize'
import { useUIStore } from '../../../stores/useUIStore'
import { useState, useEffect, useRef } from 'react'

export interface FreeModalProps extends BaseModalProps {
  initialX?: number
  initialY?: number
  initialWidth?: number
  initialHeight?: number
  hasBackdrop?: boolean
  closeOnBackdropClick?: boolean
}

  /*
   * [FUNCTION CONTRACT]
   * - 함수 명: `FreeModal`
   * - 역할: 인자 정보를 검수하고 비즈니스 계약 조건에 맞춰 최종 바인딩 결과물/바이너리 버퍼를 반환함.
   * - 예시: `FreeModal(...)` 호출 시 런타임 비동기/동기 연쇄 반응 유도.
   */
export function FreeModal(props: FreeModalProps) {
  const { isOpen, initialX = 100, initialY = 100, initialWidth = 820, initialHeight = 580, hasBackdrop, closeOnBackdropClick = true, ...rest } = props
  
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `bringToFront`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const bringToFront = ...` 형태로 안전 캐싱 후 가공 기동.
       */
  const bringToFront = useUIStore(s => s.bringToFront)
  const [zIndex, setZIndex] = useState(10000)
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `isInitialized`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const isInitialized = ...` 형태로 안전 캐싱 후 가공 기동.
       */
  const isInitialized = useRef(false)

  // 컴포넌트가 마운트될 때, 또는 열릴 때 한 번 z-index를 최상단으로 올립니다.
  useEffect(() => {
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `isOpen && !isInitialized.current`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (isOpen && !isInitialized.current)` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
    if (isOpen && !isInitialized.current) {
      setZIndex(bringToFront())
      isInitialized.current = true
    } else if (!isOpen) {
      isInitialized.current = false
    }
  }, [isOpen, bringToFront])
  
  const { pos, setPos, handleMouseDown } = useDraggable({ x: initialX, y: initialY })
  const { modalSize, handleResizeMouseDown } = useModalResize(initialWidth, initialHeight)

  /*
   * [SIDE EFFECT]
   * - 모달이 활성화(isOpen === true)되는 시점에 화면(window) 해상도 대비 모달 크기를 연산하여 항상 정중앙에 배치합니다.
   */
  useEffect(() => {
    if (isOpen) {
      const centerX = Math.max(0, (window.innerWidth - modalSize.width) / 2)
      const centerY = Math.max(0, (window.innerHeight - modalSize.height) / 2)
      setPos({ x: centerX, y: centerY })
    }
  }, [isOpen, modalSize.width, modalSize.height, setPos])

      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `handleModalFocus`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const handleModalFocus = ...` 형태로 안전 캐싱 후 가공 기동.
       */
  const handleModalFocus = () => {
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `currentBase`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const currentBase = ...` 형태로 안전 캐싱 후 가공 기동.
       */
    const currentBase = useUIStore.getState().baseZIndex
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `zIndex < currentBase`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (zIndex < currentBase)` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
    if (zIndex < currentBase) {
      setZIndex(bringToFront())
    }
  }

      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `!isOpen`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (!isOpen)` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
  if (!isOpen) return null

  return (
    <>
      {/* 선택적 백드롭 오버레이 */}
      {hasBackdrop && (
        <div
          onClick={closeOnBackdropClick ? rest.onClose : undefined}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: zIndex - 1,
            backgroundColor: 'var(--bg-deep)',
            opacity: 0.5,
            backdropFilter: 'blur(4px)',
            pointerEvents: 'auto'
          }}
        />
      )}
      
      {/* 플로팅 모달 본체 */}
      <div
        onMouseDownCapture={handleModalFocus}
        style={{
          position: 'fixed',
        left: `${pos.x}px`,
        top: `${pos.y}px`,
        width: `${modalSize.width}px`,
        height: `${modalSize.height}px`,
        zIndex,
        pointerEvents: 'auto',
      }}
    >
      <BaseModal
        {...rest}
        isOpen={true} // Wrapper handles the null return
        width="100%"
        height="100%"
        onMouseDown={handleMouseDown}
      />
      
      {/* 리사이즈 핸들 */}
      {/* 동쪽 (우측) 핸들 */}
      <div
        onMouseDown={(e) => handleResizeMouseDown('e', e)}
        style={{
          position: 'absolute', right: 0, top: 0, width: '6px', height: '100%',
          cursor: 'ew-resize', zIndex: 100
        }}
      />
      {/* 남쪽 (하단) 핸들 */}
      <div
        onMouseDown={(e) => handleResizeMouseDown('s', e)}
        style={{
          position: 'absolute', left: 0, bottom: 0, width: '100%', height: '6px',
          cursor: 'ns-resize', zIndex: 100
        }}
      />
      {/* 남동쪽 (우하단) 모서리 핸들 */}
      <div
        onMouseDown={(e) => handleResizeMouseDown('se', e)}
        style={{
          position: 'absolute', right: 0, bottom: 0, width: '12px', height: '12px',
          cursor: 'nwse-resize', zIndex: 101,
          background: 'linear-gradient(135deg, transparent 40%, var(--primary) 60%)',
          opacity: 0.7,
          borderRadius: '0 0 12px 0'
        }}
      />
    </div>
    </>
  )
}

