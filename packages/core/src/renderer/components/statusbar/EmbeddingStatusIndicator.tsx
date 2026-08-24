import React from 'react';
import type { CSSProperties } from 'react';
import { useEmbeddingEngine } from '../../features/rag-embedding';
import { Sparkles } from 'lucide-react';
import { UnobtrusiveToastBubble } from '../ui/UnobtrusiveToastBubble';
import { useConditionToast } from '../../hooks/useUnobtrusiveToast';
import { useTranslation } from '../../i18n/useTranslation';

interface EmbeddingStatusIndicatorProps {
  activeTooltip: string | null;
  handleMouseEnter: (tooltipId: string) => void;
  handleMouseLeave: () => void;
  tooltipStyle: CSSProperties;
  editorContent?: string;
  onActivate?: () => void;
}

export const EmbeddingStatusIndicator: React.FC<EmbeddingStatusIndicatorProps> = ({
  activeTooltip,
  handleMouseEnter,
  handleMouseLeave,
  tooltipStyle,
  editorContent,
  onActivate
}) => {
  const { t } = useTranslation();
  const { status, progress, initEngine, embedDocument, modelLoaded, chunks } = useEmbeddingEngine();

  // 추상화된 공통 비간섭 미니 말풍선 훅 연동
  const isNowReady = modelLoaded || status === 'ready';
  const { isVisible: isEmbeddingToastVisible } = useConditionToast(
    isNowReady,
    t.statusBar.embeddingToast,
    { variant: 'cyan', icon: <Sparkles size={11} color="#38bdf8" />, durationMs: 2000 }
  );

  let dotColor = '#f44336'; 
  let statusText = t.statusBar.embeddingIdle;
  let tooltipText = 'Click to initialize embedding engine.';

  if (status === 'loading-model' || status === 'embedding') {
    dotColor = '#ffeb3b';
    statusText = status === 'loading-model' ? `${t.statusBar.embeddingLoadingModel} ${progress}%` : `${t.statusBar.embeddingInProgress} ${progress}%`;
    tooltipText = status === 'loading-model' ? 'Loading embedding model into WebGPU...' : 'Vectorizing document text into embedding store...';
  } else if (status === 'ready') {
    dotColor = '#4caf50';
    statusText = t.statusBar.embeddingReady;
    const lastUpdate = chunks.length > 0 ? new Date(chunks[chunks.length - 1].timestamp).toLocaleTimeString() : '-';
    tooltipText = `Embedded chunks: ${chunks.length}\nLast updated: ${lastUpdate}`;
  } else if (status === 'error') {
    statusText = t.statusBar.embeddingError;
    tooltipText = 'An error occurred during embedding processing.';
  }

  const handleClick = () => {
    if (onActivate) {
      onActivate();
    }
    
    if (!modelLoaded) {
      initEngine();
    } else if (editorContent && (status === 'idle' || status === 'ready')) {
      embedDocument(editorContent);
    }
  };

  return (
    <div style={{ position: 'relative' }}>
      {/* 추상화된 비간섭 말풍선 컴포넌트 */}
      <UnobtrusiveToastBubble
        show={isEmbeddingToastVisible}
        message="임베딩 로딩 완료!"
        icon={<Sparkles size={11} color="#38bdf8" />}
        variant="cyan"
        placement="top"
        offset={8}
      />

      <div
        className="statusbar-item"
        onMouseEnter={() => handleMouseEnter('embedding')}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
        style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}
      >
        <div
          style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: dotColor,
          }}
        />
        <span>{statusText}</span>
        {activeTooltip === 'embedding' && (
          <div className="tooltip" style={{ ...tooltipStyle, whiteSpace: 'pre-line' }}>
            {tooltipText}
          </div>
        )}
      </div>
    </div>
  );
};
