/**
 * ============================================================================
 * @file PdfMapReduceModal.tsx
 * @system AMEVA OS Desktop Workstation - PDF Intelligence UI
 * @location packages/core/src/renderer/components/pdf/PdfMapReduceModal.tsx
 * @role 3-Stage Hierarchical Map-Reduce PDF Summarization Modal (SCRUM-166)
 * ============================================================================
 */

import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, X, Check, Copy, FileText, Loader2, StopCircle, RefreshCw, Layers } from 'lucide-react';
import { PdfMapReduceService, MapReduceProgress } from '../../services/pdf/PdfMapReduceService';
import { WebLLMEngineAdapter } from '../../features/ai-agent/adapters/WebLLMEngineAdapter';
import { RemoteHttpEngineAdapter } from '../../features/ai-agent/adapters/RemoteHttpEngineAdapter';
import { useWebLLM } from '../useWebLLM';

interface PdfMapReduceModalProps {
  pdf: any;
  fileName: string;
  numPages: number;
  onClose: () => void;
  onInsertToEditor?: (reportText: string) => void;
}

export const PdfMapReduceModal: React.FC<PdfMapReduceModalProps> = ({
  pdf,
  fileName,
  numPages,
  onClose,
  onInsertToEditor
}) => {
  const { generateStream, isLLMReady } = useWebLLM();
  const [status, setStatus] = useState<MapReduceProgress>({
    stage: 'extracting',
    progressPercent: 0,
    currentStep: 0,
    totalSteps: numPages,
    message: '대용량 PDF 3단계 맵리듀스 분석 준비 중...'
  });
  const [reportResult, setReportResult] = useState<string>('');
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [inserted, setInserted] = useState<boolean>(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const startAnalysis = async () => {
    if (!pdf) return;
    setIsRunning(true);
    setReportResult('');
    setInserted(false);

    const ac = new AbortController();
    abortControllerRef.current = ac;

    // Check active engine mode from localStorage or default
    const savedEngine = localStorage.getItem('ameva_selected_llm_model');
    const isApiMode = localStorage.getItem('ameva_engine_mode') === 'api';

    let adapter: any;
    if (isApiMode) {
      const http = new RemoteHttpEngineAdapter();
      http.setConfig({
        endpoint: localStorage.getItem('ameva_api_endpoint') || 'http://localhost:11434/v1/chat/completions',
        model: localStorage.getItem('ameva_api_model') || 'qwen2.5:3b',
        apiKey: localStorage.getItem('ameva_api_key') || ''
      });
      adapter = http;
    } else {
      adapter = new WebLLMEngineAdapter((sys, user, opt) => generateStream(sys, user, opt), isLLMReady);
    }

    try {
      const finalReport = await PdfMapReduceService.runFullMapReducePipeline(
        pdf,
        fileName,
        numPages,
        adapter,
        ac.signal,
        (progress) => setStatus(progress),
        (chunk) => setReportResult((prev) => prev + chunk)
      );
      setReportResult(finalReport);
    } catch (err: any) {
      if (ac.signal.aborted) {
        setStatus({
          stage: 'error',
          progressPercent: 0,
          currentStep: 0,
          totalSteps: 0,
          message: '사용자에 의해 분석이 중단되었습니다.'
        });
      } else {
        setStatus({
          stage: 'error',
          progressPercent: 0,
          currentStep: 0,
          totalSteps: 0,
          message: `분석 실패: ${err?.message || '알 수 없는 오류'}`
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
      background: 'rgba(5, 7, 15, 0.85)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      padding: '20px'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '840px',
        maxHeight: '90vh',
        background: '#111420',
        border: '1px solid rgba(139, 92, 246, 0.4)',
        borderRadius: '12px',
        boxShadow: '0 12px 48px rgba(0, 0, 0, 0.7), 0 0 24px rgba(139, 92, 246, 0.15)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{
          padding: '12px 18px',
          background: 'rgba(30, 41, 59, 0.95)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: '28px',
              height: '28px',
              borderRadius: '6px',
              background: 'linear-gradient(135deg, #8b5cf6 0%, #3b82f6 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 8px rgba(139, 92, 246, 0.4)'
            }}>
              <Layers size={16} color="#fff" />
            </div>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span>대용량 PDF 3단계 계층형 맵리듀스 AI 상세 요약</span>
                <span style={{ fontSize: '10px', background: 'rgba(59, 130, 246, 0.2)', color: '#60a5fa', padding: '1px 6px', borderRadius: '4px', border: '1px solid rgba(59, 130, 246, 0.4)' }}>
                  SCRUM-166
                </span>
              </div>
              <div style={{ fontSize: '10px', color: '#94a3b8' }}>
                {fileName} (총 {numPages} 페이지 분석)
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '4px' }}
          >
            <X size={16} />
          </button>
        </div>

        {/* 3-Stage Pipeline Status Bar */}
        <div style={{ padding: '14px 18px', background: 'rgba(15, 23, 42, 0.6)', borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
          {/* Step Badges */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '10px', alignItems: 'center' }}>
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
              gap: '6px'
            }}>
              <span>1️⃣ Map: 스트리밍 추출</span>
              {status.stage === 'extracting' && <Loader2 size={11} className="animate-spin" />}
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
              gap: '6px'
            }}>
              <span>2️⃣ Reduce: 계층형 압축</span>
              {(status.stage === 'mapping' || status.stage === 'reducing') && <Loader2 size={11} className="animate-spin" />}
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
              gap: '6px'
            }}>
              <span>3️⃣ Synthesis: 종합 리포트</span>
              {status.stage === 'synthesizing' && <Loader2 size={11} className="animate-spin" />}
            </div>
          </div>

          {/* Progress Bar */}
          <div style={{ width: '100%', height: '4px', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '2px', overflow: 'hidden', marginBottom: '6px' }}>
            <div style={{
              width: `${status.progressPercent}%`,
              height: '100%',
              background: 'linear-gradient(90deg, #3b82f6, #8b5cf6, #ec4899)',
              transition: 'width 0.3s ease'
            }} />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '10.5px' }}>
            <span style={{ color: '#cbd5e1', fontWeight: 500 }}>
              {status.message}
            </span>
            <span style={{ color: '#94a3b8', fontWeight: 600 }}>
              {status.progressPercent}%
            </span>
          </div>
        </div>

        {/* Report Output Content Area */}
        <div style={{
          flex: 1,
          padding: '16px 18px',
          overflowY: 'auto',
          minHeight: '280px',
          background: '#0a0d16',
          fontSize: '12px',
          lineHeight: '1.6',
          color: '#e2e8f0',
          whiteSpace: 'pre-wrap',
          fontFamily: "'Inter', -apple-system, sans-serif"
        }}>
          {reportResult ? (
            <div>{reportResult}</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#64748b', gap: '8px', minHeight: '200px' }}>
              <Loader2 size={24} className="animate-spin" color="#8b5cf6" />
              <span>PDF 문서 구조 분석 및 맵리듀스 파이프라인 가동 중...</span>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div style={{
          padding: '10px 18px',
          background: 'rgba(30, 41, 59, 0.95)',
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
                  padding: '5px 10px',
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
                  padding: '5px 10px',
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

          <div style={{ display: 'flex', gap: '6px' }}>
            <button
              onClick={handleCopy}
              disabled={!reportResult}
              style={{
                background: copied ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                border: copied ? '1px solid #10b981' : '1px solid rgba(255, 255, 255, 0.15)',
                color: copied ? '#34d399' : '#e2e8f0',
                borderRadius: '4px',
                padding: '5px 12px',
                fontSize: '11px',
                fontWeight: 600,
                cursor: reportResult ? 'pointer' : 'not-allowed',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              {copied ? <Check size={12} /> : <Copy size={12} />}
              <span>{copied ? '복사 완료!' : '리포트 복사'}</span>
            </button>

            {onInsertToEditor && (
              <button
                onClick={handleInsert}
                disabled={!reportResult}
                style={{
                  background: inserted ? 'rgba(16, 185, 129, 0.8)' : 'linear-gradient(135deg, #8b5cf6 0%, #3b82f6 100%)',
                  border: 'none',
                  color: '#fff',
                  borderRadius: '4px',
                  padding: '5px 14px',
                  fontSize: '11px',
                  fontWeight: 700,
                  cursor: reportResult ? 'pointer' : 'not-allowed',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  boxShadow: '0 2px 10px rgba(139, 92, 246, 0.4)'
                }}
              >
                {inserted ? <Check size={12} /> : <FileText size={12} />}
                <span>{inserted ? '에디터 삽입 완료!' : '에디터 본문에 삽입'}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
