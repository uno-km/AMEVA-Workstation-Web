/**
 * @file JupyterCodeEditorHeader.tsx
 * @system AMEVA OS Desktop Workstation
 * @location src/renderer/components/jupyter/JupyterCodeEditorHeader.tsx
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

import { useState } from 'react'
import { Play, Copy, ChevronDown } from 'lucide-react'
import { type AmevaEditor } from '../../editor/amevaBlockSchema'
import { useCodeRuntime } from '../../hooks/useCodeRuntime'
import { getLangMeta } from './langMeta'

  /*
   * [FUNCTION CONTRACT]
   * - 함수 명: `JupyterCodeEditorHeader`
   * - 역할: 인자 정보를 검수하고 비즈니스 계약 조건에 맞춰 최종 바인딩 결과물/바이너리 버퍼를 반환함.
   * - 예시: `JupyterCodeEditorHeader(...)` 호출 시 런타임 비동기/동기 연쇄 반응 유도.
   */
export function JupyterCodeEditorHeader({
  code,
  language,
  blockId,
  editor,
  onRunStart,
  onRunSuccess,
  onRunFailure,
  isInputCollapsed = false,
  onToggleInputCollapse,
}: {
  code: string
  language: string
  blockId: string
  editor: AmevaEditor
  onRunStart: () => void
  onRunSuccess: (success: boolean, lines: string[], tableData?: any) => void
  onRunFailure: (errMessage: string) => void
  isInputCollapsed?: boolean
  onToggleInputCollapse?: () => void
}) {
  const { isRunning, runJSCode, runPythonCode, runSQLCode } = useCodeRuntime()
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `meta`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const meta = ...` 형태로 안전 캐싱 후 가공 기동.
       */
  const meta = getLangMeta(language)
  const [copied, setCopied] = useState(false)

      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `handleRun`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const handleRun = ...` 형태로 안전 캐싱 후 가공 기동.
       */
  const handleRun = async () => {
    onRunStart()
    try {
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `language === 'html'`
       * - 만족 시: 비즈니스 요구사항을 만족하여 대응 내부 분기 블록을 구동함.
       * - 불만족 시: 바이패스(Bypass)하여 하위 연산으로 폴백하거나 조건 스택을 탈출함.
       * - 예시: `if (language === 'html')` 만족 시 런타임 내포 연산 및 데이터 매핑 즉시 활성화.
       */
      if (language === 'html') {
        onRunSuccess(true, ['렌더링 완료'])
        return
      }
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `result`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const result = ...` 형태로 안전 캐싱 후 가공 기동.
       */
      const result = (language === 'python' || language === 'py')
        ? await runPythonCode(code)
        : (language === 'sql')
        ? await runSQLCode(code)
        : await runJSCode(code)
      onRunSuccess(result.success, (result.output || '').split('\n'), result.tableData)
    } catch (err: any) {
      onRunFailure(err.message || '알 수 없는 에러')
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
      await navigator.clipboard.writeText(code)
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
      className="jupyter-cell-header editor-cell-header"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '0 12px',
        height: '100%',
        background: '#161821',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        borderTopLeftRadius: '8px',
        borderTopRightRadius: '8px',
        userSelect: 'none',
        boxSizing: 'border-box',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      }}
    >
      {/* 븡어빵틀 접기/펴기 (Chevron 토글) */}
      {onToggleInputCollapse && (
        <button
          onClick={onToggleInputCollapse}
          title={isInputCollapsed ? '코드 영역 펼치기' : '코드 영역 접기'}
          style={{
            background: 'transparent',
            border: 'none',
            color: '#9ca3af',
            cursor: 'pointer',
            padding: '2px',
            marginRight: '2px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            outline: 'none',
          }}
        >
          <ChevronDown
            size={14}
            style={{
              transform: isInputCollapsed ? 'rotate(-90deg)' : 'none',
              transition: 'transform 0.2s ease',
            }}
          />
        </button>
      )}

      <div style={{
        fontSize: '11px',
        fontWeight: 700,
        color: accentColor,
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        fontFamily: '"JetBrains Mono","Fira Code","Cascadia Code",monospace',
      }}>
        <span style={{
          width: '6px',
          height: '6px',
          borderRadius: '50%',
          backgroundColor: accentColor,
          display: 'inline-block'
        }} />
        <select
          value={language}
          onChange={(e) => {
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - 변수 명: `val`
       * - 자료형 / 예상 값: 우변 식 계산 결과에 따라 런타임 할당되는 적격 데이터 타입 (예: string, number, boolean, Object 등).
       * - 시나리오: 본 함수 영역 내에서 상태 생명주기를 유지하며 데이터 보존 및 후속 분기 연산에 소비됨.
       * - 예시 코드: `const val = ...` 형태로 안전 캐싱 후 가공 기동.
       */
            const val = e.target.value
            editor.updateBlock(blockId, {
              type: 'jupyter' as any,
              props: {
                ...editor.getBlock(blockId)?.props,
                language: val,
                runState: JSON.stringify({ hasRun: false, success: null, outputLines: [] })
              }
            } as any)
          }}
          style={{
            background: 'transparent',
            color: accentColor,
            border: 'none',
            outline: 'none',
            fontSize: '11px',
            fontWeight: 700,
            cursor: 'pointer',
            textTransform: 'uppercase',
            letterSpacing: '0.8px',
            fontFamily: '"JetBrains Mono","Fira Code",monospace',
            padding: '2px 4px',
            borderRadius: '4px',
            transition: 'background 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent'
          }}
        >
          <option value="javascript" style={{ background: '#12131a', color: '#f59e0b' }}>Javascript</option>
          <option value="python" style={{ background: '#12131a', color: '#3b82f6' }}>Python</option>
          <option value="sql" style={{ background: '#12131a', color: '#06b6d4' }}>SQL (SQLite)</option>
          <option value="html" style={{ background: '#12131a', color: '#14b8a6' }}>HTML Sandbox</option>
          <option value="mermaid" style={{ background: '#12131a', color: '#8b5cf6' }}>Mermaid</option>
          <option value="plaintext" style={{ background: '#12131a', color: '#6b7280' }}>Plaintext</option>
          <option value="text" style={{ background: '#12131a', color: '#6b7280' }}>Text</option>
          <option value="json" style={{ background: '#12131a', color: '#10b981' }}>JSON</option>
          <option value="bash" style={{ background: '#12131a', color: '#ec4899' }}>Bash</option>
        </select>
      </div>

      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '8px' }}>
        {meta.runnable && (
          <button
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              handleRun()
            }}
            disabled={isRunning}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              background: isRunning ? 'rgba(255, 255, 255, 0.1)' : accentColor,
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              padding: '4px 10px',
              fontSize: '11px',
              fontWeight: 700,
              cursor: isRunning ? 'not-allowed' : 'pointer',
              boxShadow: isRunning ? 'none' : `0 2px 8px ${accentColor}40`,
              transition: 'all 0.15s ease',
            }}
          >
            <Play size={10} fill="#fff" />
            Run
          </button>
        )}

        <button
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            handleCopy()
          }}
          title="코드 복사"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px',
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '4px',
            padding: '4px 10px',
            fontSize: '11px',
            fontWeight: 700,
            cursor: 'pointer',
            color: copied ? '#10b981' : '#e5e7eb',
            transition: 'all 0.15s ease',
          }}
        >
          <Copy size={11} />
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
    </div>
  )
}

