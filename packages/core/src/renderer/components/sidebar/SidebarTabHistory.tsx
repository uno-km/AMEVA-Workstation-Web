/**
 * ============================================================================
 * @file SidebarTabHistory.tsx
 * @description SidebarTabHistory.tsx 시스템 모듈 구성요소로, 관련 UI 렌더링 및 비즈니스 로직을 담당합니다.
 * @usage 문서 에디터 및 뷰어 내부에서 동적으로 호출되거나 유틸리티 함수로 사용됩니다.
 * @example
 * // 예시 로직 (자동 생성됨)
 * import { something } from './SidebarTabHistory';
 * 
 * @created 2026-08-10 20:30:36
 * @updated 2026-08-10 20:30:36
 * @author uno-km
 * @commit docs: 전체 소스코드 한글 주석 및 사내 컨벤션 일괄 적용
 * ============================================================================
 */

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

// [외부 패키지 및 라이브러리 임포트: react]
import React, { useState } from 'react'
// [외부 패키지 및 라이브러리 임포트: lucide-react]
import { Plus, RefreshCw, Trash2 } from 'lucide-react'
// [내부 프로젝트 의존성 모듈 임포트: ../../../shared/types]
import type { DocumentSnapshot } from '../../../shared/types'

// [내부 프로젝트 의존성 모듈 임포트: ../../contexts/AppContext]
import { useAppContext } from '../../contexts/AppContext'
import { useTranslation } from '../../i18n/useTranslation'

/**
 * SidebarTabHistoryProps 모듈 내외부에서 사용되는 데이터 통신 규격 및 타입을 정의합니다.
 * @remarks 이 주석은 컨벤션에 따라 자동 생성된 문서화 내용입니다.
 */
export interface SidebarTabHistoryProps {
  sectionLabel: (text: string) => React.ReactNode
}

/**
 * SidebarTabHistory 함수의 핵심 비즈니스 로직 및 상태 제어를 처리합니다.
 * @remarks 이 주석은 컨벤션에 따라 자동 생성된 문서화 내용입니다.
 */
export function SidebarTabHistory({ sectionLabel }: SidebarTabHistoryProps) {
  const { t, language } = useTranslation()
  const { snapshots, createSnapshot, deleteSnapshot, handleSelectSnapshotForDiff } = useAppContext()
  const onCreateSnapshot = createSnapshot
  const onDeleteSnapshot = deleteSnapshot
  const onSelectSnapshotForDiff = handleSelectSnapshotForDiff
  const [snapTitle, setSnapTitle] = useState('')

  return (
    <div
      data-focus-region="sidebar-history"
      style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px', flex: 1, position: 'relative' }}
    >
      {sectionLabel(t.sidebar.saveSnapshot)}
      <div style={{ display: 'flex', gap: '6px' }}>
        <input
          type="text"
          placeholder={t.sidebar.snapPlaceholder}
          value={snapTitle}
          onChange={e => setSnapTitle(e.target.value)}
          onKeyDown={e => {
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
            if (snapTitle.trim()) {
              onCreateSnapshot(snapTitle)
              setSnapTitle('')
            }
          }}
        >
          <Plus size={14} />
        </button>
      </div>

      {sectionLabel(`${t.sidebar.timeline} (${snapshots.length})`)}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {snapshots.length === 0 ? (
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', textAlign: 'center', padding: '20px 0', opacity: 0.6 }}>
            {t.sidebar.noSnapshots}<br />
            <span style={{ fontSize: '10px' }}>{t.sidebar.autoSaveNotice}</span>
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
                    title={t.sidebar.compareRollback}
                  >
                    <RefreshCw size={11} />
                  </button>
                  <button
                    onClick={() => onDeleteSnapshot(snap.id)}
                    style={{ background: 'transparent', border: 'none', color: 'var(--danger)', cursor: 'pointer', padding: '2px' }}
                    title={t.sidebar.delete}
                  >
                    <Trash2 size={11} />
                  </button>
                </div>
              </div>
              <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                {new Date(snap.timestamp).toLocaleString(language === 'en' ? 'en-US' : 'ko-KR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

