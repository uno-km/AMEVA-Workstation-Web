/**
 * ============================================================================
 * @file EngineSettingsModal.tsx
 * @system AMEVA OS Desktop Workstation - UI Components
 * @location packages/core/src/renderer/components/ai-panel/EngineSettingsModal.tsx
 * @role AI Engine Configuration Popup (WebGPU vs Remote HTTP API)
 * ============================================================================
 */

import React, { useState } from 'react';
import { X, Sparkles, RotateCcw } from 'lucide-react';
import { SUPPORTED_WEBGPU_MODELS } from '../useWebLLM';
import { OllamaWizardService } from '../../services/llm/OllamaWizardService';
import { PromptComposerService } from '../../services/prompt/PromptComposerService';
import { PROMPT_PRESETS, DEFAULT_AGENT_PERSONA } from '../../services/prompt/LocalStoragePromptStorage';

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
  const [wizardMsg, setWizardMsg] = useState<string>('');
  const [customPersona, setCustomPersona] = useState<string>(() => {
    if (typeof localStorage !== 'undefined') {
      return localStorage.getItem('ameva_custom_system_prompt') || DEFAULT_AGENT_PERSONA;
    }
    return DEFAULT_AGENT_PERSONA;
  });
  const [promptSavedAlert, setPromptSavedAlert] = useState<boolean>(false);

  return (
    <div style={{
      position: 'absolute',
      top: '45px',
      left: '8px',
      right: '8px',
      maxHeight: 'calc(100vh - 120px)',
      overflowY: 'auto',
      background: '#1e1e24',
      border: '1px solid rgba(139, 92, 246, 0.4)',
      borderRadius: '8px',
      padding: '12px',
      zIndex: 100,
      boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
      fontSize: '11px'
    }}>
      <div style={{ fontWeight: 700, marginBottom: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>🔧 AI 엔진 & 프롬프트 설정 (Engine Config)</span>
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
                style={{ width: '100%', background: '#0f172a', color: '#fff', border: '1px solid #334155', borderRadius: '4px', padding: '4px', boxSizing: 'border-box' }}
              />
            </div>
            <div>
              <label style={{ color: '#94a3b8', display: 'block', marginBottom: '2px' }}>모델 이름 (Model Name):</label>
              <input
                type="text"
                value={apiModel}
                onChange={(e) => setApiModel(e.target.value)}
                placeholder="qwen2.5:3b"
                style={{ width: '100%', background: '#0f172a', color: '#fff', border: '1px solid #334155', borderRadius: '4px', padding: '4px', boxSizing: 'border-box' }}
              />
            </div>
            <div>
              <label style={{ color: '#94a3b8', display: 'block', marginBottom: '2px' }}>API Key (Ollama는 비워두세요):</label>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="sk-..."
                style={{ width: '100%', background: '#0f172a', color: '#fff', border: '1px solid #334155', borderRadius: '4px', padding: '4px', boxSizing: 'border-box' }}
              />
            </div>

            {/* Ollama One-Click Setup Wizard Box */}
            <div style={{
              background: 'linear-gradient(135deg, rgba(14, 165, 233, 0.15) 0%, rgba(59, 130, 246, 0.1) 100%)',
              border: '1px dashed rgba(56, 189, 248, 0.5)',
              borderRadius: '6px',
              padding: '8px',
              marginTop: '4px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span style={{ fontWeight: 700, color: '#38bdf8' }}>🚀 Ollama 원클릭 자동 세팅</span>
                <span style={{ fontSize: '9px', color: '#94a3b8' }}>설치·CORS·Qwen3B</span>
              </div>
              <div style={{ fontSize: '10px', color: '#cbd5e1', marginBottom: '6px' }}>
                컴퓨터에 Ollama가 없으신가요? 버튼을 누르면 설치부터 Qwen 모델 실행까지 원클릭으로 준비됩니다.
              </div>
              <button
                type="button"
                onClick={() => {
                  const result = OllamaWizardService.triggerAutoSetup(apiModel || 'qwen2.5:3b');
                  if (result.isMobile) {
                    setWizardMsg('📱 모바일은 [⚡ WebGPU 모드] 또는 클라우드 API Key를 사용해 주세요!');
                    return;
                  }
                  const osLabel = result.os === 'mac' ? 'macOS (.command)' : result.os === 'linux' ? 'Linux (.sh)' : 'Windows (.bat)';
                  setWizardMsg(`📥 ${osLabel} 스크립트 발급 완료! 실행하시면 자동 감지됩니다.`);
                  OllamaWizardService.startAutoConnectPolling(
                    () => {
                      setWizardMsg('🎉 Ollama 연결 성공! API 모드로 활성화되었습니다.');
                    },
                    (msg) => setWizardMsg(msg)
                  );
                }}
                style={{
                  width: '100%',
                  background: 'linear-gradient(135deg, #0ea5e9 0%, #2563eb 100%)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '4px',
                  padding: '5px 8px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontSize: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '4px'
                }}
              >
                📥 원클릭 자동 설치 & 실행 스크립트 받기
              </button>
              {wizardMsg && (
                <div style={{ fontSize: '9px', color: '#38bdf8', marginTop: '4px', textAlign: 'center' }}>
                  {wizardMsg}
                </div>
              )}
            </div>
          </>
        )}

        {/* System Prompt & Persona Customization Section */}
        <div style={{ marginTop: '4px', paddingTop: '8px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
            <span style={{ fontWeight: 700, color: '#a78bfa', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Sparkles size={11} /> 시스템 프롬프트 & 페르소나
            </span>
            <button
              type="button"
              onClick={async () => {
                await PromptComposerService.getInstance().getStorageStrategy().resetCustomPersona();
                setCustomPersona(DEFAULT_AGENT_PERSONA);
                setPromptSavedAlert(true);
                setTimeout(() => setPromptSavedAlert(false), 1500);
              }}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#94a3b8',
                cursor: 'pointer',
                fontSize: '10px',
                display: 'flex',
                alignItems: 'center',
                gap: '2px',
                padding: '2px 4px'
              }}
              title="기본값으로 복구"
            >
              <RotateCcw size={10} /> 기본값 초기화
            </button>
          </div>

          {/* Quick Presets */}
          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginBottom: '6px' }}>
            {PROMPT_PRESETS.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={async () => {
                  setCustomPersona(p.persona);
                  await PromptComposerService.getInstance().getStorageStrategy().saveCustomPersona(p.persona);
                  setPromptSavedAlert(true);
                  setTimeout(() => setPromptSavedAlert(false), 1500);
                }}
                style={{
                  background: customPersona.trim() === p.persona.trim() ? 'rgba(167, 139, 250, 0.25)' : 'rgba(255, 255, 255, 0.05)',
                  border: customPersona.trim() === p.persona.trim() ? '1px solid #a78bfa' : '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '4px',
                  color: customPersona.trim() === p.persona.trim() ? '#c4b5fd' : '#94a3b8',
                  padding: '2px 6px',
                  fontSize: '9.5px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '3px'
                }}
                title={p.description}
              >
                <span>{p.icon}</span>
                <span>{p.title}</span>
              </button>
            ))}
          </div>

          <textarea
            value={customPersona}
            onChange={async (e) => {
              const val = e.target.value;
              setCustomPersona(val);
              await PromptComposerService.getInstance().getStorageStrategy().saveCustomPersona(val);
            }}
            placeholder="AI의 성격, 전문 분야, 답변 스타일(지침)을 자유롭게 입력하세요..."
            rows={3}
            style={{
              width: '100%',
              background: '#0f172a',
              color: '#f8fafc',
              border: '1px solid #334155',
              borderRadius: '4px',
              padding: '6px 8px',
              fontSize: '10.5px',
              lineHeight: '1.4',
              resize: 'vertical',
              fontFamily: 'inherit',
              boxSizing: 'border-box'
            }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '2px' }}>
            <span style={{ fontSize: '9px', color: '#64748b' }}>
              💡 CoT 및 서식 안전 가드레일은 시스템에 의해 자동 유지됩니다.
            </span>
            {promptSavedAlert && (
              <span style={{ fontSize: '9px', color: '#34d399', fontWeight: 600 }}>
                ✓ 자동 저장됨
              </span>
            )}
          </div>
        </div>

        <div style={{ marginTop: '4px', paddingTop: '8px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#e2e8f0', cursor: 'pointer', fontSize: '11px' }}>
            <input
              type="checkbox"
              defaultChecked={typeof localStorage !== 'undefined' && localStorage.getItem('ameva_auto_load_llm') === 'true'}
              onChange={(e) => {
                localStorage.setItem('ameva_auto_load_llm', String(e.target.checked));
                try {
                  const stored = localStorage.getItem('app-settings');
                  if (stored) {
                    const parsed = JSON.parse(stored);
                    parsed.autoLoadAI = e.target.checked;
                    localStorage.setItem('app-settings', JSON.stringify(parsed));
                  }
                } catch {}
              }}
              style={{ cursor: 'pointer' }}
            />
            <span style={{ color: '#38bdf8', fontWeight: 600 }}>브라우저 시작 시 AI 모델 자동 로딩</span>
          </label>
        </div>
      </div>
    </div>
  );
};
