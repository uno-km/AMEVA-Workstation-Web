/**
 * ============================================================================
 * @file useLuaRuntime.ts
 * @description useLuaRuntime.ts 시스템 모듈 구성요소로, Lua 스크립트 실행 및 출력을 담당합니다.
 * @system AMEVA OS Desktop Workstation / Web
 * ============================================================================
 */

import { useState } from 'react'
import { RuntimeState } from './runtimeState'

function getOrCreateLuaWorker(): Worker {
  if (RuntimeState.luaWorker) return RuntimeState.luaWorker

  const worker = new Worker(new URL('./workers/luaWorker.ts', import.meta.url), {
    type: 'module',
  })
  RuntimeState.luaWorker = worker
  return worker
}

export function useLuaRuntime() {
  const [isLuaRunning, setIsLuaRunning] = useState(false)

  const runLuaCode = async (code: string): Promise<{ success: boolean; output: string }> => {
    setIsLuaRunning(true)

    try {
      if (typeof window !== 'undefined' && (window as any).electronAPI?.runLuaCode) {
        try {
          const res = await (window as any).electronAPI.runLuaCode(code)
          setIsLuaRunning(false)
          return {
            success: res.success ?? true,
            output: res.output || res.result || res.error || '(실행 완료)'
          }
        } catch (ipcErr) {
          console.warn('[Lua Runtime] Electron IPC fallback to web worker:', ipcErr)
        }
      }

      const worker = getOrCreateLuaWorker()

      return await new Promise<{ success: boolean; output: string }>((resolve) => {
        const timeoutTimer = setTimeout(() => {
          setIsLuaRunning(false)
          resolve({
            success: false,
            output: '[Lua Timeout] 실행 시간이 10초를 초과하여 강제 중단되었습니다.'
          })
        }, 10000)

        const handleMessage = (e: MessageEvent) => {
          clearTimeout(timeoutTimer)
          worker.removeEventListener('message', handleMessage)
          setIsLuaRunning(false)
          resolve({
            success: e.data.success,
            output: e.data.output
          })
        }

        worker.addEventListener('message', handleMessage)
        worker.postMessage(code)
      })
    } catch (err: any) {
      setIsLuaRunning(false)
      return {
        success: false,
        output: '[Lua Execution Failed] ' + (err.message || String(err))
      }
    }
  }

  return {
    isLuaRunning,
    runLuaCode,
  }
}
