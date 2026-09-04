/**
 * @file AmevaImageBlock.tsx
 * @system AMEVA OS Desktop Workstation - Editor Block Component
 * @location packages/core/src/renderer/components/media/AmevaImageBlock.tsx
 * @role Multi-Image Gallery & In-Place Canvas Image Editor Block Spec
 * 
 * [설계 의도 - DESIGN INTENT / ADR]
 * - BlockNote 에디터 내에서 단일 또는 복수의 이미지를 그리드(Grid) 및 좌우 스크롤(Carousel) 레이아웃으로 유려하게 렌더링한다.
 * - 패브릭(Fabric.js) 기반의 온디바이스 캔버스 편집기를 내장하여 모자이크(Pixelate), AI 배경 제거, 텍스트 삽입, 이미지 합성, 테두리 액자, 투명 지우개 기능을 무손실로 제공한다.
 * - 사용자가 갤러리 내 각 이미지 카드를 삭제, 개별 편집, 고해상도 확대 뷰어로 즉시 열어볼 수 있도록 3단계 퀵 액션을 제공한다.
 * 
 * [책임 범위 - RESPONSIBILITY]
 * - 에디터 블록 속성(`url`, `viewMode`, `previewWidth`) 직렬화/역직렬화 및 VFS(IndexedDB) 저장 연동.
 * - Fabric.js 캔버스 라이프사이클 관리 및 모자이크/텍스트 레이어 생성/삭제 제어.
 * - 다중 파일 업로드 및 이미지 갤러리 렌더링.
 * 
 * [절대 깨면 안 되는 계약 - CONTRACT]
 * - MUST: Fabric.js 이미지 로딩 시 `crossOrigin: 'anonymous'` 및 널(null) 안전 검사를 수행하여 비동기 크래시를 차단할 것.
 * - MUST: 캔버스 편집기 언마운트 시 Fabric Canvas 인스턴스를 반드시 `.dispose()`하여 WebGL/2D 메모리 누수를 방지할 것.
 * 
 * [소비처 - CONSUMERS / USAGE CONTEXT]
 * - 소비처 A (packages/core/src/renderer/editor/amevaBlockSchema.ts): 커스텀 블록 스키마 레지스트리 바인딩.
 * - 소비처 B (packages/core/src/renderer/components/MarkdownEditor.tsx): 에디터 렌더러 내 이미지 블록 출력.
 */

/* 
 * [IMPORT SEGMENTATION & CONTRACTS]
 * - react: UI 상태 제어, 참조 및 생명주기 훅.
 * - @blocknote/react: BlockNote 커스텀 블록 스펙 생성기 (createReactBlockSpec).
 * - fabric: HTML5 캔버스 기반 벡터/비트맵 그래픽 편집 라이브러리.
 * - @imgly/background-removal: 온디바이스 AI 이미지 배경 제거 패키지.
 * - ../../utils/vfsDatabase: IndexedDB 기반 대용량 미디어 영구 보관소.
 * - lucide-react: 툴바 및 갤러리 제어 아이콘 셋.
 */
import React, { useState, useRef, useEffect } from 'react'
import { createReactBlockSpec } from '@blocknote/react'
import { fabric } from 'fabric'
import imglyRemoveBackground from '@imgly/background-removal'
import { saveAttachment, getAttachment } from '../../utils/vfsDatabase'
import { 
  Scissors, Plus, Trash2, Maximize2, 
  X, Sparkles, Type, Image as ImageIcon,
  Square, RefreshCw, Eye
} from 'lucide-react'

// ─── Image Canvas Editor ──────────────────────────────────────────────────────

/*
 * [FUNCTION CONTRACT]
 * - 함수 명: `ImageCanvasEditor`
 * - 역할: 전달받은 이미지 원본을 바탕으로 Fabric 캔버스를 초기화하고 모자이크, 텍스트, 배경제거 등 고급 편집 인터페이스를 제공함.
 */
/**
 * ImageCanvasEditor 컴포넌트의 핵심 비즈니스 로직 및 상태 제어를 처리합니다.
 * @remarks 이 주석은 컨벤션에 따라 자동 생성된 문서화 내용입니다.
 */
