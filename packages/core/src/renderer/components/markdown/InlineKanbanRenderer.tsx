import React, { useState, useCallback } from 'react'

interface KanbanCard {
  id: string
  title: string
  description?: string
  labels?: { text: string; color: string }[]
  completed?: boolean
  priority?: 'high' | 'medium' | 'low'
}
interface KanbanColumn {
  id: string
  title: string
  cards: KanbanCard[]
}
interface KanbanData {
  columns: KanbanColumn[]
}

type DragItem =
  | { kind: 'card'; cardId: string; fromColId: string }
  | { kind: 'col'; colId: string }

const COL_COLORS: Record<string, string> = {
  'To Do': '#3b82f6',
  'In Progress': '#f59e0b',
  'Done': '#10b981',
}
function getColColor(title: string): string {
  return COL_COLORS[title] || '#8b5cf6'
}

export function InlineKanbanRenderer({ code }: { code: string }) {
  const [data, setData] = useState<KanbanData>(() => {
    try {
      const parsed = JSON.parse(code)
      return parsed
    } catch (err) {
      console.error('[InlineKanbanRenderer] JSON parse failed:', err)
      return { columns: [] }
    }
  })

  const [dragItem, setDragItem] = useState<DragItem | null>(null)
  const [dragOverColId, setDragOverColId] = useState<string | null>(null)
  const [dragOverCardId, setDragOverCardId] = useState<string | null>(null)

  const cols = data.columns || []
  if (cols.length === 0) {
    return (
      <div style={{ padding: '16px', background: 'var(--bg-glass-active)', borderRadius: '8px', color: 'var(--text-muted)' }}>
        빈 칸반 보드입니다.
      </div>
    )
  }

  // ─── Card Drag Handlers ─────────────────────────────────────────────────────

  const onCardDragStart = useCallback((e: React.DragEvent, cardId: string, fromColId: string) => {
    e.stopPropagation()
    e.dataTransfer.effectAllowed = 'move'
    // 투명 ghost 이미지
    const ghost = new Image()
    ghost.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'
    e.dataTransfer.setDragImage(ghost, 0, 0)
    setDragItem({ kind: 'card', cardId, fromColId })
  }, [])

  const onCardDragOver = useCallback((e: React.DragEvent, colId: string, cardId?: string) => {
    e.preventDefault()
    e.stopPropagation()
    e.dataTransfer.dropEffect = 'move'
    setDragOverColId(colId)
    setDragOverCardId(cardId ?? null)
  }, [])

  const onCardDrop = useCallback((e: React.DragEvent, toColId: string, toCardId?: string) => {
    e.preventDefault()
    e.stopPropagation()
    if (!dragItem || dragItem.kind !== 'card') return

    const { cardId, fromColId } = dragItem
    if (cardId === toCardId) return

    setData(prev => {
      const next = { ...prev, columns: prev.columns.map(c => ({ ...c, cards: [...c.cards] })) }
      const srcCol = next.columns.find(c => c.id === fromColId)
      const dstCol = next.columns.find(c => c.id === toColId)
      if (!srcCol || !dstCol) return prev

      const cardIdx = srcCol.cards.findIndex(c => c.id === cardId)
      if (cardIdx === -1) return prev
      const [card] = srcCol.cards.splice(cardIdx, 1)

      if (toCardId) {
        const dstIdx = dstCol.cards.findIndex(c => c.id === toCardId)
        dstCol.cards.splice(dstIdx >= 0 ? dstIdx : dstCol.cards.length, 0, card)
      } else {
        dstCol.cards.push(card)
      }
      return next
    })
    setDragItem(null)
    setDragOverColId(null)
    setDragOverCardId(null)
  }, [dragItem])

  // ─── Column Drag Handlers ────────────────────────────────────────────────────

  const onColDragStart = useCallback((e: React.DragEvent, colId: string) => {
    e.dataTransfer.effectAllowed = 'move'
    const ghost = new Image()
    ghost.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'
    e.dataTransfer.setDragImage(ghost, 0, 0)
    setDragItem({ kind: 'col', colId })
  }, [])

  const onColDragOver = useCallback((e: React.DragEvent, colId: string) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    if (dragItem?.kind === 'col') {
      setDragOverColId(colId)
    }
  }, [dragItem])

  const onColDrop = useCallback((e: React.DragEvent, toColId: string) => {
    e.preventDefault()
    if (!dragItem || dragItem.kind !== 'col') return
    const { colId: fromColId } = dragItem
    if (fromColId === toColId) return

    setData(prev => {
      const next = { ...prev, columns: [...prev.columns] }
      const fromIdx = next.columns.findIndex(c => c.id === fromColId)
      const toIdx = next.columns.findIndex(c => c.id === toColId)
      if (fromIdx === -1 || toIdx === -1) return prev
      const [col] = next.columns.splice(fromIdx, 1)
      next.columns.splice(toIdx, 0, col)
      return next
    })
    setDragItem(null)
    setDragOverColId(null)
  }, [dragItem])

  const onDragEnd = useCallback(() => {
    setDragItem(null)
    setDragOverColId(null)
    setDragOverCardId(null)
  }, [])

  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <div
      style={{ marginBottom: '1.5rem', overflowX: 'auto', cursor: 'default' }}
      onDragEnd={onDragEnd}
    >
      <div style={{ display: 'flex', gap: '14px', minWidth: 'min-content', padding: '4px 2px 12px 2px', alignItems: 'flex-start' }}>
        {cols.map((col) => {
          const colColor = getColColor(col.title)
          const isColDragOver = dragItem?.kind === 'col' && dragOverColId === col.id && dragItem.colId !== col.id
          const isDraggingThisCol = dragItem?.kind === 'col' && dragItem.colId === col.id

          return (
            <div
              key={col.id}
              draggable
              onDragStart={(e) => onColDragStart(e, col.id)}
              onDragOver={(e) => {
                if (dragItem?.kind === 'col') onColDragOver(e, col.id)
                else if (dragItem?.kind === 'card') onCardDragOver(e, col.id)
              }}
              onDrop={(e) => {
                if (dragItem?.kind === 'col') onColDrop(e, col.id)
                else if (dragItem?.kind === 'card') onCardDrop(e, col.id)
              }}
              style={{
                width: '300px',
                flexShrink: 0,
                background: isColDragOver
                  ? `rgba(${parseInt(colColor.slice(1,3),16)},${parseInt(colColor.slice(3,5),16)},${parseInt(colColor.slice(5,7),16)},0.12)`
                  : 'var(--bg-glass-active)',
                borderRadius: '10px',
                border: `1px solid ${isColDragOver ? colColor : 'var(--border-muted)'}`,
                boxShadow: isColDragOver ? `0 0 0 2px ${colColor}55` : 'none',
                opacity: isDraggingThisCol ? 0.4 : 1,
                transition: 'border-color 0.15s, box-shadow 0.15s, opacity 0.15s, background 0.15s',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              {/* 컬럼 헤더 — 드래그 핸들 */}
              <div
                style={{
                  padding: '10px 14px 8px',
                  cursor: 'grab',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  borderBottom: `2px solid ${colColor}55`,
                  userSelect: 'none',
                }}
                title="드래그해서 컬럼 이동"
              >
                {/* 그립 아이콘 */}
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ opacity: 0.4, flexShrink: 0 }}>
                  <circle cx="4" cy="3" r="1.3" fill="currentColor" />
                  <circle cx="10" cy="3" r="1.3" fill="currentColor" />
                  <circle cx="4" cy="7" r="1.3" fill="currentColor" />
                  <circle cx="10" cy="7" r="1.3" fill="currentColor" />
                  <circle cx="4" cy="11" r="1.3" fill="currentColor" />
                  <circle cx="10" cy="11" r="1.3" fill="currentColor" />
                </svg>
                <span style={{
                  fontSize: '12px', fontWeight: 700, color: colColor,
                  background: `${colColor}22`, padding: '2px 8px', borderRadius: '6px',
                  flex: 1,
                }}>
                  {col.title}
                </span>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>
                  {col.cards?.length || 0}
                </span>
              </div>

              {/* 카드 목록 */}
              <div
                style={{
                  padding: '10px 10px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  minHeight: '60px',
                  flexGrow: 1,
                }}
                onDragOver={(e) => dragItem?.kind === 'card' && onCardDragOver(e, col.id)}
                onDrop={(e) => dragItem?.kind === 'card' && onCardDrop(e, col.id)}
              >
                {(col.cards || []).map((card) => {
                  const isDraggingCard = dragItem?.kind === 'card' && dragItem.cardId === card.id
                  const isCardOver = dragItem?.kind === 'card' && dragOverColId === col.id && dragOverCardId === card.id && dragItem.cardId !== card.id

                  return (
                    <div
                      key={card.id}
                      draggable
                      onDragStart={(e) => onCardDragStart(e, card.id, col.id)}
                      onDragOver={(e) => dragItem?.kind === 'card' && onCardDragOver(e, col.id, card.id)}
                      onDrop={(e) => dragItem?.kind === 'card' && onCardDrop(e, col.id, card.id)}
                      style={{
                        background: 'var(--bg-main)',
                        padding: '11px 13px',
                        borderRadius: '8px',
                        border: `1px solid ${isCardOver ? colColor : 'var(--border-muted)'}`,
                        boxShadow: isCardOver
                          ? `0 0 0 2px ${colColor}66, 0 4px 12px rgba(0,0,0,0.15)`
                          : isDraggingCard
                          ? 'none'
                          : '0 1px 3px rgba(0,0,0,0.12)',
                        cursor: 'grab',
                        opacity: isDraggingCard ? 0.3 : 1,
                        transform: isCardOver ? 'translateY(-2px)' : 'none',
                        transition: 'border-color 0.12s, box-shadow 0.12s, opacity 0.12s, transform 0.1s',
                        userSelect: 'none',
                        // 마진 대신 gap 사용
                        marginBottom: 0,
                      }}
                    >
                      <strong style={{ fontSize: '13px', color: 'var(--text-main)', display: 'block', marginBottom: card.description || card.labels?.length ? '6px' : 0 }}>
                        {card.title || ''}
                      </strong>
                      {card.labels && card.labels.length > 0 && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '6px' }}>
                          {card.labels.map((label, i) => (
                            <span key={i} style={{ background: label.color, color: '#fff', fontSize: '10px', padding: '2px 6px', borderRadius: '10px' }}>
                              {label.text}
                            </span>
                          ))}
                        </div>
                      )}
                      {card.description && (
                        <span style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', whiteSpace: 'pre-wrap', opacity: 0.85 }}>
                          {card.description}
                        </span>
                      )}
                    </div>
                  )
                })}

                {/* 카드가 없을 때 드롭 힌트 */}
                {(col.cards || []).length === 0 && dragItem?.kind === 'card' && (
                  <div style={{
                    border: `2px dashed ${dragOverColId === col.id ? colColor : 'var(--border-muted)'}`,
                    borderRadius: '8px',
                    height: '52px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--text-muted)',
                    fontSize: '12px',
                    transition: 'border-color 0.15s',
                  }}>
                    여기에 드롭
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
