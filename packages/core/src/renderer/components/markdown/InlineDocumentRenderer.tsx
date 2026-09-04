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
import { base64ToBlob } from '../../utils/binaryUtils'
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
  let props: any = {}
  try {
    props = code ? JSON.parse(code) : {}
  } catch (err) {
    console.error('[InlineDocumentRenderer] JSON parse failed, treating as empty:', err)
    props = {}
  }

  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null)
  const [uploadedName, setUploadedName] = useState<string | null>(null)
  const [uploadedType, setUploadedType] = useState<DocType | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileUpload = (file: File) => {
    const ext = file.name.split('.').pop()?.toLowerCase() || ''
    const docTypeMap: Record<string, DocType> = {
      pdf: 'pdf',
      docx: 'docx',
      doc: 'docx',
      pptx: 'pptx',
      ppt: 'pptx',
      xlsx: 'xlsx',
      xls: 'xlsx',
      csv: 'xlsx',
    }
    const detectedType = docTypeMap[ext] || 'unknown'
    const objUrl = URL.createObjectURL(file)
    setUploadedUrl(objUrl)
    setUploadedName(file.name)
    setUploadedType(detectedType)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) handleFileUpload(file)
  }

  const rawSourceUrl = uploadedUrl || props.sourceUrl
  const isOldMozilla = rawSourceUrl?.includes('helloworld.pdf') || rawSourceUrl?.includes('mozilla')
  const effectiveSourceUrl = isOldMozilla ? '/sample.pdf' : (rawSourceUrl || (props.docType === 'pdf' ? '/sample.pdf' : ''))
  const docType = (uploadedType || props.docType || (effectiveSourceUrl?.endsWith('.pdf') ? 'pdf' : 'pdf')) as DocType
  const config = DOC_TYPE_CONFIG[docType] || DOC_TYPE_CONFIG.unknown
  const effectiveFileName = uploadedName || ((isOldMozilla && (!props.fileName || props.fileName.includes('Architecture_Specification'))) 
    ? 'TraceMonkey_PLDI09_Benchmark_Paper.pdf' 
    : ((!props.fileName || props.fileName === 'AMEVA_Document.pdf') && effectiveSourceUrl.includes('/sample.pdf')
        ? 'TraceMonkey_PLDI09_Benchmark_Paper.pdf'
        : (props.fileName || `${config.label} 문서`)))

  const [isExpanded, setIsExpanded] = React.useState(props.isExpanded === 'true')
  const [pdfMode, setPdfMode] = React.useState<'native' | 'canvas'>('canvas')
  const [resolvedBlobUrl, setResolvedBlobUrl] = React.useState<string | null>(null)

  const isLocalMemory = effectiveSourceUrl?.startsWith('blob:') || effectiveSourceUrl?.startsWith('ameva-vfs://') || effectiveSourceUrl?.startsWith('data:')
  const hasFile = (!!effectiveSourceUrl && (isLocalMemory || effectiveSourceUrl.startsWith('/') || effectiveSourceUrl.startsWith('./'))) || !!props.fileBase64
  const hasUrl = !!effectiveSourceUrl && !isLocalMemory

  // PDF용 Blob URL 해석 (Chromium/Edge 내장 PDF 뷰어 연동)
  React.useEffect(() => {
    let active = true
    let createdUrl: string | null = null

    if (docType === 'pdf' && effectiveSourceUrl) {
      if (effectiveSourceUrl.startsWith('ameva-vfs://')) {
        const id = effectiveSourceUrl.replace('ameva-vfs://', '')
        getAttachment(id).then(blob => {
          if (!active) return
          if (blob) {
            createdUrl = URL.createObjectURL(blob)
            setResolvedBlobUrl(createdUrl)
          }
        }).catch(console.error)
      } else if (
        effectiveSourceUrl.startsWith('blob:') || 
        effectiveSourceUrl.startsWith('http') ||
        effectiveSourceUrl.startsWith('/') ||
        effectiveSourceUrl.startsWith('./')
      ) {
        const bustUrl = (effectiveSourceUrl.startsWith('/') && !effectiveSourceUrl.includes('?')) ? `${effectiveSourceUrl}?t=pldi` : effectiveSourceUrl
        setResolvedBlobUrl(bustUrl)
      } else if (effectiveSourceUrl.startsWith('data:') || props.fileBase64) {
        try {
          const raw = effectiveSourceUrl.startsWith('data:') ? effectiveSourceUrl : props.fileBase64
          const blob = base64ToBlob(raw, 'application/pdf')
          createdUrl = URL.createObjectURL(blob)
          setResolvedBlobUrl(createdUrl)
        } catch (e) {
          console.error('[InlineDocumentRenderer] Base64 PDF blob creation failed:', e)
        }
      }
    } else {
      setResolvedBlobUrl(null)
    }

    return () => {
      active = false
      if (createdUrl) URL.revokeObjectURL(createdUrl)
    }
  }, [docType, effectiveSourceUrl, props.fileBase64])

  const [customHeight, setCustomHeight] = useState<number>(() => parseInt(props.height || '460', 10))

  if (!effectiveSourceUrl && !props.fileBase64) {
    return (
      <div
        onClick={() => fileInputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        style={{
          border: `2px dashed ${isDragging ? '#ef4444' : '#3a3a4a'}`,
          borderRadius: '10px',
          padding: '36px 20px',
          textAlign: 'center',
          color: '#94a3b8',
          background: isDragging ? 'rgba(239, 68, 68, 0.08)' : '#0f0f16',
          cursor: 'pointer',
          margin: '14px 0',
          transition: 'all 0.2s ease',
          userSelect: 'none'
        }}
      >
        <div style={{ fontSize: '36px', marginBottom: '10px' }}>📑</div>
        <div style={{ fontSize: '14px', fontWeight: 700, color: '#e2e8f0', marginBottom: '6px' }}>
          PDF 또는 오피스 문서를 드래그하거나 클릭하여 업로드
        </div>
        <div style={{ fontSize: '11.5px', color: '#64748b' }}>
          PDF, DOCX, PPTX, XLSX 지원 • 온디바이스 인라인 뷰어 즉시 렌더링
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.docx,.pptx,.xlsx,.csv"
          style={{ display: 'none' }}
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileUpload(f) }}
        />
      </div>
    )
  }

  const headerBar = (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8, padding: '6px 12px',
      background: `${config.color}18`,
      borderBottom: `1px solid ${config.color}33`,
      flexShrink: 0,
    }}>
      <span style={{ color: config.color }}>{config.icon}</span>
      <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-main)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {effectiveFileName}
      </span>
      {uploadedUrl && (
        <button
          onClick={() => { setUploadedUrl(null); setUploadedName(null); setUploadedType(null) }}
          style={{
            padding: '2px 8px', background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.12)', borderRadius: '4px', cursor: 'pointer',
            color: '#cbd5e1', fontSize: '10px', fontWeight: 600,
          }}
        >
          다른 문서 선택
        </button>
      )}
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
              setCustomHeight(next ? 850 : 460)
            }}
            title={isExpanded ? '축소 (기본 높이로)' : '확대 (850px+ 로)'}
          >
            {isExpanded ? <Minimize2 size={12} /> : <Maximize2 size={12} />}
          </button>
        )}
        {hasUrl && !effectiveSourceUrl?.startsWith('/') && (
          <button
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 2 }}
            onClick={() => window.open(effectiveSourceUrl, '_blank')}
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
            {docType === 'pdf' && pdfMode === 'native' && (resolvedBlobUrl || effectiveSourceUrl?.startsWith('http') || effectiveSourceUrl?.startsWith('/')) ? (
              <iframe
                src={resolvedBlobUrl || effectiveSourceUrl}
                style={{ width: '100%', height: '100%', border: 'none', display: 'block', background: '#525659' }}
                title={effectiveFileName}
                allowFullScreen
              />
            ) : docType === 'pdf' && pdfMode === 'native' ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#94a3b8', fontSize: 12 }}>
                PDF 문서 로딩 중...
              </div>
            ) : null}
            {docType === 'pdf' && pdfMode === 'canvas' && (hasFile || hasUrl) && (
              <PdfMiniViewer 
                sourceUrl={resolvedBlobUrl || effectiveSourceUrl} 
                height={viewHeight} 
                savedBookmarks={(() => { try { return JSON.parse(props.bookmarks || '[]') } catch { return [] } })()}
              />
            )}
            {docType !== 'pdf' && docType !== 'pptx' && hasFile && (
              <OfficeDocViewer
                sourceUrl={effectiveSourceUrl}
                fileBase64={props.fileBase64}
                docType={docType}
                fileName={effectiveFileName}
                height={viewHeight}
              />
            )}
            {docType === 'pptx' && hasFile && (
              <PptxMiniViewer
                sourceUrl={effectiveSourceUrl}
                fileBase64={props.fileBase64}
                height={viewHeight}
              />
            )}
            {docType !== 'pdf' && hasUrl && !effectiveSourceUrl?.startsWith('/') && (
              <iframe
                src={`https://docs.google.com/viewer?url=${encodeURIComponent(effectiveSourceUrl)}&embedded=true`}
                style={{ width: '100%', height: '100%', border: 'none' }}
                title={effectiveFileName}
              />
            )}
          </div>
        )
      }}
    </ResizableBlockContainer>
  )
}
