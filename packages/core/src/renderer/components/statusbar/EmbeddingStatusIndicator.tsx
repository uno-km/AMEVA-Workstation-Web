/**
 * 파일명: EmbeddingStatusIndicator.tsx
 * 역할: RAG 임베딩 상태를 표시하는 상태바 아이콘 컴포넌트
 */

// [React 및 외부 패키지 임포트]
import React, { CSSProperties } from 'react';

// [내부 모듈 임포트]
import { useEmbeddingEngine } from '../../features/rag-embedding';

interface EmbeddingStatusIndicatorProps {
  activeTooltip: string | null;
  handleMouseEnter: (e: React.MouseEvent<HTMLDivElement>, tooltipId: string) => void;
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
  const { status, progress, loadModel, startEmbedding, modelLoaded } = useEmbeddingEngine();

  // [상태별 표시 설정]
  let dotColor = '#f44336'; // idle, error (Red)
  let statusText = '임베딩 미실시';
  let tooltipText = '클릭하여 임베딩을 시작합니다.';

  if (status === 'loading-model' || status === 'embedding') {
    dotColor = '#ffeb3b'; // loading, embedding (Yellow)
    statusText = status === 'loading-model' ? `모델 로딩중... ${progress}%` : `임베딩 중... ${progress}%`;
    tooltipText = status === 'loading-model' ? '임베딩 모델을 로딩하고 있습니다.' : '텍스트를 벡터로 변환하는 중입니다.';
  } else if (status === 'ready') {
    dotColor = '#4caf50'; // ready (Green)
    statusText = 'AI 임베딩 완료';
    tooltipText = '임베딩이 성공적으로 완료되었습니다.';
  } else if (status === 'error') {
    statusText = '임베딩 오류';
    tooltipText = '임베딩 처리 중 오류가 발생했습니다.';
  }

  // [클릭 핸들러]
  const handleClick = () => {
    if (onActivate) {
      onActivate();
    }
    
    if (!modelLoaded) {
      loadModel();
    } else if (editorContent && (status === 'idle' || status === 'ready')) {
      // 문서 텍스트를 블록(단락) 단위로 분리하여 임베딩 시작
      const blocks = editorContent.split('\n').filter(line => line.trim().length > 0);
      startEmbedding(blocks);
    }
  };

  return (
    <div
      className="statusbar-item"
      onMouseEnter={(e) => handleMouseEnter(e, 'embedding')}
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
        <div className="tooltip" style={tooltipStyle}>
          {tooltipText}
        </div>
      )}
    </div>
  );
};
