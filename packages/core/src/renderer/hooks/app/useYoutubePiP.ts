/**
 * @file useYoutubePiP.ts
 * @system AMEVA OS Desktop Workstation
 * @location src/renderer/hooks/app/useYoutubePiP.ts
 * @role Core module helper and integration logic
 * 
 * [소비처 - CONSUMERS / USAGE CONTEXT]
 * - 소비처 A (src/renderer/App.tsx): 최상위 Facade 구조에 통합 마운트.
 * - 소비처 B (src/renderer/contexts/AppContext.tsx): 리액트 Context 훅 목록에 바인딩되어 하위 뷰에 전파.
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
 * useYoutubePiP.ts
 *
 * YouTube Picture-in-Picture (PiP) 플로팅 창 제어 전담 훅.
 * App.tsx에 산재해 있던 YouTube PiP 드래그/위치 상태와 이벤트 핸들러를 격리한다.
 *
 * [포함 로직]
 * - PiP 비디오 ID 상태
 * - 플로팅 위치 상태 및 드래그 핸들러
 * - 전역 AMEVA_TRIGGER_YOUTUBE_PIP API 바인딩
 */

import { useState, useEffect } from 'react'

/** PiP 드래그 핸들러 파라미터 */
export interface PiPMouseDownParams {
  e: React.MouseEvent
  pipPosition: { x: number; y: number }
  setIsDraggingPip: (val: boolean) => void
  setDragOffset: (val: { x: number; y: number }) => void
}

/**
 * useYoutubePiP
 * YouTube PiP 상태 및 드래그 이벤트를 관리한다.
 *
 * @returns PiP 상태 및 핸들러 집합
 */
export function useYoutubePiP() {
  const [pipVideoId, setPipVideoId] = useState<string | null>(null)
  const [pipPosition, setPipPosition] = useState({
    x: Math.max(0, window.innerWidth - 380),
    y: Math.max(0, window.innerHeight - 260)
  })
  const [isDraggingPip, setIsDraggingPip] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })

  // 전역 PiP 트리거 API 바인딩
  useEffect(() => {
    (window as any).AMEVA_TRIGGER_YOUTUBE_PIP = (videoId: string) => {
      setPipVideoId(videoId)
    }
    return () => {
      delete (window as any).AMEVA_TRIGGER_YOUTUBE_PIP
    }
  }, [])

  // 드래그 mousemove / mouseup 이벤트 처리
  useEffect(() => {
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `handleMouseMove`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const handleMouseMove = ...` 형태로 안전 캐싱 후 가공 기동.
       */
    const handleMouseMove = (e: MouseEvent) => {
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `!isDraggingPip`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (!isDraggingPip)` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
      if (!isDraggingPip) return
      setPipPosition({
        x: Math.max(10, Math.min(window.innerWidth - 360, e.clientX - dragOffset.x)),
        y: Math.max(10, Math.min(window.innerHeight - 240, e.clientY - dragOffset.y))
      })
    }

      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `handleMouseUp`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const handleMouseUp = ...` 형태로 안전 캐싱 후 가공 기동.
       */
    const handleMouseUp = () => {
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `isDraggingPip) setIsDraggingPip(false`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (isDraggingPip) setIsDraggingPip(false)` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
      if (isDraggingPip) setIsDraggingPip(false)
    }

      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `isDraggingPip`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (isDraggingPip)` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
    if (isDraggingPip) {
      window.addEventListener('mousemove', handleMouseMove)
      window.addEventListener('mouseup', handleMouseUp)
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDraggingPip, dragOffset])

  /**
   * handlePiPMouseDown
   * PiP 드래그 시작 이벤트 핸들러.
   */
  const handlePiPMouseDown = (e: React.MouseEvent) => {
    setIsDraggingPip(true)
    setDragOffset({
      x: e.clientX - pipPosition.x,
      y: e.clientY - pipPosition.y
    })
  }

  return {
    pipVideoId,
    setPipVideoId,
    pipPosition,
    isDraggingPip,
    handlePiPMouseDown
  }
}

