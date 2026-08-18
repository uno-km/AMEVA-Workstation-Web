/**
 * ============================================================================
 * @file PdfMapReduceModal.tsx
 * @system AMEVA OS Desktop Workstation - PDF Intelligence UI
 * @location packages/core/src/renderer/components/pdf/PdfMapReduceModal.tsx
 * @role 3-Stage Hierarchical Map-Reduce PDF Summarization Modal (SCRUM-166)
 * ============================================================================
 */

import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, X, Check, Copy, FileText, Loader2, StopCircle, RefreshCw, Layers, Terminal, ChevronDown, ChevronRight, Activity, Cpu } from 'lucide-react';
import { PdfMapReduceService } from '../../services/pdf/PdfMapReduceService';
import type { MapReduceProgress, MapReduceLogItem } from '../../services/pdf/PdfMapReduceService';
import { WebLLMEngineAdapter } from '../../features/ai-agent/adapters/WebLLMEngineAdapter';
import { RemoteHttpEngineAdapter } from '../../features/ai-agent/adapters/RemoteHttpEngineAdapter';
import { useWebLLM, DEFAULT_WEBGPU_MODEL } from '../useWebLLM';

interface PdfMapReduceModalProps {
  pdf?: any;
  fileId?: string;
  pdfData?: string;
  fileName: string;
  numPages: number;
  onClose: () => void;
  onInsertToEditor?: (reportText: string) => void;
}

