/**
 * ============================================================================
 * @file InlineMermaidRenderer.tsx
 * @system AMEVA OS Desktop Workstation
 * @location packages/core/src/renderer/components/markdown/InlineMermaidRenderer.tsx
 * @role Inline Mermaid Diagram SVG Renderer with Dynamic Instance Isolation
 * ============================================================================
 */

import { useState, useEffect, useRef } from 'react'
import mermaid from 'mermaid'
import { ZoomIn, ZoomOut, RotateCcw, Maximize2 } from 'lucide-react'

export function sanitizeMermaidCode(raw: string): string {
  if (!raw) return ''
  let text = raw.trim()

  // 1. ```mermaid 마크다운 펜스 제거
  text = text.replace(/^```(?:mermaid)?\s*\n?/i, '').replace(/\n?```\s*$/i, '').trim()

  // 2. 다이어그램 타입 검사 (Flowchart/Graph 외의 다이어그램은 콜론 문법을 고유하게 사용하므로 교정 제외)
  const isNonFlowchart = /^\s*(sequenceDiagram|classDiagram|erDiagram|stateDiagram(?:-v2)?|journey|gantt|pie|gitGraph|mindmap|quadrantChart|requirementDiagram|c4(?:Context|Container|Component|Dynamic|Deployment)|zenuml|sankey-beta|timeline|packet-beta|kanban|block-beta)\b/im.test(text)

  if (isNonFlowchart) {
    // 비-Flowchart 다이어그램: 마크다운 펜스 제거 및 기본 정돈만 수행
    return text
  }

  // 3. 한국어/영문 end 키워드 줄바꿈 분리
  text = text.replace(/^(\s*)end([가-힣a-zA-Z]+)/gm, '$1end\n$1$2')

  // 4. Flowchart 라인별 정밀 스캐너 및 콜론(:) 라벨 안전 교정
  const lines = text.split(/\r?\n/)
  const processedLines = lines.map(line => {
    const trimmed = line.trim()
    if (!trimmed) return line

    // 주석, 지시어, 서브그래프, 스타일/클래스 정의는 보존
    if (
      trimmed.startsWith('%%') ||
      /^(subgraph|end|classDef|class|style|linkStyle|click|direction)\b/i.test(trimmed)
    ) {
      return line
    }

    // 최상위 레벨(따옴표 및 괄호 밖)의 토큰 분석
    let inDoubleQuote = false
    let inSingleQuote = false
    let bracketDepth = 0 // [], (), {}
    let topLevelColonIdx = -1

    for (let i = 0; i < line.length; i++) {
      const ch = line[i]
      const prev = i > 0 ? line[i - 1] : ''

      if (ch === '"' && prev !== '\\') {
        if (!inSingleQuote) inDoubleQuote = !inDoubleQuote
      } else if (ch === "'" && prev !== '\\') {
        if (!inDoubleQuote) inSingleQuote = !inSingleQuote
      } else if (!inDoubleQuote && !inSingleQuote) {
        if (ch === '[' || ch === '(' || ch === '{') {
          bracketDepth++
        } else if (ch === ']' || ch === ')' || ch === '}') {
          bracketDepth = Math.max(0, bracketDepth - 1)
        } else if (ch === ':' && bracketDepth === 0) {
          // 최상위 레벨 콜론 발견
          if (topLevelColonIdx === -1) {
            topLevelColonIdx = i
          }
        }
      }
    }

    let targetLine = line
    // 최상위 레벨 콜론이 있고, 그 콜론이 라벨 분리자인 경우
    if (topLevelColonIdx !== -1) {
      const beforeColon = line.substring(0, topLevelColonIdx)
      const afterColon = line.substring(topLevelColonIdx + 1)

      // beforeColon에 연결선이 있고, 이미 |라벨| 형식이 아닌 경우에만 교정
      const arrowMatch = beforeColon.match(/(.*?)(\s*-->|\s*->|\s*==>|\s*-\.->)\s*([^\s].*)$/)
      if (arrowMatch && !beforeColon.includes('|')) {
        const [, fromPart, arrow, toPart] = arrowMatch
        const label = afterColon.trim().replace(/^\/\/\s*/, '')
        const normalizedArrow = arrow.trim() === '->' ? '-->' : arrow.trim()
        targetLine = `${fromPart} ${normalizedArrow}|${label}| ${toPart}`
      }
    }

    // 최상위 레벨 단독 -> 를 --> 로 표준화 (따옴표/괄호 밖)
    let res = ''
    inDoubleQuote = false
    inSingleQuote = false
    bracketDepth = 0
    for (let i = 0; i < targetLine.length; i++) {
      const ch = targetLine[i]
      const prev = i > 0 ? targetLine[i - 1] : ''

      if (ch === '"' && prev !== '\\') {
        if (!inSingleQuote) inDoubleQuote = !inDoubleQuote
        res += ch
      } else if (ch === "'" && prev !== '\\') {
        if (!inDoubleQuote) inSingleQuote = !inSingleQuote
        res += ch
      } else if (!inDoubleQuote && !inSingleQuote) {
        if (ch === '[' || ch === '(' || ch === '{') {
          bracketDepth++
          res += ch
        } else if (ch === ']' || ch === ')' || ch === '}') {
          bracketDepth = Math.max(0, bracketDepth - 1)
          res += ch
        } else if (bracketDepth === 0 && targetLine.substring(i, i + 2) === '->' && targetLine[i - 1] !== '-' && targetLine[i + 2] !== '>') {
          res += '-->'
          i++ // skip '>'
        } else {
          res += ch
        }
      } else {
        res += ch
      }
    }

    return res
  })

  return processedLines.join('\n')
}

