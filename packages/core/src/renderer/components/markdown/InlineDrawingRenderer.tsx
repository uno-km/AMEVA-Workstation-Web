/**
 * @file InlineDrawingRenderer.tsx
 * @system AMEVA OS Desktop Workstation
 * @location src/renderer/components/markdown/InlineDrawingRenderer.tsx
 * @role Core module helper and integration logic
 * 
 * [소비처 - CONSUMERS / USAGE CONTEXT]
 * - 소비처 A (src/renderer/components/MarkdownPreview.tsx): 마크다운 파싱 시 ameva-drawing 인라인 세그먼트 전용 드로잉 뷰어로 소비.
 */

import React, { useState, useEffect, useRef } from 'react'
import { FileImage, RefreshCw } from 'lucide-react'
import '@excalidraw/excalidraw/index.css'

/*
 * [RUN-TIME STATE / INVARIANT]
 * - Excalidraw: 동적 import() 결과물을 캐싱하는 탑레벨 React 컴포넌트 참조 객체.
 * - excalidrawFailed: 로딩 시도 후 최종 실패(타임아웃 등) 시 세팅되는 글로벌 에러 플래그.
 * - isLoadingExcalidraw: 비동기 중복 요청 방지를 위한 로드 기동 락 변수.
 */
let Excalidraw: React.ComponentType<any> | null = null
let excalidrawFailed = false
let isLoadingExcalidraw = false

/*
 * [FUNCTION CONTRACT]
 * - 함수 명: `loadExcalidraw`
 * - 역할: 엑스칼리드로우 모듈을 비동기로 로드하며 10초 타임아웃 예외를 설정하여 electron 런타임 지연 시 복원을 시도한다.
 */
const loadExcalidraw = async (onStatusChange?: (status: 'loaded' | 'failed') => void) => {
  if (Excalidraw) {
    onStatusChange?.('loaded')
    return
  }
  if (isLoadingExcalidraw) return
  isLoadingExcalidraw = true
  excalidrawFailed = false
  
  try {
    const timeout = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Excalidraw 로딩 지연 (10초)')), 10000)
    )
    const loaded = import('@excalidraw/excalidraw').then(m => m.Excalidraw)
    Excalidraw = await Promise.race([loaded, timeout])
    excalidrawFailed = false
    onStatusChange?.('loaded')
  } catch (err) {
    console.warn('[InlineDrawingRenderer] Excalidraw 로드 실패 — Canvas 폴백 대기:', err)
    excalidrawFailed = true
    onStatusChange?.('failed')
  } finally {
    isLoadingExcalidraw = false
  }
}

// CJS 동기 로드 시도
try {
  const ex = require('@excalidraw/excalidraw') as { Excalidraw: typeof Excalidraw }
  Excalidraw = ex.Excalidraw
} catch {
  loadExcalidraw()
}

