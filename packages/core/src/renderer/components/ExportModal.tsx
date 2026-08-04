/**
 * @file ExportModal.tsx
 * @system AMEVA OS Desktop Workstation
 * @location src/renderer/components/ExportModal.tsx
 * @role Core module helper and integration logic
 * 
 * [소비처 - CONSUMERS / USAGE CONTEXT]
 * - 소비처 A (src/renderer/AppLayout.tsx): 레이아웃 그리드 내부 또는 플로팅 레이어 영역 내에서 그리기로 소비.
 * - 소비처 B (src/renderer/App.tsx): 전역 모달 매니저 및 뷰포트 상태 스위칭에 따라 동적 마운트되어 소비.
 * 
 * [책임 범위 - RESPONSIBILITY]
 * - 본 파일은 AMEVA 시스템 내에서 도메인 목적에 부합하는 연산 및 데이터 처리 흐름을 안전하게 캡슐화한다.
 * - 외부 라이브러리 및 하위 종속성을 조율하고 결과 규격을 일관되게 제공한다.
 * 
 * [절대 깨면 안 되는 계약 - CONTRACT]
 * - MUST: 모든 예외 발생 시 에러를 침묵시키지 말고 에러 로그를 명확하게 남길 것.
 * - MUST NOT: TypeScript any 형식을 우회 수단으로 함부로 선언하지 말 것.
 */

/**
 * ExportModal.tsx
 * ─────────────────────────────────────────────────────────────
 * 내보내기 진행 모달
 * - 0~100% 프로세스바
 * - 최소화 버튼 → 하단 미니 인디케이터로 전환
 * - 성공/실패 상태 표시
 * ─────────────────────────────────────────────────────────────
 */
import { useEffect, useRef } from 'react'
import { X, Minus, FileOutput, CheckCircle, XCircle, Loader } from 'lucide-react'

import type { ExportPhase, ExportProgress } from '../../shared/types'

  /*
   * [FUNCTION CONTRACT]
   * - 함수 명: `IDLE_PROGRESS`
   * - 역할: 유입 인자를 가공하고 비즈니스 계약 조건에 맞춰 최종 객체/바이너리를 생산함.
   * - 예시: `IDLE_PROGRESS(...)` 호출 시 런타임 비동기/동기 연쇄 반응 유도.
   */
export const IDLE_PROGRESS: ExportProgress = {
  phase: 'idle',
  format: '',
  percent: 0,
  message: ''
}

interface ExportModalProps {
  progress: ExportProgress
  minimized: boolean
  onMinimize: () => void
  onClose: () => void
  onOpenFile: (path: string) => void
}

const PHASE_COLORS: Record<ExportPhase, string> = {
  idle:    'var(--primary)',
  running: 'var(--primary)',
  success: 'var(--success)',
  error:   'var(--danger)',
}

const FORMAT_LABELS: Record<string, string> = {
  md: 'Markdown', html: 'HTML', pdf: 'PDF',
  docx: 'Word (DOCX)', xlsx: 'Excel (XLSX)',
  pptx: 'PowerPoint (PPTX)', hwpx: '한글 (HWPX)', xml: 'XML',
}

