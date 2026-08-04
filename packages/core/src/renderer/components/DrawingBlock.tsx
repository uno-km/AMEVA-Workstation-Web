/**
 * @file DrawingBlock.tsx
 * @system AMEVA OS Desktop Workstation
 * @location src/renderer/components/DrawingBlock.tsx
 * @role Core module helper and integration logic
 * 
 * [소비처 - CONSUMERS / USAGE CONTEXT]
 * - 소비처 A (src/renderer/components/MarkdownEditor.tsx): BlockNote 커스텀 블록 스펙인 DrawingBlockSpec을 등록하여 소비.
 * - 소비처 B (src/renderer/editor/amevaBlockSchema.ts): 에디터 스키마 정의 내부에서 drawing 블록 타입 매핑을 위해 참조.
 * 
 * [책임 범위 - RESPONSIBILITY]
 * - 본 파일은 Excalidraw 라이브러리 및 경량 스케치패드(Canvas API) 폴백 뷰포트를 연동하여 블록 기반의 드로잉 필드를 지원한다.
 * - 0.5초 디바운스 저장을 처리하며, 컴포넌트 소멸(언마운트) 시점에 유실 없는 최후의 저장(Flush) 장치를 보증한다.
 * 
 * [절대 깨면 안 되는 계약 - CONTRACT]
 * - MUST NOT: @excalidraw/excalidraw의 CSS 누락으로 인한 스타일 붕괴를 막기 위해 상단 index.css 임포트를 유지할 것.
 * - MUST: 보기 모드(!isEditing) 시 씌워지는 오버레이에 pointer-events: none을 선언하여 에디터 기본 포커스 전파를 훼방놓지 말 것.
 */

import React, { useState, useEffect, useRef } from 'react'
import { createReactBlockSpec } from '@blocknote/react'
import { Check, Edit2, FileImage, RefreshCw, Layers } from 'lucide-react'
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
 * - 예시: `loadExcalidraw(status => setStatus(status))` 호출로 동적 바인딩.
 */
const loadExcalidraw = async (onStatusChange?: (status: 'loaded' | 'failed') => void) => {
  /*
   * [ALGORITHM BRANCH / DECISION]
   * - 조건 식: `Excalidraw`
   * - 만족 시: 이미 로드가 성공한 상태이므로 즉시 성공 상태를 반환하고 탈출함.
   */
  if (Excalidraw) {
    onStatusChange?.('loaded')
    return
  }
  /*
   * [ALGORITHM BRANCH / DECISION]
   * - 조건 식: `isLoadingExcalidraw`
   * - 만족 시: 이미 다른 컴포넌트에서 비동기 로딩을 개시했으므로 중복 호출을 막고 무조건 리턴함.
   */
  if (isLoadingExcalidraw) return
  isLoadingExcalidraw = true
  excalidrawFailed = false
  
  try {
    /*
     * [RUN-TIME STATE / INVARIANT]
     * - timeout: 10초 동안 로드가 지연될 때 에러를 강제 촉발하여 무한 펜딩 상태를 해결하는 탈출구 Promise.
     */
    const timeout = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Excalidraw 로딩 지연 (10초)')), 10000)
    )
    const loaded = import('@excalidraw/excalidraw').then(m => m.Excalidraw)
    Excalidraw = await Promise.race([loaded, timeout])
    excalidrawFailed = false
    onStatusChange?.('loaded')
  } catch (err) {
    console.warn('[DrawingBlock] Excalidraw 로드 실패 — Canvas 폴백 대기:', err)
    excalidrawFailed = true
    onStatusChange?.('failed')
  } finally {
    isLoadingExcalidraw = false
  }
}

// CommonJS 환경 동기식 로드 선행 시도
try {
  const ex = require('@excalidraw/excalidraw') as { Excalidraw: typeof Excalidraw }
  Excalidraw = ex.Excalidraw
} catch {
  // CommonJS require 에러 시 동적 비동기 로드 위임
  loadExcalidraw()
}

