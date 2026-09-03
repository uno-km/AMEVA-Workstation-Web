/**
 * ============================================================================
 * @file useGoRuntime.ts
 * @description useGoRuntime.ts 시스템 모듈 구성요소로, Go 코드 실행 및 출력을 담당합니다.
 * @system AMEVA OS Desktop Workstation / Web
 * ============================================================================
 */

import { useState } from 'react'
import { RuntimeState } from './runtimeState'

function getOrCreateGoWorker(): Worker {
  if (RuntimeState.goWorker) return RuntimeState.goWorker

  const worker = new Worker(new URL('./workers/goWorker.ts', import.meta.url), {
    type: 'module',
  })
  RuntimeState.goWorker = worker
  return worker
}

export function useGoRuntime() {
  const [isGoRunning, setIsGoRunning] = useState(false)

  const runGoCode = async (code: string): Promise<{ success: boolean; output: string }> => {
    setIsGoRunning(true)

    try {
      if (typeof window !== 'undefined' && (window as any).electronAPI?.runGoCode) {
        try {
          const res = await (window as any).electronAPI.runGoCode(code)
          setIsGoRunning(false)
          return {
            success: res.success ?? true,
            output: res.output || res.result || res.error || '(실행 완료)'
          }
        } catch (ipcErr) {
          console.warn('[Go Runtime] Electron IPC fallback to web worker:', ipcErr)
        }
      }

      const worker = getOrCreateGoWorker()

      return await new Promise<{ success: boolean; output: string }>((resolve) => {
        const timeoutTimer = setTimeout(() => {
          setIsGoRunning(false)
          resolve({
            success: false,
            output: '[Go Timeout] 실행 시간이 10초를 초과하여 강제 중단되었습니다.'
          })
        }, 10000)

        const handleMessage = (e: MessageEvent) => {
          clearTimeout(timeoutTimer)
          worker.removeEventListener('message', handleMessage)
          setIsGoRunning(false)
          resolve({
            success: e.data.success,
            output: e.data.output
          })
        }

        worker.addEventListener('message', handleMessage)
        worker.postMessage(code)
      })
    } catch (err: any) {
      setIsGoRunning(false)
      return {
        success: false,
        output: '[Go Execution Failed] ' + (err.message || String(err))
      }
    }
  }

  return {
    isGoRunning,
    runGoCode,
  }
}