function ImageCanvasEditor({
  src,
  onApply,
  onClose
}: {
  src: string
  onApply: (newUrl: string) => void
  onClose: () => void
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  /*
   * [RUN-TIME STATE / INVARIANT]
   * - 변수 명: `fabricCanvas`
   * - 자료형 / 예상 값: fabric.Canvas 인스턴스 또는 null.
   */
  const [fabricCanvas, setFabricCanvas] = useState<fabric.Canvas | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isEraserMode, setIsEraserMode] = useState(false)
  const [hasSelection, setHasSelection] = useState(false)
  const isEraserModeRef = useRef(false)

  /**
   * [SIDE EFFECT - Fabric Canvas Mount & Image Initialization]
   * - Rationale: 캔버스 생성 및 배경 이미지 적재, 이벤트 바인딩을 수행함.
   */
  useEffect(() => {
    if (!canvasRef.current) return
    let isDisposed = false
    const canvas = new fabric.Canvas(canvasRef.current, {
      width: 800,
      height: 600,
      backgroundColor: undefined, // Transparent for exporting
    })
    setFabricCanvas(canvas)

    const onPathCreated = (e: any) => {
      if (isEraserModeRef.current) {
        e.path.globalCompositeOperation = 'destination-out'
        canvas.renderAll()
      }
    }
    canvas.on('path:created', onPathCreated)

    const onSelectionCreated = () => setHasSelection(true)
    const onSelectionCleared = () => setHasSelection(false)
    canvas.on('selection:created', onSelectionCreated)
    canvas.on('selection:updated', onSelectionCreated)
    canvas.on('selection:cleared', onSelectionCleared)

    // 안전한 비동기 이미지 로딩 및 캔버스 바운딩
    fabric.Image.fromURL(
      src,
      (img) => {
        if (isDisposed || !img || !canvas || !canvas.lowerCanvasEl) return
        const maxWidth = 800
        const maxHeight = 600
        const w = img.width || 800
        const h = img.height || 600
        let scale = 1
        if (w > maxWidth || h > maxHeight) {
          scale = Math.min(maxWidth / w, maxHeight / h)
        }
        try {
          canvas.setDimensions({ width: w * scale, height: h * scale })
          img.scale(scale)
          canvas.setBackgroundImage(img, () => {
            if (!isDisposed) {
              try { canvas.renderAll() } catch {}
            }
          })
        } catch (err) {
          console.warn('Fabric setDimensions/setBackgroundImage fallback error:', err)
        }
      },
      src.startsWith('data:') || src.startsWith('blob:') ? undefined : { crossOrigin: 'anonymous' }
    )

    return () => {
      isDisposed = true
      try {
        canvas.off('path:created', onPathCreated)
        canvas.off('selection:created', onSelectionCreated)
        canvas.off('selection:updated', onSelectionCreated)
        canvas.off('selection:cleared', onSelectionCleared)
        canvas.dispose()
      } catch {}
    }
  }, [src])

  /**
   * [SIDE EFFECT - Key Down Shortcut Handler]
   * - Rationale: Delete / Backspace 키 입력 시 현재 선택된 모자이크나 텍스트 오브젝트를 신속 삭제함.
   */
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      /*
       * [ALGORITHM BRANCH / DECISION]
       * - 조건 식: `e.key === 'Delete' || e.key === 'Backspace'`
       * - 만족 시: 텍스트 입력 중이 아니라면 활성 오브젝트 삭제.
       */
      if (e.key === 'Delete' || e.key === 'Backspace') {
        const active = fabricCanvas?.getActiveObject()
        if (active && !(active instanceof fabric.IText && (active as any).isEditing)) {
          handleDeleteSelected()
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [fabricCanvas])

  /*
   * [FUNCTION CONTRACT]
   * - 함수 명: `handleAddText`
   * - 역할: 캔버스 중심부에 편집 가능한 IText 오브젝트를 추가함.
   */
  const handleAddText = () => {
    if (!fabricCanvas) return
    const text = new fabric.IText('텍스트 입력', {
      left: 50, top: 50, fill: '#ffffff', fontSize: 36,
      fontFamily: 'Pretendard, sans-serif', stroke: '#000', strokeWidth: 1
    })
    fabricCanvas.add(text)
    fabricCanvas.setActiveObject(text)
    fabricCanvas.renderAll()
  }

  /*
   * [FUNCTION CONTRACT]
   * - 함수 명: `handleRemoveBg`
   * - 역할: imgly 라이브러리를 통해 AI 인물/사물 배경을 자동 분리 투명화함.
   */
  const handleRemoveBg = async () => {
    if (!fabricCanvas) return
    setIsProcessing(true)
    try {
      // jsdelivr CDN 경로를 명시하여 404 리소스 에러 방지
      const blob = await imglyRemoveBackground(src, {
        publicPath: 'https://cdn.jsdelivr.net/npm/@imgly/background-removal-data@1.4.3/dist/'
      })
      const url = URL.createObjectURL(blob)
      fabric.Image.fromURL(url, (img) => {
        try {
          if (img && fabricCanvas) {
            img.scaleToWidth(fabricCanvas.width!)
            fabricCanvas.setBackgroundImage(img, () => {
              try { fabricCanvas.renderAll() } catch {}
            })
          }
        } finally {
          URL.revokeObjectURL(url)
        }
      })
    } catch (e) {
      console.warn('[AmevaImageBlock] AI 배경 제거 리소스 로드 오류 (지우개 도구로 대체 가능):', e)
      alert('AI 배경 제거 온라인 모델을 로드하지 못했습니다.\n대신 [✂️ 투명 지우개] 도구를 사용하여 원하는 부분을 수동으로 투명하게 지울 수 있습니다.')
    } finally {
      setIsProcessing(false)
    }
  }

  /*
   * [FUNCTION CONTRACT]
   * - 함수 명: `handleMergeImage`
   * - 역할: 사용자가 선택한 서브 이미지를 캔버스 위에 합성 레이어로 추가함.
   */
  const handleMergeImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !fabricCanvas) return
    const url = URL.createObjectURL(file)
    fabric.Image.fromURL(url, (img) => {
      try {
        if (img) {
          img.scaleToWidth(250)
          img.set({ left: 50, top: 50 })
          fabricCanvas.add(img)
          fabricCanvas.setActiveObject(img)
          fabricCanvas.renderAll()
        }
      } finally {
        URL.revokeObjectURL(url)
      }
    })
    e.target.value = ''
  }

  /*
   * [FUNCTION CONTRACT]
   * - 함수 명: `handleAddFrame`
   * - 역할: 이미지 테두리에 안티그래비티 블루 액자 프레임을 추가함.
   */
  const handleAddFrame = () => {
    if (!fabricCanvas) return
    const rect = new fabric.Rect({
      left: 15, top: 15,
      width: (fabricCanvas.width || 800) - 30, height: (fabricCanvas.height || 600) - 30,
      fill: 'transparent',
      stroke: '#3b82f6',
      strokeWidth: 8,
      rx: 8, ry: 8,
      shadow: new fabric.Shadow({ color: 'rgba(0,0,0,0.8)', blur: 10, offsetX: 5, offsetY: 5 }),
      selectable: true,
    })
    fabricCanvas.add(rect)
    fabricCanvas.setActiveObject(rect)
    fabricCanvas.renderAll()
  }

  /*
   * [FUNCTION CONTRACT]
   * - 함수 명: `handleAddMosaic`
   * - 역할: 드래그 및 크기 조절이 가능한 Pixelate 모자이크 오버레이 박스를 생성함.
   */
  const handleAddMosaic = () => {
    if (!fabricCanvas) return
    const bgImage = fabricCanvas.backgroundImage as fabric.Image
    if (!bgImage) {
      alert("배경 이미지가 로드된 상태에서 모자이크를 추가할 수 있습니다.")
      return
    }

    const imgEl = bgImage.getElement()
    const S = bgImage.scaleX || 1
    const mosaicBox = new fabric.Image(imgEl, {
      left: 100, top: 100,
      width: 150 / S, height: 150 / S,
      cropX: 100 / S, cropY: 100 / S,
      scaleX: S, scaleY: S,
      stroke: '#60a5fa',
      strokeWidth: 2,
      strokeDashArray: [4, 4],
      cornerColor: '#3b82f6',
      cornerSize: 8,
      transparentCorners: false
    })

    mosaicBox.filters?.push(new fabric.Image.filters.Pixelate({ blocksize: 14 }))
    mosaicBox.applyFilters()

    const syncCrop = () => {
      mosaicBox.set({
        cropX: (mosaicBox.left || 0) / S,
        cropY: (mosaicBox.top || 0) / S,
      })
    }
    mosaicBox.on('moving', syncCrop)
    mosaicBox.on('scaling', syncCrop)

    fabricCanvas.add(mosaicBox)
    fabricCanvas.setActiveObject(mosaicBox)
    fabricCanvas.renderAll()
  }

  /*
   * [FUNCTION CONTRACT]
   * - 함수 명: `handleDeleteSelected`
   * - 역할: 사용자가 선택한 특정 모자이크/텍스트/개체를 캔버스에서 제거함.
   */
  const handleDeleteSelected = () => {
    if (!fabricCanvas) return
    const activeObj = fabricCanvas.getActiveObject()
    if (activeObj) {
      fabricCanvas.remove(activeObj)
      fabricCanvas.discardActiveObject()
      fabricCanvas.renderAll()
      setHasSelection(false)
    }
  }

  /*
   * [FUNCTION CONTRACT]
   * - 함수 명: `handleClearAllOverlays`
   * - 역할: 추가된 모든 모자이크, 텍스트, 액자 개체를 한 번에 초기화함.
   */
  const handleClearAllOverlays = () => {
    if (!fabricCanvas) return
    const objects = fabricCanvas.getObjects()
    objects.forEach(obj => fabricCanvas.remove(obj))
    fabricCanvas.discardActiveObject()
    fabricCanvas.renderAll()
    setHasSelection(false)
  }

  /*
   * [FUNCTION CONTRACT]
   * - 함수 명: `toggleEraser`
   * - 역할: 마우스 브러시로 직접 투명 영역을 지우는 지우개 모드 토글.
   */
  const toggleEraser = () => {
    if (!fabricCanvas) return
    const newMode = !isEraserMode
    isEraserModeRef.current = newMode
    fabricCanvas.isDrawingMode = newMode
    if (newMode) {
      fabricCanvas.freeDrawingBrush.color = '#000'
      fabricCanvas.freeDrawingBrush.width = 25
    }
    setIsEraserMode(newMode)
  }

  /*
   * [FUNCTION CONTRACT]
   * - 함수 명: `handleApply`
   * - 역할: 캔버스 내용을 PNG data URL로 추출하여 부모 컴포넌트에 최종 적용.
   */
  const handleApply = () => {
    if (!fabricCanvas) return
    const dataUrl = fabricCanvas.toDataURL({ format: 'png', quality: 1 })
    onApply(dataUrl)
  }

  return (
    <div style={{ padding: '16px', background: '#0b0f19', border: '1px solid rgba(59, 130, 246, 0.3)', borderRadius: '10px' }}>
      {/* 툴바 */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '14px', flexWrap: 'wrap', alignItems: 'center' }}>
        <button onClick={handleAddMosaic} style={toolBtnStyle} title="드래그 및 크기 조절 가능한 모자이크 블록 추가">
          🔲 모자이크 추가
        </button>
        <button 
          onClick={handleDeleteSelected} 
          disabled={!hasSelection}
          style={{ ...toolBtnStyle, background: hasSelection ? 'rgba(239, 68, 68, 0.2)' : 'rgba(255,255,255,0.05)', color: hasSelection ? '#fca5a5' : '#64748b', border: hasSelection ? '1px solid #ef4444' : '1px solid rgba(255,255,255,0.1)' }}
          title="현재 선택된 모자이크/개체 삭제 (Delete 키)"
        >
          <Trash2 size={13} />
          선택 삭제
        </button>
        <button onClick={handleClearAllOverlays} style={{ ...toolBtnStyle, background: 'rgba(255,255,255,0.06)' }} title="추가된 모든 모자이크/텍스트 레이어 초기화">
          <RefreshCw size={13} />
          효과 전체 초기화
        </button>

        <div style={{ width: '1px', height: '18px', background: 'rgba(255,255,255,0.15)', margin: '0 4px' }} />

        <button onClick={handleAddText} style={toolBtnStyle}>
          <Type size={13} />
          텍스트
        </button>
        <button onClick={handleRemoveBg} disabled={isProcessing} style={{ ...toolBtnStyle, background: 'linear-gradient(135deg, rgba(37,99,235,0.3) 0%, rgba(6,182,212,0.3) 100%)' }}>
          <Sparkles size={13} />
          {isProcessing ? 'AI 배경제거 중...' : 'AI 배경제거'}
        </button>
        <button onClick={() => document.getElementById('merge-upload')?.click()} style={toolBtnStyle}>
          <Plus size={13} />
          이미지 합성
        </button>
        <input id="merge-upload" type="file" accept="image/*" style={{ display: 'none' }} onChange={handleMergeImage} />
        <button onClick={handleAddFrame} style={toolBtnStyle}>
          <Square size={13} />
          테두리 액자
        </button>
        <button onClick={toggleEraser} style={{ ...toolBtnStyle, background: isEraserMode ? '#dc2626' : 'rgba(59, 130, 246, 0.2)', color: isEraserMode ? '#fff' : '#93c5fd' }}>
          <Scissors size={13} />
          {isEraserMode ? '지우개 끄기' : '투명 지우개'}
        </button>

        <div style={{ flex: 1 }} />
        <button onClick={onClose} style={{ ...toolBtnStyle, background: 'rgba(255, 255, 255, 0.1)', color: '#cbd5e1' }}>취소</button>
        <button onClick={handleApply} style={{ ...toolBtnStyle, background: '#2563eb', color: '#fff', fontWeight: 700, padding: '6px 16px' }}>💾 편집 완료 및 적용</button>
      </div>

      {/* 캔버스 영역 */}
      <div style={{ display: 'flex', justifyContent: 'center', border: '1px solid rgba(255,255,255,0.1)', background: 'repeating-conic-gradient(#1e293b 0% 25%, #0f172a 0% 50%) 50% / 20px 20px', borderRadius: '8px', overflow: 'hidden', padding: '12px' }}>
        <canvas ref={canvasRef} />
      </div>
    </div>
  )
}

