/**
 * ============================================================================
 * @file MediaTimeline.tsx
 * @description MediaTimeline.tsx 시스템 모듈 구성요소로, 관련 UI 렌더링 및 비즈니스 로직을 담당합니다.
 * @usage 문서 에디터 및 뷰어 내부에서 동적으로 호출되거나 유틸리티 함수로 사용됩니다.
 * @example
 * // 예시 로직 (자동 생성됨)
 * import { something } from './MediaTimeline';
 * 
 * @created 2026-08-11 08:57:45
 * @updated 2026-08-11 08:57:45
 * @author uno-km
 * @commit docs: 전체 소스코드 한글 주석 및 사내 컨벤션 일괄 적용
 * ============================================================================
 */

import React from 'react'
import { useMediaCutEditor } from './useMediaCutEditor'

export const MediaTimeline: React.FC = () => {
  const { state, addClip, removeClip } = useMediaCutEditor()

  return (
    <div style={{ padding: '16px', background: '#1e1e1e', color: 'white', borderRadius: '8px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
        <h3>Media Timeline</h3>
        <div>
          {state.gpuAvailable ? (
            <span style={{ color: '#10b981', fontWeight: 'bold' }}>🟢 GPU</span>
          ) : (
            <span style={{ color: '#ef4444', fontWeight: 'bold' }}>🔴 CPU</span>
          )}
        </div>
      </div>
      
      <div style={{ border: '1px solid #333', padding: '8px', minHeight: '100px' }}>
        {state.tracks.map(track => (
          <div key={track.id} style={{ display: 'flex', borderBottom: '1px solid #444', paddingBottom: '4px', marginBottom: '4px' }}>
            <div style={{ width: '80px', borderRight: '1px solid #555', paddingRight: '8px', marginRight: '8px' }}>
              {track.id}
            </div>
            <div style={{ flex: 1, position: 'relative', height: '40px', background: '#2a2a2a' }}>
              {track.clips.map(clip => (
                <div 
                  key={clip.id}
                  onClick={() => removeClip(clip.id)}
                  style={{
                    position: 'absolute',
                    left: `${clip.startTime * 10}px`,
                    width: `${(clip.endTime - clip.startTime) * 10}px`,
                    height: '100%',
                    background: clip.type === 'video' ? '#3b82f6' : '#8b5cf6',
                    borderRadius: '4px',
                    padding: '4px',
                    fontSize: '10px',
                    overflow: 'hidden',
                    whiteSpace: 'nowrap',
                    cursor: 'pointer'
                  }}
                  title="Click to remove"
                >
                  {clip.name}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      
      <button 
        onClick={() => addClip({
          id: `clip-${Date.now()}`,
          name: 'New Clip',
          src: '',
          type: 'video',
          duration: 10,
          startTime: 0,
          endTime: 10,
          trimStart: 0,
          trimEnd: 10
        })}
        style={{ marginTop: '12px', padding: '8px 16px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
      >
        Add Test Clip
      </button>
    </div>
  )
}
