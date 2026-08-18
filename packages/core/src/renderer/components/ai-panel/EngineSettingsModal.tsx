/**
 * ============================================================================
 * @file EngineSettingsModal.tsx
 * @system AMEVA OS Desktop Workstation - UI Components
 * @location packages/core/src/renderer/components/ai-panel/EngineSettingsModal.tsx
 * @role AI Engine Configuration Popup (WebGPU vs Remote HTTP API)
 * ============================================================================
 */

import React from 'react';
import { X } from 'lucide-react';
import { SUPPORTED_WEBGPU_MODELS } from '../useWebLLM';

interface EngineSettingsModalProps {
  engineMode: 'webgpu' | 'api';
  setEngineMode: (mode: 'webgpu' | 'api') => void;
  webgpuModel: string;
  setWebgpuModel: (model: string) => void;
  apiEndpoint: string;
  setApiEndpoint: (val: string) => void;
  apiModel: string;
  setApiModel: (val: string) => void;
  apiKey: string;
  setApiKey: (val: string) => void;
  onClose: () => void;
}

export const EngineSettingsModal: React.FC<EngineSettingsModalProps> = ({
  engineMode,
  setEngineMode,
  webgpuModel,
  setWebgpuModel,
  apiEndpoint,
  setApiEndpoint,
  apiModel,
  setApiModel,
  apiKey,
  setApiKey,
  onClose
}) => {
  return (
    <div style={{
      position: 'absolute',
      top: '50px',
      left: '10px',
      right: '10px',
      background: '#1e1e24',
      border: '1px solid rgba(139, 92, 246, 0.4)',
      borderRadius: '8px',
      padding: '12px',
      zIndex: 100,
      boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
      fontSize: '11px'
    }}>
      <div style={{ fontWeight: 700, marginBottom: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>🔧 AI 엔진 설정 (Engine Config)</span>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
          <X size={12} />
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div>
          <label style={{ color: '#94a3b8', display: 'block', marginBottom: '2px' }}>실행 엔진 선택:</label>
          <select
            value={engineMode}
            onChange={(e) => setEngineMode(e.target.value as any)}
            style={{ width: '100%', background: '#0f172a', color: '#fff', border: '1px solid #334155', borderRadius: '4px', padding: '4px' }}
          >
            <option value="webgpu">⚡ WebGPU 온디바이스 (In-Browser WebLLM)</option>
            <option value="api">🌐 HTTP API (Ollama / Cloud / DeepInfra / Local)</option>
          </select>
        </div>

        {engineMode === 'webgpu' && (
          <div>
            <label style={{ color: '#94a3b8', display: 'block', marginBottom: '2px' }}>WebGPU 모델 선택:</label>
            <select
              value={webgpuModel}
              onChange={(e) => setWebgpuModel(e.target.value)}
              style={{ width: '100%', background: '#0f172a', color: '#fff', border: '1px solid #334155', borderRadius: '4px', padding: '4px' }}
            >
              {SUPPORTED_WEBGPU_MODELS.map(m => (
                <option key={m.id} value={m.id}>
                  {m.label}
                </option>
              ))}
            </select>
            <div style={{ color: '#64748b', fontSize: '10px', marginTop: '3px' }}>
              💡 GPU 멈춤/오류 시 1.5B 또는 0.5B 초경량 모델을 권장합니다.
            </div>
          </div>
        )}

        {engineMode === 'api' && (
          <>
            <div>
              <label style={{ color: '#94a3b8', display: 'block', marginBottom: '2px' }}>API 엔드포인트 URL:</label>
              <input
                type="text"
                value={apiEndpoint}
                onChange={(e) => setApiEndpoint(e.target.value)}
                placeholder="http://localhost:11434/v1/chat/completions"
                style={{ width: '100%', background: '#0f172a', color: '#fff', border: '1px solid #334155', borderRadius: '4px', padding: '4px' }}
              />
            </div>
            <div>
              <label style={{ color: '#94a3b8', display: 'block', marginBottom: '2px' }}>모델명 (Model Name):</label>
              <input
                type="text"
                value={apiModel}
                onChange={(e) => setApiModel(e.target.value)}
                placeholder="qwen2.5:3b"
                style={{ width: '100%', background: '#0f172a', color: '#fff', border: '1px solid #334155', borderRadius: '4px', padding: '4px' }}
              />
            </div>
            <div>
              <label style={{ color: '#94a3b8', display: 'block', marginBottom: '2px' }}>API Key (선택):</label>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Bearer 토큰 (필요 시)"
                style={{ width: '100%', background: '#0f172a', color: '#fff', border: '1px solid #334155', borderRadius: '4px', padding: '4px' }}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
};
