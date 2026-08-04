import React, { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { createReactBlockSpec } from '@blocknote/react'
import { Plus, CheckSquare, Square, ChevronUp, Equal, ChevronDown, User, Search, GripVertical, Trash2, ArrowLeft, ArrowRight } from 'lucide-react'
import { KanbanModal } from './KanbanModal'

// Kanban Data Types
export type Priority = 'high' | 'medium' | 'low'
export type AssigneeType = 'human' | 'agent'
export interface Assignee {
  type: AssigneeType
  name: string
  avatarColor: string
}
export interface KanbanCard {
  id: string
  title: string
  completed: boolean
  priority: Priority
  assignee: Assignee | null
  description?: string
  labels?: { text: string, color: string }[]
}
export interface KanbanColumn {
  id: string
  title: string
  cards: KanbanCard[]
}
export interface KanbanData {
  columns: KanbanColumn[]
  nextId: number
}

// (Moved to KanbanModal)

const DEFAULT_DATA: KanbanData = {
  columns: [
    { id: 'todo', title: 'To do', cards: [] },
    { id: 'in-progress', title: 'In Progress', cards: [] },
    { id: 'done', title: 'Done', cards: [] }
  ],
  nextId: 101
}

const PriorityIcon = ({ priority }: { priority: Priority }) => {
  if (priority === 'high') return <ChevronUp size={14} color="#f44336" />
  if (priority === 'medium') return <Equal size={14} color="#ff9800" />
  return <ChevronDown size={14} color="#2196f3" />
}

export const KanbanBlockSpec = createReactBlockSpec(
  {
    type: 'kanban',
    propSchema: {
      data: {
        default: JSON.stringify(DEFAULT_DATA),
      }
    },
    content: 'none'
  },
  {
    render: (props) => {
      const isEditable = props.editor.isEditable
      const [data, setData] = useState<KanbanData>(() => {
        try {
          return JSON.parse(props.block.props.data)
        } catch (e) {
          return DEFAULT_DATA
        }
      })
      
      const [isMounted, setIsMounted] = useState(false)
      useEffect(() => setIsMounted(true), [])

      // Modal state
      const [activeModalCardId, setActiveModalCardId] = useState<string | null>(null)

      // Drag and drop state
      const [draggingCardId, setDraggingCardId] = useState<string | null>(null)
      const [draggingColId, setDraggingColId] = useState<string | null>(null)

      // Inline Edit State
      const [editingCardId, setEditingCardId] = useState<string | null>(null)
      const [editingTitle, setEditingTitle] = useState<string>('')

      // Active Agent Dropdown state
      const [activeAgentDropdown, setActiveAgentDropdown] = useState<string | null>(null)
      const [newAssigneeName, setNewAssigneeName] = useState<string>('')
      const dropdownRef = useRef<HTMLDivElement>(null)

      // Column Edit State
      const [editingColId, setEditingColId] = useState<string | null>(null)
      const [editingColTitle, setEditingColTitle] = useState<string>('')

      // Handle clicking outside agent dropdown
      useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
          if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
            setActiveAgentDropdown(null)
          }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
      }, [])

      // Find active card for modal
      const getActiveCardData = () => {
        if (!activeModalCardId) return null
        for (const col of data.columns) {
          const card = col.cards.find(c => c.id === activeModalCardId)
          if (card) return { card, colId: col.id }
        }
        return null
      }

      const activeCardData = getActiveCardData()

      const saveData = (newData: KanbanData) => {
        setData(newData)
        if (isEditable) {
          props.editor.updateBlock(props.block.id, {
            type: 'kanban',
            props: { data: JSON.stringify(newData) }
          })
        }
      }

      useEffect(() => {
        const forceSave = () => {
          if (editingCardId) {
            const newData = { ...data }
            let found = false
            for (const col of newData.columns) {
              const card = col.cards.find(c => c.id === editingCardId)
              if (card) {
                card.title = editingTitle || 'Untitled'
                found = true
                break
              }
            }
            if (found) {
              saveData(newData)
              setEditingCardId(null)
            }
          }
        }
        window.addEventListener('AMEVA_FORCE_SAVE_BLOCKS', forceSave as EventListener)
        return () => window.removeEventListener('AMEVA_FORCE_SAVE_BLOCKS', forceSave as EventListener)
      }, [data, editingCardId, editingTitle, isEditable])

      const addCard = (colId: string) => {
        if (!isEditable) return
        const newData = { ...data }
        const col = newData.columns.find(c => c.id === colId)
        if (col) {
          const newCardId = `AMV-${newData.nextId++}`
          col.cards.push({
            id: newCardId,
            title: '',
            completed: false,
            priority: 'medium',
            assignee: null
          })
          saveData(newData)
          setEditingCardId(newCardId)
          setEditingTitle('')
        }
      }

      const addColumn = () => {
        if (!isEditable) return
        const newData = { ...data }
        const newColId = `col-${newData.nextId++}`
        newData.columns.push({
          id: newColId,
          title: 'New Column',
          cards: []
        })
        saveData(newData)
        setEditingColId(newColId)
        setEditingColTitle('New Column')
      }

      const deleteColumn = (colId: string) => {
        if (!isEditable) return
        const newData = { ...data }
        newData.columns = newData.columns.filter(c => c.id !== colId)
        saveData(newData)
      }

      const moveColumn = (index: number, direction: 'left' | 'right') => {
        if (!isEditable) return
        const newData = { ...data }
        if (direction === 'left' && index > 0) {
          const temp = newData.columns[index]
          newData.columns[index] = newData.columns[index - 1]
          newData.columns[index - 1] = temp
        } else if (direction === 'right' && index < newData.columns.length - 1) {
          const temp = newData.columns[index]
          newData.columns[index] = newData.columns[index + 1]
          newData.columns[index + 1] = temp
        }
        saveData(newData)
      }

      const toggleCardCompleted = (colId: string, cardId: string) => {
        if (!isEditable) return
        const newData = { ...data }
        const col = newData.columns.find(c => c.id === colId)
        if (col) {
          const card = col.cards.find(c => c.id === cardId)
          if (card) {
            card.completed = !card.completed
            saveData(newData)
          }
        }
      }

      const togglePriority = (colId: string, cardId: string) => {
        if (!isEditable) return
        const newData = { ...data }
        const col = newData.columns.find(c => c.id === colId)
        if (col) {
          const card = col.cards.find(c => c.id === cardId)
          if (card) {
            const priorities: Priority[] = ['low', 'medium', 'high']
            const nextIdx = (priorities.indexOf(card.priority) + 1) % priorities.length
            card.priority = priorities[nextIdx]
            saveData(newData)
          }
        }
      }

      const assignAgent = (colId: string, cardId: string, agent: any) => {
        if (!isEditable) return
        const newData = { ...data }
        const col = newData.columns.find(c => c.id === colId)
        if (col) {
          const card = col.cards.find(c => c.id === cardId)
          if (card) {
            card.assignee = { type: agent.type, name: agent.name, avatarColor: agent.avatarColor }
            saveData(newData)
          }
        }
        setActiveAgentDropdown(null)
      }

      // --- Drag and Drop Handlers ---
      const handleDragStart = (e: React.DragEvent, colId: string, cardId: string) => {
        if (!isEditable) {
          e.preventDefault()
          return
        }
        setDraggingColId(colId)
        setDraggingCardId(cardId)
        e.dataTransfer.effectAllowed = 'move'
        // Transparent drag image hack
        const img = new Image();
        img.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
        e.dataTransfer.setDragImage(img, 0, 0);
      }

      const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault()
        e.dataTransfer.dropEffect = 'move'
      }

      const handleDrop = (e: React.DragEvent, targetColId: string, targetCardId?: string) => {
        e.preventDefault()
        if (!isEditable || !draggingColId || !draggingCardId) return

        const newData = { ...data }
        const sourceCol = newData.columns.find(c => c.id === draggingColId)
        const targetCol = newData.columns.find(c => c.id === targetColId)
        
        if (!sourceCol || !targetCol) return

        const cardIndex = sourceCol.cards.findIndex(c => c.id === draggingCardId)
        if (cardIndex === -1) return
        
        const [movedCard] = sourceCol.cards.splice(cardIndex, 1)

        if (targetCardId) {
          const targetIndex = targetCol.cards.findIndex(c => c.id === targetCardId)
          targetCol.cards.splice(targetIndex, 0, movedCard)
        } else {
          targetCol.cards.push(movedCard)
        }

        saveData(newData)
        setDraggingColId(null)
        setDraggingCardId(null)
      }

      if (!isMounted) return null

      return (
        <>
        <div 
          contentEditable={false}
          style={{ 
            width: '100%', 
            maxWidth: '100%',
            overflowX: 'auto', 
            padding: '16px 0', 
            display: 'flex', 
            gap: '16px',
            userSelect: 'none'
          }}
        >
          {data.columns.map((col, i) => (
            <div 
              key={col.id}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, col.id)}
              style={{
                minWidth: '280px',
                width: '280px',
                flexShrink: 0,
                backgroundColor: 'var(--bg-glass)',
                border: '1px solid var(--border-muted)',
                borderRadius: '8px',
                padding: '12px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                height: 'fit-content'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {editingColId === col.id ? (
                    <input 
                      autoFocus
                      value={editingColTitle}
                      onChange={e => setEditingColTitle(e.target.value)}
                      onBlur={() => {
                        const newData = { ...data }
                        const c = newData.columns.find(x => x.id === col.id)
                        if (c) c.title = editingColTitle || 'Untitled'
                        saveData(newData)
                        setEditingColId(null)
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          const newData = { ...data }
                          const c = newData.columns.find(x => x.id === col.id)
                          if (c) c.title = editingColTitle || 'Untitled'
                          saveData(newData)
                          setEditingColId(null)
                        } else if (e.key === 'Escape') {
                          setEditingColId(null)
                        }
                      }}
                      style={{ fontSize: '12px', fontWeight: 600, padding: '2px 6px', borderRadius: '4px', border: '1px solid var(--primary)', backgroundColor: 'var(--bg-main)', color: 'var(--text-main)', outline: 'none', width: '120px' }}
                    />
                  ) : (
                    <span 
                      onClick={() => {
                        if (isEditable) {
                           setEditingColId(col.id)
                           setEditingColTitle(col.title)
                        }
                      }}
                      style={{ 
                        fontSize: '12px', 
                        fontWeight: 600, 
                        backgroundColor: 'rgba(33, 150, 243, 0.2)', 
                        color: '#2196f3',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        cursor: isEditable ? 'text' : 'default'
                      }}>
                      {col.title}
                    </span>
                  )}
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{col.cards.length}</span>
                </div>

                {isEditable && (
                  <div style={{ display: 'flex', gap: '2px' }}>
                    <button onClick={() => moveColumn(i, 'left')} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '2px' }} title="Move Left"><ArrowLeft size={14}/></button>
                    <button onClick={() => moveColumn(i, 'right')} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '2px' }} title="Move Right"><ArrowRight size={14}/></button>
                    <button onClick={() => deleteColumn(col.id)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#f44336', padding: '2px' }} title="Delete Column"><Trash2 size={14}/></button>
                  </div>
                )}
              </div>

              {col.cards.map(card => (
                <div
                  key={card.id}
                  draggable={isEditable}
                  onDragStart={(e) => handleDragStart(e, col.id, card.id)}
                  onDragOver={handleDragOver}
                  onDrop={(e) => {
                    e.stopPropagation()
                    handleDrop(e, col.id, card.id)
                  }}
                  style={{
                    backgroundColor: 'var(--bg-main)',
                    borderRadius: '8px',
                    padding: '12px',
                    marginBottom: '8px',
                    boxShadow: draggingCardId === card.id ? '0 10px 15px -3px rgba(0, 0, 0, 0.1)' : '0 1px 3px rgba(0,0,0,0.1)',
                    border: '1px solid var(--border-muted)',
                    cursor: isEditable ? 'grab' : 'pointer',
                    opacity: draggingCardId === card.id ? 0.5 : 1,
                    position: 'relative'
                  }}
                  onClick={() => {
                    if (isEditable) setActiveModalCardId(card.id)
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px', marginBottom: '8px' }}>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', flex: 1 }}>
                      <div 
                        onClick={(e) => { e.stopPropagation(); toggleCardCompleted(col.id, card.id) }} 
                        style={{ color: card.completed ? 'var(--primary)' : 'var(--text-muted)', cursor: 'pointer', marginTop: '2px' }}
                      >
                        {card.completed ? <CheckSquare size={16} /> : <Square size={16} />}
                      </div>
                      <div style={{ flex: 1, fontSize: '14px', color: card.completed ? 'var(--text-muted)' : 'var(--text-main)', textDecoration: card.completed ? 'line-through' : 'none' }}>
                        {card.title || 'Untitled'}
                      </div>
                    </div>
                  </div>
                  {card.description && (
                    <div style={{
                      fontSize: '12px', color: 'var(--text-muted)',
                      marginTop: '2px', marginBottom: '8px',
                      display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                      overflow: 'hidden', textOverflow: 'ellipsis',
                      whiteSpace: 'pre-wrap', opacity: 0.8
                    }}>
                      {card.description}
                    </div>
                  )}

                  {card.labels && card.labels.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', margin: '8px 0' }}>
                      {card.labels.map((label, idx) => (
                        <div key={idx} style={{ background: label.color, color: '#fff', fontSize: '10px', padding: '2px 6px', borderRadius: '10px' }}>
                          {label.text}
                        </div>
                      ))}
                    </div>
                  )}

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--text-muted)' }}>
                      <span>{card.id}</span>
                      <span style={{ cursor: isEditable ? 'pointer' : 'default', display: 'flex', alignItems: 'center', gap: '2px' }}>
                        <PriorityIcon priority={card.priority} />
                      </span>
                    </div>
                    
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      {card.assignee ? (
                        <div style={{
                          width: '24px', height: '24px', borderRadius: '50%',
                          backgroundColor: card.assignee.avatarColor, display: 'flex',
                          alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '12px'
                        }}>
                          {card.assignee.name.charAt(0).toUpperCase()}
                        </div>
                      ) : (
                        <div style={{
                          width: '24px', height: '24px', borderRadius: '50%',
                          backgroundColor: 'var(--bg-glass-active)', display: 'flex',
                          alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)'
                        }}>
                          <User size={14} />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {isEditable && (
                <button 
                  onClick={() => addCard(col.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '6px',
                    padding: '8px', background: 'transparent', border: 'none',
                    color: 'var(--text-muted)', cursor: 'pointer',
                    fontSize: '13px', marginTop: '4px',
                    borderRadius: '4px'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-glass-active)'}
                  onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <Plus size={14} /> Create
                </button>
              )}
            </div>
          ))}

          {isEditable && (
            <div
              onClick={addColumn}
              style={{
                minWidth: '280px',
                width: '280px',
                flexShrink: 0,
                backgroundColor: 'rgba(255, 255, 255, 0.03)',
                border: '1px dashed var(--border-muted)',
                borderRadius: '8px',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                cursor: 'pointer',
                color: 'var(--text-muted)',
                fontSize: '14px',
                height: '42px',
                marginTop: '0px',
                transition: 'all 0.2s'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--bg-glass-active)';
                e.currentTarget.style.color = 'var(--text-main)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.03)';
                e.currentTarget.style.color = 'var(--text-muted)';
              }}
            >
              <Plus size={16} style={{ marginRight: '8px' }} /> Add Column
            </div>
          )}
        </div>
        
        {activeModalCardId && activeCardData && createPortal(
          <KanbanModal 
            card={activeCardData.card}
            currentColId={activeCardData.colId}
            columns={data.columns}
            onClose={() => setActiveModalCardId(null)}
            onSave={(updatedCard, newColId) => {
              const oldColId = activeCardData.colId
              const newData = { ...data }
              const oldCol = newData.columns.find(c => c.id === oldColId)
              const newCol = newData.columns.find(c => c.id === newColId)
              
              if (oldCol && newCol) {
                if (oldColId === newColId) {
                  const idx = oldCol.cards.findIndex(c => c.id === updatedCard.id)
                  if (idx !== -1) oldCol.cards[idx] = updatedCard
                } else {
                  oldCol.cards = oldCol.cards.filter(c => c.id !== updatedCard.id)
                  newCol.cards.push(updatedCard)
                }
                saveData(newData)
              }
              setActiveModalCardId(null)
            }}
          />,
          document.body
        )}
        </>
      )
    },
    parse: (el) => {
      let a = el.tagName.toLowerCase() === 'a' ? el : el.querySelector('a')
      if (a) {
        const href = a.getAttribute('href')
        if (href && href.startsWith('ameva-kanban://data/')) {
          try {
            const dataStr = href.replace('ameva-kanban://data/', '')
            return { data: decodeURIComponent(dataStr) }
          } catch (e) {
            console.error('Failed to parse Kanban data from link', e)
          }
        }
      }
      return undefined
    },
    toExternalHTML: ({ block }) => {
      const dataStr = encodeURIComponent(block.props.data)
      return (
        <p>
          <a href={`ameva-kanban://data/${dataStr}`}>[AMEVA Kanban Board Data]</a>
        </p>
      )
    }
  }
)

export const KanbanBlock = KanbanBlockSpec()
