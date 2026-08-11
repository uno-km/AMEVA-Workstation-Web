/**
 * ============================================================================
 * @file KnowledgeGraphViewer.tsx
 * @description 캔버스 렌더링 루프 및 Worker 연동
 * ============================================================================
 */
import React, { useEffect, useRef, useState, useCallback } from 'react'

export const KnowledgeGraphViewer: React.FC<{ nodes: any[], edges: any[], width?: number, height?: number }> = ({ nodes: initialNodes, edges, width = 800, height = 400 }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const workerRef = useRef<Worker | null>(null)
  const [nodes, setNodes] = useState(initialNodes)
  
  // Transform for pan/zoom
  const transformRef = useRef({ x: 0, y: 0, scale: 1 })
  const isDraggingRef = useRef(false)
  const dragStartRef = useRef({ x: 0, y: 0 })

  useEffect(() => {
    // Worker setup
    workerRef.current = new Worker(new URL('./graphWorker.ts', import.meta.url), { type: 'module' })
    
    workerRef.current.onmessage = (e) => {
      if (e.data.type === 'TICK_DONE') {
        setNodes(e.data.nodes)
        requestAnimationFrame(tick)
      }
    }

    tick()

    return () => {
      workerRef.current?.terminate()
    }
  }, [edges])

  const tick = useCallback(() => {
    if (workerRef.current) {
      workerRef.current.postMessage({
        type: 'TICK',
        nodes,
        edges
      })
    }
  }, [nodes, edges])

  // Canvas render loop
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      
      ctx.save()
      const t = transformRef.current
      ctx.translate(t.x, t.y)
      ctx.scale(t.scale, t.scale)

      // Draw edges
      ctx.strokeStyle = '#888'
      ctx.lineWidth = 1.5
      edges.forEach(edge => {
        const source = nodes.find(n => n.id === edge.source)
        const target = nodes.find(n => n.id === edge.target)
        if (source && target) {
          ctx.beginPath()
          ctx.moveTo(source.x, source.y)
          ctx.lineTo(target.x, target.y)
          ctx.stroke()
          
          // Arrow
          const angle = Math.atan2(target.y - source.y, target.x - source.x)
          ctx.beginPath()
          ctx.moveTo(target.x - 10 * Math.cos(angle - Math.PI / 6), target.y - 10 * Math.sin(angle - Math.PI / 6))
          ctx.lineTo(target.x, target.y)
          ctx.lineTo(target.x - 10 * Math.cos(angle + Math.PI / 6), target.y - 10 * Math.sin(angle + Math.PI / 6))
          ctx.stroke()
        }
      })

      // Draw nodes
      nodes.forEach(node => {
        // Circle
        ctx.fillStyle = node.color || '#3b82f6'
        ctx.beginPath()
        ctx.arc(node.x, node.y, node.size || 15, 0, Math.PI * 2)
        ctx.fill()
        
        // Label
        ctx.fillStyle = '#fff'
        ctx.font = '12px sans-serif'
        ctx.textAlign = 'center'
        ctx.fillText(node.label || '', node.x, node.y + (node.size || 15) + 14)
      })
      
      ctx.restore()
      requestAnimationFrame(render)
    }
    
    const af = requestAnimationFrame(render)
    return () => cancelAnimationFrame(af)
  }, [nodes, edges])

  // Pan / Zoom handlers
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault()
    const zoomIntensity = 0.1
    const delta = e.deltaY > 0 ? -zoomIntensity : zoomIntensity
    transformRef.current.scale = Math.max(0.1, transformRef.current.scale + delta)
  }

  const handlePointerDown = (e: React.PointerEvent) => {
    isDraggingRef.current = true
    dragStartRef.current = { x: e.clientX - transformRef.current.x, y: e.clientY - transformRef.current.y }
    e.currentTarget.setPointerCapture(e.pointerId)
  }

  const handlePointerMove = (e: React.PointerEvent) => {
    if (isDraggingRef.current) {
      transformRef.current.x = e.clientX - dragStartRef.current.x
      transformRef.current.y = e.clientY - dragStartRef.current.y
    }
  }

  const handlePointerUp = (e: React.PointerEvent) => {
    isDraggingRef.current = false
    e.currentTarget.releasePointerCapture(e.pointerId)
  }

  return (
    <canvas 
      ref={canvasRef} 
      width={width} 
      height={height}
      style={{ border: '1px solid #333', background: '#18181c', borderRadius: '4px', display: 'block', touchAction: 'none' }} 
      onWheel={handleWheel}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    />
  )
}
