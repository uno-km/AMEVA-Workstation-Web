/**
 * @file AmevaAudioBlock.tsx
 * @location packages/core/src/renderer/components/media/AmevaAudioBlock.tsx
 * @description BlockNote 기본 audio 블록을 오버라이드하는 인라인 오디오 편집 블록
 *
 * [책임 범위]
 * - 평소에는 일반 오디오 플레이어로 동작
 * - 우상단 [✂️ 편집] 버튼으로 파형 + 컷편집 도구 인라인 확장
 * - Web Audio API 기반 오디오 파형 시각화
 * - 무음 구간 자동 탐지 및 일괄 삭제
 * - MediaRecorder 기반 오디오 내보내기 (webm/opus)
 *
 * [소비처]
 * - amevaBlockSchema.ts (customSpecs에 'audio' 키로 등록)
 */
import React, { useState, useRef, useEffect, useCallback } from 'react'
import { createReactBlockSpec } from '@blocknote/react'
import { useWaveformAnalyzer, type SilenceSegment, mergeCutRegions } from '../../features/media-editor/useWaveformAnalyzer'
import { saveAttachment, getAttachment } from '../../utils/vfsDatabase'

// ─── 오디오 파형 캔버스 ──────────────────────────────────────────────────────
interface AudioWaveformProps {
  waveformData: Float32Array
  duration: number
  currentTime: number
  cutRegions: { start: number; end: number }[]
  silenceSegments: SilenceSegment[]
  onSeek: (t: number) => void
}

function AudioWaveformCanvas({
  waveformData, duration, cutRegions, silenceSegments, onSeek, audioRef
}: AudioWaveformProps & { audioRef: React.RefObject<HTMLAudioElement> }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const HEIGHT = 80

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const W = canvas.clientWidth || 600
    const dpr = window.devicePixelRatio || 1
    canvas.width = W * dpr
    canvas.height = HEIGHT * dpr
    ctx.scale(dpr, dpr)

    let animationFrameId: number
    const renderPlayhead = () => {
      ctx.clearRect(0, 0, W, HEIGHT)
      
      const grad = ctx.createLinearGradient(0, 0, 0, HEIGHT)
      grad.addColorStop(0, '#0a0a14')
      grad.addColorStop(1, '#111122')
      ctx.fillStyle = grad
      ctx.fillRect(0, 0, W, HEIGHT)

      silenceSegments.forEach(seg => {
        const x1 = (seg.start / duration) * W
        const x2 = (seg.end / duration) * W
        ctx.fillStyle = 'rgba(239,68,68,0.25)'
        ctx.fillRect(x1, 0, x2 - x1, HEIGHT)
        ctx.strokeStyle = 'rgba(239,68,68,0.5)'
        ctx.lineWidth = 1
        for (let x = x1; x < x2; x += 6) {
          ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x + 6, HEIGHT); ctx.stroke()
        }
      })

      cutRegions.forEach(r => {
        const x1 = (r.start / duration) * W
        const x2 = (r.end / duration) * W
        ctx.fillStyle = 'rgba(20,20,20,0.8)'
        ctx.fillRect(x1, 0, x2 - x1, HEIGHT)
        ctx.strokeStyle = '#ef4444'
        ctx.lineWidth = 1.5
        ctx.setLineDash([4, 3])
        ctx.strokeRect(x1, 0, x2 - x1, HEIGHT)
        ctx.setLineDash([])
      })

      const barW = W / waveformData.length
      const midY = HEIGHT / 2
      for (let i = 0; i < waveformData.length; i++) {
        const barH = waveformData[i] * HEIGHT * 0.9
        const x = i * barW
        const waveGrad = ctx.createLinearGradient(0, midY - barH / 2, 0, midY + barH / 2)
        waveGrad.addColorStop(0, '#818cf8')
        waveGrad.addColorStop(0.5, '#4ade80')
        waveGrad.addColorStop(1, '#818cf8')
        ctx.fillStyle = waveGrad
        ctx.fillRect(x, midY - barH / 2, Math.max(barW - 0.5, 0.5), barH)
      }

      if (duration > 0 && audioRef.current) {
        const ct = audioRef.current.currentTime
        const px = (ct / duration) * W
        ctx.strokeStyle = '#f0f0ff'
        ctx.lineWidth = 1.5
        ctx.beginPath(); ctx.moveTo(px, 0); ctx.lineTo(px, HEIGHT); ctx.stroke()
        ctx.fillStyle = '#fff'
        ctx.beginPath(); ctx.arc(px, HEIGHT / 2, 4, 0, Math.PI * 2); ctx.fill()
      }

      if (duration > 0) {
        ctx.strokeStyle = 'rgba(255,255,255,0.06)'
        ctx.lineWidth = 1
        const step = 5
        for (let t = step; t < duration; t += step) {
          const x = (t / duration) * W
          ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, HEIGHT); ctx.stroke()
          ctx.fillStyle = 'rgba(255,255,255,0.3)'
          ctx.font = '9px monospace'
          ctx.fillText(`${t}s`, x + 2, HEIGHT - 4)
        }
      }

      animationFrameId = requestAnimationFrame(renderPlayhead)
    }

    renderPlayhead()

    return () => cancelAnimationFrame(animationFrameId)
  }, [waveformData, duration, cutRegions, silenceSegments, audioRef])

  const handleClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!duration) return
    const rect = (e.target as HTMLCanvasElement).getBoundingClientRect()
    onSeek(((e.clientX - rect.left) / rect.width) * duration)
  }, [duration, onSeek])

  return (
    <canvas
      ref={canvasRef}
      style={{ width: '100%', height: `${HEIGHT}px`, cursor: 'crosshair', display: 'block', borderRadius: '6px' }}
      onClick={handleClick}
    />
  )
}

