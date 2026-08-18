/**
 * ============================================================================
 * @file FindReplaceBar.tsx
 * @description FindReplaceBar.tsx 시스템 모듈 구성요소로, 관련 UI 렌더링 및 비즈니스 로직을 담당합니다.
 * @usage 문서 에디터 및 뷰어 내부에서 동적으로 호출되거나 유틸리티 함수로 사용됩니다.
 * @created 2026-08-10 20:30:36
 * @updated 2026-08-18 18:35:00
 * @author uno-km
 * @commit refactor: Apply Antigravity Blue theme & Clean up syntax
 * ============================================================================
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

/**
 * FindReplaceBar 함수의 핵심 비즈니스 로직 및 상태 제어를 처리합니다.
 */
export function FindReplaceBar({
  isOpen,
  onClose,
  editor,
  onScrollToBlock,
  initialMode = 'find'
}: FindReplaceBarProps) {
  const [showReplace, setShowReplace] = useState(initialMode === 'replace')
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

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      onClose()
    }
  }

  useEffect(() => {
    if (isOpen) {
      setShowReplace(initialMode === 'replace')
      setTimeout(() => {
        findInputRef.current?.focus()
        findInputRef.current?.select()
      }, 50)
      performSearch()
    }
  }, [isOpen, initialMode])

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [isOpen, onClose])

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
        border: '1px solid rgba(59, 130, 246, 0.3)',
        boxShadow: '0 12px 40px rgba(0, 0, 0, 0.4), 0 0 15px rgba(59, 130, 246, 0.1)',
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
              background: showReplace ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
              border: 'none',
              borderRadius: '4px',
              padding: '2px 4px',
              color: showReplace ? '#93c5fd' : 'var(--text-muted)',
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
                  background: 'rgba(59, 130, 246, 0.2)',
                  border: '1px solid rgba(59, 130, 246, 0.35)',
                  color: currentMatchIndex >= 0 ? '#93c5fd' : 'rgba(255,255,255,0.2)',
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
