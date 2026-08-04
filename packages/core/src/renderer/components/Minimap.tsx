/**
 * @file Minimap.tsx
 * @system AMEVA OS Desktop Workstation
 * @location src/renderer/components/Minimap.tsx
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

import React, { useState, useEffect, useRef } from 'react'

interface MinimapProps {
  editor: any
  editorContainerRef: React.RefObject<HTMLDivElement | null>
  blocks: any[]
}

  /*
   * [FUNCTION CONTRACT]
   * - 함수 명: `Minimap`
   * - 역할: 인자 정보를 검수하고 비즈니스 계약 조건에 맞춰 최종 바인딩 결과물/바이너리 버퍼를 반환함.
   * - 예시: `Minimap(...)` 호출 시 런타임 비동기/동기 연쇄 반응 유도.
   */
export function Minimap({ editor, editorContainerRef, blocks }: MinimapProps) {
  console.debug("Unused vars (Minimap):", { editor });
  const [scrollState, setScrollState] = useState({
    scrollTop: 0,
    scrollHeight: 1,
    clientHeight: 1,
  })
  
  const [isHovered, setIsHovered] = useState(false)
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `minimapRef`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const minimapRef = ...` 형태로 안전 캐싱 후 가공 기동.
       */
  const minimapRef = useRef<HTMLDivElement>(null)
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `isDragging`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const isDragging = ...` 형태로 안전 캐싱 후 가공 기동.
       */
  const isDragging = useRef(false)
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `dragStartY`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const dragStartY = ...` 형태로 안전 캐싱 후 가공 기동.
       */
  const dragStartY = useRef(0)
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `dragStartScrollTop`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const dragStartScrollTop = ...` 형태로 안전 캐싱 후 가공 기동.
       */
  const dragStartScrollTop = useRef(0)

  // 에디터 스크롤 컨테이너 가져오기
  const getScrollContainer = (): HTMLElement | null => {
    return editorContainerRef?.current || null
  }

  // 스크롤 및 크기 동기화
  // 스크롤 및 크기 동기화 (Ref 마운트 지연 대응 자가 폴링 감지 구조)
  useEffect(() => {
    let container: HTMLElement | null = null
    let observer: MutationObserver | null = null

      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `handleScroll`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const handleScroll = ...` 형태로 안전 캐싱 후 가공 기동.
       */
    const handleScroll = () => {
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `!container`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (!container)` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
      if (!container) return

      const nextScrollTop = container.scrollTop
      const nextScrollHeight = container.scrollHeight
      const nextClientHeight = container.clientHeight

      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `prev.scrollTop === nextScrollTop && prev.scrollHeight === nextScrollHeight && prev.clientHeight === nextClientHeight`
       * - 만족 시: 스크롤 위치 및 레이아웃 크기가 이전과 완전히 동일하므로 상태 갱신을 생략하여 무한 렌더링 루프를 방지함.
       * - 불만족 시: 변경된 뷰포트 스크롤 상태를 동기화하여 미니맵 하이라이터 위치를 최신화함.
       * - 예시: `if (prev.scrollTop === nextScrollTop ...)` 만족 시 React 렌더링 바이패스.
       */
      setScrollState((prev) => {
        if (
          prev.scrollTop === nextScrollTop &&
          prev.scrollHeight === nextScrollHeight &&
          prev.clientHeight === nextClientHeight
        ) {
          return prev
        }
        return {
          scrollTop: nextScrollTop,
          scrollHeight: nextScrollHeight,
          clientHeight: nextClientHeight,
        }
      })
    }

      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `attachListener`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const attachListener = ...` 형태로 안전 캐싱 후 가공 기동.
       */
    let interval: ReturnType<typeof setInterval> | null = null

    const attachListener = () => {
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `activeContainer`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const activeContainer = ...` 형태로 안전 캐싱 후 가공 기동.
       */
      const activeContainer = getScrollContainer()
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `activeContainer && activeContainer !== container`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (activeContainer && activeContainer !== container)` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
      if (activeContainer && activeContainer !== container) {
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `container`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (container)` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
        if (container) {
          container.removeEventListener('scroll', handleScroll)
        }
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `observer`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (observer)` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
        if (observer) {
          observer.disconnect()
        }

        container = activeContainer
        container.addEventListener('scroll', handleScroll)

        observer = new MutationObserver(handleScroll)
        observer.observe(container, { childList: true, subtree: true, characterData: true })

        handleScroll()
        if (interval) {
          clearInterval(interval)
          interval = null
        }
      }
    }

    attachListener()

    // Ref 마운트 지연 대응을 위해 200ms 마다 폴링 확인 (연결 시 자동 해제됨)
    interval = setInterval(attachListener, 200)

    return () => {
      if (interval) clearInterval(interval)
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `container`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (container)` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
      if (container) {
        container.removeEventListener('scroll', handleScroll)
      }
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `observer`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (observer)` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
      if (observer) {
        observer.disconnect()
      }
    }
  }, [editorContainerRef, blocks])

  const { scrollTop, scrollHeight, clientHeight } = scrollState
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `viewportTopPercent`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const viewportTopPercent = ...` 형태로 안전 캐싱 후 가공 기동.
       */
  const viewportTopPercent = (scrollTop / scrollHeight) * 100
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `viewHeightPercent`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const viewHeightPercent = ...` 형태로 안전 캐싱 후 가공 기동.
       */
  const viewHeightPercent = (clientHeight / scrollHeight) * 100

  const dragListenersRef = useRef<{ move: ((e: MouseEvent) => void) | null, up: (() => void) | null }>({ move: null, up: null })

  const handleDragEnd = () => {
    isDragging.current = false
    if (dragListenersRef.current.move) document.removeEventListener('mousemove', dragListenersRef.current.move)
    if (dragListenersRef.current.up) document.removeEventListener('mouseup', dragListenersRef.current.up)
    dragListenersRef.current.move = null
    dragListenersRef.current.up = null
  }

  // 클릭 및 드래그 스크롤 통합 제어
  const handleMapMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `container`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const container = ...` 형태로 안전 캐싱 후 가공 기동.
       */
    const container = getScrollContainer()
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `!container || !minimapRef.current`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (!container || !minimapRef.current)` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
    if (!container || !minimapRef.current) return

      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `rect`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const rect = ...` 형태로 안전 캐싱 후 가공 기동.
       */
    const rect = minimapRef.current.getBoundingClientRect()
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `clickY`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const clickY = ...` 형태로 안전 캐싱 후 가공 기동.
       */
    const clickY = e.clientY - rect.top
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `clickRatio`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const clickRatio = ...` 형태로 안전 캐싱 후 가공 기동.
       */
    const clickRatio = clickY / rect.height
    
    // 클릭 위치로 실시간 즉각 점프
    container.scrollTop = clickRatio * container.scrollHeight - container.clientHeight / 2

    isDragging.current = true
    dragStartY.current = e.clientY
    dragStartScrollTop.current = container.scrollTop

    dragListenersRef.current.move = handleDragMove
    dragListenersRef.current.up = handleDragEnd
    document.addEventListener('mousemove', handleDragMove)
    document.addEventListener('mouseup', handleDragEnd)
  }

  useEffect(() => {
    return () => {
      if (dragListenersRef.current.move) document.removeEventListener('mousemove', dragListenersRef.current.move)
      if (dragListenersRef.current.up) document.removeEventListener('mouseup', dragListenersRef.current.up)
    }
  }, [])

      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `handleDragMove`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const handleDragMove = ...` 형태로 안전 캐싱 후 가공 기동.
       */
  const handleDragMove = (e: MouseEvent) => {
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `!isDragging.current || !minimapRef.current`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (!isDragging.current || !minimapRef.current)` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
    if (!isDragging.current || !minimapRef.current) return
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `container`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const container = ...` 형태로 안전 캐싱 후 가공 기 기동.
       */
    const container = getScrollContainer()
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `!container`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (!container)` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
    if (!container) return

      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `rect`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const rect = ...` 형태로 안전 캐싱 후 가공 기동.
       */
    const rect = minimapRef.current.getBoundingClientRect()
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `currentY`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const currentY = ...` 형태로 안전 캐싱 후 가공 기동.
       */
    const currentY = Math.max(0, Math.min(rect.height, e.clientY - rect.top))
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `ratio`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const ratio = ...` 형태로 안전 캐싱 후 가공 기동.
       */
    const ratio = currentY / rect.height

    // 마우스가 누르고 있는 위치를 에디터의 중심점으로 부드럽게 흡수
    container.scrollTop = ratio * container.scrollHeight - container.clientHeight / 2
  }

  // 에디터의 블록 구조를 긁어 텍스트 라인 리스트로 전환
  const extractTextLines = (): { text: string; type: string; level?: number }[] => {
    const lines: { text: string; type: string; level?: number }[] = []
    
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `traverse`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const traverse = ...` 형태로 안전 캐싱 후 가공 기동.
       */
    const traverse = (items: any[]) => {
      /*
       * [LOOP CONTROL ITERATION]
       * - 루프 조건: `for (const item of items) {`
       * - 예상 시나리오: 지정된 조건 한계 도달 시점까지 콜렉션 항목의 순차 매핑, 변환 및 동기 적재 처리를 수행함.
       * - 예시: `for (const item of list)` 루프 실행 시 모든 개별 블록의 html 포맷 정제 완료 후 스택 종결.
       */
      for (const item of items) {
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `item.type === 'heading'`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (item.type === 'heading')` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
        if (item.type === 'heading') {
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `text`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const text = ...` 형태로 안전 캐싱 후 가공 기동.
       */
          const text = item.content?.map((c: any) => c.text).join('') || 'Heading'
          lines.push({ text: '#'.repeat(item.props?.level || 1) + ' ' + text, type: 'heading', level: item.props?.level })
        } else if (item.type === 'codeBlock' || item.type === 'jupyter') {
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `codeText`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const codeText = ...` 형태로 안전 캐싱 후 가공 기동.
       */
          const codeText = item.props?.code || ''
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `splitLines`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const splitLines = ...` 형태로 안전 캐싱 후 가공 기동.
       */
          const splitLines = codeText.split('\n')
          splitLines.forEach((l: string) => {
            lines.push({ text: l || ' ', type: 'code' })
          })
        } else if (item.type === 'paragraph') {
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `text`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const text = ...` 형태로 안전 캐싱 후 가공 기동.
       */
          const text = item.content?.map((c: any) => c.text).join('') || ''
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `splitLines`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const splitLines = ...` 형태로 안전 캐싱 후 가공 기동.
       */
          const splitLines = text.split('\n')
          splitLines.forEach((l: string) => {
            lines.push({ text: l || ' ', type: 'text' })
          })
        } else if (item.type === 'image' || item.type === 'video') {
          lines.push({ text: `[Media: ${item.props?.url || 'file'}]`, type: 'media' })
        } else if (item.type === 'table') {
          lines.push({ text: '| Table content |', type: 'table' })
        }
        
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `item.children && item.children.length > 0`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (item.children && item.children.length > 0)` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
        if (item.children && item.children.length > 0) {
          traverse(item.children)
        }
      }
    }
    
    traverse(blocks)
    return lines
  }

      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `lines`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const lines = ...` 형태로 안전 캐싱 후 가공 기동.
       */
  const lines = extractTextLines()

  return (
    <div
      ref={minimapRef}
      onMouseDown={handleMapMouseDown}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        position: 'absolute',
        top: '16px',
        right: '16px',
        width: '64px', // 64px의 넉넉한 가로 폭
        height: 'calc(100% - 32px)',
        maxHeight: '460px',
        background: isHovered || isDragging.current ? 'rgba(20, 20, 25, 0.45)' : 'transparent',
        backdropFilter: isHovered || isDragging.current ? 'blur(10px)' : 'none',
        borderLeft: isHovered || isDragging.current ? '1px solid rgba(255, 255, 255, 0.05)' : '1px solid transparent',
        borderRadius: '6px',
        padding: '8px 2px',
        overflow: 'hidden',
        cursor: 'pointer',
        zIndex: 99,
        userSelect: 'none',
        transition: 'background 0.25s ease, border-color 0.25s ease',
      }}
    >
      {/* 10배 축소시킨 텍스트 미니어처 컨테이너 */}
      <div
        style={{
          width: '640px', // scale 0.1 대비 10배로 설정해 우측 삐져나감 방지
          transform: 'scale(0.1)',
          transformOrigin: 'top left',
          display: 'flex',
          flexDirection: 'column',
          lineHeight: '1.3',
          fontFamily: 'var(--font-mono)',
          fontSize: '11px',
          opacity: isHovered ? 0.95 : 0.6,
          transition: 'opacity 0.2s',
          pointerEvents: 'none',
        }}
      >
        {lines.length === 0 ? (
          <div style={{ color: 'rgba(255,255,255,0.2)' }}>AMEVA Document Minimap...</div>
        ) : (
          lines.map((line, idx) => {
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `color`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const color = ...` 형태로 안전 캐싱 후 가공 기동.
       */
            let color = 'rgba(255, 255, 255, 0.25)' // 일반 텍스트: 차분한 그레이
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `fontWeight`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const fontWeight = ...` 형태로 안전 캐싱 후 가공 기동.
       */
            let fontWeight = 'normal'
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `fontStyle`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const fontStyle = ...` 형태로 안전 캐싱 후 가공 기동.
       */
            let fontStyle = 'normal'

      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `line.type === 'heading'`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (line.type === 'heading')` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
            if (line.type === 'heading') {
              color = '#f8fafc' // 헤더: 밝은 화이트
              fontWeight = 'bold'
            } else if (line.type === 'code') {
              color = 'var(--primary)' // 코드: 에디터 포인트 컬러 (실버 그레이)
            } else if (line.type === 'media') {
              color = 'rgba(249, 115, 22, 0.5)' // 미디어: 소프트 오렌지
              fontStyle = 'italic'
            } else if (line.type === 'table') {
              color = 'rgba(6, 182, 212, 0.5)' // 테이블: 소프트 시안
            }

            return (
              <div
                key={idx}
                style={{
                  color,
                  fontWeight,
                  fontStyle,
                  whiteSpace: 'pre',
                  textOverflow: 'ellipsis',
                  overflow: 'hidden',
                }}
              >
                {line.text}
              </div>
            )
          })
        )}
      </div>

      {/* 뷰포트 하이라이터 */}
      <div
        onMouseDown={handleMapMouseDown}
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: `${Math.min(90, Math.max(0, viewportTopPercent))}%`,
          height: `${Math.min(100, Math.max(12, viewHeightPercent))}%`,
          background: isHovered || isDragging.current ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.02)',
          borderLeft: '2px solid rgba(255, 255, 255, 0.35)',
          cursor: 'ns-resize',
          transition: isDragging.current ? 'none' : 'top 0.15s ease, height 0.15s ease',
        }}
      />
    </div>
  )
}