const toolBtnStyle: React.CSSProperties = {
  background: 'rgba(59, 130, 246, 0.15)',
  border: '1px solid rgba(59, 130, 246, 0.35)',
  color: '#93c5fd',
  borderRadius: '6px',
  padding: '5px 10px',
  cursor: 'pointer',
  fontSize: '11.5px',
  fontWeight: 600,
  display: 'flex',
  alignItems: 'center',
  gap: '5px',
  transition: 'all 0.15s ease'
}

// ─── Resizable Image Card (개별 사진 상하좌우 크기조절 컴포넌트) ─────────────────────────
interface ResizableImageCardProps {
  index: number
  src: string
  alt: string
  width: number
  height: number
  isCarousel?: boolean
  isEditable?: boolean
  onResizeEnd: (index: number, width: number, height: number) => void
  onDoubleClick: () => void
  onEdit: () => void
  onDelete: () => void
}

function ResizableImageCard({
  index,
  src,
  alt,
  width,
  height,
  isCarousel,
  isEditable = true,
  onResizeEnd,
  onDoubleClick,
  onEdit,
  onDelete
}: ResizableImageCardProps) {
  const [localSize, setLocalSize] = useState<{ width: number; height: number }>({ width, height })
  const [isResizing, setIsResizing] = useState(false)
  const isDraggingRef = useRef(false)
  const startPosRef = useRef<{ x: number; y: number; startW: number; startH: number; handle: string }>({
    x: 0,
    y: 0,
    startW: width,
    startH: height,
    handle: ''
  })

  useEffect(() => {
    if (!isDraggingRef.current) {
      setLocalSize({ width, height })
    }
  }, [width, height])

  const handlePointerDown = (e: React.PointerEvent, handle: 'br' | 'r' | 'b') => {
    if (!isEditable) return
    e.stopPropagation()
    e.preventDefault()
    setIsResizing(true)
    isDraggingRef.current = true
    startPosRef.current = {
      x: e.clientX,
      y: e.clientY,
      startW: localSize.width,
      startH: localSize.height,
      handle
    }

    const onPointerMove = (moveEv: PointerEvent) => {
      if (!isDraggingRef.current) return
      const dx = moveEv.clientX - startPosRef.current.x
      const dy = moveEv.clientY - startPosRef.current.y
      const { startW, startH, handle: activeHandle } = startPosRef.current

      let newW = startW
      let newH = startH

      if (activeHandle === 'br' || activeHandle === 'r') {
        newW = Math.max(120, Math.min(1800, startW + dx))
      }
      if (activeHandle === 'br' || activeHandle === 'b') {
        newH = Math.max(90, Math.min(1400, startH + dy))
      }

      setLocalSize({ width: newW, height: newH })
    }

    const onPointerUp = (upEv: PointerEvent) => {
      isDraggingRef.current = false
      setIsResizing(false)
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('pointerup', onPointerUp)

      const dx = upEv.clientX - startPosRef.current.x
      const dy = upEv.clientY - startPosRef.current.y
      const { startW, startH, handle: activeHandle } = startPosRef.current

      let finalW = startW
      let finalH = startH

      if (activeHandle === 'br' || activeHandle === 'r') {
        finalW = Math.max(120, Math.min(1800, startW + dx))
      }
      if (activeHandle === 'br' || activeHandle === 'b') {
        finalH = Math.max(90, Math.min(1400, startH + dy))
      }

      onResizeEnd(index, finalW, finalH)
    }

    window.addEventListener('pointermove', onPointerMove)
    window.addEventListener('pointerup', onPointerUp)
  }

  // VFS URL이 아직 blob으로 해석되지 않았을 경우 브라우저 직접 로드(CSP 에러) 방지
  const safeSrc = src && !src.startsWith('ameva-vfs://') 
    ? src 
    : 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3C/svg%3E'

  return (
    <div
      style={{
        position: 'relative',
        width: `${localSize.width}px`,
        height: `${localSize.height}px`,
        flex: isCarousel ? '0 0 auto' : undefined,
        borderRadius: '8px',
        overflow: 'hidden',
        border: isResizing ? '1.5px solid #3b82f6' : '1px solid var(--border-muted)',
        background: 'var(--bg-card)',
        boxShadow: isResizing ? '0 0 14px rgba(59, 130, 246, 0.5)' : undefined,
        userSelect: isResizing ? 'none' : 'auto',
        transition: isResizing ? 'none' : 'border-color 0.15s',
        boxSizing: 'border-box'
      }}
    >
      <img
        src={safeSrc}
        alt={alt}
        onDoubleClick={onDoubleClick}
        style={{ width: '100%', height: '100%', objectFit: 'contain', cursor: 'zoom-in', display: 'block' }}
      />

      {/* 오버레이 액션 버튼들 (편집 모드에서만 표시) */}
      {isEditable && (
        <div style={{ position: 'absolute', top: '6px', right: '6px', display: 'flex', gap: '4px', zIndex: 10 }}>
          <button onClick={onDoubleClick} title="크게 보기 (더블클릭)" style={cardActionBtnStyle}>
            <Eye size={12} />
          </button>
          <button onClick={onEdit} title="이 사진 편집" style={cardActionBtnStyle}>
            <Scissors size={12} />
          </button>
          <button onClick={onDelete} title="이 사진 삭제" style={{ ...cardActionBtnStyle, color: '#f87171' }}>
            <X size={12} />
          </button>
        </div>
      )}

      {/* 리사이징 중 실시간 해상도 툴팁 */}
      {isResizing && isEditable && (
        <div
          style={{
            position: 'absolute',
            bottom: '8px',
            left: '8px',
            background: 'rgba(15, 23, 42, 0.92)',
            border: '1px solid rgba(59, 130, 246, 0.5)',
            color: '#93c5fd',
            fontSize: '11px',
            padding: '2px 8px',
            borderRadius: '4px',
            fontWeight: 700,
            zIndex: 20,
            pointerEvents: 'none',
            backdropFilter: 'blur(4px)'
          }}
        >
          {Math.round(localSize.width)} × {Math.round(localSize.height)}
        </div>
      )}

      {/* 우측 핸들 (너비 조절 - 편집 모드에서만 활성화) */}
      {isEditable && (
        <div
          onPointerDown={(e) => handlePointerDown(e, 'r')}
          title="가로 크기 조절 (드래그)"
          style={{
            position: 'absolute',
            top: 0,
            right: 0,
            width: '8px',
            height: '100%',
            cursor: 'ew-resize',
            zIndex: 15
          }}
        />
      )}

      {/* 하단 핸들 (높이 조절 - 편집 모드에서만 활성화) */}
      {isEditable && (
        <div
          onPointerDown={(e) => handlePointerDown(e, 'b')}
          title="세로 크기 조절 (드래그)"
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            width: '100%',
            height: '8px',
            cursor: 'ns-resize',
            zIndex: 15
          }}
        />
      )}

      {/* 우하단 모서리 핸들 (상하좌우 동시 조절 - 편집 모드에서만 활성화) */}
      {isEditable && (
        <div
          onPointerDown={(e) => handlePointerDown(e, 'br')}
          title="상하좌우 크기 조절 (드래그)"
          style={{
            position: 'absolute',
            bottom: 0,
            right: 0,
            width: '18px',
            height: '18px',
            cursor: 'nwse-resize',
            zIndex: 20,
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'flex-end',
            padding: '3px'
          }}
        >
          <div
            style={{
              width: '8px',
              height: '8px',
              borderRight: '2px solid #60a5fa',
              borderBottom: '2px solid #60a5fa',
              borderRadius: '1px'
            }}
          />
        </div>
      )}
    </div>
  )
}

