/**
 * ============================================================================
 * @file useRustRuntime.ts
 * @description useRustRuntime.ts 시스템 모듈 구성요소로, Rust 코드 실행 및 출력을 담당합니다.
 * @system AMEVA OS Desktop Workstation / Web
 * ============================================================================
 */

import { useState } from 'react'
import { RuntimeState } from './runtimeState'

function getOrCreateRustWorker(): Worker {
  if (RuntimeState.rustWorker) return RuntimeState.rustWorker

  const worker = new Worker(new URL('./workers/rustWorker.ts', import.meta.url), {
    type: 'module',
  })
  RuntimeState.rustWorker = worker
  return worker
}

export function useRustRuntime() {
  const [isRustRunning, setIsRustRunning] = useState(false)

  const runRustCode = async (code: string): Promise<{ success: boolean; output: string }> => {
    setIsRustRunning(true)

    try {
      if (typeof window !== 'undefined' && (window as any).electronAPI?.runRustCode) {
        try {
          const res = await (window as any).electronAPI.runRustCode(code)
          setIsRustRunning(false)
          return {
            success: res.success ?? true,
            output: res.output || res.result || res.error || '(실행 완료)'
          }
        } catch (ipcErr) {
          console.warn('[Rust Runtime] Electron IPC fallback to web worker:', ipcErr)
        }
      }

      const worker = getOrCreateRustWorker()

      return await new Promise<{ success: boolean; output: string }>((resolve) => {
        const timeoutTimer = setTimeout(() => {
          setIsRustRunning(false)
          resolve({
            success: false,
            output: '[Rust Timeout] 실행 시간이 10초를 초과하여 강제 중단되었습니다.'
          })
        }, 10000)

        const handleMessage = (e: MessageEvent) => {
          clearTimeout(timeoutTimer)
          worker.removeEventListener('message', handleMessage)
          setIsRustRunning(false)
          resolve({
            success: e.data.success,
            output: e.data.output
          })
        }

        worker.addEventListener('message', handleMessage)
        worker.postMessage(code)
      })
    } catch (err: any) {
      setIsRustRunning(false)
      return {
        success: false,
        output: '[Rust Execution Failed] ' + (err.message || String(err))
      }
    }
  }

  return {
    isRustRunning,
    runRustCode,
  }
}
