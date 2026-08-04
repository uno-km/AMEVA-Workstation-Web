/**
 * @file FindReplaceBar.tsx
 * @system AMEVA OS Desktop Workstation
 * @location src/renderer/components/FindReplaceBar.tsx
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

import React, { useEffect, useRef, useState } from 'react'
import { X, ChevronDown, ChevronUp, Replace, ReplaceAll, Search } from 'lucide-react'

import { type AmevaEditor } from '../editor/amevaBlockSchema'
import { useFindReplace } from '../hooks/useFindReplace'

interface FindReplaceBarProps {
  isOpen: boolean
  onClose: () => void
  editor: AmevaEditor | null
  onScrollToBlock: (blockId: string) => void
  initialMode?: 'find' | 'replace'
}

  /*
   * [FUNCTION CONTRACT]
   * - 함수 명: `FindReplaceBar`
   * - 역할: 인자 정보를 검수하고 비즈니스 계약 조건에 맞춰 최종 바인딩 결과물/바이너리 버퍼를 반환함.
   * - 예시: `FindReplaceBar(...)` 호출 시 런타임 비동기/동기 연쇄 반응 유도.
   */
export function FindReplaceBar({
  isOpen,
  onClose,
  editor,
  onScrollToBlock,
  initialMode = 'find'
}: FindReplaceBarProps) {
  const [showReplace, setShowReplace] = useState(initialMode === 'replace')
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `findInputRef`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const findInputRef = ...` 형태로 안전 캐싱 후 가공 기동.
       */
  const findInputRef = useRef<HTMLInputElement>(null)

  const {
    findQuery,
    setFindQuery,
    replaceQuery,
    setReplaceQuery,
    matchCase,
    setMatchCase,
    currentMatchIndex,
    totalMatchesCount,
    handleNavigate,
    handleReplace,
    handleReplaceAll,
    performSearch
  } = useFindReplace({ isOpen, editor, onScrollToBlock })

  /*
   * [USER INPUT HANDLER / INTERACTION]
   * - 역할: 찾기/바꾸기 인풋에서 Enter 키를 입력했을 때 찾기 모달창을 안전하게 종료(Close)합니다.
   */
  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      onClose()
    }
  }

  // 모드가 변경될 때 상태 동기화 및 인풋 포커스
  useEffect(() => {
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `isOpen`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (isOpen)` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
    if (isOpen) {
      setShowReplace(initialMode === 'replace')
      setTimeout(() => {
        findInputRef.current?.focus()
        findInputRef.current?.select()
      }, 50)
      performSearch()
    }
  }, [isOpen, initialMode])

  // ESC 키 누르면 찾기 창 닫기
  useEffect(() => {
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `handleEsc`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const handleEsc = ...` 형태로 안전 캐싱 후 가공 기동.
       */
    const handleEsc = (e: KeyboardEvent) => {
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `e.key === 'Escape' && isOpen`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (e.key === 'Escape' && isOpen)` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [isOpen, onClose])

      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `!isOpen`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (!isOpen)` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
  if (!isOpen) return null

  return (
    <div
      style={{
        position: 'fixed',
        top: '64px',
        right: '24px',
        zIndex: 999,
        width: '320px',
        padding: '12px',
        borderRadius: '12px',
        background: 'rgba(10, 10, 15, 0.75)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        border: '1px solid rgba(139, 92, 246, 0.3)',
        boxShadow: '0 12px 40px rgba(0, 0, 0, 0.4), 0 0 15px rgba(139, 92, 246, 0.1)',
        color: '#fff',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        animation: 'slideIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
        userSelect: 'none',
      }}
    >
      <style>{`
        @keyframes slideIn {
          from { opacity: 0; transform: translateY(-10px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>

      {/* 헤더 제어 영역 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          {showReplace ? '찾기 및 바꾸기 (Find & Replace)' : '문서 검색 (Find)'}
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <button
            onClick={() => setShowReplace(!showReplace)}
            style={{
              background: showReplace ? 'rgba(139, 92, 246, 0.15)' : 'transparent',
              border: 'none',
              borderRadius: '4px',
              padding: '2px 4px',
              color: showReplace ? '#c084fc' : 'var(--text-muted)',
              fontSize: '9.5px',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            {showReplace ? '찾기 모드' : '바꾸기 모드'}
          </button>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              display: 'flex',
              padding: '2px',
              borderRadius: '4px',
            }}
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* 찾기 입력창 필드 */}
      <div style={{ display: 'flex', gap: '4px', alignItems: 'center', position: 'relative' }}>
        <Search size={12} style={{ position: 'absolute', left: '8px', color: 'var(--text-muted)' }} />
        <input
          ref={findInputRef}
          type="text"
          value={findQuery}
          onChange={e => setFindQuery(e.target.value)}
          onKeyDown={handleInputKeyDown}
          placeholder="찾을 텍스트 입력..."
          style={{
            flex: 1,
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '6px',
            padding: '6px 6px 6px 26px',
            color: '#fff',
            fontSize: '11px',
            outline: 'none',
            fontFamily: 'inherit',
          }}
        />
        {findQuery && (
          <span style={{ fontSize: '9px', color: 'var(--text-muted)', marginRight: '4px' }}>
            {totalMatchesCount > 0 ? `${currentMatchIndex + 1}/${totalMatchesCount}` : '일치 없음'}
          </span>
        )}
      </div>

      {/* 바꾸기 입력창 필드 (바꾸기 모드 시에만 표시) */}
      {showReplace && (
        <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
          <input
            type="text"
            value={replaceQuery}
            onChange={e => setReplaceQuery(e.target.value)}
            onKeyDown={handleInputKeyDown}
            placeholder="바꿀 텍스트 입력..."
            style={{
              flex: 1,
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '6px',
              padding: '6px 8px',
              color: '#fff',
              fontSize: '11px',
              outline: 'none',
              fontFamily: 'inherit',
            }}
          />
        </div>
      )}

      {/* 제어 패널 버튼 목록 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '2px' }}>
        {/* 옵션 체크박스 */}
        <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', fontSize: '10px', color: 'var(--text-muted)' }}>
          <input
            type="checkbox"
            checked={matchCase}
            onChange={e => setMatchCase(e.target.checked)}
            style={{ cursor: 'pointer', accentColor: 'var(--primary)' }}
          />
          <span>대소문자 구분</span>
        </label>

        {/* 액션 제어 버튼부 */}
        <div style={{ display: 'flex', gap: '4px' }}>
          {/* 이전 / 다음 이동 */}
          <button
            onClick={() => handleNavigate('prev')}
            disabled={totalMatchesCount === 0}
            title="이전 매칭 찾기"
            style={{
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: totalMatchesCount > 0 ? '#fff' : 'rgba(255,255,255,0.2)',
              borderRadius: '4px',
              padding: '4px 6px',
              cursor: totalMatchesCount > 0 ? 'pointer' : 'not-allowed',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <ChevronUp size={12} />
          </button>
          <button
            onClick={() => handleNavigate('next')}
            disabled={totalMatchesCount === 0}
            title="다음 매칭 찾기"
            style={{
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: totalMatchesCount > 0 ? '#fff' : 'rgba(255,255,255,0.2)',
              borderRadius: '4px',
              padding: '4px 6px',
              cursor: totalMatchesCount > 0 ? 'pointer' : 'not-allowed',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <ChevronDown size={12} />
          </button>

          {/* 바꾸기 액션 버튼 */}
          {showReplace && (
            <>
              <button
                onClick={handleReplace}
                disabled={currentMatchIndex < 0}
                title="선택된 항목 바꾸기"
                style={{
                  background: 'rgba(139, 92, 246, 0.2)',
                  border: '1px solid rgba(139, 92, 246, 0.35)',
                  color: currentMatchIndex >= 0 ? '#d8b4fe' : 'rgba(255,255,255,0.2)',
                  borderRadius: '4px',
                  padding: '4px 8px',
                  cursor: currentMatchIndex >= 0 ? 'pointer' : 'not-allowed',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '10px',
                  fontWeight: 700,
                }}
              >
                <Replace size={10} />
                <span>바꾸기</span>
              </button>
              <button
                onClick={handleReplaceAll}
                disabled={totalMatchesCount === 0}
                title="모든 일치 항목 바꾸기"
                style={{
                  background: 'rgba(6, 182, 212, 0.2)',
                  border: '1px solid rgba(6, 182, 212, 0.35)',
                  color: totalMatchesCount > 0 ? '#99f6e4' : 'rgba(255,255,255,0.2)',
                  borderRadius: '4px',
                  padding: '4px 8px',
                  cursor: totalMatchesCount > 0 ? 'pointer' : 'not-allowed',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '10px',
                  fontWeight: 700,
                }}
              >
                <ReplaceAll size={10} />
                <span>모두 바꾸기</span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

