/**
 * @file FloatingChat.tsx
 * @system AMEVA OS Desktop Workstation
 * @location src/renderer/components/FloatingChat.tsx
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
import { ChatPanel } from './ChatPanel'
import { MessageCircle, Minimize2, Pin } from 'lucide-react'
import type { ChatMessage } from '../hooks/useChat'

import { useAppContext } from '../contexts/AppContext'
import { useUIStore } from '../stores/useUIStore'

export interface FloatingChatProps {}

  /*
   * [FUNCTION CONTRACT]
   * - 함수 명: `FloatingChat`
   * - 역할: 인자 정보를 검수하고 비즈니스 계약 조건에 맞춰 최종 바인딩 결과물/바이너리 버퍼를 반환함.
   * - 예시: `FloatingChat(...)` 호출 시 런타임 비동기/동기 연쇄 반응 유도.
   */
export function FloatingChat({}: FloatingChatProps = {}) {
  const { chatMessages: messages, sendChatMessage: onSend, clearChatMessages: onClear, username, userColor, serverRunning } = useAppContext()
  const { hasChatUnread: hasUnread, setHasChatUnread, setIsChatFloating } = useUIStore()
  
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `onDockBack`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const onDockBack = ...` 형태로 안전 캐싱 후 가공 기동.
       */
  const onDockBack = () => setIsChatFloating(false)
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `onClearUnread`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const onClearUnread = ...` 형태로 안전 캐싱 후 가공 기동.
       */
  const onClearUnread = () => setHasChatUnread(false)
  // 위치 및 크기 상태
  const [pos, setPos] = useState({ x: window.innerWidth - 340, y: window.innerHeight - 520 })
  const [size, setSize] = useState({ width: 310, height: 460 })
  const [isMinimized, setIsMinimized] = useState(false)

      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `dragStartRef`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const dragStartRef = ...` 형태로 안전 캐싱 후 가공 기동.
       */
  const dragStartRef = useRef<{ mouseX: number; mouseY: number; posX: number; posY: number } | null>(null)
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `resizeStartRef`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const resizeStartRef = ...` 형태로 안전 캐싱 후 가공 기동.
       */
  const resizeStartRef = useRef<{ mouseX: number; mouseY: number; width: number; height: number } | null>(null)

  const listenersRef = useRef<{
    dragMove: ((e: MouseEvent) => void) | null
    dragUp: (() => void) | null
    resizeMove: ((e: MouseEvent) => void) | null
    resizeUp: (() => void) | null
  }>({ dragMove: null, dragUp: null, resizeMove: null, resizeUp: null })

  useEffect(() => {
    return () => {
      if (listenersRef.current.dragMove) document.removeEventListener('mousemove', listenersRef.current.dragMove)
      if (listenersRef.current.dragUp) document.removeEventListener('mouseup', listenersRef.current.dragUp)
      if (listenersRef.current.resizeMove) document.removeEventListener('mousemove', listenersRef.current.resizeMove)
      if (listenersRef.current.resizeUp) document.removeEventListener('mouseup', listenersRef.current.resizeUp)
    }
  }, [])

  // 안읽은 메시지 청소 (창 활성화/클릭 시)
  useEffect(() => {
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `!isMinimized && hasUnread`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (!isMinimized && hasUnread)` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
    if (!isMinimized && hasUnread) {
      onClearUnread()
    }
  }, [messages, isMinimized, hasUnread, onClearUnread])

  // 창 크기 이탈 방지
  useEffect(() => {
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `handleResize`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const handleResize = ...` 형태로 안전 캐싱 후 가공 기동.
       */
    const handleResize = () => {
      setPos(prev => ({
        x: Math.min(window.innerWidth - (isMinimized ? 60 : size.width), Math.max(0, prev.x)),
        y: Math.min(window.innerHeight - (isMinimized ? 60 : size.height), Math.max(0, prev.y))
      }))
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [size, isMinimized])

  // ── 드래그 이동 로직 (스냅 기능 포함) ──
  const handleDragMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    dragStartRef.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      posX: pos.x,
      posY: pos.y,
    }
    listenersRef.current.dragMove = handleDragMouseMove
    listenersRef.current.dragUp = handleDragMouseUp
    document.addEventListener('mousemove', handleDragMouseMove)
    document.addEventListener('mouseup', handleDragMouseUp)
  }

      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `handleDragMouseMove`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const handleDragMouseMove = ...` 형태로 안전 캐싱 후 가공 기동.
       */
  const handleDragMouseMove = (e: MouseEvent) => {
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `!dragStartRef.current`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (!dragStartRef.current)` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
    if (!dragStartRef.current) return
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `dx`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const dx = ...` 형태로 안전 캐싱 후 가공 기동.
       */
    const dx = e.clientX - dragStartRef.current.mouseX
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `dy`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const dy = ...` 형태로 안전 캐싱 후 가공 기동.
       */
    const dy = e.clientY - dragStartRef.current.mouseY
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `newX`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const newX = ...` 형태로 안전 캐싱 후 가공 기동.
       */
    let newX = dragStartRef.current.posX + dx
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `newY`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const newY = ...` 형태로 안전 캐싱 후 가공 기동.
       */
    let newY = dragStartRef.current.posY + dy

    // 화면 경계 이탈 방지 (실시간)
    const W = window.innerWidth
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `H`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const H = ...` 형태로 안전 캐싱 후 가공 기동.
       */
    const H = window.innerHeight
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `currentWidth`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const currentWidth = ...` 형태로 안전 캐싱 후 가공 기동.
       */
    const currentWidth = isMinimized ? 52 : size.width
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `currentHeight`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const currentHeight = ...` 형태로 안전 캐싱 후 가공 기동.
       */
    const currentHeight = isMinimized ? 52 : size.height

    newX = Math.max(0, Math.min(W - currentWidth, newX))
    newY = Math.max(0, Math.min(H - currentHeight, newY))

    setPos({ x: newX, y: newY })
  }

      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `handleDragMouseUp`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const handleDragMouseUp = ...` 형태로 안전 캐싱 후 가공 기동.
       */
  const handleDragMouseUp = () => {
    if (listenersRef.current.dragMove) document.removeEventListener('mousemove', listenersRef.current.dragMove)
    if (listenersRef.current.dragUp) document.removeEventListener('mouseup', listenersRef.current.dragUp)
    listenersRef.current.dragMove = null
    listenersRef.current.dragUp = null
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `!dragStartRef.current`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (!dragStartRef.current)` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
    if (!dragStartRef.current) return
    dragStartRef.current = null

    // 🧲 마그네틱 자석 스냅 촥! (벽면 30px 이내 접근 시 밀착)
    const W = window.innerWidth
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `H`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const H = ...` 형태로 안전 캐싱 후 가공 기동.
       */
    const H = window.innerHeight
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `currentWidth`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const currentWidth = ...` 형태로 안전 캐싱 후 가공 기동.
       */
    const currentWidth = isMinimized ? 52 : size.width
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `currentHeight`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const currentHeight = ...` 형태로 안전 캐싱 후 가공 기동.
       */
    const currentHeight = isMinimized ? 52 : size.height
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `snapMargin`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const snapMargin = ...` 형태로 안전 캐싱 후 가공 기동.
       */
    const snapMargin = 30

    setPos(prev => {
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `nx`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const nx = ...` 형태로 안전 캐싱 후 가공 기동.
       */
      let nx = prev.x
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `ny`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const ny = ...` 형태로 안전 캐싱 후 가공 기동.
       */
      let ny = prev.y

      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `nx < snapMargin`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (nx < snapMargin)` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
      if (nx < snapMargin) nx = 0
      else if (nx > W - currentWidth - snapMargin) nx = W - currentWidth

      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `ny < snapMargin`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (ny < snapMargin)` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
      if (ny < snapMargin) ny = 0
      else if (ny > H - currentHeight - snapMargin) ny = H - currentHeight

      return { x: nx, y: ny }
    })
  }

  // ── 크기 조절 로직 ──
  const handleResizeMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    resizeStartRef.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      width: size.width,
      height: size.height,
    }
    listenersRef.current.resizeMove = handleResizeMouseMove
    listenersRef.current.resizeUp = handleResizeMouseUp
    document.addEventListener('mousemove', handleResizeMouseMove)
    document.addEventListener('mouseup', handleResizeMouseUp)
  }

      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `handleResizeMouseMove`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const handleResizeMouseMove = ...` 형태로 안전 캐싱 후 가공 기동.
       */
  const handleResizeMouseMove = (e: MouseEvent) => {
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `!resizeStartRef.current`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (!resizeStartRef.current)` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
    if (!resizeStartRef.current) return
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `dx`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const dx = ...` 형태로 안전 캐싱 후 가공 기동.
       */
    const dx = e.clientX - resizeStartRef.current.mouseX
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `dy`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const dy = ...` 형태로 안전 캐싱 후 가공 기동.
       */
    const dy = e.clientY - resizeStartRef.current.mouseY
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `newW`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const newW = ...` 형태로 안전 캐싱 후 가공 기동.
       */
    const newW = Math.max(260, Math.min(600, resizeStartRef.current.width + dx))
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `newH`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const newH = ...` 형태로 안전 캐싱 후 가공 기동.
       */
    const newH = Math.max(300, Math.min(800, resizeStartRef.current.height + dy))

    setSize({ width: newW, height: newH })
  }

      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `handleResizeMouseUp`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const handleResizeMouseUp = ...` 형태로 안전 캐싱 후 가공 기동.
       */
  const handleResizeMouseUp = () => {
    if (listenersRef.current.resizeMove) document.removeEventListener('mousemove', listenersRef.current.resizeMove)
    if (listenersRef.current.resizeUp) document.removeEventListener('mouseup', listenersRef.current.resizeUp)
    listenersRef.current.resizeMove = null
    listenersRef.current.resizeUp = null
    resizeStartRef.current = null
  }

  // 최소화 버블 모드 렌더링
  if (isMinimized) {
    return (
      <div
        onClick={() => {
          setIsMinimized(false)
          onClearUnread()
        }}
        style={{
          position: 'fixed',
          left: pos.x,
          top: pos.y,
          width: '52px',
          height: '52px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, rgba(30, 27, 75, 0.85), rgba(15, 23, 42, 0.85))',
          backdropFilter: 'blur(20px)',
          border: '1.5px solid rgba(139, 92, 246, 0.5)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.5), 0 0 15px rgba(139, 92, 246, 0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          zIndex: 9999,
          transition: 'transform 0.2s, border-color 0.2s',
          userSelect: 'none',
        }}
        onMouseDown={handleDragMouseDown}
        onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#a78bfa')}
        onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'rgba(139, 92, 246, 0.5)')}
        title="드래그하여 이동 / 클릭하여 열기"
      >
        <MessageCircle size={22} style={{ color: '#a78bfa' }} />

        {/* 🟠 주황색 알림 주황점 (Pulsing Orange Badge) */}
        {hasUnread && (
          <span
            style={{
              position: 'absolute',
              top: '2px',
              right: '2px',
              width: '12px',
              height: '12px',
              borderRadius: '50%',
              backgroundColor: '#f97316',
              boxShadow: '0 0 10px #f97316',
              border: '2px solid #0f172a',
              animation: 'floating-unread-pulse 1.4s infinite alternate',
            }}
          />
        )}

        <style>{`
          @keyframes floating-unread-pulse {
            0% { transform: scale(0.9); opacity: 0.85; }
            100% { transform: scale(1.2); opacity: 1; box-shadow: 0 0 14px #ea580c; }
          }
        `}</style>
      </div>
    )
  }

  // 일반 채팅창 모드 렌더링
  return (
    <div
      onClick={onClearUnread}
      style={{
        position: 'fixed',
        left: pos.x,
        top: pos.y,
        width: `${size.width}px`,
        height: `${size.height}px`,
        borderRadius: '12px',
        background: 'rgba(10, 11, 18, 0.9)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(139, 92, 246, 0.3)',
        boxShadow: '0 12px 40px rgba(0, 0, 0, 0.6), 0 0 20px rgba(139, 92, 246, 0.15)',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 9990,
        overflow: 'hidden',
        fontFamily: 'var(--font-sans)',
      }}
    >
      {/* 플로팅 헤더 (드래그 핸들) */}
      <div
        onMouseDown={handleDragMouseDown}
        style={{
          padding: '8px 12px',
          background: 'linear-gradient(90deg, rgba(139, 92, 246, 0.15), transparent)',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: 'move',
          userSelect: 'none',
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#8b5cf6', display: 'inline-block' }} />
          <span style={{ fontSize: '11px', fontWeight: 700, color: '#e5e7eb', letterSpacing: '0.5px' }}>
            CHAT (FLOATING)
          </span>
          {hasUnread && (
            <span style={{
              width: '6px', height: '6px', borderRadius: '50%',
              backgroundColor: '#f97316', display: 'inline-block',
              boxShadow: '0 0 6px #f97316'
            }} />
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          {/* 접기 */}
          <button
            onClick={() => setIsMinimized(true)}
            title="최소화 (버블 모드)"
            style={{
              background: 'transparent', border: 'none', cursor: 'pointer',
              color: '#9ca3af', display: 'flex', padding: '4px', borderRadius: '4px',
              transition: 'background 0.2s'
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <Minimize2 size={12} />
          </button>
          {/* 사이드바 고정 */}
          <button
            onClick={onDockBack}
            title="사이드바에 도킹 고정"
            style={{
              background: 'transparent', border: 'none', cursor: 'pointer',
              color: '#9ca3af', display: 'flex', padding: '4px', borderRadius: '4px',
              transition: 'background 0.2s'
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <Pin size={12} style={{ transform: 'rotate(45deg)' }} />
          </button>
        </div>
      </div>

      {/* 내부 채팅 패널 */}
      <div style={{ flex: 1, overflow: 'hidden' }}>
        <ChatPanel
          messages={messages}
          onSend={onSend}
          onClear={onClear}
          username={username}
          userColor={userColor}
          serverRunning={serverRunning}
        />
      </div>

      {/* 리사이즈 핸들 (우측 하단 구석) */}
      <div
        onMouseDown={handleResizeMouseDown}
        style={{
          position: 'absolute',
          right: 0,
          bottom: 0,
          width: '15px',
          height: '15px',
          cursor: 'se-resize',
          zIndex: 10,
          background: 'linear-gradient(135deg, transparent 40%, rgba(139, 92, 246, 0.4) 100%)',
        }}
      />
    </div>
  )
}

