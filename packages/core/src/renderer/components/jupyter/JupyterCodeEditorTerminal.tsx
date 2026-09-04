/**
 * ============================================================================
 * @file JupyterCodeEditorTerminal.tsx
 * @description JupyterCodeEditorTerminal.tsx 시스템 모듈 구성요소로, 관련 UI 렌더링 및 비즈니스 로직을 담당합니다.
 * @usage 문서 에디터 및 뷰어 내부에서 동적으로 호출되거나 유틸리티 함수로 사용됩니다.
 * @example
 * // 예시 로직 (자동 생성됨)
 * import { something } from './JupyterCodeEditorTerminal';
 * 
 * @created 2026-08-10 20:30:36
 * @updated 2026-08-10 20:30:36
 * @author uno-km
 * @commit docs: 전체 소스코드 한글 주석 및 사내 컨벤션 일괄 적용
 * ============================================================================
 */

/**
 * @file JupyterCodeEditorTerminal.tsx
 * @system AMEVA OS Desktop Workstation
 * @location src/renderer/components/jupyter/JupyterCodeEditorTerminal.tsx
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

import { useState, useEffect } from 'react'
import { Terminal, Eye, EyeOff, ChevronDown, Sparkles } from 'lucide-react'
import mermaid from 'mermaid'
import { getLangMeta } from './langMeta'
import { type RunState } from './RunState'
import { useCurrentTheme } from '../../hooks/useCurrentTheme'

/**
 * JupyterCodeEditorTerminal 함수의 핵심 비즈니스 로직 및 상태 제어를 처리합니다.
 */
