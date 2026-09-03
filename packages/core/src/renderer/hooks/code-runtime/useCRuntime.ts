/**
 * ============================================================================
 * @file useCRuntime.ts
 * @description useCRuntime.ts 시스템 모듈 구성요소로, C / C++ 코드 실행 및 출력을 담당합니다.
 * @system AMEVA OS Desktop Workstation / Web
 * ============================================================================
 */

import { useState } from 'react'
import { RuntimeState } from './runtimeState'

function getOrCreateCWorker(): Worker {
  if (RuntimeState.cWorker) return RuntimeState.cWorker

  const worker = new Worker(new URL('./workers/cWorker.ts', import.meta.url), {
    type: 'module',
  })
  RuntimeState.cWorker = worker
  return worker
}

export function useCRuntime() {
  const [isCRunning, setIsCRunning] = useState(false)

  const runCCode = async (code: string): Promise<{ success: boolean; output: string }> => {
    setIsCRunning(true)

    try {
      if (typeof window !== 'undefined' && (window as any).electronAPI?.runCCode) {
        try {
          const res = await (window as any).electronAPI.runCCode(code)
          setIsCRunning(false)
          return {
            success: res.success ?? true,
            output: res.output || res.result || res.error || '(실행 완료)'
          }
        } catch (ipcErr) {
          console.warn('[C Runtime] Electron IPC fallback to web worker:', ipcErr)
        }
      }

      const worker = getOrCreateCWorker()

      return await new Promise<{ success: boolean; output: string }>((resolve) => {
        const timeoutTimer = setTimeout(() => {
          setIsCRunning(false)
          resolve({
            success: false,
            output: '[C Timeout] 실행 시간이 10초를 초과하여 강제 중단되었습니다.'
          })
        }, 10000)

        const handleMessage = (e: MessageEvent) => {
          clearTimeout(timeoutTimer)
          worker.removeEventListener('message', handleMessage)
          setIsCRunning(false)
          resolve({
            success: e.data.success,
            output: e.data.output
          })
        }

        worker.addEventListener('message', handleMessage)
        worker.postMessage(code)
      })
    } catch (err: any) {
      setIsCRunning(false)
      return {
        success: false,
        output: '[C Execution Failed] ' + (err.message || String(err))
      }
    }
  }

  return {
    isCRunning,
    runCCode,
  }
}
