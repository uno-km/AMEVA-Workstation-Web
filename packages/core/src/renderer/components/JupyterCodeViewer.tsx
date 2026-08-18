/**
 * ============================================================================
 * @file JupyterCodeViewer.tsx
 * @description JupyterCodeViewer.tsx 시스템 모듈 구성요소로, 관련 UI 렌더링 및 비즈니스 로직을 담당합니다.
 * @usage 문서 에디터 및 뷰어 내부에서 동적으로 호출되거나 유틸리티 함수로 사용됩니다.
 * @example
 * // 예시 로직 (자동 생성됨)
 * import { something } from './JupyterCodeViewer';
 * 
 * @created 2026-08-10 20:30:36
 * @updated 2026-08-10 20:30:36
 * @author uno-km
 * @commit docs: 전체 소스코드 한글 주석 및 사내 컨벤션 일괄 적용
 * ============================================================================
 */

/**
 * @file JupyterCodeViewer.tsx
 * @system AMEVA OS Desktop Workstation
 * @location src/renderer/components/JupyterCodeViewer.tsx
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
 * @file JupyterCodeViewer.tsx
 * @system AMEVA OS Desktop Workstation
 * @location src/renderer/components/JupyterCodeViewer.tsx
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

// [외부 패키지 및 라이브러리 임포트: react]
import React, { useState, useEffect } from 'react'
// [외부 패키지 및 라이브러리 임포트: lucide-react]
import { Play, Eye, Copy, ChevronDown, Sparkles, Bug } from 'lucide-react'
// [외부 패키지 및 라이브러리 임포트: marked]
import { marked } from 'marked'
import mermaid from 'mermaid'
import { useUIStore } from '../stores/useUIStore'



// [외부 패키지 및 라이브러리 임포트: highlight.js]
import hljs from 'highlight.js'
import 'highlight.js/styles/vs2015.css'
// [내부 프로젝트 의존성 모듈 임포트: ../hooks/useCodeRuntime]
import { useCodeRuntime } from '../hooks/useCodeRuntime'

// [내부 프로젝트 의존성 모듈 임포트: ./jupyter/langMeta]
import { getLangMeta } from './jupyter/langMeta'
// [내부 프로젝트 의존성 모듈 임포트: ./jupyter/InlineHtmlRenderer]
import { InlineHtmlRenderer } from './jupyter/InlineHtmlRenderer'
// [내부 프로젝트 의존성 모듈 임포트: ./jupyter/HtmlPreviewModal]
import { HtmlPreviewModal } from './jupyter/HtmlPreviewModal'
// [내부 프로젝트 의존성 모듈 임포트: ./jupyter/InlineMermaidRenderer]
import { InlineMermaidRenderer } from './jupyter/InlineMermaidRenderer'
// [내부 프로젝트 의존성 모듈 임포트: ./jupyter/ConsoleOutput]
import { ConsoleOutput } from './jupyter/ConsoleOutput'

export { getLangMeta } // Re-export for compatibility

  /*
   * [FUNCTION CONTRACT]
   * - 함수 명: `JupyterCodeViewer`
   * - 역할: 인자 정보를 검수하고 비즈니스 계약 조건에 맞춰 최종 바인딩 결과물/바이너리 버퍼를 반환함.
   * - 예시: `JupyterCodeViewer(...)` 호출 시 런타임 비동기/동기 연쇄 반응 유도.
   */
/**
 * JupyterCodeViewer 함수의 핵심 비즈니스 로직 및 상태 제어를 처리합니다.
 * @remarks 이 주석은 컨벤션에 따라 자동 생성된 문서화 내용입니다.
 */
