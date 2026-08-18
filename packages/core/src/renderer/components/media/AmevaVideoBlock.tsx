/**
 * @file AmevaVideoBlock.tsx
 * @location packages/core/src/renderer/components/media/AmevaVideoBlock.tsx
 * @description BlockNote 기본 video 블록을 오버라이드하는 인라인 비디오 편집 블록
 *
 * [책임 범위]
 * - 평소에는 일반 비디오 플레이어로 동작
 * - 우상단 [✂️ 편집] 버튼 클릭 시 타임라인 + 컷편집 도구 인라인 확장
 * - Web Audio API 파형 렌더링
 * - 무음 구간 탐지 및 일괄 삭제 기능
 * - WebCodecs/MediaRecorder 기반 최종 내보내기
 *
 * [소비처]
 * - amevaBlockSchema.ts (customSpecs에 'video' 키로 등록)
 */
import React, { useState, useRef, useEffect, useCallback } from 'react'
import { createReactBlockSpec } from '@blocknote/react'
import { useWaveformAnalyzer, type SilenceSegment, mergeCutRegions } from '../../features/media-editor/useWaveformAnalyzer'
import { saveAttachment, getAttachment } from '../../utils/vfsDatabase'
import { ResizableBlockContainer } from '../ResizableBlockContainer'

// ─── 내부 컴포넌트: 파형 캔버스 렌더러 ──────────────────────────────────────
interface WaveformCanvasProps {
  waveformData: Float32Array
  duration: number
  currentTime: number
  cutRegions: { start: number; end: number }[]
  silenceSegments: SilenceSegment[]
  onSeek: (t: number) => void
  width?: number
  height?: number
}

function WaveformCanvas({
  waveformData,
  duration,
  cutRegions,
  silenceSegments,
  onSeek,
  width = 800,
  height = 60,
  videoRef,
}: WaveformCanvasProps & { videoRef: React.RefObject<HTMLVideoElement> }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    canvas.width = width * dpr
    canvas.height = height * dpr
    ctx.scale(dpr, dpr)
    // 재생 헤드를 requestAnimationFrame으로 직접 렌더링
    let animationFrameId: number
    const renderPlayhead = () => {
      // 파형과 컷 영역을 매번 다시 그릴 필요 없이, 캔버스를 저장/복원하거나 지우고 전부 다시 그려야 함
      // 여기서는 캔버스 상태를 관리하기 위해 매 프레임마다 파형도 다시 그림
      ctx.clearRect(0, 0, width, height)
      ctx.fillStyle = '#111'
      ctx.fillRect(0, 0, width, height)

      silenceSegments.forEach(seg => {
        const x1 = (seg.start / duration) * width
        const x2 = (seg.end / duration) * width
        ctx.fillStyle = 'rgba(239,68,68,0.3)'
        ctx.fillRect(x1, 0, x2 - x1, height)
        ctx.strokeStyle = 'rgba(239,68,68,0.5)'
        ctx.lineWidth = 1
        for (let x = x1; x < x2; x += 8) {
          ctx.beginPath()
          ctx.moveTo(x, 0)
          ctx.lineTo(x + 8, height)
          ctx.stroke()
        }
      })

      cutRegions.forEach(r => {
        const x1 = (r.start / duration) * width
        const x2 = (r.end / duration) * width
        ctx.fillStyle = 'rgba(30,30,30,0.85)'
        ctx.fillRect(x1, 0, x2 - x1, height)
        ctx.strokeStyle = '#ef4444'
        ctx.lineWidth = 1.5
        ctx.setLineDash([4, 4])
        ctx.strokeRect(x1, 0, x2 - x1, height)
        ctx.setLineDash([])
      })

      const barWidth = width / waveformData.length
      const midY = height / 2
      ctx.fillStyle = '#4ade80'
      for (let i = 0; i < waveformData.length; i++) {
        const barH = waveformData[i] * height
        ctx.fillRect(i * barWidth, midY - barH / 2, Math.max(barWidth - 0.5, 0.5), barH)
      }

      if (duration > 0 && videoRef.current) {
        const ct = videoRef.current.currentTime
        const playX = (ct / duration) * width
        ctx.strokeStyle = '#fff'
        ctx.lineWidth = 1.5
        ctx.beginPath()
        ctx.moveTo(playX, 0)
        ctx.lineTo(playX, height)
        ctx.stroke()
      }

      animationFrameId = requestAnimationFrame(renderPlayhead)
    }

    renderPlayhead()

    return () => cancelAnimationFrame(animationFrameId)
  }, [waveformData, duration, cutRegions, silenceSegments, width, height, videoRef])

  const handleClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!duration) return
    const rect = (e.target as HTMLCanvasElement).getBoundingClientRect()
    const x = e.clientX - rect.left
    onSeek((x / rect.width) * duration)
  }, [duration, onSeek])

  return (
    <canvas
      ref={canvasRef}
      style={{ width: '100%', height: `${height}px`, cursor: 'crosshair', display: 'block' }}
      onClick={handleClick}
    />
  )
}

