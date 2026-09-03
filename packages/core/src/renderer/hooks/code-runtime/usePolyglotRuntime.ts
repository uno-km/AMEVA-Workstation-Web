/**
 * ============================================================================
 * @file usePolyglotRuntime.ts
 * @description usePolyglotRuntime.ts 시스템 모듈 구성요소로, C#, Swift, Kotlin, Zig, Ruby, PHP, R 언어의 코드 실행을 담당합니다.
 * @system AMEVA OS Desktop Workstation / Web
 * ============================================================================
 */

import { useState } from 'react'
import { RuntimeState } from './runtimeState'

function getOrCreatePolyglotWorker(): Worker {
  if (RuntimeState.polyglotWorker) return RuntimeState.polyglotWorker

  const worker = new Worker(new URL('./workers/polyglotWorker.ts', import.meta.url), {
    type: 'module',
  })
  RuntimeState.polyglotWorker = worker
  return worker
}

export function usePolyglotRuntime() {
  const [isPolyglotRunning, setIsPolyglotRunning] = useState(false)

  const runPolyglotCode = async (
    language: string,
    code: string
  ): Promise<{ success: boolean; output: string }> => {
    setIsPolyglotRunning(true)

    try {
      if (typeof window !== 'undefined' && (window as any).electronAPI?.runPolyglotCode) {
        try {
          const res = await (window as any).electronAPI.runPolyglotCode(language, code)
          setIsPolyglotRunning(false)
          return {
            success: res.success ?? true,
            output: res.output || res.result || res.error || '(실행 완료)'
          }
        } catch (ipcErr) {
          console.warn(`[${language} Runtime] Electron IPC fallback to web worker:`, ipcErr)
        }
      }

      const worker = getOrCreatePolyglotWorker()

      return await new Promise<{ success: boolean; output: string }>((resolve) => {
        const timeoutTimer = setTimeout(() => {
          setIsPolyglotRunning(false)
          resolve({
            success: false,
            output: `[${language.toUpperCase()} Timeout] 실행 시간이 10초를 초과하여 강제 중단되었습니다.`
          })
        }, 10000)

        const handleMessage = (e: MessageEvent) => {
          clearTimeout(timeoutTimer)
          worker.removeEventListener('message', handleMessage)
          setIsPolyglotRunning(false)
          resolve({
            success: e.data.success,
            output: e.data.output
          })
        }

        worker.addEventListener('message', handleMessage)
        worker.postMessage({ language, code })
      })
    } catch (err: any) {
      setIsPolyglotRunning(false)
      return {
        success: false,
        output: `[${language.toUpperCase()} Execution Failed] ` + (err.message || String(err))
      }
    }
  }

  return {
    isPolyglotRunning,
    runPolyglotCode,
  }
}