// ─── 메인 블록 정의 ───────────────────────────────────────────────────────────
export const AmevaAudioBlockSpec = createReactBlockSpec(
  {
    type: 'audio',
    propSchema: {
      url: { default: '' },
      caption: { default: '' },
      showPreview: { default: 'true' },
      previewWidth: { default: '512' },
    },
    content: 'none',
  },
  {
    render: (props) => {
      const [isEditMode, setIsEditMode] = useState(false)
      const [currentTime, setCurrentTime] = useState(0)
      const [duration, setDuration] = useState(0)
      const [isPlaying, setIsPlaying] = useState(false)
      const [waveformData, setWaveformData] = useState<Float32Array>(new Float32Array(0))
      const [silenceSegments, setSilenceSegments] = useState<SilenceSegment[]>([])
      const [cutRegions, setCutRegions] = useState<{ start: number; end: number }[]>([])
      const [cutIn, setCutIn] = useState<number | null>(null)
      const [cutOut, setCutOut] = useState<number | null>(null)
      const [silenceThreshold, setSilenceThreshold] = useState(0.01)
      const [minSilenceDuration, setMinSilenceDuration] = useState(0.5)
      const [isExporting, setIsExporting] = useState(false)

      const audioRef = useRef<HTMLAudioElement>(null)
      const { analyzeMedia, isAnalyzing, progress: analyzeProgress } = useWaveformAnalyzer({
        silenceThreshold,
        minSilenceDuration,
      })

      const rawUrl = props.block.props.url
      const [src, setSrc] = useState<string>('')

      useEffect(() => {
        if (!rawUrl) {
          setSrc('')
          return
        }
        if (rawUrl.startsWith('ameva-vfs://')) {
          const fileId = rawUrl.replace('ameva-vfs://', '')
          getAttachment(fileId).then(blob => {
            if (blob) setSrc(URL.createObjectURL(blob))
          }).catch(err => console.error("Failed to load VFS blob:", err))
        } else {
          setSrc(rawUrl)
        }
      }, [rawUrl])

      useEffect(() => {
        const audio = audioRef.current
        if (!audio) return
        // const onTime = () => setCurrentTime(audio.currentTime)
        const onLoad = () => setDuration(audio.duration)
        const onEnd = () => setIsPlaying(false)
        // audio.addEventListener('timeupdate', onTime)
        audio.addEventListener('loadedmetadata', onLoad)
        audio.addEventListener('ended', onEnd)
        return () => {
          // audio.removeEventListener('timeupdate', onTime)
          audio.removeEventListener('loadedmetadata', onLoad)
          audio.removeEventListener('ended', onEnd)
        }
      }, [src])

      const togglePlay = () => {
        const a = audioRef.current
        if (!a) return
        if (isPlaying) a.pause()
        else a.play()
        setIsPlaying(!isPlaying)
      }

      const handleAnalyze = async () => {
        if (!src) return
        const result = await analyzeMedia(src)
        setWaveformData(result.waveformData)
        setSilenceSegments(result.silenceSegments)
        if (!duration) setDuration(result.duration)
      }

      const applyDetectedSilences = () => {
        setCutRegions(prev => mergeCutRegions([...prev, ...silenceSegments]))
      }

      const handleSetIn = () => setCutIn(audioRef.current ? audioRef.current.currentTime : null)
      const handleSetOut = () => setCutOut(audioRef.current ? audioRef.current.currentTime : null)
      const handleAddCut = () => {
        if (cutIn !== null && cutOut !== null && cutIn < cutOut) {
          setCutRegions(prev => mergeCutRegions([...prev, { start: cutIn, end: cutOut }]))
          setCutIn(null)
          setCutOut(null)
        } else {
          alert('시작점과 끝점을 올바르게 설정해주세요.')
        }
      }

      const removeCutRegion = (idx: number) => {
        setCutRegions(prev => prev.filter((_, i) => i !== idx))
      }

      const handleApplyAudio = async () => {
        if (!src) return
        setIsExporting(true)
        try {
          const response = await fetch(src)
          const arrayBuffer = await response.arrayBuffer()
          const audioCtx = new AudioContext()
          const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer)

          const { sampleRate, numberOfChannels, duration: dur } = audioBuffer

          // 컷 구간을 제외한 유효 구간 계산
          const sortedCuts = [...cutRegions].sort((a, b) => a.start - b.start)
          type Segment = { start: number; end: number }
          const validSegments: Segment[] = []
          let cursor = 0
          for (const cut of sortedCuts) {
            if (cursor < cut.start) validSegments.push({ start: cursor, end: cut.start })
            cursor = cut.end
          }
          if (cursor < dur) validSegments.push({ start: cursor, end: dur })

          const totalValidSamples = validSegments.reduce(
            (sum, s) => sum + Math.round((s.end - s.start) * sampleRate), 0
          )

          const offlineCtx = new OfflineAudioContext(numberOfChannels, totalValidSamples, sampleRate)
          let writeOffset = 0

          for (const seg of validSegments) {
            const startSample = Math.round(seg.start * sampleRate)
            const endSample = Math.round(seg.end * sampleRate)
            const segLength = endSample - startSample
            const segBuffer = offlineCtx.createBuffer(numberOfChannels, segLength, sampleRate)

            for (let ch = 0; ch < numberOfChannels; ch++) {
              const srcData = audioBuffer.getChannelData(ch).slice(startSample, endSample)
              segBuffer.copyToChannel(srcData, ch)
            }

            const source = offlineCtx.createBufferSource()
            source.buffer = segBuffer
            source.connect(offlineCtx.destination)
            source.start(writeOffset / sampleRate)
            writeOffset += segLength
          }

          const renderedBuffer = await offlineCtx.startRendering()
          await audioCtx.close()

          // WAV 변환 및 적용
          const wavBlob = audioBufferToWav(renderedBuffer)
          const fileId = `media-export-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
          await saveAttachment(fileId, wavBlob)
          const url = `ameva-vfs://${fileId}`
          
          props.editor.updateBlock(props.block.id, {
            type: 'audio',
            props: { ...props.block.props, url }
          } as any)
          
          setIsEditMode(false)
        } finally {
          setIsExporting(false)
        }
      }

      const formatTime = (t: number) => {
        const m = Math.floor(t / 60).toString().padStart(2, '0')
        const s = (t % 60).toFixed(1).padStart(4, '0')
        return `${m}:${s}`
      }

      if (!src) {
        return (
          <div 
            style={{
              border: '2px dashed #3a3a4a', borderRadius: '10px', padding: '30px',
              textAlign: 'center', color: '#888', background: '#0d0d1a', cursor: 'pointer'
            }}
            onClick={() => document.getElementById(`audio-upload-${props.block.id}`)?.click()}
          >
            <div style={{ fontSize: '32px', marginBottom: '8px' }}>🎵</div>
            <div style={{ fontSize: '13px', fontWeight: 600, color: '#e2e8f0', marginBottom: '6px' }}>클릭하여 오디오 파일 업로드</div>
            <div style={{ fontSize: '11px' }}>또는 오디오 파일을 이곳으로 드래그하세요</div>
            <input
              id={`audio-upload-${props.block.id}`}
              type="file"
              accept="audio/*,.mp3,.wav,.ogg,.flac,.m4a,.wma,.aac"
              style={{ display: 'none' }}
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) {
                  const fileId = `media-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
                  saveAttachment(fileId, file).then(() => {
                    const url = `ameva-vfs://${fileId}`
                    props.editor.updateBlock(props.block.id, {
                      type: 'audio',
                      props: { ...props.block.props, url }
                    } as any)
                  })
                }
              }}
            />
          </div>
        )
      }

      return (
        <div style={{
          background: '#0d0d1a',
          border: '1px solid #1e1e3a',
          borderRadius: '10px',
          overflow: 'hidden',
          color: '#fff',
          fontFamily: 'Pretendard, sans-serif',
        }}>
          {/* ─── 오디오 엘리먼트 (숨김) ──────────────────────────── */}
          <audio ref={audioRef} src={src} style={{ display: 'none' }} />

          {/* ─── 헤더 바 ─────────────────────────────────────────── */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            padding: '10px 14px', background: 'rgba(129,140,248,0.08)',
            borderBottom: '1px solid #1e1e3a',
          }}>
            <div style={{
              width: '36px', height: '36px', borderRadius: '50%',
              background: 'linear-gradient(135deg, #7c3aed, #818cf8)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px',
            }}>🎵</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '13px', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {src.split('/').pop() || '오디오 파일'}
              </div>
              {props.block.props.caption && (
                <div style={{ fontSize: '11px', color: '#888' }}>{props.block.props.caption}</div>
              )}
            </div>
            <button
              onClick={() => setIsEditMode(m => !m)}
              style={{
                background: isEditMode ? '#dc2626' : 'rgba(124,58,237,0.3)',
                border: '1px solid rgba(129,140,248,0.3)',
                color: '#fff', borderRadius: '6px', padding: '5px 12px', fontSize: '12px', cursor: 'pointer',
              }}
            >
              {isEditMode ? '✕ 닫기' : '✂️ 편집'}
            </button>
          </div>

          {/* ─── 기본 플레이어 컨트롤 ────────────────────────────── */}
          <div style={{ padding: '10px 14px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              onClick={togglePlay}
              style={{
                background: 'linear-gradient(135deg, #7c3aed, #818cf8)',
                border: 'none', color: '#fff', borderRadius: '50%',
                width: '36px', height: '36px', cursor: 'pointer', fontSize: '14px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              {isPlaying ? '⏸' : '▶'}
            </button>
            {/* 진행바 */}
            <div
              style={{ flex: 1, height: '4px', background: '#2a2a4a', borderRadius: '2px', cursor: 'pointer', position: 'relative' }}
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect()
                const t = ((e.clientX - rect.left) / rect.width) * duration
                if (audioRef.current) audioRef.current.currentTime = t
                setCurrentTime(t)
              }}
            >
              <div style={{
                height: '100%', borderRadius: '2px',
                background: 'linear-gradient(90deg, #7c3aed, #818cf8)',
                width: duration > 0 ? `${(currentTime / duration) * 100}%` : '0%',
                transition: 'width 0.05s',
              }} />
            </div>
            <span style={{ fontSize: '11px', color: '#aaa', whiteSpace: 'nowrap' }}>
              {formatTime(audioRef.current ? audioRef.current.currentTime : 0)} / {formatTime(duration)}
            </span>
          </div>

          {/* ─── 편집 패널 ───────────────────────────────────────── */}
          {isEditMode && (
            <div style={{ padding: '0 14px 14px' }}>
              {/* 파형 분석 컨트롤 */}
              <div style={{
                background: '#12122a', borderRadius: '8px', padding: '10px',
                marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap',
              }}>
                <span style={{ fontSize: '11px', color: '#818cf8', fontWeight: 600 }}>🔊 무음 탐지</span>
                <label style={{ fontSize: '11px', color: '#aaa', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  임계값
                  <input
                    type="range" min="0.001" max="0.1" step="0.001"
                    value={silenceThreshold}
                    onChange={e => setSilenceThreshold(parseFloat(e.target.value))}
                    style={{ width: '60px', accentColor: '#7c3aed' }}
                  />
                  <span style={{ color: '#c4c4ff', fontSize: '10px' }}>
                    {(20 * Math.log10(silenceThreshold)).toFixed(0)}dB
                  </span>
                </label>
                <label style={{ fontSize: '11px', color: '#aaa', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  최소 구간
                  <input
                    type="range" min="0.1" max="3" step="0.1"
                    value={minSilenceDuration}
                    onChange={e => setMinSilenceDuration(parseFloat(e.target.value))}
                    style={{ width: '60px', accentColor: '#7c3aed' }}
                  />
                  <span style={{ color: '#c4c4ff', fontSize: '10px' }}>{minSilenceDuration}s</span>
                </label>
                <button
                  onClick={handleAnalyze}
                  disabled={isAnalyzing}
                  style={{
                    background: isAnalyzing ? '#374151' : '#7c3aed',
                    border: 'none', color: '#fff', borderRadius: '5px',
                    padding: '5px 12px', cursor: 'pointer', fontSize: '11px',
                  }}
                >
                  {isAnalyzing ? `분석 중 ${analyzeProgress}%...` : '🔍 파형 분석'}
                </button>
                {silenceSegments.length > 0 && (
                  <button
                    onClick={applyDetectedSilences}
                    style={{
                      background: '#dc2626', border: 'none', color: '#fff',
                      borderRadius: '5px', padding: '5px 12px', cursor: 'pointer', fontSize: '11px',
                    }}
                  >
                    ✂️ 무음 {silenceSegments.length}개 삭제
                  </button>
                )}
                <div style={{ display: 'flex', gap: '4px', alignItems: 'center', marginLeft: '10px' }}>
                  <button
                    onClick={handleSetIn}
                    style={{ background: '#4b5563', border: 'none', color: '#fff', borderRadius: '5px', padding: '5px 8px', cursor: 'pointer', fontSize: '11px' }}
                  >
                    [ In
                  </button>
                  <button
                    onClick={handleSetOut}
                    style={{ background: '#4b5563', border: 'none', color: '#fff', borderRadius: '5px', padding: '5px 8px', cursor: 'pointer', fontSize: '11px' }}
                  >
                    Out ]
                  </button>
                  <button
                    onClick={handleAddCut}
                    disabled={cutIn === null || cutOut === null}
                    style={{ 
                      background: (cutIn !== null && cutOut !== null) ? '#dc2626' : '#374151', 
                      border: 'none', color: '#fff', borderRadius: '5px', padding: '5px 10px', cursor: 'pointer', fontSize: '11px',
                      opacity: (cutIn !== null && cutOut !== null) ? 1 : 0.5
                    }}
                  >
                    ✂️ 구간 자르기
                  </button>
                  {(cutIn !== null || cutOut !== null) && (
                    <span style={{ fontSize: '10px', color: '#fca5a5', marginLeft: '4px' }}>
                      {cutIn !== null ? formatTime(cutIn) : '--:--'} ~ {cutOut !== null ? formatTime(cutOut) : '--:--'}
                    </span>
                  )}
                </div>
                <div style={{ flex: 1 }} />
                <button
                  onClick={handleApplyAudio}
                  disabled={isExporting || cutRegions.length === 0}
                  style={{
                    background: isExporting ? '#374151' : '#059669',
                    border: 'none', color: '#fff', borderRadius: '5px',
                    padding: '5px 12px', cursor: 'pointer', fontSize: '11px',
                    opacity: cutRegions.length === 0 ? 0.5 : 1,
                  }}
                >
                  {isExporting ? '⏳ 처리 중...' : '💾 적용하기'}
                </button>
              </div>

              {/* 파형 캔버스 */}
              {waveformData.length > 0 ? (
                  <AudioWaveformCanvas
                    waveformData={waveformData}
                    duration={duration}
                    currentTime={currentTime}
                    cutRegions={cutRegions}
                    silenceSegments={silenceSegments}
                    onSeek={(t) => {
                      if (audioRef.current) audioRef.current.currentTime = t
                    }}
                    audioRef={audioRef}
                  />
              ) : (
                <div style={{
                  height: '80px', background: '#0a0a14', borderRadius: '6px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#555', fontSize: '12px',
                }}>
                  파형 분석 버튼을 눌러 파형을 시각화하세요
                </div>
              )}

              {/* 컷 목록 */}
              {cutRegions.length > 0 && (
                <div style={{ marginTop: '8px', fontSize: '11px', color: '#aaa', display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {cutRegions.map((r, i) => (
                    <span key={i} style={{
                      background: 'rgba(220,38,38,0.2)', border: '1px solid #dc2626',
                      borderRadius: '4px', padding: '3px 8px', display: 'flex', gap: '6px',
                    }}>
                      ✂️ {formatTime(r.start)}~{formatTime(r.end)}
                      <button
                        onClick={() => setCutRegions(prev => prev.filter((_, j) => j !== i))}
                        style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: 0, fontSize: '10px' }}
                      >
                        ✕
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )
    }
  }
)

export const AmevaAudioBlock = AmevaAudioBlockSpec()


// ─── WAV 인코더 유틸리티 ─────────────────────────────────────────────────────
function audioBufferToWav(buffer: AudioBuffer): Blob {
  const numberOfChannels = buffer.numberOfChannels
  const sampleRate = buffer.sampleRate
  const format = 1 // PCM
  const bitDepth = 16
  const bytesPerSample = bitDepth / 8
  const blockAlign = numberOfChannels * bytesPerSample
  const byteRate = sampleRate * blockAlign
  const dataSize = buffer.length * blockAlign
  const headerSize = 44
  const totalSize = headerSize + dataSize

  const arrayBuffer = new ArrayBuffer(totalSize)
  const view = new DataView(arrayBuffer)

  const writeStr = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i))
  }

  writeStr(0, 'RIFF')
  view.setUint32(4, totalSize - 8, true)
  writeStr(8, 'WAVE')
  writeStr(12, 'fmt ')
  view.setUint32(16, 16, true)
  view.setUint16(20, format, true)
  view.setUint16(22, numberOfChannels, true)
  view.setUint32(24, sampleRate, true)
  view.setUint32(28, byteRate, true)
  view.setUint16(32, blockAlign, true)
  view.setUint16(34, bitDepth, true)
  writeStr(36, 'data')
  view.setUint32(40, dataSize, true)

  let offset = 44
  for (let i = 0; i < buffer.length; i++) {
    for (let ch = 0; ch < numberOfChannels; ch++) {
      const sample = Math.max(-1, Math.min(1, buffer.getChannelData(ch)[i]))
      view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true)
      offset += 2
    }
  }

  return new Blob([arrayBuffer], { type: 'audio/wav' })
}
