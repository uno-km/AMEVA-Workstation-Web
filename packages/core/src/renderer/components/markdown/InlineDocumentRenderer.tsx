/**
 * ============================================================================
 * @file InlineDocumentRenderer.tsx
 * @description InlineDocumentRenderer.tsx 시스템 모듈 구성요소로, 관련 UI 렌더링 및 비즈니스 로직을 담당합니다.
 * @usage 문서 에디터 및 뷰어 내부에서 동적으로 호출되거나 유틸리티 함수로 사용됩니다.
 * @example
 * // 예시 로직 (자동 생성됨)
 * import { something } from './InlineDocumentRenderer';
 * 
 * @created 2026-08-10 20:30:36
 * @updated 2026-08-10 20:30:36
 * @author uno-km
 * @commit docs: 전체 소스코드 한글 주석 및 사내 컨벤션 일괄 적용
 * ============================================================================
 */

// [외부 패키지 및 라이브러리 임포트: react]
import React, { useState, useEffect, useCallback, useRef } from 'react'
// [내부 프로젝트 의존성 모듈 임포트: ../../utils/vfsDatabase]
import { getAttachment } from '../../utils/vfsDatabase'
// [내부 프로젝트 의존성 모듈 임포트: ../ResizableBlockContainer]
import { ResizableBlockContainer } from '../ResizableBlockContainer'
// [내부 프로젝트 의존성 모듈 임포트: ../InlineDocumentBlock]
import { DOC_TYPE_CONFIG, PdfMiniViewer, PptxMiniViewer, OfficeDocViewer } from '../InlineDocumentBlock'
// [내부 프로젝트 의존성 모듈 임포트: ../InlineDocumentBlock]
import type { DocType } from '../InlineDocumentBlock'
// [외부 패키지 및 라이브러리 임포트: lucide-react]
import { Maximize2, Minimize2, ExternalLink } from 'lucide-react'

/**
 * InlineDocumentRenderer 함수의 핵심 비즈니스 로직 및 상태 제어를 처리합니다.
 * @remarks 이 주석은 컨벤션에 따라 자동 생성된 문서화 내용입니다.
 */
