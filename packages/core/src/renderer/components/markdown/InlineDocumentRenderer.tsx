import React from 'react'
import { DOC_TYPE_CONFIG, PdfMiniViewer, PptxMiniViewer, OfficeDocViewer } from '../InlineDocumentBlock'
import type { DocType } from '../InlineDocumentBlock'
import { Maximize2, Minimize2, ExternalLink } from 'lucide-react'

const MAX_HEIGHT = 900

export function InlineDocumentRenderer({ code }: { code: string }) {
  let props: any = null
  try {
    props = JSON.parse(code)
  } catch (err) {
    console.error('[InlineDocumentRenderer] JSON parse failed:', err)
    return <div style={{ color: 'var(--text-muted)', fontSize: '11px' }}>문서 데이터를 해석할 수 없습니다.</div>
  }

  const [isExpanded, setIsExpanded] = React.useState(props.isExpanded === 'true')
  const [localHeight, setLocalHeight] = React.useState<number | null>(null)
  const [isDragging, setIsDragging] = React.useState(false)

  const baseHeight = parseInt(props.height || '420', 10)
  const height = localHeight ?? baseHeight
  const docType = (props.docType as DocType) || 'unknown'
  const config = DOC_TYPE_CONFIG[docType] || DOC_TYPE_CONFIG.unknown

  const isLocalMemory = props.sourceUrl?.startsWith('blob:') || props.sourceUrl?.startsWith('ameva-vfs://') || props.sourceUrl?.startsWith('data:')
  const hasFile = !!props.sourceUrl && isLocalMemory
  const hasUrl = !!props.sourceUrl && !isLocalMemory

  const containerStyle: React.CSSProperties = {
    position: 'relative',
    border: `1px solid ${isDragging ? config.color : 'var(--border-muted)'}`,
    borderRadius: 10,
    overflow: 'hidden',
    background: 'var(--bg-card)',
    margin: '16px 0',
    transition: 'border-color 0.2s, box-shadow 0.2s',
    userSelect: 'none',
    boxShadow: isDragging ? `0 0 0 2px ${config.color}44` : 'none',
    maxWidth: '100%',
  }

  const handleResizeMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
    const startY = e.clientY
    const startHeight = height

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const delta = moveEvent.clientY - startY
      setLocalHeight(Math.min(MAX_HEIGHT, Math.max(150, startHeight + delta)))
    }

    const handleMouseUp = () => {
      setIsDragging(false)
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
  }

  const viewHeight = isExpanded ? Math.min(height * 1.6, MAX_HEIGHT) : height

  return (
    <div style={containerStyle}>
      {/* 헤더 바 */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8, padding: '6px 12px',
        background: `${config.color}18`,
        borderBottom: `1px solid ${config.color}33`,
        flexShrink: 0,
      }}>
        <span style={{ color: config.color }}>{config.icon}</span>
        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-main)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {props.fileName || `${config.label} 문서`}
        </span>
        <div style={{ display: 'flex', gap: 4 }}>
          {(hasFile || hasUrl) && (
            <button
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 2 }}
              onClick={() => setIsExpanded(!isExpanded)}
              title={isExpanded ? '축소' : '확대'}
            >
              {isExpanded ? <Minimize2 size={12} /> : <Maximize2 size={12} />}
            </button>
          )}
          {hasUrl && (
            <button
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 2 }}
              onClick={() => window.open(props.sourceUrl, '_blank')}
              title="새 탭에서 열기"
            >
              <ExternalLink size={12} />
            </button>
          )}
        </div>
      </div>

      {/* 뷰어 영역 */}
      <div style={{ height: viewHeight, overflow: 'hidden', position: 'relative' }}>
        {docType === 'pdf' && hasFile && (
          <PdfMiniViewer sourceUrl={props.sourceUrl} height={viewHeight} />
        )}
        {docType === 'pdf' && hasUrl && (
          <iframe
            src={props.sourceUrl}
            style={{ width: '100%', height: '100%', border: 'none', display: 'block' }}
            title={props.fileName || 'PDF'}
            allowFullScreen
          />
        )}
        {docType !== 'pdf' && docType !== 'pptx' && hasFile && (
          <OfficeDocViewer
            sourceUrl={props.sourceUrl}
            fileBase64={props.fileBase64}
            docType={docType}
            fileName={props.fileName}
            height={viewHeight}
          />
        )}
        {docType === 'pptx' && hasFile && (
          <PptxMiniViewer
            sourceUrl={props.sourceUrl}
            fileBase64={props.fileBase64}
            height={viewHeight}
          />
        )}
        {docType !== 'pdf' && hasUrl && (
          <iframe
            src={`https://docs.google.com/viewer?url=${encodeURIComponent(props.sourceUrl)}&embedded=true`}
            style={{ width: '100%', height: '100%', border: 'none' }}
            title={props.fileName || '문서'}
          />
        )}
      </div>

      {/* 하단 리사이저 핸들 */}
      <div
        onMouseDown={handleResizeMouseDown}
        style={{
          width: '100%',
          height: '14px',
          background: isDragging ? `${config.color}18` : 'transparent',
          cursor: 'ns-resize',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          transition: 'background 0.15s',
        }}
        title="드래그하여 높이 조절"
      >
        <div style={{
          width: isDragging ? '60px' : '40px',
          height: '4px',
          background: isDragging ? config.color : 'rgba(255,255,255,0.2)',
          borderRadius: '2px',
          transition: 'all 0.15s',
        }} />
      </div>
    </div>
  )
}
