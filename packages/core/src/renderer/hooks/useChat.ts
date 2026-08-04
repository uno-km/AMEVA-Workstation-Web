/**
 * @file useChat.ts
 * @system AMEVA OS Desktop Workstation - Client Renderer
 * @location src/renderer/hooks/useChat.ts
 * @role Collaborative chat messenger sync (Yjs Shared Array) Hook
 * 
 * [설계 의도 - DESIGN INTENT / ADR]
 * - 동시 편집실에 연결된 피어들 간에 별도 메신저 서버를 경유하지 않고 Yjs CRDT 데이터 구조를 활용해 메신저를 구동한다.
 * - Yjs 공유 배열(`Y.Array`)에 채팅 메세지를 기입하고 옵저버 리스너(`yMessages.observe`)를 걸어 다른 사용자가 친 채팅을 실시간 동기 로드한다.
 * 
 * [책임 범위 - RESPONSIBILITY]
 * - Yjs Array로부터 채팅 메시지 데이터 변경을 감지하여 리액트 상태(`messages`)로 역매핑 반영한다.
 * - 일반 채팅 메시지 발송(`sendMessage`) 및 입장 시 시스템 메세지(`joinMsg`) 자동 삽입을 처리한다.
 * 
 * [절대 깨면 안 되는 계약 - CONTRACT]
 * - MUST: Yjs Shared Array에 메세지를 추가할 때는 배열 충돌 방지를 위해 단일 요소 푸시더라도 반드시 어레이 래핑 포맷(`push([msg])`) 계약을 고수할 것.
 * - MUST: 컴포넌트 언마운트(`cleanup`) 시점에 반드시 Yjs Array의 observe 리스너를 `unobserve` 하여 메모리 릭을 방지할 것.
 
 * [소비처 - CONSUMERS / USAGE CONTEXT]
 * - 소비처 A (src/renderer/App.tsx): 최상위 Facade 구조에 통합 마운트.
 * - 소비처 B (src/renderer/contexts/AppContext.tsx): 리액트 Context 훅 목록에 바인딩되어 하위 뷰에 전파.
 */

/* 
 * [IMPORT SEGMENTATION & CONTRACTS]
 * - useState, useEffect, useCallback, useRef: Yjs 어레이 상태 락 캐시 및 감청 등록용 React API.
 * - Y: Yjs CRDT 핵심 라이브러리.
 * - WebsocketProvider: WebSocket awareness 상태 획득용 제공자.
 */
import { useState, useEffect, useCallback, useRef } from 'react'
import * as Y from 'yjs'
import type { WebsocketProvider } from 'y-websocket'

/**
 * ChatMessage 인터페이스 정의.
 * 실시간 참여 피어 채팅 메시지 규격.
 */
export interface ChatMessage {
  id: string
  author: string
  color: string
  content: string
  timestamp: number
  type: 'text' | 'system'
}

/**
 * @hook useChat
 * @description Yjs 공유 배열과 연계하여 실시간 채팅 메시지를 주고받고 동기 감청하는 훅.
 */
export function useChat(
  /*
   * [HOOK CONFIG PARAMETERS]
   * - ydoc: Yjs CRDT 공유 문서 인스턴스.
   * - _provider: 웹소켓 제공자 레퍼런스.
   * - username: 로컬 사용자의 화면 닉네임.
   * - userColor: 로컬 사용자의 캐럿 식별 색상.
   * - serverRunning: 중계 서버 가동 상태.
   */
  ydoc: Y.Doc | null,
  _provider: WebsocketProvider | null,
  username: string,
  userColor: string,
  serverRunning: boolean
) {
  /*
   * [INVARIANT - Chat Messages State]
   * - messages: 화면 챗 다이얼로그에 노출되는 정제 메시지 목록.
   * - yArrayRef: 리렌더 사이에서 Yjs 공유 Array 인스턴스 참조를 잃지 않기 위한 Ref.
   */
  const [messages, setMessages] = useState<ChatMessage[]>([])
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `yArrayRef`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const yArrayRef = ...` 형태로 안전 캐싱 후 가공 기동.
       */
  const yArrayRef = useRef<Y.Array<ChatMessage> | null>(null)

  /**
   * [SIDE EFFECT - Init Y.js Array and Observer]
   * - Rationale: Y.Doc 마운트 시 'chat-messages' 키의 공유 배열을 획득하고 변경 리스너를 달아둔다.
   */
  useEffect(() => {
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `!ydoc`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (!ydoc)` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
    if (!ydoc) return

    // Yjs Array 획득 및 락 설정
    const yMessages = ydoc.getArray<ChatMessage>('chat-messages')
    yArrayRef.current = yMessages

    // 데이터 삽입/삭제 시마다 리액트 UI 상태로 즉시 파이핑 반영
    const observer = () => {
      setMessages(yMessages.toArray())
    }

    yMessages.observe(observer)
    setMessages(yMessages.toArray())

    // CONTRACT: 소멸 시 Yjs Array observe 감청 완벽 리셋 클린업
    return () => {
      yMessages.unobserve(observer)
    }
  }, [ydoc])

  /**
   * [SIDE EFFECT - Entry Alert Message Trigger]
   * - Rationale: 내장 서버에 정상 연결(입장)이 감지되었을 때 시스템 환영 메세지를 push해 알린다.
   */
  useEffect(() => {
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `!serverRunning || !yArrayRef.current`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (!serverRunning || !yArrayRef.current)` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
    if (!serverRunning || !yArrayRef.current) return

    const joinMsg: ChatMessage = {
      id: `sys_${Date.now()}`,
      author: 'System',
      color: '#10b981',
      content: `${username} 님이 입장했습니다.`,
      timestamp: Date.now(),
      type: 'system',
    }

    yArrayRef.current.push([joinMsg])
  }, [serverRunning, username])

  /**
   * [CONTRACT - Send Plain Chat Message Action]
   * - Rationale: 타이핑한 평문 메세지 내용의 좌우 공백을 제거하고 랜덤 uuid 접미를 엮어 Yjs Shared Array에 삽입한다.
   */
  const sendMessage = useCallback((content: string) => {
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `!yArrayRef.current || !content.trim()`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (!yArrayRef.current || !content.trim())` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
    if (!yArrayRef.current || !content.trim()) return

    const msg: ChatMessage = {
      // 충돌 방지 고유 ID 조합
      id: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      author: username,
      color: userColor,
      content: content.trim(),
      timestamp: Date.now(),
      type: 'text',
    }

    yArrayRef.current.push([msg])
  }, [username, userColor])

  /**
   * [CONTRACT - Clear Chat Messages Action]
   * - Rationale: Yjs 공유 이력을 삭제하지 않고 오직 내 로컬 화면 챗 리스트만 클리어 시켜 준다.
   */
  const clearMessages = useCallback(() => {
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `!yArrayRef.current`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (!yArrayRef.current)` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
    if (!yArrayRef.current) return
    setMessages([])
  }, [])

  return {
    messages,
    sendMessage,
    clearMessages,
  }
}

