import React, { useState, useRef, useEffect } from 'react'
import { createReactBlockSpec } from '@blocknote/react'
import { fabric } from 'fabric'
import imglyRemoveBackground from '@imgly/background-removal'
import { saveAttachment, getAttachment } from '../../utils/vfsDatabase'

// ─── Image Canvas Editor ──────────────────────────────────────────────────────
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
  const [fabricCanvas, setFabricCanvas] = useState<fabric.Canvas | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isEraserMode, setIsEraserMode] = useState(false)
  const isEraserModeRef = useRef(false)

  useEffect(() => {
    if (!canvasRef.current) return
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

    fabric.Image.fromURL(src, (img) => {
      // 이미지 크기에 맞게 캔버스 조정
      const maxWidth = 800
      const maxHeight = 600
      let scale = 1
      if (img.width! > maxWidth || img.height! > maxHeight) {
        scale = Math.min(maxWidth / img.width!, maxHeight / img.height!)
      }
      canvas.setWidth(img.width! * scale)
      canvas.setHeight(img.height! * scale)
      
      img.scale(scale)
      canvas.setBackgroundImage(img, canvas.renderAll.bind(canvas))
    }, { crossOrigin: 'anonymous' })

    return () => {
      canvas.off('path:created', onPathCreated)
      canvas.dispose()
    }
  }, [src])

  const handleAddText = () => {
    if (!fabricCanvas) return
    const text = new fabric.IText('텍스트 입력', {
      left: 50, top: 50, fill: '#ffffff', fontSize: 40,
      fontFamily: 'Pretendard', stroke: '#000', strokeWidth: 1
    })
    fabricCanvas.add(text)
    fabricCanvas.setActiveObject(text)
  }

  const handleRemoveBg = async () => {
    if (!fabricCanvas) return
    setIsProcessing(true)
    try {
      const blob = await imglyRemoveBackground(src)
      const url = URL.createObjectURL(blob)
      fabric.Image.fromURL(url, (img) => {
        // 기존 배경 제거 후 새 투명 이미지로 교체
        const bg = fabricCanvas.backgroundImage as fabric.Image
        if (bg) {
          img.scaleToWidth(fabricCanvas.width!)
          fabricCanvas.setBackgroundImage(img, fabricCanvas.renderAll.bind(fabricCanvas))
        }
      })
    } catch (e) {
      console.error(e)
      alert('배경 제거에 실패했습니다.')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleMergeImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !fabricCanvas) return
    const url = URL.createObjectURL(file)
    fabric.Image.fromURL(url, (img) => {
      img.scaleToWidth(300)
      img.set({ left: 50, top: 50 })
      fabricCanvas.add(img)
      fabricCanvas.setActiveObject(img)
    })
    e.target.value = '' // reset
  }

  const handleAddFrame = () => {
    if (!fabricCanvas) return
    const rect = new fabric.Rect({
      left: 20, top: 20,
      width: fabricCanvas.width! - 40, height: fabricCanvas.height! - 40,
      fill: 'transparent',
      stroke: '#d4af37', // Gold
      strokeWidth: 16,
      rx: 10, ry: 10,
      shadow: new fabric.Shadow({ color: 'rgba(0,0,0,0.8)', blur: 15, offsetX: 10, offsetY: 10 }),
      selectable: false, evented: false,
    })
    const innerRect = new fabric.Rect({
      left: 32, top: 32,
      width: fabricCanvas.width! - 64, height: fabricCanvas.height! - 64,
      fill: 'transparent',
      stroke: '#ffffff',
      strokeWidth: 2,
      rx: 6, ry: 6,
      selectable: false, evented: false,
      opacity: 0.5
    })
    fabricCanvas.add(rect, innerRect)
  }

  const handleAddMosaic = () => {
    if (!fabricCanvas) return
    const bgImage = fabricCanvas.backgroundImage as fabric.Image
    if (!bgImage) {
      alert("배경 이미지가 존재해야 모자이크를 적용할 수 있습니다.")
      return
    }

    const imgEl = bgImage.getElement()
    const S = bgImage.scaleX || 1
    const mosaicBox = new fabric.Image(imgEl, {
      left: 100, top: 100,
      width: 150 / S, height: 150 / S,
      cropX: 100 / S, cropY: 100 / S,
      scaleX: S, scaleY: S,
      stroke: 'rgba(255,255,255,0.5)',
      strokeWidth: 2,
      strokeDashArray: [5, 5]
    })

    mosaicBox.filters?.push(new fabric.Image.filters.Pixelate({ blocksize: 15 }))
    mosaicBox.applyFilters()

    const syncCrop = () => {
      mosaicBox.set({
        cropX: mosaicBox.left! / S,
        cropY: mosaicBox.top! / S,
      })
    }
    mosaicBox.on('moving', syncCrop)
    mosaicBox.on('scaling', syncCrop)

    fabricCanvas.add(mosaicBox)
    fabricCanvas.setActiveObject(mosaicBox)
  }

  const toggleEraser = () => {
    if (!fabricCanvas) return
    const newMode = !isEraserMode
    isEraserModeRef.current = newMode
    fabricCanvas.isDrawingMode = newMode
    if (newMode) {
      fabricCanvas.freeDrawingBrush.color = '#000' // Color doesn't matter for destination-out
      fabricCanvas.freeDrawingBrush.width = 30
    }
    setIsEraserMode(newMode)
  }

  const handleApply = () => {
    if (!fabricCanvas) return
    const dataUrl = fabricCanvas.toDataURL({ format: 'png', quality: 1 })
    onApply(dataUrl)
  }

  return (
    <div style={{ padding: '16px', background: '#1a1a24', borderRadius: '8px' }}>
      <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', flexWrap: 'wrap' }}>
        <button onClick={handleAddText} style={btnStyle}>📝 텍스트 추가</button>
        <button onClick={handleRemoveBg} disabled={isProcessing} style={btnStyle}>
          {isProcessing ? '⏳ AI 배경제거 중...' : '✨ AI 배경제거'}
        </button>
        <button onClick={() => document.getElementById('merge-upload')?.click()} style={btnStyle}>➕ 이미지 병합</button>
        <input id="merge-upload" type="file" accept="image/*" style={{ display: 'none' }} onChange={handleMergeImage} />
        <button onClick={handleAddFrame} style={btnStyle}>🖼️ 고급 액자</button>
        <button onClick={handleAddMosaic} style={btnStyle}>🔲 진짜 모자이크(Pixelate)</button>
        <button onClick={toggleEraser} style={{ ...btnStyle, background: isEraserMode ? '#ef4444' : '#3b82f6' }}>
          {isEraserMode ? '🛑 지우개 종료' : '✂️ 투명 지우개'}
        </button>

        <div style={{ flex: 1 }} />
        <button onClick={onClose} style={{ ...btnStyle, background: '#4b5563' }}>취소</button>
        <button onClick={handleApply} style={{ ...btnStyle, background: '#10b981' }}>💾 적용하기</button>
      </div>
      <div style={{ display: 'flex', justifyContent: 'center', border: '1px solid #333', background: 'repeating-conic-gradient(#333 0% 25%, #1a1a24 0% 50%) 50% / 20px 20px', borderRadius: '4px', overflow: 'hidden' }}>
        <canvas ref={canvasRef} />
      </div>
    </div>
  )
}

