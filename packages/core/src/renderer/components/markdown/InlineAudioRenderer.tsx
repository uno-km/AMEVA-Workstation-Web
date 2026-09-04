import React, { useState, useRef } from 'react'

export function InlineAudioRenderer({ code }: { code: string }) {
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
          border: `2px dashed ${isDragging ? '#a855f7' : '#3a3a4a'}`,
          borderRadius: '10px',
          padding: '28px 20px',
          textAlign: 'center',
          color: '#94a3b8',
          background: isDragging ? 'rgba(168, 85, 247, 0.08)' : '#0f0f16',
          cursor: 'pointer',
          margin: '14px 0',
          transition: 'all 0.2s ease',
          userSelect: 'none'
        }}
      >
        <div style={{ fontSize: '32px', marginBottom: '8px' }}>🎵</div>
        <div style={{ fontSize: '14px', fontWeight: 700, color: '#e2e8f0', marginBottom: '6px' }}>
          오디오 파일을 드래그하거나 클릭하여 업로드
        </div>
        <div style={{ fontSize: '11.5px', color: '#64748b' }}>
          MP3, WAV, OGG, FLAC, M4A 지원 • 인앱 즉시 재생
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="audio/*,.mp3,.wav,.ogg,.flac,.m4a"
          style={{ display: 'none' }}
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileUpload(f) }}
        />
      </div>
    )
  }

  return (
    <div style={{
      margin: '14px 0',
      background: '#0a0d18',
      border: '1px solid rgba(168, 85, 247, 0.3)',
      borderRadius: '10px',
      padding: '12px 16px',
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
      boxShadow: '0 4px 16px rgba(0,0,0,0.3)'
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        fontSize: '11px',
        color: '#94a3b8'
      }}>
        <span>🎵 {fileName || data.caption || '인앱 오디오 플레이어'}</span>
        <button
          onClick={() => { setUploadedUrl(null); setFileName(null) }}
          style={{
            background: 'none', border: 'none', color: '#c084fc', cursor: 'pointer', fontSize: '11px', fontWeight: 600
          }}
        >
          다른 파일 선택
        </button>
      </div>
      <audio
        src={activeUrl}
        controls
        style={{ width: '100%', outline: 'none' }}
      />
    </div>
  )
}
