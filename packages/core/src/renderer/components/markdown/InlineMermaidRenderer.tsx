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

  // 2. 한국어/영문 end 키워드 줄바꿈 분리
  text = text.replace(/^(\s*)end([가-힣a-zA-Z]+)/gm, '$1end\n$1$2')

  // 3. flowchart / graph에서 콜론(:) 문법 자동 교정
  const isSequence = /^\s*sequenceDiagram/im.test(text)
  if (!isSequence) {
    // 3-1. 세미콜론 뒤 줄바꿈 누락 분리 (C[End];A --> B -> C[End];\nA --> B)
    text = text.replace(/;([^\n\r\s])/g, ';\n$1')

    // 3-2. A --> B: 라벨 -> A -->|라벨| B
    text = text.replace(/([a-zA-Z0-9_\-\[\]\(\)\"\s]+?)\s*-->\s*([a-zA-Z0-9_\-\[\]\(\)\"\s]+?)\s*:\s*([^;\n]+)/g, (_match, from, to, label) => {
      const cleanLabel = label.trim().replace(/^\/\/\s*/, '')
      return `${from.trim()} -->|${cleanLabel}| ${to.trim()}`
    })

    // 3-3. A -> B: 라벨 -> A -->|라벨| B
    text = text.replace(/([a-zA-Z0-9_\-\[\]\(\)\"\s]+?)\s*->\s*([a-zA-Z0-9_\-\[\]\(\)\"\s]+?)\s*:\s*([^;\n]+)/g, (_match, from, to, label) => {
      const cleanLabel = label.trim().replace(/^\/\/\s*/, '')
      return `${from.trim()} -->|${cleanLabel}| ${to.trim()}`
    })

    // 3-4. A -> B -> A --> B
    text = text.replace(/([a-zA-Z0-9_\]\)\"]+)\s*->\s*([a-zA-Z0-9_\[\(\"]+)/g, '$1 --> $2')

    // 3-5. 라인 끝에 남은 슬래시 주석(//)이나 찌꺼기 정돈
    text = text.replace(/\/\/\s*$/gm, '')
  }

  return text
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
          Flowchart에서는 연결선에 콜론(<code>:</code>) 대신 <code>A --&gt;|라벨| B</code> 문법을 사용해야 합니다.
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
