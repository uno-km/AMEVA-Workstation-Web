/**
 * ============================================================================
 * @file KnowledgeGraphViewer.tsx
 * @description KnowledgeGraphViewer.tsx 시스템 모듈 구성요소로, 관련 UI 렌더링 및 비즈니스 로직을 담당합니다.
 * @usage 문서 에디터 및 뷰어 내부에서 동적으로 호출되거나 유틸리티 함수로 사용됩니다.
 * @example
 * // 예시 로직 (자동 생성됨)
 * import { something } from './KnowledgeGraphViewer';
 * 
 * @created 2026-08-11 08:57:45
 * @updated 2026-08-11 08:57:45
 * @author uno-km
 * @commit docs: 전체 소스코드 한글 주석 및 사내 컨벤션 일괄 적용
 * ============================================================================
 */

import React, { useEffect, useRef, useState, useCallback } from 'react'
import { graphStore } from './graphStore'
import type { GraphState, GraphNode } from './types'

export const KnowledgeGraphViewer: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const workerRef = useRef<Worker | null>(null)
  const [state, setState] = useState<GraphState>(graphStore.getState())

  useEffect(() => {
    if ('gpu' in navigator) {
      graphStore.setGpuAccelerated(!!navigator.gpu)
    }

    // Worker setup
    workerRef.current = new Worker(new URL('./graphWorker.ts', import.meta.url), { type: 'module' })
    
    workerRef.current.onmessage = (e) => {
      if (e.data.type === 'TICK_DONE') {
        graphStore.setState({ nodes: e.data.nodes })
        if (graphStore.getState().simulation === 'running') {
          requestAnimationFrame(tick)
        }
      }
    }

    const unsubscribe = graphStore.subscribe(setState)
    return () => {
      unsubscribe()
      workerRef.current?.terminate()
    }
  }, [])

  const tick = useCallback(() => {
    if (workerRef.current && graphStore.getState().simulation === 'running') {
      const currentState = graphStore.getState()
      workerRef.current.postMessage({
        type: 'TICK',
        nodes: currentState.nodes,
        edges: currentState.edges
      })
    }
  }, [])

  useEffect(() => {
    if (state.simulation === 'running') {
      tick()
    }
  }, [state.simulation, tick])

  // Canvas render loop
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      
      // Draw edges
      ctx.strokeStyle = '#555'
      state.edges.forEach(edge => {
        const source = state.nodes.find(n => n.id === edge.source)
        const target = state.nodes.find(n => n.id === edge.target)
        if (source && target) {
          ctx.beginPath()
          ctx.moveTo(source.x, source.y)
          ctx.lineTo(target.x, target.y)
          ctx.stroke()
        }
      })

      // Draw nodes
      state.nodes.forEach(node => {
        ctx.fillStyle = node.color
        ctx.beginPath()
        ctx.arc(node.x, node.y, node.size, 0, Math.PI * 2)
        ctx.fill()
      })

      requestAnimationFrame(render)
    }
    
    render()
  }, [state.nodes, state.edges])

  const toggleSimulation = () => {
    const newState = state.simulation === 'running' ? 'paused' : 'running'
    graphStore.setSimulationState(newState)
  }

  const addTestNode = () => {
    graphStore.addNode({
      id: `node-${Date.now()}`,
      label: 'Test',
      x: 150 + Math.random() * 50,
      y: 150 + Math.random() * 50,
      vx: 0,
      vy: 0,
      size: 10,
      color: '#3b82f6'
    })
  }

  return (
    <div style={{ padding: '16px', background: '#1e1e1e', color: 'white', borderRadius: '8px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
        <h3>Knowledge Graph ({state.nodes.length} nodes)</h3>
        <div>
          {state.gpuAccelerated ? (
            <span style={{ color: '#10b981', fontWeight: 'bold' }}>🟢 GPU Accelerated</span>
          ) : (
            <span style={{ color: '#ef4444', fontWeight: 'bold' }}>🔴 CPU</span>
          )}
        </div>
      </div>
      
      <canvas 
        ref={canvasRef} 
        width={400} 
        height={300} 
        style={{ border: '1px solid #333', background: '#000', borderRadius: '4px' }} 
      />
      
      <div style={{ marginTop: '12px', display: 'flex', gap: '8px' }}>
        <button 
          onClick={toggleSimulation}
          style={{ padding: '8px 16px', background: '#8b5cf6', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
        >
          {state.simulation === 'running' ? 'Pause' : 'Start'} Simulation
        </button>
        <button 
          onClick={addTestNode}
          style={{ padding: '8px 16px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
        >
          Add Node
        </button>
      </div>
    </div>
  )
}
