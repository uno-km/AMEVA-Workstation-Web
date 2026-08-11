/**
 * ============================================================================
 * @file MediaCutEditorBlock.tsx
 * @description 미디어 컷 편집기 블록
 * @usage 문서 에디터 및 뷰어 내부에서 동적으로 호출되거나 유틸리티 함수로 사용됩니다.
 * // Force Vite HMR reload
 * ============================================================================
 */
import React, { useState, useEffect, useRef } from 'react'
import { createReactBlockSpec } from '@blocknote/react'

type MediaClip = {
  id: string
  name: string
  src: string
  type: 'video' | 'audio'
  startTime: number
  endTime: number
  trimStart: number
  trimEnd: number
}

export const MediaCutEditorBlock = createReactBlockSpec(
  {
    type: 'media-editor',
    propSchema: {
      clips: { default: '[]' },
      gpuMode: { default: 'auto' }
    },
    content: 'none'
  },
  {
    render: (props) => {
      const [gpuAvailable, setGpuAvailable] = useState<boolean>(false)
      const [currentTime, setCurrentTime] = useState(0)
      const [isPlaying, setIsPlaying] = useState(false)
      const mediaRef = useRef<HTMLVideoElement & HTMLAudioElement>(null)
      
      const clips: MediaClip[] = (() => {
        try {
          return JSON.parse(props.block.props.clips)
        } catch {
          return []
        }
      })()

      useEffect(() => {
        setGpuAvailable('gpu' in navigator)
      }, [])

      const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return
        const url = URL.createObjectURL(file)
        const type = file.type.startsWith('video/') ? 'video' : 'audio'
        
        const newClip: MediaClip = {
          id: `clip-${Date.now()}`,
          name: file.name,
          src: url,
          type,
          startTime: 0,
          endTime: 10, // 임시
          trimStart: 0,
          trimEnd: 10
        }

        const newClips = [...clips, newClip]
        
        props.editor.updateBlock(props.block, {
          type: 'media-editor',
          props: {
            ...props.block.props,
            clips: JSON.stringify(newClips)
          }
        })
      }

      const handleCut = () => {
        // 현재 시간 기준 클립 분할하여 시간 trim (간단한 구현)
        const newClips = [...clips]
        const targetIndex = newClips.findIndex(c => currentTime >= c.startTime && currentTime <= c.endTime)
        if (targetIndex !== -1) {
          const target = newClips[targetIndex]
          const part1 = { ...target, id: `clip-${Date.now()}-1`, endTime: currentTime, trimEnd: currentTime }
          const part2 = { ...target, id: `clip-${Date.now()}-2`, startTime: currentTime, trimStart: currentTime }
          newClips.splice(targetIndex, 1, part1, part2)
          props.editor.updateBlock(props.block, {
            type: 'media-editor',
            props: { ...props.block.props, clips: JSON.stringify(newClips) }
          })
        }
      }

      const togglePlay = () => {
        if (!mediaRef.current) return
        if (isPlaying) {
          mediaRef.current.pause()
        } else {
          mediaRef.current.play()
        }
        setIsPlaying(!isPlaying)
      }

      useEffect(() => {
        if (!mediaRef.current) return
        const onTimeUpdate = () => {
          setCurrentTime(mediaRef.current?.currentTime || 0)
        }
        mediaRef.current.addEventListener('timeupdate', onTimeUpdate)
        return () => mediaRef.current?.removeEventListener('timeupdate', onTimeUpdate)
      }, [])

      const activeClip = clips.find(c => currentTime >= c.startTime && currentTime <= c.endTime) || clips[0]

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
            <h3 style={{ margin: 0, fontSize: '16px' }}>🎬 미디어 컷 편집기</h3>
            <div>
              {gpuAvailable ? (
                <span style={{ fontSize: '12px', background: 'rgba(16, 185, 129, 0.2)', color: '#10b981', padding: '4px 8px', borderRadius: '4px' }}>🟢 WebGPU</span>
              ) : (
                <span style={{ fontSize: '12px', background: 'rgba(239, 68, 68, 0.2)', color: '#ef4444', padding: '4px 8px', borderRadius: '4px' }}>🟡 CPU only</span>
              )}
            </div>
          </div>
          
          <div style={{ marginBottom: '16px' }}>
            <input type="file" accept="video/*,audio/*" onChange={handleFileUpload} />
          </div>

          <div style={{ marginBottom: '16px', background: '#000', padding: '8px', borderRadius: '4px', textAlign: 'center' }}>
            {activeClip && activeClip.type === 'video' && (
              <video ref={mediaRef as any} src={activeClip.src} style={{ maxHeight: '300px', maxWidth: '100%' }} />
            )}
            {activeClip && activeClip.type === 'audio' && (
              <audio ref={mediaRef as any} src={activeClip.src} />
            )}
          </div>
          
          <div style={{ marginBottom: '16px', display: 'flex', gap: '4px', overflowX: 'auto', padding: '8px', background: '#222', borderRadius: '4px' }}>
            {clips.map((clip, i) => (
              <div key={clip.id} style={{ 
                minWidth: '100px', 
                height: '40px', 
                background: i % 2 === 0 ? '#3b82f6' : '#8b5cf6', 
                borderRadius: '4px', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                fontSize: '12px'
              }}>
                {clip.name}
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button onClick={togglePlay} style={{ padding: '6px 12px', cursor: 'pointer', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '4px' }}>
              {isPlaying ? '⏸ 일시정지' : '▶️ 재생'}
            </button>
            <button onClick={handleCut} style={{ padding: '6px 12px', cursor: 'pointer', background: '#4b5563', color: '#fff', border: 'none', borderRadius: '4px' }}>
              ✂️ 컷
            </button>
            <span style={{ fontSize: '12px', color: '#aaa' }}>{currentTime.toFixed(2)}s</span>
          </div>
        </div>
      )
    }
  }
)