export const DrawingBlockSpec = createReactBlockSpec(
  {
    type: 'drawing',
    propSchema: {
      data: { default: '[]' }
    },
    content: 'none'
  },
  {
    render: ({ block, editor }) => {
      /*
       * [RUN-TIME STATE / INVARIANT]
       * - mounted: 클라이언트 DOM 마운트 완료 여부 플래그.
       * - isEditing: 캔버스를 수정 가능한 상태(Edit)와 읽기전용 프리뷰 상태(View)로 나눈 boolean.
       * - excalidrawState: 비동기 로딩을 리액티브하게 관제하는 상태값 ('loading' | 'loaded' | 'failed').
       * - useFallbackCanvas: 사용자가 명시적으로 실패를 인정하고 경량 캔버스로 진입하겠다고 누른 플래그.
       */
      const [mounted, setMounted] = useState(false)
      const [isEditing, setIsEditing] = useState(true)
      const [excalidrawState, setExcalidrawState] = useState<'loading' | 'loaded' | 'failed'>(
        Excalidraw ? 'loaded' : (excalidrawFailed ? 'failed' : 'loading')
      )
      const [useFallbackCanvas, setUseFallbackCanvas] = useState(false)

      /*
       * [RUN-TIME STATE / INVARIANT]
       * - saveTimeoutRef: 디바운스 저장을 관리하는 타이머 핸들.
       * - fallbackCanvasRef: Excalidraw 로드 실패 시 가동하는 Vanilla Canvas HTML element Ref.
       * - isDrawingRef: 경량 캔버스 모드 시 마우스 프레스 상태 플래그.
       * - lastPosRef: 드로잉 좌표 꼬리 추적용 오프셋 캐싱 객체.
       */
      const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)
      const fallbackCanvasRef = useRef<HTMLCanvasElement>(null)
      const isDrawingRef = useRef(false)
      const lastPosRef = useRef<{ x: number; y: number } | null>(null)

      // 마운트 시 로드 상태 폴링 및 비동기 콜백 리스너 바인딩
      useEffect(() => {
        setMounted(true)
        if (!Excalidraw && !excalidrawFailed) {
          loadExcalidraw((status) => {
            setExcalidrawState(status)
          })
        }
      }, [])

      // 초기 직렬화 데이터 역파싱
      let initialElements = []
      try {
        initialElements = JSON.parse(block.props.data || '[]')
      } catch (e) {
        console.error('Drawing data parse error:', e)
      }

      /*
       * [RUN-TIME STATE / INVARIANT]
       * - latestElementsRef: 저장 디바운싱 중 발생하는 유실(언마운트 시)을 막기 위해 실시간 최신 캔버스 노드를 쥐고 있는 Ref 버퍼.
       * - lastSavedDataRef: 중복 쓰기 IO 낭비를 차단하기 위해 마지막 저장된 JSON 문자열 스냅샷을 쥐고 있는 Ref 버퍼.
       */
      const latestElementsRef = useRef<any[]>(initialElements)
      const lastSavedDataRef = useRef<string>(block.props.data || '[]')

      // [📝 데이터 유실 방지 (Debounce flush) 장치]
      // - 컴포넌트가 언마운트되거나 block.id가 바뀔 때, 아직 에디터로 발송되지 않고 대기 중인 타이머가 있다면 즉시 강제 플러시(flush)한다.
      useEffect(() => {
        return () => {
          if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current)
            const stringified = JSON.stringify(latestElementsRef.current)
            if (stringified !== lastSavedDataRef.current) {
              editor.updateBlock(block.id, {
                type: 'drawing',
                props: { data: stringified }
              })
            }
          }
        }
      }, [block.id])

      /*
       * [FUNCTION CONTRACT]
       * - 함수 명: `handleCanvasChange`
       * - 역할: 드로잉 변화 이벤트를 포착하여 버퍼를 갱신하고, 500ms 디바운서로 에디터 블록 값을 업데이트한다.
       */
      const handleCanvasChange = (elements: any[]) => {
        latestElementsRef.current = elements
        if (saveTimeoutRef.current) {
          clearTimeout(saveTimeoutRef.current)
        }
        saveTimeoutRef.current = setTimeout(() => {
          const stringified = JSON.stringify(elements)
          if (stringified !== lastSavedDataRef.current) {
            lastSavedDataRef.current = stringified
            editor.updateBlock(block.id, {
              type: 'drawing',
              props: { data: stringified }
            })
          }
        }, 500)
      }

      /*
       * [FUNCTION CONTRACT]
       * - 함수 명: `handleRetryLoad`
       * - 역할: 지연된 엑스칼리드로우 모듈 로딩을 다시 호출하고 상태를 초기화한다.
       */
      const handleRetryLoad = () => {
        setExcalidrawState('loading')
        loadExcalidraw((status) => {
          setExcalidrawState(status)
        })
      }

      // 미마운트 시 임시 스케줄러 렌더
      if (!mounted) {
        return (
          <div style={{
            height: '380px', display: 'flex', alignItems: 'center', justifyContent: 'center',
            backgroundColor: '#16161a', border: '1px dashed #2e2e38', borderRadius: '8px',
            color: 'var(--text-muted)', fontSize: '12px'
          }}>
            드로잉 모듈을 준비 중입니다...
          </div>
        )
      }

      // [Excalidraw 로딩 뷰포트]
      if (excalidrawState === 'loading' && !useFallbackCanvas) {
        return (
          <div style={{
            height: '380px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            backgroundColor: '#16161a', border: '1px dashed #2e2e38', borderRadius: '8px',
            color: 'var(--text-muted)', fontSize: '12.5px', gap: '12px'
          }}>
            <div style={{ width: '24px', height: '24px', borderRadius: '50%', border: '2px solid var(--primary)', borderTopColor: 'transparent', animation: 'spin 1s linear infinite' }} />
            <span>Excalidraw 엔진을 불러오는 중입니다...</span>
          </div>
        )
      }

      // [Excalidraw 로딩 실패 뷰포트 - 재시도 & 경량 전환 제안]
      if ((excalidrawState === 'failed' || !Excalidraw) && !useFallbackCanvas) {
        return (
          <div style={{
            height: '380px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            backgroundColor: '#1c1c22', border: '1px dashed rgba(239, 68, 68, 0.4)', borderRadius: '8px',
            color: 'var(--text-main)', fontSize: '12px', gap: '14px', padding: '20px', textAlign: 'center'
          }}>
            <span style={{ fontWeight: 700, color: '#fca5a5', fontSize: '13px' }}>⚠️ 드로잉 모듈 로딩 지연 또는 실패</span>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', maxWidth: '320px', lineHeight: '1.4' }}>
              환경에 따라 엑스칼리드로우(Excalidraw) 패키지 로드가 지연될 수 있습니다. 다시 로드하거나 오프라인 경량 모드로 시작할 수 있습니다.
            </span>
            <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
              <button
                onClick={handleRetryLoad}
                style={{
                  padding: '6px 14px', borderRadius: '6px', cursor: 'pointer',
                  background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.3)',
                  color: 'var(--primary)', fontSize: '11px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px',
                  transition: 'background 0.2s'
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(139,92,246,0.25)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(139,92,246,0.15)'}
              >
                <RefreshCw size={12} /> 다시 시도
              </button>
              <button
                onClick={() => setUseFallbackCanvas(true)}
                style={{
                  padding: '6px 14px', borderRadius: '6px', cursor: 'pointer',
                  background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
                  color: 'var(--text-main)', fontSize: '11px', transition: 'background 0.2s'
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
              >
                경량 스케치패드로 그리기
              </button>
            </div>
          </div>
        )
      }

      // [경량 캔버스 폴백 뷰포트]
      if (useFallbackCanvas || excalidrawState === 'failed' || !Excalidraw) {
        return (
          <div className="bn-block-content-wrapper" style={{
            width: '100%', backgroundColor: '#18181c', border: '1px solid #2e2e38',
            borderRadius: '8px', overflow: 'hidden', display: 'flex', flexDirection: 'column', marginBottom: '10px'
          }}>
            <div style={{ padding: '8px 12px', borderBottom: '1px solid #2e2e38', display: 'flex', alignItems: 'center', gap: '6px', background: '#121215' }}>
              <FileImage size={14} style={{ color: 'var(--primary)' }} />
              <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#f8fafc' }}>Drawing Pad (경량 폴백 모드)</span>
              {excalidrawState !== 'failed' && (
                <button
                  onClick={() => setUseFallbackCanvas(false)}
                  style={{ marginLeft: '12px', background: 'none', border: 'none', color: 'var(--primary)', fontSize: '9px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '2px' }}
                >
                  <RefreshCw size={10} /> 원래 모듈로 복귀
                </button>
              )}
              <span style={{ fontSize: '9px', color: 'var(--text-muted)', marginLeft: 'auto' }}>마우스로 자유롭게 그리세요</span>
            </div>
            <canvas
              ref={fallbackCanvasRef}
              width={800}
              height={380}
              style={{ width: '100%', height: '380px', background: '#1e1e24', cursor: 'crosshair', display: 'block' }}
              onMouseDown={(e) => {
                isDrawingRef.current = true
                const rect = e.currentTarget.getBoundingClientRect()
                lastPosRef.current = { x: (e.clientX - rect.left) * (e.currentTarget.width / rect.width), y: (e.clientY - rect.top) * (e.currentTarget.height / rect.height) }
              }}
              onMouseMove={(e) => {
                if (!isDrawingRef.current || !lastPosRef.current) return
                const canvas = fallbackCanvasRef.current
                if (!canvas) return
                const ctx = canvas.getContext('2d')
                if (!ctx) return
                const rect = e.currentTarget.getBoundingClientRect()
                const x = (e.clientX - rect.left) * (canvas.width / rect.width)
                const y = (e.clientY - rect.top) * (canvas.height / rect.height)
                ctx.strokeStyle = '#a78bfa'
                ctx.lineWidth = 2
                ctx.lineCap = 'round'
                ctx.lineJoin = 'round'
                ctx.beginPath()
                ctx.moveTo(lastPosRef.current.x, lastPosRef.current.y)
                ctx.lineTo(x, y)
                ctx.stroke()
                lastPosRef.current = { x, y }
              }}
              onMouseUp={() => { isDrawingRef.current = false; lastPosRef.current = null }}
              onMouseLeave={() => { isDrawingRef.current = false; lastPosRef.current = null }}
            />
          </div>
        )
      }

      // [정상 Excalidraw 렌더링 뷰포트]
      return (
        <div
          className="bn-block-content-wrapper"
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
          {/* 헤더 바 */}
          <div style={{
            padding: '8px 12px',
            borderBottom: '1px solid #2e2e38',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: '#121215'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <FileImage size={14} style={{ color: 'var(--primary)' }} />
              <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#f8fafc' }}>Drawing Canvas</span>
            </div>
            
            <button
              onClick={() => setIsEditing(!isEditing)}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--primary)',
                fontSize: '11px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '4px 8px',
                borderRadius: '4px',
                backgroundColor: 'rgba(139,92,246,0.1)',
                transition: 'background 0.15s'
              }}
              onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(139,92,246,0.2)'}
              onMouseLeave={e => e.currentTarget.style.backgroundColor = 'rgba(139,92,246,0.1)'}
            >
              {isEditing ? (
                <>
                  <Check size={11} />
                  Done Sketching
                </>
              ) : (
                <>
                  <Edit2 size={11} />
                  Edit Sketch
                </>
              )}
            </button>
          </div>

          {/* 캔버스 본체 Wrapper (자물쇠 UI 붕괴 방지를 위해 overflow: hidden 및 position: relative 확보) */}
          <div style={{ height: '380px', width: '100%', position: 'relative', overflow: 'hidden' }}>
            {isEditing ? (
              <Excalidraw
                initialData={{
                  elements: initialElements,
                  appState: { viewBackgroundColor: '#1e1e24', theme: 'dark' }
                }}
                onChange={handleCanvasChange}
              />
            ) : (
              // 뷰 전용 프리뷰 상태
              <>
                <Excalidraw
                  initialData={{
                    elements: initialElements,
                    appState: { viewBackgroundColor: '#1e1e24', theme: 'dark' }
                  }}
                  viewModeEnabled={true}
                />
                {/* [📸 오버레이 이벤트 블로킹 수정]
                   - pointer-events: none을 통해 캔버스 내부 클릭이 아래로 통과하지 않고, 
                     동시에 BlockNote 에디터의 기본 클릭/포커스 이벤트를 차단하지 않도록 전파를 보증함. */}
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  zIndex: 5,
                  cursor: 'default',
                  pointerEvents: 'none'
                }} />
              </>
            )}
          </div>
        </div>
      )
    }
  }
)

export const DrawingBlock = DrawingBlockSpec()
