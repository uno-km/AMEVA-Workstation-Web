/**
 * 파일명: EmbeddingStatusIndicator.tsx
 * 역할: RAG 임베딩 상태를 표시하는 상태바 아이콘 컴포넌트
 */

import React, { CSSProperties, useState, useEffect, useRef } from 'react';
import { useEmbeddingEngine } from '../../features/rag-embedding';
import { Sparkles } from 'lucide-react';

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

  // 로딩 완료 미니 말풍선 상태 (2초 후 자동 소멸, 비간섭)
  const [showEmbeddingBubble, setShowEmbeddingBubble] = useState(false);
  const prevLoadedRef = useRef<boolean>(modelLoaded || status === 'ready');
  const timerRef = useRef<any>(null);

  useEffect(() => {
    const isNowReady = modelLoaded || status === 'ready';
    if (!prevLoadedRef.current && isNowReady) {
      setShowEmbeddingBubble(true);
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        setShowEmbeddingBubble(false);
      }, 2000);
    }
    prevLoadedRef.current = isNowReady;
  }, [modelLoaded, status]);

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
      {/* 2초 자동 소멸 미니 말풍선 */}
      {showEmbeddingBubble && (
        <div
          style={{
            position: 'absolute',
            bottom: 'calc(100% + 8px)',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(15, 23, 42, 0.94)',
            border: '1px solid rgba(16, 185, 129, 0.6)',
            boxShadow: '0 4px 16px rgba(16, 185, 129, 0.35), 0 2px 6px rgba(0,0,0,0.5)',
            backdropFilter: 'blur(8px)',
            color: '#34d399',
            fontSize: '11px',
            fontWeight: 700,
            padding: '3px 8px',
            borderRadius: '6px',
            whiteSpace: 'nowrap',
            pointerEvents: 'none',
            userSelect: 'none',
            zIndex: 99999,
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            animation: 'amevaToastFade 0.2s ease-out'
          }}
        >
          <Sparkles size={11} color="#34d399" />
          <span>임베딩 로딩 완료!</span>
          <div
            style={{
              position: 'absolute',
              top: '100%',
              left: '50%',
              transform: 'translateX(-50%)',
              width: 0,
              height: 0,
              borderLeft: '4px solid transparent',
              borderRight: '4px solid transparent',
              borderTop: '4px solid rgba(16, 185, 129, 0.6)'
            }}
          />
        </div>
      )}

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
