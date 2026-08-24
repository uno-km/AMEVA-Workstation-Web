/**
 * ============================================================================
 * @file WebGPUBanner.tsx
 * @system AMEVA OS Desktop Workstation - UI Components
 * @location packages/core/src/renderer/components/ai-panel/WebGPUBanner.tsx
 * @role WebGPU VRAM Loading, Progress, and Unload Control Banner with data-testid
 * ============================================================================
 */

import React from 'react';
import { Cpu } from 'lucide-react';
import { SUPPORTED_WEBGPU_MODELS } from '../useWebLLM';

interface WebGPUBannerProps {
  isLLMReady: boolean;
  isModelLoading: boolean;
  downloadProgress: number;
  mainProgressText: string;
  activeModelId?: string;
  onInit: () => void;
  onUnload: () => void;
}

export const WebGPUBanner: React.FC<WebGPUBannerProps> = ({
  isLLMReady,
  isModelLoading,
  downloadProgress,
  mainProgressText,
  activeModelId,
  onInit,
  onUnload
}) => {
  const modelMeta = SUPPORTED_WEBGPU_MODELS.find(m => m.id === activeModelId);
  const shortModelLabel = modelMeta?.label.split(' ')[0] || 'Qwen2.5';

  return (
    <div
      data-testid="webgpu-vram-banner"
      style={{
        padding: '8px 12px',
        background: isLLMReady
          ? 'rgba(16, 185, 129, 0.08)'
          : isModelLoading
          ? 'rgba(59, 130, 246, 0.12)'
          : 'rgba(59, 130, 246, 0.12)',
        borderBottom: '1px solid var(--border-muted)',
        display: 'flex',
        flexDirection: 'column',
        gap: '4px',
        flexShrink: 0
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px' }}>
          <Cpu size={13} color={isLLMReady ? '#34d399' : 'var(--primary)'} />
          <span
            data-testid="webgpu-status-text"
            style={{ fontWeight: 600, color: isLLMReady ? '#34d399' : 'var(--text-main)' }}
          >
            {isLLMReady
              ? `⚡ GPU 가속 준비 완료 (${shortModelLabel})`
              : isModelLoading
              ? '⚡ WebGPU VRAM 가중치 로딩 중...'
              : `⚡ ${shortModelLabel} (WebGPU)`}
          </span>
        </div>

        {isLLMReady && (
          <button
            data-testid="webgpu-unload-btn"
            onClick={onUnload}
            style={{
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#f87171',
              borderRadius: '4px',
              padding: '3px 8px',
              fontSize: '10px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
            title="GPU 메모리(VRAM)에서 모델 언로드 및 메모리 반환"
          >
            VRAM 해제
          </button>
        )}

        {!isLLMReady && !isModelLoading && (
          <button
            data-testid="webgpu-load-btn"
            onClick={onInit}
            style={{
              background: 'linear-gradient(135deg, #2563eb 0%, #06b6d4 100%)',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              padding: '3px 8px',
              fontSize: '10px',
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: '0 2px 6px rgba(37, 99, 235, 0.3)'
            }}
          >
            GPU에 모델 올리기
          </button>
        )}
      </div>

      {isModelLoading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#94a3b8' }}>
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '200px' }}>
              {mainProgressText}
            </span>
            <span>{Math.round(downloadProgress * 100)}%</span>
          </div>
          <div style={{ height: '3px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', overflow: 'hidden' }}>
            <div
              style={{
                height: '100%',
                width: `${downloadProgress * 100}%`,
                background: 'linear-gradient(90deg, #3b82f6, #06b6d4)',
                transition: 'width 0.2s'
              }}
            />
          </div>
        </div>
      )}

      {!isLLMReady && !isModelLoading && mainProgressText && (
        <div style={{
          fontSize: '9.5px',
          color: mainProgressText.includes('재설정') || mainProgressText.includes('실패') ? '#fbbf24' : '#94a3b8',
          lineHeight: '1.4',
          marginTop: '2px',
          padding: '4px 6px',
          background: 'rgba(0,0,0,0.2)',
          borderRadius: '4px'
        }}>
          {mainProgressText}
        </div>
      )}
    </div>
  );
};
