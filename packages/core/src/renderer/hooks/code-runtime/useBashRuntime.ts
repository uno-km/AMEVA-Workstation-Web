/**
 * ============================================================================
 * @file useBashRuntime.ts
 * @description useBashRuntime.ts 시스템 모듈 구성요소로, Bash / Shell 스크립트 실행 및 출력을 담당합니다.
 * @system AMEVA OS Desktop Workstation / Web
 * ============================================================================
 */

import { useState } from 'react'
import { RuntimeState } from './runtimeState'

function getOrCreateBashWorker(): Worker {
  if (RuntimeState.bashWorker) return RuntimeState.bashWorker

  const worker = new Worker(new URL('./workers/bashWorker.ts', import.meta.url), {
    type: 'module',
  })
  RuntimeState.bashWorker = worker
  return worker
}

export function useBashRuntime() {
  const [isBashRunning, setIsBashRunning] = useState(false)

  const runBashCode = async (code: string): Promise<{ success: boolean; output: string }> => {
    setIsBashRunning(true)

    try {
      // 1. Desktop Electron IPC Native Shell 가용 여부 확인
      if (typeof window !== 'undefined' && (window as any).electronAPI?.runBashCode) {
        try {
          const res = await (window as any).electronAPI.runBashCode(code)
          setIsBashRunning(false)
          return {
            success: res.success ?? true,
            output: res.output || res.result || res.error || '(실행 완료)'
          }
        } catch (ipcErr) {
          console.warn('[Bash Runtime] Electron IPC fallback to web worker:', ipcErr)
        }
      }

      // 2. 브라우저 클라이언트 Web Worker 가상 POSIX Shell 실행
      const worker = getOrCreateBashWorker()

      return await new Promise<{ success: boolean; output: string }>((resolve) => {
        const timeoutTimer = setTimeout(() => {
          setIsBashRunning(false)
          resolve({
            success: false,
            output: '[Bash Timeout] 실행 시간이 10초를 초과하여 강제 중단되었습니다.'
          })
        }, 10000)

        const handleMessage = (e: MessageEvent) => {
          clearTimeout(timeoutTimer)
          worker.removeEventListener('message', handleMessage)
          setIsBashRunning(false)
          resolve({
            success: e.data.success,
            output: e.data.output
          })
        }

        worker.addEventListener('message', handleMessage)
        worker.postMessage(code)
      })
    } catch (err: any) {
      setIsBashRunning(false)
      return {
        success: false,
        output: '[Bash Execution Failed] ' + (err.message || String(err))
      }
    }
  }

  return {
    isBashRunning,
    runBashCode,
  }
}
