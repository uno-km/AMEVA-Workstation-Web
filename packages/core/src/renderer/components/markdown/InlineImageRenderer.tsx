import React, { useState, useRef } from 'react'

export function InlineImageRenderer({ code }: { code: string }) {
  let data: any = {}
  try {
    data = JSON.parse(code || '{}')
  } catch {
    data = { url: code }
  }

  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null)
  const [fileName, setFileName] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const activeUrl = uploadedUrl || data.url

  const handleFileUpload = (file: File) => {
    const objUrl = URL.createObjectURL(file)
    setUploadedUrl(objUrl)
    setFileName(file.name)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) handleFileUpload(file)
  }

  if (!activeUrl) {
    return (
      <div
        onClick={() => fileInputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        style={{
          border: `2px dashed ${isDragging ? '#10b981' : '#3a3a4a'}`,
          borderRadius: '10px',
          padding: '28px 20px',
          textAlign: 'center',
          color: '#94a3b8',
          background: isDragging ? 'rgba(16, 185, 129, 0.08)' : '#0f0f16',
          cursor: 'pointer',
          margin: '14px 0',
          transition: 'all 0.2s ease',
          userSelect: 'none'
        }}
      >
        <div style={{ fontSize: '32px', marginBottom: '8px' }}>🖼️</div>
        <div style={{ fontSize: '14px', fontWeight: 700, color: '#e2e8f0', marginBottom: '6px' }}>
          이미지 파일을 드래그하거나 클릭하여 업로드
        </div>
        <div style={{ fontSize: '11.5px', color: '#64748b' }}>
          PNG, JPG, SVG, WebP, GIF 지원
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileUpload(f) }}
        />
      </div>
    )
  }

  return (
    <div style={{
      margin: '14px 0',
      borderRadius: '10px',
      overflow: 'hidden',
      border: '1px solid rgba(255,255,255,0.08)',
      background: '#090d16',
      boxShadow: '0 4px 16px rgba(0,0,0,0.3)'
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '6px 12px',
        background: 'rgba(255,255,255,0.03)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        fontSize: '11px',
        color: '#94a3b8'
      }}>
        <span>🖼️ {fileName || data.caption || '이미지'}</span>
        <button
          onClick={() => { setUploadedUrl(null); setFileName(null) }}
          style={{
            background: 'none', border: 'none', color: '#34d399', cursor: 'pointer', fontSize: '11px', fontWeight: 600
          }}
        >
          다른 파일 선택
        </button>
      </div>
      <div style={{ padding: '8px', display: 'flex', justifyContent: 'center', background: '#05070e' }}>
        <img
          src={activeUrl}
          alt={data.caption || '업로드 이미지'}
          style={{ maxWidth: '100%', maxHeight: '480px', borderRadius: '6px', objectFit: 'contain' }}
        />
      </div>
    </div>
  )
}
