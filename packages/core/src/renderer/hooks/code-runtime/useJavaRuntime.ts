/**
 * ============================================================================
 * @file useJavaRuntime.ts
 * @description useJavaRuntime.ts 시스템 모듈 구성요소로, Java 코드블록 실행 및 출력을 담당합니다.
 * @usage 문서 에디터 및 Jupyter 코드블록 내부에서 Java 코드 실행 시 사용됩니다.
 * @example
 * import { useJavaRuntime } from './useJavaRuntime';
 * const { isJavaRunning, runJavaCode } = useJavaRuntime();
 * 
 * @created 2026-09-02
 * @author uno-km
 * ============================================================================
 */

import { useState } from 'react'
import { RuntimeState } from './runtimeState'

function getOrCreateJavaWorker(): Worker {
  if (RuntimeState.javaWorker) return RuntimeState.javaWorker

  // Vite 모던 번들러 표준: 독립 Worker 모듈을 번들 청크로 안전하게 로드
  const worker = new Worker(new URL('./workers/javaWorker.ts', import.meta.url), {
    type: 'module',
  })
  RuntimeState.javaWorker = worker
  return worker
}

export function useJavaRuntime() {
  const [isJavaRunning, setIsJavaRunning] = useState(false)

  const wrapJavaCodeIfNeeded = (code: string): string => {
    const trimmed = code.trim()
    // 이미 전체 클래스 구조를 갖춘 경우
    if (trimmed.includes('class ') && (trimmed.includes('main(') || trimmed.includes('main ('))) {
      return trimmed
    }

    // 클래스는 있으나 main이 없는 경우 또는 스니펫인 경우
    if (trimmed.includes('class ') && !trimmed.includes('main')) {
      return trimmed
    }

    // JShell/단일 실행 구문 스니펫 자동 래핑
    return `
import java.util.*;
import java.io.*;
import java.math.*;
import java.time.*;

public class Main {
    public static void main(String[] args) throws Exception {
${trimmed}
    }
}
`
  }

  const runJavaCode = async (code: string): Promise<{ success: boolean; output: string }> => {
    setIsJavaRunning(true)
    const processedCode = wrapJavaCodeIfNeeded(code)

    try {
      // 1. Desktop Electron IPC Native OpenJDK 가용 여부 확인
      if (typeof window !== 'undefined' && (window as any).electronAPI?.runJavaCode) {
        try {
          const res = await (window as any).electronAPI.runJavaCode(processedCode)
          setIsJavaRunning(false)
          return {
            success: res.success ?? true,
            output: res.output || res.result || res.error || '(실행 완료)'
          }
        } catch (ipcErr: any) {
          console.warn('[Java Runtime] Electron IPC fallback to web worker:', ipcErr)
        }
      }

      // 2. 브라우저 클라이언트 Web Worker Java 가상 샌드박스 실행
      const worker = getOrCreateJavaWorker()

      return await new Promise<{ success: boolean; output: string }>((resolve) => {
        const timeoutTimer = setTimeout(() => {
          setIsJavaRunning(false)
          resolve({
            success: false,
            output: '[Java Timeout] 실행 시간이 10초를 초과하여 강제 중단되었습니다.'
          })
        }, 10000)

        const handleMessage = (e: MessageEvent) => {
          clearTimeout(timeoutTimer)
          worker.removeEventListener('message', handleMessage)
          setIsJavaRunning(false)
          resolve({
            success: e.data.success,
            output: e.data.output
          })
        }

        worker.addEventListener('message', handleMessage)
        worker.postMessage(processedCode)
      })
    } catch (err: any) {
      setIsJavaRunning(false)
      return {
        success: false,
        output: '[Java Execution Failed] ' + (err.message || String(err))
      }
    }
  }

  return {
    isJavaRunning,
    runJavaCode,
  }
}
