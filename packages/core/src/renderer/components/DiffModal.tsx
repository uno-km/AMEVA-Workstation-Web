/**
 * @file DiffModal.tsx
 * @system AMEVA OS Desktop Workstation
 * @location src/renderer/components/DiffModal.tsx
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

import React from 'react'
import { X, RefreshCw } from 'lucide-react'
import type { DocumentSnapshot } from '../../shared/types'

interface DiffModalProps {
  isOpen: boolean
  onClose: () => void
  snapshot: DocumentSnapshot | null
  currentContent: string
  getLineDiff: (oldText: string, newText: string) => { type: 'added' | 'removed' | 'unchanged'; value: string }[]
  onRollback: (content: string) => void
}

  /*
   * [FUNCTION CONTRACT]
   * - 함수 명: `DiffModal`
   * - 역할: 인자 정보를 검수하고 비즈니스 계약 조건에 맞춰 최종 바인딩 결과물/바이너리 버퍼를 반환함.
   * - 예시: `DiffModal(...)` 호출 시 런타임 비동기/동기 연쇄 반응 유도.
   */
export function DiffModal({
  isOpen,
  onClose,
  snapshot,
  currentContent,
  getLineDiff,
  onRollback,
}: DiffModalProps) {
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `!isOpen || !snapshot`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (!isOpen || !snapshot)` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
  if (!isOpen || !snapshot) return null

  // 스냅샷(과거) -> 현재 내용 비교
  const diffs = getLineDiff(snapshot.content, currentContent)

      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `handleRollback`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const handleRollback = ...` 형태로 안전 캐싱 후 가공 기동.
       */
  const handleRollback = () => {
    onRollback(snapshot.content)
    onClose()
  }

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        backgroundColor: 'rgba(5, 5, 10, 0.85)',
        backdropFilter: 'blur(8px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px',
      }}
    >
      <div
        className="glass-panel"
        style={{
          width: '100%',
          maxWidth: '1000px',
          height: '80vh',
          borderRadius: '12px',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          boxShadow: '0 20px 50px rgba(139, 92, 246, 0.25)',
        }}
      >
        {/* 헤더 */}
        <div
          style={{
            padding: '16px 24px',
            borderBottom: '1px solid var(--border-muted)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            backgroundColor: 'rgba(0,0,0,0.2)',
          }}
        >
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: 700 }}>버전 비교 및 복구</h3>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              스냅샷: {snapshot.title} ({new Date(snapshot.timestamp).toLocaleString()}) vs 현재 편집본
            </span>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', color: 'var(--text-main)', cursor: 'pointer' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Diff 리스트 영역 */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '20px',
            fontFamily: 'var(--font-mono)',
            fontSize: '13px',
            backgroundColor: 'var(--bg-deep)',
            lineHeight: '1.6',
          }}
        >
          {diffs.map((line, index) => {
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `bgColor`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const bgColor = ...` 형태로 안전 캐싱 후 가공 기동.
       */
            let bgColor = 'transparent'
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `color`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const color = ...` 형태로 안전 캐싱 후 가공 기동.
       */
            let color = 'var(--text-main)'
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `prefix`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const prefix = ...` 형태로 안전 캐싱 후 가공 기동.
       */
            let prefix = ' '

      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `line.type === 'added'`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (line.type === 'added')` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
            if (line.type === 'added') {
              bgColor = 'rgba(16, 185, 129, 0.15)'
              color = '#10b981'
              prefix = '+'
            } else if (line.type === 'removed') {
              bgColor = 'rgba(239, 68, 68, 0.15)'
              color = '#ef4444'
              prefix = '-'
            }

            return (
              <div
                key={index}
                style={{
                  backgroundColor: bgColor,
                  color: color,
                  padding: '2px 8px',
                  borderRadius: '2px',
                  display: 'flex',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-all',
                }}
              >
                <span style={{ userSelect: 'none', marginRight: '12px', opacity: 0.5, width: '12px' }}>
                  {prefix}
                </span>
                <span>{line.value || ' '}</span>
              </div>
            )
          })}
        </div>

        {/* 푸터 버튼 */}
        <div
          style={{
            padding: '16px 24px',
            borderTop: '1px solid var(--border-muted)',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '12px',
            backgroundColor: 'rgba(0,0,0,0.1)',
          }}
        >
          <button className="btn btn-glass" onClick={onClose}>
            취소
          </button>
          <button className="btn btn-secondary" onClick={handleRollback}>
            <RefreshCw size={14} /> 이 버전으로 롤백(복구)
          </button>
        </div>
      </div>
    </div>
  )
}