// ─── 메인 블록 정의 ───────────────────────────────────────────────────────────

/*
 * [FUNCTION CONTRACT]
 * - 함수 명: `AmevaImageBlockSpec`
 * - 역할: BlockNote React 블록 스펙 규격에 맞춰 갤러리/단일 이미지 뷰어 컴포넌트를 선언함.
 */

export interface AmevaImageGalleryViewerProps {
  url?: string
  caption?: string
  previewWidth?: string
  viewMode?: 'grid' | 'carousel' | string
  cardSizes?: string
  editor?: any
  blockId?: string
  onUpdateProps?: (newProps: Partial<{ url: string; caption: string; previewWidth: string; viewMode: string; cardSizes: string }>) => void
  isEditable?: boolean
}

export function AmevaImageGalleryViewer({
  url = '',
  caption = '',
  previewWidth = '380',
  viewMode = 'grid',
  cardSizes = '{}',
  editor,
  blockId = 'image-block',
  onUpdateProps,
  isEditable = true
}: AmevaImageGalleryViewerProps) {
  const [internalUrl, setInternalUrl] = useState(url)
  const [internalViewMode, setInternalViewMode] = useState(viewMode)
  const [internalPreviewWidth, setInternalPreviewWidth] = useState(previewWidth)
  const [internalCardSizes, setInternalCardSizes] = useState(cardSizes)

  useEffect(() => { setInternalUrl(url) }, [url])
  useEffect(() => { setInternalViewMode(viewMode) }, [viewMode])
  useEffect(() => { setInternalPreviewWidth(previewWidth) }, [previewWidth])
  useEffect(() => { setInternalCardSizes(cardSizes) }, [cardSizes])

  const effectiveUrl = internalUrl
  const effectiveViewMode = internalViewMode
  const effectivePreviewWidth = internalPreviewWidth
  const effectiveCardSizes = internalCardSizes

  const updateAttributes = (newProps: any) => {
    if (newProps.url !== undefined) setInternalUrl(newProps.url)
    if (newProps.viewMode !== undefined) setInternalViewMode(newProps.viewMode)
    if (newProps.previewWidth !== undefined) setInternalPreviewWidth(newProps.previewWidth)
    if (newProps.cardSizes !== undefined) setInternalCardSizes(newProps.cardSizes)

    if (editor && blockId && editor.updateBlock) {
      editor.updateBlock(blockId, {
        type: 'image',
        props: newProps
      } as any)
    }
    onUpdateProps?.(newProps)
  }

  let urls: string[] = []
  if (effectiveUrl) {
    if (effectiveUrl.startsWith('[')) {
      try { urls = JSON.parse(effectiveUrl) } catch { urls = [effectiveUrl] }
    } else {
      urls = [effectiveUrl]
    }
  }

  let parsedCardSizes: Record<number, { width: number; height: number }> = {}
  try {
    if (effectiveCardSizes) {
      parsedCardSizes = JSON.parse(effectiveCardSizes)
    }
  } catch {}

  const [resolvedUrls, setResolvedUrls] = useState<string[]>([])
  useEffect(() => {
    let active = true
    const createdUrls: string[] = []

    Promise.all(urls.map(async u => {
      if (u.startsWith('ameva-vfs://')) {
        const fileId = u.replace('ameva-vfs://', '')
        try {
          const blob = await getAttachment(fileId)
          if (blob) {
            const objectUrl = URL.createObjectURL(blob)
            createdUrls.push(objectUrl)
            return objectUrl
          }
          return u
        } catch {
          return u
        }
      }
      return u
    })).then(res => {
      if (active) setResolvedUrls(res)
    })

    return () => {
      active = false
      createdUrls.forEach(u => URL.revokeObjectURL(u))
    }
  }, [effectiveUrl])

  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const currentWidth = parseInt(effectivePreviewWidth || '380', 10) || 380

  const handleAddFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length > 0) {
      const newVfsUrls = await Promise.all(files.map(async f => {
        const fileId = `media-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
        await saveAttachment(fileId, f)
        return `ameva-vfs://${fileId}`
      }))
      const updatedUrls = [...urls, ...newVfsUrls]
      updateAttributes({ url: JSON.stringify(updatedUrls) })
    }
    e.target.value = ''
  }

  const handleDeleteImage = (indexToRemove: number) => {
    const updatedUrls = urls.filter((_, idx) => idx !== indexToRemove)
    updateAttributes({ url: JSON.stringify(updatedUrls) })
  }

  const handleApplyEdit = async (idx: number, newUrl: string) => {
    const res = await fetch(newUrl)
    const blob = await res.blob()
    const fileId = `media-export-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
    await saveAttachment(fileId, blob)

    const newUrls = [...urls]
    newUrls[idx] = `ameva-vfs://${fileId}`
    updateAttributes({ url: JSON.stringify(newUrls) })
    setEditingIndex(null)
  }

  const setViewModeFn = (mode: string) => {
    updateAttributes({ viewMode: mode })
  }

  const setWidth = (w: number) => {
    updateAttributes({ previewWidth: String(w), cardSizes: '{}' })
  }

  const handleCardResizeEnd = (idx: number, newW: number, newH: number) => {
    const updatedSizes = {
      ...parsedCardSizes,
      [idx]: { width: Math.round(newW), height: Math.round(newH) }
    }
    updateAttributes({ cardSizes: JSON.stringify(updatedSizes) })
  }

  const openLightbox = (imgUrl: string) => {
    window.dispatchEvent(new CustomEvent('ameva:open-lightbox', { detail: { url: imgUrl } }))
  }

  const effectiveEditable = isEditable && (editor ? editor.isEditable !== false : true)

  if (urls.length === 0) {
    if (!effectiveEditable) return null
    return (
      <div 
        style={{
          border: '2px dashed rgba(59, 130, 246, 0.4)', borderRadius: '10px', padding: '36px',
          textAlign: 'center', color: '#94a3b8', background: 'rgba(15, 23, 42, 0.6)', cursor: 'pointer',
          transition: 'border-color 0.2s', maxWidth: '100%', boxSizing: 'border-box'
        }}
        onClick={() => document.getElementById(`image-upload-${blockId}`)?.click()}
      >
        <div style={{ fontSize: '32px', marginBottom: '8px' }}>🖼️</div>
        <div style={{ fontSize: '13.5px', fontWeight: 700, color: '#f1f5f9', marginBottom: '4px' }}>클릭하여 이미지 파일 업로드</div>
        <div style={{ fontSize: '11.5px', color: '#64748b' }}>여러 장의 사진을 한 번에 선택하여 갤러리로 구성할 수 있습니다</div>
        <input
          id={`image-upload-${blockId}`}
          type="file"
          accept="image/*,.jpg,.jpeg,.png,.gif,.webp,.bmp,.svg"
          multiple
          style={{ display: 'none' }}
          onChange={handleAddFiles}
        />
      </div>
    )
  }

  if (editingIndex !== null && resolvedUrls[editingIndex]) {
    return (
      <ImageCanvasEditor 
        src={resolvedUrls[editingIndex]} 
        onApply={(newUrl) => handleApplyEdit(editingIndex, newUrl)}
        onClose={() => setEditingIndex(null)}
      />
    )
  }

  return (
    <div style={{ 
      background: '#090d16', 
      border: '1px solid rgba(59, 130, 246, 0.25)', 
      borderRadius: '10px', 
      padding: effectiveEditable ? '14px' : '8px',
      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
      maxWidth: '100%',
      width: '100%',
      boxSizing: 'border-box',
      overflow: 'hidden'
    }}>
      {/* 상단 헤더 바 (편집 모드에서만 표시) */}
      {effectiveEditable && (
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ color: '#60a5fa', fontSize: '13px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
              <ImageIcon size={16} />
              이미지 갤러리 ({urls.length}장)
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {/* 크기 조절 프리셋 */}
            <div style={{ display: 'flex', background: 'rgba(255,255,255,0.06)', borderRadius: '6px', padding: '2px', border: '1px solid rgba(255,255,255,0.08)' }}>
              {[
                { label: '작게', val: 240 },
                { label: '중간', val: 380 },
                { label: '크게', val: 560 },
                { label: '100%', val: 900 }
              ].map(item => (
                <button
                  key={item.val}
                  onClick={() => setWidth(item.val)}
                  style={{
                    padding: '3px 8px',
                    fontSize: '11px',
                    fontWeight: 600,
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    background: currentWidth === item.val ? '#2563eb' : 'transparent',
                    color: currentWidth === item.val ? '#fff' : '#94a3b8'
                  }}
                >
                  {item.label}
                </button>
              ))}
            </div>

            {/* 편집 가위 버튼 */}
            <button
              onClick={() => setEditingIndex(0)}
              style={{
                background: 'rgba(59, 130, 246, 0.18)',
                border: '1px solid rgba(59, 130, 246, 0.4)',
                color: '#93c5fd',
                borderRadius: '6px',
                padding: '4px 10px',
                fontSize: '11.5px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '5px'
              }}
              title="이미지 캔버스 편집기 열기"
            >
              <Scissors size={13} />
              <span>편집</span>
            </button>

            {/* 사진 추가 + 버튼 */}
            <button
              onClick={() => document.getElementById(`image-add-${blockId}`)?.click()}
              style={{
                background: 'linear-gradient(135deg, #2563eb 0%, #06b6d4 100%)',
                border: 'none',
                color: '#fff',
                borderRadius: '6px',
                padding: '4px 10px',
                fontSize: '11.5px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                boxShadow: '0 2px 8px rgba(37, 99, 235, 0.3)'
              }}
              title="사진 추가 업로드"
            >
              <Plus size={14} />
              <span>사진 추가</span>
            </button>
            <input
              id={`image-add-${blockId}`}
              type="file"
              accept="image/*,.jpg,.jpeg,.png,.gif,.webp,.bmp,.svg"
              multiple
              style={{ display: 'none' }}
              onChange={handleAddFiles}
            />

            {/* 뷰 모드 셀렉트 */}
            <select 
              value={effectiveViewMode}
              onChange={(e) => setViewModeFn(e.target.value)}
              style={{ 
                background: '#131c2e', 
                color: '#f1f5f9', 
                border: '1px solid rgba(59, 130, 246, 0.35)', 
                borderRadius: '6px', 
                padding: '4px 8px', 
                fontSize: '11.5px',
                fontWeight: 600,
                cursor: 'pointer',
                outline: 'none'
              }}
            >
              <option value="grid">격자형 (Grid)</option>
              <option value="carousel">좌우 스크롤 (Carousel)</option>
            </select>
          </div>
        </div>
      )}

      {/* 갤러리 뷰 */}
      {effectiveViewMode === 'grid' ? (
        <div style={{ 
          display: 'flex',
          flexWrap: 'wrap',
          gap: '14px',
          maxWidth: '100%',
          width: '100%',
          boxSizing: 'border-box'
        }}>
          {resolvedUrls.map((u, i) => {
            const cardSize = parsedCardSizes[i] || {
              width: currentWidth,
              height: Math.round(currentWidth * 0.75)
            }
            return (
              <ResizableImageCard
                key={i}
                index={i}
                src={u}
                alt={`사진 ${i + 1}`}
                width={cardSize.width}
                height={cardSize.height}
                isCarousel={false}
                isEditable={effectiveEditable}
                onResizeEnd={handleCardResizeEnd}
                onDoubleClick={() => openLightbox(u)}
                onEdit={() => setEditingIndex(i)}
                onDelete={() => handleDeleteImage(i)}
              />
            )
          })}

          {/* 그리드 끝에 배치되는 + 사진 추가 타일 (편집 모드에서만 표시) */}
          {effectiveEditable && (
            <div
              onClick={() => document.getElementById(`image-add-${blockId}`)?.click()}
              style={{
                width: `${currentWidth}px`,
                minHeight: `${Math.round(currentWidth * 0.75)}px`,
                border: '2px dashed rgba(59, 130, 246, 0.3)',
                borderRadius: '8px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                color: '#60a5fa',
                background: 'rgba(59, 130, 246, 0.05)',
                cursor: 'pointer',
                transition: 'background 0.2s',
                boxSizing: 'border-box'
              }}
            >
              <Plus size={24} />
              <span style={{ fontSize: '12px', fontWeight: 600 }}>새 사진 추가</span>
            </div>
          )}
        </div>
      ) : (
        <div 
          style={{ 
            display: 'flex', 
            gap: '14px', 
            overflowX: 'auto', 
            overflowY: 'hidden',
            maxWidth: '100%', 
            width: '100%', 
            boxSizing: 'border-box', 
            paddingBottom: effectiveEditable ? '14px' : '4px',
            paddingTop: '2px',
            paddingLeft: '2px',
            paddingRight: '2px',
            WebkitOverflowScrolling: 'touch'
          }}
        >
          {resolvedUrls.map((u, i) => {
            const cardSize = parsedCardSizes[i] || {
              width: currentWidth,
              height: Math.round(currentWidth * 0.75)
            }
            return (
              <ResizableImageCard
                key={i}
                index={i}
                src={u}
                alt={`사진 ${i + 1}`}
                width={cardSize.width}
                height={cardSize.height}
                isCarousel={true}
                isEditable={effectiveEditable}
                onResizeEnd={handleCardResizeEnd}
                onDoubleClick={() => openLightbox(u)}
                onEdit={() => setEditingIndex(i)}
                onDelete={() => handleDeleteImage(i)}
              />
            )
          })}
        </div>
      )}
    </div>
  )
}

