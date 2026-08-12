/**
 * @file useWaveformAnalyzer.ts
 * @location packages/core/src/renderer/features/media-editor/useWaveformAnalyzer.ts
 * @description Web Audio API 기반 오디오 파형 분석 및 지능형 무음 구간 탐지 훅
 *
 * [책임 범위]
 * - 미디어 파일의 오디오 트랙을 OfflineAudioContext로 디코딩
 * - 파형 시각화를 위한 waveformData(Float32Array) 추출
 * - 무음 구간(SilenceSegment) 자동 탐지 및 반환
 *
 * [소비처]
 * - AmevaVideoBlock.tsx, AmevaAudioBlock.tsx
 */
import { useCallback, useState } from 'react'

/** 무음 구간 데이터 구조 */
export interface SilenceSegment {
  start: number
  end: number
}

/** 파형 분석 결과 */
export interface WaveformResult {
  waveformData: Float32Array
  silenceSegments: SilenceSegment[]
  duration: number
}

/** 겹치는 컷 구간들을 병합하는 유틸리티 */
export function mergeCutRegions(regions: SilenceSegment[]): SilenceSegment[] {
  if (regions.length === 0) return []
  const sorted = [...regions].sort((a, b) => a.start - b.start)
  const merged: SilenceSegment[] = [sorted[0]]
  
  for (let i = 1; i < sorted.length; i++) {
    const current = sorted[i]
    const last = merged[merged.length - 1]
    if (current.start <= last.end) {
      last.end = Math.max(last.end, current.end)
    } else {
      merged.push(current)
    }
  }
  return merged
}

interface UseWaveformAnalyzerOptions {
  silenceThreshold?: number
  minSilenceDuration?: number
  waveformResolution?: number
}

export function useWaveformAnalyzer(options: UseWaveformAnalyzerOptions = {}) {
  const {
    silenceThreshold = 0.01,
    minSilenceDuration = 0.5,
    waveformResolution = 1000,
  } = options

  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [progress, setProgress] = useState(0)

  const analyzeMedia = useCallback(async (src: string): Promise<WaveformResult> => {
    setIsAnalyzing(true)
    setProgress(0)

    try {
      const response = await fetch(src)
      const arrayBuffer = await response.arrayBuffer()
      setProgress(20)

      const audioCtx = new AudioContext()
      const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer)
      await audioCtx.close()
      setProgress(50)

      const { sampleRate, duration } = audioBuffer

      const offlineCtx = new OfflineAudioContext(1, Math.ceil(sampleRate * duration), sampleRate)
      const source = offlineCtx.createBufferSource()
      source.buffer = audioBuffer
      source.connect(offlineCtx.destination)
      source.start()
      const renderedBuffer = await offlineCtx.startRendering()
      setProgress(75)

      const channelData = renderedBuffer.getChannelData(0)
      const totalSamples = channelData.length

      const samplesPerPoint = Math.floor(totalSamples / waveformResolution)
      const waveformData = new Float32Array(waveformResolution)
      for (let i = 0; i < waveformResolution; i++) {
        const start = i * samplesPerPoint
        const end = Math.min(start + samplesPerPoint, totalSamples)
        let maxAbs = 0
        for (let j = start; j < end; j++) {
          maxAbs = Math.max(maxAbs, Math.abs(channelData[j]))
        }
        waveformData[i] = maxAbs
      }

      const frameSize = Math.floor(sampleRate * 0.05)
      const silenceSegments: SilenceSegment[] = []
      let silenceStart: number | null = null

      for (let i = 0; i < totalSamples; i += frameSize) {
        const end = Math.min(i + frameSize, totalSamples)
        let sumSq = 0
        for (let j = i; j < end; j++) sumSq += channelData[j] * channelData[j]
        const rms = Math.sqrt(sumSq / (end - i))
        const timePos = i / sampleRate

        if (rms < silenceThreshold) {
          if (silenceStart === null) silenceStart = timePos
        } else {
          if (silenceStart !== null) {
            if (timePos - silenceStart >= minSilenceDuration) {
              silenceSegments.push({ start: silenceStart, end: timePos })
            }
            silenceStart = null
          }
        }
      }

      if (silenceStart !== null && duration - silenceStart >= minSilenceDuration) {
        silenceSegments.push({ start: silenceStart, end: duration })
      }

      setProgress(100)
      return { waveformData, silenceSegments, duration }
    } finally {
      setIsAnalyzing(false)
    }
  }, [silenceThreshold, minSilenceDuration, waveformResolution])

  return { analyzeMedia, isAnalyzing, progress }
}
