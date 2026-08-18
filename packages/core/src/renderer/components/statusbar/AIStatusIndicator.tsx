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
import { useWebLLM, SUPPORTED_WEBGPU_MODELS } from '../useWebLLM'

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
    const saved = localStorage.getItem('ameva_selected_llm_model')
    if (!saved || saved.includes('q4f16') || saved.includes('3B')) {
      return 'Qwen2.5-1.5B-Instruct-q4f32_1-MLC'
    }
    return saved
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

  // 0% (Red) -> 50% (Yellow) -> 100% (Green) 동적 색상 계산
  const getDynamicColor = (pct: number) => {
    const hue = Math.min(145, Math.max(0, Math.round(pct * 1.45)));
    return `hsl(${hue}, 88%, 52%)`;
  };

  const dynamicColor = isReady ? '#10b981' : (!isLoading ? '#ef4444' : getDynamicColor(pMain));
  const dynamicGlow = isReady 
    ? '0 0 12px #10b981, 0 0 24px rgba(16, 185, 129, 0.6)' 
    : (isLoading ? `0 0 10px ${dynamicColor}, 0 0 20px ${dynamicColor}66` : 'none');

  // 로딩 완료 토스트 말풍선 상태 (2초 후 자동 소멸, 비간섭 pointer-events: none)
  const [showToastBubble, setShowToastBubble] = useState(false)
  const prevReadyRef = useRef(isMainReady)
  const toastTimerRef = useRef<any>(null)

  useEffect(() => {
    if (!prevReadyRef.current && isMainReady) {
      setShowToastBubble(true)
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current)
      toastTimerRef.current = setTimeout(() => {
        setShowToastBubble(false)
      }, 2000)
    }
    prevReadyRef.current = isMainReady
  }, [isMainReady])

  return (
    <div style={{ position: 'relative' }} ref={dashboardRef}>
      <style>{`
        @keyframes amevaReadyPulse {
          0% { box-shadow: 0 0 8px #10b981, 0 0 16px rgba(16, 185, 129, 0.4); transform: scale(1); }
          50% { box-shadow: 0 0 14px #10b981, 0 0 28px rgba(16, 185, 129, 0.7); transform: scale(1.08); }
          100% { box-shadow: 0 0 8px #10b981, 0 0 16px rgba(16, 185, 129, 0.4); transform: scale(1); }
        }
        @keyframes amevaToastFade {
          0% { opacity: 0; transform: translate(-50%, 6px); }
          100% { opacity: 1; transform: translate(-50%, 0); }
        }
      `}</style>

      {/* 2초 자동 소멸 미니 말풍선 */}
      {showToastBubble && (
        <div
          style={{
            position: 'absolute',
            bottom: 'calc(100% + 8px)',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(15, 23, 42, 0.94)',
            border: '1px solid rgba(16, 185, 129, 0.6)',
            boxShadow: '0 4px 16px rgba(16, 185, 129, 0.35), 0 2px 6px rgba(0,0,0,0.5)',
            backdropFilter: 'blur(8px)',
            color: '#34d399',
            fontSize: '11px',
            fontWeight: 700,
            padding: '3px 8px',
            borderRadius: '6px',
            whiteSpace: 'nowrap',
            pointerEvents: 'none',
            userSelect: 'none',
            zIndex: 99999,
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            animation: 'amevaToastFade 0.2s ease-out'
          }}
        >
          <Sparkles size={11} color="#34d399" />
          <span>AI 로딩 완료!</span>
          <div
            style={{
              position: 'absolute',
              top: '100%',
              left: '50%',
              transform: 'translateX(-50%)',
              width: 0,
              height: 0,
              borderLeft: '4px solid transparent',
              borderRight: '4px solid transparent',
              borderTop: '4px solid rgba(16, 185, 129, 0.6)'
            }}
          />
        </div>
      )}

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
          background: dynamicColor,
          boxShadow: dynamicGlow,
          animation: isReady ? 'amevaReadyPulse 2.4s infinite ease-in-out' : 'none',
          transition: 'background 0.3s ease, box-shadow 0.3s ease'
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
          border: `1px solid ${isReady ? 'rgba(16, 185, 129, 0.3)' : (isLoading ? `${dynamicColor}55` : 'rgba(255,255,255,0.1)')}`,
          borderRadius: '12px',
          padding: '16px',
          boxShadow: isReady ? '0 -8px 32px rgba(0,0,0,0.6), 0 0 24px rgba(16, 185, 129, 0.15)' : '0 -8px 32px rgba(0,0,0,0.6)',
          zIndex: 10000,
          color: 'var(--text-main)',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px',
          cursor: 'default',
          transition: 'border 0.3s ease, box-shadow 0.3s ease'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ padding: '4px', borderRadius: '6px', background: isReady ? 'rgba(16,185,129,0.15)' : `${dynamicColor}22` }}>
                <Bot size={16} color={dynamicColor} />
              </div>
              <strong style={{ fontSize: '13px', letterSpacing: '-0.3px' }}>AMEVA AI 대시보드</strong>
            </div>
            <span style={{ fontSize: '11px', fontWeight: 600, color: dynamicColor, transition: 'color 0.3s ease' }}>
              {isReady ? '온라인 (가동 중)' : (isLoading ? `로딩 중 (${pMain}%)...` : '오프라인')}
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
                  {SUPPORTED_WEBGPU_MODELS.map(m => (
                    <option key={m.id} value={m.id} style={{ color: '#000' }}>
                      {m.label.split(' ')[0]} {m.label.split(' ')[1] || ''} ({m.vram})
                    </option>
                  ))}
                </select>
              ) : (
                <span style={{ fontWeight: 600, color: '#e2e8f0' }}>
                  {(() => {
                    const found = SUPPORTED_WEBGPU_MODELS.find(m => m.id === activeModelId);
                    if (found) return `${found.label.split(' ')[0]} ${found.label.split(' ')[1] || ''}`;
                    if (activeModelId?.includes('0.5B')) return 'Qwen 2.5 0.5B';
                    if (activeModelId?.includes('1.5B')) return 'Qwen 2.5 1.5B';
                    if (activeModelId?.includes('Llama')) return 'Llama 3.2 1B';
                    return activeModelId || 'Qwen 2.5 0.5B';
                  })()}
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
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: dynamicColor, fontWeight: 600, transition: 'color 0.3s ease' }}>
                <span>⚡ GPU VRAM 모델 로딩 중...</span>
                <span>{pMain}%</span>
              </div>
              
              <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.08)', borderRadius: '3px', overflow: 'hidden', position: 'relative' }}>
                <div style={{
                  width: `${pMain}%`,
                  height: '100%',
                  background: 'linear-gradient(90deg, #ef4444 0%, #f59e0b 50%, #10b981 100%)',
                  backgroundSize: '280px 100%',
                  borderRadius: '3px',
                  boxShadow: `0 0 10px ${dynamicColor}99`,
                  transition: 'width 0.25s ease-out, box-shadow 0.3s ease'
                }} />
              </div>
              <div style={{ fontSize: '9.5px', color: '#94a3b8', textAlign: 'left', wordBreak: 'break-all', marginTop: '2px' }}>
                {mainProgressText || '가중치 다운로드 및 GPU 파이프라인 초기화 중...'}
              </div>

              {isGhostLoading && (
                <div style={{ marginTop: '6px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', color: '#8b5cf6', opacity: 0.9 }}>
                    <span>Ghost 보조 모델</span>
                    <span>{pGhost}%</span>
                  </div>
                  <div style={{ width: '100%', height: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: '2px', overflow: 'hidden' }}>
                    <div style={{ width: `${pGhost}%`, height: '100%', background: 'linear-gradient(90deg, #7c3aed, #8b5cf6)', transition: 'width 0.2s ease-out' }} />
                  </div>
                  <div style={{ fontSize: '9px', color: '#8b5cf6', textAlign: 'left', wordBreak: 'break-all', marginTop: '2px' }}>
                    {ghostProgressText}
                  </div>
                </div>
              )}
            </div>
          )}

          <div style={{ marginTop: '2px' }}>
            {!isReady && !isLoading ? (
              <button 
                onClick={(e) => { 
                  e.stopPropagation(); 
                  initModel(selectedModel).catch(err => console.warn('[AIStatusIndicator] initModel error:', err)); 
                }}
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
                style={{
                  width: '100%',
                  padding: '10px',
                  background: `${dynamicColor}18`,
                  color: dynamicColor,
                  border: `1px solid ${dynamicColor}44`,
                  borderRadius: '8px',
                  cursor: 'wait',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  fontWeight: 600,
                  transition: 'all 0.3s ease'
                }}
              >
                <Clock size={16} /> 모델 로딩 대기 중 ({pMain}%)...
              </button>
            ) : (
              <button 
                disabled
                style={{ width: '100%', padding: '10px', background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.4)', color: '#34d399', borderRadius: '8px', cursor: 'default', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontWeight: 700, boxShadow: '0 0 16px rgba(16, 185, 129, 0.2)' }}
              >
                <Cpu size={16} /> AI 가동 중 (온라인)
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