const btnStyle = {
  background: '#3b82f6', border: 'none', color: '#fff', borderRadius: '6px',
  padding: '6px 12px', cursor: 'pointer', fontSize: '12px'
}

// ─── 메인 블록 정의 ───────────────────────────────────────────────────────────
export const AmevaImageBlockSpec = createReactBlockSpec(
  {
    type: 'image',
    propSchema: {
      url: { default: '' },
      caption: { default: '' },
      showPreview: { default: 'true' },
      previewWidth: { default: '512' },
      viewMode: { default: 'grid' },
    },
    content: 'none',
  },
  {
    render: (props) => {
      const { url, viewMode } = props.block.props
      
      let urls: string[] = []
      if (url) {
        if (url.startsWith('[')) {
          try { urls = JSON.parse(url) } catch { urls = [url] }
        } else {
          urls = [url]
        }
      }

      const [resolvedUrls, setResolvedUrls] = useState<string[]>([])
      useEffect(() => {
        Promise.all(urls.map(async u => {
          if (u.startsWith('ameva-vfs://')) {
            const fileId = u.replace('ameva-vfs://', '')
            try {
              const blob = await getAttachment(fileId)
              return blob ? URL.createObjectURL(blob) : u
            } catch {
              return u
            }
          }
          return u
        })).then(setResolvedUrls)
      }, [url])

      const [editingIndex, setEditingIndex] = useState<number | null>(null)

      const handleFilesChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || [])
        if (files.length > 0) {
          const newUrls = await Promise.all(files.map(async f => {
            const fileId = `media-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
            await saveAttachment(fileId, f)
            return `ameva-vfs://${fileId}`
          }))
          props.editor.updateBlock(props.block.id, {
            type: 'image',
            props: { ...props.block.props, url: JSON.stringify(newUrls) }
          } as any)
        }
      }

      const handleApplyEdit = async (idx: number, newUrl: string) => {
        const res = await fetch(newUrl)
        const blob = await res.blob()
        const fileId = `media-export-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
        await saveAttachment(fileId, blob)

        const newUrls = [...urls]
        newUrls[idx] = `ameva-vfs://${fileId}`
        props.editor.updateBlock(props.block.id, {
          type: 'image',
          props: { ...props.block.props, url: JSON.stringify(newUrls) }
        } as any)
        setEditingIndex(null)
      }

      const setViewMode = (mode: string) => {
        props.editor.updateBlock(props.block.id, {
          type: 'image',
          props: { ...props.block.props, viewMode: mode }
        } as any)
      }

      if (urls.length === 0) {
        return (
          <div 
            style={{
              border: '2px dashed #3a3a4a', borderRadius: '10px', padding: '40px',
              textAlign: 'center', color: '#888', background: '#0d0d1a', cursor: 'pointer'
            }}
            onClick={() => document.getElementById(`image-upload-${props.block.id}`)?.click()}
          >
            <div style={{ fontSize: '36px', marginBottom: '12px' }}>🖼️</div>
            <div style={{ fontSize: '14px', fontWeight: 600, color: '#e2e8f0', marginBottom: '8px' }}>클릭하여 이미지 파일 업로드</div>
            <div style={{ fontSize: '12px' }}>여러 이미지를 선택할 수 있습니다</div>
            <input
              id={`image-upload-${props.block.id}`}
              type="file"
              accept="image/*,.jpg,.jpeg,.png,.gif,.webp,.bmp,.svg"
              multiple
              style={{ display: 'none' }}
              onChange={handleFilesChange}
            />
          </div>
        )
      }

      if (editingIndex !== null) {
        return (
          <ImageCanvasEditor 
            src={resolvedUrls[editingIndex]} 
            onApply={(newUrl) => handleApplyEdit(editingIndex, newUrl)}
            onClose={() => setEditingIndex(null)}
          />
        )
      }

      return (
        <div style={{ background: '#0d0d1a', border: '1px solid #1e1e3a', borderRadius: '10px', padding: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', alignItems: 'center' }}>
            <span style={{ color: '#fff', fontSize: '13px', fontWeight: 600 }}>🖼️ 이미지 갤러리 ({urls.length}장)</span>
            <select 
              value={viewMode}
              onChange={(e) => setViewMode(e.target.value)}
              style={{ background: '#1a1a24', color: '#fff', border: '1px solid #333', borderRadius: '4px', padding: '4px 8px', fontSize: '12px' }}
            >
              <option value="grid">격자형 (Grid)</option>
              <option value="carousel">좌우 스크롤 (Carousel)</option>
            </select>
          </div>

          {viewMode === 'grid' ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '12px' }}>
              {resolvedUrls.map((u, i) => (
                <div key={i} style={{ position: 'relative' }}>
                  <img src={u} style={{ width: '100%', aspectRatio: '1', objectFit: 'cover', borderRadius: '8px' }} />
                  <button 
                    onClick={() => setEditingIndex(i)}
                    style={{ position: 'absolute', top: '4px', right: '4px', background: 'rgba(0,0,0,0.6)', border: 'none', color: '#fff', borderRadius: '4px', padding: '4px 8px', fontSize: '11px', cursor: 'pointer' }}
                  >
                    ✂️ 편집
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ display: 'flex', gap: '12px', overflowX: 'auto', paddingBottom: '12px' }}>
              {resolvedUrls.map((u, i) => (
                <div key={i} style={{ position: 'relative', flex: '0 0 auto', width: '300px' }}>
                  <img src={u} style={{ width: '100%', height: '300px', objectFit: 'cover', borderRadius: '8px' }} />
                  <button 
                    onClick={() => setEditingIndex(i)}
                    style={{ position: 'absolute', top: '8px', right: '8px', background: 'rgba(0,0,0,0.6)', border: 'none', color: '#fff', borderRadius: '4px', padding: '4px 8px', fontSize: '11px', cursor: 'pointer' }}
                  >
                    ✂️ 편집
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )
    }
  }
)

export const AmevaImageBlock = AmevaImageBlockSpec()
