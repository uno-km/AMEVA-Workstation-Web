/**
 * ============================================================================
 * @file ChatBubble.tsx
 * @system AMEVA OS Desktop Workstation - UI Components
 * @location packages/core/src/renderer/components/ai-panel/ChatBubble.tsx
 * @role Message Bubble with CoT Accordion, RAG Citation Chips, Rich Code Blocks, and XML Sanitizer
 * ============================================================================
 */

import React, { useState } from 'react';
import { Brain, ChevronDown, ChevronUp, ShieldCheck, Copy, Zap, Check, X, Code2, Bookmark, Table } from 'lucide-react';
import type { AgentMessage, InsertSuggestion } from '../../features/ai-agent/types';
import { useWebLLM } from '../useWebLLM';

interface ChatCodeBlockProps {
  language: string;
  code: string;
  onInsert?: () => void;
}

export const ChatCodeBlock: React.FC<ChatCodeBlockProps> = ({
  language,
  code,
  onInsert
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getLangBadge = (lang: string) => {
    const l = (lang || '').toLowerCase().trim();
    if (l === 'python' || l === 'py') return 'Python';
    if (l === 'javascript' || l === 'js') return 'JavaScript';
    if (l === 'typescript' || l === 'ts') return 'TypeScript';
    if (l === 'sql') return 'SQL';
    if (l === 'html') return 'HTML';
    if (l === 'css') return 'CSS';
    if (l === 'json') return 'JSON';
    if (l === 'bash' || l === 'sh' || l === 'shell') return 'Shell';
    return lang ? lang.toUpperCase() : 'Code';
  };

  return (
    <div
      data-testid="ai-chat-code-block"
      style={{
        marginTop: '8px',
        marginBottom: '8px',
        background: '#090d16',
        border: '1px solid rgba(59, 130, 246, 0.3)',
        borderRadius: '8px',
        overflow: 'hidden',
        boxShadow: '0 4px 14px rgba(0, 0, 0, 0.45)',
        width: '100%'
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '6px 10px',
          background: 'rgba(30, 41, 59, 0.95)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)'
        }}
      >
        <span style={{ fontSize: '11px', fontWeight: 600, color: '#38bdf8' }}>
          {getLangBadge(language)}
        </span>
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
          {onInsert && (
            <button
              onClick={onInsert}
              style={{
                background: 'rgba(59, 130, 246, 0.15)',
                border: '1px solid rgba(59, 130, 246, 0.35)',
                color: '#60a5fa',
                fontSize: '10px',
                fontWeight: 600,
                padding: '2px 8px',
                borderRadius: '4px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
              title="에디터에 코드 블록으로 삽입"
            >
              <Code2 size={11} /> 에디터 삽입
            </button>
          )}
          <button
            onClick={handleCopy}
            style={{
              background: 'transparent',
              border: 'none',
              color: copied ? '#34d399' : '#94a3b8',
              fontSize: '10px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '3px',
              padding: '2px 4px'
            }}
            title="코드 복사"
          >
            {copied ? <Check size={11} /> : <Copy size={11} />}
            {copied ? '복사됨' : '복사'}
          </button>
        </div>
      </div>

      <pre
        style={{
          margin: 0,
          padding: '10px 12px',
          fontSize: '11.5px',
          fontFamily: "'Fira Code', 'JetBrains Mono', 'Consolas', 'Courier New', monospace",
          color: '#e2e8f0',
          lineHeight: '1.6',
          overflowX: 'auto',
          whiteSpace: 'pre',
          wordBreak: 'normal',
          background: 'transparent'
        }}
      >
        <code>{code}</code>
      </pre>
    </div>
  );
};

function cleanAllXmlTags(text: string): string {
  if (!text) return '';
  let res = text;
  // HTML <table>...</table>을 표준 마크다운 표 문법으로 변환
  res = res.replace(/<thead>\s*<tr>([\s\S]*?)<\/tr>\s*<\/thead>/gi, (_, trContent) => {
    const ths = trContent.match(/<th>([\s\S]*?)<\/th>/gi) || [];
    const headers = ths.map((th: string) => th.replace(/<\/?th>/gi, '').trim());
    if (headers.length === 0) return '';
    return `| ${headers.join(' | ')} |\n| ${headers.map(() => '---').join(' | ')} |\n`;
  });
  res = res.replace(/<tbody>\s*([\s\S]*?)\s*<\/tbody>/gi, (_, tbodyContent) => {
    const rows = tbodyContent.match(/<tr>([\s\S]*?)<\/tr>/gi) || [];
    return rows.map((r: string) => {
      const tds = r.match(/<td>([\s\S]*?)<\/td>/gi) || [];
      const cells = tds.map((td: string) => td.replace(/<\/?td>/gi, '').trim());
      return `| ${cells.join(' | ')} |`;
    }).join('\n');
  });

  // <insert ...>, </insert>, <blockId...>, </blockId>, <table>, <tr>, <td> 등 잔여 태그 완전 제거
  res = res.replace(/<\/?(table|thead|tbody|tr|th|td)(?:\s+[^>]*)?>/gi, '');
  res = res.replace(/<\/?insert(?:\s+[^>]*)?>/gi, '');
  res = res.replace(/<\/?blockId(?:\s+[^>]*)?>/gi, '');
  res = res.replace(/<\/?answer(?:\s+[^>]*)?>/gi, '');
  res = res.replace(/<\/?itemized-list(?:\s+[^>]*)?>/gi, '');
  res = res.replace(/<item(?:\s+[^>]*)?>\s*/gi, '- ');
  res = res.replace(/<\/item>\s*/gi, '\n');
  res = res.replace(/<li(?:\s+[^>]*)?>\s*/gi, '- ');
  res = res.replace(/<\/li>\s*/gi, '\n');
  res = res.replace(/\n{3,}/g, '\n\n');
  return res.trim();
}

interface ChatMarkdownTableProps {
  markdown: string;
  onInsert?: () => void;
}

export const ChatMarkdownTable: React.FC<ChatMarkdownTableProps> = ({ markdown, onInsert }) => {
  const lines = markdown.trim().split('\n').map(l => l.trim()).filter(Boolean);
  if (lines.length < 2) return <span style={{ whiteSpace: 'pre-wrap' }}>{markdown}</span>;

  const parseRow = (line: string) => {
    return line
      .replace(/^\|/, '')
      .replace(/\|$/, '')
      .split('|')
      .map(c => c.trim());
  };

  const headerCells = parseRow(lines[0]);
  const isDivider = (line: string) => /^\|?[\s\-:|]+\|?$/.test(line);
  const dataRows = lines.slice(1).filter(l => !isDivider(l)).map(parseRow);

  return (
    <div
      data-testid="ai-chat-table-block"
      style={{
        marginTop: '8px',
        marginBottom: '8px',
        background: '#090d16',
        border: '1px solid rgba(59, 130, 246, 0.3)',
        borderRadius: '8px',
        overflow: 'hidden',
        boxShadow: '0 4px 14px rgba(0, 0, 0, 0.45)',
        width: '100%'
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '6px 10px',
          background: 'rgba(30, 41, 59, 0.95)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)'
        }}
      >
        <span style={{ fontSize: '11px', fontWeight: 600, color: '#38bdf8' }}>📊 표 (Table)</span>
        {onInsert && (
          <button
            onClick={onInsert}
            style={{
              background: 'rgba(59, 130, 246, 0.15)',
              border: '1px solid rgba(59, 130, 246, 0.35)',
              color: '#60a5fa',
              fontSize: '10px',
              fontWeight: 600,
              padding: '2px 8px',
              borderRadius: '4px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
            title="에디터에 표로 삽입"
          >
            <Table size={11} /> 에디터 삽입
          </button>
        )}
      </div>
      <div style={{ overflowX: 'auto', padding: '6px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', color: '#e2e8f0' }}>
          <thead>
            <tr style={{ background: 'rgba(255, 255, 255, 0.06)', borderBottom: '1px solid rgba(255, 255, 255, 0.15)' }}>
              {headerCells.map((h, i) => (
                <th key={i} style={{ padding: '6px 10px', textAlign: 'left', fontWeight: 600, color: '#93c5fd' }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {dataRows.map((row, rIdx) => (
              <tr key={rIdx} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)', background: rIdx % 2 === 1 ? 'rgba(255, 255, 255, 0.02)' : 'transparent' }}>
                {row.map((cell, cIdx) => (
                  <td key={cIdx} style={{ padding: '6px 10px' }}>
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

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
          블록 삽입 제안 ({ins.blockType})
        </span>
        {ins.status === 'accepted' ? (
          <span data-testid="ai-insert-status-accepted" style={{ fontSize: '9px', color: '#10b981', fontWeight: 600 }}>반영됨</span>
        ) : ins.status === 'rejected' ? (
          <span data-testid="ai-insert-status-rejected" style={{ fontSize: '9px', color: '#ef4444', fontWeight: 600 }}>거절됨</span>
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
  const [copied, setCopied] = useState(false);
  const { initModel } = useWebLLM();
  const isGpuError = !isUser && (msg.content?.includes('GPU VRAM') || msg.content?.includes('WebGPU') || msg.content?.includes('초기화되었습니다'));

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const renderContentWithCodeBlocks = (raw: string) => {
    if (!raw) return msg.isStreaming ? '생각하는 중...' : '';
    const cleaned = cleanAllXmlTags(raw);

    const codeBlockRegex = /(```[\s\S]*?```)/g;
    const parts = cleaned.split(codeBlockRegex);

    return parts.map((part, idx) => {
      if (part.startsWith('```') && part.endsWith('```') && part.length >= 6) {
        const firstLineEnd = part.indexOf('\n');
        let lang = 'python';
        let code = '';

        if (firstLineEnd !== -1) {
          lang = part.slice(3, firstLineEnd).trim() || 'code';
          code = part.slice(firstLineEnd + 1, -3).replace(/\r\n/g, '\n');
        } else {
          code = part.slice(3, -3).replace(/\r\n/g, '\n');
        }

        return (
          <ChatCodeBlock
            key={idx}
            language={lang}
            code={code}
            onInsert={() => onApplySuggestion(msg.id, idx, {
              afterBlockId: 'END',
              blockType: 'codeBlock',
              content: code,
              props: { language: lang },
              status: 'pending'
            })}
          />
        );
      }

      if (!part.trim()) return null;

      // Check for markdown tables inside text
      const tableRegex = /(?:^|\n)(\|[^\n]+\|\n\|[\s\-:|]+\|\n(?:\|[^\n]+\|\n?)+)/g;
      const subParts = part.split(tableRegex);

      return subParts.map((sub, sIdx) => {
        if (/^\|[^\n]+\|\n\|[\s\-:|]+\|/.test(sub.trim())) {
          return (
            <ChatMarkdownTable
              key={`${idx}-${sIdx}`}
              markdown={sub}
              onInsert={() => onApplySuggestion(msg.id, idx * 100 + sIdx, {
                afterBlockId: 'END',
                blockType: 'table',
                content: sub.trim(),
                status: 'pending'
              })}
            />
          );
        }

        if (!sub.trim()) return null;

        return (
          <span key={`${idx}-${sIdx}`} style={{ whiteSpace: 'pre-wrap' }}>
            {sub}
          </span>
        );
      });
    });
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
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}
        >
          <Bookmark size={10} />
          <span>{msg.taggedBlocks.length}개 블록 참조됨</span>
        </div>
      )}

      {/* CoT 사고 과정 아코디언 (<think>) */}
      {!isUser && msg.thought && (
        <div
          data-testid="ai-thought-accordion"
          style={{
            width: '100%',
            maxWidth: '92%',
            background: 'rgba(59, 130, 246, 0.06)',
            border: '1px solid rgba(59, 130, 246, 0.2)',
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
              color: '#93c5fd',
              background: 'rgba(59, 130, 246, 0.1)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <Brain size={12} color="#38bdf8" />
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
                borderTop: '1px solid rgba(59, 130, 246, 0.1)',
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
            ? 'linear-gradient(135deg, #2563eb 0%, #06b6d4 100%)'
            : isGpuError
            ? 'rgba(239, 68, 68, 0.08)'
            : 'rgba(255, 255, 255, 0.05)',
          border: isUser ? 'none' : isGpuError ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid rgba(255, 255, 255, 0.08)',
          color: '#f8fafc',
          fontSize: '12px',
          lineHeight: '1.6',
          wordBreak: 'break-word',
          boxShadow: isUser ? '0 2px 8px rgba(37, 99, 235, 0.3)' : 'none',
          userSelect: 'text',
          cursor: 'text'
        }}
      >
        {isUser ? msg.content : renderContentWithCodeBlocks(msg.content)}
        
        {isGpuError && (
          <div style={{ marginTop: '10px', paddingTop: '8px', borderTop: '1px solid rgba(239, 68, 68, 0.2)' }}>
            <button
              onClick={() => {
                localStorage.setItem('ameva_selected_llm_model', 'Qwen2.5-0.5B-Instruct-q4f32_1-MLC');
                initModel('Qwen2.5-0.5B-Instruct-q4f32_1-MLC').catch(e => console.warn(e));
              }}
              style={{
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                color: '#fff',
                border: 'none',
                borderRadius: '6px',
                padding: '6px 12px',
                fontSize: '11px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 2px 8px rgba(16, 185, 129, 0.4)'
              }}
            >
              <Zap size={13} />
              0.5B 초경량 모델로 복구하기
            </button>
          </div>
        )}
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
        <div style={{ display: 'flex', gap: '4px', marginTop: '3px' }}>
          <button
            data-testid="ai-copy-content-btn"
            onClick={() => copyToClipboard(cleanAllXmlTags(msg.content))}
            style={{
              background: copied ? 'rgba(16, 185, 129, 0.15)' : 'transparent',
              border: copied ? '1px solid rgba(16, 185, 129, 0.35)' : '1px solid transparent',
              borderRadius: '4px',
              color: copied ? '#34d399' : '#64748b',
              fontSize: '10px',
              fontWeight: copied ? 600 : 400,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '2px 6px',
              transition: 'all 0.2s ease'
            }}
            title={copied ? "복사 완료!" : "답변 복사"}
          >
            {copied ? <Check size={11} color="#34d399" /> : <Copy size={10} />}
            <span>{copied ? '복사됨' : '복사'}</span>
          </button>
        </div>
      )}
    </div>
  );
};
