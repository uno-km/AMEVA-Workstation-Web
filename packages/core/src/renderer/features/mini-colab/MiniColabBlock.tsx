/**
 * ============================================================================
 * @file MiniColabBlock.tsx
 * @description MiniColabBlock.tsx 시스템 모듈 구성요소로, 관련 UI 렌더링 및 비즈니스 로직을 담당합니다.
 * @usage 문서 에디터 및 뷰어 내부에서 동적으로 호출되거나 유틸리티 함수로 사용됩니다.
 * @example
 * // 예시 로직 (자동 생성됨)
 * import { something } from './MiniColabBlock';
 * 
 * @created 2026-08-11 08:57:45
 * @updated 2026-08-11 08:57:45
 * @author uno-km
 * @commit docs: 전체 소스코드 한글 주석 및 사내 컨벤션 일괄 적용
 * ============================================================================
 */

import React, { useEffect, useRef, useState } from 'react'
import { colabStore } from './colabStore'
import type { ColabState, ColabCellType } from './types'

export const MiniColabBlock: React.FC = () => {
  const workerRef = useRef<Worker | null>(null)
  const [state, setState] = useState<ColabState>(colabStore.getState())

  useEffect(() => {
    if ('gpu' in navigator) {
      colabStore.setGpuEnabled(!!navigator.gpu)
    }

    workerRef.current = new Worker(new URL('./colabWorker.ts', import.meta.url), { type: 'module' })
    colabStore.setKernelReady(true)

    workerRef.current.onmessage = (e) => {
      if (e.data.type === 'EXEC_RESULT') {
        colabStore.updateCellOutput(e.data.id, e.data.output, e.data.status)
      }
    }

    const unsubscribe = colabStore.subscribe(setState)
    return () => {
      unsubscribe()
      workerRef.current?.terminate()
    }
  }, [])

  const addCell = (type: ColabCellType = 'python') => {
    colabStore.addCell({
      id: `cell-${Date.now()}`,
      type,
      code: '',
      output: '',
      status: 'idle',
      executionCount: 0
    })
  }

  const runCell = (id: string, type: ColabCellType, code: string) => {
    colabStore.updateCell(id, { status: 'running' })
    if (type === 'python') {
      workerRef.current?.postMessage({ type: 'EXEC_PYTHON', id, code })
    } else if (type === 'sql') {
      workerRef.current?.postMessage({ type: 'EXEC_SQL', id, sql: code })
    } else {
      colabStore.updateCellOutput(id, code, 'success') // markdown just returns code
    }
  }

  return (
    <div style={{ padding: '16px', background: '#1e1e1e', color: 'white', borderRadius: '8px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', borderBottom: '1px solid #333', paddingBottom: '8px' }}>
        <h3>Mini Colab</h3>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <span style={{ fontSize: '12px', color: '#888' }}>Total Execs: {state.totalExecutions}</span>
          {state.kernelReady && <span style={{ color: '#3b82f6', fontSize: '12px' }}>Kernel Ready</span>}
          {state.gpuEnabled ? (
            <span style={{ color: '#10b981', fontWeight: 'bold', fontSize: '12px' }}>🟢 GPU</span>
          ) : (
            <span style={{ color: '#ef4444', fontWeight: 'bold', fontSize: '12px' }}>🔴 CPU</span>
          )}
        </div>
      </div>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {state.cells.map(cell => (
          <div key={cell.id} style={{ border: '1px solid #333', borderRadius: '4px', overflow: 'hidden' }}>
            <div style={{ background: '#2a2a2a', padding: '8px', display: 'flex', justifyContent: 'space-between' }}>
              <select 
                value={cell.type} 
                onChange={(e) => colabStore.updateCell(cell.id, { type: e.target.value as ColabCellType })}
                style={{ background: '#1e1e1e', color: 'white', border: '1px solid #444', borderRadius: '4px' }}
              >
                <option value="python">Python</option>
                <option value="sql">SQL</option>
                <option value="markdown">Markdown</option>
              </select>
              <div>
                <button onClick={() => runCell(cell.id, cell.type, cell.code)} disabled={cell.status === 'running'} style={{ marginRight: '4px', cursor: 'pointer' }}>
                  {cell.status === 'running' ? 'Running...' : 'Run'}
                </button>
                <button onClick={() => colabStore.removeCell(cell.id)} style={{ cursor: 'pointer' }}>Delete</button>
              </div>
            </div>
            <textarea 
              value={cell.code}
              onChange={(e) => colabStore.updateCell(cell.id, { code: e.target.value })}
              style={{ width: '100%', minHeight: '60px', background: '#000', color: '#fff', border: 'none', padding: '8px', fontFamily: 'monospace', resize: 'vertical' }}
              placeholder={`Enter ${cell.type} code...`}
            />
            {cell.output && (
              <div style={{ background: '#111', padding: '8px', borderTop: '1px solid #333', fontFamily: 'monospace', color: cell.status === 'error' ? '#ef4444' : '#e5e5e5' }}>
                <div style={{ fontSize: '10px', color: '#666', marginBottom: '4px' }}>[{cell.executionCount}]</div>
                {cell.output}
              </div>
            )}
          </div>
        ))}
      </div>
      
      <div style={{ marginTop: '16px', display: 'flex', gap: '8px' }}>
        <button onClick={() => addCell('python')} style={{ padding: '8px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>+ Python Cell</button>
        <button onClick={() => addCell('markdown')} style={{ padding: '8px', background: '#8b5cf6', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>+ Markdown Cell</button>
      </div>
    </div>
  )
}
