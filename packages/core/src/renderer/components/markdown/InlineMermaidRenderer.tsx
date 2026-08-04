/**
 * @file InlineMermaidRenderer.tsx
 * @system AMEVA OS Desktop Workstation
 * @location src/renderer/components/markdown/InlineMermaidRenderer.tsx
 * @role Core module helper and integration logic
 * 
 * [소비처 - CONSUMERS / USAGE CONTEXT]
 * - 소비처 A (src/renderer/components/MarkdownPreview.tsx): 마크다운 파싱 시 mermaid 다이어그램 세그먼트 전용 드로잉 뷰어로 소비.
 */

import { useState, useEffect, useRef } from 'react'
import mermaid from 'mermaid'

  /*
   * [FUNCTION CONTRACT]
   * - 함수 명: `InlineMermaidRenderer`
   * - 역할: Mermaid 다이어그램 코드를 컴파일하여 SVG 형식으로 안전하게 렌더링하고 DOM에 주입함.
   */
export function InlineMermaidRenderer({ code }: { code: string }) {
  /*
   * [RUN-TIME STATE / INVARIANT]
   * - 변수 명: `svg`, `setSvg`
   * - 자료형 / 예상 값: string (인코딩된 SVG 문자열)
   * - 시나리오: mermaid 렌더링 성공 시 결과 SVG 마크업 문자열을 보존.
   */
  const [svg, setSvg] = useState<string>('')
  
  /*
   * [RUN-TIME STATE / INVARIANT]
   * - 변수 명: `error`, `setError`
   * - 자료형 / 예상 값: string | null
   * - 시나리오: 다이어그램 구문 오류 시 예외 텍스트를 캐싱하여 에러 UI 출력 분기에 사용.
   */
  const [error, setError] = useState<string | null>(null)
  
  /*
   * [RUN-TIME STATE / INVARIANT]
   * - 변수 명: `elementId`
   * - 자료형 / 예상 값: React.MutableRefObject<string>
   * - 시나리오: mermaid.render 호출 시 고유 ID 인스턴스를 유지하기 위해 무작위 해시 문자열 캐싱.
   */
  const elementId = useRef(`mermaid-preview-${Math.random().toString(36).substr(2, 9)}`)

  useEffect(() => {
    /*
     * [RUN-TIME STATE / INVARIANT]
     * - 변수 명: `active`
     * - 자료형 / 예상 값: boolean
     * - 시나리오: 비동기 렌더링이 완료되기 전에 컴포넌트가 언마운트되었을 때의 메모리 누수 및 상태 업데이트 충돌 방지를 위한 마운트 가드 플래그.
     */
    let active = true
    
    /*
     * [RUN-TIME STATE / INVARIANT]
     * - 변수 명: `renderDiagram`
     * - 자료형 / 예상 값: () => Promise<void>
     * - 시나리오: mermaid 비동기 API인 render를 기동하고 SVG를 설정함.
     */
    const renderDiagram = async () => {
      try {
        /*
         * [RUN-TIME STATE / INVARIANT]
         * - 변수 명: `cleanCode`
         * - 자료형 / 예상 값: string
         * - 시나리오: 줄바꿈 등의 정규화를 거쳐 렌더러가 올바르게 파싱하도록 정제한 코드.
         */
        const cleanCode = code.replace(/^(\s*)end([가-힣a-zA-Z]+)/gm, '$1end\n$1$2')
        const { svg: renderedSvg } = await mermaid.render(elementId.current, cleanCode)
        
        /*
         * [ALGORITHM BRANCH / DECISION]
         * - 조건 식: `active`
         * - 만족 시: 컴포넌트가 여전히 마운트 상태이므로 정상적으로 SVG 상태를 세팅하고 에러를 해제함.
         * - 불만족 시: 바이패스(Bypass)하여 작업을 종료함.
         */
        if (active) {
          setSvg(renderedSvg)
          setError(null)
        }
      } catch (err: any) {
        /*
         * [ALGORITHM BRANCH / DECISION]
         * - 조건 식: `active`
         * - 만족 시: 마운트 상태를 검증해 에러 메시지 상태를 동기화 표출함.
         */
        if (active) {
          setError(err.message || 'Mermaid 렌더링에 실패했습니다.')
        }
      }
    }
    renderDiagram()
    return () => { active = false }
  }, [code])

  /*
   * [ALGORITHM BRANCH / DECISION]
   * - 조건 식: `error`
   * - 만족 시: 렌더링 문법 에러 화면을 노출.
   * - 불만족 시: 정상 SVG 그래프 레이아웃 반환.
   * - 예시: `if (error)` 만족 시 에러 패널 렌더링.
   */
  if (error) {
    return (
      <div style={{
        padding: '12px 16px', borderRadius: '8px', background: 'rgba(239,68,68,0.08)',
        border: '1.5px solid rgba(239,68,68,0.25)', color: '#f87171', fontSize: '12px', textAlign: 'left'
      }}>
        <strong>[Mermaid Syntax Error]</strong>
        <pre style={{ margin: '6px 0 0 0', overflowX: 'auto', fontSize: '11px', opacity: 0.85 }}>{error}</pre>
      </div>
    )
  }

  return (
    <div
      className="mermaid-svg-container"
      style={{ display: 'flex', justifyContent: 'center', background: '#12121e', borderRadius: '8px', padding: '16px', overflowX: 'auto' }}
      dangerouslySetInnerHTML={{ __html: svg || '<span style="color:#6b7280; font-size:12px;">Mermaid 로딩 중...</span>' }}
    />
  )
}
