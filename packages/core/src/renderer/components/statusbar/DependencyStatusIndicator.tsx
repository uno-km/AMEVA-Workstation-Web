import React from 'react'
import { useDependencyStore } from '../../stores/useDependencyStore'
import { Layers } from 'lucide-react'
import { useTranslation } from '../../i18n/useTranslation'

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
  const { t } = useTranslation()
  const { dependencies } = useDependencyStore()
  const depsArray = Object.values(dependencies)

  const isAllReady = depsArray.every(d => d.status === 'ready' || d.status === 'idle') && depsArray.length > 0
  const hasError = depsArray.some(d => d.status === 'error')
  const isLoading = depsArray.some(d => d.status === 'loading')

  let statusColor = 'var(--text-muted)'
  let statusText = t.statusBar.depsIdle
  
  if (hasError) {
    statusColor = 'var(--danger)'
    statusText = t.statusBar.depsError
  } else if (isLoading) {
    statusColor = 'var(--warning)'
    statusText = t.statusBar.depsLoading
  } else if (isAllReady) {
    statusColor = 'var(--success)'
    statusText = t.statusBar.depsReady
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
        <div style={{ ...tooltipStyle, minWidth: '250px', whiteSpace: 'nowrap' }}>
          <div style={{ fontSize: '11.5px', fontWeight: 'bold', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '6px', marginBottom: '6px' }}>
            {t.statusBar.depsTitle}
          </div>
          {depsArray.length === 0 ? (
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{t.statusBar.depsEmpty}</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {depsArray.map(dep => {
                let color = 'var(--text-muted)'
                if (dep.status === 'ready') color = 'var(--success)'
                if (dep.status === 'loading') color = 'var(--warning)'
                if (dep.status === 'error') color = 'var(--danger)'

                return (
                  <div key={dep.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
                    <span style={{ color: 'var(--text-main)', marginRight: '16px' }}>{dep.name}</span>
                    <span style={{ color, fontWeight: 600 }}>
                      {dep.status === 'loading' ? '🟡' : 
                       dep.status === 'ready' ? '🟢' : 
                       dep.status === 'error' ? '🔴' : '⚪'}
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