/** 실제 운영 시 document.querySelector('#status-bar') 등으로 portal 위치 지정 가능 */
export function ExportModal({ progress, minimized, onMinimize, onClose, onOpenFile }: ExportModalProps) {
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `barRef`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const barRef = ...` 형태로 안전 캐싱 후 가공 기동.
       */
  const barRef = useRef<HTMLDivElement>(null)

  // 프로세스바 width 애니메이션
  useEffect(() => {
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `barRef.current`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (barRef.current)` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
    if (barRef.current) {
      barRef.current.style.width = `${progress.percent}%`
    }
  }, [progress.percent])

      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `progress.phase === 'idle'`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (progress.phase === 'idle')` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
  if (progress.phase === 'idle') return null

      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `label`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const label = ...` 형태로 안전 캐싱 후 가공 기동.
       */
  const label = FORMAT_LABELS[progress.format] ?? progress.format.toUpperCase()
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `color`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const color = ...` 형태로 안전 캐싱 후 가공 기동.
       */
  const color = PHASE_COLORS[progress.phase]

  // ── 최소화 상태: 하단 미니 표시기 ────────────────────────────
  if (minimized) {
    return (
      <div
        style={{
          position: 'fixed',
          bottom: '36px',        /* StatusBar 위 */
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          background: 'var(--bg-main)',
          backdropFilter: 'blur(16px)',
          border: '1px solid var(--border-muted)',
          borderRadius: '999px',
          padding: '6px 14px 6px 10px',
          zIndex: 9000,
          boxShadow: '0 4px 24px rgba(0,0,0,0.3)',
          cursor: 'pointer',
          userSelect: 'none',
        }}
        onClick={onMinimize}   /* 클릭 시 다시 펼치기 */
        title="클릭하여 창 복원"
      >
        {/* 스피너 또는 완료 아이콘 */}
        {progress.phase === 'running' ? (
          <div style={{ position: 'relative', width: '22px', height: '22px' }}>
            <svg viewBox="0 0 36 36" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
              <circle cx="18" cy="18" r="15" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="3" />
              <circle
                cx="18" cy="18" r="15"
                fill="none"
                stroke={color}
                strokeWidth="3"
                strokeDasharray={`${94.2 * progress.percent / 100} 94.2`}
                strokeLinecap="round"
                style={{ transition: 'stroke-dasharray 0.3s ease' }}
              />
            </svg>
            <div style={{
              position: 'absolute', inset: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '7px', fontWeight: 800, color,
            }}>
              {progress.percent}
            </div>
          </div>
        ) : progress.phase === 'success' ? (
          <CheckCircle size={18} color="var(--success)" />
        ) : (
          <XCircle size={18} color="var(--danger)" />
        )}

        <span style={{ fontSize: '11px', color: 'var(--text-main)', fontWeight: 600, whiteSpace: 'nowrap' }}>
          {progress.phase === 'running'
            ? `${label} 변환 중… ${progress.percent}%`
            : progress.phase === 'success'
            ? `${label} 완료`
            : `${label} 실패`}
        </span>

        <button
          onClick={(e) => { e.stopPropagation(); onClose() }}
          style={{
            background: 'transparent', border: 'none', cursor: 'pointer',
            color: 'rgba(255,255,255,0.4)', padding: '2px',
            display: 'flex', alignItems: 'center',
          }}
        >
          <X size={12} />
        </button>
      </div>
    )
  }

  // ── 풀 모달 ──────────────────────────────────────────────────
  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'rgba(0,0,0,0.55)',
      backdropFilter: 'blur(4px)',
      zIndex: 8000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <div style={{
        width: '440px',
        background: 'var(--bg-main)',
        border: '1px solid var(--border-glow)',
        borderRadius: '16px',
        padding: '28px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3), 0 0 0 1px var(--primary-glow)',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
      }}>

        {/* 헤더 */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '36px', height: '36px', borderRadius: '10px',
              background: `linear-gradient(135deg, ${color}, ${color}88)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {progress.phase === 'running' && <Loader size={18} color="#fff" style={{ animation: 'spin 1s linear infinite' }} />}
              {progress.phase === 'success' && <CheckCircle size={18} color="#fff" />}
              {progress.phase === 'error'   && <XCircle    size={18} color="#fff" />}
            </div>
            <div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-main)' }}>
                {label} 내보내기
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                {progress.phase === 'running' ? '파일 변환 중...' :
                 progress.phase === 'success' ? '저장 완료' : '저장 실패'}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '6px' }}>
            {/* 최소화 버튼 */}
            {progress.phase === 'running' && (
              <button
                onClick={onMinimize}
                title="최소화"
                style={{
                  width: '28px', height: '28px', borderRadius: '8px',
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: '#9ca3af', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                <Minus size={13} />
              </button>
            )}

            {/* 닫기 버튼 (완료/실패 시만) */}
            {progress.phase !== 'running' && (
              <button
                onClick={onClose}
                style={{
                  width: '28px', height: '28px', borderRadius: '8px',
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: '#9ca3af', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                <X size={13} />
              </button>
            )}
          </div>
        </div>

        {/* 프로세스바 */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{progress.message}</span>
            <span style={{ fontSize: '11px', fontWeight: 700, color }}>
              {progress.percent}%
            </span>
          </div>
          <div style={{
            width: '100%', height: '6px',
            background: 'var(--bg-glass-active)',
            borderRadius: '999px',
            overflow: 'hidden',
          }}>
            <div
              ref={barRef}
              style={{
                height: '100%',
                width: `${progress.percent}%`,
                background: progress.phase === 'success'
                  ? 'linear-gradient(90deg, var(--success), #34d399)'
                  : progress.phase === 'error'
                  ? 'linear-gradient(90deg, var(--danger), #f87171)'
                  : `linear-gradient(90deg, var(--primary), var(--secondary))`,
                borderRadius: '999px',
                transition: 'width 0.3s ease, background 0.3s ease',
                boxShadow: progress.phase === 'running' ? `0 0 8px ${color}60` : 'none',
              }}
            />
          </div>
        </div>

        {/* 성공: 저장 경로 + 파일 열기 버튼 */}
        {progress.phase === 'success' && progress.savedPath && (
          <div style={{
            padding: '12px 14px',
            background: 'rgba(16,185,129,0.08)',
            border: '1px solid rgba(16,185,129,0.2)',
            borderRadius: '8px',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
              <FileOutput size={14} color="var(--success)" style={{ marginTop: '2px', flexShrink: 0 }} />
              <div style={{
                fontSize: '11px', color: 'var(--success)',
                wordBreak: 'break-all', lineHeight: '1.5',
              }}>
                {progress.savedPath}
              </div>
            </div>
            <button
              onClick={() => onOpenFile(progress.savedPath!)}
              style={{
                padding: '7px 14px',
                background: 'rgba(16,185,129,0.15)',
                border: '1px solid rgba(16,185,129,0.35)',
                borderRadius: '6px',
                color: 'var(--success)',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s',
                fontFamily: 'var(--font-sans)',
                alignSelf: 'flex-start',
              }}
            >
              파일 열기
            </button>
          </div>
        )}

        {/* 실패: 에러 메시지 */}
        {progress.phase === 'error' && progress.error && (
          <div style={{
            padding: '12px 14px',
            background: 'rgba(239,68,68,0.08)',
            border: '1px solid rgba(239,68,68,0.2)',
            borderRadius: '8px',
            fontSize: '11px',
            color: 'var(--danger)',
            lineHeight: '1.5',
          }}>
            <strong>오류:</strong> {progress.error}
          </div>
        )}

        {/* 닫기 버튼 (성공/실패 시 하단에도) */}
        {progress.phase !== 'running' && (
          <button
            onClick={onClose}
            style={{
              padding: '9px',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '8px',
              color: 'var(--text-muted)',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: 'var(--font-sans)',
              transition: 'all 0.15s',
            }}
          >
            닫기
          </button>
        )}

      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}

