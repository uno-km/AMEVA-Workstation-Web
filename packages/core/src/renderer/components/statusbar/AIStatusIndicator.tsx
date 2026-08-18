/**
 * ============================================================================
 * @file AIStatusIndicator.tsx
 * @description AIStatusIndicator.tsx 시스템 모듈 구성요소로, 관련 UI 렌더링 및 비즈니스 로직을 담당합니다.
 * @usage 문서 에디터 및 뷰어 내부에서 동적으로 호출되거나 유틸리티 함수로 사용됩니다.
 * @example
 * // 예시 로직 (자동 생성됨)
 * import { something } from './AIStatusIndicator';
 * 
 * @created 2026-08-10 20:30:36
 * @updated 2026-08-10 20:30:36
 * @author uno-km
 * @commit docs: 전체 소스코드 한글 주석 및 사내 컨벤션 일괄 적용
 * ============================================================================
 */

// [외부 패키지 및 라이브러리 임포트: react]
import React, { useState, useEffect, useRef } from 'react'
// [외부 패키지 및 라이브러리 임포트: lucide-react]
import { Bot, Play, Square, Cpu, Clock, Activity, Sparkles, Info } from 'lucide-react'
// [내부 프로젝트 의존성 모듈 임포트: ../useWebLLM]
import { useWebLLM } from '../useWebLLM'

/**
 * AIStatusIndicatorProps 모듈 내외부에서 사용되는 데이터 통신 규격 및 타입을 정의합니다.
 * @remarks 이 주석은 컨벤션에 따라 자동 생성된 문서화 내용입니다.
 */
export interface AIStatusIndicatorProps {
  activeTooltip: string | null
  handleMouseEnter: (id: string) => void
  handleMouseLeave: () => void
  tooltipStyle: React.CSSProperties
}

/**
 * AIStatusIndicator 함수의 핵심 비즈니스 로직 및 상태 제어를 처리합니다.
 * @remarks 이 주석은 컨벤션에 따라 자동 생성된 문서화 내용입니다.
 */