export function InlineDrawingRenderer({ code }: { code: string }) {
  /*
   * [RUN-TIME STATE / INVARIANT]
   * - mounted: 클라이언트 DOM 마운트 완료 여부 플래그.
   * - excalidrawState: 비동기 로딩을 리액티브하게 관제하는 상태값 ('loading' | 'loaded' | 'failed').
   * - useFallbackCanvas: 사용자가 명시적으로 실패를 인정하고 경량 캔버스로 진입하겠다고 누른 플래그.
   * - fallbackCanvasRef: Excalidraw 로드 실패 시 가동하는 Vanilla Canvas HTML element Ref.
   */
  const [mounted, setMounted] = useState(false)
  const [excalidrawState, setExcalidrawState] = useState<'loading' | 'loaded' | 'failed'>(
    Excalidraw ? 'loaded' : (excalidrawFailed ? 'failed' : 'loading')
  )
  const [useFallbackCanvas, setUseFallbackCanvas] = useState(false)
  const fallbackCanvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    setMounted(true)
    if (!Excalidraw && !excalidrawFailed) {
      loadExcalidraw((status) => {
        setExcalidrawState(status)
      })
    }
  }, [])

  // JSON 파싱
  let elements = []
  try {
    elements = JSON.parse(code || '[]')
  } catch (err) {
    console.error('[InlineDrawingRenderer] JSON parse failed:', err)
    return <div style={{ color: 'var(--text-muted)', fontSize: '11px' }}>그림 데이터를 해석할 수 없습니다.</div>
  }

  // 폴백 캔버스를 그리는 Effect (경량 스케치패드 데이터 복원용)
  useEffect(() => {
    if (useFallbackCanvas && fallbackCanvasRef.current) {
      const canvas = fallbackCanvasRef.current
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        ctx.fillStyle = '#1e1e24'
        ctx.fillRect(0, 0, canvas.width, canvas.height)
        
        elements.forEach((el: any) => {
          if (el.type === 'freedraw' && el.points) {
            ctx.strokeStyle = el.strokeColor || '#a78bfa'
            ctx.lineWidth = el.strokeWidth || 2
            ctx.lineCap = 'round'
            ctx.lineJoin = 'round'
            ctx.beginPath()
            el.points.forEach((pt: number[], i: number) => {
              const x = el.x + pt[0]
              const y = el.y + pt[1]
              if (i === 0) ctx.moveTo(x, y)
              else ctx.lineTo(x, y)
            })
            ctx.stroke()
          }
        })
      }
    }
  }, [useFallbackCanvas, elements])

  const handleRetryLoad = () => {
    setExcalidrawState('loading')
    loadExcalidraw((status) => {
      setExcalidrawState(status)
    })
  }

  if (!mounted) {
    return <div style={{ height: '380px', backgroundColor: '#16161a', borderRadius: '8px' }} />
  }

  if (excalidrawState === 'loading' && !useFallbackCanvas) {
    return (
      <div style={{
        height: '380px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        backgroundColor: '#16161a', border: '1px dashed #2e2e38', borderRadius: '8px',
        color: 'var(--text-muted)', fontSize: '12px', gap: '10px'
      }}>
        <div style={{ width: '20px', height: '20px', borderRadius: '50%', border: '2px solid var(--primary)', borderTopColor: 'transparent', animation: 'spin 1s linear infinite' }} />
        <span>그림을 불러오는 중입니다...</span>
      </div>
    )
  }

  if ((excalidrawState === 'failed' || !Excalidraw) && !useFallbackCanvas) {
    return (
      <div style={{
        height: '380px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        backgroundColor: '#1c1c22', border: '1px dashed rgba(239, 68, 68, 0.4)', borderRadius: '8px',
        color: 'var(--text-main)', fontSize: '12px', gap: '12px', padding: '20px', textAlign: 'center'
      }}>
        <span style={{ fontWeight: 'bold', color: '#fca5a5' }}>⚠️ 드로잉 모듈 로드 실패</span>
        <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
          <button
            onClick={handleRetryLoad}
            style={{
              padding: '6px 12px', borderRadius: '6px', cursor: 'pointer',
              background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.3)',
              color: 'var(--primary)', fontSize: '11px', fontWeight: 'bold'
            }}
          >
            다시 시도
          </button>
          <button
            onClick={() => setUseFallbackCanvas(true)}
            style={{
              padding: '6px 12px', borderRadius: '6px', cursor: 'pointer',
              background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
              color: 'var(--text-main)', fontSize: '11px'
            }}
          >
            경량 패드로 보기
          </button>
        </div>
      </div>
    )
  }

  if (useFallbackCanvas || excalidrawState === 'failed' || !Excalidraw) {
    return (
      <div style={{ width: '100%', backgroundColor: '#18181c', border: '1px solid #2e2e38', borderRadius: '8px', overflow: 'hidden' }}>
        <div style={{ padding: '8px 12px', borderBottom: '1px solid #2e2e38', display: 'flex', alignItems: 'center', gap: '6px', background: '#121215' }}>
          <FileImage size={14} style={{ color: 'var(--primary)' }} />
          <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#f8fafc' }}>Drawing Pad (경량 폴백 뷰)</span>
        </div>
        <canvas ref={fallbackCanvasRef} width={800} height={380} style={{ width: '100%', height: '380px', background: '#1e1e24', display: 'block' }} />
      </div>
    )
  }

  return (
    <div
      style={{
        width: '100%',
        backgroundColor: '#18181c',
        border: '1px solid #2e2e38',
        borderRadius: '8px',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        marginBottom: '10px'
      }}
    >
      <div style={{ padding: '8px 12px', borderBottom: '1px solid #2e2e38', display: 'flex', alignItems: 'center', gap: '6px', background: '#121215' }}>
        <FileImage size={14} style={{ color: 'var(--primary)' }} />
        <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#f8fafc' }}>Drawing Canvas (View Only)</span>
      </div>

      <div style={{ height: '380px', width: '100%', position: 'relative', overflow: 'hidden' }}>
        <Excalidraw
          initialData={{
            elements,
            appState: { viewBackgroundColor: '#1e1e24', theme: 'dark' }
          }}
          viewModeEnabled={true}
        />
        {/* pointer-events: none 으로 에디터의 줌/패닝 및 포커스 차단 해소 */}
        <div style={{
          position: 'absolute',
          top: 0, left: 0, right: 0, bottom: 0,
          zIndex: 5,
          cursor: 'default',
          pointerEvents: 'none'
        }} />
      </div>
    </div>
  )
}
