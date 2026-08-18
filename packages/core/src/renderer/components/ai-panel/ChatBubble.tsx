/**
 * ============================================================================
 * @file ChatBubble.tsx
 * @system AMEVA OS Desktop Workstation - UI Components
 * @location packages/core/src/renderer/components/ai-panel/ChatBubble.tsx
 * @role Message Bubble with CoT Accordion, RAG Citation Chips, and data-testid
 * ============================================================================
 */

import React, { useState } from 'react';
import { Brain, ChevronDown, ChevronUp, ShieldCheck, Copy } from 'lucide-react';
import type { AgentMessage } from '../../features/ai-agent/types';
import { InsertPreviewCard } from './InsertPreviewCard';

interface ChatBubbleProps {
  message: AgentMessage;
  onCitationClick: (blockId?: string) => void;
  onApplySuggestion: (msgId: string, idx: number, suggestion: any) => void;
  onRejectSuggestion: (msgId: string, idx: number) => void;
}

export const ChatBubble: React.FC<ChatBubbleProps> = ({
  message: msg,
  onCitationClick,
  onApplySuggestion,
  onRejectSuggestion
}) => {
  const isUser = msg.role === 'user';
  const [thoughtOpen, setThoughtOpen] = useState(false);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div
      data-testid={isUser ? 'ai-user-message' : 'ai-assistant-message'}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: isUser ? 'flex-end' : 'flex-start',
        gap: '6px'
      }}
    >
      {/* 유저 태그된 블록 뱃지 */}
      {isUser && msg.taggedBlocks && msg.taggedBlocks.length > 0 && (
        <div
          data-testid="ai-tagged-blocks-badge"
          style={{
            fontSize: '10px',
            background: 'rgba(59, 130, 246, 0.15)',
            border: '1px solid rgba(59, 130, 246, 0.3)',
            color: '#93c5fd',
            padding: '2px 8px',
            borderRadius: '10px'
          }}
        >
          📌 {msg.taggedBlocks.length}개 블록 참조됨
        </div>
      )}

      {/* CoT 사고 과정 아코디언 (<think>) */}
      {!isUser && msg.thought && (
        <div
          data-testid="ai-thought-accordion"
          style={{
            width: '100%',
            maxWidth: '92%',
            background: 'rgba(139, 92, 246, 0.06)',
            border: '1px solid rgba(139, 92, 246, 0.2)',
            borderRadius: '8px',
            overflow: 'hidden',
            marginBottom: '4px'
          }}
        >
          <div
            data-testid="ai-thought-toggle-btn"
            onClick={() => setThoughtOpen(!thoughtOpen)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '6px 10px',
              cursor: 'pointer',
              fontSize: '10px',
              fontWeight: 600,
              color: '#c4b5fd',
              background: 'rgba(139, 92, 246, 0.1)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <Brain size={12} color="#a78bfa" />
              <span>AI 사고 과정 (Reasoning Trace)</span>
            </div>
            {thoughtOpen ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          </div>

          {thoughtOpen && (
            <div
              data-testid="ai-thought-content"
              style={{
                padding: '8px 10px',
                fontSize: '11px',
                color: '#94a3b8',
                lineHeight: '1.5',
                whiteSpace: 'pre-wrap',
                borderTop: '1px solid rgba(139, 92, 246, 0.1)',
                userSelect: 'text',
                cursor: 'text'
              }}
            >
              {msg.thought}
            </div>
          )}
        </div>
      )}

      {/* RAG 참조 출처 칩 */}
      {!isUser && msg.citations && msg.citations.length > 0 && (
        <div data-testid="ai-citations-container" style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginBottom: '4px' }}>
          {msg.citations.map((c, i) => (
            <button
              key={i}
              data-testid={`ai-citation-chip-${i}`}
              onClick={() => onCitationClick(c.blockId)}
              style={{
                background: 'rgba(16, 185, 129, 0.12)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                color: '#6ee7b7',
                padding: '2px 6px',
                borderRadius: '4px',
                fontSize: '9px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '3px'
              }}
              title={c.text}
            >
              <ShieldCheck size={9} />
              <span>[출처: {c.heading || '문서 본문'}]</span>
            </button>
          ))}
        </div>
      )}

      {/* 메시지 본문 말풍선 */}
      <div
        data-testid="ai-message-content"
        style={{
          maxWidth: '92%',
          padding: '10px 14px',
          borderRadius: isUser ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
          background: isUser
            ? 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)'
            : 'rgba(255, 255, 255, 0.05)',
          border: isUser ? 'none' : '1px solid rgba(255, 255, 255, 0.08)',
          color: '#f8fafc',
          fontSize: '12px',
          lineHeight: '1.6',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
          boxShadow: isUser ? '0 2px 8px rgba(139, 92, 246, 0.3)' : 'none',
          userSelect: 'text',
          cursor: 'text'
        }}
      >
        {msg.content || (msg.isStreaming ? '생각하는 중...' : '')}
      </div>

      {/* 블록 삽입 제안 카드들 */}
      {!isUser && msg.insertSuggestions && msg.insertSuggestions.map((ins, idx) => (
        <InsertPreviewCard
          key={idx}
          suggestion={ins}
          onApply={() => onApplySuggestion(msg.id, idx, ins)}
          onReject={() => onRejectSuggestion(msg.id, idx)}
        />
      ))}

      {/* 복사 버튼 */}
      {!isUser && msg.content && (
        <div style={{ display: 'flex', gap: '4px', marginTop: '2px' }}>
          <button
            data-testid="ai-copy-content-btn"
            onClick={() => copyToClipboard(msg.content)}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#64748b',
              fontSize: '10px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '2px',
              padding: '2px 4px'
            }}
            title="답변 복사"
          >
            <Copy size={10} /> 복사
          </button>
        </div>
      )}
    </div>
  );
};
