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
  ArrowRight, Settings, Cpu
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

const QUICK_ACTIONS = [
  { id: 'summarize', icon: FileText, label: '3줄 요약', prompt: '현재 문서의 핵심 내용을 3가지 항목으로 명확하게 요약해줘.' },
  { id: 'improve', icon: Wand2, label: '문장 개선', prompt: '문서의 문맥을 분석하여 더 자연스럽고 전문적인 비즈니스 톤으로 개선해줘.' },
  { id: 'rag-search', icon: BookOpen, label: 'RAG 질의', prompt: '현재 문서 전체에서 가장 중요한 결론 및 아키텍처 포인트를 찾아 설명해줘.' },
  { id: 'table', icon: Table, label: '표 정리', prompt: '문서의 주요 데이터를 일목요연한 마크다운 테이블 형태로 정리해줘.' }
];

export function AIPanel() {
  const {
    messages,
    isStreaming,
    clearMessages,
    updateInsertSuggestionStatus
  } = useAIAgentStore();

  const { taggedBlocks, clearTaggedBlocks, activeEditorInstance } = useWorkspaceStore();
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
  const [webgpuModel, setWebgpuModel] = useState(DEFAULT_WEBGPU_MODEL);
  const [showSettings, setShowSettings] = useState(false);

  // API Config State
  const [apiEndpoint, setApiEndpoint] = useState('http://localhost:11434/v1/chat/completions');
  const [apiModel, setApiModel] = useState('qwen2.5:3b');
  const [apiKey, setApiKey] = useState('');

  const [outline, setOutline] = useState<Array<{ id: string; text: string; level: number }>>([]);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const orchestratorRef = useRef<AgentOrchestrator | null>(null);
  const httpAdapterRef = useRef<RemoteHttpEngineAdapter>(new RemoteHttpEngineAdapter());

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
              background: 'linear-gradient(135deg, #8b5cf6 0%, #3b82f6 100%)',
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
                onClick={() => setEngineMode(engineMode === 'webgpu' ? 'api' : 'webgpu')}
                style={{
                  fontSize: '9px',
                  padding: '1px 5px',
                  borderRadius: '3px',
                  border: 'none',
                  background: engineMode === 'webgpu' ? 'rgba(139, 92, 246, 0.2)' : 'rgba(59, 130, 246, 0.2)',
                  color: engineMode === 'webgpu' ? '#a78bfa' : '#60a5fa',
                  cursor: 'pointer',
                  fontWeight: 600
                }}
                title="엔진 모드 전환 (WebGPU ↔ Remote API)"
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
              background: showSettings ? 'rgba(255,255,255,0.15)' : 'transparent',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: '4px'
            }}
            title="엔진 API 설정"
          >
            <Settings size={14} />
          </button>

          <div style={{ display: 'flex', background: 'rgba(255,255,255,0.06)', borderRadius: '6px', padding: '2px' }}>
            <button
              data-testid="ai-tab-chat"
              onClick={() => setActiveTab('chat')}
              style={{
                background: activeTab === 'chat' ? 'var(--primary, #8b5cf6)' : 'transparent',
                color: '#fff',
                border: 'none',
                padding: '4px 8px',
                borderRadius: '4px',
                fontSize: '11px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              대화
            </button>
            <button
              data-testid="ai-tab-outline"
              onClick={() => setActiveTab('outline')}
              style={{
                background: activeTab === 'outline' ? 'var(--primary, #8b5cf6)' : 'transparent',
                color: '#fff',
                border: 'none',
                padding: '4px 8px',
                borderRadius: '4px',
                fontSize: '11px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              목차
            </button>
          </div>

          {messages.length > 0 && (
            <button
              data-testid="ai-clear-messages-btn"
              onClick={clearMessages}
              style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '6px', borderRadius: '4px' }}
              title="대화 지우기"
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
      </div>

      {/* 2. Engine Settings Modal */}
      {showSettings && (
        <EngineSettingsModal
          engineMode={engineMode}
          setEngineMode={setEngineMode}
          webgpuModel={webgpuModel}
          setWebgpuModel={(m) => {
            setWebgpuModel(m);
            if (isLLMReady) {
              initModel(m);
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

      {/* 3. WebGPU VRAM Banner */}
      {engineMode === 'webgpu' && (
        <WebGPUBanner
          isLLMReady={isLLMReady}
          isModelLoading={isModelLoading}
          downloadProgress={downloadProgress}
          mainProgressText={mainProgressText}
          activeModelId={activeModelId}
          onInit={() => initModel(webgpuModel)}
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
                <ArrowRight size={10} color="#8b5cf6" />
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
                background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.2) 0%, rgba(59, 130, 246, 0.2) 100%)',
                border: '1px solid rgba(139, 92, 246, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Sparkles size={24} color="#a78bfa" />
              </div>

              <div>
                <div style={{ fontSize: '14px', fontWeight: 700, color: '#f1f5f9', marginBottom: '4px' }}>
                  무엇을 도와드릴까요?
                </div>
                <div style={{ fontSize: '11px', color: '#94a3b8', lineHeight: '1.5' }}>
                  현재 에디터 문서 내용을 RAG 및 GraphRAG로 탐색하고<br />
                  직접 수정하거나 새로운 단락을 삽입해 드립니다.
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', width: '100%', maxWidth: '320px' }}>
                {QUICK_ACTIONS.map((action) => {
                  const Icon = action.icon;
                  return (
                    <button
                      key={action.id}
                      data-testid={`ai-quick-action-${action.id}`}
                      onClick={() => handleSend(action.prompt)}
                      style={{
                        background: 'rgba(255,255,255,0.03)',
                        border: '1px solid rgba(255,255,255,0.08)',
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
                      <Icon size={14} color="#8b5cf6" />
                      <span style={{ fontSize: '11px', fontWeight: 600, color: '#e2e8f0' }}>{action.label}</span>
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
                onCitationClick={handleCitationClick}
                onApplySuggestion={handleApplySuggestion}
                onRejectSuggestion={handleRejectSuggestion}
              />
            ))
          )}
          <div ref={chatEndRef} />
        </div>
      )}

      {/* 5. Input Bar */}
      <div style={{
        padding: '12px',
        borderTop: '1px solid var(--border-muted, rgba(255,255,255,0.08))',
        background: 'rgba(0,0,0,0.2)',
        display: 'flex',
        flexDirection: 'column',
        gap: '6px'
      }}>
        {taggedBlocks.length > 0 && (
          <div
            data-testid="ai-tagged-blocks-indicator"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '10px',
              color: '#60a5fa',
              background: 'rgba(37, 99, 235, 0.1)',
              padding: '4px 8px',
              borderRadius: '4px'
            }}
          >
            <span>📌 에디터 {taggedBlocks.length}개 블록이 질의 컨텍스트로 포함됩니다.</span>
            <button
              data-testid="ai-clear-tagged-blocks-btn"
              onClick={clearTaggedBlocks}
              style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', marginLeft: 'auto' }}
            >
              ✕
            </button>
          </div>
        )}

        <div style={{
          display: 'flex',
          alignItems: 'flex-end',
          gap: '8px',
          background: 'rgba(255, 255, 255, 0.05)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '8px',
          padding: '6px 8px'
        }}>
          <textarea
            data-testid="ai-chat-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isStreaming ? 'AI가 답변을 생성 중입니다...' : '문서 관련 질문 또는 수정 요청을 입력하세요...'}
            disabled={isStreaming}
            rows={1}
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              color: '#fff',
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
              title="생성 중단"
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
                background: input.trim() ? 'var(--primary, #8b5cf6)' : 'rgba(255,255,255,0.1)',
                color: '#fff',
                border: 'none',
                cursor: input.trim() ? 'pointer' : 'default',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}
              title="메시지 전송"
            >
              <Send size={12} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
