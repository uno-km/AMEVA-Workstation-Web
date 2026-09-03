import React from 'react';
import { Loader2, Check } from 'lucide-react';
import { useDocumentSummaryStore } from '../../stores/useDocumentSummaryStore';
import { useTranslation } from '../../i18n/useTranslation';

export interface DocumentSummaryStatusIndicatorProps {
  activeTooltip: string | null;
  handleMouseEnter: (id: string) => void;
  handleMouseLeave: () => void;
  tooltipStyle: React.CSSProperties;
}

export const DocumentSummaryStatusIndicator: React.FC<DocumentSummaryStatusIndicatorProps> = ({
  activeTooltip,
  handleMouseEnter,
  handleMouseLeave,
  tooltipStyle,
}) => {
  const { t } = useTranslation();
  const { tasks, isDeckExpanded, toggleDeckExpanded } = useDocumentSummaryStore();
  const taskList = Object.values(tasks);

  // 등록된 요약 태스크가 없으면 렌더링 생략
  if (taskList.length === 0) {
    return null;
  }

  const runningCount = taskList.filter((t) => t.stage !== 'done' && t.stage !== 'error').length;
  const isRunning = runningCount > 0;

  return (
    <div
      style={{ position: 'relative', display: 'flex', alignItems: 'center' }}
      onMouseEnter={() => handleMouseEnter('doc-summary-deck')}
      onMouseLeave={handleMouseLeave}
    >
      <button
        onClick={toggleDeckExpanded}
        style={{
          background: isDeckExpanded
            ? 'rgba(59, 130, 246, 0.25)'
            : isRunning
            ? 'rgba(59, 130, 246, 0.15)'
            : 'transparent',
          border: isDeckExpanded
            ? '1px solid rgba(59, 130, 246, 0.5)'
            : isRunning
            ? '1px solid rgba(59, 130, 246, 0.35)'
            : '1px solid transparent',
          borderRadius: '4px',
          padding: '2px 6px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '5px',
          color: isRunning ? '#93c5fd' : '#10b981',
          fontSize: '11px',
          fontWeight: 600,
          transition: 'all 0.15s ease',
        }}
        title={t.statusBar.docSummaryDeck}
      >
        {isRunning ? (
          <Loader2 size={12} className="animate-spin" color="#60a5fa" />
        ) : (
          <Check size={12} color="#10b981" />
        )}

        <span style={{ color: isRunning ? '#e2e8f0' : 'var(--text-main)' }}>
          {isRunning ? t.statusBar.docSummaryRunning : t.statusBar.docSummaryDeck}
        </span>

        <span
          style={{
            fontSize: '9.5px',
            fontWeight: 700,
            background: isRunning ? '#2563eb' : '#059669',
            color: '#fff',
            padding: '0 4px',
            borderRadius: '6px',
            minWidth: '14px',
            textAlign: 'center',
          }}
        >
          {taskList.length}
        </span>
      </button>

      {/* 호버 툴팁 */}
      {activeTooltip === 'doc-summary-deck' && (
        <div style={{ ...tooltipStyle, bottom: '26px', right: 0, width: '180px' }}>
          <div style={{ fontWeight: 700, marginBottom: '2px', color: '#f8fafc' }}>
            {t.statusBar.docSummaryDeck}
          </div>
          <div style={{ fontSize: '10.5px', color: '#94a3b8' }}>
            {isRunning
              ? `${runningCount} summaries in progress...`
              : `${taskList.length} summaries completed`}
          </div>
        </div>
      )}
    </div>
  );
};
