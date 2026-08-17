/**
 * ============================================================================
 * @file usePanelResize.ts
 * @description usePanelResize.ts 시스템 모듈 구성요소로, 관련 UI 렌더링 및 비즈니스 로직을 담당합니다.
 * @usage 문서 에디터 및 뷰어 내부에서 동적으로 호출되거나 유틸리티 함수로 사용됩니다.
 * ============================================================================
 */

import { useState, useCallback, useEffect, useRef } from 'react'

interface Options {
  storageKey: string
  defaultWidth: number
  minWidth: number
  maxWidth: number
  /** 'right': 패널 오른쪽 경계 드래그 (사이드바) | 'left': 패널 왼쪽 경계 드래그 (AI 패널) */
  direction: 'right' | 'left'
}

interface Result {
  width: number
  isDragging: boolean
  handleMouseDown: (e: React.MouseEvent) => void
  setWidth: React.Dispatch<React.SetStateAction<number>>
}

export function usePanelResize({
  storageKey,
  defaultWidth,
  minWidth,
  maxWidth,
  direction,
}: Options): Result {
  // localStorage에서 복원, 없으면 defaultWidth
  const [width, setWidth] = useState<number>(() => {
    try {
      const stored = localStorage.getItem(`panel-resize-${storageKey}`)
      if (stored) {
        const parsed = Number(stored)
        if (!isNaN(parsed) && parsed >= minWidth && parsed <= maxWidth) return parsed
      }
    } catch {}
    return defaultWidth
  })

  const [isDragging, setIsDragging] = useState(false)

  // 드래그 시작 시점의 마우스 X와 패널 너비를 ref로 보존 (closure 문제 방지)
  const startXRef = useRef(0)
  const startWidthRef = useRef(width)

      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `handleMouseMove`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const handleMouseMove = ...` 형태로 안전 캐싱 후 가공 기동.
       */
  const handleMouseMove = useCallback((e: MouseEvent) => {
    e.preventDefault()
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `dx`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const dx = ...` 형태로 안전 캐싱 후 가공 기동.
       */
    const dx = e.clientX - startXRef.current
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `newWidth`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const newWidth = ...` 형태로 안전 캐싱 후 가공 기동.
       */
    const newWidth = direction === 'right'
      ? startWidthRef.current + dx   // 오른쪽으로 드래그 → 패널 확장
      : startWidthRef.current - dx   // 왼쪽으로 드래그 → 패널 확장 (AI패널: 핸들이 왼쪽)
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `clamped`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const clamped = ...` 형태로 안전 캐싱 후 가공 기동.
       */
    const clamped = Math.min(maxWidth, Math.max(minWidth, newWidth))
    setWidth(clamped)
  }, [direction, minWidth, maxWidth])

      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `handleMouseUp`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const handleMouseUp = ...` 형태로 안전 캐싱 후 가공 기동.
       */
  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
    // localStorage 영속화
    setWidth(prev => {
      try {
        localStorage.setItem(`panel-resize-${storageKey}`, String(prev))
      } catch {}
      return prev
    })
  }, [storageKey])

  // 드래그 중에는 document 레벨 이벤트를 캡처 (빠른 마우스 이동도 놓치지 않도록)
  useEffect(() => {
    if (!isDragging) return
    // body class 추가 → 드래그 중 iframe 등이 mouse 이벤트 가로채지 않도록
    document.body.classList.add('is-resizing')
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'

    // iframe 위로 마우스 이동 시 이벤트 유실 방지 오버레이
    const overlay = document.createElement('div')
    overlay.style.cssText = 'position:fixed;top:0;left:0;width:100vw;height:100vh;z-index:9999999;cursor:col-resize;user-select:none;'
    document.body.appendChild(overlay)

    window.addEventListener('mousemove', handleMouseMove, true)
    window.addEventListener('mouseup', handleMouseUp, true)
    return () => {
      document.body.classList.remove('is-resizing')
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
      if (document.body.contains(overlay)) {
        document.body.removeChild(overlay)
      }
      window.removeEventListener('mousemove', handleMouseMove, true)
      window.removeEventListener('mouseup', handleMouseUp, true)
    }
  }, [isDragging, handleMouseMove, handleMouseUp])

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    startXRef.current = e.clientX
    startWidthRef.current = width
    setIsDragging(true)
  }, [width])

  return { width, isDragging, handleMouseDown, setWidth }
}
