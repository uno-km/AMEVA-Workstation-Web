/**
 * @file InlineDocumentBlock.tsx
 * @system AMEVA OS Desktop Workstation
 * @location src/renderer/components/InlineDocumentBlock.tsx
 * @role 에디터 내 인라인 문서 뷰어 블록 (PDF / PPTX / DOCX / XLSX)
 *
 * [책임 범위 - RESPONSIBILITY]
 * - 에디터 내에 PDF, PowerPoint, Word, Excel 파일을 인라인으로 임베딩한다.
 * - 슬래시 메뉴 (/pdf, /ppt, /word, /excel)를 통해 삽입된다.
 * - PDF는 pdfjs-dist Canvas 렌더링, Office 파일은 iframe 기반 Office Online으로 표시.
 * - 파일은 로컬 업로드(base64) 또는 URL로 제공할 수 있다.
 *
 * [소비처 - CONSUMERS / USAGE CONTEXT]
 * - 소비처 A (amevaBlockSchema.ts): 커스텀 블록으로 등록.
 * - 소비처 B (customSlashMenuItems.tsx): 슬래시 메뉴 항목으로 노출.
 */

import React, { useState, useRef, useCallback, useEffect } from 'react'
import { createReactBlockSpec } from '@blocknote/react'
import { Upload, FileText, FileSpreadsheet, Presentation, FileType2, X, Maximize2, Minimize2, ExternalLink } from 'lucide-react'
import * as pdfjsLib from 'pdfjs-dist'
import { saveAttachment, getAttachment } from '../utils/vfsDatabase'
// @ts-ignore
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.mjs?url'

// Worker CSP 대응 (Blob Module Worker)
const workerBlob = new Blob([`import '${pdfWorkerUrl}';`], { type: 'application/javascript' })
const workerBlobUrl = URL.createObjectURL(workerBlob)
pdfjsLib.GlobalWorkerOptions.workerPort = new Worker(workerBlobUrl, { type: 'module' })

export type DocType = 'pdf' | 'pptx' | 'docx' | 'xlsx' | 'unknown'

function detectDocType(fileName: string, mimeType?: string): DocType {
  const ext = fileName.split('.').pop()?.toLowerCase() || ''
  if (ext === 'pdf' || mimeType?.includes('pdf')) return 'pdf'
  if (['pptx', 'ppt'].includes(ext)) return 'pptx'
  if (['docx', 'doc'].includes(ext)) return 'docx'
  if (['xlsx', 'xls'].includes(ext)) return 'xlsx'
  return 'unknown'
}

export const DOC_TYPE_CONFIG: Record<DocType, { label: string; color: string; icon: React.ReactNode }> = {
  pdf:     { label: 'PDF',         color: '#ef4444', icon: <FileText size={16} /> },
  pptx:    { label: 'PowerPoint',  color: '#f97316', icon: <Presentation size={16} /> },
  docx:    { label: 'Word',        color: '#3b82f6', icon: <FileType2 size={16} /> },
  xlsx:    { label: 'Excel',       color: '#22c55e', icon: <FileSpreadsheet size={16} /> },
  unknown: { label: '문서',        color: '#8b5cf6', icon: <FileText size={16} /> },
}