export const AmevaImageBlockSpec = createReactBlockSpec(
  {
    type: 'image',
    propSchema: {
      url: { default: '' },
      caption: { default: '' },
      showPreview: { default: 'true' },
      previewWidth: { default: '380' },
      viewMode: { default: 'grid' },
      cardSizes: { default: '{}' },
    },
    content: 'none',
  },
  {
    render: (props) => (
      <AmevaImageGalleryViewer
        url={props.block.props.url}
        caption={props.block.props.caption}
        previewWidth={props.block.props.previewWidth}
        viewMode={props.block.props.viewMode}
        cardSizes={props.block.props.cardSizes}
        editor={props.editor}
        blockId={props.block.id}
        isEditable={props.editor?.isEditable !== false}
      />
    ),
    toExternalHTML: ({ block }) => {
      let urls: string[] = []
      const url = block.props.url
      if (url) {
        if (url.startsWith('[')) {
          try { urls = JSON.parse(url) } catch { urls = [url] }
        } else {
          urls = [url]
        }
      }
      return (
        <div data-content-type="image" data-view-mode={block.props.viewMode || 'grid'} data-url={block.props.url} data-card-sizes={block.props.cardSizes}>
          {urls.map((u, i) => {
            const safeU = u && !u.startsWith('ameva-vfs://') ? u : ''
            return <img key={i} src={safeU} data-vfs={u} alt={block.props.caption || `image ${i + 1}`} />
          })}
        </div>
      )
    }
  }
)

const cardActionBtnStyle: React.CSSProperties = {
  background: 'rgba(15, 23, 42, 0.85)',
  border: '1px solid rgba(255, 255, 255, 0.15)',
  color: '#e2e8f0',
  borderRadius: '5px',
  padding: '4px 6px',
  fontSize: '11px',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  backdropFilter: 'blur(4px)',
  transition: 'background 0.15s ease'
}

export const AmevaImageBlock = AmevaImageBlockSpec()
