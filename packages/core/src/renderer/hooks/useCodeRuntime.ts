/**
 * ============================================================================
 * @file useCodeRuntime.ts
 * @description useCodeRuntime.ts 시스템 모듈 구성요소로, 20+ 멀티 랭귀지 코드 실행 디스패처를 제공합니다.
 * @system AMEVA OS Desktop Workstation / Web
 * ============================================================================
 */

import { cleanupCodeRuntime } from './code-runtime/runtimeState'
import { useJSRuntime } from './code-runtime/useJSRuntime'
import { usePythonRuntime } from './code-runtime/usePythonRuntime'
import { useSQLRuntime } from './code-runtime/useSQLRuntime'
import { useJavaRuntime } from './code-runtime/useJavaRuntime'
import { useBashRuntime } from './code-runtime/useBashRuntime'
import { useLuaRuntime } from './code-runtime/useLuaRuntime'
import { useSolidityRuntime } from './code-runtime/useSolidityRuntime'
import { useCRuntime } from './code-runtime/useCRuntime'
import { useGoRuntime } from './code-runtime/useGoRuntime'
import { useRustRuntime } from './code-runtime/useRustRuntime'
import { usePolyglotRuntime } from './code-runtime/usePolyglotRuntime'

export { cleanupCodeRuntime }

export function useCodeRuntime() {
  const { isJSRunning, runJSCode } = useJSRuntime()
  const { isPythonRunning, runPythonCode } = usePythonRuntime()
  const { isSQLRunning, runSQLCode } = useSQLRuntime()
  const { isJavaRunning, runJavaCode } = useJavaRuntime()
  const { isBashRunning, runBashCode } = useBashRuntime()
  const { isLuaRunning, runLuaCode } = useLuaRuntime()
  const { isSolidityRunning, runSolidityCode } = useSolidityRuntime()
  const { isCRunning, runCCode } = useCRuntime()
  const { isGoRunning, runGoCode } = useGoRuntime()
  const { isRustRunning, runRustCode } = useRustRuntime()
  const { isPolyglotRunning, runPolyglotCode } = usePolyglotRuntime()

  const isRunning =
    isJSRunning ||
    isPythonRunning ||
    isSQLRunning ||
    isJavaRunning ||
    isBashRunning ||
    isLuaRunning ||
    isSolidityRunning ||
    isCRunning ||
    isGoRunning ||
    isRustRunning ||
    isPolyglotRunning

  // 언어 코드에 따른 지능적 자동 실행 라우터
  const executeCode = async (
    language: string,
    code: string
  ): Promise<{ success: boolean; output?: string; result?: string; tableData?: any }> => {
    const lang = language.toLowerCase()

    switch (lang) {
      case 'javascript':
      case 'js':
      case 'typescript':
      case 'ts':
        return await runJSCode(code)

      case 'python':
      case 'py':
        return await runPythonCode(code)

      case 'sql':
        return await runSQLCode(code)

      case 'java':
        return await runJavaCode(code)

      case 'bash':
      case 'sh':
      case 'shell':
        return await runBashCode(code)

      case 'lua':
        return await runLuaCode(code)

      case 'solidity':
      case 'sol':
        return await runSolidityCode(code)

      case 'c':
      case 'cpp':
      case 'c++':
        return await runCCode(code)

      case 'go':
        return await runGoCode(code)

      case 'rust':
      case 'rs':
        return await runRustCode(code)

      case 'csharp':
      case 'cs':
      case 'swift':
      case 'kotlin':
      case 'kt':
      case 'zig':
      case 'ruby':
      case 'rb':
      case 'php':
      case 'r':
        return await runPolyglotCode(lang, code)

      default:
        // 일반 텍스트나 미등록 언어는 JS / 가상 샌드박스로 실행 시도
        return await runJSCode(code)
    }
  }

  return {
    isRunning,
    executeCode,
    runJSCode,
    runPythonCode,
    runSQLCode,
    runJavaCode,
    runBashCode,
    runLuaCode,
    runSolidityCode,
    runCCode,
    runGoCode,
    runRustCode,
    runPolyglotCode,
  }
}