/** PDF Mini Viewer (Canvas 렌더링) */
export function PdfMiniViewer({ sourceUrl, height }: { sourceUrl: string; height: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [numPages, setNumPages] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const pdfRef = useRef<any>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)

    let objectUrlToRevoke: string | null = null

    const loadPdf = async () => {
      try {
        let getDocumentArg: any = sourceUrl
        if (sourceUrl.startsWith('ameva-vfs://')) {
          const fileId = sourceUrl.replace('ameva-vfs://', '')
          const blob = await getAttachment(fileId)
          if (!blob) throw new Error('VFS_EXPIRED')
          const objectUrl = URL.createObjectURL(blob)
          objectUrlToRevoke = objectUrl
          getDocumentArg = { url: objectUrl }
        } else if (sourceUrl.startsWith('data:')) {
          const cleanBase64 = sourceUrl.split(',')[1] || ''
          const binaryString = atob(cleanBase64.replace(/\s/g, ''))
          const len = binaryString.length
          const bytes = new Uint8Array(len)
          for (let i = 0; i < len; i++) bytes[i] = binaryString.charCodeAt(i)
          getDocumentArg = { data: bytes }
        }

        const pdf = await pdfjsLib.getDocument(getDocumentArg).promise
        if (cancelled) {
          return
        }
        pdfRef.current = pdf
        setNumPages(pdf.numPages)
        setLoading(false)
      } catch (e: any) {
        if (!cancelled) {
          if (sourceUrl.startsWith('blob:') || e.message === 'VFS_EXPIRED') {
            setError('임시 파일이 만료되었거나 로드에 실패했습니다. 문서를 다시 업로드해주세요.')
          } else {
            setError(e?.message || 'PDF 로드 실패')
          }
          setLoading(false)
        }
      }
    }

    if (sourceUrl) loadPdf()
    return () => { 
      cancelled = true 
      if (objectUrlToRevoke) URL.revokeObjectURL(objectUrlToRevoke)
    }
  }, [sourceUrl])

  useEffect(() => {
    if (!pdfRef.current || loading) return
    const renderPage = async () => {
      try {
        const page = await pdfRef.current.getPage(currentPage)
        const canvas = canvasRef.current
        if (!canvas) return
        const viewport = page.getViewport({ scale: 1.2 })
        const dpr = window.devicePixelRatio || 1
        canvas.width = Math.floor(viewport.width * dpr)
        canvas.height = Math.floor(viewport.height * dpr)
        canvas.style.width = `${viewport.width}px`
        canvas.style.height = `${viewport.height}px`
        const ctx = canvas.getContext('2d')!
        ctx.scale(dpr, dpr)
        await page.render({ canvasContext: ctx, viewport }).promise
      } catch {}
    }
    renderPage()
  }, [currentPage, loading])

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height, color: '#94a3b8', fontSize: 12 }}>
      PDF 로딩 중...
    </div>
  )
  if (error) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height, color: '#f87171', fontSize: 12 }}>
      {error}
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height }}>
      {/* 페이지 이동 바 */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        padding: '4px 8px', background: 'rgba(0,0,0,0.4)', flexShrink: 0,
        fontSize: 11, color: '#94a3b8',
      }}>
        <button
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: '2px 6px' }}
          onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
          disabled={currentPage <= 1}
        >‹</button>
        <span>{currentPage} / {numPages}</span>
        <button
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: '2px 6px' }}
          onClick={() => setCurrentPage(p => Math.min(numPages, p + 1))}
          disabled={currentPage >= numPages}
        >›</button>
      </div>
      {/* 캔버스 영역 */}
      <div style={{ flex: 1, overflow: 'auto', display: 'flex', justifyContent: 'center', background: '#1a1a24', padding: 8 }}>
        <canvas ref={canvasRef} style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.5)' }} />
      </div>
    </div>
  )
}

