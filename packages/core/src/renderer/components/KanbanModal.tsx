import React, { useState, useEffect } from 'react'
import { X, AlignLeft, User, ChevronUp, Equal, ChevronDown, Tag, Plus, Check } from 'lucide-react'
import type { KanbanCard, KanbanColumn, Assignee, Priority } from './KanbanBlock'

export const AVAILABLE_AGENTS = [
  { name: 'Claude Agent', type: 'agent', avatarColor: '#d97757' },
  { name: 'Figma Agent', type: 'agent', avatarColor: '#ff7262' },
  { name: 'Cursor Agent', type: 'agent', avatarColor: '#000000' },
  { name: 'Marketing', type: 'human', avatarColor: '#4caf50' },
  { name: 'Design', type: 'human', avatarColor: '#9c27b0' }
]

interface KanbanModalProps {
  card: KanbanCard
  currentColId: string
  columns: KanbanColumn[]
  onClose: () => void
  onSave: (updatedCard: KanbanCard, newColId: string) => void
}

const PREDEFINED_COLORS = [
  '#ef4444', '#f97316', '#f59e0b', '#84cc16', '#22c55e', 
  '#06b6d4', '#3b82f6', '#8b5cf6', '#d946ef', '#64748b'
]

export const KanbanModal: React.FC<KanbanModalProps> = ({ card, currentColId, columns, onClose, onSave }) => {
  const [title, setTitle] = useState(card.title)
  const [description, setDescription] = useState(card.description || '')
  const [colId, setColId] = useState(currentColId)
  const [assignee, setAssignee] = useState<Assignee | null>(card.assignee)
  const [priority, setPriority] = useState<Priority>(card.priority)
  const [labels, setLabels] = useState<{text: string, color: string}[]>(card.labels || [])
  
  // UI states
  const [isLabelDropdownOpen, setIsLabelDropdownOpen] = useState(false)
  const [newLabelText, setNewLabelText] = useState('')
  const [newLabelColor, setNewLabelColor] = useState(PREDEFINED_COLORS[0])
  const [isAssigneeDropdownOpen, setIsAssigneeDropdownOpen] = useState(false)
  
  const handleSave = () => {
    onSave({
      ...card,
      title,
      description,
      assignee,
      priority,
      labels
    }, colId)
    onClose()
  }

  const addLabel = () => {
    if (newLabelText.trim()) {
      setLabels([...labels, { text: newLabelText.trim(), color: newLabelColor }])
      setNewLabelText('')
      setIsLabelDropdownOpen(false)
    }
  }

  const removeLabel = (index: number) => {
    setLabels(labels.filter((_, i) => i !== index))
  }

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 10000,
      backdropFilter: 'blur(8px)'
    }} onClick={onClose}>
      <div style={{
        backgroundColor: 'var(--bg-main, #18181c)',
        border: '1px solid var(--border-glow)',
        width: '800px',
        maxWidth: '90vw',
        maxHeight: '90vh',
        borderRadius: '12px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        color: 'var(--text-main)'
      }} onClick={e => e.stopPropagation()}>
        
        {/* Header */}
        <div style={{ 
          display: 'flex', alignItems: 'flex-start', padding: '24px 24px 16px',
          borderBottom: '1px solid var(--border-muted)'
        }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px', fontFamily: 'var(--font-mono)' }}>
              {card.id}
            </div>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              style={{
                fontSize: '20px', fontWeight: 600, color: 'var(--text-main)',
                border: 'none', background: 'transparent', width: '100%',
                outline: 'none', padding: '4px 8px', marginLeft: '-8px',
                borderRadius: '6px'
              }}
              onFocus={e => e.currentTarget.style.backgroundColor = 'var(--bg-glass-active)'}
              onBlur={e => e.currentTarget.style.backgroundColor = 'transparent'}
            />
          </div>
          <button onClick={onClose} style={{ 
            background: 'transparent', border: 'none', cursor: 'pointer',
            color: 'var(--text-muted)', padding: '4px', borderRadius: '4px'
          }}
          onMouseOver={e => e.currentTarget.style.backgroundColor = 'var(--bg-glass-active)'}
          onMouseOut={e => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <X size={20} />
          </button>
        </div>

        {/* Body Layout */}
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
          
          {/* Main Left Column (Description) */}
          <div style={{ flex: 1, padding: '24px', overflowY: 'auto', borderRight: '1px solid var(--border-muted)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', color: 'var(--text-main)', fontWeight: 600 }}>
              <AlignLeft size={18} /> Description
            </div>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Add a more detailed description..."
              style={{
                width: '100%', minHeight: '200px', resize: 'vertical',
                padding: '12px', borderRadius: '6px',
                border: '1px solid var(--border-muted)',
                background: 'var(--bg-deep)',
                color: 'var(--text-main)',
                fontSize: '14px', lineHeight: '1.5', outline: 'none'
              }}
              onFocus={e => {
                e.currentTarget.style.borderColor = 'var(--primary)';
              }}
              onBlur={e => {
                e.currentTarget.style.borderColor = 'var(--border-muted)';
              }}
            />
          </div>

          {/* Sidebar Right Column (Metadata) */}
          <div style={{ width: '280px', padding: '24px', overflowY: 'auto', background: 'var(--bg-card)' }}>
            
            {/* Status / Column */}
            <div style={{ marginBottom: '24px' }}>
              <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase' }}>
                Status
              </div>
              <select 
                value={colId} 
                onChange={e => setColId(e.target.value)}
                style={{
                  width: '100%', padding: '8px', borderRadius: '6px',
                  border: '1px solid var(--border-muted)',
                  background: 'var(--bg-deep)', color: 'var(--text-main)',
                  fontSize: '13px', outline: 'none', cursor: 'pointer'
                }}
              >
                {columns.map(c => (
                  <option key={c.id} value={c.id}>{c.title}</option>
                ))}
              </select>
            </div>

            {/* Assignee */}
            <div style={{ marginBottom: '24px', position: 'relative' }}>
              <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase' }}>
                Assignee
              </div>
              <div 
                onClick={() => setIsAssigneeDropdownOpen(!isAssigneeDropdownOpen)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '8px',
                  padding: '8px', borderRadius: '6px', cursor: 'pointer',
                  background: 'var(--bg-deep)',
                  border: '1px solid var(--border-muted)'
                }}
                onMouseOver={e => e.currentTarget.style.borderColor = 'var(--border-glow)'}
                onMouseOut={e => e.currentTarget.style.borderColor = 'var(--border-muted)'}
              >
                {assignee ? (
                  <>
                    <div style={{
                      width: '24px', height: '24px', borderRadius: '50%',
                      background: assignee.avatarColor, display: 'flex',
                      alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '12px'
                    }}>
                      {assignee.name.charAt(0).toUpperCase()}
                    </div>
                    <span style={{ fontSize: '13px', color: 'var(--text-main)' }}>{assignee.name}</span>
                  </>
                ) : (
                  <>
                    <div style={{
                      width: '24px', height: '24px', borderRadius: '50%',
                      background: 'var(--bg-glass-active)', display: 'flex',
                      alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)'
                    }}>
                      <User size={14} />
                    </div>
                    <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Unassigned</span>
                  </>
                )}
              </div>
              
              {isAssigneeDropdownOpen && (
                <div style={{
                  position: 'absolute', top: '100%', left: 0, width: '100%',
                  background: 'var(--bg-main)', border: '1px solid var(--border-muted)',
                  borderRadius: '6px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.5)',
                  marginTop: '4px', zIndex: 10, padding: '4px'
                }}>
                  <div 
                    onClick={() => { setAssignee(null); setIsAssigneeDropdownOpen(false) }}
                    style={{ padding: '6px 8px', fontSize: '13px', cursor: 'pointer', borderRadius: '4px' }}
                    onMouseOver={e => e.currentTarget.style.backgroundColor = 'var(--bg-glass-active)'}
                    onMouseOut={e => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    Unassigned
                  </div>
                  {AVAILABLE_AGENTS.map((agent, idx) => (
                    <div 
                      key={idx}
                      onClick={() => {
                        setAssignee({ type: agent.type as any, name: agent.name, avatarColor: agent.avatarColor });
                        setIsAssigneeDropdownOpen(false)
                      }}
                      style={{ 
                        padding: '6px 8px', fontSize: '13px', cursor: 'pointer', borderRadius: '4px',
                        display: 'flex', alignItems: 'center', gap: '8px'
                      }}
                      onMouseOver={e => e.currentTarget.style.backgroundColor = 'var(--bg-glass-active)'}
                      onMouseOut={e => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      <div style={{
                        width: '16px', height: '16px', borderRadius: '50%',
                        background: agent.avatarColor
                      }} />
                      {agent.name}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Priority */}
            <div style={{ marginBottom: '24px' }}>
              <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase' }}>
                Priority
              </div>
              <select 
                value={priority} 
                onChange={e => setPriority(e.target.value as Priority)}
                style={{
                  width: '100%', padding: '8px', borderRadius: '6px',
                  border: '1px solid var(--border-muted)',
                  background: 'var(--bg-deep)', color: 'var(--text-main)',
                  fontSize: '13px', outline: 'none', cursor: 'pointer'
                }}
              >
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>

            {/* Labels */}
            <div style={{ marginBottom: '24px' }}>
              <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Tag size={12} /> Labels
              </div>
              
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '8px' }}>
                {labels.map((label, idx) => (
                  <div key={idx} style={{
                    background: label.color, color: '#fff',
                    padding: '2px 8px', borderRadius: '12px', fontSize: '12px',
                    display: 'flex', alignItems: 'center', gap: '4px'
                  }}>
                    {label.text}
                    <X size={10} style={{ cursor: 'pointer', opacity: 0.8 }} onClick={() => removeLabel(idx)} />
                  </div>
                ))}
              </div>

              <div style={{ position: 'relative' }}>
                <button 
                  onClick={() => setIsLabelDropdownOpen(!isLabelDropdownOpen)}
                  style={{
                    background: 'var(--bg-glass)', border: '1px solid var(--border-muted)',
                    padding: '4px 8px', borderRadius: '4px', cursor: 'pointer',
                    fontSize: '12px', color: 'var(--text-muted)',
                    display: 'flex', alignItems: 'center', gap: '4px'
                  }}
                  onMouseOver={e => e.currentTarget.style.background = 'var(--bg-glass-active)'}
                  onMouseOut={e => e.currentTarget.style.background = 'var(--bg-glass)'}
                >
                  <Plus size={12} /> Add Label
                </button>

                {isLabelDropdownOpen && (
                  <div style={{
                    position: 'absolute', top: '100%', left: 0, width: '220px',
                    background: 'var(--bg-main)', border: '1px solid var(--border-muted)',
                    borderRadius: '6px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.5)',
                    marginTop: '4px', zIndex: 10, padding: '12px'
                  }}>
                    <input 
                      type="text" 
                      placeholder="Label text..."
                      value={newLabelText}
                      onChange={e => setNewLabelText(e.target.value)}
                      style={{
                        width: '100%', padding: '6px', fontSize: '12px',
                        border: '1px solid var(--border-muted)', borderRadius: '4px',
                        marginBottom: '8px', background: 'var(--bg-deep)', color: 'var(--text-main)',
                        outline: 'none'
                      }}
                    />
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '12px' }}>
                      {PREDEFINED_COLORS.map(color => (
                        <div 
                          key={color}
                          onClick={() => setNewLabelColor(color)}
                          style={{
                            width: '20px', height: '20px', borderRadius: '4px', background: color,
                            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
                          }}
                        >
                          {newLabelColor === color && <Check size={12} color="#fff" />}
                        </div>
                      ))}
                    </div>
                    <button 
                      onClick={addLabel}
                      style={{
                        width: '100%', padding: '6px', background: 'var(--primary)',
                        color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer',
                        fontSize: '12px', fontWeight: 600
                      }}
                    >
                      Create
                    </button>
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
        
        {/* Footer Actions */}
        <div style={{
          padding: '16px 24px', borderTop: '1px solid var(--border-muted)',
          display: 'flex', justifyContent: 'flex-end', gap: '12px', background: 'var(--bg-main)'
        }}>
          <button 
            onClick={onClose}
            style={{
              padding: '8px 16px', borderRadius: '6px', border: '1px solid var(--border-muted)',
              background: 'transparent', color: 'var(--text-muted)',
              cursor: 'pointer', fontSize: '14px', fontWeight: 500
            }}
            onMouseOver={e => e.currentTarget.style.backgroundColor = 'var(--bg-glass-active)'}
            onMouseOut={e => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            Cancel
          </button>
          <button 
            onClick={handleSave}
            style={{
              padding: '8px 16px', borderRadius: '6px', border: 'none',
              background: 'var(--primary)', color: '#ffffff',
              cursor: 'pointer', fontSize: '14px', fontWeight: 500
            }}
            onMouseOver={e => e.currentTarget.style.opacity = '0.9'}
            onMouseOut={e => e.currentTarget.style.opacity = '1'}
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  )
}