// ─── 메인 블록 정의 ───────────────────────────────────────────────────────────
export const AmevaVideoBlockSpec = createReactBlockSpec(
  {
    type: 'video',
    propSchema: {
      url: { default: '' },
      caption: { default: '' },
      showPreview: { default: 'true' },
      previewWidth: { default: '512' },
      width: { default: '100%' },
      height: { default: '400' },
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
      const [exportProgress, setExportProgress] = useState(0)

      const videoRef = useRef<HTMLVideoElement>(null)
      const containerRef = useRef<HTMLDivElement>(null)

      const { analyzeMedia, isAnalyzing, progress: analyzeProgress } = useWaveformAnalyzer({
        silenceThreshold,
        minSilenceDuration,
      })

      const rawUrl = props.block.props.url
      const [src, setSrc] = useState<string>('')

      useEffect(() => {
        let active = true
        let objectUrl: string | null = null

        if (!rawUrl) {
          setSrc('')
          return
        }
        if (rawUrl.startsWith('ameva-vfs://')) {
          const fileId = rawUrl.replace('ameva-vfs://', '')
          getAttachment(fileId).then(blob => {
            if (active && blob) {
              objectUrl = URL.createObjectURL(blob)
              setSrc(objectUrl)
            }
          }).catch(err => console.error("Failed to load VFS blob:", err))
        } else {
          setSrc(rawUrl)
        }

        return () => {
          active = false
          if (objectUrl) {
            URL.revokeObjectURL(objectUrl)
          }
        }
      }, [rawUrl])

      useEffect(() => {
        const video = videoRef.current
        if (!video) return
        // const onTime = () => setCurrentTime(video.currentTime) // 성능 최적화를 위해 상태 의존 제거
        const onLoad = () => setDuration(video.duration)
        const onEnd = () => setIsPlaying(false)
        // video.addEventListener('timeupdate', onTime)
        video.addEventListener('loadedmetadata', onLoad)
        video.addEventListener('ended', onEnd)
        return () => {
          // video.removeEventListener('timeupdate', onTime)
          video.removeEventListener('loadedmetadata', onLoad)
          video.removeEventListener('ended', onEnd)
        }
      }, [src])

      const togglePlay = () => {
        const v = videoRef.current
        if (!v) return
        if (isPlaying) v.pause()
        else v.play()
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

      const handleSetIn = () => setCutIn(videoRef.current ? videoRef.current.currentTime : null)
      const handleSetOut = () => setCutOut(videoRef.current ? videoRef.current.currentTime : null)
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

      const handleApply = async () => {
        if (!src || cutRegions.length === 0) return
        setIsExporting(true)
        setExportProgress(0)

        try {
          // MediaRecorder 기반 내보내기: 컷 구간을 건너뛰며 재인코딩
          const video = videoRef.current
          if (!video) throw new Error('비디오 엘리먼트 없음')

          const stream = (video as any).captureStream ? (video as any).captureStream() : null
          if (!stream) {
            alert('브라우저가 MediaRecorder 내보내기를 지원하지 않습니다. WebCodecs 폴백이 필요합니다.')
            return
          }

          const chunks: Blob[] = []
          const recorder = new MediaRecorder(stream, { mimeType: 'video/webm;codecs=vp9' })
          recorder.ondataavailable = e => { if (e.data.size > 0) chunks.push(e.data) }

          const sortedCuts = [...cutRegions].sort((a, b) => a.start - b.start)
          let nextCutIdx = 0

          recorder.start()
          video.currentTime = 0

          await new Promise<void>((resolve) => {
            const onEnded = () => {
              video.removeEventListener('ended', onEnded)
              resolve()
            }
            video.addEventListener('ended', onEnded)

            // WebCodecs 렌더링 폴백 전 프론트엔드 최선의 방어책: requestVideoFrameCallback 
            let frameHandle: number
            const processFrame = () => {
              if (video.ended) return
              const ct = video.currentTime
              setExportProgress(Math.round((ct / duration) * 100))

              if (nextCutIdx < sortedCuts.length) {
                const cut = sortedCuts[nextCutIdx]
                if (ct >= cut.start) {
                  video.currentTime = cut.end
                  nextCutIdx++
                }
              }
              if ('requestVideoFrameCallback' in video) {
                frameHandle = (video as any).requestVideoFrameCallback(processFrame)
              } else {
                frameHandle = requestAnimationFrame(processFrame) as any
              }
            }
            
            video.play().then(() => {
              if ('requestVideoFrameCallback' in video) {
                frameHandle = (video as any).requestVideoFrameCallback(processFrame)
              } else {
                frameHandle = requestAnimationFrame(processFrame) as any
              }
            })
          })

          recorder.stop()
          await new Promise<void>(r => { recorder.onstop = () => r() })
          video.pause()

          const blob = new Blob(chunks, { type: 'video/webm' })
          const fileId = `media-export-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
          await saveAttachment(fileId, blob)
          const url = `ameva-vfs://${fileId}`
          
          props.editor.updateBlock(props.block.id, {
            type: 'video',
            props: { ...props.block.props, url }
          } as any)
          
          setIsEditMode(false)
        } finally {
          setIsExporting(false)
          setExportProgress(0)
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
              border: '2px dashed #3a3a4a', borderRadius: '10px', padding: '40px',
              textAlign: 'center', color: '#888', background: '#0f0f13', cursor: 'pointer'
            }}
            onClick={() => document.getElementById(`video-upload-${props.block.id}`)?.click()}
          >
            <div style={{ fontSize: '36px', marginBottom: '12px' }}>🎬</div>
            <div style={{ fontSize: '14px', fontWeight: 600, color: '#e2e8f0', marginBottom: '8px' }}>클릭하여 비디오 파일 업로드</div>
            <div style={{ fontSize: '12px' }}>또는 비디오 파일을 이곳으로 드래그하세요</div>
            <input
              id={`video-upload-${props.block.id}`}
              type="file"
              accept="video/*,.mp4,.avi,.mkv,.mov,.wmv,.flv,.webm"
              style={{ display: 'none' }}
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) {
                  const fileId = `media-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
                  saveAttachment(fileId, file).then(() => {
                    const url = `ameva-vfs://${fileId}`
                    props.editor.updateBlock(props.block.id, {
                      type: 'video',
                      props: { ...props.block.props, url }
                    } as any)
                  })
                }
              }}
            />
          </div>
        )
      }

      const initialHeight = parseInt(props.block.props.height || '400', 10)
      const initialWidth = props.block.props.width || '100%'
      const isEditable = props.editor?.isEditable !== false

      return (
        <ResizableBlockContainer
          initialHeight={initialHeight}
          initialWidth={initialWidth}
          minHeight={220}
          maxHeight={3000}
          minWidth={280}
          maxWidth={3200}
          disabled={!isEditable}
          accentColor="#3b82f6"
          onResizeEnd={({ height: newH, width: newW }) => {
            props.editor.updateBlock(props.block.id, {
              type: 'video',
              props: {
                ...props.block.props,
                height: String(Math.round(newH)),
                width: newW || props.block.props.width || '100%'
              }
            } as any)
          }}
          style={{ margin: '14px 0', width: props.block.props.width || '100%' }}
        >
          {({ height: containerH }) => (
            <div
              ref={containerRef}
              style={{
                width: '100%',
                height: isEditMode ? `${Math.max(containerH, 460)}px` : `${containerH}px`,
                minHeight: `${containerH}px`,
                background: '#0f0f13',
                border: '1px solid #2a2a3a',
                borderRadius: '10px',
                overflow: 'hidden',
                color: '#fff',
                fontFamily: 'Pretendard, sans-serif',
                display: 'flex',
                flexDirection: 'column'
              }}
            >
              {/* ─── 비디오 뷰어 (상하좌우 크기에 맞춰 선명하게 채움) ───────────────── */}
              <div style={{ position: 'relative', background: '#000', flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '200px', overflow: 'hidden' }}>
                <video
                  ref={videoRef}
                  src={src || undefined}
                  style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }}
                  controls={!isEditMode}
                />
                {/* 편집 모드 토글 버튼 (미리보기 모드에선 숨김) */}
                {isEditable && (
                  <button
                    onClick={() => setIsEditMode(m => !m)}
                    style={{
                      position: 'absolute', top: '8px', right: '8px',
                      background: isEditMode ? '#ef4444' : 'rgba(0,0,0,0.7)',
                      border: '1px solid rgba(255,255,255,0.2)',
                      color: '#fff', borderRadius: '6px',
                      padding: '4px 10px', fontSize: '12px', cursor: 'pointer',
                      backdropFilter: 'blur(8px)',
                      zIndex: 5
                    }}
                  >
                    {isEditMode ? '✕ 편집 닫기' : '✂️ 편집 모드'}
                  </button>
                )}
              </div>

          {/* ─── 인라인 편집 패널 ────────────────────────────────── */}
          {isEditMode && (
            <div style={{ padding: '12px 16px' }}>
              {/* 컨트롤 바 */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <button
                  onClick={togglePlay}
                  style={{ background: '#3b82f6', border: 'none', color: '#fff', borderRadius: '6px', padding: '6px 14px', cursor: 'pointer', fontSize: '13px' }}
                >
                  {isPlaying ? '⏸' : '▶️'}
                </button>
                <span style={{ fontSize: '12px', color: '#aaa', minWidth: '90px' }}>
                  {formatTime(videoRef.current ? videoRef.current.currentTime : 0)} / {formatTime(duration)}
                </span>
                <div style={{ display: 'flex', gap: '4px', alignItems: 'center', marginLeft: '10px' }}>
                  <button
                    onClick={handleSetIn}
                    style={{ background: '#4b5563', border: 'none', color: '#fff', borderRadius: '6px', padding: '6px 10px', cursor: 'pointer', fontSize: '12px' }}
                  >
                    [ In
                  </button>
                  <button
                    onClick={handleSetOut}
                    style={{ background: '#4b5563', border: 'none', color: '#fff', borderRadius: '6px', padding: '6px 10px', cursor: 'pointer', fontSize: '12px' }}
                  >
                    Out ]
                  </button>
                  <button
                    onClick={handleAddCut}
                    disabled={cutIn === null || cutOut === null}
                    style={{ 
                      background: (cutIn !== null && cutOut !== null) ? '#dc2626' : '#374151', 
                      border: 'none', color: '#fff', borderRadius: '6px', padding: '6px 12px', cursor: 'pointer', fontSize: '12px',
                      opacity: (cutIn !== null && cutOut !== null) ? 1 : 0.5
                    }}
                  >
                    ✂️ 구간 자르기
                  </button>
                  {(cutIn !== null || cutOut !== null) && (
                    <span style={{ fontSize: '11px', color: '#fca5a5', marginLeft: '6px' }}>
                      {cutIn !== null ? formatTime(cutIn) : '--:--'} ~ {cutOut !== null ? formatTime(cutOut) : '--:--'}
                    </span>
                  )}
                </div>
                <div style={{ flex: 1 }} />
                <button
                  onClick={handleApply}
                  disabled={isExporting || cutRegions.length === 0}
                  style={{
                    background: isExporting ? '#374151' : '#10b981',
                    border: 'none', color: '#fff', borderRadius: '6px',
                    padding: '6px 14px', cursor: 'pointer', fontSize: '12px',
                    opacity: cutRegions.length === 0 ? 0.5 : 1,
                  }}
                >
                  {isExporting ? `⏳ ${exportProgress}%` : '💾 적용하기'}
                </button>
              </div>

              {/* 파형 분석 컨트롤 */}
              <div style={{
                background: '#1a1a2e', borderRadius: '8px', padding: '10px 12px',
                marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap',
              }}>
                <span style={{ fontSize: '11px', color: '#7c83fd', fontWeight: 600 }}>🔊 무음 탐지</span>
                <label style={{ fontSize: '11px', color: '#aaa', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  임계값
                  <input
                    type="range" min="0.001" max="0.1" step="0.001"
                    value={silenceThreshold}
                    onChange={e => setSilenceThreshold(parseFloat(e.target.value))}
                    style={{ width: '70px' }}
                  />
                  <span style={{ color: '#fff', fontSize: '10px' }}>
                    {(20 * Math.log10(silenceThreshold)).toFixed(0)}dB
                  </span>
                </label>
                <label style={{ fontSize: '11px', color: '#aaa', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  최소 구간
                  <input
                    type="range" min="0.1" max="3" step="0.1"
                    value={minSilenceDuration}
                    onChange={e => setMinSilenceDuration(parseFloat(e.target.value))}
                    style={{ width: '70px' }}
                  />
                  <span style={{ color: '#fff', fontSize: '10px' }}>{minSilenceDuration}s</span>
                </label>
                <button
                  onClick={handleAnalyze}
                  disabled={isAnalyzing}
                  style={{
                    background: isAnalyzing ? '#374151' : '#2563eb',
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
                    ✂️ 무음 {silenceSegments.length}개 일괄 삭제
                  </button>
                )}
              </div>

              {/* 파형 + 타임라인 */}
              <div style={{ borderRadius: '6px', overflow: 'hidden', marginBottom: '10px' }}>
                {waveformData.length > 0 ? (
                  <WaveformCanvas
                    waveformData={waveformData}
                    duration={duration}
                    currentTime={currentTime}
                    cutRegions={cutRegions}
                    silenceSegments={silenceSegments}
                    onSeek={(t) => {
                      if (videoRef.current) videoRef.current.currentTime = t
                    }}
                    height={72}
                    videoRef={videoRef}
                  />
                ) : (
                  <div style={{
                    height: '72px', background: '#111', display: 'flex',
                    alignItems: 'center', justifyContent: 'center',
                    color: '#555', fontSize: '12px', borderRadius: '6px',
                  }}>
                    파형 분석 버튼을 눌러 파형을 시각화하세요
                  </div>
                )}
              </div>

              {/* 컷 목록 */}
              {cutRegions.length > 0 && (
                <div style={{ fontSize: '11px', color: '#aaa', display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {cutRegions.map((r, i) => (
                    <span
                      key={i}
                      style={{
                        background: 'rgba(239,68,68,0.2)', border: '1px solid #ef4444',
                        borderRadius: '4px', padding: '3px 8px', display: 'flex', gap: '6px',
                      }}
                    >
                      ✂️ {formatTime(r.start)}~{formatTime(r.end)}
                      <button
                        onClick={() => removeCutRegion(i)}
                        style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: 0 }}
                      >
                        ✕
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 캡션 */}
          {props.block.props.caption && (
            <div style={{ padding: '6px 16px 10px', fontSize: '12px', color: '#888', textAlign: 'center' }}>
              {props.block.props.caption}
            </div>
          )}
            </div>
          )}
        </ResizableBlockContainer>
      )
    },
    toExternalHTML: ({ block }) => {
      return (
        <div data-content-type="video" data-url={block.props.url} data-width={block.props.width} data-height={block.props.height}>
          <video src={block.props.url} controls />
        </div>
      )
    }
  }
)

export const AmevaVideoBlock = AmevaVideoBlockSpec()