export function InlineMermaidRenderer({ code }: { code: string }) {
  const [svg, setSvg] = useState<string>('')
  const [error, setError] = useState<string | null>(null)
  const [scale, setScale] = useState<number>(1)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let active = true
    const renderId = `mermaid-preview-${Date.now()}-${Math.random().toString(36).substr(2, 7)}`

    const renderDiagram = async () => {
      if (!code || !code.trim()) {
        if (active) {
          setSvg('')
          setError(null)
        }
        return
      }

      try {
        mermaid.initialize({
          startOnLoad: false,
          theme: 'dark',
          securityLevel: 'loose',
          fontFamily: 'Pretendard, -apple-system, sans-serif'
        })
        let cleanCode = sanitizeMermaidCode(code)
        
        let renderedSvg = ''
        try {
          const res = await mermaid.render(renderId, cleanCode)
          renderedSvg = res.svg
        } catch (firstErr) {
          // 2차 폴백: 세미콜론 및 헤더 포맷 보정 후 재시도
          const fallbackCode = cleanCode
            .replace(/^graph\s+([A-Z]+);/im, 'graph $1\n')
            .replace(/;\s*$/gm, '')
          const res = await mermaid.render(renderId + '-fb', fallbackCode)
          renderedSvg = res.svg
        }

        if (active && renderedSvg) {
          // SVG의 고정 너비/높이를 반응형으로 보정하여 컨테이너 리사이징 시 비례 스케일링 지원
          let processedSvg = renderedSvg
            .replace(/<svg\s+([^>]*?)id="[^"]*"/, `<svg $1 id="${renderId}-svg"`)
            .replace(/style="max-width:[^"]*"/g, 'style="width:100%; height:100%; max-width:100%;"')
          
          setSvg(processedSvg)
          setError(null)
        }
      } catch (err: any) {
        if (active) {
          setError(err.message || 'Mermaid 렌더링에 실패했습니다.')
        }
      }
    }

    renderDiagram()

    return () => {
      active = false
      const el = document.getElementById(renderId)
      if (el) el.remove()
      const dEl = document.getElementById('d' + renderId)
      if (dEl) dEl.remove()
    }
  }, [code])

  const handleZoomIn = () => setScale(prev => Math.min(3, Math.round((prev + 0.15) * 100) / 100))
  const handleZoomOut = () => setScale(prev => Math.max(0.4, Math.round((prev - 0.15) * 100) / 100))
  const handleResetZoom = () => setScale(1)

  if (error) {
    return (
      <div style={{
        padding: '14px 18px',
        borderRadius: '8px',
        background: 'rgba(239, 68, 68, 0.09)',
        border: '1.5px solid rgba(239, 68, 68, 0.3)',
        color: '#fca5a5',
        fontSize: '12px',
        textAlign: 'left',
        width: '100%',
        boxSizing: 'border-box'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
          <strong style={{ color: '#f87171', fontSize: '12.5px' }}>[Mermaid 문법 오류 감지]</strong>
        </div>
        <p style={{ margin: '0 0 6px 0', fontSize: '11px', color: '#cbd5e1' }}>
          다이어그램 문법을 확인해 주세요. Flowchart 연결선 라벨은 <code>A --&gt;|라벨| B</code> 형식을 권장합니다.
        </p>
        <pre style={{ margin: '0', overflowX: 'auto', fontSize: '11px', opacity: 0.9, background: 'rgba(0,0,0,0.3)', padding: '6px', borderRadius: '4px' }}>{error}</pre>
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      className="mermaid-wrapper"
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        minHeight: '100px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#0a0d14',
        borderRadius: '6px',
        overflow: 'hidden',
        boxSizing: 'border-box'
      }}
    >
      {/* ─── 머메이드 다이어그램 배율 툴바 ─── */}
      {svg && (
        <div style={{
          position: 'absolute',
          top: 8,
          right: 8,
          zIndex: 10,
          display: 'flex',
          alignItems: 'center',
          gap: 3,
          background: 'rgba(15, 23, 42, 0.85)',
          backdropFilter: 'blur(8px)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          borderRadius: 6,
          padding: '2px 6px',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.4)'
        }}>
          <span style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 600, marginRight: 2 }}>
            {Math.round(scale * 100)}%
          </span>
          <button
            onClick={handleZoomOut}
            title="축소"
            style={{ background: 'transparent', border: 'none', color: '#cbd5e1', cursor: 'pointer', padding: '2px', display: 'flex' }}
          >
            <ZoomOut size={12} />
          </button>
          <button
            onClick={handleZoomIn}
            title="확대"
            style={{ background: 'transparent', border: 'none', color: '#cbd5e1', cursor: 'pointer', padding: '2px', display: 'flex' }}
          >
            <ZoomIn size={12} />
          </button>
          <button
            onClick={handleResetZoom}
            title="원래 크기로 (100%)"
            style={{ background: 'transparent', border: 'none', color: '#cbd5e1', cursor: 'pointer', padding: '2px', display: 'flex' }}
          >
            <RotateCcw size={11} />
          </button>
        </div>
      )}

      <div
        className="mermaid-svg-container"
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          width: '100%',
          height: '100%',
          padding: '16px',
          overflow: 'auto',
          boxSizing: 'border-box',
          transform: `scale(${scale})`,
          transformOrigin: 'center center',
          transition: 'transform 0.15s ease'
        }}
        dangerouslySetInnerHTML={{ __html: svg || '<span style="color:#64748b; font-size:12px;">Mermaid 다이어그램 렌더링 중...</span>' }}
      />
    </div>
  )
}
