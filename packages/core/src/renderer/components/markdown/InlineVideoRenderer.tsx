import React, { useState, useRef } from 'react'

export function InlineVideoRenderer({ code }: { code: string }) {
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
          border: `2px dashed ${isDragging ? '#3b82f6' : '#3a3a4a'}`,
          borderRadius: '10px',
          padding: '36px 20px',
          textAlign: 'center',
          color: '#94a3b8',
          background: isDragging ? 'rgba(59, 130, 246, 0.08)' : '#0f0f16',
          cursor: 'pointer',
          margin: '14px 0',
          transition: 'all 0.2s ease',
          userSelect: 'none'
        }}
      >
        <div style={{ fontSize: '36px', marginBottom: '10px' }}>🎬</div>
        <div style={{ fontSize: '14px', fontWeight: 700, color: '#e2e8f0', marginBottom: '6px' }}>
          비디오 파일을 드래그하거나 클릭하여 업로드
        </div>
        <div style={{ fontSize: '11.5px', color: '#64748b' }}>
          MP4, WebM, MOV, MKV 파일 지원 • 브라우저 로컬 즉시 재생
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="video/*,.mp4,.webm,.mov,.mkv"
          style={{ display: 'none' }}
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileUpload(f) }}
        />
      </div>
    )
  }

  return (
    <div style={{
      margin: '14px 0',
      background: '#090d16',
      border: '1px solid rgba(255,255,255,0.1)',
      borderRadius: '10px',
      overflow: 'hidden',
      boxShadow: '0 8px 24px rgba(0,0,0,0.4)'
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '8px 14px',
        background: 'rgba(255,255,255,0.03)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        fontSize: '11px',
        color: '#94a3b8'
      }}>
        <span>🎬 {fileName || data.caption || '인라인 비디오 플레이어'}</span>
        <button
          onClick={() => { setUploadedUrl(null); setFileName(null) }}
          style={{
            background: 'none', border: 'none', color: '#60a5fa', cursor: 'pointer', fontSize: '11px', fontWeight: 600
          }}
        >
          다른 파일 선택
        </button>
      </div>
      <div style={{ background: '#000', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <video
          src={activeUrl}
          controls
          style={{ width: '100%', maxHeight: '420px', display: 'block' }}
        />
      </div>
    </div>
  )
}
