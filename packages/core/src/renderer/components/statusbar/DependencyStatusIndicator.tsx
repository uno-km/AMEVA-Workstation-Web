import React from 'react'
import { useDependencyStore } from '../../stores/useDependencyStore'
import { Layers } from 'lucide-react'

export interface DependencyStatusIndicatorProps {
  activeTooltip: string | null
  handleMouseEnter: (id: string) => void
  handleMouseLeave: () => void
  tooltipStyle: React.CSSProperties
}

export function DependencyStatusIndicator({
  activeTooltip,
  handleMouseEnter,
  handleMouseLeave,
  tooltipStyle
}: DependencyStatusIndicatorProps) {
  const { dependencies } = useDependencyStore()
  const depsArray = Object.values(dependencies)

  const isAllReady = depsArray.every(d => d.status === 'ready' || d.status === 'idle') && depsArray.length > 0
  const hasError = depsArray.some(d => d.status === 'error')
  const isLoading = depsArray.some(d => d.status === 'loading')

  let statusColor = 'var(--text-muted)'
  let statusText = '의존성 대기'
  
  if (hasError) {
    statusColor = 'var(--danger)'
    statusText = '의존성 오류'
  } else if (isLoading) {
    statusColor = 'var(--warning)'
    statusText = '백그라운드 로딩'
  } else if (isAllReady) {
    statusColor = 'var(--success)'
    statusText = '의존성 준비완료'
  }

  return (
    <div
      style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', position: 'relative' }}
      onMouseEnter={() => handleMouseEnter('dependency')}
      onMouseLeave={handleMouseLeave}
    >
      <div style={{
        display: 'flex', alignItems: 'center', gap: '4px',
        color: statusColor, transition: 'color 0.2s', fontWeight: 600
      }}>
        <Layers size={12} />
        <span>{statusText}</span>
      </div>

      {activeTooltip === 'dependency' && (
        <div style={{ ...tooltipStyle, minWidth: '200px' }}>
          <div style={{ fontSize: '11.5px', fontWeight: 'bold', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '6px', marginBottom: '6px' }}>
            시스템 백그라운드 모듈 상태
          </div>
          {depsArray.length === 0 ? (
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>등록된 백그라운드 모듈이 없습니다.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {depsArray.map(dep => {
                let color = 'var(--text-muted)'
                if (dep.status === 'ready') color = 'var(--success)'
                if (dep.status === 'loading') color = 'var(--warning)'
                if (dep.status === 'error') color = 'var(--danger)'

                return (
                  <div key={dep.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
                    <span style={{ color: 'var(--text-main)' }}>{dep.name}</span>
                    <span style={{ color, fontWeight: 600 }}>
                      {dep.status === 'loading' ? '로딩 중...' : 
                       dep.status === 'ready' ? '활성' : 
                       dep.status === 'error' ? '오류' : '대기'}
                    </span>
                    {dep.error && (
                      <div style={{ fontSize: '10px', color: 'var(--danger)', marginTop: '2px', gridColumn: 'span 2' }}>
                        ↳ {dep.error}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