export function InlineDocumentRenderer({ code }: { code: string }) {
  let props: any = null
  try {
    props = JSON.parse(code)
  } catch (err) {
    console.error('[InlineDocumentRenderer] JSON parse failed:', err)
    return <div style={{ color: 'var(--text-muted)', fontSize: '11px' }}>문서 데이터를 해석할 수 없습니다.</div>
  }

  const [isExpanded, setIsExpanded] = React.useState(props.isExpanded === 'true')
  const [pdfMode, setPdfMode] = React.useState<'native' | 'canvas'>('native')
  const [resolvedBlobUrl, setResolvedBlobUrl] = React.useState<string | null>(null)

  const docType = (props.docType as DocType) || 'unknown'
  const config = DOC_TYPE_CONFIG[docType] || DOC_TYPE_CONFIG.unknown

  const isLocalMemory = props.sourceUrl?.startsWith('blob:') || props.sourceUrl?.startsWith('ameva-vfs://') || props.sourceUrl?.startsWith('data:')
  const hasFile = (!!props.sourceUrl && isLocalMemory) || !!props.fileBase64
  const hasUrl = !!props.sourceUrl && !isLocalMemory

  // PDF용 Blob URL 해석 (Chromium/Edge 내장 PDF 뷰어 연동)
  React.useEffect(() => {
    let active = true
    let createdUrl: string | null = null

    if (docType === 'pdf' && props.sourceUrl) {
      if (props.sourceUrl.startsWith('ameva-vfs://')) {
        const id = props.sourceUrl.replace('ameva-vfs://', '')
        getAttachment(id).then(blob => {
          if (!active) return
          if (blob) {
            createdUrl = URL.createObjectURL(blob)
            setResolvedBlobUrl(createdUrl)
          }
        }).catch(console.error)
      } else if (props.sourceUrl.startsWith('blob:') || props.sourceUrl.startsWith('http')) {
        setResolvedBlobUrl(props.sourceUrl)
      } else if (props.sourceUrl.startsWith('data:') || props.fileBase64) {
        try {
          const raw = props.sourceUrl.startsWith('data:') ? props.sourceUrl : props.fileBase64
          const cleanBase64 = raw.includes(',') ? raw.split(',')[1] : raw
          const binary = atob(cleanBase64.replace(/\s/g, ''))
          const bytes = new Uint8Array(binary.length)
          for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
          const blob = new Blob([bytes], { type: 'application/pdf' })
          createdUrl = URL.createObjectURL(blob)
          setResolvedBlobUrl(createdUrl)
        } catch (e) {
          console.error(e)
        }
      }
    } else {
      setResolvedBlobUrl(null)
    }

    return () => {
      active = false
      if (createdUrl) URL.revokeObjectURL(createdUrl)
    }
  }, [docType, props.sourceUrl, props.fileBase64])

  const [customHeight, setCustomHeight] = useState<number>(() => parseInt(props.height || '420', 10))

  const headerBar = (
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
      {docType === 'pdf' && (hasFile || hasUrl) && (
        <button
          onClick={() => setPdfMode(prev => prev === 'native' ? 'canvas' : 'native')}
          style={{
            padding: '2px 6px', background: 'rgba(239, 68, 68, 0.18)',
            border: '1px solid rgba(239, 68, 68, 0.4)', borderRadius: '4px', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: '4px', color: '#fca5a5', fontSize: '10px', fontWeight: 600,
          }}
          title={pdfMode === 'native' ? '커스텀 캔버스 뷰어로 전환' : 'Edge/Chrome 브라우저 기본 PDF 리더로 전환'}
        >
          {pdfMode === 'native' ? '🖥️ 브라우저 뷰어' : '📑 캔버스 뷰어'}
        </button>
      )}
      <div style={{ display: 'flex', gap: 4 }}>
        {(hasFile || hasUrl) && (
          <button
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 2 }}
            onClick={() => {
              const next = !isExpanded
              setIsExpanded(next)
              setCustomHeight(next ? 850 : 420)
            }}
            title={isExpanded ? '축소 (기본 높이로)' : '확대 (850px+ 로)'}
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
  )

  return (
    <ResizableBlockContainer
      initialWidth={props.width || '100%'}
      initialHeight={customHeight}
      minHeight={150}
      maxHeight={4000}
      minWidth={280}
      maxWidth={3200}
      accentColor={config.color}
      header={headerBar}
    >
      {({ height: blockHeight }) => {
        const viewHeight = blockHeight

        return (
          <div style={{ height: viewHeight, overflow: 'hidden', position: 'relative' }}>
            {docType === 'pdf' && pdfMode === 'native' && (resolvedBlobUrl || props.sourceUrl?.startsWith('http')) ? (
              <iframe
                src={resolvedBlobUrl || props.sourceUrl}
                style={{ width: '100%', height: '100%', border: 'none', display: 'block', background: '#525659' }}
                title={props.fileName || 'PDF'}
                allowFullScreen
              />
            ) : docType === 'pdf' && pdfMode === 'native' ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#94a3b8', fontSize: 12 }}>
                PDF 문서 로딩 중...
              </div>
            ) : null}
            {docType === 'pdf' && pdfMode === 'canvas' && hasFile && (
              <PdfMiniViewer 
                sourceUrl={props.sourceUrl} 
                height={viewHeight} 
                savedBookmarks={(() => { try { return JSON.parse(props.bookmarks || '[]') } catch { return [] } })()}
              />
            )}
            {docType === 'pdf' && pdfMode === 'canvas' && hasUrl && (
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
        )
      }}
    </ResizableBlockContainer>
  )
}
