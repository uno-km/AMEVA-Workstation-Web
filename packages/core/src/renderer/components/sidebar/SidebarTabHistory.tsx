/**
 * @file SidebarTabHistory.tsx
 * @system AMEVA OS Desktop Workstation
 * @location src/renderer/components/sidebar/SidebarTabHistory.tsx
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

import React, { useState } from 'react'
import { Plus, RefreshCw, Trash2 } from 'lucide-react'
import type { DocumentSnapshot } from '../../../shared/types'

import { useAppContext } from '../../contexts/AppContext'

export interface SidebarTabHistoryProps {
  sectionLabel: (text: string) => React.ReactNode
}

  /*
   * [FUNCTION CONTRACT]
   * - 함수 명: `SidebarTabHistory`
   * - 역할: 인자 정보를 검수하고 비즈니스 계약 조건에 맞춰 최종 바인딩 결과물/바이너리 버퍼를 반환함.
   * - 예시: `SidebarTabHistory(...)` 호출 시 런타임 비동기/동기 연쇄 반응 유도.
   */
export function SidebarTabHistory({ sectionLabel }: SidebarTabHistoryProps) {
  const { snapshots, createSnapshot, deleteSnapshot, handleSelectSnapshotForDiff } = useAppContext()
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `onCreateSnapshot`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const onCreateSnapshot = ...` 형태로 안전 캐싱 후 가공 기동.
       */
  const onCreateSnapshot = createSnapshot
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `onDeleteSnapshot`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const onDeleteSnapshot = ...` 형태로 안전 캐싱 후 가공 기동.
       */
  const onDeleteSnapshot = deleteSnapshot
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `onSelectSnapshotForDiff`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const onSelectSnapshotForDiff = ...` 형태로 안전 캐싱 후 가공 기동.
       */
  const onSelectSnapshotForDiff = handleSelectSnapshotForDiff
  const [snapTitle, setSnapTitle] = useState('')

  return (
    <div
      data-focus-region="sidebar-history"
      style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px', flex: 1, position: 'relative' }}
    >
      {sectionLabel('스냅샷 저장')}
      <div style={{ display: 'flex', gap: '6px' }}>
        <input
          type="text"
          placeholder="버전 제목 입력..."
          value={snapTitle}
          onChange={e => setSnapTitle(e.target.value)}
          onKeyDown={e => {
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `e.key === 'Enter' && snapTitle.trim()`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (e.key === 'Enter' && snapTitle.trim())` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
            if (e.key === 'Enter' && snapTitle.trim()) {
              onCreateSnapshot(snapTitle)
              setSnapTitle('')
            }
          }}
          style={{
            flex: 1, background: 'var(--bg-glass)',
            border: '1px solid var(--border-muted)', borderRadius: '6px',
            padding: '6px 10px', color: 'var(--text-main)', outline: 'none', fontSize: '12px',
          }}
        />
        <button
          className="btn btn-glass"
          style={{ padding: '6px 10px', flexShrink: 0 }}
          onClick={() => {
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `snapTitle.trim()`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (snapTitle.trim())` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
            if (snapTitle.trim()) {
              onCreateSnapshot(snapTitle)
              setSnapTitle('')
            }
          }}
        >
          <Plus size={14} />
        </button>
      </div>

      {sectionLabel(`타임라인 (${snapshots.length}개)`)}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {snapshots.length === 0 ? (
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', textAlign: 'center', padding: '20px 0', opacity: 0.6 }}>
            저장된 스냅샷이 없습니다.<br />
            <span style={{ fontSize: '10px' }}>3분마다 자동 저장됩니다.</span>
          </div>
        ) : (
          snapshots.map((snap) => (
            <div
              key={snap.id}
              className="glass-panel"
              style={{ padding: '10px 12px', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '5px' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <span style={{
                  fontWeight: 600, fontSize: '12px', color: 'var(--primary)',
                  maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {snap.title}
                </span>
                <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
                  <button
                    onClick={() => onSelectSnapshotForDiff(snap)}
                    style={{ background: 'transparent', border: 'none', color: 'var(--secondary)', cursor: 'pointer', padding: '2px' }}
                    title="비교 및 롤백"
                  >
                    <RefreshCw size={11} />
                  </button>
                  <button
                    onClick={() => onDeleteSnapshot(snap.id)}
                    style={{ background: 'transparent', border: 'none', color: 'var(--danger)', cursor: 'pointer', padding: '2px' }}
                    title="삭제"
                  >
                    <Trash2 size={11} />
                  </button>
                </div>
              </div>
              <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                {new Date(snap.timestamp).toLocaleString('ko-KR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

