/**
 * ============================================================================
 * @file ChatPanel.tsx
 * @description ChatPanel.tsx 시스템 모듈 구성요소로, 관련 UI 렌더링 및 비즈니스 로직을 담당합니다.
 * @usage 문서 에디터 및 뷰어 내부에서 동적으로 호출되거나 유틸리티 함수로 사용됩니다.
 * @example
 * // 예시 로직 (자동 생성됨)
 * import { something } from './ChatPanel';
 * 
 * @created 2026-08-10 20:30:36
 * @updated 2026-08-10 20:30:36
 * @author uno-km
 * @commit docs: 전체 소스코드 한글 주석 및 사내 컨벤션 일괄 적용
 * ============================================================================
 */

/**
 * @file ChatPanel.tsx
 * @system AMEVA OS Desktop Workstation
 * @location src/renderer/components/ChatPanel.tsx
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

// [외부 패키지 및 라이브러리 임포트: react]
import React, { useState, useRef, useEffect } from 'react'
// [외부 패키지 및 라이브러리 임포트: lucide-react]
import { Send, MessageCircle, Wifi, WifiOff, Trash2 } from 'lucide-react'
// [내부 프로젝트 의존성 모듈 임포트: ../hooks/useChat]
import type { ChatMessage } from '../hooks/useChat'
import { useTranslation } from '../i18n/useTranslation'

/**
 * ChatPanelProps 모듈 내외부에서 사용되는 데이터 통신 규격 및 타입을 정의합니다.
 * @remarks 이 주석은 컨벤션에 따라 자동 생성된 문서화 내용입니다.
 */
interface ChatPanelProps {
  messages: ChatMessage[]
  onSend: (content: string) => void
  onClear: () => void
  username: string
  userColor: string
  serverRunning: boolean
}

  /*
   * [FUNCTION CONTRACT]
   * - 함수 명: `ChatPanel`
   * - 역할: 인자 정보를 검수하고 비즈니스 계약 조건에 맞춰 최종 바인딩 결과물/바이너리 버퍼를 반환함.
   * - 예시: `ChatPanel(...)` 호출 시 런타임 비동기/동기 연쇄 반응 유도.
   */
/**
 * ChatPanel 함수의 핵심 비즈니스 로직 및 상태 제어를 처리합니다.
 * @remarks 이 주석은 컨벤션에 따라 자동 생성된 문서화 내용입니다.
 */
