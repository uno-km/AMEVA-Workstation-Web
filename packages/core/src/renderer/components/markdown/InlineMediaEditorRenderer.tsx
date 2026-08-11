import React from 'react'
import { MediaTimeline } from '../../features/media-editor/MediaTimeline'
import type { MediaTrack } from '../../features/media-editor/types'

export function InlineMediaEditorRenderer({ code }: { code: string }) {
  let data: any = null
  try {
    data = JSON.parse(code)
  } catch (err) {
    console.error('[InlineMediaEditorRenderer] JSON parse failed:', err)
    return <div style={{ color: 'var(--text-muted)', fontSize: '11px' }}>미디어 편집기 정보를 해석할 수 없습니다.</div>
  }

  const tracks: MediaTrack[] = typeof data.tracks === 'string' ? JSON.parse(data.tracks || '[]') : (data.tracks || [])
  const gpuMode = data.gpuMode || 'auto'

  const duration = tracks.reduce((max, track) => {
    const trackMax = track.clips.reduce((tMax, clip) => Math.max(tMax, clip.endTime), 0)
    return Math.max(max, trackMax)
  }, 100)

  return (
    <div style={{
      background: '#18181c',
      border: '1px solid var(--border-muted, #333)',
      borderRadius: '8px',
      padding: '16px',
      color: '#fff',
      fontFamily: 'sans-serif'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h3 style={{ margin: 0, fontSize: '16px' }}>🎬 미디어 컷 편집기 (Preview)</h3>
      </div>
      
      <MediaTimeline 
        tracks={tracks}
        currentTime={0}
        duration={duration}
        onSeek={() => {}}
        onClipSelect={() => {}}
      />
    </div>
  )
}