/** 메인 InlineDocumentBlock */
function InlineDocumentBlockComponent({ block, editor }: any) {
  const props = block.props as {
    fileName: string
    fileBase64: string
    docType: DocType
    height: string
    width: string
    sourceUrl: string
    isExpanded: string
  }

  const [isDragging, setIsDragging] = useState(false)
  const [localHeight, setLocalHeight] = useState<number | null>(null)
  const [localWidth, setLocalWidth] = useState<number | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const bottomResizerRef = useRef<HTMLDivElement>(null)
  const rightResizerRef = useRef<HTMLDivElement>(null)
  
  const height = localHeight ?? parseInt(props.height || '420', 10)
  // width: '100%'이면 null(full), 숫자면 px
  const widthStr = props.width || '100%'
  const localWidthNum = localWidth ?? (widthStr === '100%' ? null : parseInt(widthStr, 10))
  const isExpanded = props.isExpanded === 'true'
  const docType = (props.docType as DocType) || 'unknown'
  const config = DOC_TYPE_CONFIG[docType]

  const isLocalMemory = props.sourceUrl?.startsWith('blob:') || props.sourceUrl?.startsWith('ameva-vfs://') || props.sourceUrl?.startsWith('data:')
  const hasFile = !!props.sourceUrl && isLocalMemory
  const hasUrl = !!props.sourceUrl && !isLocalMemory

  // ── 리사이저: native 이벤트에 stopImmediatePropagation 적용 (BlockNote ProseMirror 충돌 완전 차단)
  useEffect(() => {
    const bottomEl = bottomResizerRef.current
    const rightEl = rightResizerRef.current
    if (!bottomEl && !rightEl) return

    const stopAll = (e: Event) => {
      e.stopPropagation()
      e.stopImmediatePropagation()
    }

    const onBottomMouseDown = (e: MouseEvent) => {
      e.preventDefault()
      stopAll(e)
      const startY = e.clientY
      const startH = localHeight ?? parseInt(props.height || '420', 10)

      const onMove = (mv: MouseEvent) => {
        const newH = Math.min(1000, Math.max(150, startH + mv.clientY - startY))
        setLocalHeight(newH)
      }
      const onUp = (up: MouseEvent) => {
        const finalH = Math.min(1000, Math.max(150, startH + up.clientY - startY))
        setLocalHeight(null)
        editor.updateBlock(block.id, { props: { ...props, height: finalH.toString() } })
        window.removeEventListener('mousemove', onMove)
        window.removeEventListener('mouseup', onUp)
      }
      window.addEventListener('mousemove', onMove)
      window.addEventListener('mouseup', onUp)
    }

    const onRightMouseDown = (e: MouseEvent) => {
      e.preventDefault()
      stopAll(e)
      const startX = e.clientX
      const containerWidth = containerRef.current?.getBoundingClientRect().width ?? 600
      const startW = localWidthNum ?? containerWidth

      const onMove = (mv: MouseEvent) => {
        const newW = Math.min(window.innerWidth - 80, Math.max(300, startW + mv.clientX - startX))
        setLocalWidth(newW)
      }
      const onUp = (up: MouseEvent) => {
        const finalW = Math.min(window.innerWidth - 80, Math.max(300, startW + up.clientX - startX))
        setLocalWidth(null)
        editor.updateBlock(block.id, { props: { ...props, width: finalW.toString() } })
        window.removeEventListener('mousemove', onMove)
        window.removeEventListener('mouseup', onUp)
      }
      window.addEventListener('mousemove', onMove)
      window.addEventListener('mouseup', onUp)
    }

    bottomEl?.addEventListener('mousedown', onBottomMouseDown, { capture: true })
    rightEl?.addEventListener('mousedown', onRightMouseDown, { capture: true })
    return () => {
      bottomEl?.removeEventListener('mousedown', onBottomMouseDown, { capture: true })
      rightEl?.removeEventListener('mousedown', onRightMouseDown, { capture: true })
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [block.id, editor, props.height, props.width, localHeight, localWidthNum])

  const handleFileUpload = useCallback(async (file: File) => {
    const docT = detectDocType(file.name, file.type)
    const fileId = crypto.randomUUID()
    await saveAttachment(fileId, file)
    const url = `ameva-vfs://${fileId}`
    editor.updateBlock(block.id, {
      type: 'inlineDocument',
      props: { ...props, fileName: file.name, fileBase64: '', sourceUrl: url, docType: docT }
    })
  }, [block.id, editor, props])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFileUpload(file)
  }, [handleFileUpload])

  useEffect(() => {
    if (!hasFile && !hasUrl && props.sourceUrl === '') {
      const timer = setTimeout(() => { fileInputRef.current?.click() }, 100)
      return () => clearTimeout(timer)
    }
  }, [hasFile, hasUrl, props.sourceUrl])

  const handleUrlInput = useCallback(() => {
    const url = window.prompt('문서 URL을 입력하세요:')
    if (!url) return
    const docT = detectDocType(url)
    editor.updateBlock(block.id, {
      props: { ...props, sourceUrl: url, docType: docT, fileName: url.split('/').pop() || '문서' }
    })
  }, [block.id, editor, props])

  const containerStyle: React.CSSProperties = {
    position: 'relative',
    border: `1px solid ${isDragging ? config.color : 'rgba(255,255,255,0.1)'}`,
    borderRadius: 8,
    overflow: 'hidden',
    background: 'var(--bg-panel, #0f0f1a)',
    margin: '4px 0',
    transition: 'border-color 0.2s, width 0.05s',
    userSelect: 'none',
    width: localWidthNum ? `${localWidthNum}px` : '100%',
    maxWidth: '100%',
  }

  // 헤더 바
  const headerBar = (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8, padding: '6px 12px',
      background: `${config.color}18`,
      borderBottom: `1px solid ${config.color}33`,
      flexShrink: 0,
    }}>
      <span style={{ color: config.color }}>{config.icon}</span>
      <span style={{ fontSize: 12, fontWeight: 600, color: '#e2e8f0', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {props.fileName || `${config.label} 문서`}
      </span>
      <div style={{ display: 'flex', gap: 4 }}>
        {(hasFile || hasUrl) && (
          <button
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: 2 }}
            onClick={() => editor.updateBlock(block.id, { props: { ...props, isExpanded: isExpanded ? 'false' : 'true' } })}
            title={isExpanded ? '축소' : '확대'}
          >
            {isExpanded ? <Minimize2 size={12} /> : <Maximize2 size={12} />}
          </button>
        )}
        {hasUrl && (
          <button
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: 2 }}
            onClick={() => window.open(props.sourceUrl, '_blank')}
            title="새 탭에서 열기"
          >
            <ExternalLink size={12} />
          </button>
        )}
        <button
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: 2 }}
          onClick={() => editor.updateBlock(block.id, { props: { ...props, fileBase64: '', sourceUrl: '', fileName: '' } })}
          title="지우기"
        >
          <X size={12} />
        </button>
      </div>
    </div>
  )

  // 파일 없음: 업로드 영역
  if (!hasFile && !hasUrl) {
    return (
      <div
        style={{
          ...containerStyle,
          border: `2px dashed ${isDragging ? config.color : 'rgba(255,255,255,0.15)'}`,
          padding: 24,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12,
          cursor: 'pointer', minHeight: 120,
        }}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click() }}
      >
        <span style={{ color: config.color, opacity: 0.8 }}>
          {React.cloneElement(config.icon as React.ReactElement, { size: 32 })}
        </span>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#e2e8f0' }}>{config.label} 파일을 드래그하거나 클릭하여 업로드</div>
          <div style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>
            {docType === 'pdf' && 'PDF 파일 (.pdf)'}
            {docType === 'pptx' && 'PowerPoint (.pptx, .ppt)'}
            {docType === 'docx' && 'Word (.docx, .doc)'}
            {docType === 'xlsx' && 'Excel (.xlsx, .xls)'}
            {docType === 'unknown' && '모든 문서 형식'}
          </div>
        </div>
        <button
          style={{
            background: 'none', border: `1px solid rgba(255,255,255,0.15)`,
            color: '#94a3b8', fontSize: 11, cursor: 'pointer',
            borderRadius: 4, padding: '3px 10px',
          }}
          onClick={(e) => { e.stopPropagation(); handleUrlInput() }}
        >
          또는 URL 입력
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept={
            docType === 'pdf' ? '.pdf' :
            docType === 'pptx' ? '.pptx,.ppt' :
            docType === 'docx' ? '.docx,.doc' :
            docType === 'xlsx' ? '.xlsx,.xls' :
            '.pdf,.pptx,.ppt,.docx,.doc,.xlsx,.xls'
          }
          style={{ display: 'none' }}
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileUpload(f) }}
        />
      </div>
    )
  }

  const viewHeight = isExpanded ? Math.min(height * 1.6, 800) : height

  return (
    <div style={containerStyle}>
      {headerBar}
      {/* URL 기반 PDF: overflow visible + height 보장해야 브라우저 PDF 툴바가 보임 */}
      <div style={{ height: viewHeight, overflow: docType === 'pdf' && hasUrl ? 'hidden' : 'hidden', position: 'relative' }}>
        {/* PDF → Canvas 직접 렌더링 (로컬 파일) */}
        {docType === 'pdf' && hasFile && (
          <PdfMiniViewer sourceUrl={props.sourceUrl} height={viewHeight} />
        )}

        {/* PDF URL → iframe full viewer */}
        {docType === 'pdf' && hasUrl && (
          <iframe
            src={props.sourceUrl}
            style={{ width: '100%', height: '100%', border: 'none', display: 'block' }}
            title={props.fileName || 'PDF'}
            allowFullScreen
          />
        )}

        {/* Office 파일 (Word, Excel) → mammoth.js(docx) 또는 iframe (XLSX 안내문구) */}
        {docType !== 'pdf' && docType !== 'pptx' && hasFile && (
          <OfficeDocViewer
            sourceUrl={props.sourceUrl}
            fileBase64={props.fileBase64}
            docType={docType}
            fileName={props.fileName}
            height={viewHeight}
          />
        )}

        {/* PowerPoint 파일 → pptx-preview 렌더러 */}
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
      
      {/* 하단 리사이저 (크기 조절 핸들) — contentEditable=false 필수: BlockNote DOM 파서 충돌 방지 */}
      <div
        contentEditable={false}
        onMouseDown={handleResizeMouseDown}
        style={{
          width: '100%',
          height: '12px',
          background: 'transparent',
          cursor: 'ns-resize',
          position: 'absolute',
          bottom: 0,
          left: 0,
          zIndex: 10,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'flex-end',
          paddingBottom: '3px'
        }}
      >
        <div style={{ width: '48px', height: '4px', background: 'rgba(255,255,255,0.25)', borderRadius: '2px', transition: 'background 0.15s' }} />
      </div>
    </div>
  )
}