export const PdfMapReduceModal: React.FC<PdfMapReduceModalProps> = ({
  pdf,
  fileId,
  pdfData,
  fileName,
  numPages,
  onClose,
  onInsertToEditor
}) => {
  const { generateStream, isLLMReady, initModel, activeModelId } = useWebLLM();
  const [activeTab, setActiveTab] = useState<'report' | 'logs'>('logs');
  const [status, setStatus] = useState<MapReduceProgress>({
    stage: 'extracting',
    progressPercent: 5,
    currentStep: 0,
    totalSteps: numPages,
    message: '대용량 PDF 3단계 맵리듀스 파이프라인 가동 준비 중...'
  });
  const [logs, setLogs] = useState<MapReduceLogItem[]>([]);
  const [reportResult, setReportResult] = useState<string>('');
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [inserted, setInserted] = useState<boolean>(false);
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);
  const logEndRef = useRef<HTMLDivElement>(null);

  const addLog = (log: MapReduceLogItem) => {
    setLogs((prev) => [...prev, log]);
  };

  const startAnalysis = async () => {
    setIsRunning(true);
    setReportResult('');
    setInserted(false);
    setLogs([]);
    setActiveTab('logs');

    const ac = new AbortController();
    abortControllerRef.current = ac;

    const isApiMode = localStorage.getItem('ameva_engine_mode') === 'api';

    try {
      // 1. AI Engine Auto-Preparation
      let adapter: any;
      if (isApiMode) {
        addLog({
          id: 'log_api',
          time: new Date().toLocaleTimeString(),
          stage: 'system',
          message: '🌐 로컬 Ollama / 원격 API 엔진에 연결합니다...'
        });
        const http = new RemoteHttpEngineAdapter();
        http.setConfig({
          endpoint: localStorage.getItem('ameva_api_endpoint') || 'http://localhost:11434/v1/chat/completions',
          model: localStorage.getItem('ameva_api_model') || 'qwen2.5:1.5b',
          apiKey: localStorage.getItem('ameva_api_key') || ''
        });
        adapter = http;
      } else {
        if (!isLLMReady) {
          setStatus({
            stage: 'extracting',
            progressPercent: 10,
            currentStep: 0,
            totalSteps: numPages,
            message: '⚡ [AI 엔진 가동] 온디바이스 Qwen2.5 1.5B (890MB) VRAM 로드 중...'
          });
          addLog({
            id: 'log_llm_init',
            time: new Date().toLocaleTimeString(),
            stage: 'system',
            message: '⚡ WebGPU AI 엔진이 오프라인 상태입니다. Qwen2.5 1.5B (890MB) 모델을 자동으로 VRAM에 가동합니다...'
          });
          await initModel(DEFAULT_WEBGPU_MODEL);
          addLog({
            id: 'log_llm_ready',
            time: new Date().toLocaleTimeString(),
            stage: 'system',
            message: '✅ WebGPU AI 모델 가동 완료! 맵리듀스 분석을 시작합니다.'
          });
        }
        adapter = new WebLLMEngineAdapter((sys, user, opt) => generateStream(sys, user, opt), true);
      }

      // 2. Run Map-Reduce Pipeline
      const finalReport = await PdfMapReduceService.runFullMapReducePipeline(
        pdf,
        fileName,
        numPages,
        adapter,
        fileId,
        pdfData,
        ac.signal,
        (progress) => {
          setStatus(progress);
          if (progress.stage === 'synthesizing' && activeTab === 'logs') {
            setActiveTab('report');
          }
        },
        (logItem) => addLog(logItem),
        (chunk) => setReportResult((prev) => prev + chunk)
      );

      setReportResult(finalReport);
      setActiveTab('report');
    } catch (err: any) {
      if (ac.signal.aborted) {
        setStatus({
          stage: 'error',
          progressPercent: 0,
          currentStep: 0,
          totalSteps: 0,
          message: '사용자에 의해 분석이 중단되었습니다.'
        });
        addLog({
          id: 'log_abort',
          time: new Date().toLocaleTimeString(),
          stage: 'system',
          message: '🛑 작업이 중단되었습니다.'
        });
      } else {
        setStatus({
          stage: 'error',
          progressPercent: 0,
          currentStep: 0,
          totalSteps: 0,
          message: `분석 실패: ${err?.message || '알 수 없는 오류'}`
        });
        addLog({
          id: 'log_err',
          time: new Date().toLocaleTimeString(),
          stage: 'system',
          message: `❌ 오류 발생: ${err?.message || '알 수 없는 오류'}`
        });
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
    if (!reportResult) return;
    navigator.clipboard.writeText(reportResult);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleInsert = () => {
    if (!reportResult || !onInsertToEditor) return;
    onInsertToEditor(reportResult);
    setInserted(true);
    setTimeout(() => setInserted(false), 2000);
  };

  // Auto scroll logs
  useEffect(() => {
    if (activeTab === 'logs') {
      logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, activeTab]);

  // Auto start on mount
  useEffect(() => {
    startAnalysis();
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
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
      <div style={{
        width: '100%',
        maxWidth: '860px',
        height: '85vh',
        background: '#0e111a',
        border: '1px solid rgba(139, 92, 246, 0.4)',
        borderRadius: '12px',
        boxShadow: '0 16px 64px rgba(0, 0, 0, 0.8), 0 0 32px rgba(139, 92, 246, 0.15)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{
          padding: '12px 18px',
          background: 'rgba(23, 29, 44, 0.95)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '30px',
              height: '30px',
              borderRadius: '7px',
              background: 'linear-gradient(135deg, #8b5cf6 0%, #3b82f6 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 10px rgba(139, 92, 246, 0.4)'
            }}>
              <Layers size={16} color="#fff" />
            </div>
            <div>
              <div style={{ fontSize: '13.5px', fontWeight: 700, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>대용량 PDF 3단계 계층형 맵리듀스 AI 상세 요약</span>
                <span style={{ fontSize: '10px', background: 'rgba(59, 130, 246, 0.2)', color: '#60a5fa', padding: '1px 6px', borderRadius: '4px', border: '1px solid rgba(59, 130, 246, 0.4)' }}>
                  SCRUM-166
                </span>
              </div>
              <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>
                {fileName} (총 {numPages} 페이지 분석)
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {/* View Switcher Tabs */}
            <div style={{ display: 'flex', background: 'rgba(0,0,0,0.3)', padding: '2px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.08)' }}>
              <button
                onClick={() => setActiveTab('logs')}
                style={{
                  padding: '4px 10px',
                  borderRadius: '4px',
                  border: 'none',
                  background: activeTab === 'logs' ? '#3b82f6' : 'transparent',
                  color: activeTab === 'logs' ? '#fff' : '#94a3b8',
                  fontSize: '11px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <Terminal size={12} />
                <span>실시간 로그 ({logs.length})</span>
              </button>
              <button
                onClick={() => setActiveTab('report')}
                style={{
                  padding: '4px 10px',
                  borderRadius: '4px',
                  border: 'none',
                  background: activeTab === 'report' ? '#8b5cf6' : 'transparent',
                  color: activeTab === 'report' ? '#fff' : '#94a3b8',
                  fontSize: '11px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <FileText size={12} />
                <span>종합 리포트</span>
                {reportResult && <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#34d399' }} />}
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

        {/* 3-Stage Pipeline Status Bar */}
        <div style={{ padding: '12px 18px', background: 'rgba(15, 20, 32, 0.7)', borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
          {/* Step Badges */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '8px', alignItems: 'center' }}>
            <div style={{
              flex: 1,
              padding: '6px 10px',
              borderRadius: '6px',
              background: status.stage === 'extracting' ? 'rgba(59, 130, 246, 0.2)' : status.progressPercent >= 30 ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255, 255, 255, 0.03)',
              border: status.stage === 'extracting' ? '1px solid #3b82f6' : status.progressPercent >= 30 ? '1px solid #10b981' : '1px solid rgba(255, 255, 255, 0.06)',
              fontSize: '10.5px',
              fontWeight: 600,
              color: status.stage === 'extracting' ? '#60a5fa' : status.progressPercent >= 30 ? '#34d399' : '#64748b',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <span>1️⃣ Map: 스트리밍 추출</span>
              {status.stage === 'extracting' ? <Loader2 size={11} className="animate-spin" /> : status.progressPercent >= 30 ? <Check size={12} /> : null}
            </div>

            <div style={{
              flex: 1,
              padding: '6px 10px',
              borderRadius: '6px',
              background: status.stage === 'mapping' || status.stage === 'reducing' ? 'rgba(139, 92, 246, 0.2)' : status.progressPercent >= 80 ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255, 255, 255, 0.03)',
              border: status.stage === 'mapping' || status.stage === 'reducing' ? '1px solid #8b5cf6' : status.progressPercent >= 80 ? '1px solid #10b981' : '1px solid rgba(255, 255, 255, 0.06)',
              fontSize: '10.5px',
              fontWeight: 600,
              color: status.stage === 'mapping' || status.stage === 'reducing' ? '#c4b5fd' : status.progressPercent >= 80 ? '#34d399' : '#64748b',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <span>2️⃣ Reduce: 계층형 압축</span>
              {(status.stage === 'mapping' || status.stage === 'reducing') ? <Loader2 size={11} className="animate-spin" /> : status.progressPercent >= 80 ? <Check size={12} /> : null}
            </div>

            <div style={{
              flex: 1,
              padding: '6px 10px',
              borderRadius: '6px',
              background: status.stage === 'synthesizing' ? 'rgba(236, 72, 153, 0.2)' : status.stage === 'done' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255, 255, 255, 0.03)',
              border: status.stage === 'synthesizing' ? '1px solid #ec4899' : status.stage === 'done' ? '1px solid #10b981' : '1px solid rgba(255, 255, 255, 0.06)',
              fontSize: '10.5px',
              fontWeight: 600,
              color: status.stage === 'synthesizing' ? '#f472b6' : status.stage === 'done' ? '#34d399' : '#64748b',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <span>3️⃣ Synthesis: 종합 리포트</span>
              {status.stage === 'synthesizing' ? <Loader2 size={11} className="animate-spin" /> : status.stage === 'done' ? <Check size={12} /> : null}
            </div>
          </div>

          {/* Progress Bar */}
          <div style={{ width: '100%', height: '4px', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '2px', overflow: 'hidden', marginBottom: '6px' }}>
            <div style={{
              width: `${status.progressPercent}%`,
              height: '100%',
              background: 'linear-gradient(90deg, #ef4444, #f59e0b, #10b981)',
              transition: 'width 0.3s ease'
            }} />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '11px' }}>
            <span style={{ color: '#cbd5e1', fontWeight: 500 }}>
              {status.message}
            </span>
            <span style={{ color: '#60a5fa', fontWeight: 700 }}>
              {status.progressPercent}%
            </span>
          </div>
        </div>

        {/* Content Body Area */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          background: '#070a12',
          padding: '16px 18px',
          fontSize: '12px',
          lineHeight: '1.6',
          color: '#e2e8f0',
          fontFamily: activeTab === 'logs' ? "'JetBrains Mono', Consolas, monospace" : "'Inter', -apple-system, sans-serif"
        }}>
          {activeTab === 'logs' ? (
            /* Live Execution Log View */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {logs.length === 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '200px', color: '#64748b', gap: '8px' }}>
                  <Loader2 size={24} className="animate-spin" color="#8b5cf6" />
                  <span>맵리듀스 분석 파이프라인 시동 중...</span>
                </div>
              ) : (
                logs.map((log) => {
                  const isExpanded = expandedLogId === log.id;
                  const stageColor = log.stage === 'extracting' ? '#60a5fa' : log.stage === 'mapping' ? '#a78bfa' : log.stage === 'reducing' ? '#f59e0b' : log.stage === 'synthesizing' ? '#ec4899' : '#10b981';
                  return (
                    <div
                      key={log.id}
                      style={{
                        background: 'rgba(255, 255, 255, 0.02)',
                        border: '1px solid rgba(255, 255, 255, 0.05)',
                        borderRadius: '6px',
                        padding: '8px 12px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '4px'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '10px', color: '#64748b' }}>[{log.time}]</span>
                          <span style={{ fontSize: '9.5px', padding: '1px 5px', borderRadius: '3px', background: `${stageColor}22`, color: stageColor, border: `1px solid ${stageColor}44`, fontWeight: 600 }}>
                            {log.stage.toUpperCase()}
                          </span>
                          <span style={{ color: '#f1f5f9', fontWeight: 500 }}>{log.message}</span>
                        </div>
                        {log.detail && (
                          <button
                            onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                            style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '2px', fontSize: '10px' }}
                          >
                            <span>{isExpanded ? '접기' : '상세보기'}</span>
                            {isExpanded ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
                          </button>
                        )}
                      </div>
                      {isExpanded && log.detail && (
                        <div style={{
                          marginTop: '6px',
                          padding: '8px 10px',
                          background: 'rgba(0,0,0,0.4)',
                          borderRadius: '4px',
                          border: '1px solid rgba(255,255,255,0.06)',
                          color: '#94a3b8',
                          fontSize: '11px',
                          whiteSpace: 'pre-wrap',
                          maxHeight: '160px',
                          overflowY: 'auto'
                        }}>
                          {log.detail}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
              <div ref={logEndRef} />
            </div>
          ) : (
            /* Final Report Markdown View */
            <div style={{ whiteSpace: 'pre-wrap' }}>
              {reportResult ? (
                <div>{reportResult}</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '240px', color: '#64748b', gap: '10px' }}>
                  <Loader2 size={28} className="animate-spin" color="#ec4899" />
                  <span style={{ fontSize: '13px', color: '#cbd5e1' }}>1~2단계 요약을 바탕으로 최종 리포트를 합성 중입니다...</span>
                  <span style={{ fontSize: '11px', color: '#64748b' }}>상단의 [실시간 로그] 탭에서 진행 과정을 확인하실 수 있습니다.</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div style={{
          padding: '10px 18px',
          background: 'rgba(23, 29, 44, 0.95)',
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', gap: '6px' }}>
            {isRunning ? (
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
                분석 중단
              </button>
            ) : (
              <button
                onClick={startAnalysis}
                style={{
                  background: 'rgba(59, 130, 246, 0.15)',
                  border: '1px solid rgba(59, 130, 246, 0.3)',
                  color: '#60a5fa',
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
                <RefreshCw size={12} />
                다시 분석하기
              </button>
            )}
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={handleCopy}
              disabled={!reportResult}
              style={{
                background: copied ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                border: copied ? '1px solid #10b981' : '1px solid rgba(255, 255, 255, 0.15)',
                color: copied ? '#34d399' : '#e2e8f0',
                borderRadius: '5px',
                padding: '6px 14px',
                fontSize: '11.5px',
                fontWeight: 600,
                cursor: reportResult ? 'pointer' : 'not-allowed',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              {copied ? <Check size={13} /> : <Copy size={13} />}
              <span>{copied ? '복사 완료!' : '리포트 복사'}</span>
            </button>

            {onInsertToEditor && (
              <button
                onClick={handleInsert}
                disabled={!reportResult}
                style={{
                  background: inserted ? 'rgba(16, 185, 129, 0.85)' : 'linear-gradient(135deg, #8b5cf6 0%, #3b82f6 100%)',
                  border: 'none',
                  color: '#fff',
                  borderRadius: '5px',
                  padding: '6px 16px',
                  fontSize: '11.5px',
                  fontWeight: 700,
                  cursor: reportResult ? 'pointer' : 'not-allowed',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  boxShadow: '0 2px 12px rgba(139, 92, 246, 0.4)'
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