export function ChatPanel({
  messages,
  onSend,
  onClear,
  username,
  userColor,
  serverRunning,
}: ChatPanelProps) {
  const { t } = useTranslation()
  const [input, setInput] = useState('')
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `messagesEndRef`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const messagesEndRef = ...` 형태로 안전 캐싱 후 가공 기동.
       */
  const messagesEndRef = useRef<HTMLDivElement>(null)
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `inputRef`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const inputRef = ...` 형태로 안전 캐싱 후 가공 기동.
       */
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `messagesEndRef.current`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (messagesEndRef.current)` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages])

      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `handleSend`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const handleSend = ...` 형태로 안전 캐싱 후 가공 기동.
       */
  const handleSend = () => {
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `!input.trim() || !serverRunning`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (!input.trim() || !serverRunning)` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
    if (!input.trim() || !serverRunning) return
    onSend(input.trim())
    setInput('')
    inputRef.current?.focus()
  }

      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `handleKeyDown`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const handleKeyDown = ...` 형태로 안전 캐싱 후 가공 기동.
       */
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `e.key === 'Enter'`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (e.key === 'Enter')` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
    if (e.key === 'Enter') {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      overflow: 'hidden',
    }}>
      {/* 채팅 헤더 */}
      <div style={{
        padding: '10px 16px 8px',
        borderBottom: '1px solid var(--border-muted)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <MessageCircle size={13} style={{ color: 'var(--secondary)' }} />
          <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-main)' }}>실시간 채팅</span>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '3px',
            fontSize: '9px', padding: '1px 5px', borderRadius: '10px',
            background: serverRunning ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
            color: serverRunning ? 'var(--success)' : 'var(--danger)',
          }}>
            {serverRunning ? <Wifi size={8} /> : <WifiOff size={8} />}
            {serverRunning ? (t.sidePanel?.online || 'Online') : (t.sidePanel?.offline || 'Offline')}
          </div>
        </div>
        {messages.length > 0 && (
          <button
            onClick={onClear}
            style={{
              background: 'transparent', border: 'none', cursor: 'pointer',
              color: 'var(--text-muted)', display: 'flex', alignItems: 'center', padding: '2px',
            }}
            title={t.sidePanel?.clearChat || 'Clear Chat'}
          >
            <Trash2 size={11} />
          </button>
        )}
      </div>

      {/* 메시지 목록 */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '10px 12px',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
      }}>
        {messages.length === 0 ? (
          <div style={{
            flex: 1, display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            color: 'var(--text-muted)', fontSize: '11px', textAlign: 'center',
            gap: '6px', padding: '20px 0',
          }}>
            <MessageCircle size={24} style={{ opacity: 0.3 }} />
            <span>
              {serverRunning
                ? 'No messages yet.\nSend your first message!'
                : 'Start collaboration server\nto enable team chat.'
              }
            </span>
          </div>
        ) : (
          messages.map((msg) => {
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `isMe`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const isMe = ...` 형태로 안전 캐싱 후 가공 기동.
       */
            const isMe = msg.author === username
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `isSystem`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const isSystem = ...` 형태로 안전 캐싱 후 가공 기동.
       */
            const isSystem = msg.type === 'system'

      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `isSystem`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (isSystem)` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
            if (isSystem) {
              return (
                <div
                  key={msg.id}
                  style={{
                    textAlign: 'center',
                    fontSize: '10px',
                    color: 'var(--text-muted)',
                    padding: '2px 0',
                  }}
                >
                  {msg.content}
                </div>
              )
            }

            return (
              <div
                key={msg.id}
                style={{
                  display: 'flex',
                  flexDirection: isMe ? 'row-reverse' : 'row',
                  gap: '6px',
                  alignItems: 'flex-end',
                }}
              >
                {/* 아바타 */}
                {!isMe && (
                  <div style={{
                    width: '22px', height: '22px', borderRadius: '50%',
                    backgroundColor: msg.color,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '9px', fontWeight: 800, color: '#fff',
                    flexShrink: 0,
                  }}>
                    {msg.author.charAt(0).toUpperCase()}
                  </div>
                )}

                <div style={{ maxWidth: '80%', display: 'flex', flexDirection: 'column', gap: '2px', alignItems: isMe ? 'flex-end' : 'flex-start' }}>
                  {!isMe && (
                    <span style={{ fontSize: '9px', color: msg.color, fontWeight: 600, paddingLeft: '2px' }}>
                      {msg.author}
                    </span>
                  )}
                  <div style={{
                    padding: '7px 10px',
                    borderRadius: isMe ? '12px 4px 12px 12px' : '4px 12px 12px 12px',
                    background: isMe
                      ? `linear-gradient(135deg, ${userColor}33, ${userColor}22)`
                      : 'var(--bg-glass)',
                    border: `1px solid ${isMe ? `${userColor}44` : 'var(--border-muted)'}`,
                    fontSize: '12px',
                    color: 'var(--text-main)',
                    wordBreak: 'break-word',
                    lineHeight: '1.4',
                  }}>
                    {msg.content}
                  </div>
                  <span style={{ fontSize: '9px', color: 'var(--text-dark)', paddingLeft: '2px', paddingRight: '2px' }}>
                    {new Date(msg.timestamp).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            )
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* 입력 영역 */}
      <div
        data-focus-region="chat-input"
        style={{
          padding: '8px 12px',
          borderTop: '1px solid var(--border-muted)',
          display: 'flex',
          gap: '6px',
          alignItems: 'center',
          flexShrink: 0,
          position: 'relative',
          borderRadius: '0 0 8px 8px',
        }}
      >
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={serverRunning ? (t.sidePanel?.chatPlaceholder || 'Send a message...') : 'Server Offline'}
          disabled={!serverRunning}
          style={{
            flex: 1,
            background: 'var(--bg-glass)',
            border: '1px solid var(--border-muted)',
            borderRadius: '20px',
            padding: '6px 12px',
            color: 'var(--text-main)',
            fontSize: '12px',
            outline: 'none',
            transition: 'border-color 0.15s',
            opacity: serverRunning ? 1 : 0.5,
          }}
          onFocus={e => (e.target.style.borderColor = 'var(--secondary)')}
          onBlur={e => (e.target.style.borderColor = 'var(--border-muted)')}
        />
        <button
          onClick={handleSend}
          disabled={!input.trim() || !serverRunning}
          style={{
            width: '30px', height: '30px', borderRadius: '50%',
            background: input.trim() && serverRunning
              ? 'linear-gradient(135deg, var(--secondary), #0891b2)'
              : 'var(--bg-glass)',
            border: 'none',
            color: '#fff', cursor: input.trim() && serverRunning ? 'pointer' : 'not-allowed',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
            transition: 'all 0.15s',
            opacity: input.trim() && serverRunning ? 1 : 0.4,
            boxShadow: input.trim() && serverRunning ? '0 2px 8px var(--secondary-glow)' : 'none',
          }}
        >
          <Send size={13} />
        </button>
      </div>
    </div>
  )
}