export function JupyterCodeEditorTerminal({
  language,
  runState,
  code,
  blockId,
  onAIFix,
  isFixing = false,
}: {
  language: string
  runState?: RunState
  code: string
  blockId: string
  onAIFix?: (errorLog: string) => void
  isFixing?: boolean
}) {
  if (!runState) return null

  const meta = getLangMeta(language)
  const accentColor = meta.color
  const { isWhite, isRetro } = useCurrentTheme()

  // 1. Mermaid 실시간 라이브 프리뷰 상태 및 터미널 접기 상태
  const [showMermaidPreview, setShowMermaidPreview] = useState(false)
  const [mermaidSvg, setMermaidSvg] = useState<string>('')
  const [mermaidError, setMermaidError] = useState<string | null>(null)
  const [isCollapsed, setIsCollapsed] = useState(false)

  useEffect(() => {
    mermaid.initialize({
      startOnLoad: false,
      theme: isWhite || isRetro ? 'neutral' : 'dark',
      themeVariables: isWhite ? {
        primaryColor: '#f1f5f9',
        primaryTextColor: '#0f172a',
        primaryBorderColor: '#2563eb',
        lineColor: '#475569',
        background: '#ffffff',
        mainBkg: '#f8fafc',
      } : isRetro ? {
        primaryColor: '#c0c0c0',
        primaryTextColor: '#000000',
        primaryBorderColor: '#000080',
        lineColor: '#000000',
        background: '#ffffff',
        mainBkg: '#ffffff',
      } : {
        primaryColor: '#1e293b',
        primaryTextColor: '#f8fafc',
        primaryBorderColor: '#38bdf8',
        lineColor: '#94a3b8',
        background: '#0a0d14',
      },
      securityLevel: 'loose',
      fontFamily: 'Pretendard, -apple-system, sans-serif'
    })
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `language !== 'mermaid' || !showMermaidPreview || !code.trim()`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (language !== 'mermaid' || !showMermaidPreview || !code.trim())` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
    if (language !== 'mermaid' || !showMermaidPreview || !code.trim()) {
      setMermaidSvg('')
      setMermaidError(null)
      return
    }

      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `renderId`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const renderId = ...` 형태로 안전 캐싱 후 가공 기동.
       */
    const renderId = `mermaid-editor-svg-${blockId}`
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `drawDiagram`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const drawDiagram = ...` 형태로 안전 캐싱 후 가공 기동.
       */
    const drawDiagram = async () => {
      try {
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `temp`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const temp = ...` 형태로 안전 캐싱 후 가공 기동.
       */
        const temp = document.getElementById(renderId)
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `temp) temp.remove(`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (temp) temp.remove()` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
        if (temp) temp.remove()
        
        document.querySelectorAll('[id^="dmermaid"]').forEach(el => el.remove())

        try {
          await mermaid.parse(code, { suppressErrors: true })
        } catch (parseErr: any) {
          setMermaidError(parseErr.message || 'Mermaid 문법 오류가 감지되었습니다.')
          return
        }

        const { svg } = await mermaid.render(renderId, code)
        setMermaidSvg(svg)
        setMermaidError(null)
      } catch (err: any) {
        setMermaidError(err.message || '다이어그램 렌더링 오류')
      }
    }

      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `timer`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const timer = ...` 형태로 안전 캐싱 후 가공 기동.
       */
    const timer = setTimeout(drawDiagram, 150)
    return () => clearTimeout(timer)
  }, [code, language, showMermaidPreview, blockId])

  return (
    <div style={{ width: '100%' }}>
      {/* Mermaid 전용 라이브 토글 액션 툴바 */}
      {language === 'mermaid' && (
        <div style={{
          padding: '6px 14px',
          background: 'rgba(255, 255, 255, 0.02)',
          borderTop: '1px solid rgba(255, 255, 255, 0.05)',
          display: 'flex',
          justifyContent: 'flex-start',
        }}>
          <button
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              setShowMermaidPreview(!showMermaidPreview)
            }}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '6px',
              background: showMermaidPreview ? '#10b981' : 'rgba(255,255,255,0.06)',
              color: showMermaidPreview ? '#fff' : '#e5e7eb',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '4px',
              padding: '3px 12px', fontSize: '10px', fontWeight: 800, cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            {showMermaidPreview ? <EyeOff size={11} /> : <Eye size={11} />}
            {showMermaidPreview ? 'Hide Diagram' : 'Show Diagram'}
          </button>
        </div>
      )}

      {/* JS/Python 실행 터미널 창 */}
      {meta.runnable && runState && runState.hasRun && language !== 'sql' && (
        <div
          className="jupyter-cell-terminal editor-cell-terminal"
          style={{
            background: 'var(--term-bg)',
            borderTop: '1px solid var(--term-border)',
            fontFamily: 'Consolas, Monaco, monospace',
            fontSize: '12px',
            textAlign: 'left',
            boxSizing: 'border-box',
            borderBottomLeftRadius: '8px',
            borderBottomRightRadius: '8px',
            overflow: 'hidden',
          }}
        >
          <div 
            onClick={() => setIsCollapsed(!isCollapsed)}
            style={{
              display: 'flex', alignItems: 'center',
              padding: '8px 14px', background: 'var(--bg-glass-active)', borderBottom: '1px solid var(--term-border)',
              userSelect: 'none', justifyContent: 'space-between', cursor: 'pointer'
            }}
          >
            <span style={{ color: '#9ca3af', fontSize: '11px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <ChevronDown
                size={12}
                style={{
                  transform: isCollapsed ? 'rotate(-90deg)' : 'none',
                  transition: 'transform 0.2s ease',
                }}
              />
              <Terminal size={12} />
              Output
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {runState.success === false && onAIFix && (
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const errorLog = runState.outputLines.filter(l => l.type === 'stderr').map(l => l.text).join('\n') || runState.outputLines.map(l => l.text).join('\n');
                    onAIFix(errorLog);
                  }}
                  disabled={isFixing}
                  title="AI로 이 에러의 원인을 진단하고 코드를 자동으로 수정합니다."
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    background: isFixing ? 'rgba(239, 68, 68, 0.3)' : 'linear-gradient(135deg, rgba(239, 68, 68, 0.25) 0%, rgba(220, 38, 38, 0.35) 100%)',
                    border: '1px solid rgba(248, 113, 113, 0.6)',
                    color: '#fecaca',
                    borderRadius: '4px',
                    padding: '2px 8px',
                    fontSize: '10px',
                    fontWeight: 700,
                    cursor: isFixing ? 'wait' : 'pointer',
                    boxShadow: '0 0 10px rgba(239, 68, 68, 0.35)',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <Sparkles size={10} color="#f87171" className={isFixing ? 'animate-spin' : ''} />
                  {isFixing ? 'AI 코드 수정 중...' : '🛠️ AI 에러 즉시 해결'}
                </button>
              )}
              {runState.success !== null && (
                <span style={{
                  color: runState.success ? '#10b981' : '#f43f5e',
                  background: runState.success ? 'rgba(16,185,129,0.1)' : 'rgba(244,63,94,0.1)',
                  border: `1px solid ${runState.success ? '#10b98133' : '#f43f5e33'}`,
                  padding: '2px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: 'bold'
                }}>
                  {runState.success ? 'Success' : 'Error'}
                </span>
              )}
            </div>
          </div>
          <div style={{
            padding: isCollapsed ? '0px 16px' : '12px 16px',
            maxHeight: isCollapsed ? '0px' : '180px',
            overflowY: 'auto',
            transition: 'max-height 0.25s ease-out, padding 0.25s ease-out',
            whiteSpace: 'pre-wrap', wordBreak: 'break-all', color: 'var(--term-text)',
            lineHeight: '1.5'
          }}>
            {runState.outputLines.map((line, idx) => (
              <div
                key={idx}
                style={{
                  color: line.type === 'stderr' ? 'var(--danger)' : line.type === 'info' ? `${accentColor}cc` : 'var(--term-text)',
                  marginBottom: '2px',
                }}
              >
                {line.text}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SQL 가상 DB 실행 테이블 뷰어 */}
      {language === 'sql' && runState && runState.hasRun && (
        <div
          className="jupyter-cell-terminal editor-cell-terminal"
          onMouseMove={(e) => e.stopPropagation()}
          onMouseEnter={(e) => e.stopPropagation()}
          onMouseLeave={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
          onMouseUp={(e) => e.stopPropagation()}
          style={{
            background: 'var(--term-bg)',
            borderTop: '1px solid var(--term-border)',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            fontSize: '12px',
            textAlign: 'left',
            boxSizing: 'border-box',
            borderBottomLeftRadius: '8px',
            borderBottomRightRadius: '8px',
            overflow: 'hidden',
          }}
        >
          <div 
            onClick={() => setIsCollapsed(!isCollapsed)}
            style={{
              display: 'flex', alignItems: 'center',
              padding: '8px 14px', background: 'var(--bg-glass-active)', borderBottom: '1px solid var(--term-border)',
              userSelect: 'none', justifyContent: 'space-between', cursor: 'pointer'
            }}
          >
            <span style={{ color: '#9ca3af', fontSize: '11px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <ChevronDown
                size={12}
                style={{
                  transform: isCollapsed ? 'rotate(-90deg)' : 'none',
                  transition: 'transform 0.2s ease',
                }}
              />
              <Terminal size={12} />
              SQL Database Output
            </span>
            {runState.success !== null && (
              <span style={{
                color: runState.success ? '#10b981' : '#f43f5e',
                background: runState.success ? 'rgba(16,185,129,0.1)' : 'rgba(244,63,94,0.1)',
                border: `1px solid ${runState.success ? '#10b98133' : '#f43f5e33'}`,
                padding: '2px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: 'bold'
              }}>
                {runState.success ? 'Success' : 'Error'}
              </span>
            )}
          </div>
          <div style={{
            padding: isCollapsed ? '0px 16px' : '12px 16px',
            maxHeight: isCollapsed ? '0px' : '220px',
            overflowY: 'auto',
            transition: 'max-height 0.25s ease-out, padding 0.25s ease-out',
          }}>
            {runState.success && runState.tableData ? (
              <table style={{ width: '100%', borderCollapse: 'collapse', color: 'var(--term-text)', textAlign: 'left', fontSize: '12px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.03)' }}>
                    {runState.tableData.columns.map((col: string, i: number) => (
                      <th key={i} style={{ padding: '8px 12px', fontWeight: 'bold', color: '#38bdf8' }}>{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {runState.tableData.values.map((row: any[], ri: number) => (
                    <tr key={ri} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      {row.map((val: any, ci: number) => (
                        <td key={ci} style={{ padding: '8px 12px', fontFamily: 'monospace' }}>{val !== null ? String(val) : <span style={{color:'#6b7280', fontStyle:'italic'}}>NULL</span>}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div style={{ color: runState.success ? 'var(--term-text)' : 'var(--danger)', whiteSpace: 'pre-wrap', fontFamily: 'monospace' }}>
                {runState.outputLines.map(l => l.text).join('\n')}
              </div>
            )}
          </div>
        </div>
      )}

      {/* HTML 격리 샌드박스 렌더러 */}
      {language === 'html' && runState && runState.hasRun && (
        <div 
          onMouseMove={(e) => e.stopPropagation()}
          onMouseEnter={(e) => e.stopPropagation()}
          onMouseLeave={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
          onMouseUp={(e) => e.stopPropagation()}
          style={{
            background: 'var(--term-bg)',
            borderTop: '1px solid var(--term-border)',
            borderBottomLeftRadius: '8px',
            borderBottomRightRadius: '8px',
            padding: '12px',
            boxSizing: 'border-box'
          }}
        >
          <div style={{ color: '#9ca3af', fontSize: '11px', fontWeight: 'bold', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px', userSelect: 'none' }}>
            <Eye size={12} />
            Live HTML Renderer Sandbox
          </div>
          <iframe
            srcDoc={code && (code.includes('loadPyodide') || code.includes('pyodide.js'))
              ? (code.includes('cdn.jsdelivr.net/pyodide') ? code : `<script src="https://cdn.jsdelivr.net/pyodide/v0.26.1/full/pyodide.js"></script>\n${code.replace(/src=["'](?:(?:\.\/)?pyodide\.js|https?:\/\/[^"']*pyodide\.js)["']/g, 'src="https://cdn.jsdelivr.net/pyodide/v0.26.1/full/pyodide.js"')}`)
              : code}
            title="HTML Preview Sandbox"
            sandbox="allow-scripts allow-modals"
            style={{
              width: '100%',
              height: '350px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '6px',
              background: '#ffffff',
            }}
          />
        </div>
      )}

      {/* Mermaid 라이브 프리뷰 패널 */}
      {language === 'mermaid' && showMermaidPreview && (
        <div style={{
          background: 'var(--term-bg)',
          borderTop: '1px solid var(--term-border)',
          borderBottomLeftRadius: '8px',
          borderBottomRightRadius: '8px',
          padding: '16px',
          textAlign: 'center',
          overflowX: 'auto',
        }}>
          {mermaidError ? (
            <div style={{
              color: '#f87171',
              fontFamily: 'monospace',
              fontSize: '11px',
              textAlign: 'left',
              whiteSpace: 'pre-wrap',
            }}>
              Mermaid 에러:<br />
              {mermaidError}
            </div>
          ) : mermaidSvg ? (
            <div
              className="mermaid-svg-holder"
              dangerouslySetInnerHTML={{ __html: mermaidSvg }}
              style={{
                display: 'inline-block',
                background: '#ffffff',
                padding: '12px',
                borderRadius: '6px',
              }}
            />
          ) : (
            <div style={{ color: 'var(--text-muted)', fontStyle: 'italic', fontSize: '11px' }}>
              다이어그램 생성 중...
            </div>
          )}
        </div>
      )}
    </div>
  )
}

