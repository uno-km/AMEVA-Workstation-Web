/**
 * ============================================================================
 * @file InsertPreviewCard.tsx
 * @system AMEVA OS Desktop Workstation - UI Components
 * @location packages/core/src/renderer/components/ai-panel/InsertPreviewCard.tsx
 * @role Interactive Block Insertion / Suggestion Preview Card with data-testid
 * ============================================================================
 */

import React from 'react';
import { Check, X } from 'lucide-react';
import type { InsertSuggestion } from '../../features/ai-agent/types';

interface InsertPreviewCardProps {
  suggestion: InsertSuggestion;
  onApply: () => void;
  onReject: () => void;
}

export const InsertPreviewCard: React.FC<InsertPreviewCardProps> = ({
  suggestion: ins,
  onApply,
  onReject
}) => {
  return (
    <div
      data-testid="ai-insert-preview-card"
      style={{
        width: '100%',
        maxWidth: '92%',
        marginTop: '4px',
        padding: '10px 12px',
        background: 'rgba(30, 41, 59, 0.8)',
        border: '1px solid rgba(59, 130, 246, 0.3)',
        borderRadius: '8px'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
        <span style={{ fontSize: '10px', fontWeight: 600, color: '#38bdf8' }}>
          📝 블록 삽입 제안 ({ins.blockType})
        </span>
        {ins.status === 'accepted' ? (
          <span data-testid="ai-insert-status-accepted" style={{ fontSize: '9px', color: '#10b981', fontWeight: 600 }}>✓ 반영됨</span>
        ) : ins.status === 'rejected' ? (
          <span data-testid="ai-insert-status-rejected" style={{ fontSize: '9px', color: '#ef4444', fontWeight: 600 }}>✕ 거절됨</span>
        ) : null}
      </div>

      <div
        data-testid="ai-insert-content"
        style={{ fontSize: '11px', color: '#cbd5e1', marginBottom: '8px', background: 'rgba(0,0,0,0.2)', padding: '6px', borderRadius: '4px' }}
      >
        {ins.content}
      </div>

      {ins.status === 'pending' && (
        <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
          <button
            data-testid="ai-insert-reject-btn"
            onClick={onReject}
            style={{
              background: 'transparent',
              border: '1px solid #475569',
              color: '#94a3b8',
              padding: '4px 8px',
              borderRadius: '4px',
              fontSize: '10px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '2px'
            }}
          >
            <X size={10} /> 거절
          </button>
          <button
            data-testid="ai-insert-apply-btn"
            onClick={onApply}
            style={{
              background: '#3b82f6',
              border: 'none',
              color: '#fff',
              padding: '4px 10px',
              borderRadius: '4px',
              fontSize: '10px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '2px'
            }}
          >
            <Check size={10} /> 에디터 삽입
          </button>
        </div>
      )}
    </div>
  );
};
