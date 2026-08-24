/**
 * ============================================================================
 * @file DocStatusIndicator.tsx
 * @description DocStatusIndicator.tsx 시스템 모듈 구성요소로, 관련 UI 렌더링 및 비즈니스 로직을 담당합니다.
 * @usage 문서 에디터 및 뷰어 내부에서 동적으로 호출되거나 유틸리티 함수로 사용됩니다.
 * @example
 * // 예시 로직 (자동 생성됨)
 * import { something } from './DocStatusIndicator';
 * 
 * @created 2026-08-10 20:30:36
 * @updated 2026-08-10 20:30:36
 * @author uno-km
 * @commit docs: 전체 소스코드 한글 주석 및 사내 컨벤션 일괄 적용
 * ============================================================================
 */

/**
 * @file DocStatusIndicator.tsx
 * @system AMEVA OS Desktop Workstation
 * @location src/renderer/components/statusbar/DocStatusIndicator.tsx
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
import { Info, AlertTriangle, Check } from 'lucide-react'
import { useTranslation } from '../../i18n/useTranslation'

interface DocStatusIndicatorProps {
  filePath: string | null
  isDirty: boolean
  lastSavedTime: Date | null
  activeTooltip: string | null
  setActiveTooltip: (id: string | null) => void
  tooltipStyle: React.CSSProperties
}

export function DocStatusIndicator({
  filePath,
  isDirty,
  lastSavedTime,
  activeTooltip,
  setActiveTooltip,
  tooltipStyle
}: DocStatusIndicatorProps) {
  const { t } = useTranslation()

  const formatSavedTime = (date: Date | null) => {
    if (!date) return t.statusBar.noLastSaved
    const yyyy = date.getFullYear()
    const mm = String(date.getMonth() + 1).padStart(2, '0')
    const dd = String(date.getDate()).padStart(2, '0')
    const hh = String(date.getHours()).padStart(2, '0')
    const min = String(date.getMinutes()).padStart(2, '0')
    const ss = String(date.getSeconds()).padStart(2, '0')
    return `${t.statusBar.lastSavedTime}: ${yyyy}-${mm}-${dd} ${hh}:${min}:${ss}`
  }

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
        <Info size={12} style={{ color: 'var(--primary)' }} />
        <span style={{ textOverflow: 'ellipsis', whiteSpace: 'nowrap', overflow: 'hidden', maxWidth: '260px' }}>
          {filePath ? filePath.split(/[\\/]/).pop() : t.statusBar.untitledDoc}
        </span>
      </div>
      <div style={{ width: '1px', height: '12px', backgroundColor: 'var(--border-muted)' }} />
      {isDirty ? (
        <span 
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '4px', 
            color: '#fb923c',
            cursor: 'help',
            fontWeight: 600,
            fontSize: '11px',
            position: 'relative'
          }}
          onMouseEnter={() => setActiveTooltip('save')}
          onMouseLeave={() => setActiveTooltip(null)}
        >
          <AlertTriangle size={11} style={{ color: '#fb923c' }} /> {t.statusBar.unsaved}

          {activeTooltip === 'save' && (
            <div style={{ ...tooltipStyle, width: '280px', left: 0 }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#fb923c', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '4px', marginBottom: '4px' }}>
                {t.statusBar.unsavedDescTitle}
              </div>
              <div style={{ fontSize: '10px', color: 'var(--text-main)', lineHeight: '1.4' }}>
                {t.statusBar.unsavedDescBody}
              </div>
            </div>
          )}
        </span>
      ) : (
        <span 
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '4px', 
            color: 'var(--success)', 
            cursor: 'help',
            fontSize: '11px',
            position: 'relative'
          }}
          onMouseEnter={() => setActiveTooltip('save')}
          onMouseLeave={() => setActiveTooltip(null)}
        >
          <Check size={11} style={{ color: 'var(--success)' }} /> {t.statusBar.saved}

          {activeTooltip === 'save' && (
            <div style={{ ...tooltipStyle, width: '260px', left: 0 }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--success)', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '4px', marginBottom: '4px' }}>
                {t.statusBar.savedDescTitle}
              </div>
              <div style={{ fontSize: '10px', color: 'var(--text-main)' }}>
                {formatSavedTime(lastSavedTime)}
              </div>
            </div>
          )}
        </span>
      )}
    </>
  )
}

