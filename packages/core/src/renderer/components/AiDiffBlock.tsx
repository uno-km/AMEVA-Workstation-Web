import React from 'react'
import { createReactBlockSpec } from '@blocknote/react'
import { Sparkles, Check, X, ArrowDown } from 'lucide-react'

export const AiDiffBlockSpec = createReactBlockSpec(
  {
    type: 'aiDiff',
    propSchema: {
      originalBlockJson: { default: '' },
      originalText: { default: '' },
      suggestedText: { default: '' },
      mode: { default: 'tone' },
    },
    content: 'none'
  },
  {
    render: (props) => {
      const { originalBlockJson, originalText, suggestedText, mode } = props.block.props
      
      const handleAccept = () => {
        // Replace this block with a standard paragraph containing suggestedText
        props.editor.updateBlock(props.block.id, { 
          type: 'paragraph', 
          content: suggestedText,
          props: {} as any // Reset props to default paragraph props
        })
      }
      
      const handleDiscard = () => {
        // Restore original block from JSON snapshot
        try {
          const orig = JSON.parse(originalBlockJson)
          props.editor.updateBlock(props.block.id, orig)
        } catch(e) {
          console.error("Failed to restore original block", e)
          props.editor.removeBlocks([props.block.id])
        }
      }
      
      const handleKeepBoth = () => {
        try {
          const orig = JSON.parse(originalBlockJson)
          props.editor.updateBlock(props.block.id, orig)
          props.editor.insertBlocks([{ type: 'paragraph', content: suggestedText }], props.block.id, 'after')
        } catch(e) {
          console.error("Failed to keep both", e)
        }
      }

      return (
        <div contentEditable={false} style={{
          width: '100%',
          background: 'rgba(24, 24, 27, 0.4)',
          border: '1px solid rgba(139, 92, 246, 0.4)',
          borderRadius: '8px',
          padding: '12px',
          margin: '8px 0',
          boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          fontFamily: 'var(--font-sans)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#a855f7', fontSize: '11px', fontWeight: 600 }}>
            <Sparkles size={12} />
            {mode === 'tone' ? 'AMEVA AI 톤 다듬기 제안' : 'AMEVA AI 요약 제안'}
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {/* Original Text */}
            <div style={{
              padding: '8px 10px',
              background: 'rgba(239, 68, 68, 0.05)',
              borderLeft: '3px solid #ef4444',
              borderRadius: '0 4px 4px 0',
              color: 'var(--text-muted)',
              fontSize: '13px',
              textDecoration: 'line-through',
              whiteSpace: 'pre-wrap',
            }}>
              {originalText || '(빈 텍스트)'}
            </div>
            
            {/* Suggested Text */}
            <div style={{
              padding: '8px 10px',
              background: 'rgba(16, 185, 129, 0.05)',
              borderLeft: '3px solid #10b981',
              borderRadius: '0 4px 4px 0',
              color: 'var(--text-main)',
              fontSize: '13px',
              whiteSpace: 'pre-wrap',
            }}>
              {suggestedText || <span style={{ opacity: 0.5 }}>AI가 응답을 생성하고 있습니다...</span>}
              <span className="ai-cursor" style={{ 
                display: 'inline-block', width: '4px', height: '14px', background: '#10b981', marginLeft: '4px', verticalAlign: 'middle',
              }} />
              <style>{`
                @keyframes aiBlink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }
                .ai-cursor { animation: aiBlink 1s step-end infinite; }
              `}</style>
            </div>
          </div>
          
          <div style={{ display: 'flex', gap: '8px', marginTop: '4px', justifyContent: 'flex-end' }}>
            <button 
              onClick={handleAccept} 
              onMouseOver={(e) => e.currentTarget.style.background = 'rgba(16, 185, 129, 0.25)'}
              onMouseOut={(e) => e.currentTarget.style.background = 'rgba(16, 185, 129, 0.15)'}
              style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 10px', borderRadius: '4px', border: '1px solid rgba(16, 185, 129, 0.3)', background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', cursor: 'pointer', fontSize: '11px', fontWeight: 600, transition: 'background 0.2s' }}>
              <Check size={12} /> 수락
            </button>
            <button 
              onClick={handleKeepBoth} 
              onMouseOver={(e) => e.currentTarget.style.background = 'rgba(59, 130, 246, 0.25)'}
              onMouseOut={(e) => e.currentTarget.style.background = 'rgba(59, 130, 246, 0.15)'}
              style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 10px', borderRadius: '4px', border: '1px solid rgba(59, 130, 246, 0.3)', background: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6', cursor: 'pointer', fontSize: '11px', fontWeight: 600, transition: 'background 0.2s' }}>
              <ArrowDown size={12} /> 둘 다 쓰기
            </button>
            <button 
              onClick={handleDiscard} 
              onMouseOver={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.25)'}
              onMouseOut={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.15)'}
              style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 10px', borderRadius: '4px', border: '1px solid rgba(239, 68, 68, 0.3)', background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', cursor: 'pointer', fontSize: '11px', fontWeight: 600, transition: 'background 0.2s' }}>
              <X size={12} /> 취소
            </button>
          </div>
        </div>
      )
    }
  }
)

export const AiDiffBlock = AiDiffBlockSpec()
