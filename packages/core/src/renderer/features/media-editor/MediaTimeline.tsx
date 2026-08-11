import React from 'react'
import type { MediaTrack } from './types'

interface MediaTimelineProps {
  tracks: MediaTrack[]
  currentTime: number
  duration: number
  onSeek: (t: number) => void
  onClipSelect: (clipId: string) => void
}

export const MediaTimeline: React.FC<MediaTimelineProps> = ({ tracks, currentTime, duration, onSeek, onClipSelect }) => {
  return (
    <div style={{ padding: '16px', background: '#1e1e1e', color: 'white', borderRadius: '8px', position: 'relative' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
        <span style={{ fontSize: '12px' }}>0s</span>
        <span style={{ fontSize: '12px' }}>{duration}s</span>
      </div>
      
      <div 
        style={{ position: 'relative', border: '1px solid #333', padding: '8px', minHeight: '100px', cursor: 'pointer' }}
        onClick={(e) => {
          const rect = e.currentTarget.getBoundingClientRect()
          const x = e.clientX - rect.left
          const ratio = Math.max(0, Math.min(1, x / rect.width))
          onSeek(ratio * duration)
        }}
      >
        {tracks.map(track => (
          <div key={track.id} style={{ display: 'flex', borderBottom: '1px solid #444', paddingBottom: '4px', marginBottom: '4px' }}>
            <div style={{ width: '60px', borderRight: '1px solid #555', paddingRight: '8px', marginRight: '8px', fontSize: '12px' }}>
              {track.id}
            </div>
            <div style={{ flex: 1, position: 'relative', height: '40px', background: '#2a2a2a' }}>
              {track.clips.map(clip => {
                const leftPercent = (clip.startTime / duration) * 100
                const widthPercent = ((clip.endTime - clip.startTime) / duration) * 100
                return (
                  <div 
                    key={clip.id}
                    onClick={(e) => {
                      e.stopPropagation()
                      onClipSelect(clip.id)
                    }}
                    style={{
                      position: 'absolute',
                      left: `${leftPercent}%`,
                      width: `${widthPercent}%`,
                      height: '100%',
                      background: clip.type === 'video' ? '#3b82f6' : '#8b5cf6',
                      borderRadius: '4px',
                      padding: '4px',
                      fontSize: '10px',
                      overflow: 'hidden',
                      whiteSpace: 'nowrap',
                      border: '1px solid rgba(255,255,255,0.2)'
                    }}
                  >
                    {clip.name}
                  </div>
                )
              })}
            </div>
          </div>
        ))}

        {/* 재생 위치 표시선 */}
        <div style={{
          position: 'absolute',
          top: 0,
          bottom: 0,
          left: `${(currentTime / duration) * 100}%`,
          width: '2px',
          background: 'red',
          pointerEvents: 'none',
          zIndex: 10
        }} />
      </div>
    </div>
  )
}
