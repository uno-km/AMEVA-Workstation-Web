/**
 * ============================================================================
 * @file CodeAssistantModal.tsx
 * @system AMEVA OS Desktop Workstation - Code Intelligence Studio
 * @location packages/core/src/renderer/components/ai-panel/CodeAssistantModal.tsx
 * @role Multilingual Code Generation, Debugging, Review & Explanation Studio (SCRUM-172)
 * ============================================================================
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Code2, 
  Bug, 
  FileSearch, 
  BookOpen, 
  X, 
  Play, 
  Copy, 
  Check, 
  FileText, 
  Loader2, 
  StopCircle, 
  RefreshCw, 
  Cpu, 
  Globe, 
  Sparkles, 
  Terminal, 
  Eye, 
  Code,
  ArrowRight,
  Layers
} from 'lucide-react';
import { marked } from 'marked';
import { 
  CodeIntelligenceService, 
  type SupportedLanguage 
} from '../../services/ai/CodeIntelligenceService';
import { WebLLMEngineAdapter } from '../../features/ai-agent/adapters/WebLLMEngineAdapter';
import { RemoteHttpEngineAdapter } from '../../features/ai-agent/adapters/RemoteHttpEngineAdapter';
import { useWebLLM } from '../useWebLLM';

export type CodeAssistantMode = 'generate' | 'debug' | 'review' | 'explain';

export interface CodeAssistantModalProps {
  initialMode?: CodeAssistantMode;
  initialCode?: string;
  initialLanguage?: SupportedLanguage;
  initialErrorLog?: string;
  onClose: () => void;
  onInsertToEditor?: (content: string) => void;
}

const LANGUAGES: { id: SupportedLanguage; label: string; icon: string }[] = [
  { id: 'python', label: 'Python', icon: '🐍' },
  { id: 'javascript', label: 'JavaScript', icon: '🟨' },
  { id: 'typescript', label: 'TypeScript', icon: '🔷' },
  { id: 'html', label: 'HTML / Web', icon: '🌐' },
  { id: 'java', label: 'Java', icon: '☕' },
  { id: 'sql', label: 'SQL', icon: '🗄️' },
  { id: 'cpp', label: 'C / C++', icon: '⚙️' },
  { id: 'rust', label: 'Rust', icon: '🦀' },
  { id: 'go', label: 'Go', icon: '🐹' },
  { id: 'css', label: 'CSS', icon: '🎨' }
];

export const CodeAssistantModal: React.FC<CodeAssistantModalProps> = ({
  initialMode = 'generate',
  initialCode = '',
  initialLanguage = 'python',
  initialErrorLog = '',
  onClose,
  onInsertToEditor
}) => {
  const { generateStream, isMainReady, initModel, activeModelId } = useWebLLM();
  
  const [mode, setMode] = useState<CodeAssistantMode>(initialMode);
  const [language, setLanguage] = useState<SupportedLanguage>(initialLanguage);
  const [prompt, setPrompt] = useState<string>('');
  const [code, setCode] = useState<string>(initialCode);
  const [errorLog, setErrorLog] = useState<string>(initialErrorLog);
  const [result, setResult] = useState<string>('');
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [inserted, setInserted] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<'rendered' | 'raw'>('rendered');
  
  const [selectedEngine, setSelectedEngine] = useState<'coder-0.5b' | 'coder-1.5b' | 'api'>(() => {
    const savedEngine = localStorage.getItem('ameva_engine_mode');
    if (savedEngine === 'api') return 'api';
    return 'coder-0.5b';
  });

  const abortControllerRef = useRef<AbortController | null>(null);

  const renderedHtml = useMemo(() => {
    if (!result) return '';
    try {
      return marked.parse(result, { gfm: true, breaks: true }) as string;
    } catch {
      return result;
    }
  }, [result]);

  const handleExecute = async (engineChoice = selectedEngine) => {
    setIsRunning(true);
    setResult('');
    setInserted(false);

    const ac = new AbortController();
    abortControllerRef.current = ac;

    try {
      let adapter: any;
      if (engineChoice === 'api') {
        const endpoint = localStorage.getItem('ameva_api_endpoint') || 'http://localhost:11434/v1/chat/completions';
        const apiModel = localStorage.getItem('ameva_api_model') || 'qwen2.5-coder:7b';
        const http = new RemoteHttpEngineAdapter({
          endpoint,
          model: apiModel,
          apiKey: localStorage.getItem('ameva_api_key') || ''
        });
        adapter = http;
      } else {
        const targetModel = engineChoice === 'coder-1.5b' 
          ? 'Qwen2.5-Coder-1.5B-Instruct-q4f32_1-MLC' 
          : 'Qwen2.5-Coder-0.5B-Instruct-q4f32_1-MLC';

        localStorage.setItem('ameva_selected_llm_model', targetModel);
        localStorage.setItem('ameva_engine_mode', 'webgpu');

        if (!isMainReady || activeModelId !== targetModel) {
          await initModel(targetModel);
        }
        adapter = new WebLLMEngineAdapter((sys, user, opt) => generateStream(sys, user, opt), true);
      }

      if (mode === 'generate') {
        await CodeIntelligenceService.generateCode({
          prompt,
          language,
          contextCode: code || undefined,
          engine: adapter,
          signal: ac.signal,
          onStreamingChunk: (chunk) => setResult((prev) => prev + chunk)
        });
      } else if (mode === 'debug') {
        await CodeIntelligenceService.debugAndFix({
          code,
          errorLog: errorLog || undefined,
          language,
          engine: adapter,
          signal: ac.signal,
          onStreamingChunk: (chunk) => setResult((prev) => prev + chunk)
        });
      } else if (mode === 'review') {
        await CodeIntelligenceService.reviewCode({
          code,
          language,
          engine: adapter,
          signal: ac.signal,
          onStreamingChunk: (chunk) => setResult((prev) => prev + chunk)
        });
      } else if (mode === 'explain') {
        await CodeIntelligenceService.explainCode({
          code,
          language,
          engine: adapter,
          signal: ac.signal,
          onStreamingChunk: (chunk) => setResult((prev) => prev + chunk)
        });
      }
    } catch (err: any) {
      if (ac.signal.aborted) {
        setResult((prev) => prev + '\n\n*(작업이 사용자에 의해 중단되었습니다)*');
      } else {
        setResult((prev) => prev + `\n\n❌ **오류 발생**: ${err?.message || '코드 처리 중 예외 발생'}`);
      }
    } finally {
      setIsRunning(false);
      abortControllerRef.current = null;
    }
  };

  const handleStop = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  };

  const handleCopy = () => {
    if (!result) return;
    navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleInsert = () => {
    if (!result || !onInsertToEditor) return;
    onInsertToEditor(result);
    setInserted(true);
    setTimeout(() => setInserted(false), 2000);
  };

  // Auto trigger if initialCode or initialErrorLog is present
  useEffect(() => {
    if (initialCode && (initialMode === 'debug' || initialMode === 'review' || initialMode === 'explain')) {
      handleExecute();
    }
  }, []);

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(5, 7, 15, 0.88)',
      backdropFilter: 'blur(10px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 99999,
      padding: '20px'
    }}>
      <style>{`
        .ameva-code-markdown {
          font-size: 13px;
          line-height: 1.7;
          color: #f1f5f9;
        }
        .ameva-code-markdown pre {
          background: #090d16;
          border: 1px solid rgba(59, 130, 246, 0.3);
          border-radius: 8px;
          padding: 14px;
          overflow-x: auto;
          margin: 12px 0;
          font-family: 'JetBrains Mono', Consolas, monospace;
          font-size: 12px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.5);
        }
        .ameva-code-markdown code {
          font-family: 'JetBrains Mono', Consolas, monospace;
          color: #93c5fd;
        }
        .ameva-code-markdown h1, .ameva-code-markdown h2, .ameva-code-markdown h3 {
          color: #60a5fa;
          margin-top: 14px;
          margin-bottom: 8px;
          font-weight: 700;
        }
        .ameva-code-markdown table {
          width: 100%;
          border-collapse: collapse;
          margin: 12px 0;
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 6px;
          overflow: hidden;
          background: rgba(15, 23, 42, 0.6);
        }
        .ameva-code-markdown th {
          background: rgba(30, 41, 59, 0.95);
          color: #93c5fd;
          text-align: left;
          padding: 8px 12px;
          font-size: 12px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.15);
        }
        .ameva-code-markdown td {
          padding: 8px 12px;
          font-size: 12px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.06);
          color: #e2e8f0;
        }
      `}</style>

      <div style={{
        width: '100%',
        maxWidth: '1080px',
        height: '88vh',
        background: '#0d111a',
        border: '1px solid rgba(59, 130, 246, 0.4)',
        borderRadius: '12px',
        boxShadow: '0 16px 64px rgba(0, 0, 0, 0.8), 0 0 32px rgba(59, 130, 246, 0.15)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{
          padding: '12px 18px',
          background: 'rgba(21, 27, 43, 0.95)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, #3b82f6 0%, #10b981 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 10px rgba(59, 130, 246, 0.4)'
            }}>
              <Code2 size={18} color="#fff" />
            </div>
            <div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>Qwen2.5-Coder 온디바이스 지능형 코드 스튜디오</span>
                <span style={{ fontSize: '10px', background: 'rgba(16, 185, 129, 0.2)', color: '#34d399', padding: '1px 6px', borderRadius: '4px', border: '1px solid rgba(16, 185, 129, 0.4)' }}>
                  SCRUM-172
                </span>
              </div>
              <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>
                다국어 코드 작성 · 런타임 오류 디버깅 · 아키텍처 리뷰 · 코드 해설
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {/* Engine Selector */}
            <div style={{ display: 'flex', background: 'rgba(0,0,0,0.4)', padding: '2px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.08)' }}>
              <button
                onClick={() => setSelectedEngine('coder-0.5b')}
                disabled={isRunning}
                title="Qwen2.5-Coder 0.5B (390MB) 초경량 온디바이스 모델"
                style={{
                  padding: '3px 8px',
                  borderRadius: '4px',
                  border: 'none',
                  background: selectedEngine === 'coder-0.5b' ? 'rgba(16, 185, 129, 0.3)' : 'transparent',
                  color: selectedEngine === 'coder-0.5b' ? '#34d399' : '#64748b',
                  fontSize: '10.5px',
                  fontWeight: 600,
                  cursor: isRunning ? 'not-allowed' : 'pointer'
                }}
              >
                ⚡ Coder 0.5B
              </button>
              <button
                onClick={() => setSelectedEngine('coder-1.5b')}
                disabled={isRunning}
                title="Qwen2.5-Coder 1.5B (890MB) 고품질 온디바이스 모델"
                style={{
                  padding: '3px 8px',
                  borderRadius: '4px',
                  border: 'none',
                  background: selectedEngine === 'coder-1.5b' ? 'rgba(59, 130, 246, 0.3)' : 'transparent',
                  color: selectedEngine === 'coder-1.5b' ? '#60a5fa' : '#64748b',
                  fontSize: '10.5px',
                  fontWeight: 600,
                  cursor: isRunning ? 'not-allowed' : 'pointer'
                }}
              >
                🚀 Coder 1.5B
              </button>
              <button
                onClick={() => setSelectedEngine('api')}
                disabled={isRunning}
                title="로컬 Ollama / 원격 API (qwen2.5-coder:7b 등)"
                style={{
                  padding: '3px 8px',
                  borderRadius: '4px',
                  border: 'none',
                  background: selectedEngine === 'api' ? 'rgba(139, 92, 246, 0.3)' : 'transparent',
                  color: selectedEngine === 'api' ? '#c4b5fd' : '#64748b',
                  fontSize: '10.5px',
                  fontWeight: 600,
                  cursor: isRunning ? 'not-allowed' : 'pointer'
                }}
              >
                🌐 Ollama
              </button>
            </div>

            <button
              onClick={onClose}
              style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '4px' }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Toolbar: Mode Tabs & Language Selector */}
        <div style={{
          padding: '8px 18px',
          background: 'rgba(13, 17, 26, 0.9)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          {/* Mode Switcher Tabs */}
          <div style={{ display: 'flex', gap: '6px' }}>
            <button
              onClick={() => setMode('generate')}
              style={{
                padding: '5px 12px',
                borderRadius: '5px',
                border: 'none',
                background: mode === 'generate' ? '#3b82f6' : 'rgba(255,255,255,0.04)',
                color: mode === 'generate' ? '#fff' : '#94a3b8',
                fontSize: '11.5px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '5px'
              }}
            >
              <Code2 size={13} />
              <span>코드 작성</span>
            </button>

            <button
              onClick={() => setMode('debug')}
              style={{
                padding: '5px 12px',
                borderRadius: '5px',
                border: 'none',
                background: mode === 'debug' ? '#ef4444' : 'rgba(255,255,255,0.04)',
                color: mode === 'debug' ? '#fff' : '#94a3b8',
                fontSize: '11.5px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '5px'
              }}
            >
              <Bug size={13} />
              <span>에러 디버깅 & 해결</span>
            </button>

            <button
              onClick={() => setMode('review')}
              style={{
                padding: '5px 12px',
                borderRadius: '5px',
                border: 'none',
                background: mode === 'review' ? '#8b5cf6' : 'rgba(255,255,255,0.04)',
                color: mode === 'review' ? '#fff' : '#94a3b8',
                fontSize: '11.5px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '5px'
              }}
            >
              <FileSearch size={13} />
              <span>코드 리뷰</span>
            </button>

            <button
              onClick={() => setMode('explain')}
              style={{
                padding: '5px 12px',
                borderRadius: '5px',
                border: 'none',
                background: mode === 'explain' ? '#10b981' : 'rgba(255,255,255,0.04)',
                color: mode === 'explain' ? '#fff' : '#94a3b8',
                fontSize: '11.5px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '5px'
              }}
            >
              <BookOpen size={13} />
              <span>코드 해설</span>
            </button>
          </div>

          {/* Language Selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '11px', color: '#64748b' }}>대상 언어:</span>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value as SupportedLanguage)}
              style={{
                background: '#161d2d',
                color: '#60a5fa',
                border: '1px solid rgba(59, 130, 246, 0.3)',
                borderRadius: '5px',
                padding: '4px 8px',
                fontSize: '11.5px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              {LANGUAGES.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.icon} {l.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Dual Panel Body */}
        <div style={{
          flex: 1,
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          background: '#070a12',
          overflow: 'hidden'
        }}>
          {/* Left Panel: Input Area */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            borderRight: '1px solid rgba(255, 255, 255, 0.08)',
            padding: '14px 16px',
            gap: '10px',
            overflowY: 'auto'
          }}>
            {mode === 'generate' ? (
              <div style={{ display: 'flex', flexDirection: 'column', flex: 1, gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <label style={{ fontSize: '11.5px', fontWeight: 600, color: '#60a5fa' }}>
                    💡 무엇을 구현할까요? (자연어로 입력)
                  </label>
                  <span style={{ fontSize: '10.5px', color: '#64748b' }}>예: BFS 게임 맵 최단거리 알고리즘 구현해줘</span>
                </div>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="예: 2차원 배열에서 최단 거리를 찾는 BFS 탐색 알고리즘 함수를 작성해줘. 방문 배열과 큐를 사용하고, 도달할 수 없을 때 -1을 반환해줘."
                  rows={4}
                  style={{
                    width: '100%',
                    background: '#0d1322',
                    border: '1px solid rgba(59, 130, 246, 0.25)',
                    borderRadius: '6px',
                    padding: '10px 12px',
                    color: '#f1f5f9',
                    fontSize: '12.5px',
                    lineHeight: '1.5',
                    resize: 'vertical',
                    fontFamily: "'Inter', sans-serif"
                  }}
                />

                <label style={{ fontSize: '11px', fontWeight: 600, color: '#94a3b8', marginTop: '6px' }}>
                  📄 참조할 기존 코드 (선택 사항):
                </label>
                <textarea
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="참조할 클래스, 인터페이스, 변수 구조 등이 있다면 여기에 붙여넣으세요..."
                  style={{
                    flex: 1,
                    minHeight: '160px',
                    background: '#090d16',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '6px',
                    padding: '10px 12px',
                    color: '#93c5fd',
                    fontSize: '12px',
                    fontFamily: "'JetBrains Mono', Consolas, monospace",
                    resize: 'none'
                  }}
                />
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', flex: 1, gap: '8px' }}>
                <label style={{ fontSize: '11.5px', fontWeight: 600, color: mode === 'debug' ? '#f87171' : '#a78bfa' }}>
                  💻 {mode === 'debug' ? '문제가 발생한 코드' : '분석 대상 소스코드'}
                </label>
                <textarea
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="여기에 소스코드를 붙여넣으세요..."
                  style={{
                    flex: mode === 'debug' ? 0.6 : 1,
                    minHeight: '180px',
                    background: '#090d16',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '6px',
                    padding: '10px 12px',
                    color: '#93c5fd',
                    fontSize: '12px',
                    fontFamily: "'JetBrains Mono', Consolas, monospace",
                    resize: 'none'
                  }}
                />

                {mode === 'debug' && (
                  <>
                    <label style={{ fontSize: '11px', fontWeight: 600, color: '#f87171', marginTop: '4px' }}>
                      🚨 런타임 에러 로그 / 스택 트레이스 (선택):
                    </label>
                    <textarea
                      value={errorLog}
                      onChange={(e) => setErrorLog(e.target.value)}
                      placeholder="콘솔에 찍힌 에러 메시지나 컴파일 에러, Traceback을 여기에 붙여넣으세요..."
                      style={{
                        flex: 0.4,
                        minHeight: '100px',
                        background: '#160d10',
                        border: '1px solid rgba(239, 68, 68, 0.3)',
                        borderRadius: '6px',
                        padding: '8px 10px',
                        color: '#fca5a5',
                        fontSize: '11.5px',
                        fontFamily: "'JetBrains Mono', Consolas, monospace",
                        resize: 'none'
                      }}
                    />
                  </>
                )}
              </div>
            )}

            <button
              onClick={() => handleExecute()}
              disabled={isRunning || (mode === 'generate' && !prompt.trim()) || (mode !== 'generate' && !code.trim())}
              style={{
                marginTop: 'auto',
                background: isRunning 
                  ? 'rgba(59, 130, 246, 0.4)' 
                  : mode === 'debug'
                    ? 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)'
                    : 'linear-gradient(135deg, #3b82f6 0%, #10b981 100%)',
                border: 'none',
                color: '#fff',
                borderRadius: '6px',
                padding: '10px 16px',
                fontSize: '13px',
                fontWeight: 700,
                cursor: isRunning ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                boxShadow: '0 4px 14px rgba(59, 130, 246, 0.3)'
              }}
            >
              {isRunning ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>AI 추론 및 코드 작성 중...</span>
                </>
              ) : (
                <>
                  <Sparkles size={16} />
                  <span>{mode === 'generate' ? '코드 생성 시작' : mode === 'debug' ? '에러 진단 및 수정 코드 생성' : mode === 'review' ? '코드 정밀 리뷰 시작' : '상세 코드 해설 생성'}</span>
                </>
              )}
            </button>
          </div>

          {/* Right Panel: Output Area */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            padding: '14px 16px',
            overflowY: 'auto',
            background: '#0a0d17'
          }}>
            {/* View Mode Toggle */}
            {result && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <span style={{ fontSize: '11px', fontWeight: 600, color: '#34d399' }}>
                  ✨ AI 인텔리전스 응답 결과:
                </span>
                <div style={{ display: 'flex', background: 'rgba(255,255,255,0.05)', padding: '2px', borderRadius: '5px', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <button
                    onClick={() => setViewMode('rendered')}
                    style={{
                      padding: '3px 8px',
                      borderRadius: '3px',
                      border: 'none',
                      background: viewMode === 'rendered' ? '#3b82f6' : 'transparent',
                      color: viewMode === 'rendered' ? '#fff' : '#94a3b8',
                      fontSize: '10px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '3px'
                    }}
                  >
                    <Eye size={11} />
                    렌더링
                  </button>
                  <button
                    onClick={() => setViewMode('raw')}
                    style={{
                      padding: '3px 8px',
                      borderRadius: '3px',
                      border: 'none',
                      background: viewMode === 'raw' ? '#3b82f6' : 'transparent',
                      color: viewMode === 'raw' ? '#fff' : '#94a3b8',
                      fontSize: '10px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '3px'
                    }}
                  >
                    <Code size={11} />
                    마크다운
                  </button>
                </div>
              </div>
            )}

            {/* Content Output */}
            <div style={{ flex: 1 }}>
              {result ? (
                viewMode === 'rendered' ? (
                  <div
                    className="ameva-code-markdown"
                    dangerouslySetInnerHTML={{ __html: renderedHtml }}
                  />
                ) : (
                  <div style={{ whiteSpace: 'pre-wrap', fontFamily: "'JetBrains Mono', Consolas, monospace", fontSize: '12px', color: '#cbd5e1' }}>
                    {result}
                  </div>
                )
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#64748b', gap: '10px' }}>
                  <Code2 size={32} color="#3b82f6" />
                  <span style={{ fontSize: '13px', color: '#cbd5e1' }}>좌측에서 명령을 입력하고 실행 버튼을 누르세요.</span>
                  <span style={{ fontSize: '11px', color: '#64748b' }}>온디바이스 Qwen2.5-Coder가 즉시 코드를 작성하고 오류를 해결해 드립니다.</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div style={{
          padding: '10px 18px',
          background: 'rgba(21, 27, 43, 0.95)',
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', gap: '6px' }}>
            {isRunning && (
              <button
                onClick={handleStop}
                style={{
                  background: 'rgba(239, 68, 68, 0.15)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  color: '#f87171',
                  borderRadius: '4px',
                  padding: '6px 12px',
                  fontSize: '11px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <StopCircle size={12} />
                생성 중단
              </button>
            )}
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={handleCopy}
              disabled={!result}
              style={{
                background: copied ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                border: copied ? '1px solid #10b981' : '1px solid rgba(255, 255, 255, 0.15)',
                color: copied ? '#34d399' : '#e2e8f0',
                borderRadius: '5px',
                padding: '6px 14px',
                fontSize: '11.5px',
                fontWeight: 600,
                cursor: result ? 'pointer' : 'not-allowed',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              {copied ? <Check size={13} /> : <Copy size={13} />}
              <span>{copied ? '복사 완료!' : '결과 복사'}</span>
            </button>

            {onInsertToEditor && (
              <button
                onClick={handleInsert}
                disabled={!result}
                style={{
                  background: inserted ? 'rgba(16, 185, 129, 0.85)' : 'linear-gradient(135deg, #3b82f6 0%, #10b981 100%)',
                  border: 'none',
                  color: '#fff',
                  borderRadius: '5px',
                  padding: '6px 16px',
                  fontSize: '11.5px',
                  fontWeight: 700,
                  cursor: result ? 'pointer' : 'not-allowed',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  boxShadow: '0 2px 12px rgba(59, 130, 246, 0.4)'
                }}
              >
                {inserted ? <Check size={13} /> : <FileText size={13} />}
                <span>{inserted ? '에디터 삽입 완료!' : '에디터 본문에 삽입'}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
