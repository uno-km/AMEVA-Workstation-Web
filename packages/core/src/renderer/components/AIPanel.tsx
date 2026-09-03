/**
 * ============================================================================
 * @file AIPanel.tsx
 * @system AMEVA OS Desktop Workstation - Client Renderer
 * @location packages/core/src/renderer/components/AIPanel.tsx
 * @role Modular Hexagonal AI Agent Chatbot & RAG Assistant Container with data-testid
 * ============================================================================
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Sparkles, Send, Square, Trash2, FileText, Wand2, Table, BookOpen,
  ArrowRight, Settings, Cpu, X
} from 'lucide-react';
import { useAIAgentStore } from '../features/ai-agent/core/useAIAgentStore';
import { AgentOrchestrator } from '../features/ai-agent/core/AgentOrchestrator';
import { WebLLMEngineAdapter } from '../features/ai-agent/adapters/WebLLMEngineAdapter';
import { RemoteHttpEngineAdapter } from '../features/ai-agent/adapters/RemoteHttpEngineAdapter';
import { LocalRAGRetrieverAdapter } from '../features/ai-agent/adapters/LocalRAGRetrieverAdapter';
import { editorToolAdapter } from '../features/ai-agent/adapters/EditorToolAdapter';
import { useWebLLM, DEFAULT_WEBGPU_MODEL } from './useWebLLM';
import { useWorkspaceStore } from '../stores/useWorkspaceStore';
import type { InsertSuggestion } from '../features/ai-agent/types';

import { ChatBubble } from './ai-panel/ChatBubble';
import { WebGPUBanner } from './ai-panel/WebGPUBanner';
import { EngineSettingsModal } from './ai-panel/EngineSettingsModal';

import { OllamaWizardService } from '../services/llm/OllamaWizardService';
import { useTranslation } from '../i18n/useTranslation';

export function AIPanel() {
  const { t } = useTranslation();
  const {
    messages,
    isStreaming,
    clearMessages,
    updateInsertSuggestionStatus
  } = useAIAgentStore();

  const quickActions = [
    { id: 'summarize', icon: FileText, label: t.aiPanel.quickActions.summarize, prompt: t.aiPanel.quickActions.summarizePrompt },
    { id: 'improve', icon: Wand2, label: t.aiPanel.quickActions.improve, prompt: t.aiPanel.quickActions.improvePrompt },
    { id: 'rag-search', icon: BookOpen, label: t.aiPanel.quickActions.ragSearch, prompt: t.aiPanel.quickActions.ragSearchPrompt },
    { id: 'table', icon: Table, label: t.aiPanel.quickActions.table, prompt: t.aiPanel.quickActions.tablePrompt }
  ];

  const taggedBlocks = useWorkspaceStore(s => s.taggedBlocks);
  const clearTaggedBlocks = useWorkspaceStore(s => s.clearTaggedBlocks);
  const activeEditorInstance = useWorkspaceStore(s => s.activeEditorInstance);
  const {
    generateStream,
    isMainReady: isLLMReady,
    isMainLoading: isModelLoading,
    mainProgress: downloadProgress,
    mainProgressText,
    activeModelId,
    initModel,
    unloadModel
  } = useWebLLM();

  const [input, setInput] = useState('');
  const [activeTab, setActiveTab] = useState<'chat' | 'outline'>('chat');
  const [engineMode, setEngineMode] = useState<'webgpu' | 'api'>('webgpu');
  const [webgpuModel, setWebgpuModel] = useState(() => {
    const saved = localStorage.getItem('ameva_selected_llm_model');
    if (!saved || saved.includes('q4f16') || saved.includes('3B')) {
      localStorage.setItem('ameva_selected_llm_model', DEFAULT_WEBGPU_MODEL);
      return DEFAULT_WEBGPU_MODEL;
    }
    return saved;
  });
  const [showSettings, setShowSettings] = useState(false);
  const [showOllamaPrompt, setShowOllamaPrompt] = useState(false);
  const [ollamaPromptMsg, setOllamaPromptMsg] = useState('');

  // API Config State
  const [apiEndpoint, setApiEndpoint] = useState('http://localhost:11434/v1/chat/completions');
  const [apiModel, setApiModel] = useState('qwen2.5:1.5b');
  const [apiKey, setApiKey] = useState('');

  const [outline, setOutline] = useState<Array<{ id: string; text: string; level: number }>>([]);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const orchestratorRef = useRef<AgentOrchestrator | null>(null);
  const httpAdapterRef = useRef<RemoteHttpEngineAdapter>(new RemoteHttpEngineAdapter());

  const handleEngineModeToggle = async () => {
    if (engineMode === 'webgpu') {
      // 로컬 엔드포인트일 때 Ollama 헬스체크
      if (apiEndpoint.includes('localhost') || apiEndpoint.includes('127.0.0.1')) {
        const isAlive = await OllamaWizardService.checkOllamaHealth();
        if (!isAlive) {
          setShowOllamaPrompt(true);
          return;
        }
      }
      setEngineMode('api');
    } else {
      setEngineMode('webgpu');
    }
  };

  // Sync editor with EditorToolAdapter
  useEffect(() => {
    if (activeEditorInstance) {
      editorToolAdapter.setEditor(activeEditorInstance);
    }
  }, [activeEditorInstance]);

  // Initialize & Switch Orchestrator Engine Adapter
  useEffect(() => {
    const webLLMAdapter = new WebLLMEngineAdapter(
      (sys, user, opt) => generateStream(sys, user, opt),
      isLLMReady
    );
    httpAdapterRef.current.setConfig({ endpoint: apiEndpoint, model: apiModel, apiKey });

    const activeAdapter = engineMode === 'webgpu' ? webLLMAdapter : httpAdapterRef.current;
    const ragAdapter = new LocalRAGRetrieverAdapter();

    orchestratorRef.current = new AgentOrchestrator(
      activeAdapter,
      ragAdapter,
      editorToolAdapter
    );
  }, [generateStream, isLLMReady, engineMode, apiEndpoint, apiModel, apiKey]);

  // Auto-scroll to bottom on message update
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isStreaming]);

  // Extract outline from editor
  useEffect(() => {
    if (activeEditorInstance && activeTab === 'outline') {
      try {
        const blocks = activeEditorInstance.document || [];
        const headings: Array<{ id: string; text: string; level: number }> = [];
        blocks.forEach((b: any) => {
          if (b.type === 'heading') {
            const txt = Array.isArray(b.content)
              ? b.content.map((c: any) => c.text || '').join('')
              : (b.content || '');
            headings.push({
              id: b.id,
              text: txt || '(제목 없음)',
              level: b.props?.level || 1
            });
          }
        });
        setOutline(headings);
      } catch (err) {
        console.warn('[AIPanel] Failed to extract outline:', err);
      }
    }
  }, [activeEditorInstance, activeTab]);

  const handleSend = useCallback(async (promptToSend?: string) => {
    const text = (promptToSend || input).trim();
    if (!text || isStreaming) return;

    if (engineMode === 'webgpu' && !isLLMReady && !isModelLoading) {
      try {
        await initModel(webgpuModel);
      } catch (err) {
        console.warn('[AIPanel] WebGPU model init failed, delegating to orchestrator error report:', err);
      }
    }

    setInput('');
    const tagged = taggedBlocks.length > 0 ? [...taggedBlocks] : undefined;
    clearTaggedBlocks();

    if (orchestratorRef.current) {
      await orchestratorRef.current.processUserPrompt(text, tagged);
    }
  }, [input, isStreaming, taggedBlocks, clearTaggedBlocks, engineMode, isLLMReady, isModelLoading, initModel, webgpuModel]);

  // Global event listener for external triggers (e.g. DocumentProfileModal 'AI로 상세분석하기')
  useEffect(() => {
    const handler = (e: any) => {
      const prompt = e.detail?.prompt;
      if (prompt) {
        handleSend(prompt);
      }
    };
    window.addEventListener('ameva:trigger-ai-prompt', handler);
    return () => window.removeEventListener('ameva:trigger-ai-prompt', handler);
  }, [handleSend]);

  const handleAbort = useCallback(() => {
    orchestratorRef.current?.abort();
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleApplySuggestion = async (msgId: string, idx: number, suggestion: InsertSuggestion) => {
    const res = await editorToolAdapter.executeTool('insert_block', suggestion);
    if (res.success) {
      updateInsertSuggestionStatus(msgId, idx, 'accepted');
    } else {
      alert(`삽입 실패: ${res.error}`);
    }
  };

  const handleRejectSuggestion = (msgId: string, idx: number) => {
    updateInsertSuggestionStatus(msgId, idx, 'rejected');
  };

  const handleCitationClick = (blockId?: string) => {
    if (blockId) {
      editorToolAdapter.executeTool('scroll_to_block', { blockId });
    }
  };

  return (
    <div
      data-testid="ai-panel-container"
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        backgroundColor: 'var(--bg-panel, #121216)',
        color: 'var(--text-main, #f8fafc)',
        borderLeft: '1px solid var(--border-muted, #27272a)',
        position: 'relative'
      }}
    >
      {/* 1. Header Toolbar */}
      <div
        data-testid="ai-panel-header"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 14px',
          borderBottom: '1px solid var(--border-muted, #27272a)',
          backgroundColor: 'rgba(255, 255, 255, 0.02)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              width: '24px',
              height: '24px',
              borderRadius: '6px',
              background: 'linear-gradient(135deg, #2563eb 0%, #06b6d4 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff'
            }}
          >
            <Sparkles size={14} />
          </div>
          <div>
            <div style={{ fontSize: '12px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
              AMEVA AI 에이전트
              <button
                data-testid="ai-engine-mode-toggle"
                onClick={handleEngineModeToggle}
                style={{
                  fontSize: '9px',
                  padding: '1px 5px',
                  borderRadius: '3px',
                  border: 'none',
                  background: engineMode === 'webgpu' ? 'rgba(37, 99, 235, 0.2)' : 'rgba(6, 182, 212, 0.2)',
                  color: engineMode === 'webgpu' ? '#93c5fd' : '#67e8f9',
                  cursor: 'pointer',
                  fontWeight: 600
                }}
                title="Switch Engine Mode (WebGPU / Remote API)"
              >
                {engineMode === 'webgpu' ? '⚡ WebGPU' : '🌐 API'}
              </button>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <button
            data-testid="ai-engine-settings-btn"
            onClick={() => setShowSettings(!showSettings)}
            style={{
              background: showSettings ? 'var(--bg-glass-active)' : 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: '4px'
            }}
            title="Engine API Settings"
          >
            <Settings size={14} />
          </button>

          <div style={{ display: 'flex', background: 'var(--bg-glass-active)', borderRadius: '6px', padding: '2px' }}>
            <button
              data-testid="ai-tab-chat"
              onClick={() => setActiveTab('chat')}
              style={{
                background: activeTab === 'chat' ? 'var(--primary)' : 'transparent',
                color: activeTab === 'chat' ? 'var(--text-on-primary)' : 'var(--text-muted)',
                border: 'none',
                padding: '4px 8px',
                borderRadius: '4px',
                fontSize: '11px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Chat
            </button>
            <button
              data-testid="ai-tab-outline"
              onClick={() => setActiveTab('outline')}
              style={{
                background: activeTab === 'outline' ? 'var(--primary)' : 'transparent',
                color: activeTab === 'outline' ? 'var(--text-on-primary)' : 'var(--text-muted)',
                border: 'none',
                padding: '4px 8px',
                borderRadius: '4px',
                fontSize: '11px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Outline
            </button>
          </div>

          {messages.length > 0 && (
            <button
              data-testid="ai-clear-messages-btn"
              onClick={clearMessages}
              style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '6px', borderRadius: '4px' }}
              title="Clear Messages"
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
      </div>

      {/* 2. Ollama Auto-Install Prompt Modal */}
      {showOllamaPrompt && (
        <div style={{
          position: 'absolute',
          top: '48px',
          left: '8px',
          right: '8px',
          background: '#0f172a',
          border: '1px solid #38bdf8',
          borderRadius: '8px',
          padding: '12px',
          zIndex: 200,
          boxShadow: '0 10px 30px rgba(0,0,0,0.8)',
          fontSize: '11px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <span style={{ fontWeight: 700, color: '#38bdf8', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Sparkles size={14} /> 로컬 Ollama 자동 설치 & 실행
            </span>
            <button onClick={() => setShowOllamaPrompt(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
              <X size={12} />
            </button>
          </div>
          <div style={{ fontSize: '10px', color: '#cbd5e1', lineHeight: '1.4', marginBottom: '8px' }}>
            컴퓨터에 Ollama가 실행되어 있지 않습니다.<br />
            <strong>[원클릭 자동 설치 & 실행]</strong>을 누르면 1초 만에 설치 스크립트를 받아 Qwen 3B 모델을 백그라운드에서 자동 기동합니다!
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
            <button
              onClick={() => {
                const result = OllamaWizardService.triggerAutoSetup(apiModel || 'qwen2.5:3b');
                if (result.isMobile) {
                  setOllamaPromptMsg('📱 모바일은 [⚡ WebGPU 모드] 또는 클라우드 API Key를 사용해 주세요!');
                  return;
                }
                const osLabel = result.os === 'mac' ? 'macOS (.command)' : result.os === 'linux' ? 'Linux (.sh)' : 'Windows (.bat)';
                setOllamaPromptMsg(`📥 ${osLabel} 스크립트 발급 완료! 실행하시면 자동 감지됩니다.`);
                OllamaWizardService.startAutoConnectPolling(
                  () => {
                    setOllamaPromptMsg('🎉 연결 성공! API 모드로 전환합니다.');
                    setEngineMode('api');
                    setTimeout(() => setShowOllamaPrompt(false), 1200);
                  },
                  (msg) => setOllamaPromptMsg(msg)
                );
              }}
              style={{
                background: 'linear-gradient(135deg, #0ea5e9 0%, #2563eb 100%)',
                color: '#fff',
                border: 'none',
                borderRadius: '4px',
                padding: '7px 10px',
                fontWeight: 700,
                cursor: 'pointer',
                fontSize: '11px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px'
              }}
            >
              📥 1초 원클릭 자동 설치 & 실행
            </button>
            <div style={{ display: 'flex', gap: '5px' }}>
              <button
                onClick={() => {
                  setEngineMode('api');
                  setShowOllamaPrompt(false);
                  setShowSettings(true);
                }}
                style={{
                  flex: 1,
                  background: 'rgba(255,255,255,0.06)',
                  color: '#94a3b8',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '4px',
                  padding: '4px',
                  fontSize: '9px',
                  cursor: 'pointer'
                }}
              >
                ⚙️ 다른 API Key 입력
              </button>
              <button
                onClick={() => setShowOllamaPrompt(false)}
                style={{
                  flex: 1,
                  background: 'rgba(59, 130, 246, 0.15)',
                  color: '#93c5fd',
                  border: '1px solid rgba(59, 130, 246, 0.35)',
                  borderRadius: '4px',
                  padding: '4px',
                  fontSize: '9px',
                  cursor: 'pointer'
                }}
              >
                WebGPU 모드 유지
              </button>
            </div>
          </div>
          {ollamaPromptMsg && (
            <div style={{ fontSize: '10px', color: '#38bdf8', marginTop: '6px', textAlign: 'center', fontWeight: 600 }}>
              {ollamaPromptMsg}
            </div>
          )}
        </div>
      )}

      {/* 3. Engine Settings Modal */}
      {showSettings && (
        <EngineSettingsModal
          engineMode={engineMode}
          setEngineMode={setEngineMode}
          webgpuModel={webgpuModel}
          setWebgpuModel={(m) => {
            setWebgpuModel(m);
            if (isLLMReady) {
              initModel(m).catch((e) => console.warn('[AIPanel] Model switch error:', e));
            }
          }}
          apiEndpoint={apiEndpoint}
          setApiEndpoint={setApiEndpoint}
          apiModel={apiModel}
          setApiModel={setApiModel}
          apiKey={apiKey}
          setApiKey={setApiKey}
          onClose={() => setShowSettings(false)}
        />
      )}

      {/* 4. WebGPU VRAM Banner */}
      {engineMode === 'webgpu' && (
        <WebGPUBanner
          isLLMReady={isLLMReady}
          isModelLoading={isModelLoading}
          downloadProgress={downloadProgress}
          mainProgressText={mainProgressText}
          activeModelId={activeModelId}
          onInit={() => {
            initModel(webgpuModel).catch((e) => console.warn('[AIPanel] WebGPU Banner init error:', e));
          }}
          onUnload={() => unloadModel('all')}
        />
      )}

      {/* 4. Body Content */}
      {activeTab === 'outline' ? (
        <div data-testid="ai-outline-container" style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
          <div style={{ fontSize: '12px', fontWeight: 600, color: '#94a3b8', marginBottom: '12px' }}>
            문서 목차 구조
          </div>
          {outline.length === 0 ? (
            <div data-testid="ai-outline-empty" style={{ color: '#64748b', fontSize: '11px', textAlign: 'center', padding: '20px 0' }}>
              문서에 헤딩(#, ##)이 없습니다.
            </div>
          ) : (
            outline.map((item, idx) => (
              <div
                key={item.id}
                data-testid={`ai-outline-item-${idx}`}
                onClick={() => handleCitationClick(item.id)}
                style={{
                  padding: '6px 8px',
                  paddingLeft: `${(item.level - 1) * 12 + 8}px`,
                  fontSize: '11px',
                  color: item.level === 1 ? '#e2e8f0' : '#94a3b8',
                  fontWeight: item.level === 1 ? 600 : 400,
                  cursor: 'pointer',
                  borderRadius: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <ArrowRight size={10} color="#3b82f6" />
                <span>{item.text}</span>
              </div>
            ))
          )}
        </div>
      ) : (
        <div
          data-testid="ai-chat-messages-scroll"
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '16px 12px',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px'
          }}
        >
          {messages.length === 0 ? (
            <div
              data-testid="ai-empty-welcome"
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '24px 8px',
                textAlign: 'center',
                gap: '16px'
              }}
            >
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.2) 0%, rgba(6, 182, 212, 0.2) 100%)',
                border: '1px solid rgba(59, 130, 246, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Sparkles size={24} color="#60a5fa" />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', width: '100%', maxWidth: '320px' }}>
                {quickActions.map((action) => {
                  const Icon = action.icon;
                  return (
                    <button
                      key={action.id}
                      data-testid={`ai-quick-action-${action.id}`}
                      onClick={() => handleSend(action.prompt)}
                      style={{
                        background: 'var(--bg-card)',
                        border: '1px solid var(--border-muted)',
                        borderRadius: '8px',
                        padding: '10px 12px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'flex-start',
                        gap: '6px',
                        cursor: 'pointer',
                        textAlign: 'left'
                      }}
                    >
                      <Icon size={14} color="var(--primary)" />
                      <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-main)' }}>{action.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            messages.map((msg) => (
              <ChatBubble
                key={msg.id}
                message={msg}
                onAcceptDiff={handleAcceptDiff}
                onRejectDiff={handleRejectDiff}
              />
            ))
          )}
          <div ref={chatEndRef} />
        </div>
      )}

      {/* 5. Input Bar */}
      <div style={{
        padding: '12px',
        borderTop: '1px solid var(--border-muted)',
        background: 'var(--bg-main)',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px'
      }}>
        {taggedBlocks.length > 0 && (
          <div
            data-testid="ai-tagged-blocks-indicator"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '10px',
              color: 'var(--primary)',
              background: 'var(--bg-glass-active)',
              padding: '4px 8px',
              borderRadius: '4px'
            }}
          >
            <span>📌 에디터 {taggedBlocks.length}개 블록이 질의 컨텍스트로 포함됩니다.</span>
            <button
              data-testid="ai-clear-tagged-blocks-btn"
              onClick={clearTaggedBlocks}
              style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', marginLeft: 'auto' }}
            >
              ✕
            </button>
          </div>
        )}

        <div style={{
          display: 'flex',
          alignItems: 'flex-end',
          gap: '8px',
          background: 'var(--bg-card)',
          border: '1px solid var(--border-muted)',
          borderRadius: '8px',
          padding: '6px 8px'
        }}>
          <textarea
            data-testid="ai-chat-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isStreaming ? t.common.loading : t.aiPanel.placeholder}
            disabled={isStreaming}
            rows={1}
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              color: 'var(--text-main)',
              fontSize: '12px',
              resize: 'none',
              outline: 'none',
              lineHeight: '1.4',
              maxHeight: '120px',
              fontFamily: 'inherit'
            }}
          />

          {isStreaming ? (
            <button
              data-testid="ai-abort-btn"
              onClick={handleAbort}
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '6px',
                background: '#ef4444',
                color: '#fff',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}
              title={t.aiPanel.stop}
            >
              <Square size={12} fill="#fff" />
            </button>
          ) : (
            <button
              data-testid="ai-send-btn"
              onClick={() => handleSend()}
              disabled={!input.trim()}
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '6px',
                background: input.trim() ? 'var(--primary, #2563eb)' : 'rgba(255,255,255,0.1)',
                color: '#fff',
                border: 'none',
                cursor: input.trim() ? 'pointer' : 'default',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}
              title={t.aiPanel.send}
            >
              <Send size={12} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
