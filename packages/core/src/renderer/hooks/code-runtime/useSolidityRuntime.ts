/**
 * ============================================================================
 * @file useSolidityRuntime.ts
 * @description useSolidityRuntime.ts 시스템 모듈 구성요소로, Solidity 스마트 컨트랙트 컴파일 및 EVM 실행을 담당합니다.
 * @system AMEVA OS Desktop Workstation / Web
 * ============================================================================
 */

import { useState } from 'react'
import { RuntimeState } from './runtimeState'

function getOrCreateSolidityWorker(): Worker {
  if (RuntimeState.solidityWorker) return RuntimeState.solidityWorker

  const worker = new Worker(new URL('./workers/solidityWorker.ts', import.meta.url), {
    type: 'module',
  })
  RuntimeState.solidityWorker = worker
  return worker
}

export function useSolidityRuntime() {
  const [isSolidityRunning, setIsSolidityRunning] = useState(false)

  const runSolidityCode = async (code: string): Promise<{ success: boolean; output: string }> => {
    setIsSolidityRunning(true)

    try {
      if (typeof window !== 'undefined' && (window as any).electronAPI?.runSolidityCode) {
        try {
          const res = await (window as any).electronAPI.runSolidityCode(code)
          setIsSolidityRunning(false)
          return {
            success: res.success ?? true,
            output: res.output || res.result || res.error || '(실행 완료)'
          }
        } catch (ipcErr) {
          console.warn('[Solidity Runtime] Electron IPC fallback to web worker:', ipcErr)
        }
      }

      const worker = getOrCreateSolidityWorker()

      return await new Promise<{ success: boolean; output: string }>((resolve) => {
        const timeoutTimer = setTimeout(() => {
          setIsSolidityRunning(false)
          resolve({
            success: false,
            output: '[Solidity Timeout] 컴파일/실행 시간이 10초를 초과하여 강제 중단되었습니다.'
          })
        }, 10000)

        const handleMessage = (e: MessageEvent) => {
          clearTimeout(timeoutTimer)
          worker.removeEventListener('message', handleMessage)
          setIsSolidityRunning(false)
          resolve({
            success: e.data.success,
            output: e.data.output
          })
        }

        worker.addEventListener('message', handleMessage)
        worker.postMessage(code)
      })
    } catch (err: any) {
      setIsSolidityRunning(false)
      return {
        success: false,
        output: '[Solidity Execution Failed] ' + (err.message || String(err))
      }
    }
  }

  return {
    isSolidityRunning,
    runSolidityCode,
  }
}