export function AIStatusIndicator({ 
  activeTooltip, 
  handleMouseEnter, 
  handleMouseLeave, 
  tooltipStyle 
}: AIStatusIndicatorProps) {
  const { isMainReady, isGhostReady, isMainLoading, isGhostLoading, mainProgressText, ghostProgressText, mainProgress, ghostProgress, initModel, activeModelId } = useWebLLM()
  const [showDashboard, setShowDashboard] = useState(false)
  const [selectedModel, setSelectedModel] = useState(() => {
    return localStorage.getItem('ameva_selected_llm_model') || 'Qwen2.5-3B-Instruct-q4f32_1-MLC'
  })

  useEffect(() => {
    localStorage.setItem('ameva_selected_llm_model', selectedModel)
  }, [selectedModel])

  const dashboardRef = useRef<HTMLDivElement>(null)

  // 외부 클릭 시 대시보드 닫기
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dashboardRef.current && !dashboardRef.current.contains(e.target as Node)) {
        setShowDashboard(false)
      }
    }
    if (showDashboard) {
      window.addEventListener('mousedown', handleClickOutside)
    }
    return () => window.removeEventListener('mousedown', handleClickOutside)
  }, [showDashboard])

  // 간단한 통계 더미 데이터 (실제 데이터 연동 가능시 교체)
  const sessionTime = "00:42:15"
  const avgTokens = "124 t/s"
  
  // 상태 통합
  const isLoading = isMainLoading || isGhostLoading;
  const isReady = isMainReady;
  const pMain = Math.round((mainProgress || 0) * 100);
  const pGhost = Math.round((ghostProgress || 0) * 100);

  return (
    <div style={{ position: 'relative' }} ref={dashboardRef}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          cursor: 'pointer',
          padding: '2px 6px',
          borderRadius: '4px',
          background: showDashboard ? 'rgba(255,255,255,0.1)' : 'transparent',
          transition: 'background 0.2s'
        }}
        onClick={() => setShowDashboard(!showDashboard)}
        onMouseEnter={() => handleMouseEnter('ai-status')}
        onMouseLeave={handleMouseLeave}
      >
        <div style={{
          width: '8px', height: '8px', borderRadius: '50%',
          background: isReady ? '#10b981' : (isLoading ? '#f59e0b' : '#ef4444'),
          boxShadow: isReady ? '0 0 8px #10b981' : (isLoading ? '0 0 8px #f59e0b' : 'none'),
          transition: 'background 0.3s, box-shadow 0.3s'
        }} />
        <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-main)' }}>AI</span>
      </div>

      {(showDashboard || activeTooltip === 'ai-status') && (
        <div style={{
          position: 'absolute',
          bottom: '32px',
          right: '0',
          width: '280px',
          background: 'rgba(24, 24, 27, 0.95)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '12px',
          padding: '16px',
          boxShadow: '0 -8px 32px rgba(0,0,0,0.6)',
          zIndex: 10000,
          color: 'var(--text-main)',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px',
          cursor: 'default'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ padding: '4px', borderRadius: '6px', background: isReady ? 'rgba(16,185,129,0.1)' : 'rgba(168,85,247,0.1)' }}>
                <Bot size={16} color={isReady ? '#10b981' : '#a855f7'} />
              </div>
              <strong style={{ fontSize: '13px', letterSpacing: '-0.3px' }}>AMEVA AI 대시보드</strong>
            </div>
            <span style={{ fontSize: '11px', fontWeight: 600, color: isReady ? '#10b981' : (isLoading ? '#f59e0b' : '#ef4444') }}>
              {isReady ? '온라인' : (isLoading ? '로딩 중...' : '오프라인')}
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', background: 'rgba(0,0,0,0.2)', padding: '10px', borderRadius: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px' }}>
              <span style={{ color: 'var(--text-muted)' }}>로컬 AI 엔진</span>
              {!isReady && !isLoading ? (
                <select 
                  value={selectedModel}
                  onChange={(e) => { e.stopPropagation(); setSelectedModel(e.target.value); }}
                  onClick={(e) => e.stopPropagation()}
                  style={{ 
                    background: 'rgba(255,255,255,0.1)', color: '#e2e8f0', border: '1px solid rgba(255,255,255,0.2)', 
                    borderRadius: '4px', padding: '4px 6px', fontSize: '11px', outline: 'none', cursor: 'pointer',
                    maxWidth: '140px', textOverflow: 'ellipsis', whiteSpace: 'nowrap', overflow: 'hidden'
                  }}
                >
                  <option value="Qwen2.5-3B-Instruct-q4f32_1-MLC" style={{ color: '#000' }}>Qwen2.5 3B (기본)</option>
                  <option value="Llama-3.2-3B-Instruct-q4f32_1-MLC" style={{ color: '#000' }}>Llama 3.2 3B</option>
                  <option value="Qwen2.5-3B-Instruct-q4f32_1-MLC" style={{ color: '#000' }}>Qwen2.5 7B (고성능)</option>
                </select>
              ) : (
                <span style={{ fontWeight: 600, color: '#e2e8f0' }}>
                  {activeModelId?.includes('1.5B') ? 'Qwen 2.5 1.5B' : (activeModelId?.includes('Llama') ? 'Llama 3.2 3B' : 'Qwen 2.5 3B')}
                </span>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
              <span style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }} title="AI 엔진이 활성화된 후 경과된 시간입니다. (현재는 UI 시연용 더미 데이터입니다)">
                <Clock size={12}/>세션 유지 시간
                <Info size={12} style={{ cursor: 'help', opacity: 0.7 }} />
              </span>
              <span style={{ fontWeight: 600, color: '#e2e8f0' }}>{isReady ? sessionTime : '-'}</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
              <span style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }} title="초당 토큰 생성 속도(Tokens per second)입니다. (현재는 UI 시연용 더미 데이터입니다)">
                <Activity size={12}/>평균 처리량
                <Info size={12} style={{ cursor: 'help', opacity: 0.7 }} />
              </span>
              <span style={{ fontWeight: 600, color: '#e2e8f0' }}>{isReady ? avgTokens : '-'}</span>
            </div>
          </div>
          
          {isLoading && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#f59e0b', fontWeight: 600 }}>
                <span>모델 병렬 로딩 중...</span>
              </div>
              
              {/* Main Model Progress Bar */}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', color: '#10b981', opacity: 0.9 }}>
                <span>Main (3B/7B)</span>
                <span>{pMain}%</span>
              </div>
              <div style={{ width: '100%', height: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: '2px', overflow: 'hidden' }}>
                <div style={{ width: `${pMain}%`, height: '100%', background: 'linear-gradient(90deg, #059669, #10b981)', transition: 'width 0.2s ease-out' }} />
              </div>
              <div style={{ fontSize: '9px', color: '#10b981', textAlign: 'left', wordBreak: 'break-all', opacity: 0.9, marginTop: '2px' }}>
                {mainProgressText}
              </div>

              {/* Ghost Model Progress Bar */}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', color: '#8b5cf6', opacity: 0.9, marginTop: '4px' }}>
                <span>Ghost (1.5B)</span>
                <span>{pGhost}%</span>
              </div>
              <div style={{ width: '100%', height: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: '2px', overflow: 'hidden' }}>
                <div style={{ width: `${pGhost}%`, height: '100%', background: 'linear-gradient(90deg, #7c3aed, #8b5cf6)', transition: 'width 0.2s ease-out' }} />
              </div>
              <div style={{ fontSize: '9px', color: '#8b5cf6', textAlign: 'left', wordBreak: 'break-all', opacity: 0.9, marginTop: '2px' }}>
                {ghostProgressText}
              </div>
            </div>
          )}

          <div style={{ marginTop: '2px' }}>
            {!isReady && !isLoading ? (
              <button 
                onClick={(e) => { e.stopPropagation(); initModel(selectedModel); }}
                style={{ width: '100%', padding: '10px', background: 'linear-gradient(135deg, #a855f7 0%, #8b5cf6 100%)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontWeight: 600, boxShadow: '0 4px 12px rgba(168,85,247,0.3)', transition: 'transform 0.1s' }}
                onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.98)'}
                onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
              >
                <Sparkles size={16} /> AI 활성화하기
              </button>
            ) : isLoading ? (
              <button 
                disabled
                style={{ width: '100%', padding: '10px', background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', border: '1px solid rgba(245, 158, 11, 0.3)', borderRadius: '8px', cursor: 'wait', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontWeight: 600 }}
              >
                <Clock size={16} /> 모델 로딩 대기 중...
              </button>
            ) : (
              <button 
                disabled
                style={{ width: '100%', padding: '10px', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', color: '#10b981', borderRadius: '8px', cursor: 'default', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontWeight: 600 }}
              >
                <Cpu size={16} /> AI 가동 중
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