/** PPTX Viewer (pptx-preview 기반 렌더링) */
export function PptxMiniViewer({ sourceUrl, fileBase64, height }: { sourceUrl: string; fileBase64?: string; height: number }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)

    const loadPptx = async () => {
      try {
        let arrayBuffer: ArrayBuffer
        if (sourceUrl.startsWith('ameva-vfs://')) {
          const fileId = sourceUrl.replace('ameva-vfs://', '')
          const blob = await getAttachment(fileId)
          if (!blob) throw new Error('VFS_EXPIRED')
          arrayBuffer = await blob.arrayBuffer()
        } else if (sourceUrl.startsWith('blob:') || sourceUrl.startsWith('http')) {
          const res = await fetch(sourceUrl)
          arrayBuffer = await res.arrayBuffer()
        } else if (sourceUrl.startsWith('data:')) {
          const cleanBase64 = sourceUrl.split(',')[1] || ''
          const binaryString = atob(cleanBase64.replace(/\s/g, ''))
          const len = binaryString.length
          const bytes = new Uint8Array(len)
          for (let i = 0; i < len; i++) bytes[i] = binaryString.charCodeAt(i)
          arrayBuffer = bytes.buffer
        } else if (fileBase64) {
          const cleanBase64 = fileBase64.includes(',') ? fileBase64.split(',')[1] : fileBase64
          const binaryString = atob(cleanBase64.replace(/\s/g, ''))
          const len = binaryString.length
          const bytes = new Uint8Array(len)
          for (let i = 0; i < len; i++) bytes[i] = binaryString.charCodeAt(i)
          arrayBuffer = bytes.buffer
        } else {
          throw new Error('Local file only')
        }

        if (cancelled || !containerRef.current) return

        const pptxjs = await import('pptx-preview')
        const previewer = pptxjs.init(containerRef.current, {
          width: 800,
          height: 600,
          autoScale: true
        })
        
        await previewer.preview(arrayBuffer)
        setLoading(false)
      } catch (e: any) {
        if (!cancelled) {
          setError(e.message === 'VFS_EXPIRED' ? '임시 파일이 만료되었거나 로드에 실패했습니다.' : 'PPTX 로드 실패')
          setLoading(false)
        }
      }
    }

    if (sourceUrl) loadPptx()
    return () => { cancelled = true }
  }, [sourceUrl])

  return (
    <div style={{ position: 'relative', width: '100%', height, background: '#f8fafc', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {loading && <div style={{ color: '#94a3b8', fontSize: 13 }}>PowerPoint 로드 중...</div>}
      {error && <div style={{ color: '#ef4444', fontSize: 13 }}>{error}</div>}
      <div 
        ref={containerRef} 
        style={{ width: '100%', height: '100%', display: (loading || error) ? 'none' : 'block' }}
        onMouseMove={e => e.stopPropagation()}
        onMouseDown={e => e.stopPropagation()}
        onMouseUp={e => e.stopPropagation()}
      />
    </div>
  )
}

/** Office 문서 뷰어 (DOCX → mammoth.js HTML, XLSX → exceljs HTML) */
export function OfficeDocViewer({ sourceUrl, fileBase64, docType, fileName, height }: {
  sourceUrl: string; fileBase64?: string; docType: DocType; fileName: string; height: number
}) {
  const [htmlContent, setHtmlContent] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (docType !== 'docx' && docType !== 'xlsx') {
      setLoading(false)
      return
    }
    const loadDoc = async () => {
      try {
        let arrayBuffer: ArrayBuffer
        
        if (sourceUrl.startsWith('ameva-vfs://')) {
          const fileId = sourceUrl.replace('ameva-vfs://', '')
          const blob = await getAttachment(fileId)
          if (!blob) throw new Error('VFS_EXPIRED')
          arrayBuffer = await blob.arrayBuffer()
        } else if (sourceUrl.startsWith('blob:') || sourceUrl.startsWith('data:') || sourceUrl.startsWith('http')) {
          const res = await fetch(sourceUrl)
          arrayBuffer = await res.arrayBuffer()
        } else if (fileBase64) {
          const cleanBase64 = fileBase64.includes(',') ? fileBase64.split(',')[1] : fileBase64
          const binaryString = atob(cleanBase64.replace(/\s/g, ''))
          const len = binaryString.length
          const bytes = new Uint8Array(len)
          for (let i = 0; i < len; i++) bytes[i] = binaryString.charCodeAt(i)
          arrayBuffer = bytes.buffer
        } else {
          throw new Error('Local file only')
        }

        if (docType === 'docx') {
          const mammoth = await import('mammoth')
          const result = await mammoth.convertToHtml({ arrayBuffer })
          setHtmlContent(result.value)
        } else if (docType === 'xlsx') {
          const ExcelJS = await import('exceljs')
          const wb = new ExcelJS.Workbook()
          await wb.xlsx.load(arrayBuffer)
          let html = ''
          wb.eachSheet((worksheet) => {
            html += `<h3 style="margin-top: 1em; border-bottom: 1px solid #eee; padding-bottom: 8px;">${worksheet.name}</h3>`
            html += `<table style="width: 100%; border-collapse: collapse; margin-bottom: 1em;">`
            worksheet.eachRow((row) => {
              html += '<tr>'
              const cells = (row.values as any[]).slice(1)
              cells.forEach((v) => {
                html += `<td style="border: 1px solid #e2e8f0; padding: 6px 12px;">${v != null ? String(v) : ''}</td>`
              })
              html += '</tr>'
            })
            html += `</table>`
          })
          setHtmlContent(html || '<p style="color:#94a3b8">표 데이터가 없습니다.</p>')
        }
      } catch (e: any) {
        if (e.message === 'VFS_EXPIRED' || sourceUrl.startsWith('blob:')) {
          setHtmlContent('<p style="color:#f87171">임시 파일이 만료되었거나 문서 변환에 실패했습니다.<br/><br/>원격/가상 환경 데이터가 손실되었습니다. 문서를 다시 드래그하여 업로드해주세요.</p>')
        } else {
          setHtmlContent('<p style="color:#f87171">문서 변환 실패. 외부 URL 삽입 방식이 필요합니다.</p>')
        }
      } finally {
        setLoading(false)
      }
    }
    loadDoc()
  }, [sourceUrl, docType])

  if (docType === 'docx' || docType === 'xlsx') {
    if (loading) return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height, color: '#94a3b8', fontSize: 12 }}>
        문서 변환 중...
      </div>
    )
    return (
      <div
        contentEditable={false}
        ref={(el) => {
          if (el) {
            el.addEventListener('mousemove', e => e.stopPropagation())
            el.addEventListener('mousedown', e => e.stopPropagation())
            el.addEventListener('mouseup', e => e.stopPropagation())
          }
        }}
        style={{
          height, overflow: 'auto', padding: '16px 24px',
          background: '#fff', color: '#1a1a1a', fontSize: 13, lineHeight: 1.6,
        }}
        dangerouslySetInnerHTML={{ __html: htmlContent || '' }}
      />
    )
  }

  return <></>
}

