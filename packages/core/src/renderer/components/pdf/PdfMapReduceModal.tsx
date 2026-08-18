/**
 * ============================================================================
 * @file PdfMapReduceModal.tsx
 * @system AMEVA OS Desktop Workstation - PDF Intelligence UI
 * @location packages/core/src/renderer/components/pdf/PdfMapReduceModal.tsx
 * @role 3-Stage Hierarchical Map-Reduce PDF Summarization Modal (SCRUM-173)
 * ============================================================================
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  Sparkles, 
  X, 
  Check, 
  Copy, 
  FileText, 
  Loader2, 
  StopCircle, 
  RefreshCw, 
  Layers, 
  Terminal, 
  ChevronDown, 
  ChevronRight, 
  Cpu, 
  Globe, 
  Eye, 
  Code,
  Minus
} from 'lucide-react';
import { marked } from 'marked';
import { PdfMapReduceService } from '../../services/pdf/PdfMapReduceService';
import type { MapReduceProgress, MapReduceLogItem } from '../../services/pdf/PdfMapReduceService';
import { WebLLMEngineAdapter } from '../../features/ai-agent/adapters/WebLLMEngineAdapter';
import { RemoteHttpEngineAdapter } from '../../features/ai-agent/adapters/RemoteHttpEngineAdapter';
import { useWebLLM } from '../useWebLLM';
import { useDocumentSummaryStore } from '../../stores/useDocumentSummaryStore';
import { normalizeMarkdownTables } from '../../utils/markdownUtils';

interface PdfMapReduceModalProps {
  pdf?: any;
  fileId?: string;
  pdfData?: string;
  fileName: string;
  numPages: number;
  blockId?: string;
  onClose: () => void;
  onInsertToEditor?: (reportText: string) => void;
}

export const PdfMapReduceModal: React.FC<PdfMapReduceModalProps> = ({
  pdf,
  fileId,
  pdfData,
  fileName,
  numPages,
  blockId,
  onClose,
  onInsertToEditor
}) => {
  const taskId = fileId || fileName;
  const { generateStream, isMainReady, isMainLoading, mainProgress, mainProgressText, initModel, activeModelId } = useWebLLM();
  const { 
    tasks, 
    registerSummaryTask, 
    updateProgress, 
    appendLog, 
    setReportResult: setStoreReport, 
    setTaskDone, 
    setTaskError, 
    setDeckExpanded,
    closeModal 
  } = useDocumentSummaryStore();

  const storeTask = tasks[taskId];

  const [activeTab, setActiveTab] = useState<'report' | 'logs'>('logs');
  const [viewMode, setViewMode] = useState<'rendered' | 'raw'>('rendered');
  const [selectedEngine, setSelectedEngine] = useState<'webgpu-0.5b' | 'webgpu-1.5b' | 'api'>(() => {
    const mode = localStorage.getItem('ameva_engine_mode');
    if (mode === 'api') return 'api';
    const model = localStorage.getItem('ameva_selected_llm_model');
    if (model?.includes('1.5B')) return 'webgpu-1.5b';
    return 'webgpu-0.5b';
  });

  const [status, setStatus] = useState<MapReduceProgress>(() => {
    if (storeTask) {
      return {
        stage: storeTask.stage,
        progressPercent: storeTask.progressPercent,
        currentStep: 0,
        totalSteps: numPages,
        message: storeTask.statusMessage
      };
    }
    return {
      stage: 'extracting',
      progressPercent: 5,
      currentStep: 0,
      totalSteps: numPages,
      message: '대용량 PDF 3단계 맵리듀스 파이프라인 가동 준비 중...'
    };
  });

  const [logs, setLogs] = useState<MapReduceLogItem[]>(() => storeTask?.logs || []);
  const [reportResult, setReportResult] = useState<string>(() => storeTask?.reportResult || '');
  const [renderedHtml, setRenderedHtml] = useState<string>('');
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [inserted, setInserted] = useState<boolean>(false);
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);
  const logEndRef = useRef<HTMLDivElement>(null);

  const addLog = (log: MapReduceLogItem) => {
    setLogs((prev) => [...prev, log]);
    appendLog(taskId, log);
  };

  // WebGPU 모델 가중치 로딩 진행률 실시간 동기화
  useEffect(() => {
    if (isMainLoading && isRunning) {
      const p = Math.max(5, Math.min(25, Math.round((mainProgress || 0) * 25)));
      setStatus((prev) => ({
        ...prev,
        stage: 'extracting',
        progressPercent: p,
        message: mainProgressText ? `WebGPU VRAM 적재 중: ${mainProgressText}` : 'WebGPU VRAM 가속기 적재 중...'
      }));
    }
  }, [isMainLoading, mainProgress, mainProgressText, isRunning]);

  // 마크다운 파싱 비동기/동기 완전 대응
  useEffect(() => {
    if (!reportResult) {
      setRenderedHtml('');
      return;
    }
    try {
      const normalized = normalizeMarkdownTables(reportResult);
      const parsed = marked.parse(normalized, { gfm: true, breaks: true });
      if (parsed instanceof Promise) {
        parsed.then((html) => setRenderedHtml(html as string));
      } else {
        setRenderedHtml(parsed as string);
      }
    } catch (err) {
      console.warn('[PdfMapReduce] marked parsing error:', err);
      setRenderedHtml(reportResult);
    }
  }, [reportResult]);

  // FIFO 큐에서 다음 순번이 되어 실행 시작될 때 리스너
  useEffect(() => {
    const handleQueueStart = (e: any) => {
      if (e.detail?.taskId === taskId) {
        startAnalysisWithEngine(selectedEngine);
      }
    };
    window.addEventListener('ameva:summary-queue-start', handleQueueStart);
    return () => window.removeEventListener('ameva:summary-queue-start', handleQueueStart);
  }, [taskId, selectedEngine]);

  const startAnalysisWithEngine = async (engineChoice = selectedEngine) => {
    if (isRunning) return;

    const ac = new AbortController();
    abortControllerRef.current = ac;

    // 글로벌 스토어에 태스크 등록 (FIFO 큐 스케줄러 검사)
    const { isQueued, queuePosition } = registerSummaryTask({
      id: taskId,
      fileId,
      blockId,
      fileName,
      docType: fileName.toLowerCase().endsWith('.pptx') ? 'pptx' : fileName.toLowerCase().endsWith('.docx') ? 'docx' : fileName.toLowerCase().endsWith('.xlsx') ? 'xlsx' : 'pdf',
      numPages,
      abortController: ac
    });

    if (isQueued) {
      const qProg: MapReduceProgress = {
        stage: 'queued' as any,
        progressPercent: 0,
        currentStep: 0,
        totalSteps: numPages,
        message: `⏳ 프로세스 대기 큐 등록됨 (선입선출 대기 순번 #${queuePosition}번)`
      };
      setStatus(qProg);
      setIsRunning(false);
      return;
    }

    setIsRunning(true);
    setReportResult('');
    setInserted(false);
    setLogs([]);
    setActiveTab('logs');

    try {
      // 1. AI Engine Auto-Preparation
      let adapter: any;
      if (engineChoice === 'api') {
        const endpoint = localStorage.getItem('ameva_api_endpoint') || 'http://localhost:11434/v1/chat/completions';
        const model = localStorage.getItem('ameva_api_model') || 'qwen2.5:3b';
        addLog({
          id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
          time: new Date().toLocaleTimeString(),
          stage: 'system',
          message: `🌐 로컬 Ollama / 원격 API 엔진(${model})에 연결합니다...`
        });
        const http = new RemoteHttpEngineAdapter({
          endpoint,
          model,
          apiKey: localStorage.getItem('ameva_api_key') || ''
        });
        adapter = http;
      } else {
        const targetModel = engineChoice === 'webgpu-1.5b' 
          ? 'Qwen2.5-1.5B-Instruct-q4f32_1-MLC' 
          : 'Qwen2.5-0.5B-Instruct-q4f32_1-MLC';
        
        localStorage.setItem('ameva_selected_llm_model', targetModel);
        localStorage.setItem('ameva_engine_mode', 'webgpu');

        if (!isMainReady || activeModelId !== targetModel) {
          const modelLabel = targetModel.includes('1.5B') ? '1.5B (890MB)' : '0.5B (390MB)';
          const initProg: MapReduceProgress = {
            stage: 'extracting',
            progressPercent: 10,
            currentStep: 0,
            totalSteps: numPages,
            message: `⚡ WebGPU 온디바이스 AI 가속기(${modelLabel})를 VRAM에 적재 중...`
          };
          setStatus(initProg);
          updateProgress(taskId, initProg);

          addLog({
            id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
            time: new Date().toLocaleTimeString(),
            stage: 'system',
            message: `⚡ WebGPU 가속기(${modelLabel}) VRAM 적재 시작...`
          });
          await initModel(targetModel);
          addLog({
            id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
            time: new Date().toLocaleTimeString(),
            stage: 'system',
            message: `✅ WebGPU VRAM 적재 완료! Zero-Cloud 로컬 분석을 가동합니다.`
          });
        }
        adapter = new WebLLMEngineAdapter(generateStream, false);
      }

      // 2. Run Map-Reduce Full Pipeline
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
          updateProgress(taskId, progress);
        },
        (log) => addLog(log),
        (chunk) => {
          setReportResult((prev) => {
            const next = prev + chunk;
            queueMicrotask(() => {
              setStoreReport(taskId, next);
            });
            return next;
          });
          setActiveTab('report');
        }
      );

      setReportResult(finalReport);
      setTaskDone(taskId, finalReport);
      setActiveTab('report');
      setStatus({
        stage: 'done',
        progressPercent: 100,
        currentStep: numPages,
        totalSteps: numPages,
        message: '🎉 [완료] 대용량 문서 3단계 맵리듀스 분석이 완료되었습니다!'
      });
    } catch (err: any) {
      if (err?.name === 'AbortError' || err?.message?.includes('중단')) {
        addLog({
          id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
          time: new Date().toLocaleTimeString(),
          stage: 'system',
          message: '🛑 사용자에 의해 분석이 중단되었습니다.'
        });
        setStatus((prev) => ({ ...prev, stage: 'error', message: '🛑 분석 작업이 중단되었습니다.' }));
        setTaskError(taskId, '분석 중단');
      } else {
        console.error('[PdfMapReduceModal] Error:', err);
        addLog({
          id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
          time: new Date().toLocaleTimeString(),
          stage: 'system',
          message: `❌ 오류 발생: ${err?.message || '알 수 없는 에러'}`
        });
        setStatus((prev) => ({
          ...prev,
          stage: 'error',
          message: `❌ 분석 실패: ${err?.message || '오류 발생'}`
        }));
        setTaskError(taskId, err?.message || '오류 발생');
      }
    } finally {
      setIsRunning(false);
    }
  };

  const handleStop = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setIsRunning(false);
  };

  const handleCopy = async () => {
    if (!reportResult) return;
    try {
      const normalized = normalizeMarkdownTables(reportResult);
      await navigator.clipboard.writeText(normalized);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy report:', err);
    }
  };

  const handleInsert = () => {
    if (!reportResult) return;
    const normalized = normalizeMarkdownTables(reportResult);
    onInsertToEditor?.(normalized);
    setInserted(true);
    setTimeout(() => {
      setInserted(false);
      closeModal();
      onClose();
    }, 800);
  };

  const handleMinimize = () => {
    setDeckExpanded(true);
    closeModal();
    onClose();
  };

  // Auto scroll logs
  useEffect(() => {
    if (activeTab === 'logs') {
      logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, activeTab]);

  // Auto start on mount if no previous result
  useEffect(() => {
    if (storeTask?.reportResult && storeTask.stage === 'done') {
      setReportResult(storeTask.reportResult);
      setActiveTab('report');
    } else if (storeTask?.stage === 'queued') {
      // FIFO 큐 대기 상태 유지
    } else {
      const timer = setTimeout(() => {
        startAnalysisWithEngine();
      }, 50);
      return () => clearTimeout(timer);
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
        .ameva-report-markdown, .ameva-report-markdown * {
          user-select: text !important;
          -webkit-user-select: text !important;
        }
        .ameva-report-markdown {
          font-size: 13.5px;
          line-height: 1.7;
          color: #f1f5f9;
          font-family: Pretendard, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        }
        .ameva-report-markdown h1 {
          font-size: 18px;
          font-weight: 800;
          color: #60a5fa;
          margin-top: 0;
          margin-bottom: 16px;
          padding-bottom: 8px;
          border-bottom: 1px solid rgba(96, 165, 250, 0.3);
        }
        .ameva-report-markdown h2 {
          font-size: 15px;
          font-weight: 700;
          color: #38bdf8;
          margin-top: 20px;
          margin-bottom: 10px;
        }
        .ameva-report-markdown h3 {
          font-size: 13.5px;
          font-weight: 600;
          color: #34d399;
          margin-top: 14px;
          margin-bottom: 8px;
        }
        .ameva-report-markdown p {
          margin-bottom: 10px;
        }
        .ameva-report-markdown ul, .ameva-report-markdown ol {
          margin-bottom: 12px;
          padding-left: 20px;
        }
        .ameva-report-markdown li {
          margin-bottom: 4px;
        }
        .ameva-report-markdown table {
          width: 100%;
          border-collapse: collapse;
          margin: 14px 0;
          border: 1px solid #334155;
          border-radius: 8px;
          overflow: hidden;
          background: #0f172a;
        }
        .ameva-report-markdown th {
          background: #1e293b;
          color: #93c5fd;
          font-weight: 700;
          text-align: left;
          padding: 8px 12px;
          font-size: 12px;
          border-bottom: 1px solid #334155;
        }
        .ameva-report-markdown td {
          padding: 8px 12px;
          font-size: 12px;
          border-bottom: 1px solid #1e293b;
          color: #e2e8f0;
        }
        .ameva-report-markdown tr:last-child td {
          border-bottom: none;
        }
        .ameva-report-markdown tr:hover td {
          background: rgba(255, 255, 255, 0.04);
        }
        .ameva-report-markdown blockquote {
          margin: 12px 0;
          padding: 8px 14px;
          border-left: 3px solid #3b82f6;
          background: rgba(59, 130, 246, 0.08);
          border-radius: 0 6px 6px 0;
          color: #cbd5e1;
        }
        .ameva-report-markdown strong {
          color: #ffffff;
          font-weight: 700;
        }
      `}</style>

      <div style={{
        width: '100%',
        maxWidth: '920px',
        height: '86vh',
        background: '#0a0d14',
        border: '1px solid rgba(59, 130, 246, 0.25)',
        borderRadius: '12px',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.85), 0 0 24px rgba(59, 130, 246, 0.12)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{
          padding: '12px 18px',
          background: 'rgba(15, 20, 32, 0.95)',
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
              background: 'linear-gradient(135deg, #2563eb 0%, #06b6d4 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 10px rgba(37, 99, 235, 0.4)'
            }}>
              <Layers size={16} color="#fff" />
            </div>
            <div>
              <div style={{ fontSize: '13.5px', fontWeight: 700, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>
                  {fileName.toLowerCase().endsWith('.docx') ? 'Word 문서 계층형 맵리듀스 AI 요약' :
                   fileName.toLowerCase().endsWith('.pptx') ? 'PPTX 슬라이드 계층형 맵리듀스 AI 요약' :
                   fileName.toLowerCase().endsWith('.hwpx') ? 'HWPX 한글 계층형 맵리듀스 AI 요약' :
                   fileName.toLowerCase().endsWith('.xlsx') ? '엑셀 데이터 계층형 맵리듀스 AI 요약' :
                   '대용량 문서 계층형 맵리듀스 AI 상세 요약'}
                </span>
              </div>
              <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>
                {fileName} ({numPages ? `총 ${numPages} ${fileName.toLowerCase().endsWith('.pptx') ? '슬라이드' : '페이지/섹션'} 대상` : '문서 전수 분석'})
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {/* Engine Quick Selector */}
            <div style={{ display: 'flex', background: 'rgba(0,0,0,0.4)', padding: '2px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.08)' }}>
              <button
                onClick={() => {
                  setSelectedEngine('webgpu-0.5b');
                  startAnalysisWithEngine('webgpu-0.5b');
                }}
                disabled={isRunning || status.stage === 'queued'}
                title="Qwen2.5 0.5B (390MB) 초경량 온디바이스 모델"
                style={{
                  padding: '3px 8px',
                  borderRadius: '4px',
                  border: 'none',
                  background: selectedEngine === 'webgpu-0.5b' ? 'rgba(16, 185, 129, 0.25)' : 'transparent',
                  color: selectedEngine === 'webgpu-0.5b' ? '#34d399' : '#64748b',
                  fontSize: '10.5px',
                  fontWeight: 600,
                  cursor: isRunning ? 'not-allowed' : 'pointer'
                }}
              >
                ⚡ 0.5B
              </button>
              <button
                onClick={() => {
                  setSelectedEngine('webgpu-1.5b');
                  startAnalysisWithEngine('webgpu-1.5b');
                }}
                disabled={isRunning || status.stage === 'queued'}
                title="Qwen2.5 1.5B (890MB) 고품질 온디바이스 모델"
                style={{
                  padding: '3px 8px',
                  borderRadius: '4px',
                  border: 'none',
                  background: selectedEngine === 'webgpu-1.5b' ? 'rgba(59, 130, 246, 0.25)' : 'transparent',
                  color: selectedEngine === 'webgpu-1.5b' ? '#93c5fd' : '#64748b',
                  fontSize: '10.5px',
                  fontWeight: 600,
                  cursor: isRunning ? 'not-allowed' : 'pointer'
                }}
              >
                🚀 1.5B
              </button>
              <button
                onClick={() => {
                  setSelectedEngine('api');
                  startAnalysisWithEngine('api');
                }}
                disabled={isRunning || status.stage === 'queued'}
                title="로컬 Ollama / 원격 API (DeepSeek/Qwen 7B/14B 등 고성능)"
                style={{
                  padding: '3px 8px',
                  borderRadius: '4px',
                  border: 'none',
                  background: selectedEngine === 'api' ? 'rgba(6, 182, 212, 0.25)' : 'transparent',
                  color: selectedEngine === 'api' ? '#67e8f9' : '#64748b',
                  fontSize: '10.5px',
                  fontWeight: 600,
                  cursor: isRunning ? 'not-allowed' : 'pointer'
                }}
              >
                🌐 Ollama
              </button>
            </div>

            {/* View Switcher Tabs */}
            <div style={{ display: 'flex', background: 'rgba(0,0,0,0.3)', padding: '2px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.08)' }}>
              <button
                onClick={() => setActiveTab('logs')}
                style={{
                  padding: '4px 10px',
                  borderRadius: '4px',
                  border: 'none',
                  background: activeTab === 'logs' ? '#2563eb' : 'transparent',
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
                  background: activeTab === 'report' ? '#0284c7' : 'transparent',
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

            {/* 최소화 버튼 (보관함 덱으로 접기) */}
            <button
              onClick={handleMinimize}
              title="보관함 덱으로 최소화"
              style={{
                background: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: '#cbd5e1',
                cursor: 'pointer',
                padding: '4px 8px',
                borderRadius: '5px',
                display: 'flex',
                alignItems: 'center'
              }}
            >
              <Minus size={15} />
            </button>

            {/* 닫기 버튼 */}
            <button
              onClick={() => {
                closeModal();
                onClose();
              }}
              title="닫기"
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
              <span>1단계 Map: 스트리밍 추출</span>
              {status.stage === 'extracting' ? <Loader2 size={11} className="animate-spin" /> : status.progressPercent >= 30 ? <Check size={12} /> : null}
            </div>

            <div style={{
              flex: 1,
              padding: '6px 10px',
              borderRadius: '6px',
              background: status.stage === 'mapping' || status.stage === 'reducing' ? 'rgba(59, 130, 246, 0.2)' : status.progressPercent >= 80 ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255, 255, 255, 0.03)',
              border: status.stage === 'mapping' || status.stage === 'reducing' ? '1px solid #3b82f6' : status.progressPercent >= 80 ? '1px solid #10b981' : '1px solid rgba(255, 255, 255, 0.06)',
              fontSize: '10.5px',
              fontWeight: 600,
              color: status.stage === 'mapping' || status.stage === 'reducing' ? '#93c5fd' : status.progressPercent >= 80 ? '#34d399' : '#64748b',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <span>2단계 Reduce: 계층형 압축</span>
              {(status.stage === 'mapping' || status.stage === 'reducing') ? <Loader2 size={11} className="animate-spin" /> : status.progressPercent >= 80 ? <Check size={12} /> : null}
            </div>

            <div style={{
              flex: 1,
              padding: '6px 10px',
              borderRadius: '6px',
              background: status.stage === 'synthesizing' ? 'rgba(6, 182, 212, 0.2)' : status.stage === 'done' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255, 255, 255, 0.03)',
              border: status.stage === 'synthesizing' ? '1px solid #06b6d4' : status.stage === 'done' ? '1px solid #10b981' : '1px solid rgba(255, 255, 255, 0.06)',
              fontSize: '10.5px',
              fontWeight: 600,
              color: status.stage === 'synthesizing' ? '#67e8f9' : status.stage === 'done' ? '#34d399' : '#64748b',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <span>3단계 Synthesis: 종합 리포트</span>
              {status.stage === 'synthesizing' ? <Loader2 size={11} className="animate-spin" /> : status.stage === 'done' ? <Check size={12} /> : null}
            </div>
          </div>

          {/* Progress Bar */}
          <div style={{ width: '100%', height: '4px', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '2px', overflow: 'hidden', marginBottom: '6px' }}>
            <div style={{
              width: `${status.progressPercent}%`,
              height: '100%',
              background: 'linear-gradient(90deg, #3b82f6, #06b6d4, #10b981)',
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
          padding: '16px 20px',
          fontSize: '12.5px',
          lineHeight: '1.65',
          color: '#e2e8f0',
          userSelect: 'text',
          WebkitUserSelect: 'text',
          fontFamily: activeTab === 'logs' ? "'JetBrains Mono', Consolas, monospace" : "Pretendard, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
        }}>
          {status.stage === 'queued' ? (
            /* ── FIFO Process Queue Waiting Screen ── */
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              minHeight: '260px',
              gap: '14px',
              textAlign: 'center',
              padding: '24px'
            }}>
              <div style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                background: 'rgba(59, 130, 246, 0.12)',
                border: '1.5px solid rgba(59, 130, 246, 0.35)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 24px rgba(59, 130, 246, 0.2)'
              }}>
                <Loader2 size={28} className="animate-spin" color="#60a5fa" />
              </div>
              <div>
                <div style={{ fontSize: '15px', fontWeight: 700, color: '#f8fafc', marginBottom: '6px' }}>
                  선입선출(FIFO) 프로세스 큐에서 대기 중
                </div>
                <div style={{ fontSize: '12px', color: '#94a3b8', maxWidth: '420px', lineHeight: '1.5' }}>
                  현재 다른 문서의 AI 맵리듀스 분석이 진행 중입니다.<br/>
                  이전 작업이 끝나는 즉시 <strong style={{ color: '#60a5fa' }}>대기 순번 #{storeTask?.queuePosition || 1}번</strong>으로 자동 시작됩니다.
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                <button
                  onClick={() => {
                    useDocumentSummaryStore.getState().forceStartTask(taskId);
                    startAnalysisWithEngine(selectedEngine);
                  }}
                  style={{
                    padding: '6px 16px',
                    borderRadius: '6px',
                    background: 'linear-gradient(135deg, #2563eb 0%, #06b6d4 100%)',
                    border: 'none',
                    color: '#ffffff',
                    fontSize: '11.5px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    boxShadow: '0 2px 10px rgba(37, 99, 235, 0.3)'
                  }}
                >
                  <Sparkles size={12} />
                  즉시 분석 시작
                </button>
                <button
                  onClick={handleStop}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '6px',
                    background: 'rgba(239, 68, 68, 0.15)',
                    border: '1px solid rgba(239, 68, 68, 0.35)',
                    color: '#fca5a5',
                    fontSize: '11.5px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  대기 취소
                </button>
              </div>
            </div>
          ) : activeTab === 'logs' ? (
            /* Live Execution Log View */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {logs.length === 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '200px', color: '#64748b', gap: '8px' }}>
                  <Loader2 size={24} className="animate-spin" color="#3b82f6" />
                  <span>맵리듀스 분석 파이프라인 시동 중...</span>
                </div>
              ) : (
                logs.map((log) => {
                  const isExpanded = expandedLogId === log.id;
                  const stageColor = log.stage === 'extracting' ? '#60a5fa' : log.stage === 'mapping' ? '#38bdf8' : log.stage === 'reducing' ? '#06b6d4' : log.stage === 'synthesizing' ? '#10b981' : '#3b82f6';
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
                          border: '1px solid rgba(255,255,255,0.05)',
                          borderRadius: '4px',
                          color: '#94a3b8',
                          fontSize: '11px',
                          whiteSpace: 'pre-wrap',
                          maxHeight: '120px',
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
            <div>
              {/* Render View Mode Toggle */}
              {reportResult && (
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '10px' }}>
                  <div style={{ display: 'flex', background: 'rgba(255,255,255,0.05)', padding: '2px', borderRadius: '5px', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <button
                      onClick={() => setViewMode('rendered')}
                      style={{
                        padding: '3px 8px',
                        borderRadius: '3px',
                        border: 'none',
                        background: viewMode === 'rendered' ? '#2563eb' : 'transparent',
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
                        background: viewMode === 'raw' ? '#2563eb' : 'transparent',
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
                      마크다운 원본
                    </button>
                  </div>
                </div>
              )}

              {reportResult ? (
                viewMode === 'rendered' ? (
                  <div
                    className="ameva-report-markdown"
                    dangerouslySetInnerHTML={{ __html: renderedHtml }}
                  />
                ) : (
                  <div style={{ whiteSpace: 'pre-wrap', fontFamily: "'JetBrains Mono', Consolas, monospace", fontSize: '11.5px', color: '#cbd5e1' }}>
                    {reportResult}
                  </div>
                )
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
            ) : status.stage === 'error' ? (
              <div style={{ display: 'flex', gap: '6px' }}>
                <button
                  onClick={() => {
                    setSelectedEngine('webgpu-0.5b');
                    startAnalysisWithEngine('webgpu-0.5b');
                  }}
                  style={{
                    background: 'rgba(16, 185, 129, 0.15)',
                    border: '1px solid rgba(16, 185, 129, 0.4)',
                    color: '#34d399',
                    borderRadius: '4px',
                    padding: '6px 12px',
                    fontSize: '11px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <Cpu size={12} />
                  ⚡ 0.5B 초경량(390MB)으로 재시도
                </button>
                <button
                  onClick={() => {
                    setSelectedEngine('api');
                    startAnalysisWithEngine('api');
                  }}
                  style={{
                    background: 'rgba(59, 130, 246, 0.15)',
                    border: '1px solid rgba(59, 130, 246, 0.4)',
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
                  <Globe size={12} />
                  🌐 Ollama API로 전환
                </button>
              </div>
            ) : (
              <button
                onClick={() => startAnalysisWithEngine()}
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
                  background: inserted ? 'rgba(16, 185, 129, 0.85)' : 'linear-gradient(135deg, #2563eb 0%, #0284c7 100%)',
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