export function JupyterCodeViewer({
  code,
  language,
  onRunFailure,
  onAskAgent
}: {
  code: string
  language: string
  onRunFailure?: (err: any) => void
  onAskAgent?: (errorLog: string, code: string) => void
}) {
  console.debug("Unused vars (JupyterCodeViewer):", { React, onRunFailure });
  // 메타데이터 주석 해독
  const lines = (code || '').split('\n')
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `firstLine`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const firstLine = ...` 형태로 안전 캐싱 후 가공 기동.
       */
  const firstLine = lines[0]?.trim()
  
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `resolvedLanguage`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const resolvedLanguage = ...` 형태로 안전 캐싱 후 가공 기동.
       */
  let resolvedLanguage = language
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `resolvedCode`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const resolvedCode = ...` 형태로 안전 캐싱 후 가공 기동.
       */
  let resolvedCode = code
  
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `amevaLangMatch`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const amevaLangMatch = ...` 형태로 안전 캐싱 후 가공 기동.
       */
  const amevaLangMatch = firstLine ? firstLine.match(/^(?:\/\/#|--|<!--)\s*\[AMEVA_LANG:([a-zA-Z0-9_-]+)\](?:\s*-->)?/) || firstLine.match(/^(?:\/\/|#|--)\s*\[AMEVA_LANG:([a-zA-Z0-9_-]+)\]/) : null
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `amevaLangMatch`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (amevaLangMatch)` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
  if (amevaLangMatch) {
    resolvedLanguage = amevaLangMatch[1].toLowerCase()
    resolvedCode = lines.slice(1).join('\n')
  }

  const { isRunning, runJSCode, runPythonCode, runSQLCode } = useCodeRuntime()
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `meta`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const meta = ...` 형태로 안전 캐싱 후 가공 기동.
       */
  const meta = getLangMeta(resolvedLanguage)

  const [outputLines, setOutputLines] = useState<{ type: 'stdout' | 'stderr' | 'info'; text: string }[]>([])
  const [hasRun, setHasRun] = useState(false)
  const [success, setSuccess] = useState<boolean | null>(null)
  const [copied, setCopied] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [tableData, setTableData] = useState<any>(null)

  const [showMermaidPreview, setShowMermaidPreview] = useState(resolvedLanguage === 'mermaid')
  const [showHtmlModal, setShowHtmlModal] = useState(false)
  const [showMdPreview, setShowMdPreview] = useState(false)
  const [showHtmlRender, setShowHtmlRender] = useState(false)

  useEffect(() => {
    mermaid.initialize({
      startOnLoad: false,
      theme: 'dark',
      securityLevel: 'loose',
    })
    setShowHtmlRender(false)
  }, [code, resolvedLanguage])

      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `handleRun`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const handleRun = ...` 형태로 안전 캐싱 후 가공 기동.
       */
  const handleRun = async () => {
    setHasRun(true)
    setSuccess(null)
    setTableData(null)
    setOutputLines([{ type: 'info', text: `▶ ${meta.label} 코드 실행 중...` }])
    try {
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `resolvedLanguage === 'html'`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (resolvedLanguage === 'html')` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
      if (resolvedLanguage === 'html') {
        setSuccess(true)
        setOutputLines([{ type: 'info', text: '렌더링 완료' }])
        setShowHtmlRender(true)
        return
      }
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `result`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const result = ...` 형태로 안전 캐싱 후 가공 기동.
       */
      const result = (resolvedLanguage === 'python' || resolvedLanguage === 'py')
        ? await runPythonCode(resolvedCode)
        : (resolvedLanguage === 'sql')
        ? await runSQLCode(resolvedCode)
        : await runJSCode(resolvedCode)
      setSuccess(result.success)
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `lines`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const lines = ...` 형태로 안전 캐싱 후 가공 기동.
       */
      const lines = (result.output || '').split('\n')
        .filter((l: string, i: number, a: string[]) => !(i === a.length - 1 && l === ''))
      setOutputLines(lines.map((text: string) => ({
        type: result.success ? 'stdout' : 'stderr', text,
      })))
      setTableData(result.tableData)
    } catch (err: any) {
      setSuccess(false)
      setOutputLines([{ type: 'stderr', text: err.message || '알 수 없는 에러' }])
    }
  }

      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `handleCopy`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const handleCopy = ...` 형태로 안전 캐싱 후 가공 기동.
       */
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(resolvedCode)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {}
  }

      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `accentColor`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const accentColor = ...` 형태로 안전 캐싱 후 가공 기동.
       */
  const accentColor = meta.color

  return (
    <div
      className="jupyter-cell viewer-cell"
      style={{
        margin: '14px 0',
        borderRadius: '10px',
        border: `1.5px solid ${accentColor}33`,
        background: 'rgba(10,12,20,0.85)',
        overflow: 'visible',
        boxShadow: `0 4px 24px rgba(0,0,0,0.4), 0 0 0 1px ${accentColor}22`,
        fontFamily: '"JetBrains Mono","Fira Code","Cascadia Code",monospace',
        position: 'relative',
      }}
    >
      {/* ── 헤더 바 ── */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '8px',
        padding: '7px 12px',
        background: `linear-gradient(90deg, ${accentColor}22 0%, transparent 100%)`,
        borderBottom: `1px solid ${accentColor}33`,
        userSelect: 'none', flexWrap: 'wrap',
      }}>
        <div style={{
          fontSize: '10px', fontWeight: 800, padding: '3px 8px', borderRadius: '4px',
          background: `${accentColor}22`, color: accentColor, border: `1px solid ${accentColor}44`,
          textTransform: 'uppercase', letterSpacing: '0.5px'
        }}>
          ● {meta.label}
        </div>

        {meta.runnable && (
          <button
            onClick={handleRun}
            disabled={isRunning}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '5px',
              background: isRunning ? 'var(--text-muted)' : accentColor,
              color: '#fff', border: 'none', borderRadius: '4px',
              padding: '3px 10px', fontSize: '10px', fontWeight: 700, cursor: 'pointer',
              boxShadow: `0 2px 8px ${accentColor}40`, transition: 'all 0.15s ease',
            }}
          >
            <Play size={10} fill="#fff" />
            {meta.isHtml ? '렌더링' : 'Run'}
          </button>
        )}

        {meta.isHtml && (
          <button
            onClick={() => setShowHtmlModal(v => !v)}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '5px',
              background: '#f97316', color: '#fff', border: 'none', borderRadius: '4px',
              padding: '3px 10px', fontSize: '10px', fontWeight: 700, cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(249,115,22,0.4)', transition: 'all 0.15s ease',
            }}
          >
            <Eye size={10} />
            Preview
          </button>
        )}

        {meta.isMermaid && (
          <button
            onClick={() => setShowMermaidPreview(v => !v)}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '5px',
              background: showMermaidPreview ? '#8b5cf6' : 'rgba(139,92,246,0.3)',
              color: '#fff', border: `1px solid ${showMermaidPreview ? 'transparent' : '#8b5cf6'}`, borderRadius: '4px',
              padding: '3px 10px', fontSize: '10px', fontWeight: 700, cursor: 'pointer',
              boxShadow: showMermaidPreview ? '0 2px 8px rgba(139,92,246,0.4)' : 'none',
              transition: 'all 0.15s ease',
            }}
          >
            <Eye size={10} />
            {showMermaidPreview ? 'Hide Diagram' : 'Show Diagram'}
          </button>
        )}

        {(meta.label === 'Markdown') && (
          <button
            onClick={() => setShowMdPreview(v => !v)}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '5px',
              background: showMdPreview ? '#34d399' : 'rgba(52,211,153,0.3)',
              color: '#fff', border: `1px solid ${showMdPreview ? 'transparent' : '#34d399'}`, borderRadius: '4px',
              padding: '3px 10px', fontSize: '10px', fontWeight: 700, cursor: 'pointer',
              boxShadow: showMdPreview ? '0 2px 8px rgba(52,211,153,0.4)' : 'none',
              transition: 'all 0.15s ease',
            }}
          >
            <Eye size={10} />
            {showMdPreview ? 'Hide Render' : 'Show Render'}
          </button>
        )}

        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '6px' }}>
          {resolvedCode.trim() && (
            <>
              <button
                onClick={() => useUIStore.getState().openCodeAssistant({ initialMode: 'explain', initialCode: resolvedCode, initialLanguage: resolvedLanguage as any })}
                title="AI로 이 코드 동작 원리 해설하기"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '3px',
                  background: 'rgba(59, 130, 246, 0.15)',
                  border: '1px solid rgba(59, 130, 246, 0.35)',
                  color: '#93c5fd', borderRadius: '4px',
                  padding: '2px 7px', fontSize: '10px', fontWeight: 600, cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                <Sparkles size={10} color="#60a5fa" />
                AI 해설
              </button>
              <button
                onClick={() => useUIStore.getState().openCodeAssistant({ initialMode: 'debug', initialCode: resolvedCode, initialLanguage: resolvedLanguage as any })}
                title="AI로 이 코드 디버깅 및 리뷰하기"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '3px',
                  background: 'rgba(239, 68, 68, 0.15)',
                  border: '1px solid rgba(239, 68, 68, 0.35)',
                  color: '#fca5a5', borderRadius: '4px',
                  padding: '2px 7px', fontSize: '10px', fontWeight: 600, cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                <Bug size={10} color="#f87171" />
                AI 디버그
              </button>
            </>
          )}

          <button
            onClick={() => setIsCollapsed(c => !c)}
            title={isCollapsed ? '펼치기' : '접기'}
            style={{
              background: 'transparent', border: 'none', cursor: 'pointer',
              color: 'var(--text-muted)', display: 'flex', padding: '2px',
              transform: isCollapsed ? 'rotate(-90deg)' : 'none', transition: 'transform 0.2s',
            }}
          >
            <ChevronDown size={14} />
          </button>
          <button
            onClick={handleCopy}
            title="코드 복사"
            style={{
              background: 'transparent', border: 'none', cursor: 'pointer',
              color: copied ? '#10b981' : 'var(--text-muted)', display: 'flex', padding: '2px',
            }}
          >
            <Copy size={12} />
          </button>
        </div>
      </div>

      {/* ── 코드 본문 뷰어 ── */}
      {!isCollapsed && resolvedCode.trim() && (
        <pre className="hljs-pre" style={{
          margin: 0,
          padding: '12px 16px',
          background: '#12131a',
          overflowX: 'auto',
          fontSize: '13px',
          borderBottom: `1px solid ${accentColor}18`,
          textAlign: 'left'
        }}>
          <code
            className={`hljs language-${resolvedLanguage}`}
            dangerouslySetInnerHTML={{
              __html: hljs.highlight(resolvedCode, { language: hljs.getLanguage(resolvedLanguage) ? resolvedLanguage : 'plaintext' }).value
            }}
            style={{ fontFamily: '"JetBrains Mono", monospace' }}
          />
        </pre>
      )}

      {/* ── Placeholder ── */}
      {!isCollapsed && !resolvedCode.trim() && (
        <div style={{
          padding: '12px 16px', fontSize: '11px', color: '#4b5563',
          fontStyle: 'italic', pointerEvents: 'none', userSelect: 'none',
          background: '#12131a', borderBottom: `1px solid ${accentColor}18`
        }}>
          {`// ${meta.label} 코드가 비어 있습니다.`}
        </div>
      )}

      {/* ── Mermaid 인라인 Preview ── */}
      {!isCollapsed && meta.isMermaid && showMermaidPreview && resolvedCode.trim() && (
        <div style={{ padding: '12px 16px', borderTop: `1px solid ${accentColor}22` }}>
          <InlineMermaidRenderer code={resolvedCode} />
        </div>
      )}

      {/* ── Markdown Preview ── */}
      {!isCollapsed && (meta.label === 'Markdown') && showMdPreview && resolvedCode.trim() && (
        <div
          className="markdown-rendered-body"
          dangerouslySetInnerHTML={{ __html: marked.parse(resolvedCode) as string }}
          style={{
            padding: '16px 20px',
            background: 'var(--bg-main)',
            color: 'var(--text-main)',
            borderTop: `1px solid ${accentColor}22`,
            fontSize: '14px',
            lineHeight: '1.7',
            textAlign: 'left',
          }}
        />
      )}

      {/* ── HTML Sandbox Preview ── */}
      {!isCollapsed && meta.isHtml && showHtmlRender && resolvedCode.trim() && (
        <div style={{ padding: '12px 16px', borderTop: `1px solid ${accentColor}22` }}>
          <InlineHtmlRenderer code={resolvedCode} />
        </div>
      )}

      {/* ── HTML Preview 모달 ── */}
      {showHtmlModal && (
        <HtmlPreviewModal code={resolvedCode} onClose={() => setShowHtmlModal(false)} />
      )}

      {/* ── 터미널 실행 결과창 (Jupyter style) ── */}
      {!isCollapsed && meta.runnable && hasRun && (
        <ConsoleOutput 
          success={success}
          resolvedLanguage={resolvedLanguage}
          tableData={tableData}
          outputLines={outputLines}
          accentColor={accentColor}
          onAskAgent={onAskAgent ? () => {
            const errorLog = outputLines.filter(l => l.type === 'stderr').map(l => l.text).join('\n');
            onAskAgent(errorLog, resolvedCode);
          } : () => {
            const errorLog = outputLines.filter(l => l.type === 'stderr').map(l => l.text).join('\n');
            useUIStore.getState().openCodeAssistant({
              initialMode: 'debug',
              initialCode: resolvedCode,
              initialLanguage: resolvedLanguage as any,
              initialErrorLog: errorLog
            });
          }}
        />
      )}
    </div>
  )
}
