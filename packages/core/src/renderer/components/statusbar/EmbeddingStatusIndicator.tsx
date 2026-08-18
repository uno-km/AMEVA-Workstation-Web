/**
 * 파일명: EmbeddingStatusIndicator.tsx
 * 역할: RAG 임베딩 상태를 표시하는 상태바 아이콘 컴포넌트
 */

import React from 'react';
import type { CSSProperties } from 'react';
import { useEmbeddingEngine } from '../../features/rag-embedding';
import { Sparkles } from 'lucide-react';
import { UnobtrusiveToastBubble } from '../ui/UnobtrusiveToastBubble';
import { useConditionToast } from '../../hooks/useUnobtrusiveToast';

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
  const { status, progress, initEngine, embedDocument, modelLoaded, chunks } = useEmbeddingEngine();

  // 추상화된 공통 비간섭 미니 말풍선 훅 연동
  const isNowReady = modelLoaded || status === 'ready';
  const { isVisible: isEmbeddingToastVisible } = useConditionToast(
    isNowReady,
    '임베딩 로딩 완료!',
    { variant: 'cyan', icon: <Sparkles size={11} color="#38bdf8" />, durationMs: 2000 }
  );

  let dotColor = '#f44336'; 
  let statusText = '임베딩 미실시';
  let tooltipText = '클릭하여 임베딩을 시작합니다.';

  if (status === 'loading-model' || status === 'embedding') {
    dotColor = '#ffeb3b';
    statusText = status === 'loading-model' ? `모델 로딩 중... ${progress}%` : `임베딩 중... ${progress}%`;
    tooltipText = status === 'loading-model' ? '임베딩 모델을 로딩하고 있습니다.' : '텍스트를 벡터로 변환하는 중입니다.';
  } else if (status === 'ready') {
    dotColor = '#4caf50';
    statusText = 'AI RAG 준비됨';
    const lastUpdate = chunks.length > 0 ? new Date(chunks[chunks.length - 1].timestamp).toLocaleTimeString() : '없음';
    tooltipText = `임베딩된 청크 수: ${chunks.length}\n마지막 업데이트: ${lastUpdate}`;
  } else if (status === 'error') {
    statusText = '임베딩 오류';
    tooltipText = '임베딩 처리 중 오류가 발생했습니다.';
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