/**
 * BlockNote 커스텀 블록 스펙 생성
 * 타입: 'inlineDocument'
 */
export const InlineDocumentBlockSpec = createReactBlockSpec(
  {
    type: 'inlineDocument' as const,
    propSchema: {
      fileName:    { default: '' },
      fileBase64:  { default: '' },
      docType:     { default: 'unknown' },
      height:      { default: '420' },
      width:       { default: '100%' },
      sourceUrl:   { default: '' },
      isExpanded:  { default: 'false' },
    },
    content: 'none',
  },
  {
    render: InlineDocumentBlockComponent,
    toExternalHTML: ({ block }) => {
      return (
        <a href={block.props.sourceUrl || '#'} data-content-type="inlineDocument">
          [AMEVA Document: {block.props.fileName || block.props.docType}]
        </a>
      )
    },
    parseHTML: [
      {
        tag: 'a',
        getAttrs: (element) => {
          if (typeof element === 'string') return false
          const text = element.textContent || ''
          if (!text.startsWith('[AMEVA Document:')) return false
          
          const href = element.getAttribute('href') || ''
          const fileName = text.replace('[AMEVA Document: ', '').replace(']', '').trim()
          
          let docType = 'unknown'
          if (fileName.toLowerCase().endsWith('.pdf')) docType = 'pdf'
          else if (fileName.toLowerCase().endsWith('.docx')) docType = 'docx'
          else if (fileName.toLowerCase().endsWith('.pptx')) docType = 'pptx'
          else if (fileName.toLowerCase().endsWith('.xlsx')) docType = 'xlsx'

          return {
            sourceUrl: href === '#' ? '' : href,
            fileName: fileName,
            docType: docType,
            isExpanded: 'false',
            height: '420',
            fileBase64: ''
          }
        }
      }
    ]
  }
)

export const InlineDocumentBlock = InlineDocumentBlockSpec()
