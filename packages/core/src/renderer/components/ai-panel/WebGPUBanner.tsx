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

interface WebGPUBannerProps {
  isLLMReady: boolean;
  isModelLoading: boolean;
  downloadProgress: number;
  mainProgressText: string;
  onInit: () => void;
  onUnload: () => void;
}

export const WebGPUBanner: React.FC<WebGPUBannerProps> = ({
  isLLMReady,
  isModelLoading,
  downloadProgress,
  mainProgressText,
  onInit,
  onUnload
}) => {
  return (
    <div
      data-testid="webgpu-vram-banner"
      style={{
        padding: '8px 12px',
        background: isLLMReady
          ? 'rgba(16, 185, 129, 0.08)'
          : isModelLoading
          ? 'rgba(59, 130, 246, 0.12)'
          : 'rgba(139, 92, 246, 0.12)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        display: 'flex',
        flexDirection: 'column',
        gap: '4px',
        flexShrink: 0
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px' }}>
          <Cpu size={13} color={isLLMReady ? '#34d399' : '#a78bfa'} />
          <span
            data-testid="webgpu-status-text"
            style={{ fontWeight: 600, color: isLLMReady ? '#34d399' : '#e2e8f0' }}
          >
            {isLLMReady
              ? '⚡ GPU 가속 준비 완료 (Qwen2.5-3B)'
              : isModelLoading
              ? '⚡ WebGPU VRAM 가중치 로딩 중...'
              : '⚡ Qwen 2.5 3B (WebGPU)'}
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
              background: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              padding: '3px 8px',
              fontSize: '10px',
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: '0 2px 6px rgba(139, 92, 246, 0.3)'
            }}
          >
            GPU에 모델 올리기
          </button>
        )}
      </div>

      {isModelLoading && (
        <div data-testid="webgpu-progress-container">
          <div style={{
            height: '4px',
            width: '100%',
            background: 'rgba(255,255,255,0.1)',
            borderRadius: '2px',
            overflow: 'hidden',
            marginTop: '4px'
          }}>
            <div
              data-testid="webgpu-progress-bar"
              style={{
                height: '100%',
                width: `${Math.max(5, downloadProgress * 100)}%`,
                background: '#38bdf8',
                transition: 'width 0.2s ease'
              }}
            />
          </div>
          <div
            data-testid="webgpu-progress-text"
            style={{ fontSize: '9px', color: '#94a3b8', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
          >
            {mainProgressText || `GPU 가중치 다운로드 및 셰이더 컴파일 중 (${Math.round(downloadProgress * 100)}%)`}
          </div>
        </div>
      )}
    </div>
  );
};
