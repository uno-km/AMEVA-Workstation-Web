/**
 * ============================================================================
 * @file MiniColabBlock.tsx
 * @description 미니 콜랩 블록 (다크테마, JupyterBlock 스타일)
 * // Force Vite HMR reload
 * ============================================================================
 */
import React, { useState, useEffect, useRef } from 'react'
import { createReactBlockSpec } from '@blocknote/react'

export const MiniColabBlock = createReactBlockSpec(
  {
    type: 'mini-colab',
    propSchema: {
      cells: { default: '[]' },
      title: { default: '미니 콜랩' },
      gpuEnabled: { default: 'false' }
    },
    content: 'none'
  },
  {
    render: (props) => {
      const workerRef = useRef<Worker | null>(null)
      const [outputs, setOutputs] = useState<Record<string, string>>({})
      const [loading, setLoading] = useState(false)

      const title = props.block.props.title
      const gpuEnabled = props.block.props.gpuEnabled === 'true'
      const cells = (() => {
        try { return JSON.parse(props.block.props.cells) } catch { return [] }
      })()

      useEffect(() => {
        workerRef.current = new Worker(new URL('./colabWorker.ts', import.meta.url), { type: 'module' })
        
        workerRef.current.onmessage = (e) => {
          if (e.data.type === 'LOADING') {
            setLoading(true)
          } else if (e.data.type === 'EXEC_RESULT' || e.data.type === 'EXEC_ERROR') {
            setLoading(false)
            setOutputs(prev => ({
              ...prev,
              [e.data.cellId]: e.data.type === 'EXEC_RESULT' ? e.data.output : e.data.error
            }))
          }
        }
        return () => workerRef.current?.terminate()
      }, [])

      const updateCells = (newCells: any[]) => {
        props.editor.updateBlock(props.block, {
          type: 'mini-colab',
          props: { ...props.block.props, cells: JSON.stringify(newCells) }
        })
      }

      const addCell = (lang: string) => {
        const newCells = [...cells, { id: `cell-${Date.now()}`, lang, code: '' }]
        updateCells(newCells)
      }

      const removeCell = (id: string) => {
        updateCells(cells.filter((c: any) => c.id !== id))
      }

      const runCell = (cell: any) => {
        if (!workerRef.current) return
        const typeMap: Record<string, string> = {
          'python': 'EXEC_PYTHON',
          'javascript': 'EXEC_JS',
          'sql': 'EXEC_SQL'
        }
        workerRef.current.postMessage({
          type: typeMap[cell.lang],
          code: cell.code,
          cellId: cell.id
        })
        const tempHandler = (e: MessageEvent) => {
          if (e.data.cellId === undefined) {
             e.data.cellId = cell.id
          }
        }
        workerRef.current.addEventListener('message', tempHandler, { once: true })
      }

      const runAll = () => {
        cells.forEach(runCell)
      }

      const updateCode = (id: string, code: string) => {
        const newCells = cells.map((c: any) => c.id === id ? { ...c, code } : c)
        updateCells(newCells)
      }

      const toggleGpu = () => {
        props.editor.updateBlock(props.block, {
          type: 'mini-colab',
          props: { ...props.block.props, gpuEnabled: gpuEnabled ? 'false' : 'true' }
        })
      }

      return (
        <div style={{ background: '#18181c', padding: '16px', borderRadius: '8px', border: '1px solid #333', color: '#fff', fontFamily: 'monospace' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ margin: 0, fontSize: '16px' }}>{title}</h3>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={toggleGpu} style={{ background: gpuEnabled ? '#10b981' : '#4b5563', color: '#fff', border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer' }}>
                {gpuEnabled ? 'GPU On' : 'GPU Off'}
              </button>
              <button onClick={() => addCell('python')} style={{ background: '#3b82f6', color: '#fff', border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer' }}>+ Python</button>
              <button onClick={() => addCell('javascript')} style={{ background: '#f59e0b', color: '#fff', border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer' }}>+ JavaScript</button>
              <button onClick={() => addCell('sql')} style={{ background: '#8b5cf6', color: '#fff', border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer' }}>+ SQL</button>
            </div>
          </div>

          {loading && <div style={{ color: '#aaa', marginBottom: '8px' }}>Pyodide 로딩 중...</div>}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {cells.map((cell: any, i: number) => (
              <div key={cell.id} style={{ background: '#000', border: '1px solid #444', borderRadius: '6px', overflow: 'hidden' }}>
                <div style={{ background: '#222', padding: '4px 8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px' }}>
                  <span style={{ color: '#aaa' }}>[{i + 1}] {cell.lang}</span>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <button onClick={() => runCell(cell)} style={{ background: '#10b981', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', padding: '2px 8px' }}>실행</button>
                    <button onClick={() => removeCell(cell.id)} style={{ background: '#ef4444', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', padding: '2px 8px' }}>삭제</button>
                  </div>
                </div>
                <textarea 
                  value={cell.code}
                  onChange={(e) => updateCode(cell.id, e.target.value)}
                  style={{ width: '100%', minHeight: '60px', background: 'transparent', color: '#fff', border: 'none', padding: '8px', resize: 'vertical', outline: 'none' }}
                  placeholder="코드를 입력하세요..."
                />
                {outputs[cell.id] && (
                  <div style={{ background: '#111', padding: '8px', borderTop: '1px solid #333', whiteSpace: 'pre-wrap' }}>
                    {outputs[cell.id]}
                  </div>
                )}
              </div>
            ))}
          </div>

          {cells.length > 0 && (
            <div style={{ marginTop: '16px', textAlign: 'center' }}>
              <button onClick={runAll} style={{ background: '#3b82f6', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer' }}>
                ⬆️ 모두 실행
              </button>
            </div>
          )}
        </div>
      )
    }
  }
)
