import React from 'react'

export function InlineKanbanRenderer({ code }: { code: string }) {
  let data: any = null
  try {
    data = JSON.parse(code)
  } catch (err) {
    console.error('[InlineKanbanRenderer] JSON parse failed:', err)
    return <div style={{ color: 'var(--text-muted)', fontSize: '11px' }}>칸반 보드 데이터를 해석할 수 없습니다.</div>
  }

  const cols = data.columns || []
  if (cols.length === 0) {
    return <div style={{ padding: '16px', background: 'var(--bg-muted)', borderRadius: '8px', color: 'var(--text-muted)' }}>빈 칸반 보드입니다.</div>
  }

  return (
    <div style={{ marginBottom: '2rem', overflowX: 'auto' }}>
      <h4 style={{ marginBottom: '1rem', color: 'var(--text-color)' }}>[Kanban Board]</h4>
      <div style={{ display: 'flex', gap: '16px', minWidth: 'min-content' }}>
        {cols.map((col: any) => (
          <div key={col.id} style={{ width: '300px', background: 'var(--bg-muted)', borderRadius: '8px', padding: '12px', border: '1px solid var(--border-color)', flexShrink: 0 }}>
            <h5 style={{ marginBottom: '12px', fontSize: '14px', fontWeight: 600, color: 'var(--text-color)', borderBottom: '2px solid var(--border-color)', paddingBottom: '8px' }}>
              {col.title || 'Untitled'} ({col.cards?.length || 0})
            </h5>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {(col.cards || []).map((card: any) => (
                <div key={card.id} style={{ background: 'var(--bg-color)', padding: '12px', borderRadius: '6px', border: '1px solid var(--border-color)', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                  <strong style={{ fontSize: '14px', color: 'var(--text-color)', display: 'block', marginBottom: '4px' }}>{card.title || ''}</strong>
                  {card.labels && card.labels.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '6px' }}>
                      {card.labels.map((label: any, i: number) => (
                        <span key={i} style={{ background: label.color, color: '#fff', fontSize: '10px', padding: '2px 6px', borderRadius: '10px' }}>{label.text}</span>
                      ))}
                    </div>
                  )}
                  {card.description && (
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', whiteSpace: 'pre-wrap' }}>{card.description}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
