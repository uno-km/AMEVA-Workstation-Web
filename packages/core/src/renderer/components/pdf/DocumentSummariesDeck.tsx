/**
 * ============================================================================
 * @file DocumentSummariesDeck.tsx
 * @system AMEVA OS Desktop Workstation - UI Deck System
 * @location packages/core/src/renderer/components/pdf/DocumentSummariesDeck.tsx
 * @role Flipped Document Summaries Card Deck Floating Dock Component (SCRUM-173)
 * ============================================================================
 */

import React from 'react';
import { 
  FileText, 
  Layers, 
  ChevronUp, 
  ChevronDown, 
  Check, 
  Loader2, 
  X, 
  Maximize2, 
  Sparkles, 
  AlertCircle,
  Presentation,
  FileType2,
  FileSpreadsheet
} from 'lucide-react';
import { useDocumentSummaryStore } from '../../stores/useDocumentSummaryStore';

export const DocumentSummariesDeck: React.FC = () => {
  const { 
    tasks, 
    isDeckExpanded, 
    toggleDeckExpanded, 
    openModalForTask, 
    removeTask 
  } = useDocumentSummaryStore();

  const taskList = Object.values(tasks);

  // 등록된 요약 태스크가 없으면 아무것도 렌더링하지 않음
  if (taskList.length === 0) {
    return null;
  }

  const runningCount = taskList.filter(t => t.stage !== 'done' && t.stage !== 'error').length;
  const doneCount = taskList.filter(t => t.stage === 'done').length;

  const getDocIcon = (docType: string) => {
    switch (docType) {
      case 'pptx': return <Presentation size={15} color="#f97316" />;
      case 'docx': return <FileType2 size={15} color="#3b82f6" />;
      case 'xlsx': return <FileSpreadsheet size={15} color="#22c55e" />;
      default: return <FileText size={15} color="#ef4444" />;
    }
  };

  // 덱이 펼쳐진 상태가 아니면 렌더링하지 않음 (상태바의 인디케이터가 트리거 역할)
  if (!isDeckExpanded) {
    return null;
  }

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '28px',
        right: '12px',
        zIndex: 99990,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-end',
        fontFamily: 'Pretendard, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        userSelect: 'none',
      }}
    >
      {/* ─── 확장된 카드 덱 목록 (상태바 위 팝오버) ─── */}
      <div
        style={{
          width: '380px',
          maxHeight: '440px',
          background: 'rgba(10, 13, 20, 0.95)',
          backdropFilter: 'blur(16px)',
          border: '1.5px solid rgba(59, 130, 246, 0.35)',
          borderRadius: '12px',
          boxShadow: '0 16px 48px rgba(0, 0, 0, 0.8), 0 0 24px rgba(59, 130, 246, 0.15)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          animation: 'fadeInSlideUp 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        {/* 덱 헤더 */}
        <div
          style={{
            padding: '10px 14px',
            background: 'rgba(15, 20, 32, 0.95)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: '24px',
              height: '24px',
              borderRadius: '6px',
              background: 'linear-gradient(135deg, #2563eb 0%, #06b6d4 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Layers size={13} color="#fff" />
            </div>
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#f8fafc' }}>
              AI 문서 요약 보관함
            </span>
            <span style={{
              fontSize: '10px',
              fontWeight: 700,
              background: 'rgba(59, 130, 246, 0.2)',
              color: '#93c5fd',
              padding: '1px 6px',
              borderRadius: '10px',
              border: '1px solid rgba(59, 130, 246, 0.4)',
            }}>
              {taskList.length}
            </span>
          </div>

          <button
            onClick={toggleDeckExpanded}
            title="보관함 닫기"
            style={{
              background: 'transparent',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer',
              padding: '4px',
              display: 'flex',
            }}
          >
            <ChevronDown size={16} />
          </button>
        </div>

        {/* 서류 카드 리스트 스크롤 영역 */}
        <div
          style={{
            padding: '10px',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            maxHeight: '380px',
          }}
        >
          {taskList.map((task) => {
            const isDone = task.stage === 'done';
            const isError = task.stage === 'error';
            const isQueued = task.stage === 'queued';
            const isRunning = !isDone && !isError;

            return (
              <div
                key={task.id}
                onClick={() => openModalForTask(task.id)}
                style={{
                  background: isDone
                    ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(15, 23, 42, 0.6) 100%)'
                    : isQueued
                    ? 'linear-gradient(135deg, rgba(59, 130, 246, 0.08) 0%, rgba(15, 23, 42, 0.6) 100%)'
                    : isRunning
                    ? 'linear-gradient(135deg, rgba(59, 130, 246, 0.12) 0%, rgba(15, 23, 42, 0.6) 100%)'
                    : 'rgba(239, 68, 68, 0.08)',
                  border: isDone
                    ? '1px solid rgba(16, 185, 129, 0.35)'
                    : isQueued
                    ? '1px solid rgba(59, 130, 246, 0.35)'
                    : isRunning
                    ? '1px solid rgba(59, 130, 246, 0.45)'
                    : '1px solid rgba(239, 68, 68, 0.35)',
                  borderRadius: '8px',
                  padding: '10px 12px',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                  transition: 'all 0.15s ease',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.25)',
                  position: 'relative',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.borderColor = isDone ? '#10b981' : isRunning ? '#3b82f6' : '#ef4444';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'none';
                  e.currentTarget.style.borderColor = isDone ? 'rgba(16, 185, 129, 0.35)' : isRunning ? 'rgba(59, 130, 246, 0.45)' : 'rgba(239, 68, 68, 0.35)';
                }}
              >
                {/* 상단: 문서 타입 & 파일명 & 액션 버튼 */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                    {getDocIcon(task.docType)}
                    <span style={{
                      fontSize: '12px',
                      fontWeight: 700,
                      color: '#f8fafc',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      maxWidth: '240px',
                    }}>
                      {task.fileName}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openModalForTask(task.id);
                      }}
                      title="리포트 열기"
                      style={{
                        background: isDone ? 'rgba(16, 185, 129, 0.2)' : 'rgba(59, 130, 246, 0.2)',
                        border: 'none',
                        borderRadius: '4px',
                        padding: '3px 6px',
                        color: isDone ? '#34d399' : '#93c5fd',
                        fontSize: '10.5px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '2px',
                      }}
                    >
                      <Maximize2 size={11} /> 열기
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeTask(task.id);
                      }}
                      title="보관함에서 삭제"
                      style={{
                        background: 'transparent',
                        border: 'none',
                        borderRadius: '4px',
                        padding: '3px',
                        color: '#64748b',
                        cursor: 'pointer',
                        display: 'flex',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = '#ef4444')}
                      onMouseLeave={(e) => (e.currentTarget.style.color = '#64748b')}
                    >
                      <X size={13} />
                    </button>
                  </div>
                </div>

                {/* 중단: 상태 메시지 & 페이지 수 */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '11px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: isDone ? '#34d399' : isQueued ? '#60a5fa' : isRunning ? '#cbd5e1' : '#f87171' }}>
                    {isDone ? (
                      <>
                        <Check size={12} color="#34d399" />
                        <span style={{ fontWeight: 600 }}>3단계 맵리듀스 요약 완료</span>
                      </>
                    ) : isQueued ? (
                      <>
                        <Loader2 size={11} className="animate-spin" color="#60a5fa" />
                        <span style={{ fontWeight: 600, color: '#93c5fd' }}>
                          대기 중 (순번 #{task.queuePosition || 1}번)
                        </span>
                      </>
                    ) : isRunning ? (
                      <>
                        <Loader2 size={11} className="animate-spin" color="#60a5fa" />
                        <span style={{ fontWeight: 500, maxWidth: '210px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {task.statusMessage}
                        </span>
                      </>
                    ) : (
                      <>
                        <AlertCircle size={12} color="#f87171" />
                        <span>요약 중단됨</span>
                      </>
                    )}
                  </div>

                  <span style={{ fontSize: '10.5px', color: '#94a3b8', fontWeight: 600 }}>
                    총 {task.numPages}p
                  </span>
                </div>

                {/* 하단 프로그레스 바 (요약 진행 중일 때만 표시, 대기 중일 때는 은은한 대기 바) */}
                {isRunning && (
                  <div style={{ width: '100%', height: '3px', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '2px', overflow: 'hidden', marginTop: '2px' }}>
                    <div
                      style={{
                        width: isQueued ? '100%' : `${task.progressPercent}%`,
                        height: '100%',
                        background: isQueued 
                          ? 'rgba(59, 130, 246, 0.3)' 
                          : 'linear-gradient(90deg, #3b82f6, #06b6d4, #10b981)',
                        transition: 'width 0.3s ease',
                      }}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
