/**
 * @file SidebarTabChat.tsx
 * @system AMEVA OS Desktop Workstation
 * @location src/renderer/components/sidebar/SidebarTabChat.tsx
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


import { MessageCircle, Share2 } from 'lucide-react'
import type { ChatMessage } from '../../hooks/useChat'
import { ChatPanel } from '../ChatPanel'

import { useAppContext } from '../../contexts/AppContext'
import { useUIStore } from '../../stores/useUIStore'

export interface SidebarTabChatProps {}

  /*
   * [FUNCTION CONTRACT]
   * - 함수 명: `SidebarTabChat`
   * - 역할: 인자 정보를 검수하고 비즈니스 계약 조건에 맞춰 최종 바인딩 결과물/바이너리 버퍼를 반환함.
   * - 예시: `SidebarTabChat(...)` 호출 시 런타임 비동기/동기 연쇄 반응 유도.
   */
export function SidebarTabChat({}: SidebarTabChatProps = {}) {
  const { chatMessages, sendChatMessage, clearChatMessages, username, userColor, serverRunning } = useAppContext()
  const { isChatFloating, setIsChatFloating } = useUIStore()
  
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `onChatSend`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const onChatSend = ...` 형태로 안전 캐싱 후 가공 기동.
       */
  const onChatSend = sendChatMessage
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `onChatClear`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const onChatClear = ...` 형태로 안전 캐싱 후 가공 기동.
       */
  const onChatClear = clearChatMessages
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `onToggleChatFloat`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const onToggleChatFloat = ...` 형태로 안전 캐싱 후 가공 기동.
       */
  const onToggleChatFloat = () => setIsChatFloating(!isChatFloating)
  return (
    <div
      data-focus-region="sidebar-chat"
      style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', position: 'relative' }}
    >
      {isChatFloating ? (
        <div style={{
          flex: 1, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          padding: '24px', textAlign: 'center', gap: '12px',
          color: 'var(--text-muted)'
        }}>
          <MessageCircle size={32} style={{ opacity: 0.3, color: 'var(--primary)' }} />
          <div style={{ fontSize: '13px', fontWeight: 600 }}>채팅창이 분리되었습니다</div>
          <div style={{ fontSize: '11px', opacity: 0.8 }}>바탕화면에 띄워진 플로팅 채팅창을 통해 메시지를 주고받을 수 있습니다.</div>
          <button
            className="btn btn-glass"
            onClick={onToggleChatFloat}
            style={{ fontSize: '11px', marginTop: '10px' }}
          >
            채팅창 가져오기 (고정)
          </button>
        </div>
      ) : (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' }}>
          <button
            onClick={onToggleChatFloat}
            title="플로팅 창으로 띄우기"
            style={{
              position: 'absolute',
              top: '10px',
              right: '34px',
              zIndex: 10,
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              padding: '4px',
              borderRadius: '4px',
            }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--primary)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
          >
            <Share2 size={11} style={{ transform: 'rotate(180deg)' }} />
          </button>
          <ChatPanel
            messages={chatMessages}
            onSend={onChatSend}
            onClear={onChatClear}
            username={username}
            userColor={userColor}
            serverRunning={serverRunning}
          />
        </div>
      )}
    </div>
  )
}

